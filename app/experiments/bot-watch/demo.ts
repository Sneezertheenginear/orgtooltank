// A fictional 24-hour access log for Load Example. Every IP address is from the ranges reserved for
// documentation (192.0.2.x, 198.51.100.x, 203.0.113.x) or a private network, so none belong to a real
// visitor. It's produced as log text and goes through the same parser as an uploaded file.
// Seeded, so the example looks the same every time relative to "now".

const BROWSERS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0",
];
const PAGES = ["/", "/", "/", "/about", "/pricing", "/products", "/products/desk-lamp", "/products/shelf", "/blog", "/blog/moving-tips", "/blog/small-spaces", "/contact"];
const ASSETS = ["/assets/site.css", "/assets/app.js", "/images/logo.svg"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function rng(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pad = (n: number) => String(n).padStart(2, "0");
const stamp = (t: number) => { const d = new Date(t); return `${pad(d.getUTCDate())}/${MONTHS[d.getUTCMonth()]}/${d.getUTCFullYear()}:${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} +0000`; };

export function exampleLog(now = Date.now()): string {
  const random = rng(20260928), pick = <T>(list: T[]) => list[Math.floor(random() * list.length)];
  const end = Math.floor(now / 60_000) * 60_000, start = end - 24 * 3_600_000;
  const lines: { t: number; line: string }[] = [];
  const add = (ip: string, t: number, method: string, url: string, status: number, ua: string, bytes = 800 + Math.floor(random() * 20_000), ref = "-") =>
    lines.push({ t, line: `${ip} - - [${stamp(t)}] "${method} ${url} HTTP/1.1" ${status} ${status === 304 ? 0 : bytes} "${ref}" "${ua}"` });

  // Ordinary visitors, busier during the day.
  for (let v = 0; v < 46; v++) {
    const ip = v < 23 ? `192.0.2.${10 + v * 3}` : `198.51.100.${12 + (v - 23) * 4}`, ua = pick(BROWSERS);
    let t = start + (0.25 + 0.7 * random()) * (end - start);
    for (let visit = 0, visits = 1 + Math.floor(random() * 2); visit < visits; visit++) {
      for (let page = 0, pages = 2 + Math.floor(random() * 8); page < pages; page++) {
        const path = pick(PAGES);
        add(ip, t, "GET", path, random() < 0.03 ? 404 : 200, ua);
        if (page === 0) for (const asset of ASSETS) add(ip, t + 400, "GET", asset, visit ? 304 : 200, ua, 5_000, "https://example.com/");
        if (path === "/contact" && random() < 0.25) add(ip, t + 45_000, "POST", "/contact", 200, ua, 400);
        t += 15_000 + random() * 90_000;
      }
      t += 2 * 3_600_000 * random();
      if (t > end) break;
    }
  }

  // A search crawler (says it's Googlebot; the address is fictional).
  for (let i = 0; i < 110; i++) add("203.0.113.20", start + (i + random()) * (end - start) / 110, "GET", pick([...PAGES, "/robots.txt", "/sitemap.xml"]), 200, "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)");

  // An uptime monitor using curl: automated, but steady and harmless.
  for (let t = start; t <= end; t += 5 * 60_000) add("198.51.100.9", t + 7_000, "HEAD", "/", 200, "curl/8.4.0", 0);

  // A load balancer health check on the private network.
  for (let t = start; t <= end; t += 10 * 60_000) add("10.0.0.5", t + 3_000, "GET", "/health", 200, "ELB-HealthChecker/2.0", 2);

  // A WordPress and secrets prober, in a burst in the early hours.
  const probe = start + 6 * 3_600_000 + 10 * 60_000;
  const probePaths: [string, string, number][] = [["GET", "/wp-login.php", 404], ["GET", "/wp-admin/", 404], ["POST", "/xmlrpc.php", 404], ["POST", "/wp-login.php", 404], ["GET", "/.env", 404], ["GET", "/.git/config", 403], ["GET", "/phpmyadmin/", 404], ["GET", "/backup.zip", 404], ["GET", "/wp-content/plugins/", 404]];
  for (let i = 0; i < 190; i++) { const [method, url, status] = i < 70 ? probePaths[i % 4] : pick(probePaths); add("203.0.113.66", probe + i * 1_150 + random() * 900, method, url, status, BROWSERS[0].replace("128.0.0.0", "74.0.3729.169"), 150); }

  // A scanner requesting pages that don't exist.
  const scan = start + 14 * 3_600_000;
  for (let i = 0; i < 95; i++) add("198.51.100.200", scan + i * 11_000, "GET", pick(["/admin.php", "/old/index.html", `/archive/page-${i}.html`, "/login.aspx", "/test.php", "/cgi-bin/status"]), 404, "Mozilla/5.0 zgrab/0.x", 150);

  // A contact-form spammer.
  const spam = start + 17 * 3_600_000;
  for (let i = 0; i < 44; i++) add("198.51.100.77", spam + i * 150_000 + random() * 30_000, "POST", "/contact", 200, BROWSERS[3], 400, "https://example.com/contact");

  // A script copying the product API.
  const scrape = start + 20 * 3_600_000;
  for (let i = 0; i < 260; i++) add("203.0.113.140", scrape + i * 30_000 + random() * 5_000, "GET", `/api/products?page=${(i % 26) + 1}`, 200, "python-requests/2.31.0", 3_200);

  return lines.filter(l => l.t >= start && l.t <= end).sort((a, b) => a.t - b.t).map(l => l.line).join("\n");
}
