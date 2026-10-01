// Mannequin proportions. The body and every placeholder garment are drawn once, for a reference body
// (5 ft 10 in, regular build). To show a shopper's own proportions, every point of that drawing is moved
// by one "warp": the whole figure scales with height (standing on the same floor), and its width at each
// level (shoulders, chest, waist, hips, legs) scales with build and weight. The body and each garment go
// through the same warp, so the clothing stays on the body at any size and layers keep their order.
// A garment can also get a little more or less room around the body, for the size chosen.
//
// Later, garments with real geometry per body type can replace the placeholder drawings; the layer
// system doesn't change.

import { Children, Fragment, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { HEIGHT, REFERENCE_BODY, estimateBody, type FitProfile } from "./fit";
import { CANVAS } from "./view";

export type Point = [number, number];
export type Warp = (x: number, y: number) => Point;
export type Box = { x: number; y: number; w: number; h: number };

/** Where the feet stand in the drawing. Height scales the figure up or down from here. */
export const FLOOR = 618;
/** The reference figure (70 in) runs from the top of the head (y 24) to the floor. */
export const inchesToY = (inches: number) => FLOOR - (inches * (FLOOR - 24)) / HEIGHT.reference;

/** How the shopper's body differs from the reference drawing: overall scale, then width at each level. */
export type Shape = { scale: number; shoulders: number; chest: number; waist: number; hips: number };
export const REFERENCE_SHAPE: Shape = { scale: 1, shoulders: 1, chest: 1, waist: 1, hips: 1 };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * The mannequin's shape from the profile: height sets the overall size; the body estimate (measurements
 * where given) sets the widths, relative to someone the same height. Kept within gentle limits so no
 * build looks exaggerated. Tone plays no part.
 */
export function shapeFor(profile: FitProfile): Shape {
  const { body } = estimateBody(profile);
  const scale = (profile.height ?? HEIGHT.reference) / HEIGHT.reference;
  const rel = (value: number, ref: number) => clamp(value / (ref * scale), 0.8, 1.35);
  return {
    scale,
    shoulders: rel(body.shoulderWidth, REFERENCE_BODY.shoulderWidth),
    chest: rel(body.chest, REFERENCE_BODY.chest),
    waist: rel(body.waist, REFERENCE_BODY.waist),
    hips: rel(body.hips, REFERENCE_BODY.hips),
  };
}

/**
 * Width factor at each height in the drawing, blended in between. The reference torso narrows a lot at
 * the waist, so waist and hip changes count a little extra; otherwise a fuller body would keep that taper.
 */
function widthAt(shape: Shape, y: number) {
  const part = (f: number, amount: number) => 1 + (f - 1) * amount;
  const levels: [number, number][] = [
    [100, part(shape.chest, 0.12)], // head
    [126, part(shape.chest, 0.4)], // neck
    [148, shape.shoulders],
    [205, shape.chest],
    [285, part(shape.waist, 1.35)],
    [345, part(shape.hips, 1.15)],
    [420, part(shape.hips, 0.85)], // thighs
    [500, part(shape.hips, 0.62)], // knees
    [580, part(shape.hips, 0.42)], // ankles
  ];
  if (y <= levels[0][0]) return levels[0][1];
  for (let i = 1; i < levels.length; i++) {
    const [y1, f1] = levels[i];
    if (y <= y1) { const [y0, f0] = levels[i - 1]; return f0 + ((f1 - f0) * (y - y0)) / (y1 - y0); }
  }
  return levels[levels.length - 1][1];
}

/** The body warp for an angle. Side views are drawn facing right, centered a little off the middle. */
export function bodyWarp(shape: Shape, side: boolean): Warp {
  const cx = side ? 152 : CANVAS.width / 2, mid = CANVAS.width / 2;
  return (x, y) => {
    const wide = cx + (x - cx) * widthAt(shape, y);
    return [mid + (wide - mid) * shape.scale, FLOOR - (FLOOR - y) * shape.scale];
  };
}

/**
 * Extra room for one garment before it goes on the body: `room` above 1 is roomier (and tops a little
 * longer), just under 1 is closer to the body. Pants only get wider.
 */
export function roomWarp(room: number, side: boolean, top: boolean): Warp {
  if (room === 1) return (x, y) => [x, y];
  const cx = side ? 152 : CANVAS.width / 2, long = top ? 1 + (room - 1) * 0.5 : 1;
  return (x, y) => [cx + (x - cx) * room, top ? 120 + (y - 120) * long : y];
}
/**
 * A real PNG can't be bent point by point, so it's stretched to match the body at its level: an
 * approximation that keeps it on the body until art made for each body type exists. Used for product
 * art and for the person photos (PersonLayer.tsx).
 */
export function imageTransform(warp: Warp, level: number, side: boolean) {
  const cx = side ? 152 : CANVAS.width / 2, [l] = warp(cx - 50, level), [r] = warp(cx + 50, level), [, top] = warp(cx, 0), [, floor] = warp(cx, FLOOR);
  const a = (r - l) / 100, d = (floor - top) / FLOOR;
  return `matrix(${a},0,0,${d},${(l + r) / 2 - a * cx},${top})`;
}
export const compose = (outer: Warp, inner: Warp): Warp => (x, y) => { const [a, b] = inner(x, y); return outer(a, b); };
/** The same warp seen through a left-right mirror (for drawings made of a mirrored half). */
const mirrored = (warp: Warp): Warp => (x, y) => { const [a, b] = warp(CANVAS.width - x, y); return [CANVAS.width - a, b]; };

const round = (n: number) => Math.round(n * 100) / 100;
/** Moves every point of a path. The drawings use absolute commands whose numbers come in x,y pairs (M, L, C, Z). */
export function warpPath(d: string, warp: Warp) {
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (/[A-Za-z]/.test(t)) { out.push(t); continue; }
    const [x, y] = warp(Number(t), Number(tokens[++i]));
    out.push(`${round(x)},${round(y)}`);
  }
  return out.join(" ");
}
export function warpBox(b: Box, warp: Warp): Box {
  const xs: number[] = [], ys: number[] = [];
  for (let i = 0; i <= 4; i++) for (const x of [b.x, b.x + b.w]) { const [px, py] = warp(x, b.y + (b.h * i) / 4); xs.push(px); ys.push(py); }
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

type SvgProps = Record<string, unknown> & { children?: ReactNode };
const num = (v: unknown) => Number(v ?? 0);

/**
 * Applies a warp to a drawing made of plain SVG shapes (path, ellipse, circle, rect, in groups). A group
 * marked `data-mirror` is a mirrored half, so its contents are warped through the mirror.
 */
export function warpSvg(node: ReactNode, warp: Warp): ReactNode {
  if (!isValidElement(node)) return node;
  const el = node as ReactElement<SvgProps>, p = el.props;
  const inner = el.type !== Fragment && p["data-mirror"] !== undefined ? mirrored(warp) : warp;
  const next: SvgProps = {};
  if (el.type === "path" && typeof p.d === "string") next.d = warpPath(p.d, warp);
  else if (el.type === "ellipse" || el.type === "circle") {
    const cx = num(p.cx), cy = num(p.cy), rx = num(p.rx ?? p.r), ry = num(p.ry ?? p.r);
    const [l] = warp(cx - rx, cy), [r] = warp(cx + rx, cy), [, t] = warp(cx, cy - ry), [, b] = warp(cx, cy + ry);
    Object.assign(next, { cx: round((l + r) / 2), cy: round((t + b) / 2) });
    if (el.type === "circle") next.r = round((Math.abs(r - l) + Math.abs(b - t)) / 4);
    else Object.assign(next, { rx: round(Math.abs(r - l) / 2), ry: round(Math.abs(b - t) / 2) });
  } else if ((el.type === "rect" || el.type === "image")) {
    const box = warpBox({ x: num(p.x), y: num(p.y), w: num(p.width), h: num(p.height) }, warp);
    Object.assign(next, { x: round(box.x), y: round(box.y), width: round(box.w), height: round(box.h) });
  }
  if (p.children !== undefined) next.children = Children.map(p.children, c => warpSvg(c, inner));
  return cloneElement(el, next);
}
