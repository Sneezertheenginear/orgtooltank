import type { CategoryId } from "./catalog";

// Where each chosen product sits on the outfit board, as percentages of the board. The board is 3:4, and
// product images are square (see ASSETS.md), so each spot is kept square in real pixels: a spot's width in
// percent of the board's width is its height × 4/3. Images are fitted inside with object-fit: contain, so
// whatever their shape, they're never stretched or cropped.
//
// The composition: hat, top, pants, and shoes stacked down the middle, packed together and centered
// vertically, so a missing category never leaves a gap. The jacket sits a little to the right of and
// behind the shirt. The accessory goes to one side, beside the row that leaves it room.

export type Box = { left: number; top: number; width: number; height: number; z: number };
type Row = "hats" | "top" | "pants" | "shoes";

const ASPECT = 4 / 3;                // board height / width
/** Each row's height as a share of the board, before scaling. Square images carry some margin, so rows overlap a little. */
const ROW_HEIGHT: Record<Row, number> = { hats: 0.15, top: 0.36, pants: 0.4, shoes: 0.16 };
const GAP = -0.015;
const USABLE = 0.94;                 // leave a 3% margin at the top and bottom
const MAX_SCALE = 1.3;               // a lone item grows, but not to fill the board
const ACCESSORY = 0.18;              // accessory spot height (before any shrinking)
const JACKET_SHIFT = 0.17;           // how far the shirt and jacket move apart, as a share of the board width
const JACKET_DROP = 0.035;
const MIN_ACCESSORY = 0.17;          // smallest accessory spot width worth showing, as a share of the board width

const square = (centerX: number, top: number, height: number, z: number): Box => {
  const width = height * ASPECT;
  return { left: centerX - width / 2, top, width, height, z };
};
const pct = (b: Box): Box => ({ left: b.left * 100, top: b.top * 100, width: b.width * 100, height: b.height * 100, z: b.z });

export function boardLayout(categories: CategoryId[]): Partial<Record<CategoryId, Box>> {
  const has = (c: CategoryId) => categories.includes(c);
  const pair = has("shirts") && has("jackets");
  const rows = (["hats", "top", "pants", "shoes"] as Row[]).filter(r => r === "top" ? has("shirts") || has("jackets") : has(r));
  // An accessory on its own sits in the middle.
  if (!rows.length) return percentages(has("accessories") ? { accessories: square(0.5, 0.35, 0.3, 6) } : {});

  const natural = rows.reduce((sum, r) => sum + ROW_HEIGHT[r], 0) + GAP * (rows.length - 1);
  const fit = Math.min(MAX_SCALE, USABLE / natural);
  // When the accessory can't get a proper-sized spot beside the column (a wide shirt-and-jacket pair with
  // nothing else), the whole composition shrinks a little until it does.
  for (let scale = fit; ; scale *= 0.94) {
    const out = compose(rows, has, pair, scale, natural);
    if (!out.accessories || out.accessories.width >= MIN_ACCESSORY || scale < fit * 0.6) return percentages(out);
  }
}

function compose(rows: Row[], has: (c: CategoryId) => boolean, pair: boolean, scale: number, natural: number) {
  const out: Partial<Record<CategoryId, Box>> = {};
  const height = (r: Row) => ROW_HEIGHT[r] * scale * (r === "top" && pair ? 0.94 : 1);
  /** How far a row reaches left and right of the column's center line. */
  const reach = (r: Row) => {
    const half = height(r) * ASPECT / 2;
    return r === "top" && pair ? { left: half + JACKET_SHIFT / 2, right: half + JACKET_SHIFT } : { left: half, right: half };
  };

  // The accessory goes beside the pants if there are any, then shoes, hat, top: the first row it fits beside.
  // The column moves right to make room (but stays on the board); if there still isn't room, the accessory is smaller.
  let center = 0.5, accessory: { row: Row; size: number } | undefined;
  if (has("accessories")) {
    const row = (["pants", "shoes", "hats", "top"] as Row[]).find(r => rows.includes(r))!;
    // Rows overlap slightly (GAP), so the accessory stays within the part of its row no other row reaches.
    const want = Math.min(ACCESSORY, ROW_HEIGHT[row] * scale + 2 * GAP * scale) * ASPECT, { left } = reach(row);
    const maxCenter = Math.max(0.5, 0.98 - Math.max(...rows.map(r => reach(r).right)));
    center = Math.min(maxCenter, Math.max(0.5, 0.04 + want + left));
    accessory = { row, size: Math.max(0.02, Math.min(want, center - left - 0.04)) / ASPECT };
  }

  let y = (1 - natural * scale) / 2;
  for (const r of rows) {
    const h = height(r), rowH = ROW_HEIGHT[r] * scale;
    if (r !== "top") out[r] = square(center, y, h, r === "pants" ? 3 : r === "shoes" ? 4 : 5);
    else if (pair) {
      out.shirts = square(center - JACKET_SHIFT / 2, y, h, 2);
      out.jackets = square(center + JACKET_SHIFT, y + JACKET_DROP, h, 1);
    } else out[has("shirts") ? "shirts" : "jackets"] = square(center, y, h, 2);
    if (accessory?.row === r) {
      const a = accessory.size;
      out.accessories = { left: center - reach(r).left - 0.02 - a * ASPECT, top: y + (rowH - a) / 2, width: a * ASPECT, height: a, z: 6 };
    }
    y += rowH + GAP * scale;
  }
  if (out.accessories) out.accessories = clearOf(out.accessories, Object.values(out).filter(b => b !== out.accessories));
  return out;
}

/** Moves the accessory left of anything it touches (the dropped jacket can reach its row), shrinking it only if it must. */
function clearOf(a: Box, others: Box[]): Box {
  const touching = others.filter(o => o.top < a.top + a.height && a.top < o.top + o.height);
  const edge = Math.min(a.left + a.width, ...touching.map(o => o.left - 0.02));
  const width = Math.max(0.02, Math.min(a.width, edge - 0.02)), height = width / ASPECT;
  return { ...a, left: edge - width, top: a.top + (a.height - height) / 2, width, height };
}

const percentages = (boxes: Partial<Record<CategoryId, Box>>) => Object.fromEntries(Object.entries(boxes).map(([c, b]) => [c, pct(b)])) as Partial<Record<CategoryId, Box>>;

// ---- Zoom --------------------------------------------------------------------------------------------
// The whole composition zooms as one group (a single uniform scale), so products keep their proportions
// and their places relative to each other. At 100% the board is exactly the layout above.

export const ZOOM = { min: 0.5, max: 3, step: 0.25 };
/** Keeps zoom in range, rounded to whole percents. */
export const clampZoom = (zoom: number) => Math.min(ZOOM.max, Math.max(ZOOM.min, Math.round(zoom * 100) / 100));
/** The next button step in or out: always lands on a 25% step, and never past the limits. */
export function stepZoom(zoom: number, direction: 1 | -1) {
  const steps = zoom / ZOOM.step, next = direction > 0 ? Math.floor(steps + 1e-9) + 1 : Math.ceil(steps - 1e-9) - 1;
  return clampZoom(next * ZOOM.step);
}

/** The middle of everything on the board (in board %), which zooming keeps centered. */
export function compositionCenter(boxes: Partial<Record<CategoryId, Box>>) {
  const all = Object.values(boxes);
  if (!all.length) return { x: 50, y: 50 };
  const left = Math.min(...all.map(b => b.left)), right = Math.max(...all.map(b => b.left + b.width));
  const top = Math.min(...all.map(b => b.top)), bottom = Math.max(...all.map(b => b.top + b.height));
  return { x: (left + right) / 2, y: (top + bottom) / 2 };
}

// ---- Pan ---------------------------------------------------------------------------------------------
// Dragging moves the whole composition (again as one group) inside the board. The offset is kept as a
// percentage of the board's width and height, so it holds when the board resizes.

export type Pan = { x: number; y: number };
export const CENTERED: Pan = { x: 0, y: 0 };
/** How far in from the board's edges the composition's middle must stay, in board %, so the outfit can't be lost. */
const PAN_KEEP = 5;

/** Where zoom alone puts the composition's middle: eased onto the board's center when zoomed in (fully by 200%). */
function zoomedCenter(zoom: number, center: { x: number; y: number }) {
  const pull = Math.min(1, Math.max(0, zoom - 1));
  return { x: center.x + (50 - center.x) * pull, y: center.y + (50 - center.y) * pull };
}

/** Keeps a pan so the composition's middle stays on the board (at least 5% in from every edge). */
export function clampPan(pan: Pan, zoom: number, center: { x: number; y: number }): Pan {
  const at = zoomedCenter(zoom, center);
  const keep = (v: number, base: number) => Math.min(100 - PAN_KEEP - base, Math.max(PAN_KEEP - base, v));
  return { x: keep(pan.x, at.x), y: keep(pan.y, at.y) };
}
export const isCentered = (pan: Pan) => Math.abs(pan.x) < 1e-6 && Math.abs(pan.y) < 1e-6;

/**
 * The CSS transform for the composition: scaled around its middle (zoom), that middle eased onto the board's
 * center when zoomed in, then moved by the pan. One uniform scale and one translation, so nothing is distorted
 * and every product keeps its spacing.
 */
export function zoomTransform(zoom: number, center: { x: number; y: number }, pan: Pan = CENTERED) {
  const at = zoomedCenter(zoom, center);
  const dx = at.x - center.x + pan.x, dy = at.y - center.y + pan.y;
  return { transform: `translate(${dx}%, ${dy}%) scale(${zoom})`, transformOrigin: `${center.x}% ${center.y}%` };
}
