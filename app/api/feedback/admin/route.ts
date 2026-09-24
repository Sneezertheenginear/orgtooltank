// Moderation for the site owner.
// GET  /api/feedback/admin                      pending comments, recently approved, recent blocked requests
// POST /api/feedback/admin { action, id }       action: "approve" | "delete"
// Requires "Authorization: Bearer <FEEDBACK_ADMIN_PASSWORD>". Wrong passwords are rate limited.
import { LIMITS } from "../../../lib/feedback/config";
import { alreadyLimited, ipHash, json, limited, logBlocked, passwordMatches, rateLimited, readJson, sameOrigin, secret, unavailable } from "../../../lib/feedback/security";
import { getStore, type FeedbackStore } from "../../../lib/feedback/store";

async function authorize(request: Request, store: FeedbackStore, key: string): Promise<Response | null> {
  const expected = process.env.FEEDBACK_ADMIN_PASSWORD;
  if (!expected || expected.length < 12) return json({ error: "not_configured", message: "Moderation isn’t set up. Add FEEDBACK_ADMIN_PASSWORD (12+ characters)." }, 503);
  const ip = ipHash(request, key);
  const locked = await alreadyLimited(store, "admin-fail", ip, LIMITS.adminFailures.perIp);
  if (locked) { await logBlocked(store, { route: "admin", reason: "rate_limit_admin", ip }); return rateLimited(locked); }
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!given || !passwordMatches(given, expected, key)) {
    await limited(store, "admin-fail", ip, LIMITS.adminFailures.perIp);
    await logBlocked(store, { route: "admin", reason: "bad_password", ip });
    return json({ error: "unauthorized", message: "That password isn’t right." }, 401);
  }
  return null;
}

export async function GET(request: Request) {
  const store = getStore(), key = secret();
  if (!store || !key) return unavailable();
  const denied = await authorize(request, store, key);
  if (denied) return denied;
  const [pending, approved, blocked] = await Promise.all([store.pending(), store.recentApproved(50), store.recentBlocked(50)]);
  return json({ pending, approved, blocked });
}

export async function POST(request: Request) {
  const store = getStore(), key = secret();
  if (!store || !key) return unavailable();
  if (!sameOrigin(request)) return json({ error: "forbidden", message: "This request isn’t allowed." }, 403);
  const denied = await authorize(request, store, key);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body || typeof body.id !== "string" || !["approve", "delete"].includes(String(body.action))) return json({ error: "invalid", message: "Unknown moderation action." }, 400);
  const ok = body.action === "approve" ? !!(await store.approve(body.id)) : await store.remove(body.id);
  return ok ? json({ ok: true }) : json({ error: "not_found", message: "That comment wasn’t found. It may already have been handled." }, 404);
}
