import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

// Modules import siblings without extensions (bundler style); resolve them to .ts here.
registerHooks({ resolve: (specifier, context, next) => { try { return next(specifier, context); } catch (error) { if (specifier.startsWith(".")) return next(`${specifier}.ts`, context); throw error; } } });

const E = await import("./engine.ts");
const { exampleLog } = await import("./demo.ts");
const NOW = Date.UTC(2026, 8, 28, 15, 0);
const line = (ip, t, method, path, status, ua = "Mozilla/5.0 (Macintosh) Safari/605.1.15") => {
  const d = new Date(t), p = n => String(n).padStart(2, "0"), mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()];
  return `${ip} - - [${p(d.getUTCDate())}/${mon}/${d.getUTCFullYear()}:${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} +0000] "${method} ${path} HTTP/1.1" ${status} 100 "-" "${ua}"`;
};
const visitor = lines => E.analyze(E.parseLog(lines.join("\n")).requests).visitors[0];

test("parses combined and common log formats, with time zones and query strings", () => {
  const r = E.parseLine('203.0.113.5 - - [28/Sep/2026:10:15:30 -0500] "GET /blog/post?id=4 HTTP/2.0" 200 5120 "https://example.com/" "Mozilla/5.0 \\"quoted\\" agent"');
  assert.equal(r.ip, "203.0.113.5"); assert.equal(r.method, "GET"); assert.equal(r.path, "/blog/post"); assert.equal(r.url, "/blog/post?id=4");
  assert.equal(r.time, Date.UTC(2026, 8, 28, 15, 15, 30)); assert.equal(r.status, 200); assert.equal(r.bytes, 5120);
  assert.equal(r.referrer, "https://example.com/"); assert.match(r.ua, /quoted/);
  const common = E.parseLine('192.0.2.1 - frank [10/Oct/2000:13:55:36 +0000] "POST /login HTTP/1.0" 302 -');
  assert.equal(common.ua, ""); assert.equal(common.bytes, 0); assert.equal(common.method, "POST");
  const junk = E.parseLine('192.0.2.9 - - [28/Sep/2026:01:02:03 +0000] "\\x16\\x03\\x01" 400 157 "-" "-"');
  assert.equal(junk.path, "(malformed request)"); assert.equal(junk.ua, "");
  const parsed = E.parseLog("not a log line\n\n" + line("192.0.2.1", NOW, "GET", "/", 200));
  assert.equal(parsed.requests.length, 1); assert.equal(parsed.skipped, 1);
});

test("the example log flags what it should, and leaves ordinary visitors alone", () => {
  const a = E.analyze(E.parseLog(exampleLog(NOW)).requests);
  const label = ip => a.byIp.get(ip).label;
  assert.equal(label("203.0.113.66"), "suspicious");   // WordPress / secrets prober
  assert.equal(label("198.51.100.200"), "suspicious"); // 404 scanner
  assert.equal(label("198.51.100.77"), "suspicious");  // contact-form spam
  assert.equal(label("203.0.113.140"), "suspicious");  // API scraper
  assert.equal(label("198.51.100.9"), "automated");    // curl uptime monitor: steady, not suspicious
  assert.equal(label("203.0.113.20"), "automated");    // says it's Googlebot
  assert.equal(label("10.0.0.5"), "normal");
  assert.ok(a.visitors.filter(v => /^192\.0\.2\./.test(v.ip)).every(v => v.label === "normal"));
  assert.equal(a.counts.suspicious.visitors, 4);
  assert.ok(a.refused > 0);
});

test("every flag explains itself with evidence", () => {
  const a = E.analyze(E.parseLog(exampleLog(NOW)).requests);
  for (const v of a.visitors.filter(v => v.label !== "normal")) {
    assert.ok(v.reasons.length > 0, v.ip);
    assert.equal(v.reasons[0].concern, v.label === "suspicious", v.ip);
    assert.ok(v.reasons.every(r => /\d|agent|user agent/i.test(r.text)), v.ip);
  }
  assert.match(a.byIp.get("203.0.113.66").reasons.map(r => r.text).join(" "), /password guessing/);
  assert.match(a.byIp.get("203.0.113.20").notes.join(" "), /reverse DNS/);
});

test("probe-style paths that exist on the site aren't flagged by name alone", () => {
  const lines = Array.from({ length: 6 }, (_, i) => line("192.0.2.50", NOW + i * 60_000, "GET", "/wp-admin/", 200));
  const v = visitor(lines);
  assert.equal(v.label, "normal");
  assert.match(v.notes.join(" "), /exist on your site/);
  const a = E.analyze(E.parseLog(lines.join("\n")).requests);
  assert.equal(a.paths[0].flag, null);
});

test("rules: missing pages, repeated posts, bursts, tools, scanners, private addresses", () => {
  const notFound = visitor(Array.from({ length: 12 }, (_, i) => line("192.0.2.2", NOW + i * 5_000, "GET", `/nope-${i}`, 404)));
  assert.equal(notFound.label, "suspicious"); assert.match(notFound.reasons[0].text, /12 of 12 requests/);
  const posts = visitor(Array.from({ length: 10 }, (_, i) => line("192.0.2.3", NOW + i * 60_000, "POST", "/signup", 200)));
  assert.equal(posts.label, "suspicious"); assert.deepEqual(posts.repeatedPaths, ["/signup"]);
  const burst = visitor(Array.from({ length: 70 }, (_, i) => line("192.0.2.4", NOW + i * 500, "GET", `/page-${i}`, 200)));
  assert.equal(burst.label, "automated"); assert.equal(burst.peakPerMinute, 70);
  const heavy = visitor(Array.from({ length: 160 }, (_, i) => line("192.0.2.5", NOW + i * 300, "GET", `/page-${i}`, 200)));
  assert.equal(heavy.label, "suspicious");
  assert.equal(visitor([line("192.0.2.6", NOW, "GET", "/", 200, "-")]).label, "automated");
  assert.equal(visitor([line("192.0.2.7", NOW, "GET", "/", 200, "sqlmap/1.7")]).label, "suspicious");
  assert.match(visitor([line("10.1.2.3", NOW, "GET", "/", 200)]).notes.join(" "), /private network/);
  assert.equal(visitor([line("192.0.2.8", NOW, "GET", "/", 200)]).label, "normal");
});

test("buckets are sized to the span, count every request once, and find the spike", () => {
  const a = E.analyze(E.parseLog(exampleLog(NOW)).requests);
  const { size, bins } = E.bucketize(a.requests, ip => a.byIp.get(ip).label, a.first, a.last);
  assert.equal(size, 30 * 60_000);
  assert.ok(bins.length <= 72);
  assert.equal(bins.reduce((n, b) => n + b.total, 0), a.requests.length);
  assert.ok(bins.every(b => b.total === b.normal + b.automated + b.suspicious));
  const s = E.spike(bins);
  assert.equal(s.isSpike, true);
  assert.ok(s.peak.suspicious > s.peak.normal, "the spike should be mostly suspicious traffic");
  assert.equal(E.spike([]), null);
});

test("decisions are validated and blocklists are generated", () => {
  assert.deepEqual(E.parseDecisions('{"192.0.2.1":"block","2001:db8::1":"watch","bad ip":"block","192.0.2.2":"nuke"}'), { "192.0.2.1": "block", "2001:db8::1": "watch" });
  assert.deepEqual(E.parseDecisions("not json"), {});
  const b = E.blocklist(["192.0.2.1", "203.0.113.66"]);
  assert.equal(b.nginx, "deny 192.0.2.1;\ndeny 203.0.113.66;");
  assert.match(b.apache, /Require not ip 203\.0\.113\.66/);
  assert.equal(b.plain, "192.0.2.1\n203.0.113.66");
});

test("reads Vercel's documented JSON log format: proxy fields, NDJSON, duplicates removed", () => {
  const proxy = (id, path, status, ip, t, extra = {}) => JSON.stringify({ id: `log-${Math.random()}`, deploymentId: "dpl_x", source: "lambda", host: "my-app.vercel.app", timestamp: t + 111, projectId: "p", level: "info", message: "hi", requestId: id, statusCode: status, path: "/api/[route]", proxy: { timestamp: t, method: "POST", host: "my-app.vercel.app", path, userAgent: ["python-requests/2.31.0"], region: "iad1", statusCode: status, clientIp: ip, ...extra } });
  const t = Date.UTC(2026, 8, 28, 12, 0);
  const ndjson = [
    JSON.stringify({ id: "b", deploymentId: "dpl_x", source: "build", host: "h", timestamp: t, projectId: "p", level: "info", message: "Build completed", type: "stdout" }),
    proxy("req-1", "/api/users?page=1", 200, "203.0.113.9", t),
    proxy("req-1", "/api/users?page=1", 200, "203.0.113.9", t), // a second console line from the same request
    proxy("req-2", "/xmlrpc.php", 404, "203.0.113.9", t + 1000),
  ].join("\n");
  const file = E.parseTraffic(ndjson);
  assert.equal(file.format, "JSON"); assert.equal(file.identity, "ip");
  assert.equal(file.requests.length, 2, "duplicate request lines are kept once");
  assert.equal(file.skipped, 1, "the build log has no request, so it's skipped");
  const [first, second] = file.requests;
  assert.equal(first.path, "/api/users"); assert.equal(first.url, "/api/users?page=1"); assert.equal(first.time, t);
  assert.equal(first.method, "POST"); assert.equal(first.ua, "python-requests/2.31.0"); assert.equal(second.status, 404);
  const array = E.parseTraffic(`[${ndjson.split("\n").slice(1).join(",")}]`);
  assert.equal(array.requests.length, 2);
});

test("reads CSV and JSON exports with common column names, and falls back to user agents without IPs", () => {
  const csv = 'Time,Request Method,Request Path,Status Code,Client IP,Request User Agent\n2026-09-28 12:00:00,GET,/wp-login.php,404,198.51.100.4,"Mozilla/5.0 (X11, Linux)"\n2026-09-28T12:00:05Z,GET,https://example.com/.env?x=1,404,198.51.100.4,curl/8.4.0\nnot a time,GET,/,200,198.51.100.5,x\n';
  const c = E.parseTraffic(csv);
  assert.equal(c.format, "CSV"); assert.equal(c.identity, "ip");
  assert.equal(c.requests.length, 2); assert.equal(c.skipped, 1);
  assert.equal(c.requests[0].time, Date.UTC(2026, 8, 28, 12, 0, 0), "times without a zone are read as UTC");
  assert.equal(c.requests[0].ua, "Mozilla/5.0 (X11, Linux)");
  assert.equal(c.requests[1].path, "/.env"); assert.equal(c.requests[1].url, "/.env?x=1");
  const noIp = E.parseTraffic(JSON.stringify([{ timestamp: 1790000000, requestPath: "/", requestMethod: "GET", responseStatusCode: 200, requestUserAgent: "curl/8.4.0" }, { timestamp: 1790000001000, requestPath: "/a", requestUserAgent: "" }]));
  assert.equal(noIp.identity, "userAgent");
  assert.deepEqual(noIp.requests.map(r => r.ip), ["curl/8.4.0", "(no user agent)"]);
  assert.equal(noIp.requests[0].time, 1790000000000, "second timestamps become milliseconds");
  const a = E.analyze(noIp.requests, noIp.identity);
  assert.equal(a.identity, "userAgent");
  assert.ok(a.visitors.every(v => !v.notes.some(n => /private network/.test(n))));
});

test("access logs still go through the log parser", () => {
  const file = E.parseTraffic(exampleLog(NOW));
  assert.equal(file.format, "access log"); assert.equal(file.identity, "ip");
  assert.equal(file.requests.length, E.parseLog(exampleLog(NOW)).requests.length);
  assert.equal(E.parseTraffic("hello, world\nnot, a log").requests.length, 0);
});

test("demo live stream: deterministic, documentation-only addresses, and each episode classifies as intended", async () => {
  const { createDemoStream, CYCLE_MS, EPISODES } = await import("./live-demo.ts");
  const anchor = Date.UTC(2026, 8, 28, 13, 0), stream = createDemoStream(anchor);
  const whole = stream.take(anchor, anchor + CYCLE_MS);
  const pieces = [...stream.take(anchor, anchor + 61_234), ...stream.take(anchor + 61_234, anchor + CYCLE_MS)];
  assert.deepEqual(pieces, whole, "chunking doesn't change the stream");
  assert.ok(whole.every(r => /^(192\.0\.2|198\.51\.100|203\.0\.113)\./.test(r.ip)), "only documentation IP ranges");
  const a = E.analyze(whole);
  const label = prefix => a.visitors.find(v => v.ip.startsWith(prefix))?.label;
  assert.equal(label("203.0.113.6"), "suspicious");  // admin-path scanner
  assert.equal(a.visitors.find(v => v.ip.startsWith("203.0.113.6")).requests.length, 30);
  assert.equal(label("198.51.100.7"), "suspicious"); // form spam
  assert.equal(label("203.0.113.14"), "suspicious"); // API copier reaches 50 hits
  assert.equal(label("198.51.100.9"), "automated");  // uptime monitor
  assert.equal(label("203.0.113.20"), "automated");  // says it's Googlebot
  assert.ok(a.visitors.filter(v => v.ip.startsWith("192.0.2.")).every(v => v.label === "normal"));
  const perSecond = (from, to) => stream.take(anchor + from * 1000, anchor + to * 1000).filter(r => r.ip.startsWith("192.0.2.")).length / (to - from);
  assert.ok(perSecond(...EPISODES.spike) > 2 * perSecond(0, 20), "the shared-link spike is visibly busier");
});

test("plain-English explanations follow the detection results and suggest a sensible action", async () => {
  const P = await import("./plain.ts");
  const { createDemoStream, CYCLE_MS } = await import("./live-demo.ts");
  const anchor = Date.UTC(2026, 8, 28, 13, 0), a = E.analyze(createDemoStream(anchor).take(anchor, anchor + CYCLE_MS));
  const say = prefix => P.explainVisitor(a.visitors.find(v => v.ip.startsWith(prefix)));
  const scanner = say("203.0.113.6");
  assert.match(scanner.headline, /password|WordPress/); assert.equal(scanner.advice, "block-if-continues");
  assert.ok(scanner.facts.some(f => /claims to be a web browser/.test(f)));
  const scraper = say("203.0.113.14");
  assert.equal(scraper.headline, "Something is repeatedly hitting your download page");
  assert.ok(scraper.facts.includes("It does not look like a normal web browser"));
  assert.match(scraper.facts[0], /^50 requests in less than a minute$/);
  assert.equal(say("198.51.100.7").headline, "Something keeps submitting the form on /request-app");
  const crawler = say("203.0.113.20");
  assert.equal(crawler.advice, "probably-normal"); assert.match(crawler.adviceText, /search/);
  const monitor = say("198.51.100.9");
  assert.match(monitor.headline, /regular schedule/); assert.equal(monitor.advice, "probably-normal");
  const normal = say("192.0.2.");
  assert.equal(normal.headline, "Looks like an ordinary visitor"); assert.equal(normal.advice, "probably-normal");
  for (const v of a.visitors) { const x = P.explainVisitor(v); assert.ok(x.headline && x.meaning && x.adviceText && x.facts.length, v.ip); }
  assert.equal(P.trafficLevel(30, 30), "Normal"); assert.equal(P.trafficLevel(55, 30), "Busy"); assert.equal(P.trafficLevel(100, 30), "Very busy"); assert.equal(P.trafficLevel(5, 0), "Normal");
});

test("connection state is always one of Not connected, Demo, or Live, and only a real source means Live", async () => {
  const C = await import("./connection.ts");
  assert.equal(C.connectionState(null, false), "disconnected");
  assert.equal(C.connectionState(null, true), "demo");
  const source = { site: "orgtooltank.com", status: "connected", connectedAt: 0, lastEventAt: null, events: [] };
  assert.equal(C.connectionState(source, false), "live");
  assert.equal(C.connectionState(source, true), "live", "a real connection wins over the demo");
  assert.deepEqual(C.statusLabel, { disconnected: "Not connected", demo: "Demo", live: "Live" });
  const now = 10_000_000;
  assert.equal(C.ago(null, now), "nothing yet");
  assert.equal(C.ago(now - 2_000, now), "just now");
  assert.equal(C.ago(now - 42_000, now), "42 sec ago");
  assert.equal(C.ago(now - 3 * 60_000, now), "3 min ago");
  assert.equal(C.ago(now - 2 * 3_600_000, now), "2 hr ago");
  assert.equal(C.connectedFor(now - 45_000, now), "45 sec");
  assert.equal(C.connectedFor(now - 12 * 60_000, now), "12 min");
  assert.equal(C.connectedFor(now - (3 * 60 + 5) * 60_000, now), "3 hr 5 min");
});
