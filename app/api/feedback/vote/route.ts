// POST /api/feedback/vote { slug, vote: "like" | "unlike" | "none" }
// One vote per item per browser. Switching updates the existing vote; counts are only ever changed
// on the server, atomically, so repeated requests can't inflate them.
import { ALREADY_VOTED_MESSAGE, LIMITS } from "../../../lib/feedback/config";
import { ipHash, json, limited, logBlocked, rateLimited, readJson, sameOrigin, secret, sessionFor, unavailable } from "../../../lib/feedback/security";
import { getStore } from "../../../lib/feedback/store";
import { isKnownSlug, isVoteRequest } from "../../../lib/feedback/validate";

export async function POST(request: Request) {
  const store = getStore(), key = secret();
  if (!store || !key) return unavailable();
  const ip = ipHash(request, key);
  if (!sameOrigin(request)) { await logBlocked(store, { route: "vote", reason: "bad_origin", ip }); return json({ error: "forbidden", message: "This request isn’t allowed." }, 403); }
  const body = await readJson(request);
  if (!body || !isKnownSlug(body.slug) || !isVoteRequest(body.vote)) return json({ error: "invalid", message: "That vote couldn’t be read." }, 400);
  const slug = body.slug, vote = body.vote;

  const ipWait = await limited(store, "vote-ip", ip, LIMITS.vote.perIp);
  if (ipWait) { await logBlocked(store, { route: "vote", reason: "rate_limit_ip", slug, ip }); return rateLimited(ipWait); }
  const session = await sessionFor(request, store, key, ip);
  if ("retryAfter" in session) { await logBlocked(store, { route: "vote", reason: "rate_limit_new_session", slug, ip }); return rateLimited(session.retryAfter); }
  const sessionWait = await limited(store, "vote-session", session.voter, LIMITS.vote.perSession);
  if (sessionWait) { await logBlocked(store, { route: "vote", reason: "rate_limit_session", slug, ip, voter: session.voter }); return rateLimited(sessionWait, session); }

  const result = await store.vote(slug, session.voter, vote);
  const [counts, mine] = await Promise.all([store.counts([slug]), store.myVotes([slug], session.voter)]);
  if (!result.changed && vote !== "none") return json({ error: "already_voted", message: ALREADY_VOTED_MESSAGE, counts: counts[slug], mine: mine[slug] }, 409, {}, session);
  return json({ counts: counts[slug], mine: mine[slug] }, 200, {}, session);
}
