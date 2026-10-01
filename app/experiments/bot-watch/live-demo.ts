// SAMPLE traffic for the Demo Live View. None of it is real: every IP address comes from the ranges
// reserved for documentation (192.0.2.x, 198.51.100.x, 203.0.113.x), and nothing here connects to a
// website. It exists to show how Live View will look once a real traffic connection is added.
//
// A five-minute "story" repeats: steady visitors, a crawler and an uptime monitor all the time, plus
// an admin-path scanner, a burst of normal visitors (a link got shared), a form spammer, and a script
// copying an API. Each second's requests come from a generator seeded by that second, so the same
// moment always produces the same requests, however the ticks are chunked.
import type { Req } from "./engine";

export const DEMO_SITE = "orgtooltank.com";
export const CYCLE_MS = 300_000;
/** Where in the story each episode runs, in seconds from the start of the cycle. */
export const EPISODES = { scanner: [20, 110], spike: [120, 150], formSpam: [160, 230], scraper: [240, 290] } as const;

const BROWSERS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0",
];
const PAGES = ["/", "/", "/experiments", "/experiments", "/categories", "/about", "/experiments/bot-watch", "/experiments/obd-code-lookup/try", "/experiments/pod-chaser", "/shop", "/request-app", "/tools"];
const SCAN: [string, string, number][] = [["GET", "/wp-admin/", 404], ["POST", "/xmlrpc.php", 404], ["GET", "/wp-login.php", 404], ["GET", "/admin", 404], ["GET", "/.env", 404], ["GET", "/phpmyadmin/", 404], ["GET", "/.git/config", 403]];

function rng(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const req = (ip: string, time: number, method: string, url: string, status: number, ua: string, referrer = ""): Req => {
  const q = url.indexOf("?");
  return { ip, time, method, url, path: q >= 0 ? url.slice(0, q) : url, status, bytes: status === 304 || method === "HEAD" ? 0 : 1_200, referrer, ua };
};

export type DemoStream = { take(from: number, to: number): Req[]; position(t: number): number };

/**
 * `anchor` is the moment the story's cycle starts. Live View sets it so the page opens partway
 * through the scanner episode, with a few minutes of history already on the chart.
 */
export function createDemoStream(anchor: number, seed = 7): DemoStream {
  const position = (t: number) => ((((t - anchor) % CYCLE_MS) + CYCLE_MS) % CYCLE_MS) / 1000;
  const within = (p: number, [a, b]: readonly [number, number]) => p >= a && p < b;

  function second(s: number): Req[] {
    const random = rng(seed ^ Math.imul(s, 2654435761)), out: Req[] = [];
    const base = s * 1000, at = () => base + Math.floor(random() * 1000);
    const p = Math.floor(position(base)), round = Math.floor((base - anchor) / CYCLE_MS);
    const spike = within(p, EPISODES.spike);

    // Ordinary visitors, busier during the shared-link spike.
    const rate = spike ? 3.4 : 0.9;
    let count = 0;
    for (let i = 0; i < 6; i++) if (random() < rate / 6) count++;
    for (let i = 0; i < count; i++) {
      const v = Math.floor(random() * 24), path = spike && random() < 0.7 ? "/experiments/bot-watch" : PAGES[Math.floor(random() * PAGES.length)];
      out.push(req(`192.0.2.${20 + v * 3}`, at(), "GET", path, random() < 0.03 ? 404 : 200, BROWSERS[v % BROWSERS.length], spike ? "https://news.example/post" : ""));
    }
    // A crawler that says it's Googlebot, and a curl uptime monitor: automated, but steady.
    if (s % 12 === 0) out.push(req("203.0.113.20", at(), "GET", PAGES[Math.floor(random() * PAGES.length)], 200, "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"));
    if (s % 30 === 0) out.push(req("198.51.100.9", base + 50, "HEAD", "/", 200, "curl/8.4.0"));
    // Admin-path scanner: 30 requests in 90 seconds, all for pages that don't exist.
    if (within(p, EPISODES.scanner) && (p - EPISODES.scanner[0]) % 3 === 0) {
      const [method, url, status] = SCAN[((p - EPISODES.scanner[0]) / 3) % SCAN.length];
      out.push(req(`203.0.113.${60 + ((round % 20) + 20) % 20}`, at(), method, url, status, BROWSERS[0].replace("128.0.0.0", "74.0.3729.169")));
    }
    // Form spam: the request form submitted every five seconds.
    if (within(p, EPISODES.formSpam) && (p - EPISODES.formSpam[0]) % 5 === 0) out.push(req(`198.51.100.${70 + ((round % 20) + 20) % 20}`, at(), "POST", "/request-app", 200, BROWSERS[3], `https://${DEMO_SITE}/request-app`));
    // A script copying an API, one page a second.
    if (within(p, EPISODES.scraper)) out.push(req(`203.0.113.${140 + ((round % 20) + 20) % 20}`, at(), "GET", `/api/downloads?page=${p - EPISODES.scraper[0] + 1}`, 200, "python-requests/2.31.0"));
    return out;
  }

  return {
    position,
    take(from, to) {
      const out: Req[] = [];
      for (let s = Math.floor(from / 1000); s <= Math.floor(to / 1000); s++) for (const r of second(s)) if (r.time > from && r.time <= to) out.push(r);
      return out.sort((a, b) => a.time - b.time);
    },
  };
}
