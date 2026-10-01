"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { bucketLabel, fmtTime, labelName, type Bin, type Label } from "../engine";

// Chart colors, validated with the dataviz palette checker against white: normal traffic is a
// recessive gray; amber and red are reserved for automated and suspicious traffic. Amber is under
// 3:1 contrast on white, so every chart also has text labels, a legend, and a table view.
export const COLORS: Record<Label, string> = { normal: "#8e8e89", automated: "#e8a317", suspicious: "#c43a31" };
export const STACK: Label[] = ["normal", "automated", "suspicious"];

export function LabelTag({ label }: { label: Label }) {
  return <span className="bw-tag" data-label={label}><span className="bw-dot" style={{ background: COLORS[label] }} aria-hidden="true" />{labelName[label]}</span>;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

function niceTicks(max: number): number[] {
  if (max <= 0) return [0, 1];
  const rough = max / 4, mag = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map(m => m * mag).find(s => s >= rough) ?? 10 * mag;
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}

function binLabel(start: number, size: number, previous?: number) {
  const d = new Date(start);
  if (size >= 86_400_000) return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", ...(d.getMinutes() ? { minute: "2-digit" } : {}) });
  const newDay = previous === undefined || new Date(previous).toDateString() !== d.toDateString();
  return newDay ? `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${time}` : time;
}

/** Rounded 4px data-end on top, square at the baseline. */
function topRounded(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

/**
 * Requests over time as stacked columns (normal at the base, then automated, then suspicious).
 * One y-axis, hairline grid, a crosshair-style hover band with one tooltip listing every series,
 * arrow-key navigation, and a table view. Clicking a column calls `onPick` (used to filter visitors).
 */
export function ActivityChart({ bins, size, series = STACK, height = 220, title, onPick, picked, labelPeak = true, xLabel, tipTime }: {
  bins: Bin[]; size: number; series?: Label[]; height?: number; title: string;
  onPick?: (bin: Bin) => void; picked?: number | null; labelPeak?: boolean;
  /** Custom x-axis labels (return null to skip a bin), for charts like Live View's rolling window. */
  xLabel?: (bin: Bin, index: number) => string | null;
  /** Custom tooltip time line. */
  tipTime?: (bin: Bin) => string;
}) {
  const [box, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const m = { top: labelPeak ? 22 : 10, right: 8, bottom: 28, left: 46 };
  const plotW = Math.max(0, width - m.left - m.right), plotH = height - m.top - m.bottom;
  const totals = bins.map(b => series.reduce((n, k) => n + b[k], 0));
  const ticks = niceTicks(Math.max(...totals, 0)), top = ticks[ticks.length - 1];
  const slot = bins.length ? plotW / bins.length : 0, barW = Math.max(1, Math.min(24, slot - 2));
  const y = (v: number) => m.top + plotH - (v / top) * plotH;
  const peakIndex = totals.indexOf(Math.max(...totals));
  const labelEvery = Math.max(1, Math.ceil(bins.length / Math.max(2, Math.floor(plotW / 75))));
  const current = active ?? null, bin = current !== null ? bins[current] : null;

  function onKey(e: KeyboardEvent) {
    if (!bins.length) return;
    const i = active ?? peakIndex;
    if (e.key === "ArrowRight") { e.preventDefault(); setActive(Math.min(bins.length - 1, i + 1)); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); setActive(Math.max(0, i - 1)); }
    else if ((e.key === "Enter" || e.key === " ") && onPick && active !== null) { e.preventDefault(); onPick(bins[active]); }
    else if (e.key === "Escape") setActive(null);
  }

  return <figure className="bw-chart">
    <div className="bw-chart-box" ref={box} style={{ height }}>
      {width > 0 && <svg width={width} height={height} role="group" tabIndex={0} aria-label={`${title}. Use the left and right arrow keys to read each ${bucketLabel(size)}${onPick ? ", and Enter to see who was active" : ""}.`}
        onKeyDown={onKey} onFocus={() => setActive(a => a ?? peakIndex)} onBlur={() => setActive(null)} onPointerLeave={() => setActive(null)}>
        {ticks.map(t => <g key={t}>
          <line x1={m.left} x2={width - m.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? "#bdbdb8" : "#ececea"} strokeWidth={1} shapeRendering="crispEdges" />
          <text x={m.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="bw-axis">{t.toLocaleString("en-US")}</text>
        </g>)}
        {bins.map((b, i) => {
          const x = m.left + i * slot + (slot - barW) / 2;
          const visible = series.filter(k => b[k] > 0);
          let base = y(0);
          return <g key={b.start}>
            {(current === i || picked === b.start) && <rect x={m.left + i * slot} y={m.top} width={slot} height={plotH} fill={picked === b.start ? "#ebebe7" : "#f3f3f1"} />}
            {visible.map((k, j) => {
              const h = (b[k] / top) * plotH, last = j === visible.length - 1;
              const drawn = Math.max(1, last ? h : h - 2); // 2px surface gap between stacked segments
              const yTop = base - h;
              base = yTop;
              return last ? <path key={k} d={topRounded(x, yTop, barW, drawn)} fill={COLORS[k]} /> : <rect key={k} x={x} y={yTop + (h - drawn)} width={barW} height={drawn} fill={COLORS[k]} />;
            })}
            {labelPeak && i === peakIndex && totals[i] > 0 && <text x={x + barW / 2} y={y(totals[i]) - 7} textAnchor={i > bins.length - 4 ? "end" : i < 3 ? "start" : "middle"} className="bw-peak">Peak {totals[i].toLocaleString("en-US")}</text>}
            <rect x={m.left + i * slot} y={m.top} width={slot} height={plotH + m.bottom} fill="transparent" style={{ cursor: onPick ? "pointer" : "default" }}
              onPointerEnter={() => setActive(i)} onClick={() => onPick?.(b)} />
          </g>;
        })}
        {bins.map((b, i) => {
          const text = xLabel ? xLabel(b, i) : i % labelEvery === 0 ? binLabel(b.start, size, i ? bins[i - labelEvery]?.start : undefined) : null;
          return text && <text key={b.start} x={m.left + i * slot + slot / 2} y={height - 8} textAnchor={i === 0 ? "start" : i === bins.length - 1 ? "end" : "middle"} className="bw-axis">{text}</text>;
        })}
      </svg>}
      {bin && current !== null && <div className="bw-tooltip" role="status" style={{ left: Math.min(Math.max(m.left + current * slot + slot / 2, 90), width - 90), top: 4 }}>
        <p className="bw-tip-time">{tipTime ? tipTime(bin) : <>{fmtTime(bin.start)} – {fmtTime(bin.start + size, false)}</>}</p>
        <p className="bw-tip-total"><strong>{totals[current].toLocaleString("en-US")}</strong> {totals[current] === 1 ? "request" : "requests"}</p>
        {series.length > 1 && series.slice().reverse().map(k => <p key={k} className="bw-tip-row"><span className="bw-line-key" style={{ background: COLORS[k] }} /><strong>{bin[k].toLocaleString("en-US")}</strong> {labelName[k]}</p>)}
        {onPick && <p className="bw-tip-hint">Click to see who was active</p>}
      </div>}
    </div>
    {series.length > 1 && <figcaption className="bw-legend">{series.map(k => <span key={k}><span className="bw-swatch" style={{ background: COLORS[k] }} aria-hidden="true" />{labelName[k]} <span className="bw-legend-n">{bins.reduce((n, b) => n + b[k], 0).toLocaleString("en-US")}</span></span>)}</figcaption>}
    <details className="bw-table-view">
      <summary>Show as table</summary>
      <div className="bw-table-scroll"><table>
        <thead><tr><th>Time</th>{series.length > 1 && series.map(k => <th key={k} className="num">{labelName[k]}</th>)}<th className="num">Total</th></tr></thead>
        <tbody>{bins.map((b, i) => <tr key={b.start}><td>{fmtTime(b.start)}</td>{series.length > 1 && series.map(k => <td key={k} className="num">{b[k].toLocaleString("en-US")}</td>)}<td className="num">{totals[i].toLocaleString("en-US")}</td></tr>)}</tbody>
      </table></div>
    </details>
  </figure>;
}

/** A one-row activity strip for a visitor card, on the same time axis as the main chart. */
export function Sparkline({ bins, label }: { bins: Bin[]; label: Label }) {
  const max = Math.max(...bins.map(b => b.total), 1), w = 160, h = 26, slot = w / bins.length;
  return <svg className="bw-spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
    <line x1={0} x2={w} y1={h - 0.5} y2={h - 0.5} stroke="#dcdcd8" />
    {bins.map((b, i) => b.total > 0 && <rect key={b.start} x={i * slot + 0.25} width={Math.max(1, slot - 0.5)} y={h - 1 - Math.max(2, (b.total / max) * (h - 2))} height={Math.max(2, (b.total / max) * (h - 2))} fill={COLORS[label]} />)}
  </svg>;
}

export type BarRow = { key: string; label: ReactNode; value: number; flag?: string | null; sub?: ReactNode; onClick?: () => void; selected?: boolean; title?: string };

/** Horizontal bars with the value at the tip. Flagged rows get the red mark and a text reason, never color alone. */
export function BarList({ rows, max, unit = "requests" }: { rows: BarRow[]; max?: number; unit?: string }) {
  const top = max ?? Math.max(...rows.map(r => r.value), 1);
  return <ol className="bw-bars">{rows.map(r => {
    const body = <>
      <span className="bw-bar-label" title={r.title}>{r.label}</span>
      <span className="bw-bar-track"><span className="bw-bar" style={{ width: `${Math.max(1, (r.value / top) * 100)}%`, background: r.flag ? COLORS.suspicious : COLORS.normal }} /><span className="bw-bar-value">{r.value.toLocaleString("en-US")}<span className="sr-only"> {unit}</span></span></span>
      {(r.flag || r.sub) && <span className="bw-bar-sub">{r.flag && <span className="bw-flag"><span className="bw-dot" style={{ background: COLORS.suspicious }} aria-hidden="true" />{r.flag}</span>}{r.sub}</span>}
    </>;
    return <li key={r.key} data-flagged={r.flag ? "" : undefined}>{r.onClick ? <button type="button" className="bw-bar-row" aria-pressed={r.selected} onClick={r.onClick}>{body}</button> : <div className="bw-bar-row">{body}</div>}</li>;
  })}</ol>;
}
