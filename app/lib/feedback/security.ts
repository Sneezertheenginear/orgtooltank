// Anonymous session cookie, hashed network address, same-site checks, rate limiting, and logging
// for the feedback API. No fingerprinting: the only identifiers are a random cookie and a keyed
// hash of the network address, and raw addresses are never stored.
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { LIMITS, MAX_BODY_BYTES, RATE_LIMITED_MESSAGE, SESSION_COOKIE, SESSION_MAX_AGE } from "./config";
import { storeProblem, type BlockEntry, type FeedbackStore } from "./store";

const DEV_SECRET = "orgtooltank-local-development-only";
/** The signing secret, or null in production when FEEDBACK_SECRET isn't set (the API then answers 503). */
export function secret(): string | null {
  const value = process.env.FEEDBACK_SECRET;
  if (value && value.length >= 32) return value;
  return process.env.NODE_ENV === "production" ? null : DEV_SECRET;
}
/** Why the signing secret can't be used, or null when it can. Reports length only, never the value. */
export function secretProblem(): string | null {
  const value = process.env.FEEDBACK_SECRET;
  if ((value && value.length >= 32) || process.env.NODE_ENV !== "production") return null;
  return value ? `FEEDBACK_SECRET is ${value.length} characters; at least 32 are required` : "FEEDBACK_SECRET is missing";
}
const hmac = (key: string, purpose: string, value: string) => createHmac("sha256", key).update(`${purpose}:${value}`).digest("base64url");

export type Session = { id: string; voter: string; isNew: boolean; cookie?: string };

/** Reads the signed anonymous ID cookie. Returns null if it's missing or was tampered with. */
export function readSession(request: Request, key: string): Omit<Session, "isNew"> | null {
  const raw = request.headers.get("cookie")?.split(/;\s*/).find(part => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
  if (!raw) return null;
  const [id, signature] = raw.split(".");
  if (!id || !signature || !/^[A-Za-z0-9_-]{22}$/.test(id)) return null;
  const expected = Buffer.from(hmac(key, "sid", id).slice(0, 32)), given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  // The stored voter key is a hash of the cookie, so stored data can't be turned back into a cookie.
  return { id, voter: hmac(key, "voter", id).slice(0, 32) };
}

/** A new random anonymous ID with its Set-Cookie header value. */
export function newSession(request: Request, key: string): Session {
  const id = randomBytes(16).toString("base64url");
  const secure = new URL(request.url).protocol === "https:" || process.env.NODE_ENV === "production";
  const cookie = `${SESSION_COOKIE}=${id}.${hmac(key, "sid", id).slice(0, 32)}; Path=/; Max-Age=${SESSION_MAX_AGE}; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
  return { id, voter: hmac(key, "voter", id).slice(0, 32), isNew: true, cookie };
}

/** A keyed hash of the network address. The raw address is never stored or logged. */
export function ipHash(request: Request, key: string) {
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return hmac(key, "ip", ip).slice(0, 32);
}

/** Browsers always send Origin on POST; it must match this site. Blocks cross-site form posts. */
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin"), host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try { return new URL(origin).host === host; } catch { return false; }
}

/** Reads a small JSON body. Anything too large, not JSON, or not an object is rejected. */
export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return null;
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return null;
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return null;
  try { const value = JSON.parse(text); return value && typeof value === "object" && !Array.isArray(value) ? value : null; } catch { return null; }
}

type Rule = { max: number; window: number };
/** Fixed-window limit: counts requests per subject in the current window. Returns seconds to wait, or 0. */
export async function limited(store: FeedbackStore, name: string, subject: string, rule: Rule, now = Date.now()) {
  const window = Math.floor(now / 1000 / rule.window);
  const count = await store.incr(`fb:rl:${name}:${subject}:${window}`, rule.window + 1);
  return count > rule.max ? Math.max(1, (window + 1) * rule.window - Math.floor(now / 1000)) : 0;
}

/** Seconds to wait if this subject is already over the limit, without counting this request. */
export async function alreadyLimited(store: FeedbackStore, name: string, subject: string, rule: Rule, now = Date.now()) {
  const window = Math.floor(now / 1000 / rule.window);
  return (await store.count(`fb:rl:${name}:${subject}:${window}`)) >= rule.max ? Math.max(1, (window + 1) * rule.window - Math.floor(now / 1000)) : 0;
}

/**
 * Gets or creates the anonymous session. Creating one is limited per network address so clearing
 * cookies over and over can't be used to vote again and again.
 */
export async function sessionFor(request: Request, store: FeedbackStore, key: string, ip: string): Promise<Session | { retryAfter: number }> {
  const existing = readSession(request, key);
  if (existing) return { ...existing, isNew: false };
  const wait = await limited(store, "new-session", ip, LIMITS.newSession.perIp);
  return wait ? { retryAfter: wait } : newSession(request, key);
}

/** Records a blocked request: console (visible in Vercel logs) plus a short list for the moderator page. Never includes comment text. */
export async function logBlocked(store: FeedbackStore | null, entry: Omit<BlockEntry, "at" | "ip" | "voter"> & { ip: string; voter?: string }) {
  const record: BlockEntry = { at: new Date().toISOString(), route: entry.route, reason: entry.reason, ...(entry.slug ? { slug: entry.slug } : {}), ip: entry.ip.slice(0, 12), ...(entry.voter ? { voter: entry.voter.slice(0, 12) } : {}) };
  console.warn(JSON.stringify({ event: "feedback_blocked", ...record }));
  try { await store?.logBlocked(record); } catch { /* logging must never break a response */ }
}

export function json(body: unknown, status = 200, extra: Record<string, string> = {}, session?: Session) {
  const headers = new Headers({ "Cache-Control": "no-store", ...extra });
  if (session?.cookie) headers.append("Set-Cookie", session.cookie);
  return Response.json(body, { status, headers });
}
export const rateLimited = (retryAfter: number, session?: Session) => json({ error: "rate_limited", message: RATE_LIMITED_MESSAGE }, 429, { "Retry-After": String(retryAfter) }, session);
/**
 * 503 when feedback isn't configured. Logs exactly which check failed, plus which settings exist
 * (true/false only), so the cause shows in Vercel logs. No setting values are ever logged or returned.
 */
export function unavailable(route: string) {
  const storage = storeProblem(), signing = secretProblem(), env = process.env;
  console.error(JSON.stringify({
    event: "feedback_not_configured", route, problems: [storage, signing].filter(Boolean),
    nodeEnv: env.NODE_ENV ?? null, vercelEnv: env.VERCEL_ENV ?? null,
    present: { KV_REST_API_URL: !!env.KV_REST_API_URL, KV_REST_API_TOKEN: !!env.KV_REST_API_TOKEN, UPSTASH_REDIS_REST_URL: !!env.UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN: !!env.UPSTASH_REDIS_REST_TOKEN, FEEDBACK_SECRET: !!env.FEEDBACK_SECRET, FEEDBACK_STORE: !!env.FEEDBACK_STORE },
    feedbackSecretLength: env.FEEDBACK_SECRET?.length ?? 0,
  }));
  const reason = storage && signing ? "storage_and_secret" : storage ? "storage" : signing ? "secret" : "unknown";
  return json({ error: "not_configured", reason, message: "Feedback isn’t available right now." }, 503);
}

/** Constant-time password check (compares keyed hashes so lengths never leak). */
export function passwordMatches(given: string, expected: string, key: string) {
  return timingSafeEqual(Buffer.from(hmac(key, "admin", given)), Buffer.from(hmac(key, "admin", expected)));
}
