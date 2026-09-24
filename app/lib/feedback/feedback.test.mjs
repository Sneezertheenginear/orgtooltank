import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

// These modules import siblings without extensions (bundler style); resolve them to .ts here.
registerHooks({ resolve: (specifier, context, next) => { try { return next(specifier, context); } catch (error) { if (specifier.startsWith(".")) return next(`${specifier}.ts`, context); throw error; } } });
const { cleanText, isKnownSlug, isVoteRequest, validateComment } = await import("./validate.ts");
const { MemoryStore, getStore } = await import("./store.ts");
const S = await import("./security.ts");
const { LIMITS, COMMENT_MAX, SESSION_COOKIE } = await import("./config.ts");

const KEY = "test-secret-that-is-at-least-32-characters-long";
const req = (headers = {}, url = "https://orgtooltank.test/api/feedback/vote", init = {}) => new Request(url, { method: "POST", headers, ...init });

test("comments become plain text: markup stays literal, hidden and control characters are removed", () => {
  assert.equal(cleanText("  <script>alert(1)</script>  "), "<script>alert(1)</script>", "kept as text; the page shows it literally");
  const zeroWidth = String.fromCharCode(0x200b), rtl = String.fromCharCode(0x202e), bom = String.fromCharCode(0xfeff), nul = String.fromCharCode(0);
  assert.equal(cleanText(`a${zeroWidth}b${rtl}c${bom}d${nul}e`), "abcde");
  assert.equal(cleanText("line1\r\nline2\n\n\n\n\nline3\ttab"), "line1\nline2\n\nline3\ttab");
  assert.equal(cleanText(42), "");
  assert.equal(cleanText({ toString: () => "x" }), "");
});

test("comment validation: empty, too long, too many links, and a normal comment", () => {
  assert.equal(validateComment({ text: "   ", next: "" }).ok, false);
  assert.match(validateComment({ text: "x".repeat(COMMENT_MAX + 1) }).error, /up to 2,000 characters/);
  assert.match(validateComment({ text: "https://a.com https://b.com www.c.com", next: "http://d.com" }).error, /up to 3 links/);
  assert.deepEqual(validateComment({ text: " Love it ", next: 7 }), { ok: true, comment: { text: "Love it", next: "" } });
  assert.deepEqual(validateComment({ next: "Add dark mode" }), { ok: true, comment: { text: "", next: "Add dark mode" } });
});

test("only real experiments and known vote words are accepted", () => {
  assert.equal(isKnownSlug("rename-pro"), true);
  for (const bad of ["security-inspector", "../etc", "", null, 5]) assert.equal(isKnownSlug(bad), false, String(bad));
  assert.deepEqual(["like", "unlike", "none", "LIKE", "+1", 1].map(isVoteRequest), [true, true, true, false, false, false]);
});

test("one vote per browser: repeats change nothing, switching moves the vote, none removes it", async () => {
  const store = new MemoryStore();
  assert.deepEqual(await store.vote("rename-pro", "v1", "like"), { changed: true, previous: null });
  for (let i = 0; i < 25; i++) assert.equal((await store.vote("rename-pro", "v1", "like")).changed, false);
  await store.vote("rename-pro", "v2", "like");
  assert.deepEqual((await store.counts(["rename-pro"]))["rename-pro"], { like: 2, unlike: 0, comments: 0 });
  assert.deepEqual(await store.vote("rename-pro", "v1", "unlike"), { changed: true, previous: "like" });
  assert.deepEqual((await store.counts(["rename-pro"]))["rename-pro"], { like: 1, unlike: 1, comments: 0 });
  await store.vote("rename-pro", "v1", "none");
  assert.deepEqual((await store.counts(["rename-pro"]))["rename-pro"], { like: 1, unlike: 0, comments: 0 });
  assert.deepEqual(await store.vote("rename-pro", "v9", "none"), { changed: false, previous: null });
  assert.deepEqual(await store.myVotes(["rename-pro"], "v2"), { "rename-pro": "like" });
});

test("comments are held for review; approving publishes and counts them; deleting removes them", async () => {
  const store = new MemoryStore();
  const comment = { id: "c1", slug: "audio-converter", text: "Nice", next: "", created: "2026-09-24T12:00:00.000Z", voter: "abc" };
  await store.addPending(comment);
  assert.deepEqual(await store.approved("audio-converter", 50), []);
  assert.equal((await store.pending()).length, 1);
  assert.deepEqual(await store.approve("c1"), comment);
  assert.equal(await store.approve("c1"), null, "can't approve twice");
  assert.deepEqual((await store.approved("audio-converter", 50)).map(c => c.id), ["c1"]);
  assert.equal((await store.counts(["audio-converter"]))["audio-converter"].comments, 1);
  assert.equal(await store.remove("c1"), true);
  assert.equal((await store.counts(["audio-converter"]))["audio-converter"].comments, 0);
  await store.addPending({ ...comment, id: "c2" });
  assert.equal(await store.remove("c2"), true);
  assert.equal(await store.remove("nope"), false);
});

test("signed anonymous cookie: HttpOnly, SameSite, Secure on https; tampering is rejected", () => {
  const session = S.newSession(req(), KEY);
  assert.match(session.cookie, new RegExp(`^${SESSION_COOKIE}=[A-Za-z0-9_-]{22}\\.[A-Za-z0-9_-]{32}; Path=/; Max-Age=\\d+; HttpOnly; SameSite=Lax; Secure$`));
  const value = session.cookie.split(";")[0];
  const read = S.readSession(req({ cookie: `other=1; ${value}` }), KEY);
  assert.deepEqual(read, { id: session.id, voter: session.voter });
  assert.notEqual(session.voter, session.id, "only a hash of the cookie is stored");
  const [name, rest] = value.split("="), [id, sig] = rest.split(".");
  assert.equal(S.readSession(req({ cookie: `${name}=${id}.${sig.slice(0, -1)}A` }), KEY), null);
  assert.equal(S.readSession(req({ cookie: `${name}=AAAAAAAAAAAAAAAAAAAAAA.${sig}` }), KEY), null);
  assert.equal(S.readSession(req({ cookie: value }), "a-different-secret-that-is-long-enough!!"), null);
  assert.doesNotMatch(S.newSession(req({}, "http://localhost:3000/api/feedback/vote"), KEY).cookie, /Secure/);
});

test("network addresses are only ever hashed", () => {
  const hash = S.ipHash(req({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }), KEY);
  assert.equal(hash.length, 32);
  assert.ok(!hash.includes("203"));
  assert.equal(S.ipHash(req({ "x-real-ip": "203.0.113.7" }), KEY), hash, "same address, same hash");
  assert.notEqual(S.ipHash(req({ "x-real-ip": "203.0.113.8" }), KEY), hash);
});

test("POSTs must come from this site and be small JSON", async () => {
  assert.equal(S.sameOrigin(req({ origin: "https://orgtooltank.test", host: "orgtooltank.test" })), true);
  assert.equal(S.sameOrigin(req({ origin: "https://evil.example", host: "orgtooltank.test" })), false);
  assert.equal(S.sameOrigin(req({ host: "orgtooltank.test" })), false, "no Origin header (e.g. a plain script) is refused");
  const post = (body, type = "application/json") => req({ "content-type": type }, undefined, { body });
  assert.deepEqual(await S.readJson(post('{"slug":"rename-pro"}')), { slug: "rename-pro" });
  for (const bad of [post("[1,2]"), post("not json"), post('{"a":1}', "text/plain"), post(JSON.stringify({ text: "x".repeat(9000) }))]) assert.equal(await S.readJson(bad), null);
});

test("rate limits: fixed windows per subject, with the time to wait", async () => {
  const store = new MemoryStore(), rule = { max: 3, window: 60 }, t = 1_700_000_010_000;
  for (let i = 0; i < 3; i++) assert.equal(await S.limited(store, "vote", "s1", rule, t), 0);
  assert.equal(await S.limited(store, "vote", "s1", rule, t), 30, "4th request waits until the window ends (30 s later at this time)");
  assert.equal(await S.limited(store, "vote", "s2", rule, t), 0, "other subjects are separate");
  assert.equal(await S.limited(store, "vote", "s1", rule, t + 60_000), 0, "next window starts fresh");
  assert.equal(await S.alreadyLimited(store, "vote", "s1", rule, t), 30, "checking doesn’t count as a request");
  assert.equal(await S.alreadyLimited(store, "vote", "s3", rule, t), 0);
});

test("new anonymous IDs are limited per network address (clearing cookies doesn't help)", async () => {
  const store = new MemoryStore();
  for (let i = 0; i < LIMITS.newSession.perIp.max; i++) assert.ok(!("retryAfter" in await S.sessionFor(req(), store, KEY, "ip1")));
  assert.ok("retryAfter" in await S.sessionFor(req(), store, KEY, "ip1"));
  const existing = S.newSession(req(), KEY).cookie.split(";")[0];
  assert.equal((await S.sessionFor(req({ cookie: existing }), store, KEY, "ip1")).isNew, false, "people who already have an ID are unaffected");
});

test("cooldown claim, moderator password check, and production safety", async () => {
  const store = new MemoryStore();
  assert.equal(await store.claim("fb:cooldown:v1", 30), true);
  assert.equal(await store.claim("fb:cooldown:v1", 30), false);
  assert.equal(S.passwordMatches("correct horse battery", "correct horse battery", KEY), true);
  assert.equal(S.passwordMatches("wrong", "correct horse battery", KEY), false);
  const env = { ...process.env };
  try {
    process.env.NODE_ENV = "production"; delete process.env.FEEDBACK_SECRET; process.env.FEEDBACK_STORE = "memory";
    assert.equal(S.secret(), null, "production refuses to run without FEEDBACK_SECRET");
    assert.equal(getStore(), null, "production refuses the in-memory store");
    process.env.FEEDBACK_SECRET = "short";
    assert.equal(S.secret(), null, "a short secret is refused");
  } finally { process.env = env; }
});
