// Reads website traffic files (access logs, or JSON/CSV log exports such as Vercel's) and explains which
// visitors look automated or suspicious, and why.
// Every flag comes from a plain rule with evidence the user can read. There is no hidden score, and
// nothing here can block anyone: decisions only produce rules the user copies to their own server.

import Papa from "papaparse";

/** `ip` is the visitor key: the client IP address, or the user agent when the file has no IP addresses. */
export type Req = { ip: string; time: number; method: string; path: string; url: string; status: number; bytes: number; referrer: string; ua: string };
export type Label = "normal" | "automated" | "suspicious";
export const labelName: Record<Label, string> = { normal: "Normal", automated: "Likely automated", suspicious: "Suspicious" };

// ---------- Parsing (Apache/Nginx "combined" and "common" log formats) ----------

const LINE = /^(\S+) \S+ \S+ \[([^\]]+)\] "((?:[^"\\]|\\.)*)" (\d{3}) (\S+)(?: "((?:[^"\\]|\\.)*)" "((?:[^"\\]|\\.)*)")?/;
const STAMP = /^(\d{1,2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2}) ([+-])(\d{2})(\d{2})$/;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MAX_LINES = 500_000;

export function parseTime(stamp: string): number | null {
  const m = STAMP.exec(stamp);
  if (!m) return null;
  const month = MONTHS.indexOf(m[2]);
  if (month < 0) return null;
  const offset = (m[7] === "-" ? -1 : 1) * (Number(m[8]) * 60 + Number(m[9])) * 60_000;
  return Date.UTC(+m[3], month, +m[1], +m[4], +m[5], +m[6]) - offset;
}

export function parseLine(line: string): Req | null {
  const m = LINE.exec(line);
  if (!m) return null;
  const time = parseTime(m[2]);
  if (time === null) return null;
  const parts = m[3].split(" ");
  const valid = parts.length >= 2 && /^[A-Z]{3,10}$/.test(parts[0]);
  const url = valid ? parts[1] : "(malformed request)";
  const q = url.indexOf("?");
  return {
    ip: m[1], time, method: valid ? parts[0] : "-", url, path: q >= 0 ? url.slice(0, q) || "/" : url,
    status: Number(m[4]), bytes: m[5] === "-" ? 0 : Number(m[5]) || 0,
    referrer: m[6] && m[6] !== "-" ? m[6] : "", ua: m[7] && m[7] !== "-" ? m[7] : "",
  };
}

export function parseLog(text: string): { requests: Req[]; skipped: number; lines: number; truncated: boolean } {
  const lines = text.split(/\r?\n/);
  const requests: Req[] = [];
  let skipped = 0, count = 0;
  for (const line of lines) {
    if (!line.trim()) continue;
    if (++count > MAX_LINES) break;
    const req = parseLine(line);
    if (req) requests.push(req); else skipped++;
  }
  requests.sort((a, b) => a.time - b.time);
  return { requests, skipped, lines: Math.min(count, MAX_LINES), truncated: count > MAX_LINES };
}

// ---------- Traffic files: access logs, JSON / NDJSON, and CSV exports ----------

export type Identity = "ip" | "userAgent";
export type TrafficFile = { requests: Req[]; skipped: number; lines: number; truncated: boolean; format: "access log" | "JSON" | "CSV"; identity: Identity };

/**
 * Field names Bot Watch looks for in JSON and CSV exports, most specific first. Keys are compared
 * lowercase with punctuation removed, so "proxy.clientIp", "client_ip", and "Client IP" all match.
 * Vercel's documented log format nests request details under "proxy", so those come first there
 * (its top-level "path" is the function route, not the requested URL).
 */
const FIELDS = {
  time: ["proxytimestamp", "timestamp", "time", "datetime", "date", "ts", "requesttime", "createdat"],
  path: ["proxypath", "requestpath", "path", "url", "uri", "requesturi", "requesturl", "pathname"],
  query: ["searchparams", "querystring", "query"],
  method: ["proxymethod", "requestmethod", "method", "httpmethod"],
  status: ["proxystatuscode", "responsestatuscode", "statuscode", "status", "responsestatus", "httpstatus"],
  ua: ["proxyuseragent", "requestuseragent", "useragent", "httpuseragent", "ua"],
  ip: ["proxyclientip", "clientip", "ip", "ipaddress", "clientipaddress", "remoteaddr", "remoteaddress", "remoteip", "sourceip", "xforwardedfor", "visitorip"],
  referrer: ["proxyreferer", "referer", "referrer"],
  bytes: ["proxyresponsebytesize", "responsebytesize", "bytes", "bodybytessent", "size"],
  id: ["requestid", "proxyvercelid", "id"],
};
const norm = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, "");
function flatten(value: unknown, prefix = "", out: Record<string, unknown> = {}) {
  if (value && typeof value === "object" && !Array.isArray(value)) for (const [k, v] of Object.entries(value)) flatten(v, prefix + k, out);
  else out[norm(prefix)] = value;
  return out;
}
const pickField = (row: Record<string, unknown>, names: string[]) => { for (const n of names) if (row[n] !== undefined && row[n] !== null && row[n] !== "") return row[n]; return undefined; };
const asText = (v: unknown) => Array.isArray(v) ? String(v[0] ?? "") : v === undefined ? "" : String(v);
export function parseWhen(v: unknown): number | null {
  if (typeof v === "number" || (typeof v === "string" && /^\d{9,}(\.\d+)?$/.test(v.trim()))) { const n = Number(v); return n < 1e12 ? Math.round(n * 1000) : Math.round(n); }
  if (typeof v !== "string" || !v.trim()) return null;
  const text = v.trim();
  const clf = parseTime(text.replace(/^\[|\]$/g, ""));
  if (clf !== null) return clf;
  // Dashboards often show times in UTC without saying so; treat a time with no zone as UTC.
  const iso = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(text) ? `${text.replace(" ", "T")}Z` : text;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}
function splitUrl(raw: string) {
  let url = raw.trim() || "(unknown path)";
  if (/^https?:\/\//i.test(url)) { try { const u = new URL(url); url = u.pathname + u.search; } catch { /* keep as is */ } }
  const q = url.indexOf("?");
  return { url, path: q >= 0 ? url.slice(0, q) || "/" : url };
}

/** Turns flattened records into requests. Returns how many were skipped for missing a time or path. */
function fromRecords(rows: Record<string, unknown>[]): { requests: Req[]; skipped: number; identity: Identity } {
  const seen = new Set<string>(), requests: Req[] = [];
  let skipped = 0, withIp = 0;
  for (const row of rows) {
    const time = parseWhen(pickField(row, FIELDS.time)), rawPath = asText(pickField(row, FIELDS.path));
    if (time === null || !rawPath) { skipped++; continue; }
    // One request can produce several log lines (one per console message); keep it once.
    const id = asText(pickField(row, FIELDS.id));
    if (id && pickField(row, ["requestid"]) !== undefined) { if (seen.has(id)) continue; seen.add(id); }
    const query = asText(pickField(row, FIELDS.query));
    const { url, path } = splitUrl(query && !rawPath.includes("?") ? `${rawPath}?${query.replace(/^\?/, "")}` : rawPath);
    const status = Number(asText(pickField(row, FIELDS.status)));
    const ip = asText(pickField(row, FIELDS.ip)).split(",")[0].trim();
    if (ip) withIp++;
    const ua = asText(pickField(row, FIELDS.ua)).trim();
    requests.push({
      ip, time, url, path, method: asText(pickField(row, FIELDS.method)).toUpperCase() || "GET",
      status: Number.isInteger(status) && status >= 100 && status <= 599 ? status : 0,
      bytes: Number(asText(pickField(row, FIELDS.bytes))) || 0, referrer: asText(pickField(row, FIELDS.referrer)), ua: ua === "-" ? "" : ua,
    });
  }
  // Without IP addresses, visitors can only be told apart by the browser or tool they report.
  const identity: Identity = requests.length && withIp / requests.length >= 0.5 ? "ip" : "userAgent";
  if (identity === "userAgent") for (const r of requests) r.ip = r.ua || "(no user agent)";
  else for (const r of requests) if (!r.ip) r.ip = "(no IP address)";
  return { requests, skipped, identity };
}

function jsonRecords(text: string): unknown[] | null {
  const trimmed = text.trim();
  try {
    const data = JSON.parse(trimmed);
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
      const list = Object.values(data).find(v => Array.isArray(v) && v.some(x => x && typeof x === "object"));
      return (list as unknown[] | undefined) ?? [data];
    }
  } catch { /* not a single JSON document; try one JSON object per line */ }
  const rows: unknown[] = [];
  for (const line of trimmed.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try { rows.push(JSON.parse(line)); } catch { rows.push(null); }
  }
  return rows.length && rows.some(Boolean) ? rows : null;
}

/** Reads any supported traffic file: an Apache/Nginx access log, JSON or NDJSON records, or a CSV export. */
export function parseTraffic(text: string): TrafficFile {
  const body = text.replace(/^\uFEFF/, "");
  const start = body.trimStart()[0];
  if (start === "[" || start === "{") {
    const records = jsonRecords(body);
    if (records) {
      const limited = records.slice(0, MAX_LINES);
      const { requests, skipped, identity } = fromRecords(limited.map(r => r && typeof r === "object" ? flatten(r) : {}));
      requests.sort((a, b) => a.time - b.time);
      return { requests, skipped, lines: limited.length, truncated: records.length > MAX_LINES, format: "JSON", identity };
    }
  }
  const firstLine = body.split(/\r?\n/, 1)[0] ?? "";
  if (!LINE.test(firstLine) && firstLine.includes(",")) {
    const parsed = Papa.parse<Record<string, string>>(body, { header: true, skipEmptyLines: "greedy", transformHeader: norm });
    const headers = parsed.meta.fields ?? [];
    if (FIELDS.time.some(f => headers.includes(f)) && FIELDS.path.some(f => headers.includes(f))) {
      const rows = parsed.data.slice(0, MAX_LINES);
      const { requests, skipped, identity } = fromRecords(rows);
      requests.sort((a, b) => a.time - b.time);
      return { requests, skipped, lines: rows.length, truncated: parsed.data.length > MAX_LINES, format: "CSV", identity };
    }
  }
  return { ...parseLog(body), format: "access log", identity: "ip" };
}

// ---------- Rules ----------

/** Paths that scanners probe for. Matching one isn't proof of anything; asking for them when they don't exist is the signal. */
export const PROBES: { pattern: RegExp; what: string }[] = [
  { pattern: /^\/wp-(admin|login\.php|content|includes)(\/|$)|\/wp-login\.php$/i, what: "WordPress admin or login" },
  { pattern: /\/xmlrpc\.php$/i, what: "WordPress XML-RPC" },
  { pattern: /(^|\/)\.(env|git|aws|ssh|htpasswd|DS_Store)(\/|$|\.)/i, what: "hidden config or secrets file" },
  { pattern: /phpmyadmin|\/pma(\/|$)|\/myadmin(\/|$)/i, what: "database admin panel" },
  { pattern: /\/(cgi-bin|vendor\/phpunit|boaform|hnap1|actuator)(\/|$)/i, what: "known exploit target" },
  { pattern: /\.(bak|sql|old|swp)$|\/backup\.(zip|tar|gz|tgz)$/i, what: "backup or database file" },
  { pattern: /\/(setup|install|shell|eval-stdin)\.php$/i, what: "PHP setup or shell script" },
];
export const probeOf = (path: string) => PROBES.find(p => p.pattern.test(path))?.what ?? null;

const TOOL_UA = /curl\/|wget\/|python-requests|python-urllib|aiohttp|go-http-client|okhttp|java\/|libwww-perl|scrapy|apache-httpclient|axios\/|node-fetch|headlesschrome|phantomjs/i;
const SCANNER_UA = /masscan|zgrab|nmap|nikto|sqlmap|nuclei|wpscan|dirbuster|gobuster/i;
const DECLARED_BOT = /bot\b|bot\/|crawler|spider|slurp|facebookexternalhit|bingpreview/i;
const SEARCH_CRAWLER = /googlebot|bingbot|duckduckbot|applebot|yandexbot|baiduspider/i;
const STATIC = /\.(css|js|mjs|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|map)$/i;

/** Thresholds for each rule, kept together so they're easy to read and tune. */
export const RULES = {
  /** Requests for missing pages: at least this many 404s, making up at least half the visitor's requests. */
  notFoundMin: 10, notFoundShare: 0.5,
  /** Requests in one minute that suggest automation, and a rate that's a concern on its own. */
  burstPerMinute: 60, heavyPerMinute: 150,
  /** POSTs to one path (forms, logins, APIs). */
  repeatedPosts: 10,
  /** Hits on one non-static page from one visitor within an hour. (A monitor checking every few minutes stays under this.) */
  repeatedHits: 50,
  /** A missing-page path with at least this many hits is flagged in the paths panel. */
  pathNotFoundMin: 5,
};

export type Reason = { text: string; concern: boolean };
/** The raw results behind the reasons, so explanations can be written from facts rather than from reason text. */
export type Signals = {
  probeMisses: number; probeKinds: string[]; loginPosts: number; notFound: number;
  repeatedPosts: [string, number][]; repeatedHits: [string, number][];
  heavy: boolean; burst: boolean; scanner: boolean; noUa: boolean; tool: boolean; declaredBot: boolean; searchCrawler: boolean;
  privateIp: boolean; probePathsExist: boolean; browserLike: boolean;
};
export type Visitor = {
  ip: string; requests: Req[]; first: number; last: number; peakPerMinute: number;
  label: Label; reasons: Reason[]; notes: string[]; signals: Signals;
  agents: [string, number][]; paths: [string, number][]; statuses: [number, number][];
  /** Paths this visitor hit repeatedly, used to flag paths in the paths panel. */
  repeatedPaths: string[];
};

const tally = <K>(items: K[]) => { const map = new Map<K, number>(); for (const k of items) map.set(k, (map.get(k) ?? 0) + 1); return [...map.entries()].sort((a, b) => b[1] - a[1]); };
const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

/** The most requests inside any sliding window of `windowMs` (requests must be sorted by time). */
function peakIn(reqs: Req[], windowMs: number) {
  let peak = 0, start = 0;
  for (let end = 0; end < reqs.length; end++) {
    while (reqs[end].time - reqs[start].time >= windowMs) start++;
    peak = Math.max(peak, end - start + 1);
  }
  return peak;
}
export function isPrivateIp(ip: string) {
  return /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fc|fd|fe80)/i.test(ip);
}

export function analyzeVisitor(ip: string, reqs: Req[], identity: Identity = "ip"): Visitor {
  const reasons: Reason[] = [], notes: string[] = [];
  const agents = tally(reqs.map(r => r.ua || "(none)"));
  const mainUa = agents[0][0];
  const peak = peakIn(reqs, 60_000);

  // Concerns: behavior that suggests probing, abuse, or scanning.
  const probeMisses = reqs.filter(r => probeOf(r.path) && r.status >= 400);
  const kinds = [...new Set(probeMisses.map(r => probeOf(r.path)!))];
  const repeatedPosts: [string, number][] = [], repeatedHits: [string, number][] = [];
  if (probeMisses.length) {
    const top = tally(probeMisses.map(r => r.path))[0];
    reasons.push({ concern: true, text: `Probed ${plural(probeMisses.length, "time")} for paths that don't exist here (${kinds.join(", ")}), most often ${top[0]}` });
  }
  const repeatedPaths: string[] = [];
  const loginPosts = reqs.filter(r => r.method === "POST" && /wp-login\.php$|xmlrpc\.php$/i.test(r.path));
  if (loginPosts.length >= 5) {
    repeatedPaths.push(...new Set(loginPosts.map(r => r.path)));
    reasons.push({ concern: true, text: `Sent ${plural(loginPosts.length, "POST request")} to a WordPress login or XML-RPC path, which is typical of password guessing` });
  }
  const notFound = reqs.filter(r => r.status === 404).length;
  if (notFound >= RULES.notFoundMin && notFound / reqs.length >= RULES.notFoundShare) reasons.push({ concern: true, text: `${notFound.toLocaleString("en-US")} of ${plural(reqs.length, "request")} were for pages that don't exist (404)` });
  for (const [path, n] of tally(reqs.filter(r => r.method === "POST").map(r => r.path))) {
    if (n < RULES.repeatedPosts || /wp-login\.php$|xmlrpc\.php$/i.test(path)) continue;
    repeatedPaths.push(path); repeatedPosts.push([path, n]);
    reasons.push({ concern: true, text: `Sent ${plural(n, "POST request")} to ${path} (a form or API endpoint)` });
  }
  for (const [path, n] of tally(reqs.filter(r => r.method !== "POST" && !STATIC.test(r.path)).map(r => r.path))) {
    if (n < RULES.repeatedHits) break;
    const perHour = peakIn(reqs.filter(r => r.path === path && r.method !== "POST"), 60 * 60_000);
    if (perHour < RULES.repeatedHits) continue;
    repeatedPaths.push(path); repeatedHits.push([path, n]);
    reasons.push({ concern: true, text: `Requested ${path} ${plural(n, "time")}, up to ${perHour.toLocaleString("en-US")} in one hour` });
  }
  if (peak >= RULES.heavyPerMinute) reasons.push({ concern: true, text: `Very high request rate: up to ${plural(peak, "request")} in one minute` });
  if (SCANNER_UA.test(mainUa)) reasons.push({ concern: true, text: `User agent names a security scanner: ${mainUa}` });

  // Automation signals: not a problem by themselves.
  if (mainUa === "(none)") reasons.push({ concern: false, text: "Sent no user agent, which browsers always send" });
  else if (TOOL_UA.test(mainUa)) reasons.push({ concern: false, text: `User agent is a script or tool, not a browser: ${mainUa}` });
  else if (DECLARED_BOT.test(mainUa) && !SCANNER_UA.test(mainUa)) reasons.push({ concern: false, text: `Says it's a crawler or bot: ${mainUa}` });
  if (peak >= RULES.burstPerMinute && peak < RULES.heavyPerMinute) reasons.push({ concern: false, text: `Fast pace: up to ${plural(peak, "request")} in one minute` });

  // Things to know before blocking.
  if (SEARCH_CRAWLER.test(mainUa)) notes.push("It says it's a search engine crawler. Blocking real search crawlers can remove your site from search results. User agents can be faked, so confirm with a reverse DNS lookup before trusting or blocking it.");
  if (identity === "ip" && isPrivateIp(ip)) notes.push("This is a private network address. It may be your own server, a load balancer or proxy, or someone on your network. Blocking it could block legitimate traffic.");
  if (reqs.some(r => probeOf(r.path) && r.status < 400)) notes.push("Some probe-style paths returned success here, which means they exist on your site (for example, a WordPress install). Your own logins may use these paths too.");

  const label: Label = reasons.some(r => r.concern) ? "suspicious" : reasons.length ? "automated" : "normal";
  const noUa = mainUa === "(none)", scanner = SCANNER_UA.test(mainUa), tool = !noUa && TOOL_UA.test(mainUa), declaredBot = !noUa && !tool && !scanner && DECLARED_BOT.test(mainUa);
  const signals: Signals = {
    probeMisses: probeMisses.length, probeKinds: kinds, loginPosts: loginPosts.length, notFound, repeatedPosts, repeatedHits,
    heavy: peak >= RULES.heavyPerMinute, burst: peak >= RULES.burstPerMinute, scanner, noUa, tool, declaredBot, searchCrawler: SEARCH_CRAWLER.test(mainUa),
    privateIp: identity === "ip" && isPrivateIp(ip), probePathsExist: reqs.some(r => probeOf(r.path) && r.status < 400),
    browserLike: !noUa && !tool && !scanner && !declaredBot && /mozilla\/5\.0/i.test(mainUa),
  };
  return {
    ip, requests: reqs, first: reqs[0].time, last: reqs[reqs.length - 1].time, peakPerMinute: peak,
    label, reasons: reasons.sort((a, b) => Number(b.concern) - Number(a.concern)), notes, signals,
    agents, paths: tally(reqs.map(r => r.path)), statuses: tally(reqs.map(r => r.status)), repeatedPaths,
  };
}

// ---------- Whole-log analysis ----------

export type PathStat = { path: string; count: number; notFound: number; posts: number; visitors: number; flag: string | null };
export type Analysis = {
  identity: Identity; requests: Req[]; visitors: Visitor[]; byIp: Map<string, Visitor>; paths: PathStat[];
  first: number; last: number; refused: number;
  counts: Record<Label, { visitors: number; requests: number }>;
};

const labelRank: Record<Label, number> = { suspicious: 0, automated: 1, normal: 2 };

export function analyze(requests: Req[], identity: Identity = "ip"): Analysis {
  const groups = new Map<string, Req[]>();
  for (const r of requests) { const list = groups.get(r.ip); if (list) list.push(r); else groups.set(r.ip, [r]); }
  const visitors = [...groups.entries()].map(([ip, reqs]) => analyzeVisitor(ip, reqs, identity))
    .sort((a, b) => labelRank[a.label] - labelRank[b.label] || b.requests.length - a.requests.length);
  const byIp = new Map(visitors.map(v => [v.ip, v]));

  const repeated = new Set(visitors.filter(v => v.label === "suspicious").flatMap(v => v.repeatedPaths));
  const pathMap = new Map<string, { count: number; notFound: number; posts: number; ips: Set<string> }>();
  for (const r of requests) {
    let p = pathMap.get(r.path);
    if (!p) { p = { count: 0, notFound: 0, posts: 0, ips: new Set() }; pathMap.set(r.path, p); }
    p.count++; p.ips.add(r.ip);
    if (r.status === 404) p.notFound++;
    if (r.method === "POST") p.posts++;
  }
  const paths = [...pathMap.entries()].map(([path, p]) => {
    const probe = probeOf(path);
    // A probe-style path that exists on this site (say, a real WordPress login) isn't flagged just for its name.
    const flag = probe && p.notFound > 0 ? `Probe target: ${probe}`
      : p.count >= RULES.pathNotFoundMin && p.notFound / p.count >= 0.8 ? "Page doesn't exist (404)"
      : repeated.has(path) ? (p.posts > p.count / 2 ? "Repeated form, login, or API posts" : "Repeated hits from one visitor")
      : null;
    return { path, count: p.count, notFound: p.notFound, posts: p.posts, visitors: p.ips.size, flag };
  }).sort((a, b) => b.count - a.count);

  const counts = { normal: { visitors: 0, requests: 0 }, automated: { visitors: 0, requests: 0 }, suspicious: { visitors: 0, requests: 0 } };
  for (const v of visitors) { counts[v.label].visitors++; counts[v.label].requests += v.requests.length; }
  return {
    identity, requests, visitors, byIp, paths, counts,
    first: requests[0]?.time ?? 0, last: requests[requests.length - 1]?.time ?? 0,
    refused: requests.filter(r => r.status === 403).length,
  };
}

// ---------- Time buckets and spikes ----------

const MINUTE = 60_000, HOUR = 60 * MINUTE;
export const BUCKET_SIZES = [MINUTE, 5 * MINUTE, 15 * MINUTE, 30 * MINUTE, HOUR, 3 * HOUR, 6 * HOUR, 24 * HOUR];
export type Bin = { start: number; normal: number; automated: number; suspicious: number; total: number };

/** Buckets aligned to local clock time, sized so there are at most `maxBins` of them. */
export function bucketize(requests: Req[], labelOf: (ip: string) => Label, from: number, to: number, maxBins = 72, fixedSize?: number): { size: number; bins: Bin[] } {
  const span = Math.max(to - from, MINUTE);
  const size = fixedSize ?? BUCKET_SIZES.find(s => span / s <= maxBins) ?? BUCKET_SIZES[BUCKET_SIZES.length - 1];
  const align = (t: number) => { const local = t - new Date(t).getTimezoneOffset() * MINUTE; return t - (((local % size) + size) % size); };
  const start = align(from), count = Math.floor((to - start) / size) + 1;
  const bins: Bin[] = Array.from({ length: count }, (_, i) => ({ start: start + i * size, normal: 0, automated: 0, suspicious: 0, total: 0 }));
  for (const r of requests) {
    const i = Math.floor((r.time - start) / size);
    if (i < 0 || i >= count) continue;
    bins[i][labelOf(r.ip)]++; bins[i].total++;
  }
  return { size, bins };
}

export function spike(bins: Bin[]): { peak: Bin; typical: number; ratio: number; isSpike: boolean } | null {
  if (!bins.length) return null;
  const peak = bins.reduce((a, b) => (b.total > a.total ? b : a));
  const sorted = bins.map(b => b.total).sort((a, b) => a - b);
  const typical = sorted[Math.floor(sorted.length / 2)];
  const ratio = typical ? peak.total / typical : peak.total ? Infinity : 0;
  return { peak, typical, ratio, isSpike: bins.length >= 6 && peak.total >= 20 && ratio >= 3 };
}

// ---------- Formatting ----------

export const bucketLabel = (size: number) => size >= 24 * HOUR ? "day" : size >= HOUR ? `${size / HOUR === 1 ? "hour" : `${size / HOUR} hours`}` : `${size / MINUTE === 1 ? "minute" : `${size / MINUTE} minutes`}`;
export const fmtTime = (t: number, withDate = true) => new Date(t).toLocaleString("en-US", { ...(withDate ? { month: "short", day: "numeric" } : {}), hour: "numeric", minute: "2-digit" });
export function fmtDuration(ms: number) {
  if (ms < MINUTE) return `${Math.max(1, Math.round(ms / 1000))} sec`;
  if (ms < HOUR) return `${Math.round(ms / MINUTE)} min`;
  if (ms < 48 * HOUR) { const h = Math.floor(ms / HOUR), m = Math.round((ms % HOUR) / MINUTE); return m ? `${h} hr ${m} min` : `${h} hr`; }
  return `${Math.round(ms / (24 * HOUR))} days`;
}
export const statusClass = (code: number) => code >= 500 ? "5xx Server error" : code >= 400 ? "4xx Client error" : code >= 300 ? "3xx Redirect" : "2xx Success";

// ---------- Decisions and blocklist ----------

export type Decision = "watch" | "allow" | "block";
export const DECISIONS_KEY = "orgtooltank:bot-watch:decisions:v1";
export function parseDecisions(raw: string | null): Record<string, Decision> {
  try {
    const data = JSON.parse(raw ?? "{}");
    const out: Record<string, Decision> = {};
    if (data && typeof data === "object") for (const [ip, d] of Object.entries(data)) if (/^[0-9a-f.:]{3,45}$/i.test(ip) && (d === "watch" || d === "allow" || d === "block")) out[ip] = d;
    return out;
  } catch { return {}; }
}
export const blocklist = (ips: string[]) => ({
  nginx: ips.map(ip => `deny ${ip};`).join("\n"),
  apache: ["<RequireAll>", "    Require all granted", ...ips.map(ip => `    Require not ip ${ip}`), "</RequireAll>"].join("\n"),
  plain: ips.join("\n"),
});
