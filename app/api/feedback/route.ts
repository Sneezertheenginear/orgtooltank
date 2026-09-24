// GET /api/feedback?slugs=a,b,c: public like/unlike/comment counts, plus this browser's own votes.
import { LIMITS } from "../../lib/feedback/config";
import { ipHash, json, limited, logBlocked, rateLimited, readSession, secret, unavailable } from "../../lib/feedback/security";
import { getStore } from "../../lib/feedback/store";
import { isKnownSlug } from "../../lib/feedback/validate";

export async function GET(request: Request) {
  const store = getStore(), key = secret();
  if (!store || !key) return unavailable("counts");
  const ip = ipHash(request, key);
  const wait = await limited(store, "read", ip, LIMITS.read.perIp);
  if (wait) { await logBlocked(store, { route: "counts", reason: "rate_limit_ip", ip }); return rateLimited(wait); }
  const slugs = [...new Set((new URL(request.url).searchParams.get("slugs") ?? "").split(","))].filter(isKnownSlug).slice(0, 50);
  const session = readSession(request, key);
  const [counts, mine] = await Promise.all([store.counts(slugs), session ? store.myVotes(slugs, session.voter) : Promise.resolve({})]);
  return json({ counts, mine });
}
