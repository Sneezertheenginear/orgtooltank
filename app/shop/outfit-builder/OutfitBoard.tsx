/* eslint-disable @next/next/no-img-element -- product images are shown whole with object-fit: contain inside fixed board spots */
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { isDark, resolveImage, type Product, type Scene } from "./catalog";
import { boardLayout, clampPan, clampZoom, compositionCenter, isCentered, zoomTransform, type Pan } from "./board-layout";

// The outfit board: the chosen products laid out like a mood board over the chosen background, arranged by
// boardLayout (board-layout.ts): hat, top, pants, and shoes down the middle, the jacket offset behind the shirt, the
// accessory to one side. Each product image is shown whole and unchanged: it's fitted inside its spot with
// object-fit: contain, never stretched, cropped, or recolored.
//
// The composition floats on the board like an image viewer: the mouse wheel (or a trackpad pinch) zooms, and
// dragging moves it in any direction. On touch, one finger drags and two fingers pinch to zoom. Zoom and pan
// move the whole composition as one group (one uniform scale and one translation), so products keep their
// proportions and spacing. Everything stays clipped inside the board.

type Point = { x: number; y: number };
/** Where a drag or pinch started, so moves are measured from there (no drift). */
type Gesture = { pan: Pan; zoom: number; point: Point; distance: number };

export default function OutfitBoard({ found, products, showOutfit, scene, wall, setup, empty, zoom, onZoom, pan, onPan }: {
  found: ReadonlySet<string>; products: Product[]; showOutfit: boolean; scene: Scene; wall: string; setup: boolean; empty: string;
  zoom: number; onZoom: (zoom: number) => void; pan: Pan; onPan: (pan: Pan) => void;
}) {
  const board = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<Gesture | null>(null);
  const [dragging, setDragging] = useState(false);

  // Plain background in the chosen wall color.
  const background = wall;
  const dark = isDark(wall);
  const shown = showOutfit ? products : [];
  const spots = boardLayout(shown.map(p => p.category));
  const center = compositionCenter(spots);
  const canMove = shown.length > 0;
  // Zoom changes can put an earlier pan out of range; what's drawn is always kept on the board.
  const shownPan = clampPan(pan, zoom, center);

  // Handlers read the latest values through a ref, so listeners don't need re-binding on every change.
  const latest = useRef({ zoom, pan: shownPan, center, onZoom, onPan });
  useEffect(() => { latest.current = { zoom, pan: shownPan, center, onZoom, onPan }; });

  // A native, non-passive listener, so the wheel zooms the board instead of scrolling the page while the
  // pointer is over it. Trackpad pinches arrive as wheel events with ctrlKey and smaller steps.
  useEffect(() => {
    const el = board.current;
    if (!el || !canMove) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const { zoom, pan, center, onZoom, onPan } = latest.current;
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      const next = clampZoom(zoom * Math.exp(-delta * (e.ctrlKey ? 0.01 : 0.0015)));
      if (next === zoom) return;
      latest.current.zoom = next; onZoom(next);
      onPan(clampPan(pan, next, center));
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [canMove]);

  /** The board's inner size, which pan percentages are measured against. */
  const size = () => ({ w: board.current?.clientWidth || 1, h: board.current?.clientHeight || 1 });
  /** The middle of the pointers down, and (with two) how far apart they are. */
  function measure(): { point: Point; distance: number } {
    const all = [...pointers.current.values()];
    const point = { x: all.reduce((s, p) => s + p.x, 0) / all.length, y: all.reduce((s, p) => s + p.y, 0) / all.length };
    const distance = all.length > 1 ? Math.hypot(all[0].x - all[1].x, all[0].y - all[1].y) : 0;
    return { point, distance };
  }
  /** Starts (or restarts, when a finger is added or lifted) a drag or pinch from where things are now. */
  function begin() {
    gesture.current = pointers.current.size ? { pan: latest.current.pan, zoom: latest.current.zoom, ...measure() } : null;
  }

  function down(e: PointerEvent<HTMLDivElement>) {
    if (!canMove || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    begin(); setDragging(true);
  }
  function move(e: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current, now = measure(), { w, h } = size(), { center, onZoom, onPan } = latest.current;
    // Two fingers: zoom by how far they've spread, from where the pinch started.
    const zoom = pointers.current.size > 1 && g.distance > 0 ? clampZoom(g.zoom * now.distance / g.distance) : latest.current.zoom;
    if (zoom !== latest.current.zoom) { latest.current.zoom = zoom; onZoom(zoom); }
    const pan = clampPan({ x: g.pan.x + (now.point.x - g.point.x) / w * 100, y: g.pan.y + (now.point.y - g.point.y) / h * 100 }, zoom, center);
    latest.current.pan = pan; onPan(pan);
  }
  function up(e: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.delete(e.pointerId)) return;
    begin();
    if (!pointers.current.size) setDragging(false);
  }

  const label = shown.length ? `Outfit board on a ${scene.name.toLowerCase()} background: ${shown.map(p => p.name).join(", ")}.` : `${scene.name} background.`;
  // At the default view, a vertical swipe still scrolls the page on touch screens; once the outfit is zoomed or
  // moved, the board takes every touch so one finger can drag it in any direction.
  const holdTouch = canMove && (zoom !== 1 || !isCentered(shownPan) || dragging);

  return <div className="ob-board" ref={board} role="img" aria-label={label} data-dark={dark ? "" : undefined}
    data-pannable={canMove ? "" : undefined} data-dragging={dragging ? "" : undefined} style={{ background, touchAction: holdTouch ? "none" : canMove ? "pan-y" : undefined }}
    onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onDragStart={e => e.preventDefault()}>
    <div className="ob-board-zoom" style={zoomTransform(zoom, center, shownPan)}>
    {shown.map(p => { const src = resolveImage(found, p.image), b = spots[p.category]!;
      return <div key={p.id} className="ob-spot" data-slot={p.category} style={{ left: `${b.left}%`, top: `${b.top}%`, width: `${b.width}%`, height: `${b.height}%`, zIndex: b.z }}>
        {src ? <img src={src} alt="" draggable={false} /> : setup && <span className="ob-slot"><strong>Product image needed</strong><code>public{p.image}</code></span>}
      </div>; })}
    </div>
    {showOutfit && !products.length && <p className="ob-board-empty">{empty}</p>}
  </div>;
}
