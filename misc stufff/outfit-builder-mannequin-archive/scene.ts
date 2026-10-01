// Wall art in the room (Scene and Full Look modes). Pure functions, tested on their own.
// Items are placed in stage units (the same drawing units as the mannequin), and sized from each
// product's real size in inches, so an 18×24 poster looks right next to a 5 ft 10 in mannequin.

import { FLOOR } from "./body";
import { HEIGHT } from "./fit";
import type { CartLine } from "./outfit";
import { variantIdFor } from "./outfit";
import type { SceneProduct } from "./products";
import { ROOM_STAGE } from "./view";

/** One piece of wall art: which product, its frame/finish and size, and where its center sits on the wall. */
export type SceneItem = { key: string; productId: string; color: string; size: string; x: number; y: number };

/** The mannequin is 70 in tall from the top of its head (y 24) to the floor, so this many units make an inch. */
export const UNITS_PER_INCH = (FLOOR - 24) / HEIGHT.reference;

export const sizeFor = (product: SceneProduct, size: string) => product.sceneSizes.find(s => s.size === size) ?? product.sceneSizes[0];
/** The item's drawn size in stage units. */
export function dimensions(product: SceneProduct, size: string) {
  const s = sizeFor(product, size);
  return { w: s.w * UNITS_PER_INCH, h: s.h * UNITS_PER_INCH };
}
export const priceOf = (product: SceneProduct, size: string) => sizeFor(product, size).price;
/** The size a new piece starts at: the middle one, so there's room to go smaller or larger. */
export const startSize = (product: SceneProduct) => product.sceneSizes[Math.floor((product.sceneSizes.length - 1) / 2)].size;

/** Keeps an item on the wall: inside the room's sides and ceiling, and above the floor. */
export function clampToWall(x: number, y: number, w: number, h: number) {
  const left = ROOM_STAGE.x + w / 2 + 6, right = ROOM_STAGE.x + ROOM_STAGE.width - w / 2 - 6, top = ROOM_STAGE.y + h / 2 + 6, bottom = FLOOR - 24 - h / 2;
  return { x: Math.round(Math.min(Math.max(x, left), Math.max(left, right))), y: Math.round(Math.min(Math.max(y, top), Math.max(top, bottom))) };
}

/**
 * Where new pieces go: beside the mannequin when it's there (Full Look), otherwise across the wall.
 * The first free spot is used; after that each new piece is nudged off the last one.
 */
const SPOTS = { withMannequin: [[395, 190], [-95, 190], [395, 440], [-95, 440]], alone: [[150, 210], [-80, 210], [380, 210], [150, 440]] };
function freeSpot(items: SceneItem[], withMannequin: boolean) {
  const spots = SPOTS[withMannequin ? "withMannequin" : "alone"];
  const open = spots.find(([x, y]) => items.every(i => Math.hypot(i.x - x, i.y - y) > 70));
  if (open) return { x: open[0], y: open[1] };
  const last = items[items.length - 1];
  return { x: last.x + 30, y: last.y + 30 };
}

/** Where the mannequin stands in the room (its widest reach), so wall art can be kept beside it. */
const MANNEQUIN_SPAN = { left: 20, right: 280 };
/**
 * For Full Look: art hung in Scene mode may sit where the mannequin now stands. Moves any piece that
 * would be hidden behind it to a free spot beside it; everything else stays where the shopper put it.
 */
export function clearOfMannequin(items: SceneItem[], catalog: SceneProduct[]): SceneItem[] {
  let out = items;
  for (const item of items) {
    const product = catalog.find(p => p.id === item.productId);
    if (!product) continue;
    const { w, h } = dimensions(product, item.size);
    if (item.x + w / 2 <= MANNEQUIN_SPAN.left || item.x - w / 2 >= MANNEQUIN_SPAN.right) continue;
    const others = out.filter(o => o.key !== item.key), spot = freeSpot(others, true);
    out = out.map(o => o.key === item.key ? { ...o, ...clampToWall(spot.x, spot.y, w, h) } : o);
  }
  return out;
}

export function addItem(items: SceneItem[], product: SceneProduct, withMannequin: boolean): SceneItem[] {
  const n = items.reduce((m, i) => Math.max(m, Number(i.key.split("-")[1]) || 0), 0) + 1;
  const size = startSize(product), { w, h } = dimensions(product, size), spot = freeSpot(items, withMannequin);
  return [...items, { key: `art-${n}`, productId: product.id, color: product.colors[0].name, size, ...clampToWall(spot.x, spot.y, w, h) }];
}
/** CHANGE: another product in the same spot, keeping the size if it comes in that size. */
export function replaceItem(items: SceneItem[], key: string, product: SceneProduct): SceneItem[] {
  return items.map(i => {
    if (i.key !== key) return i;
    const size = product.sizes.includes(i.size) ? i.size : startSize(product), { w, h } = dimensions(product, size);
    return { ...i, productId: product.id, color: product.colors[0].name, size, ...clampToWall(i.x, i.y, w, h) };
  });
}
export const removeItem = (items: SceneItem[], key: string) => items.filter(i => i.key !== key);

/** Moves, recolors, or resizes one item, and keeps it on the wall. */
export function updateItem(items: SceneItem[], key: string, product: SceneProduct, change: Partial<Pick<SceneItem, "x" | "y" | "color" | "size">>): SceneItem[] {
  return items.map(i => {
    if (i.key !== key) return i;
    const next = { ...i, ...change }, { w, h } = dimensions(product, next.size);
    return { ...next, ...clampToWall(next.x, next.y, w, h) };
  });
}
/** Smaller or larger: the next size down or up that the product comes in. */
export function stepSize(product: SceneProduct, size: string, direction: 1 | -1) {
  const i = product.sizes.indexOf(size), next = product.sizes[i + direction];
  return next ?? size;
}

export type PlacedItem = { item: SceneItem; product: SceneProduct };
export function placed(items: SceneItem[], catalog: SceneProduct[]): PlacedItem[] {
  return items.flatMap(item => { const product = catalog.find(p => p.id === item.productId); return product ? [{ item, product }] : []; });
}
export const sceneTotal = (items: SceneItem[], catalog: SceneProduct[]) => placed(items, catalog).reduce((sum, p) => sum + priceOf(p.product, p.item.size), 0);
/** Wall art goes in the same cart as clothing, one line per piece, priced by its size. */
export function sceneToCartLines(items: SceneItem[], catalog: SceneProduct[]): CartLine[] {
  return placed(items, catalog).map(({ item, product }) => ({
    kind: "scene", productId: product.id, name: product.name, color: item.color, size: item.size, price: priceOf(product, item.size), quantity: 1,
    provider: product.provider, shopifyProductId: product.shopifyProductId, shopifyVariantId: variantIdFor(product, item.color, item.size),
  }));
}
