"use client";

import { useEffect, useRef, useState, type CSSProperties, type Dispatch, type KeyboardEvent, type PointerEvent, type ReactNode, type SetStateAction } from "react";
import { VIEWS, type View } from "./products";
import type { ZoneId } from "./zones";
import { Mannequin, type FitBody, type Layer } from "./Mannequin";
import type { Shape } from "./body";
import type { ToneId } from "./fit";
import type { PersonSet } from "./person";
import { STAGE, ZOOM, canPan, clampPan, clampZoom, fitSize, panRoom, type Pan, type Size, type Stage } from "./view";

// The viewer, used by both the builder and Preview. It shows a stage: a backdrop (background color, or a
// wall and floor with wall art) with the mannequin over it, or just the backdrop in Scene mode. At 100%
// the whole stage fits; zooming in makes it larger than the viewer, and then it can be dragged (mouse or
// touch), moved with the arrow buttons, or moved with the arrow keys. Dragging never scrolls the page.

const DRAG_THRESHOLD = 4, KEY_STEP = 0.06;

export function MannequinViewer({ layers, view, zoom, pan, onPan, onRoom, className = "", stage = STAGE, backdrop, background, dark = false, showMannequin = true, guides, onDeselect, ...mannequin }: {
  layers: Layer[]; view: View; zoom: number; pan: Pan; onPan: (pan: Pan) => void;
  /** Reports how far this viewer lets the figure move, so the arrow buttons know their limits. */
  onRoom?: (room: Pan) => void; className?: string;
  /** The area shown at 100%, and what's drawn under the mannequin (it handles background taps itself). */
  stage?: Stage; backdrop?: ReactNode; background?: string; dark?: boolean; showMannequin?: boolean; guides?: boolean;
  selected?: ZoneId | null; onSelect?: (zone: ZoneId) => void; onDeselect?: () => void;
  labels?: Partial<Record<ZoneId, string>>; interactive?: boolean; id?: string; shape?: Shape; tone?: ToneId; fitBody?: FitBody; person?: PersonSet;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ w: 0, h: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ id: number; x: number; y: number; pan: Pan; moved: boolean } | null>(null);
  const justDragged = useRef(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fig = fitSize(size, stage), room = panRoom(zoom, size, stage), pannable = canPan(room), shown = clampPan(pan, room);
  useEffect(() => { if (size.w) onRoom?.(room); }, [room.x, room.y, size.w, onRoom]); // eslint-disable-line react-hooks/exhaustive-deps

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (!pannable || e.button !== 0) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, pan: shown, moved: false };
  }
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.moved) {
      // A press without movement stays a normal tap (so body areas can still be chosen while zoomed).
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      d.moved = true; setDragging(true);
      box.current?.setPointerCapture(e.pointerId);
    }
    onPan(clampPan({ x: d.pan.x + dx / (fig.w * zoom), y: d.pan.y + dy / (fig.h * zoom) }, room));
  }
  function endDrag(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (d.moved) { justDragged.current = true; box.current?.releasePointerCapture(e.pointerId); }
    drag.current = null; setDragging(false);
  }
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const move = { ArrowLeft: [KEY_STEP, 0], ArrowRight: [-KEY_STEP, 0], ArrowUp: [0, KEY_STEP], ArrowDown: [0, -KEY_STEP] }[e.key];
    if (!move || !pannable) return;
    e.preventDefault();
    onPan(clampPan({ x: shown.x + move[0], y: shown.y + move[1] }, room));
  }

  const style = background ? { background, "--ob-wall": background } as CSSProperties : undefined;
  return <div ref={box} className={`ob-viewer ${className}`} style={style} data-dark={dark ? "" : undefined} data-pannable={pannable ? "" : undefined} data-dragging={dragging ? "" : undefined}
    tabIndex={pannable ? 0 : undefined} aria-label={pannable ? "Zoomed view. Drag, or use the arrow keys, to move around." : undefined}
    onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag} onKeyDown={onKeyDown}
    onClickCapture={e => { if (justDragged.current) { justDragged.current = false; e.stopPropagation(); e.preventDefault(); } }}
    onClick={e => { if (e.target === e.currentTarget) onDeselect?.(); }}>
    {size.w > 0 && <div className="ob-viewer-figure" style={{ width: fig.w, height: fig.h, transform: `translate(${shown.x * fig.w * zoom}px, ${shown.y * fig.h * zoom}px) scale(${zoom})` }}>
      {backdrop}
      {showMannequin && <Mannequin layers={layers} view={view} stage={stage} guides={guides} onDeselect={backdrop ? undefined : onDeselect} {...mannequin} />}
    </div>}
  </div>;
}

/**
 * Viewer controls: Front | Left | Right | Back, then − zoom + with Fit Outfit and Reset View, and move
 * arrows when zoomed in. Fit Outfit shows the whole body again; Reset View also returns to the front.
 */
export function ViewerControls({ view, onView, zoom, onZoom, onFit, onReset, room, onNudge, long = false, angles = true, fitLabel = "Fit Outfit" }: {
  view: View; onView: (view: View) => void; zoom: number; onZoom: Dispatch<SetStateAction<number>>;
  onFit: () => void; onReset: () => void; room: Pan; onNudge: (dx: number, dy: number) => void; long?: boolean;
  /** Off when there's no mannequin to turn (Scene mode). */
  angles?: boolean; fitLabel?: string;
}) {
  const fitted = zoom === 1;
  return <div className="ob-viewer-controls">
    {angles && <div className="ob-views" role="group" aria-label="Viewing angle">{VIEWS.map(v => <button key={v.id} type="button" aria-pressed={view === v.id} aria-label={v.name} onClick={() => onView(v.id)}>{long ? v.name : v.short}</button>)}</div>}
    <div className="ob-zoom" role="group" aria-label="Mannequin zoom">
      <button type="button" className="ob-zoom-btn" onClick={() => onZoom(z => clampZoom(z - ZOOM.step))} disabled={zoom <= ZOOM.min} aria-label="Zoom out">−</button>
      <output className="ob-zoom-value" aria-live="polite" aria-label="Zoom level">{Math.round(zoom * 100)}%</output>
      <button type="button" className="ob-zoom-btn" onClick={() => onZoom(z => clampZoom(z + ZOOM.step))} disabled={zoom >= ZOOM.max} aria-label="Zoom in">+</button>
      <button type="button" className="ob-mini is-fit" onClick={onFit} disabled={fitted}>{fitLabel}</button>
      <button type="button" className="ob-mini" onClick={onReset} disabled={fitted && view === "front"}>Reset View</button>
    </div>
    {canPan(room) && <div className="ob-move" role="group" aria-label="Move around the outfit">
      <span className="ob-move-label">Move <span className="ob-move-hint">or drag</span></span>
      <button type="button" className="ob-zoom-btn" aria-label="Move left" onClick={() => onNudge(1, 0)}>←</button>
      <button type="button" className="ob-zoom-btn" aria-label="Move up" onClick={() => onNudge(0, 1)}>↑</button>
      <button type="button" className="ob-zoom-btn" aria-label="Move down" onClick={() => onNudge(0, -1)}>↓</button>
      <button type="button" className="ob-zoom-btn" aria-label="Move right" onClick={() => onNudge(-1, 0)}>→</button>
    </div>}
  </div>;
}
