import type { ReactNode, RefObject } from "react";
import { bucketLabel, bucketize, fmtDuration, fmtTime, labelName, probeOf, statusClass, type Decision, type Visitor } from "../engine";
import { adviceName, explainVisitor } from "../plain";
import { ActivityChart, BarList, LabelTag } from "./charts";

// Shared by Live View and Analyze Past Traffic. Plain English comes first (PlainStory); the technical
// details (IPs, user agents, exact paths, status codes, timelines, detection rules) stay available below.

export const decisionNames: Record<Decision, string> = { watch: "Watching", allow: "Allowed", block: "Blocked" };
export const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;
/** Visitor names can be a whole user agent when a file has no IP addresses; keep them to one readable line. */
export const shortName = (name: string) => name.length > 64 ? `${name.slice(0, 61)}…` : name;
const clock = (t: number) => new Date(t).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit" });

const actionTitles = { view: "See everything this visitor did", watch: "Keep it on your list to check later", allow: "Mark it as OK so it stops needing review", block: "Add it to your blocklist" };

export function Actions({ ip, decision, onDecide, onView, demo = false }: { ip: string; decision?: Decision; onDecide?: (ip: string, d: Decision) => void; onView?: (ip: string) => void; demo?: boolean }) {
  if (!onView && !onDecide) return null;
  return <div className="bw-actions">
    {onView && <button type="button" className="bw-action is-view" title={actionTitles.view} onClick={() => onView(ip)}>View Activity</button>}
    {onDecide && (["watch", "allow", "block"] as Decision[]).map(d => <button key={d} type="button" className="bw-action" data-decision={d} aria-pressed={decision === d} title={d === "block" && demo ? "Demo only: nothing is actually blocked" : actionTitles[d]} onClick={() => onDecide(ip, d)}>{{ watch: "Watch", allow: "Allow", block: "Block" }[d]}<span className="sr-only"> {ip}</span></button>)}
  </div>;
}

/** One line explaining the four buttons, shown once above a list of visitors. */
export function ActionHelp({ demo = false, canDecide = true, view = true }: { demo?: boolean; canDecide?: boolean; view?: boolean }) {
  return <p className="bw-action-help">{view && <><strong>View Activity</strong> shows everything it did.</>}{canDecide && <> <strong>Watch</strong> keeps it on your list. <strong>Allow</strong> marks it as OK. <strong>Block</strong> {demo ? "is demo only here: nothing is actually blocked." : "adds it to your blocklist, which you copy to your host or server."}</>}</p>;
}

/** The plain-English layer: what it looks like, what it means, and what to do. */
export function PlainStory({ v }: { v: Visitor }) {
  const x = explainVisitor(v);
  return <div className="bw-story" data-advice={x.advice}>
    <h3 className="bw-story-headline">{x.headline}</h3>
    <ul className="bw-story-facts">{x.facts.map(f => <li key={f}>{f}</li>)}</ul>
    <div className="bw-story-grid">
      <div><p className="bw-story-label">What this means</p><p>{x.meaning}</p></div>
      <div><p className="bw-story-label">What I would do</p><p><strong className="bw-advice" data-advice={x.advice}>{adviceName[x.advice]}.</strong> {x.adviceText}</p></div>
    </div>
  </div>;
}

/** Collapsed technical details for a visitor card. */
export function TechDetails({ v }: { v: Visitor }) {
  return <details className="bw-tech">
    <summary>Show technical details <span className="bw-muted">· {shortName(v.ip)}</span></summary>
    <dl className="bw-tech-list">
      <div><dt>IP address</dt><dd><code>{v.ip}</code></dd></div>
      <div><dt>User agent</dt><dd>{v.agents.slice(0, 2).map(([ua, n]) => <code key={ua}>{ua}{v.agents.length > 1 && ` (${n})`}</code>)}</dd></div>
      <div><dt>Paths</dt><dd>{v.paths.slice(0, 8).map(([p, n]) => <code key={p}>{p} × {n}</code>)}{v.paths.length > 8 && <span className="bw-muted">+ {plural(v.paths.length - 8, "more path")}</span>}</dd></div>
      <div><dt>Status codes</dt><dd>{v.statuses.map(([code, n]) => `${code} × ${n}`).join(" · ")}</dd></div>
      <div><dt>Timeline</dt><dd>{fmtTime(v.first)} – {fmtTime(v.last)} · busiest minute {plural(v.peakPerMinute, "request")}</dd></div>
      <div><dt>Detection rules</dt><dd><ul>{v.reasons.map(r => <li key={r.text}><span className="bw-why-kind" data-concern={r.concern || undefined}>{r.concern ? "Concern" : "Automation sign"}</span> {r.text}</li>)}</ul></dd></div>
    </dl>
  </details>;
}

export function VisitorDetail({ v, decision, actions, pathFlags, onClose, refEl, demo = false }: { v: Visitor; decision?: Decision; actions: ReactNode; pathFlags: Map<string, string | null>; onClose: () => void; refEl: RefObject<HTMLElement | null>; demo?: boolean }) {
  const pad = Math.max(60_000, (v.last - v.first) * 0.05);
  const own = bucketize(v.requests, () => v.label, v.first - pad, v.last + pad, 60);
  const classes = new Map<string, [number, number][]>();
  for (const [code, n] of v.statuses) { const c = statusClass(code); classes.set(c, [...(classes.get(c) ?? []), [code, n]]); }
  const recent = v.requests.slice(-25).reverse();
  return <section className="bw-panel bw-detail" aria-labelledby="bw-detail-heading" ref={refEl} tabIndex={-1}>
    <div className="bw-detail-head">
      <div>
        <p className="eyebrow">Visitor activity</p>
        <h2 id="bw-detail-heading">What this visitor did</h2>
        <p className="bw-detail-who"><LabelTag label={v.label} /><span className="bw-ip" title={v.ip}>{shortName(v.ip)}</span>{decision && <span className="bw-decision" data-decision={decision}>{decisionNames[decision]}{demo && " (demo)"}</span>}</p>
      </div>
      <button type="button" className="text-link" onClick={onClose}>Close</button>
    </div>

    <PlainStory v={v} />
    {v.notes.length > 0 && <div className="bw-notes"><h4>Before you block</h4><ul>{v.notes.map(n => <li key={n}>{n}</li>)}</ul></div>}
    {actions && <div className="bw-decide"><span>Your call:</span>{actions}<ActionHelp demo={demo} view={false} /></div>}

    <div className="bw-detail-block">
      <h3>Request timeline</h3>
      <p className="bw-sub">Each bar shows how many requests this visitor sent per {bucketLabel(own.size)}, {fmtTime(v.first)} – {fmtTime(v.last)}.</p>
      <ActivityChart bins={own.bins} size={own.size} series={[v.label]} height={170} title={`Requests over time from ${v.ip}`} />
    </div>

    <details className="bw-tech bw-tech-detail">
      <summary>Show technical details</summary>
      <dl className="bw-detail-stats">
        <div><dt>Requests</dt><dd>{v.requests.length.toLocaleString("en-US")}</dd></div>
        <div><dt>First seen</dt><dd>{fmtTime(v.first)}</dd></div>
        <div><dt>Last seen</dt><dd>{fmtTime(v.last)}</dd></div>
        <div><dt>Active for</dt><dd>{fmtDuration(v.last - v.first)}</dd></div>
        <div><dt>Busiest minute</dt><dd>{plural(v.peakPerMinute, "request")}</dd></div>
      </dl>

      <div className="bw-why">
        <h3>Detection rules that matched</h3>
        {v.reasons.length ? <ul>{v.reasons.map(r => <li key={r.text} data-concern={r.concern || undefined}><span className="bw-why-kind">{r.concern ? "Concern" : "Automation sign"}</span>{r.text}</li>)}</ul> : <p className="bw-muted">Nothing unusual found by Bot Watch’s rules. This looks like ordinary traffic.</p>}
      </div>

      <div className="bw-two">
        <div className="bw-detail-block">
          <h3>Top requested paths</h3>
          <BarList rows={v.paths.slice(0, 8).map(([path, n]) => ({ key: path, label: <code>{path}</code>, title: path, value: n, flag: pathFlags.get(path) ?? (probeOf(path) ? `Probe target: ${probeOf(path)}` : null) }))} />
          {v.paths.length > 8 && <p className="small-note">Plus {plural(v.paths.length - 8, "other path")}.</p>}
        </div>
        <div className="bw-detail-block">
          <h3>Status codes</h3>
          <BarList max={v.requests.length} rows={["2xx Success", "3xx Redirect", "4xx Client error", "5xx Server error"].filter(c => classes.has(c)).map(c => ({
            key: c, label: c, value: classes.get(c)!.reduce((n, [, k]) => n + k, 0),
            sub: <span className="bw-muted">{classes.get(c)!.map(([code, n]) => `${code} × ${n.toLocaleString("en-US")}`).join(" · ")}</span>,
          }))} />
          <h3 className="bw-ua-heading">User agent{v.agents.length > 1 ? "s" : ""}</h3>
          <ul className="bw-agents">{v.agents.slice(0, 4).map(([ua, n]) => <li key={ua}><code>{ua}</code>{v.agents.length > 1 && <span className="bw-muted"> · {plural(n, "request")}</span>}</li>)}</ul>
          <p className="small-note">A user agent is what the visitor says it is. It can be faked.</p>
        </div>
      </div>

      <div className="bw-detail-block">
        <h3>Recent requests ({Math.min(25, v.requests.length)} of {v.requests.length.toLocaleString("en-US")})</h3>
        <div className="bw-table-scroll"><table className="bw-table">
          <thead><tr><th>Time</th><th>Method</th><th>Path</th><th className="num">Status</th></tr></thead>
          <tbody>{recent.map((r, i) => <tr key={i}><td>{clock(r.time)}</td><td>{r.method}</td><td><code>{r.url}</code></td><td className="num">{r.status}</td></tr>)}</tbody>
        </table></div>
      </div>
      <p className="small-note">Labels come from simple rules applied to these requests only: {labelName.suspicious.toLowerCase()} means at least one concern, {labelName.automated.toLowerCase()} means automation signs without a concern. They aren’t proof of intent.</p>
    </details>
  </section>;
}
