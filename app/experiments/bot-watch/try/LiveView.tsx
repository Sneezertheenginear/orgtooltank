"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { analyzeVisitor, bucketize, type Bin, type Decision, type Label, type Req } from "../engine";
import { createDemoStream, type DemoStream } from "../live-demo";
import { ago, connectedFor, connectionState, statusLabel, type LiveSource } from "../connection";
import { ActivityChart, COLORS, LabelTag } from "./charts";
import { ActionHelp, Actions, PlainStory, TechDetails, VisitorDetail, decisionNames, plural } from "./VisitorViews";
import { explainVisitor, trafficLevel, type Advice } from "../plain";

// Live View has three states (see connection.ts), and the page always says which one it's in:
// - Not connected (default): a still snapshot of sample traffic, labeled as sample. Nothing moves.
// - Demo: only after Preview Demo. Sample traffic streams under a DEMO MODE banner that stays in view.
// - Live: only when a real traffic source is passed in. None exists yet.
// The classifications are real: the same rules as Analyze Past Traffic, applied to whatever requests are
// shown. Choices made on sample traffic stay in page memory and never block anything.

const WINDOW_MS = 5 * 60_000, KEEP_MS = 10 * 60_000, BIN_MS = 5_000, TICK_MS = 1_000;
/** The demo opens this far into its five-minute story, so a scanner is already active. */
const START_POSITION_MS = 95_000;
const FEED_ROWS = 30;
const DEMO_BLOCK = "Demo only — no real traffic was blocked.";

type Feed = "all" | "flagged";
const clock = (t: number) => new Date(t).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

export default function LiveView({ active, source = null }: { active: boolean; source?: LiveSource | null }) {
  const [live, setLive] = useState<{ events: Req[]; now: number; fresh: number }>({ events: [], now: 0, fresh: 0 });
  const [demoRunning, setDemoRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [liveNow, setLiveNow] = useState(0);
  const state = connectionState(source, demoRunning), sampleData = state !== "live";
  const connectRef = useRef<HTMLHeadingElement>(null);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [message, setMessage] = useState("");
  const [feed, setFeed] = useState<Feed>("all");
  const [detail, setDetail] = useState<string | null>(null);
  const stream = useRef<DemoStream | null>(null);
  const detailRef = useRef<HTMLElement>(null);

  // Not connected: one still snapshot of sample traffic so the sections below have something to show.
  useEffect(() => {
    if (!active || source || live.now) return;
    const s = stream.current ?? (stream.current = createDemoStream(Date.now() - START_POSITION_MS));
    const timer = setTimeout(() => setLive(prev => {
      if (prev.now) return prev;
      const now = Date.now();
      return { events: s.take(now - WINDOW_MS + 30_000, now), now, fresh: 0 };
    }), 0);
    return () => clearTimeout(timer);
  }, [active, source, live.now]);

  // Demo: sample traffic streams only after Preview Demo, and only while this tab is showing.
  useEffect(() => {
    if (!active || source || !demoRunning || paused) return;
    const s = stream.current ?? (stream.current = createDemoStream(Date.now() - START_POSITION_MS));
    const tick = () => setLive(prev => {
      const now = Date.now();
      // After a pause, fill the gap so the chart stays continuous.
      const from = prev.now || now - WINDOW_MS + 30_000;
      const fresh = s.take(from, now);
      return { events: [...prev.events.filter(e => e.time > now - KEEP_MS), ...fresh], now, fresh: prev.now ? fresh.length : 0 };
    });
    const first = setTimeout(tick, 0), timer = setInterval(tick, TICK_MS);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, [active, source, demoRunning, paused]);

  // Live: keep "last event received" and "time connected" current.
  useEffect(() => {
    if (!source) return;
    const first = setTimeout(() => setLiveNow(Date.now()), 0), timer = setInterval(() => setLiveNow(Date.now()), 1_000);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, [source]);

  function startDemo() {
    // Start from a fresh five-minute window ending now.
    setLive({ events: [], now: 0, fresh: 0 }); setPaused(false); setDemoRunning(true); setMessage("");
  }
  function stopDemo() { setDemoRunning(false); setPaused(false); setMessage("Demo stopped. Bot Watch is not connected to your website."); }
  function goConnect() {
    connectRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    connectRef.current?.focus({ preventScroll: true });
  }

  const view = useMemo(() => {
    const events = source ? source.events : live.events, now = source ? liveNow : live.now;
    const recent = events.filter(e => e.time > now - WINDOW_MS);
    const groups = new Map<string, Req[]>();
    for (const r of recent) { const list = groups.get(r.ip); if (list) list.push(r); else groups.set(r.ip, [r]); }
    const visitors = new Map([...groups].map(([ip, reqs]) => [ip, analyzeVisitor(ip, reqs)]));
    const labelOf = (ip: string): Label => visitors.get(ip)?.label ?? "normal";
    const { bins } = bucketize(recent, labelOf, now - WINDOW_MS + BIN_MS, now, 72, BIN_MS);
    // Most urgent first: what the plain-English advice says, then suspicious before automated, then most recent.
    const urgency: Record<Advice, number> = { "block-if-continues": 0, watch: 1, "probably-normal": 2 };
    const flagged = [...visitors.values()].filter(v => v.label !== "normal").map(v => ({ v, x: explainVisitor(v) }))
      .sort((a, b) => urgency[a.x.advice] - urgency[b.x.advice] || Number(b.v.label === "suspicious") - Number(a.v.label === "suspicious") || b.v.last - a.v.last);
    const count = (label: Label) => { const vs = [...visitors.values()].filter(v => v.label === label); return { visitors: vs.length, requests: vs.reduce((n, v) => n + v.requests.length, 0) }; };
    // "Spiking" compares the last 30 seconds with the typical 30 seconds in the window.
    const totals = bins.map(b => b.total), sorted = [...totals].sort((a, b) => a - b), typical = sorted[Math.floor(sorted.length / 2)] * 6;
    const last30 = totals.slice(-6).reduce((n, t) => n + t, 0);
    return {
      recent, visitors, labelOf, bins, flagged,
      perMinute: events.filter(e => e.time > now - 60_000).length,
      suspicious: count("suspicious"), automated: count("automated"),
      spiking: last30 >= 15 && typical > 0 && last30 >= 2.5 * typical, last30, typical, level: trafficLevel(last30, typical),
    };
  }, [live, source, liveNow]);

  function decide(ip: string, d: Decision) {
    setDecisions(prev => { const next = { ...prev }; if (next[ip] === d) delete next[ip]; else next[ip] = d; return next; });
    const removing = decisions[ip] === d;
    const what = `${removing ? `removed the ${decisionNames[d].toLowerCase()} mark from` : `marked ${decisionNames[d].toLowerCase()}:`} ${ip}`;
    // Sample traffic: say plainly that nothing happened to real traffic.
    setMessage(!sampleData ? `${what[0].toUpperCase()}${what.slice(1)}.` : d === "block" && !removing ? DEMO_BLOCK : `Demo only — ${what}. Nothing is saved or enforced.`);
  }
  function openDetail(ip: string) {
    setDetail(ip);
    requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const started = source ? liveNow > 0 : live.now > 0;
  const moving = state === "live" || (state === "demo" && !paused);
  const sample = sampleData && <span className="bw-sample-chip">Sample</span>;
  const rows = view.recent.filter(r => feed === "all" || view.labelOf(r.ip) !== "normal").slice(-FEED_ROWS).reverse();
  const blocked = Object.values(decisions).filter(d => d === "block").length;
  const detailVisitor = detail ? view.visitors.get(detail) ?? null : null;
  // The plain-English summary: the biggest current problem, and what still needs a decision.
  const problems = view.flagged.filter(f => f.v.label === "suspicious").sort((a, b) => b.v.requests.length - a.v.requests.length);
  const needsAttention = view.flagged.filter(f => f.x.advice !== "probably-normal" && decisions[f.v.ip] !== "allow" && decisions[f.v.ip] !== "block").length;
  const newest = moving ? live.fresh : 0;

  return <div className="bw-app bw-live">
    {state === "demo" && <div className="bw-demo-banner" role="status">
      <p><strong>DEMO MODE</strong> — This is sample traffic. Nothing here is coming from your real website.</p>
      <span className="bw-banner-actions">
        <button type="button" onClick={() => setPaused(v => !v)} aria-pressed={paused}>{paused ? "Resume" : "Pause"}</button>
        <button type="button" onClick={stopDemo}>Stop Demo</button>
      </span>
    </div>}

    <section className="bw-panel bw-live-top" aria-labelledby="bw-live-heading">
      <p className="eyebrow">Live View</p>
      <div className="bw-conn" data-state={state}>
        <h2 id="bw-live-heading" className="bw-conn-status"><span className="sr-only">Live View status: </span><span className="bw-conn-dot" aria-hidden="true" />{statusLabel[state]}{state === "demo" && paused && <span className="bw-conn-paused"> · paused</span>}</h2>
        {state === "live" && source ? <>
          <p className="bw-conn-line">Watching: <strong>{source.site}</strong></p>
          <dl className="bw-conn-facts">
            <div><dt>Connection status</dt><dd>{source.status === "connected" ? "Connected" : "Reconnecting…"}</dd></div>
            <div><dt>Last event received</dt><dd>{ago(source.lastEventAt, liveNow || source.connectedAt)}</dd></div>
            <div><dt>Time connected</dt><dd>{connectedFor(source.connectedAt, liveNow || source.connectedAt)}</dd></div>
          </dl>
        </> : <>
          <p className="bw-conn-line">Bot Watch is not currently watching your website.</p>
          <p className="bw-conn-sub">{state === "demo" ? "Showing sample traffic so you can see how Live View works. Nothing below is from your real website." : "The data below is sample traffic for preview only."}</p>
          <div className="bw-conn-actions">
            <button type="button" className="ink-button" onClick={goConnect}>Connect Live Traffic</button>
            {state === "demo"
              ? <button type="button" className="ink-button is-secondary" onClick={stopDemo}>Stop Demo</button>
              : <button type="button" className="ink-button is-secondary" onClick={startDemo}>Preview Demo</button>}
          </div>
        </>}
      </div>

      <h3 className="bw-plain-heading">Site activity right now{sample}</h3>
      <dl className="bw-plain-summary">
        <div data-level={view.level}><dt>Traffic</dt><dd>{started ? view.level : "—"}</dd><p>{started ? `${plural(view.perMinute, "request")} in the last minute` : "Loading…"}</p></div>
        <div><dt>Suspicious activity</dt><dd>{started ? (problems.length ? `${problems.length} found` : "None found") : "—"}</dd><p>in the last 5 minutes</p></div>
        <div className="bw-plain-problem"><dt>Most active problem</dt><dd>{problems[0] ? problems[0].x.headline : started ? "Nothing right now" : "—"}</dd>{problems[0] && <p>{problems[0].x.facts[0]}</p>}</div>
        <div data-attention={needsAttention ? "" : undefined}><dt>Needs your attention</dt><dd>{started ? needsAttention : "—"}</dd><p>{needsAttention ? `${needsAttention === 1 ? "thing" : "things"} to look at below` : "nothing waiting on you"}</p></div>
      </dl>

      <p className="bw-numbers-label">In numbers</p>
      <dl className="bw-metrics" aria-label="Right now, in numbers">
        <div><dt>Requests / minute</dt><dd>{started ? view.perMinute.toLocaleString("en-US") : "—"}</dd></div>
        <div><dt><span className="bw-dot" style={{ background: COLORS.suspicious }} aria-hidden="true" />Suspicious activity</dt><dd>{view.suspicious.visitors}</dd><p>{plural(view.suspicious.visitors, "visitor")}, {plural(view.suspicious.requests, "request")} in 5 min</p></div>
        <div><dt><span className="bw-dot" style={{ background: COLORS.automated }} aria-hidden="true" />Likely automated</dt><dd>{view.automated.visitors}</dd><p>{plural(view.automated.visitors, "visitor")}, {plural(view.automated.requests, "request")} in 5 min</p></div>
        <div><dt>Blocked</dt><dd>{blocked}</dd><p>{sampleData ? "sample only · nothing enforced" : "marked Block"}</p></div>
      </dl>
      {message && <p className="bw-message" role="status">{message}</p>}
    </section>

    <section className="bw-panel" aria-labelledby="bw-live-chart-heading">
      <p className="eyebrow">Traffic right now{sample}</p>
      <h2 id="bw-live-chart-heading">Requests over the last 5 minutes</h2>
      <p className="bw-lede">{!started ? "Loading…" : view.spiking
        ? <><strong>Traffic is spiking:</strong> {plural(view.last30, "request")} in the last 30 seconds, about {Math.round(view.last30 / view.typical)}× the usual pace.</>
        : <>Traffic looks steady: {plural(view.last30, "request")} in the last 30 seconds.</>} Each column is 5 seconds; the newest is on the right.</p>
      <p className="bw-chart-explain">This graph shows how much traffic is hitting your site. Gray is normal traffic. Yellow and red show activity Bot Watch thinks may be automated or unusual.</p>
      <ActivityChart bins={view.bins} size={BIN_MS} title="Requests per 5 seconds over the last 5 minutes, by visitor type" labelPeak={false} height={200}
        xLabel={(b: Bin, i) => i === view.bins.length - 1 ? "Now" : b.start % 60_000 === 0 && i < view.bins.length - 4 ? new Date(b.start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : null}
        tipTime={(b: Bin) => `${clock(b.start)} – ${clock(b.start + BIN_MS)}`} />
    </section>

    <section className="bw-panel" aria-labelledby="bw-feed-heading">
        <p className="eyebrow">Request feed{sample}</p>
        <h2 id="bw-feed-heading">What’s happening right now</h2>
        <p className="bw-sub">Every request, newest first: the time, the page, how the site answered, who asked, and what Bot Watch thinks of them.{state === "disconnected" && " This is a still snapshot; choose Preview Demo to watch sample traffic move."}</p>
        <div className="bw-filters" role="group" aria-label="Show requests">{(["all", "flagged"] as Feed[]).map(f => <button key={f} type="button" aria-pressed={feed === f} onClick={() => setFeed(f)}>{f === "all" ? "All requests" : "Flagged only"}</button>)}</div>
        {!rows.length ? <p className="bw-empty">{started ? "No requests to show yet." : "Loading…"}</p>
          : <ol className="bw-feed" aria-label="Most recent requests, newest first">{rows.map((r, i) => {
            const label = view.labelOf(r.ip);
            return <li key={`${r.time}-${r.ip}-${r.url}`} className="bw-feed-row" data-label={label} data-new={i < newest ? "" : undefined}>
              <time className="bw-feed-time" dateTime={new Date(r.time).toISOString()}>{clock(r.time)}</time>
              <code className="bw-feed-path" title={r.url}>{r.method !== "GET" && <span className="bw-feed-method">{r.method} </span>}{r.path}</code>
              <span className="bw-feed-status" data-error={r.status >= 400 ? "" : undefined}>{r.status}</span>
              <button type="button" className="bw-feed-ip" onClick={() => openDetail(r.ip)} title={`View activity for ${r.ip}`}>{r.ip}</button>
              <LabelTag label={label} />
            </li>;
          })}</ol>}
        <p className="small-note">Labels reflect each visitor’s last 5 minutes and can change as more requests arrive.</p>
    </section>

      <section className="bw-panel" aria-labelledby="bw-flagged-heading">
        <p className="eyebrow">Flagged activity{sample}</p>
        <h2 id="bw-flagged-heading">Things that look suspicious</h2>
        <p className="bw-sub">Visitors whose behavior matched Bot Watch’s rules in the last 5 minutes, most urgent first.</p>
        <ActionHelp demo={sampleData} />
        {!view.flagged.length ? <p className="bw-empty">{started ? "Nothing flagged in the last 5 minutes." : "Loading…"}</p>
          : <ol className="bw-flagcards">{view.flagged.map(({ v }) => <li key={v.ip} className="bw-flagcard" data-label={v.label}>
            <div className="bw-visitor-top"><LabelTag label={v.label} />{decisions[v.ip] && <span className="bw-decision" data-decision={decisions[v.ip]}>{decisionNames[decisions[v.ip]]}{sampleData && " (sample)"}</span>}</div>
            <PlainStory v={v} />
            <Actions ip={v.ip} decision={decisions[v.ip]} onDecide={decide} onView={openDetail} demo={sampleData} />
            <TechDetails v={v} />
          </li>)}</ol>}
    </section>

    {detailVisitor && <VisitorDetail v={detailVisitor} decision={decisions[detailVisitor.ip]} pathFlags={new Map()} onClose={() => setDetail(null)} refEl={detailRef} demo={sampleData}
      actions={<Actions ip={detailVisitor.ip} decision={decisions[detailVisitor.ip]} onDecide={decide} demo={sampleData} />} />}

    <section className="bw-panel bw-connect" aria-labelledby="bw-connect-heading">
      <p className="eyebrow">Coming next</p>
      <h2 id="bw-connect-heading" ref={connectRef} tabIndex={-1}>Connect Live Traffic</h2>
      <p>Bot Watch needs a live stream of website requests to watch traffic in real time. Right now there isn’t one, which is why Live View says <strong>Not connected</strong> and only shows sample traffic.</p>
      <p>For sites hosted on Vercel, real-time streaming will need a supported log connection, such as a Vercel Log Drain, which sends request records to another service as they happen. Nothing needs to be set up yet.</p>
      <p><strong>Live connection coming next.</strong> Until then, use <em>Analyze Past Traffic</em> to look at traffic that already happened.</p>
    </section>
  </div>;
}
