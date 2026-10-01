"use client";

import { useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { FLOOR } from "./body";
import { FLOORS, WALLS, floorOf, wallOf, type Environment } from "./env";
import type { ArtStyle, SceneProduct } from "./products";
import { UNITS_PER_INCH, dimensions, type PlacedItem } from "./scene";
import type { Stage } from "./view";

// The backdrop behind the mannequin, and the room for Scene and Full Look: a wall in the chosen color, a
// floor, and wall art drawn at real size. Art can be dragged on the wall, or moved with the arrow keys once
// it has focus. Taps on the empty background deselect. Nothing here is uploaded; it's a fixed, simple room.

const FAR = 4000;

/** Placeholder artwork for a print, drawn in its own box (0,0)-(w,h). Real product images replace these. */
function artwork(style: ArtStyle, w: number, h: number): ReactNode {
  const m = Math.min(w, h);
  switch (style) {
    case "dots": {
      const dots = [[0.22, 0.2, 0.09, "#202020"], [0.7, 0.28, 0.13, "#9e2f28"], [0.4, 0.52, 0.06, "#6f6f6a"], [0.78, 0.66, 0.07, "#202020"], [0.28, 0.78, 0.11, "#b8905f"], [0.55, 0.85, 0.04, "#202020"]] as const;
      return <><rect width={w} height={h} fill="#f3f1ea" />{dots.map(([x, y, r, c], i) => <circle key={i} cx={x * w} cy={y * h} r={r * m} fill={c} />)}</>;
    }
    case "grid": return <>
      <rect width={w} height={h} fill="#27314a" />
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${(w * (i + 1)) / 10},0 L${(w * (i + 1)) / 10},${h} M0,${(h * (i + 1)) / 10} L${w},${(h * (i + 1)) / 10}`} stroke="rgba(255,255,255,0.18)" strokeWidth={0.8} />)}
      <rect x={w * 0.2} y={h * 0.3} width={w * 0.6} height={h * 0.12} fill="none" stroke="#e9e7e1" strokeWidth={2} />
      <circle cx={w * 0.5} cy={h * 0.62} r={m * 0.16} fill="none" stroke="#e9e7e1" strokeWidth={2} />
    </>;
    case "bulb": return <>
      <rect width={w} height={h} fill="#eee5d1" />
      <circle cx={w / 2} cy={h * 0.42} r={m * 0.22} fill="#202020" />
      <rect x={w / 2 - m * 0.09} y={h * 0.42 + m * 0.2} width={m * 0.18} height={m * 0.14} fill="#6f6f6a" />
      {[0, 1, 2, 3, 4].map(i => { const a = Math.PI * (1.1 + i * 0.2); return <path key={i} d={`M${w / 2 + Math.cos(a) * m * 0.3},${h * 0.42 + Math.sin(a) * m * 0.3} L${w / 2 + Math.cos(a) * m * 0.4},${h * 0.42 + Math.sin(a) * m * 0.4}`} stroke="#9e2f28" strokeWidth={2.5} strokeLinecap="round" />; })}
    </>;
    case "stripes": return <>
      <rect width={w} height={h} fill="#1f1f1f" />
      {[0.55, 0.65, 0.75, 0.85].map((y, i) => <rect key={i} y={h * y} width={w} height={h * 0.04} fill={i === 1 ? "#9e2f28" : "#3d3d3d"} />)}
      <circle cx={w * 0.68} cy={h * 0.26} r={m * 0.12} fill="#e9e7e1" />
    </>;
    case "orbit": return <>
      <rect width={w} height={h} fill="#e9e7e1" />
      {[0.38, 0.28, 0.18].map((r, i) => <circle key={i} cx={w / 2} cy={h / 2} r={m * r} fill="none" stroke="#202020" strokeWidth={1.6} />)}
      <circle cx={w / 2 + m * 0.28} cy={h / 2} r={m * 0.04} fill="#9e2f28" /><circle cx={w / 2} cy={h / 2} r={m * 0.07} fill="#202020" />
    </>;
    case "type": return <>
      <text x={w / 2} y={h * 0.47} textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight={900} fontSize={m * 0.2} fill="rgba(0,0,0,0.7)">BUILD</text>
      <text x={w / 2} y={h * 0.7} textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight={900} fontSize={m * 0.2} fill="rgba(0,0,0,0.7)">MODE</text>
    </>;
  }
}

/** One piece of wall art at a given size, drawn from its top-left corner: the mount (paper, frame, canvas, wood) and the art. */
export function SceneArt({ product, color, size }: { product: SceneProduct; color: string; size: string }) {
  const { w, h } = dimensions(product, size), hex = product.colors.find(c => c.name === color)?.hex ?? product.colors[0].hex, inch = UNITS_PER_INCH;
  const art = (x: number, y: number, aw: number, ah: number) => product.image
    ? <image href={product.image} x={x} y={y} width={aw} height={ah} preserveAspectRatio="xMidYMid slice" />
    : <g transform={`translate(${x},${y})`}>{artwork(product.art, aw, ah)}</g>;
  const clip = `clip-${product.id}-${size.replace(/\W/g, "")}`;
  return <g>
    <rect x={2} y={3} width={w} height={h} fill="rgba(0,0,0,0.18)" />
    {product.mount === "frame" ? <>
      <rect width={w} height={h} fill={hex} stroke="rgba(0,0,0,0.3)" strokeWidth={0.8} />
      <rect x={inch} y={inch} width={w - 2 * inch} height={h - 2 * inch} fill="#fbfaf7" />
      {art(inch * 2.5, inch * 2.5, w - inch * 5, h - inch * 5)}
    </> : product.mount === "canvas" ? <>
      {art(0, 0, w, h)}
      <rect x={w - inch * 0.7} width={inch * 0.7} height={h} fill={hex} opacity={0.85} />
      <rect y={h - inch * 0.7} width={w} height={inch * 0.7} fill={hex} opacity={0.85} />
    </> : product.mount === "wood" ? <>
      <rect width={w} height={h} rx={inch * 0.4} fill={hex} stroke="rgba(0,0,0,0.3)" strokeWidth={0.8} />
      {[0.2, 0.45, 0.72].map(y => <path key={y} d={`M${inch},${h * y} C${w * 0.3},${h * y - inch} ${w * 0.6},${h * y + inch} ${w - inch},${h * y}`} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth={1} />)}
      {art(0, 0, w, h)}
    </> : <>
      <defs><clipPath id={clip}><rect width={w} height={h} /></clipPath></defs>
      <g clipPath={`url(#${clip})`}>{art(0, 0, w, h)}</g>
      <rect width={w} height={h} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth={0.6} />
    </>}
  </g>;
}

/** A small picture of a scene product for the product list. */
export function SceneThumb({ product, color }: { product: SceneProduct; color: string }) {
  const size = product.sizes[0], { w, h } = dimensions(product, size), pad = Math.max(w, h) * 0.12, side = Math.max(w, h) + pad * 2;
  return <svg className="ob-thumb" viewBox={`${w / 2 - side / 2} ${h / 2 - side / 2} ${side} ${side}`} aria-hidden="true"><SceneArt product={product} color={color} size={size} /></svg>;
}

/**
 * The backdrop: just the background color in Outfit mode; a wall, floor, and wall art in a room. With
 * `interactive` off (Preview) the art can't be moved and nothing is outlined.
 */
export function Backdrop({ room, env, stage, items, selectedKey, interactive = true, onSelect, onMove, onBackground }: {
  room: boolean; env: Environment; stage: Stage; items: PlacedItem[]; selectedKey?: string | null; interactive?: boolean;
  onSelect?: (key: string) => void; onMove?: (key: string, x: number, y: number) => void; onBackground?: () => void;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ key: string; id: number; dx: number; dy: number } | null>(null);
  const wall = wallOf(env.wall), floor = floorOf(env.floor);
  /** A screen point in stage units, through any zoom on the viewer. */
  const toStage = (clientX: number, clientY: number) => {
    const s = svg.current, m = s?.getScreenCTM();
    if (!s || !m) return null;
    const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };
  function down(e: PointerEvent<SVGGElement>, item: PlacedItem["item"]) {
    if (!interactive || e.button !== 0) return;
    // Moving art isn't panning the view.
    e.stopPropagation();
    onSelect?.(item.key);
    const p = toStage(e.clientX, e.clientY);
    if (!p) return;
    drag.current = { key: item.key, id: e.pointerId, dx: item.x - p.x, dy: item.y - p.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent<SVGGElement>) {
    const d = drag.current, p = d && d.id === e.pointerId ? toStage(e.clientX, e.clientY) : null;
    if (d && p) onMove?.(d.key, p.x + d.dx, p.y + d.dy);
  }
  const up = (e: PointerEvent<SVGGElement>) => { if (drag.current?.id === e.pointerId) drag.current = null; };
  function key(e: KeyboardEvent<SVGGElement>, item: PlacedItem["item"]) {
    const step = UNITS_PER_INCH * (e.shiftKey ? 6 : 2);
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (d) { e.preventDefault(); e.stopPropagation(); onMove?.(item.key, item.x + d[0], item.y + d[1]); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(item.key); }
  }

  return <svg ref={svg} className="ob-backdrop-svg" viewBox={`${stage.x} ${stage.y} ${stage.width} ${stage.height}`} data-room={room ? "" : undefined}>
    <rect className="ob-wall" x={-FAR} y={-FAR} width={FAR * 2} height={FAR * 2} fill={wall.hex} onClick={onBackground} />
    {room && <g onClick={onBackground}>
      <rect x={-FAR} y={FLOOR - 14} width={FAR * 2} height={14} fill="rgba(0,0,0,0.08)" />
      <rect x={-FAR} y={FLOOR} width={FAR * 2} height={FAR} fill={floor.hex} />
      {floor.boards && Array.from({ length: 5 }, (_, i) => <path key={i} d={`M${-FAR},${FLOOR + 14 + i * 16} L${FAR},${FLOOR + 14 + i * 16}`} stroke="rgba(0,0,0,0.12)" strokeWidth={1} />)}
      <rect x={-FAR} y={FLOOR} width={FAR * 2} height={3} fill="rgba(0,0,0,0.12)" />
    </g>}
    {room && items.map(({ item, product }) => {
      const { w, h } = dimensions(product, item.size), selected = interactive && selectedKey === item.key;
      return <g key={item.key} className="ob-art" data-art={item.key} data-product={product.id} transform={`translate(${item.x - w / 2},${item.y - h / 2})`}
        tabIndex={interactive ? 0 : undefined} role={interactive ? "button" : undefined} aria-label={interactive ? `${product.name}, ${item.size}. Drag, or use the arrow keys, to move it.` : undefined}
        onPointerDown={e => down(e, item)} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onClick={e => e.stopPropagation()} onKeyDown={e => key(e, item)}>
        <SceneArt product={product} color={item.color} size={item.size} />
        {selected && <rect className="ob-art-outline" x={-5} y={-5} width={w + 10} height={h + 10} rx={4} />}
      </g>;
    })}
  </svg>;
}

/** Background (Outfit) or wall and floor (Scene, Full Look) color choices, right under the viewer. */
export function EnvironmentControls({ room, env, onChange }: { room: boolean; env: Environment; onChange: (env: Environment) => void }) {
  return <div className="ob-env">
    <div className="ob-env-row" role="group" aria-label={room ? "Wall color" : "Background color"}>
      <span className="ob-env-label">{room ? "Wall" : "Background"} <strong>{wallOf(env.wall).name}</strong></span>
      <span className="ob-env-swatches">{WALLS.map(w => <button key={w.id} type="button" className="ob-swatch" style={{ background: w.hex }} aria-pressed={env.wall === w.id} title={w.name} onClick={() => onChange({ ...env, wall: w.id })}><span className="sr-only">{w.name}</span></button>)}</span>
    </div>
    {room && <div className="ob-env-row" role="group" aria-label="Floor">
      <span className="ob-env-label">Floor <strong>{floorOf(env.floor).name}</strong></span>
      <span className="ob-env-swatches">{FLOORS.map(f => <button key={f.id} type="button" className="ob-swatch" style={{ background: f.hex }} aria-pressed={env.floor === f.id} title={f.name} onClick={() => onChange({ ...env, floor: f.id })}><span className="sr-only">{f.name} floor</span></button>)}</span>
    </div>}
  </div>;
}
