// The master visual layer stack: which products draw over which, what's hidden from each angle, and
// optional per-product placement tuning. Kept apart from the drawings so the rules can get more exact
// later (or come from real product data) without touching the mannequin component.

import type { Build } from "./fit";
import type { View } from "./products";
import type { Side, SlotId, ZoneId } from "./zones";

/**
 * Drawing order, bottom to top (the body is under all of it). It follows the usual order of dressing,
 * with a few deliberate choices so things cover each other naturally:
 *   - socks and anklets go under the pants, so long pants cover them and shorts show them
 *   - the belt goes under tops, so an untucked tee shows its lower edge and a hoodie hides it
 *   - watches and bracelets go under sleeves, so a long sleeve covers part of a watch
 *   - chains go over the base layer but under a hoodie, and show through an open jacket
 *   - bags go over outerwear; a scarf goes over bag straps; the hat goes on last
 * A backpack's body also draws BEHIND the mannequin from the front (see accessories.tsx).
 */
export const DRAW_ORDER = [
  "socks", "anklets", "legs", "belt", "wrist", "rings", "base", "necklace", "mid", "outer",
  "waistBag", "bag", "scarf", "gloves", "shoes", "glasses", "earrings", "hat",
] as const;
export type DrawLayer = (typeof DRAW_ORDER)[number];
export const rankOf = (layer: DrawLayer, priority = 0) => DRAW_ORDER.indexOf(layer) + priority / 100;

export type Angle = "front" | "side" | "back";
export const angleOf = (view: View): Angle => view === "left" || view === "right" ? "side" : view;

/** One worn product, as the drawing and the visibility rules see it. */
export type WornItem = { slot: SlotId; index: number; zone: ZoneId; side?: Side; draw: DrawLayer };

/**
 * Simple visibility rules. Each hides an item that would otherwise draw somewhere obviously wrong; the
 * drawing order handles ordinary covering. Add rules here as they're needed.
 */
export const VISIBILITY_RULES: { name: string; hides: (item: WornItem, view: View, worn: WornItem[]) => boolean }[] = [
  { name: "Side views only show the near side; the far wrist, hand, ear, ankle, or shoulder bag is behind the body.",
    hides: (item, view) => angleOf(view) === "side" && !!item.side && item.side !== view },
  { name: "Glasses can't be seen from the back.", hides: (item, view) => view === "back" && item.draw === "glasses" },
  { name: "Gloves cover rings.", hides: (item, _view, worn) => item.draw === "rings" && worn.some(w => w.draw === "gloves") },
];
export const isVisible = (item: WornItem, view: View, worn: WornItem[]) => !VISIBILITY_RULES.some(r => r.hides(item, view, worn));

// ---------- Placement ----------

/**
 * Optional fine-tuning for where a product sits, in drawing units (the 300 × 640 canvas): scale and
 * rotation turn around the anchor point, then the offset moves it. layerPriority nudges it up or down
 * within its layer. Real product art will mostly need small offsets.
 */
export type Placement = { anchorX?: number; anchorY?: number; scale?: number; rotation?: number; offsetX?: number; offsetY?: number; layerPriority?: number };
/**
 * A product's placement, with overrides that apply by angle, by mannequin build, and for mannequins up to
 * a height (in inches). Later overrides win: base, then build, then height, then angle.
 */
export type PlacementSpec = Placement & {
  byView?: Partial<Record<View, Placement>>;
  byBuild?: Partial<Record<Build, Placement>>;
  byHeight?: { maxInches: number; placement: Placement }[];
};
export function resolvePlacement(spec: PlacementSpec | undefined, ctx: { view: View; build: Build; height: number }): Placement {
  if (!spec) return {};
  const { byView, byBuild, byHeight, ...base } = spec;
  const height = byHeight?.slice().sort((a, b) => a.maxInches - b.maxInches).find(h => ctx.height <= h.maxInches)?.placement;
  return { ...base, ...byBuild?.[ctx.build], ...height, ...byView?.[ctx.view] };
}
/** The placement as a point transform, applied before the body shape so the product still follows the body. */
export function placementWarp(p: Placement): ((x: number, y: number) => [number, number]) | null {
  const { anchorX: ax = 150, anchorY: ay = 320, scale = 1, rotation = 0, offsetX = 0, offsetY = 0 } = p;
  if (scale === 1 && rotation === 0 && offsetX === 0 && offsetY === 0) return null;
  const r = (rotation * Math.PI) / 180, cos = Math.cos(r), sin = Math.sin(r);
  return (x, y) => {
    const dx = (x - ax) * scale, dy = (y - ay) * scale;
    return [ax + dx * cos - dy * sin + offsetX, ay + dx * sin + dy * cos + offsetY];
  };
}
