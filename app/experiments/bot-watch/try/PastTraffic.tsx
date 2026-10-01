"use client";

import { useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { DECISIONS_KEY, MAX_LINES, analyze, blocklist, bucketLabel, bucketize, fmtDuration, fmtTime, parseDecisions, parseTraffic, spike, type Analysis, type Bin, type Decision, type TrafficFile, type Visitor } from "../engine";
import { exampleLog } from "../demo";
import { ActivityChart, BarList, COLORS, LabelTag, Sparkline } from "./charts";
import { NextStep } from "../../../experiment-components/Guidance";
import { HostHelp, HostSteps, hosts, type Host } from "./HostGuide";
import { ActionHelp, Actions, VisitorDetail, decisionNames, plural, shortName } from "./VisitorViews";
import { adviceName, explainVisitor } from "../plain";

// Analyze Past Traffic. The traffic file is read in this page's memory and never uploaded or saved. Only Watch / Allow /
// Block choices are saved, in this browser's local storage.
const CHANGED = "orgtooltank-bot-watch-decisions";
const subscribe = (callback: () => void) => { window.addEventListener("storage", callback); window.addEventListener(CHANGED, callback); return () => { window.removeEventListener("storage", callback); window.removeEventListener(CHANGED, callback); }; };
const readDecisions = () => { try { return localStorage.getItem(DECISIONS_KEY); } catch { return null; } };
const MAX_BYTES = 50 * 1024 * 1024, MAX_TEXT = 200 * 1024 * 1024, PAGE = 24;
type RuleFormat = "vercel" | "nginx" | "apache" | "plain";
const formatFor: Record<Host, RuleFormat> = { vercel: "vercel", cpanel: "apache", nginx: "nginx", other: "plain" };
const EXPLAIN = "The traffic file contains records of requests hitting your website. Bot Watch reads those records locally in your browser to look for unusual behavior.";

/** Reads a chosen file as text, opening gzip-compressed files (like cPanel's Raw Access downloads) in the browser. */
async function readText(file: File): Promise<string> {
  const head = new Uint8Array(await file.slice(0, 2).arrayBuffer());
  if (head[0] === 0x1f && head[1] === 0x8b) return new Response(file.stream().pipeThrough(new DecompressionStream("gzip"))).text();
  return file.text();
}

type Loaded = { name: string; analysis: Analysis; skipped: number; truncated: boolean; example: boolean; format: TrafficFile["format"] };
type Filter = "review" | "watch" | "block" | "allow" | "all";
const filterNames: Record<Filter, string> = { review: "Needs review", watch: "Watching", block: "Blocked", allow: "Allowed", all: "All visitors" };
/** "30 minutes" stays as is; "hour" becomes "one hour". */
const spanText = (size: number) => { const label = bucketLabel(size); return /^\d/.test(label) ? label : `one ${label}`; };

/** Analyze Past Traffic: read a traffic file that already exists (upload, paste, or the example). */
export default function PastTraffic() {
  const raw = useSyncExternalStore(subscribe, readDecisions, () => null);
  const decisions = useMemo(() => parseDecisions(raw), [raw]);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [pasting, setPasting] = useState(false);
  const [pasted, setPasted] = useState("");
  const [filter, setFilter] = useState<Filter>("review");
  const [pathFilter, setPathFilter] = useState<string | null>(null);
  const [binFilter, setBinFilter] = useState<Bin | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [detail, setDetail] = useState<string | null>(null);
  const [format, setFormat] = useState<RuleFormat>("nginx");
  const [host, setHost] = useState<Host | null>(null);
  const [hostHelp, setHostHelp] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  function chooseHost(h: Host) { setHost(h); setHostHelp(false); setFormat(formatFor[h]); setMessage(""); }

  function decide(ip: string, d: Decision) {
    const next = { ...decisions };
    if (next[ip] === d) delete next[ip]; else next[ip] = d;
    try { localStorage.setItem(DECISIONS_KEY, JSON.stringify(next)); window.dispatchEvent(new Event(CHANGED)); }
    catch { setMessage("This browser couldn't save your choice (storage may be full or turned off)."); return; }
    setMessage(next[ip] ? `${ip} marked ${decisionNames[d].toLowerCase()}.` : `Removed the ${decisionNames[d].toLowerCase()} mark from ${ip}.`);
  }

  function load(text: string, name: string, example = false) {
    setBusy(true); setMessage("");
    // Let the "Reading…" state paint before a large log is parsed.
    setTimeout(() => {
      const parsed = parseTraffic(text);
      setBusy(false);
      if (!parsed.requests.length) { setMessage(`No requests could be read from ${name}. Bot Watch reads Apache and Nginx access logs, and JSON or CSV log exports (like Vercel’s) that include a time and a path for each request.`); return; }
      setLoaded({ name, analysis: analyze(parsed.requests, parsed.identity), skipped: parsed.skipped, truncated: parsed.truncated, example, format: parsed.format });
      setFilter("review"); setPathFilter(null); setBinFilter(null); setDetail(null); setLimit(PAGE); setPasting(false); setPasted(""); setShowGuide(false);
    }, 20);
  }
  async function chooseFile(file: File | undefined) {
    if (fileInput.current) fileInput.current.value = "";
    if (!file) return;
    if (file.size > MAX_BYTES) { setMessage("That file is over 50 MB. Try a smaller time period, like one day."); return; }
    if (/\.(zip|bz2|xz|7z|rar)$/i.test(file.name)) { setMessage("That file is compressed in a format Bot Watch can’t open. Unzip it first, then choose the file inside. (.gz files are fine.)"); return; }
    let text: string;
    try { text = await readText(file); } catch { setMessage("Your browser couldn’t read that file. If it’s compressed, unzip it first and choose the file inside."); return; }
    if (text.length > MAX_TEXT) { setMessage("That file is too large once opened. Try a smaller time period, like one day."); return; }
    load(text, file.name);
  }

  const actions = <div className="bw-input-actions">
    <input ref={fileInput} type="file" className="sr-only" tabIndex={-1} aria-label="Choose a traffic file" onChange={e => chooseFile(e.target.files?.[0])} />
    <button type="button" className={`ink-button${loaded ? " is-secondary" : ""}`} onClick={() => fileInput.current?.click()} disabled={busy}>{loaded ? "Choose a Different File" : "Choose Traffic File"}</button>
    <button type="button" className="ink-button is-secondary" onClick={() => setPasting(v => !v)} disabled={busy} aria-expanded={pasting}>Paste Traffic Data</button>
    {!loaded?.example && <button type="button" className="text-link" onClick={() => load(exampleLog(), "Example traffic", true)} disabled={busy}>Try Example</button>}
  </div>;
  const paste = pasting && <div className="bw-paste">
    <label htmlFor="bw-paste">Paste traffic records</label>
    <p className="bw-sub">Lines from an access log, or JSON or CSV exported from your host’s logs.</p>
    <textarea id="bw-paste" rows={6} value={pasted} onChange={e => setPasted(e.target.value)} placeholder={'203.0.113.5 - - [28/Sep/2026:10:15:30 +0000] "GET /wp-login.php HTTP/1.1" 404 153 "-" "Mozilla/5.0 …"'} spellCheck={false} />
    <button type="button" className="ink-button" disabled={!pasted.trim() || busy} onClick={() => load(pasted, "Pasted traffic")}>Read Pasted Data</button>
  </div>;
  const status = <>
    {busy && <p className="bw-message" role="status">Reading the traffic file…</p>}
    {message && <p className="bw-message" role="status">{message}</p>}
  </>;
  const tutorial = <>
    <div className="bw-hosts" role="group" aria-label="Where your website is hosted">{hosts.map(h => <button key={h.id} type="button" className="bw-host" aria-pressed={host === h.id} onClick={() => chooseHost(h.id)}><strong>{h.name}</strong><span>{h.hint}</span></button>)}</div>
    <button type="button" className="text-link bw-host-help-link" aria-expanded={hostHelp} onClick={() => setHostHelp(v => !v)}>I don’t know where my site is hosted</button>
    {hostHelp && <HostHelp />}
    {host && <HostSteps host={host} />}
  </>;

  const intro = <p className="bw-mode-intro">Use this when you want to inspect traffic that already happened. Your traffic file is read in this browser and never uploaded.</p>;
  const input = !loaded
    ? <><section className="bw-panel bw-input" aria-labelledby="bw-input-heading">
      <p className="eyebrow">Step 1 of 2</p>
      <h2 id="bw-input-heading">Where is your website hosted?</h2>
      <p className="bw-sub">Bot Watch needs a traffic file from your website. Choose your host and you’ll see exactly where to get it.</p>
      {tutorial}
      {host ? <div className="bw-get-file">
        <p className="eyebrow">Step 2 of 2</p>
        <p className="bw-explain">{EXPLAIN}</p>
        {actions}
        {paste}
        <p className="small-note">Your traffic file is read in this browser and never uploaded. Only your Watch, Allow, and Block choices are saved, in this browser.</p>
      </div> : <p className="bw-just-looking">Just looking around? <button type="button" className="text-link" onClick={() => load(exampleLog(), "Example traffic", true)} disabled={busy}>Try the example</button> with made-up traffic.</p>}
      {status}
    </section></>
    : <section className="bw-panel bw-input" aria-labelledby="bw-input-heading">
      <h2 id="bw-input-heading" className="sr-only">Traffic file</h2>
      <div className="bw-input-row">
        <p className="bw-loaded"><strong>{loaded.name}</strong> · {plural(loaded.analysis.requests.length, "request")} · {fmtTime(loaded.analysis.first)} – {fmtTime(loaded.analysis.last)} · read as {loaded.format}{loaded.skipped > 0 && ` · ${plural(loaded.skipped, "record")} skipped`}{loaded.truncated && ` · only the first ${MAX_LINES.toLocaleString("en-US")} records were read`}{loaded.example && " · fictional example"}</p>
        {actions}
      </div>
      {loaded.analysis.identity === "userAgent" && <p className="bw-notice">This file doesn’t include visitor IP addresses, so visitors are grouped by the browser or tool they report. Blocking needs IP addresses, so Watch, Allow, and Block are turned off for this file.</p>}
      {paste}
      <button type="button" className="text-link bw-guide-toggle" aria-expanded={showGuide} onClick={() => setShowGuide(v => !v)}>{showGuide ? "Hide instructions" : "Where do I get a traffic file?"}</button>
      {showGuide && <div className="bw-guide-again"><h3 className="bw-guide-q">Where is your website hosted?</h3>{tutorial}</div>}
      {status}
    </section>;

  if (!loaded) return <div className="bw-app">{intro}{input}</div>;
  return <Results loaded={loaded} input={<>{intro}{input}</>} decisions={decisions} decide={decide}
    filter={filter} setFilter={f => { setFilter(f); setLimit(PAGE); }} pathFilter={pathFilter} setPathFilter={setPathFilter} binFilter={binFilter} setBinFilter={setBinFilter}
    limit={limit} setLimit={setLimit} detail={detail} setDetail={setDetail}
    format={format} setFormat={setFormat} setMessage={setMessage} />;
}

type ResultsProps = {
  loaded: Loaded; input: ReactNode; decisions: Record<string, Decision>; decide: (ip: string, d: Decision) => void;
  filter: Filter; setFilter: (f: Filter) => void; pathFilter: string | null; setPathFilter: (p: string | null) => void; binFilter: Bin | null; setBinFilter: (b: Bin | null) => void;
  limit: number; setLimit: (n: number) => void; detail: string | null; setDetail: (ip: string | null) => void;
  format: RuleFormat; setFormat: (f: RuleFormat) => void; setMessage: (m: string) => void;
};

function Results(p: ResultsProps) {
  const a = p.loaded.analysis;
  const visitorsRef = useRef<HTMLElement>(null);
  const detailRef = useRef<HTMLElement>(null);
  function openDetail(ip: string) {
    p.setDetail(ip);
    requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
  function showWho(update: () => void) {
    update(); p.setFilter("all"); p.setLimit(PAGE);
    requestAnimationFrame(() => visitorsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
  const timeline = useMemo(() => bucketize(a.requests, ip => a.byIp.get(ip)!.label, a.first, a.last), [a]);
  const peak = spike(timeline.bins);
  const flaggedShare = peak && peak.peak.total ? Math.round(((peak.peak.suspicious + peak.peak.automated) / peak.peak.total) * 100) : 0;
  const blocked = Object.entries(p.decisions).filter(([, d]) => d === "block").map(([ip]) => ip);
  const blockedHere = blocked.filter(ip => a.byIp.has(ip));
  const pathFlags = new Map(a.paths.map(s => [s.path, s.flag]));
  const topPath = a.paths[0];

  let list = a.visitors;
  if (p.pathFilter) list = list.filter(v => v.paths.some(([path]) => path === p.pathFilter));
  if (p.binFilter) { const from = p.binFilter.start, to = from + timeline.size; list = list.filter(v => v.first < to && v.last >= from && v.requests.some(r => r.time >= from && r.time < to)); }
  const scoped = !!(p.pathFilter || p.binFilter);
  list = list.filter(v => {
    const d = p.decisions[v.ip];
    if (p.filter === "all") return true;
    if (p.filter === "review") return v.label !== "normal" && d !== "allow" && d !== "block";
    return d === p.filter;
  });
  const counts: Record<Filter, number> = {
    review: a.visitors.filter(v => v.label !== "normal" && p.decisions[v.ip] !== "allow" && p.decisions[v.ip] !== "block").length,
    watch: a.visitors.filter(v => p.decisions[v.ip] === "watch").length,
    block: blockedHere.length,
    allow: a.visitors.filter(v => p.decisions[v.ip] === "allow").length,
    all: a.visitors.length,
  };
  const detailVisitor = p.detail ? a.byIp.get(p.detail) ?? null : null;

  const canDecide = a.identity === "ip";
  const actions = (v: Visitor, compact = false) => <Actions ip={v.ip} decision={p.decisions[v.ip]} onDecide={canDecide ? p.decide : undefined} onView={compact ? undefined : openDetail} />;

  return <div className="bw-app">
    {p.input}

    {/* 1. Summary */}
    <dl className="bw-cards" aria-label="Summary">
      <div><dt>Total requests</dt><dd>{a.requests.length.toLocaleString("en-US")}</dd><p>over {fmtDuration(a.last - a.first)} from {plural(a.visitors.length, "visitor")}</p></div>
      <div><dt><span className="bw-dot" style={{ background: COLORS.suspicious }} aria-hidden="true" />Suspicious visitors</dt><dd>{a.counts.suspicious.visitors.toLocaleString("en-US")}</dd><p>{plural(a.counts.suspicious.requests, "request")}</p></div>
      <div><dt><span className="bw-dot" style={{ background: COLORS.automated }} aria-hidden="true" />Likely automated</dt><dd>{a.counts.automated.visitors.toLocaleString("en-US")}</dd><p>{plural(a.counts.automated.requests, "request")}, not flagged as suspicious</p></div>
      <div><dt>Blocked</dt><dd>{blockedHere.length.toLocaleString("en-US")}</dd><p>{blockedHere.length ? `${blockedHere.length === 1 ? "visitor" : "visitors"} you marked Block` : "none marked yet"} · {plural(a.refused, "request")} refused (403) by your server</p></div>
      <div className="bw-card-path"><dt>Top hit path</dt><dd title={topPath.path}>{topPath.path}</dd><p>{plural(topPath.count, "request")}{topPath.flag && <> · <span className="bw-flag"><span className="bw-dot" style={{ background: COLORS.suspicious }} aria-hidden="true" />{topPath.flag}</span></>}</p></div>
    </dl>

    {/* 2. Traffic over time */}
    <section className="bw-panel" aria-labelledby="bw-activity-heading">
      <p className="eyebrow">Did traffic spike?</p>
      <h2 id="bw-activity-heading">Traffic activity</h2>
      <p className="bw-lede">{peak && (peak.isSpike
        ? <>Traffic spiked around <strong>{fmtTime(peak.peak.start)}</strong>: {plural(peak.peak.total, "request")} in {spanText(timeline.size)}, about {Math.round(peak.ratio)}× the typical {peak.typical.toLocaleString("en-US")}. {flaggedShare}% of that came from suspicious or likely automated visitors.</>
        : <>No sharp spikes. The busiest {bucketLabel(timeline.size)} had {plural(peak.peak.total, "request")}, around {fmtTime(peak.peak.start)}.</>)}{" "}Requests per {bucketLabel(timeline.size)}, by who sent them. Click a column to see who was active then.</p>
      <p className="bw-chart-explain">This graph shows how much traffic hit your site. Gray is normal traffic. Yellow and red show activity Bot Watch thinks may be automated or unusual.</p>
      <ActivityChart bins={timeline.bins} size={timeline.size} title="Requests over time, stacked by visitor type" picked={p.binFilter?.start ?? null}
        onPick={bin => showWho(() => { p.setBinFilter(p.binFilter?.start === bin.start ? null : bin); p.setPathFilter(null); })} />
    </section>

    <div className="bw-two">
      {/* 3. Paths */}
      <section className="bw-panel" aria-labelledby="bw-paths-heading">
        <p className="eyebrow">What’s getting hit?</p>
        <h2 id="bw-paths-heading">Top paths</h2>
        <p className="bw-sub">Red marks paths that look like probing, missing pages, or repeated form and API hits. Choose a path to see who requested it.</p>
        <BarList rows={a.paths.slice(0, 12).map(s => ({
          key: s.path, label: <code>{s.path}</code>, title: s.path, value: s.count, flag: s.flag, selected: p.pathFilter === s.path,
          sub: <span className="bw-muted">{plural(s.visitors, "visitor")}{s.notFound ? ` · ${s.notFound.toLocaleString("en-US")} not found` : ""}{s.posts ? ` · ${s.posts.toLocaleString("en-US")} POST` : ""}</span>,
          onClick: () => showWho(() => { p.setPathFilter(p.pathFilter === s.path ? null : s.path); p.setBinFilter(null); }),
        }))} />
        {a.paths.length > 12 && <p className="small-note">Showing the top 12 of {plural(a.paths.length, "path")}.</p>}
        {(() => { const hidden = a.paths.slice(12).filter(s => s.flag); return hidden.length > 0 && <div className="bw-more-flags"><p className="bw-sub"><strong>Also flagged, further down:</strong></p><BarList rows={hidden.slice(0, 8).map(s => ({ key: s.path, label: <code>{s.path}</code>, title: s.path, value: s.count, flag: s.flag, selected: p.pathFilter === s.path, onClick: () => showWho(() => { p.setPathFilter(p.pathFilter === s.path ? null : s.path); p.setBinFilter(null); }) }))} max={a.paths[0].count} /></div>; })()}
      </section>

      {/* 4. Visitors */}
      <section className="bw-panel" aria-labelledby="bw-visitors-heading" ref={visitorsRef} tabIndex={-1}>
        <p className="eyebrow">Who’s hitting it?</p>
        <h2 id="bw-visitors-heading">Visitors to review</h2>
        <ActionHelp canDecide={canDecide} />
        <div className="bw-filters" role="group" aria-label="Show visitors">{(Object.keys(filterNames) as Filter[]).map(f => <button key={f} type="button" aria-pressed={p.filter === f} onClick={() => p.setFilter(f)}>{filterNames[f]} <span className="bw-count">{counts[f]}</span></button>)}</div>
        {scoped && <p className="bw-scope">{p.pathFilter ? <>Visitors who requested <code>{p.pathFilter}</code></> : <>Visitors active {fmtTime(p.binFilter!.start)} – {fmtTime(p.binFilter!.start + timeline.size, false)}</>} <button type="button" className="text-link" onClick={() => { p.setPathFilter(null); p.setBinFilter(null); p.setFilter("review"); }}>Clear</button></p>}
        {!list.length ? <p className="bw-empty">{p.filter === "review" && !scoped ? "Nothing left to review. Every flagged visitor has been allowed or blocked." : p.filter === "watch" ? "You're not watching anyone yet. Choose Watch on a visitor to keep an eye on them." : p.filter === "block" ? "No one is marked Block yet." : p.filter === "allow" ? "No one is marked Allow yet." : "No visitors match."}</p>
          : <ol className="bw-visitors">{list.slice(0, p.limit).map(v => <VisitorCard key={v.ip} v={v} decision={p.decisions[v.ip]} actions={actions(v)} spark={bucketize(v.requests, () => v.label, a.first, a.last).bins} />)}</ol>}
        {list.length > p.limit && <button type="button" className="ink-button is-secondary bw-show-more" onClick={() => p.setLimit(p.limit + PAGE)}>Show {Math.min(PAGE, list.length - p.limit)} More</button>}
        {list.length > 0 && p.filter === "review" && !scoped && <NextStep>Open View Activity on the first visitor to see exactly what they did before you decide.</NextStep>}
      </section>
    </div>

    {/* 5. Visitor detail */}
    {detailVisitor && <VisitorDetail v={detailVisitor} decision={p.decisions[detailVisitor.ip]} actions={canDecide ? actions(detailVisitor, true) : null} pathFlags={pathFlags} onClose={() => p.setDetail(null)} refEl={detailRef} />}

    {/* Blocklist */}
    {blocked.length > 0 && <section className="bw-panel" aria-labelledby="bw-block-heading">
      <p className="eyebrow">Should I block it?</p>
      <h2 id="bw-block-heading">Your blocklist ({blocked.length})</h2>
      <p className="bw-sub">Bot Watch can’t block anyone by itself. Add these addresses where your site is hosted: your host’s firewall, or your server’s configuration. Addresses change and can be shared by many people, so review the list now and then.</p>
      <div className="bw-filters" role="group" aria-label="Where you'll block them">{(["vercel", "nginx", "apache", "plain"] as const).map(f => <button key={f} type="button" aria-pressed={p.format === f} onClick={() => p.setFormat(f)}>{{ vercel: "Vercel Firewall", nginx: "Nginx", apache: "Apache 2.4", plain: "Plain list" }[f]}</button>)}</div>
      {p.format === "vercel" && <ol className="bw-steps bw-block-steps">
        {["In your Vercel project, open Firewall and select Configure.", "Scroll to IP Blocking and select + Add IP.", "Enter one address from the list below and your site’s domain as the host (without https://), then select Add IP Block Rule. Repeat for each address and each domain you use.", "Select Review Changes, then Publish."].map((step, i) => <li key={i}><span className="bw-step-n" aria-hidden="true">{i + 1}</span><span>{step}</span></li>)}
      </ol>}
      <textarea className="bw-rules" readOnly rows={Math.min(10, blocked.length + (p.format === "apache" ? 3 : 0))} value={blocklist(blocked)[p.format === "vercel" ? "plain" : p.format]} aria-label="Blocklist rules" />
      <button type="button" className="ink-button" onClick={async () => { try { await navigator.clipboard.writeText(blocklist(blocked)[p.format === "vercel" ? "plain" : p.format]); p.setMessage("Blocklist copied."); } catch { p.setMessage("Your browser didn't allow copying. Select the text and copy it instead."); } }}>{p.format === "vercel" || p.format === "plain" ? "Copy Addresses" : "Copy Rules"}</button>
    </section>}
  </div>;
}

function VisitorCard({ v, decision, actions, spark }: { v: Visitor; decision?: Decision; actions: ReactNode; spark: Bin[] }) {
  const key = v.reasons[0], x = explainVisitor(v);
  return <li className="bw-visitor" data-label={v.label}>
    <div className="bw-visitor-top">
      <LabelTag label={v.label} />
      <strong className="bw-ip" title={v.ip}>{shortName(v.ip)}</strong>
      {decision && <span className="bw-decision" data-decision={decision}>{decisionNames[decision]}</span>}
    </div>
    <p className="bw-card-headline">{x.headline}</p>
    <p className="bw-card-advice"><strong className="bw-advice" data-advice={x.advice}>{adviceName[x.advice]}.</strong> {x.adviceText}</p>
    <div className="bw-visitor-mid">
      <p className="bw-visitor-stats"><strong>{plural(v.requests.length, "request")}</strong> · {fmtTime(v.first)} – {fmtTime(v.last, new Date(v.first).toDateString() !== new Date(v.last).toDateString())} ({fmtDuration(v.last - v.first)})</p>
      <Sparkline bins={spark} label={v.label} />
    </div>
    <p className="bw-reason"><span className="bw-reason-label">Technical: </span>{key ? <>{key.text}{v.reasons.length > 1 && <span className="bw-muted"> · {v.reasons.length - 1} more {v.reasons.length === 2 ? "reason" : "reasons"}</span>}</> : <span className="bw-muted">Nothing unusual found by Bot Watch’s rules.</span>}</p>
    {actions}
  </li>;
}

