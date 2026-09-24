// GET  /api/feedback/comments?slug=x  approved comments for one experiment (plain text only)
// POST /api/feedback/comments { slug, text, next, token, website }  submit a comment for review
import { APPROVED_SHOWN, LIMITS, RATE_LIMITED_MESSAGE } from "../../../lib/feedback/config";
import { ipHash, json, limited, logBlocked, rateLimited, readJson, sameOrigin, secret, sessionFor, unavailable } from "../../../lib/feedback/security";
import { getStore } from "../../../lib/feedback/store";
import { verifyTurnstile } from "../../../lib/feedback/turnstile";
import { isKnownSlug, validateComment } from "../../../lib/feedback/validate";

export async function GET(request: Request) {
  const store = getStore(), key = secret();
  if (!store || !key) return unavailable();
  const ip = ipHash(request, key);
  const wait = await limited(store, "read", ip, LIMITS.read.perIp);
  if (wait) { await logBlocked(store, { route: "comments_read", reason: "rate_limit_ip", ip }); return rateLimited(wait); }
  const slug = new URL(request.url).searchParams.get("slug");
  if (!isKnownSlug(slug)) return json({ error: "invalid", message: "Unknown experiment." }, 400);
  const comments = (await store.approved(slug, APPROVED_SHOWN)).map(({ id, text, next, created }) => ({ id, text, next, created }));
  return json({ comments });
}

export async function POST(request: Request) {
  const store = getStore(), key = secret();
  if (!store || !key) return unavailable();
  const ip = ipHash(request, key);
  if (!sameOrigin(request)) { await logBlocked(store, { route: "comment", reason: "bad_origin", ip }); return json({ error: "forbidden", message: "This request isn’t allowed." }, 403); }
  const body = await readJson(request);
  if (!body || !isKnownSlug(body.slug)) return json({ error: "invalid", message: "That comment couldn’t be read." }, 400);
  const slug = body.slug;

  const ipWait = await limited(store, "comment-ip", ip, LIMITS.comment.perIp);
  if (ipWait) { await logBlocked(store, { route: "comment", reason: "rate_limit_ip", slug, ip }); return rateLimited(ipWait); }
  const session = await sessionFor(request, store, key, ip);
  if ("retryAfter" in session) { await logBlocked(store, { route: "comment", reason: "rate_limit_new_session", slug, ip }); return rateLimited(session.retryAfter); }
  // A hidden field people never see. Bots that fill it get a normal-looking answer and nothing is saved.
  if (typeof body.website === "string" && body.website.trim()) {
    await logBlocked(store, { route: "comment", reason: "honeypot", slug, ip, voter: session.voter });
    return json({ status: "pending", message: "Thanks! Your comment will appear after review." }, 202, {}, session);
  }
  const checked = validateComment(body);
  if (!checked.ok) return json({ error: "invalid", message: checked.error }, 400, {}, session);

  const human = await verifyTurnstile(body.token);
  if (human === "not_configured") return json({ error: "not_configured", message: "Comments aren’t available right now." }, 503, {}, session);
  if (human === "failed") { await logBlocked(store, { route: "comment", reason: "turnstile_failed", slug, ip, voter: session.voter }); return json({ error: "verification_failed", message: "We couldn’t confirm you’re not a bot. Please try again." }, 403, {}, session); }

  // Per-browser limits count only submissions that passed the checks above.
  const sessionWait = await limited(store, "comment-session", session.voter, LIMITS.comment.perSession);
  if (sessionWait) { await logBlocked(store, { route: "comment", reason: "rate_limit_session", slug, ip, voter: session.voter }); return rateLimited(sessionWait, session); }
  // Only one accepted comment per browser per cooldown period, however fast requests arrive.
  if (!(await store.claim(`fb:cooldown:${session.voter}`, LIMITS.comment.cooldown))) {
    await logBlocked(store, { route: "comment", reason: "cooldown", slug, ip, voter: session.voter });
    return json({ error: "rate_limited", message: RATE_LIMITED_MESSAGE }, 429, { "Retry-After": String(LIMITS.comment.cooldown) }, session);
  }
  await store.addPending({ id: crypto.randomUUID(), slug, text: checked.comment.text, next: checked.comment.next, created: new Date().toISOString(), voter: session.voter.slice(0, 12) });
  return json({ status: "pending", message: "Thanks! Your comment will appear after review." }, 202, {}, session);
}
