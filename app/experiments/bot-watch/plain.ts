// Plain-English explanations for people who aren't technical. Everything here is written from the
// same detection results the technical view shows (Visitor.signals), so the two never disagree.
// Explanations describe what the requests look like; they never claim to know who is behind them.
import { fmtDuration, type Visitor } from "./engine";

export type Advice = "block-if-continues" | "watch" | "probably-normal";
export const adviceName: Record<Advice, string> = { "block-if-continues": "Block it if it continues", watch: "Watch it", "probably-normal": "Probably normal" };
export type Explanation = { headline: string; facts: string[]; meaning: string; advice: Advice; adviceText: string };

/** A friendly name for a page: "/api/downloads" → "download page", "/request-app" → "/request-app page". */
function pageName(path: string) {
  if (/download/i.test(path)) return "download page";
  if (path === "/" || path === "") return "home page";
  return `${path} page`;
}
function howLong(ms: number) {
  return ms < 60_000 ? "less than a minute" : fmtDuration(ms);
}

export function explainVisitor(v: Visitor): Explanation {
  const s = v.signals, n = v.requests.length;
  const facts = [`${n.toLocaleString("en-US")} ${n === 1 ? "request" : "requests"} in ${howLong(v.last - v.first)}`];
  if (s.tool || s.noUa || s.scanner) facts.push("It does not look like a normal web browser");
  else if (s.declaredBot) facts.push(s.searchCrawler ? "It says it’s a search engine crawler" : "It says it’s a bot");
  else if (s.browserLike && v.label === "suspicious") facts.push("It claims to be a web browser, but people using browsers don’t do this");
  if (s.notFound >= 5) facts.push(`${s.notFound.toLocaleString("en-US")} of those were for pages that don’t exist`);

  const block = (headline: string, meaning: string, adviceText = "There’s no normal reason for a visitor to do this. If it keeps going, block it."): Explanation =>
    ({ headline, facts, meaning, advice: s.probePathsExist ? "watch" : "block-if-continues", adviceText: s.probePathsExist ? "Some of these pages exist on your site, so check whether this could be you or your team before blocking." : adviceText });
  const kinds = s.probeKinds.join(" ");

  if (s.loginPosts >= 5) return block("Something is trying to guess the password on a login page",
    "Automated programs try common passwords on WordPress login pages, hoping to get in. If your site doesn’t use WordPress, these attempts fail, but it’s still unwanted traffic.");
  if (s.probeMisses > 0 && /WordPress/.test(kinds)) return block("Something is checking your site for WordPress admin pages",
    "Automated scanners check thousands of websites for WordPress admin pages and known weak spots. It’s usually not personal: they’re looking for any site they can break into.");
  if (s.probeMisses > 0 && /secrets|backup/.test(kinds)) return block("Something is looking for hidden settings or backup files",
    "Some bots look for files that accidentally contain passwords or keys, like .env files or backups. Your site answered “not found” or refused, which is good.");
  if (s.probeMisses > 0) return block("Something is checking your site for admin or setup pages",
    "Scanners look for admin panels and setup pages that are often left open by mistake. Your site answered “not found” or refused.");
  if (s.scanner) return block("A security scanning tool is scanning your site",
    "The program names itself as a security scanner. Security testers use these, but so do attackers looking for weak spots.");
  if (s.repeatedPosts.length) return block(`Something keeps submitting the form on ${s.repeatedPosts[0][0]}`,
    "A person rarely submits the same form this many times. This is usually spam being sent through your form.",
    "Watch your form submissions. If it keeps going, block it.");
  if (s.repeatedHits.length) return block(`Something is repeatedly hitting your ${pageName(s.repeatedHits[0][0])}`,
    "It’s fetching the same page over and over, faster than a person would. That’s usually a script copying your content or data.",
    "If you didn’t set this up and it keeps going, block it.");
  if (s.heavy) return block("Something is sending requests very fast",
    "No person browses this fast. This is almost certainly a program, and very fast traffic can slow your site down.");
  if (v.label === "suspicious") return { headline: "Something is asking for lots of pages that don’t exist", facts,
    meaning: "Scanners ask for many missing pages while looking for weak spots. Real visitors rarely run into this many broken links.",
    advice: "watch", adviceText: "Keep an eye on it. If it keeps going, block it." };

  // Automated but not suspicious.
  const monitor = v.paths.length === 1 && n >= 3 && v.peakPerMinute <= 2 && (s.tool || s.noUa);
  if (s.searchCrawler) return { headline: "A search engine crawler is reading your pages", facts,
    meaning: "Search engines use crawlers to list your pages in search results. That’s normally a good thing. Crawler names can be faked, though.",
    advice: "probably-normal", adviceText: "Leave it alone unless it slows your site. Blocking real search crawlers can hurt how you show up in search." };
  if (monitor) return { headline: `Something checks your ${pageName(v.paths[0][0])} on a regular schedule`, facts,
    meaning: "Steady, regular checks of one page usually come from an uptime monitor that makes sure your site is working.",
    advice: "probably-normal", adviceText: "If you or your host set up a monitor, this is expected. Choose Allow to mark it as OK." };
  if (s.declaredBot) return { headline: "A bot is reading your pages", facts,
    meaning: "It says it’s a bot. Many bots are harmless (link previews, search tools), but they aren’t people.",
    advice: "watch", adviceText: "Nothing urgent. Watch it, and block it only if it gets heavy." };
  if (s.tool || s.noUa) return { headline: "A script or tool is visiting your site", facts,
    meaning: "Scripts and tools are often harmless, like monitoring or your own integrations, but they aren’t people browsing your site.",
    advice: "watch", adviceText: "If you recognize it, choose Allow. Otherwise, watch it." };
  if (v.label === "automated") return { headline: "Something is browsing unusually fast", facts,
    meaning: "The pace looks more like a program than a person, but it isn’t doing anything harmful that Bot Watch can see.",
    advice: "watch", adviceText: "Watch it. Block it only if it keeps going or slows your site." };
  return { headline: s.privateIp ? "A device on your own network" : "Looks like an ordinary visitor", facts,
    meaning: s.privateIp ? "This address is on a private network. It may be your own server, a load balancer, or someone on your network." : "Nothing about this visitor stands out.",
    advice: "probably-normal", adviceText: "No action needed." };
}

/** Normal / Busy / Very busy, from the last 30 seconds compared with the typical 30 seconds. */
export type TrafficLevel = "Normal" | "Busy" | "Very busy";
export function trafficLevel(last30: number, typical30: number): TrafficLevel {
  if (!typical30) return last30 >= 30 ? "Busy" : "Normal";
  const ratio = last30 / typical30;
  return ratio >= 3 ? "Very busy" : ratio >= 1.6 ? "Busy" : "Normal";
}
