// The mannequin viewer's math: zoom steps, fitting the whole figure in a viewer, and how far a zoomed
// figure can be dragged. Pan is stored as a fraction of the zoomed figure's size (not pixels), so the same
// view carries between the builder's viewer and the larger Preview Outfit viewer.

export const ZOOM = { min: 0.75, max: 3, step: 0.25 };
/** The drawing canvas for the body and each garment (and for real garment PNGs). */
export const CANVAS = { width: 300, height: 640 };
/**
 * What the viewer shows: the canvas plus headroom above it and a margin at each side, so the tallest and
 * widest mannequin (6 ft 10 in) still fits. A taller mannequin reaches higher in this frame; a shorter one lower.
 */
export type Stage = { x: number; y: number; width: number; height: number };
export const STAGE: Stage = { x: -25, y: -90, width: 350, height: 730 };
/**
 * The wider room used by Scene and Full Look: wall on both sides of the mannequin (which stays centered,
 * at the same scale) and a strip of floor below its feet, so wall art sits at real size beside it.
 */
export const ROOM_STAGE: Stage = { x: -225, y: -90, width: 750, height: 790 };

/** Keeps zoom in range and on a 25% step. At 100% the whole figure fits the viewer. */
export function clampZoom(zoom: number) {
  const stepped = Math.round(zoom / ZOOM.step) * ZOOM.step;
  return Math.min(ZOOM.max, Math.max(ZOOM.min, Math.round(stepped * 100) / 100));
}

export type Size = { w: number; h: number };
/** The size of the whole stage (tallest head to feet, or the whole room) fitted inside a viewer, keeping its proportions. */
export function fitSize(viewer: Size, stage: Stage = STAGE): Size {
  const h = Math.max(0, Math.min(viewer.h, (viewer.w * stage.height) / stage.width));
  return { w: (h * stage.width) / stage.height, h };
}

export type Pan = { x: number; y: number };
export const CENTER: Pan = { x: 0, y: 0 };
/** How far the zoomed figure can move from center, as a fraction of its zoomed size. Zero when it already fits. */
export function panRoom(zoom: number, viewer: Size, stage: Stage = STAGE): Pan {
  const fig = fitSize(viewer, stage), w = fig.w * zoom, h = fig.h * zoom;
  return { x: w ? Math.max(0, (w - viewer.w) / 2) / w : 0, y: h ? Math.max(0, (h - viewer.h) / 2) / h : 0 };
}
const clamp = (v: number, limit: number) => Math.min(limit, Math.max(-limit, v));
export const clampPan = (pan: Pan, room: Pan): Pan => ({ x: clamp(pan.x, room.x), y: clamp(pan.y, room.y) });
export const canPan = (room: Pan) => room.x > 0.0005 || room.y > 0.0005;
