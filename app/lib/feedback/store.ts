// Feedback storage. Production uses Upstash Redis (set up from the Vercel Marketplace). A memory
// store exists only for local testing (FEEDBACK_STORE=memory) and is refused in production.
import { Redis } from "@upstash/redis";
import type { Vote, VoteRequest } from "./validate";

export type Counts = { like: number; unlike: number; comments: number };
export type StoredComment = { id: string; slug: string; text: string; next: string; created: string; voter: string };
export type BlockEntry = { at: string; route: string; reason: string; slug?: string; ip: string; voter?: string };

export interface FeedbackStore {
  /** Adds one to a counter that expires after `ttl` seconds; returns the new count. */
  incr(key: string, ttl: number): Promise<number>;
  /** Reads a counter without changing it (0 when missing or expired). */
  count(key: string): Promise<number>;
  /** Sets a key only if it doesn't exist yet; false means it already existed. */
  claim(key: string, ttl: number): Promise<boolean>;
  /** Atomically records one vote per voter. `changed` is false when nothing changed. */
  vote(slug: string, voter: string, value: VoteRequest): Promise<{ changed: boolean; previous: Vote | null }>;
  counts(slugs: string[]): Promise<Record<string, Counts>>;
  myVotes(slugs: string[], voter: string): Promise<Record<string, Vote | null>>;
  addPending(comment: StoredComment): Promise<void>;
  pending(): Promise<StoredComment[]>;
  approved(slug: string, limit: number): Promise<StoredComment[]>;
  recentApproved(limit: number): Promise<StoredComment[]>;
  approve(id: string): Promise<StoredComment | null>;
  remove(id: string): Promise<boolean>;
  logBlocked(entry: BlockEntry): Promise<void>;
  recentBlocked(limit: number): Promise<BlockEntry[]>;
}

const zero = (): Counts => ({ like: 0, unlike: 0, comments: 0 });
const toCounts = (raw: Record<string, unknown> | null | undefined): Counts => ({ like: Math.max(0, Number(raw?.like ?? 0) || 0), unlike: Math.max(0, Number(raw?.unlike ?? 0) || 0), comments: Math.max(0, Number(raw?.comments ?? 0) || 0) });
const parse = <T>(value: unknown): T | null => { try { return typeof value === "string" ? JSON.parse(value) as T : null; } catch { return null; } };

// One vote per voter, changed atomically so repeated or simultaneous requests can't inflate counts.
const VOTE_SCRIPT = `
local old = redis.call('HGET', KEYS[1], ARGV[1])
if (old == ARGV[2]) or ((not old) and ARGV[2] == 'none') then return {old or '', 0} end
if old then redis.call('HINCRBY', KEYS[2], old, -1) end
if ARGV[2] == 'none' then redis.call('HDEL', KEYS[1], ARGV[1])
else redis.call('HSET', KEYS[1], ARGV[1], ARGV[2]); redis.call('HINCRBY', KEYS[2], ARGV[2], 1) end
return {old or '', 1}`;

const K = {
  votes: (slug: string) => `fb:votes:${slug}`, counts: (slug: string) => `fb:counts:${slug}`,
  pending: "fb:pending", approved: (slug: string) => `fb:approved:${slug}`, recent: "fb:approved:recent", blocked: "fb:blocked",
};

class UpstashStore implements FeedbackStore {
  private redis: Redis;
  constructor(redis: Redis) { this.redis = redis; }
  async incr(key: string, ttl: number) { const count = await this.redis.incr(key); if (count === 1) await this.redis.expire(key, ttl); return count; }
  async count(key: string) { return Number(await this.redis.get<string>(key)) || 0; }
  async claim(key: string, ttl: number) { return (await this.redis.set(key, "1", { nx: true, ex: ttl })) === "OK"; }
  async vote(slug: string, voter: string, value: VoteRequest) {
    const [old, changed] = await this.redis.eval<[string, string], [string, number]>(VOTE_SCRIPT, [K.votes(slug), K.counts(slug)], [voter, value]);
    const previous: Vote | null = old === "like" || old === "unlike" ? old : null;
    return { changed: Number(changed) === 1, previous };
  }
  async counts(slugs: string[]) {
    if (!slugs.length) return {};
    const pipe = this.redis.pipeline(); for (const slug of slugs) pipe.hgetall(K.counts(slug));
    const rows = await pipe.exec<(Record<string, unknown> | null)[]>();
    return Object.fromEntries(slugs.map((slug, i) => [slug, toCounts(rows[i])]));
  }
  async myVotes(slugs: string[], voter: string) {
    if (!slugs.length) return {};
    const pipe = this.redis.pipeline(); for (const slug of slugs) pipe.hget(K.votes(slug), voter);
    const rows = await pipe.exec<(string | null)[]>();
    return Object.fromEntries(slugs.map((slug, i) => [slug, rows[i] === "like" || rows[i] === "unlike" ? rows[i] as Vote : null]));
  }
  async addPending(comment: StoredComment) { await this.redis.hset(K.pending, { [comment.id]: JSON.stringify(comment) }); }
  async pending() {
    const all = await this.redis.hgetall<Record<string, string>>(K.pending) ?? {};
    return Object.values(all).map(value => parse<StoredComment>(value)).filter((c): c is StoredComment => !!c).sort((a, b) => a.created.localeCompare(b.created));
  }
  async approved(slug: string, limit: number) { return (await this.redis.lrange(K.approved(slug), 0, limit - 1)).map(value => parse<StoredComment>(value)).filter((c): c is StoredComment => !!c); }
  async recentApproved(limit: number) {
    const refs = (await this.redis.lrange(K.recent, 0, limit - 1)).map(value => parse<{ id: string; slug: string }>(value)).filter(Boolean) as { id: string; slug: string }[];
    const bySlug = new Map<string, StoredComment[]>();
    for (const slug of new Set(refs.map(ref => ref.slug))) bySlug.set(slug, await this.approved(slug, 500));
    return refs.map(ref => bySlug.get(ref.slug)?.find(c => c.id === ref.id)).filter((c): c is StoredComment => !!c);
  }
  async approve(id: string) {
    const raw = await this.redis.hget<string>(K.pending, id), comment = parse<StoredComment>(raw);
    if (!comment || !(await this.redis.hdel(K.pending, id))) return null;
    await this.redis.lpush(K.approved(comment.slug), JSON.stringify(comment));
    await this.redis.ltrim(K.approved(comment.slug), 0, 499);
    await this.redis.hincrby(K.counts(comment.slug), "comments", 1);
    await this.redis.lpush(K.recent, JSON.stringify({ id, slug: comment.slug })); await this.redis.ltrim(K.recent, 0, 99);
    return comment;
  }
  async remove(id: string) {
    if (await this.redis.hdel(K.pending, id)) return true;
    const refs = await this.redis.lrange(K.recent, 0, 99);
    for (const ref of refs) {
      const found = parse<{ id: string; slug: string }>(ref);
      if (found?.id !== id) continue;
      const list = await this.redis.lrange(K.approved(found.slug), 0, 499), match = list.find(value => parse<StoredComment>(value)?.id === id);
      if (match && await this.redis.lrem(K.approved(found.slug), 1, match)) { await this.redis.hincrby(K.counts(found.slug), "comments", -1); await this.redis.lrem(K.recent, 1, ref); return true; }
    }
    return false;
  }
  async logBlocked(entry: BlockEntry) { await this.redis.lpush(K.blocked, JSON.stringify(entry)); await this.redis.ltrim(K.blocked, 0, 199); }
  async recentBlocked(limit: number) { return (await this.redis.lrange(K.blocked, 0, limit - 1)).map(value => parse<BlockEntry>(value)).filter((e): e is BlockEntry => !!e); }
}

/** Same behavior as the Upstash store, kept in this process only. For local testing. */
export class MemoryStore implements FeedbackStore {
  private counters = new Map<string, { value: number; expires: number }>();
  private votes = new Map<string, Map<string, Vote>>();
  private tallies = new Map<string, Counts>();
  private pendingById = new Map<string, StoredComment>();
  private approvedBySlug = new Map<string, StoredComment[]>();
  private recent: { id: string; slug: string }[] = [];
  private blocked: BlockEntry[] = [];
  private now: () => number;
  constructor(now: () => number = Date.now) { this.now = now; }
  private live(key: string) { const entry = this.counters.get(key); if (entry && entry.expires <= this.now()) { this.counters.delete(key); return undefined; } return entry; }
  async incr(key: string, ttl: number) { const entry = this.live(key); const value = (entry?.value ?? 0) + 1; this.counters.set(key, { value, expires: entry?.expires ?? this.now() + ttl * 1000 }); return value; }
  async count(key: string) { return this.live(key)?.value ?? 0; }
  async claim(key: string, ttl: number) { if (this.live(key)) return false; this.counters.set(key, { value: 1, expires: this.now() + ttl * 1000 }); return true; }
  private tally(slug: string) { if (!this.tallies.has(slug)) this.tallies.set(slug, zero()); return this.tallies.get(slug)!; }
  async vote(slug: string, voter: string, value: VoteRequest) {
    const votes = this.votes.get(slug) ?? new Map<string, Vote>(); this.votes.set(slug, votes);
    const old = votes.get(voter) ?? null;
    if (old === value || (!old && value === "none")) return { changed: false, previous: old };
    const tally = this.tally(slug);
    if (old) tally[old]--;
    if (value === "none") votes.delete(voter); else { votes.set(voter, value); tally[value]++; }
    return { changed: true, previous: old };
  }
  async counts(slugs: string[]) { return Object.fromEntries(slugs.map(slug => [slug, { ...this.tally(slug) }])); }
  async myVotes(slugs: string[], voter: string) { return Object.fromEntries(slugs.map(slug => [slug, this.votes.get(slug)?.get(voter) ?? null])); }
  async addPending(comment: StoredComment) { this.pendingById.set(comment.id, comment); }
  async pending() { return [...this.pendingById.values()].sort((a, b) => a.created.localeCompare(b.created)); }
  async approved(slug: string, limit: number) { return (this.approvedBySlug.get(slug) ?? []).slice(0, limit); }
  async recentApproved(limit: number) { return this.recent.slice(0, limit).map(ref => this.approvedBySlug.get(ref.slug)?.find(c => c.id === ref.id)).filter((c): c is StoredComment => !!c); }
  async approve(id: string) {
    const comment = this.pendingById.get(id); if (!comment) return null;
    this.pendingById.delete(id);
    this.approvedBySlug.set(comment.slug, [comment, ...(this.approvedBySlug.get(comment.slug) ?? [])].slice(0, 500));
    this.tally(comment.slug).comments++; this.recent = [{ id, slug: comment.slug }, ...this.recent].slice(0, 100);
    return comment;
  }
  async remove(id: string) {
    if (this.pendingById.delete(id)) return true;
    const ref = this.recent.find(r => r.id === id); if (!ref) return false;
    const list = this.approvedBySlug.get(ref.slug) ?? [], index = list.findIndex(c => c.id === id); if (index < 0) return false;
    list.splice(index, 1); this.tally(ref.slug).comments--; this.recent = this.recent.filter(r => r.id !== id);
    return true;
  }
  async logBlocked(entry: BlockEntry) { this.blocked = [entry, ...this.blocked].slice(0, 200); }
  async recentBlocked(limit: number) { return this.blocked.slice(0, limit); }
}

declare global { var __ottFeedbackMemoryStore: MemoryStore | undefined; }

/** The configured store, or null when feedback storage isn't set up (the API then answers 503). */
export function getStore(): FeedbackStore | null {
  if (process.env.FEEDBACK_STORE === "memory") {
    if (process.env.NODE_ENV === "production") return null;
    return (globalThis.__ottFeedbackMemoryStore ??= new MemoryStore());
  }
  if (!(process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL)) return null;
  return new UpstashStore(Redis.fromEnv({ automaticDeserialization: false }));
}
