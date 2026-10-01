// Outfit and cart logic for the Outfit Builder. Pure functions, so the page stays simple and this can be
// tested on its own.
import { categoryOf, products, type Product, type View } from "./products";
import { designOf } from "./designs";
import { garmentOf } from "./garment-models";
import { SLOTS, SLOT_ORDER, zoneOf, type SlotId, type ZoneId } from "./zones";

/** One piece of the outfit. Size starts empty (unless there's only one) so nobody buys a size they didn't choose. */
export type Piece = { productId: string; color: string; size: string; designId?: string; printZone?: View };
/**
 * What's in each slot, in the order it was put on. Most slots hold one piece; multi slots (a wrist, a
 * hand, the neck's chains) hold up to their capacity. Left and right are separate slots.
 */
export type Outfit = Partial<Record<SlotId, Piece[]>>;
/** Where a piece goes: a slot, and optionally which piece in it to replace (for CHANGE). */
export type Target = { slot: SlotId; index?: number };

export const itemsIn = (outfit: Outfit, slot: SlotId) => outfit[slot] ?? [];
export const hasRoom = (outfit: Outfit, slot: SlotId) => itemsIn(outfit, slot).length < SLOTS[slot].capacity;
/** The slots a product can go in, limited to one zone's slots when a zone is given. */
export function slotsFor(product: Product, zone?: ZoneId): SlotId[] {
  const offered = zone ? zoneOf(zone).slots : null;
  return product.slots.filter(s => !offered || offered.includes(s));
}

/**
 * Where a product goes when the shopper just taps it (no ADD or CHANGE chosen first):
 *   1. already on → that piece, unless another slot here has room for it (a second earring goes on the other ear)
 *   2. a one-per-slot kind (a second watch) → replaces the one that's there
 *   3. the first slot with room (left ear, then right ear)
 *   4. a single slot that's full → replaces what's in it (a new hat swaps the old one)
 * Returns null when every place is full (both ears, a full wrist): the shopper chooses what to change.
 */
export function placeFor(outfit: Outfit, product: Product, zone?: ZoneId, catalog: Product[] = products): Target | null {
  const slots = slotsFor(product, zone);
  for (const slot of slots) {
    const i = itemsIn(outfit, slot).findIndex(p => p.productId === product.id);
    if (i < 0) continue;
    // Already on one side with the other side free (an earring): the next tap puts one there too.
    const other = slots.find(s => s !== slot && hasRoom(outfit, s));
    return other ? { slot: other } : { slot, index: i };
  }
  if (categoryOf(product.category).exclusive) for (const slot of slots) {
    const i = itemsIn(outfit, slot).findIndex(p => catalog.find(c => c.id === p.productId)?.category === product.category);
    if (i >= 0) return { slot, index: i };
  }
  const open = slots.find(s => hasRoom(outfit, s));
  if (open) return { slot: open };
  if (slots.length === 1 && SLOTS[slots[0]].capacity === 1) return { slot: slots[0], index: 0 };
  return null;
}

/**
 * Puts a product on the mannequin, in `target` or wherever placeFor says, leaving the rest of the outfit
 * alone. Returns the outfit unchanged when there's nowhere to put it.
 */
export function wear(outfit: Outfit, product: Product, color = product.colors[0]?.name ?? "", target: Target | null = placeFor(outfit, product)): Outfit {
  if (!target || !product.slots.includes(target.slot)) return outfit;
  const items = [...itemsIn(outfit, target.slot)], current = target.index === undefined ? undefined : items[target.index];
  // Swapping color on the same product keeps the chosen size.
  const size = current?.productId === product.id ? current.size : product.sizes.length === 1 ? product.sizes[0] : "";
  const defaultDesign = product.designIds?.includes(product.defaultDesignId ?? "") ? designOf(product.defaultDesignId) : undefined;
  const initialPrint = defaultDesign?.supportedZones.includes("front") && garmentOf(product.garmentId)?.printZones.front
    ? { designId: defaultDesign.id, printZone: "front" as const } : {};
  const piece: Piece = { ...(current?.productId === product.id ? current : initialPrint), productId: product.id, color, size };
  if (current) items[target.index!] = piece;
  else if (items.length < SLOTS[target.slot].capacity) items.push(piece);
  else return outfit;
  return { ...outfit, [target.slot]: items };
}
export function remove(outfit: Outfit, slot: SlotId, index = 0): Outfit {
  const items = itemsIn(outfit, slot).filter((_, i) => i !== index), next = { ...outfit };
  if (items.length) next[slot] = items; else delete next[slot];
  return next;
}
export function update(outfit: Outfit, slot: SlotId, change: Partial<Omit<Piece, "productId">>, index = 0): Outfit {
  const items = itemsIn(outfit, slot);
  if (!items[index]) return outfit;
  return { ...outfit, [slot]: items.map((p, i) => i === index ? { ...p, ...change } : p) };
}

export type Worn = { slot: SlotId; index: number; piece: Piece; product: Product };
/** Every piece, head to toe, with its product. */
export function pieces(outfit: Outfit, catalog: Product[]): Worn[] {
  return SLOT_ORDER.flatMap(slot => itemsIn(outfit, slot).flatMap((piece, index) => {
    const product = catalog.find(p => p.id === piece.productId);
    return product ? [{ slot, index, piece, product }] : [];
  }));
}
export const total = (outfit: Outfit, catalog: Product[]) => pieces(outfit, catalog).reduce((sum, p) => sum + p.product.price, 0);
/** Pieces that still need a size before the outfit can go in the cart. */
export const missingSizes = (outfit: Outfit, catalog: Product[]) => pieces(outfit, catalog).filter(p => !p.piece.size).map(p => p.product);

// ---------- Cart ----------

/** One cart line per piece (clothing and accessories alike), with everything a store needs to find the exact variant. */
export type CartLine = { designId?: string; printZone?: View; kind: "wearable" | "scene"; productId: string; name: string; color: string; size: string; price: number; quantity: number; provider: string; shopifyProductId: string; shopifyVariantId: string };

/** The right variant for a color and size, falling back to the product's default variant. */
export function variantIdFor(product: Pick<Product, "variants" | "shopifyVariantId">, color: string, size: string) {
  return product.variants?.find(v => v.color === color && v.size === size)?.shopifyVariantId ?? product.shopifyVariantId;
}
export function outfitToCartLines(outfit: Outfit, catalog: Product[]): CartLine[] {
  return pieces(outfit, catalog).map(({ piece, product }) => ({
    kind: "wearable", productId: product.id, name: product.name, color: piece.color, size: piece.size, price: product.price, quantity: 1,
    ...(piece.designId ? { designId: piece.designId, printZone: piece.printZone ?? "front" } : {}),
    provider: product.provider, shopifyProductId: product.shopifyProductId, shopifyVariantId: variantIdFor(product, piece.color, piece.size),
  }));
}

/** Anything that can take a whole outfit's lines in one call. */
export type CartAdapter = { addLines(lines: CartLine[]): Promise<{ ok: true } | { ok: false; error: string }> };

/**
 * Test cart used until a store is connected: it just keeps the lines in memory.
 *
 * FUTURE SHOPIFY INTEGRATION POINT: replace this with an adapter that sends every line in ONE Storefront
 * API `cartLinesAdd` call, e.g. lines.map(l => ({ merchandiseId: l.shopifyVariantId, quantity: l.quantity })),
 * so the whole outfit is added in a single action. Other suppliers can implement the same CartAdapter.
 */
export function createTestCart(onChange: (lines: CartLine[]) => void): CartAdapter {
  let lines: CartLine[] = [];
  return {
    async addLines(add) {
      if (!add.length) return { ok: false, error: "The outfit is empty." };
      lines = [...lines, ...add];
      onChange(lines);
      return { ok: true };
    },
  };
}

// ---------- Groundwork for sharing (not used yet) ----------

/**
 * Compact text for an outfit, e.g. "upperBody.base~logo-tee~Black~L;wrist.left~field-watch~Black~One%20size".
 * Ready for a future shareable link or saved outfit ID. Nothing is shared or saved anywhere yet.
 */
export function encodeOutfit(outfit: Outfit): string {
  return SLOT_ORDER.flatMap(slot => itemsIn(outfit, slot).map(p => [SLOTS[slot].key, p.productId, p.color, p.size, ...(p.designId ? [p.designId, p.printZone ?? "front"] : [])].map(encodeURIComponent).join("~"))).join(";");
}
/** Reads an encoded outfit back, keeping only pieces that match a real product, slot, color, and size. */
export function decodeOutfit(text: string, catalog: Product[]): Outfit {
  let outfit: Outfit = {};
  for (const part of text.split(";")) {
    const [key, productId, color, size, designId, printZone] = part.split("~").map(s => { try { return decodeURIComponent(s); } catch { return ""; } });
    const slot = SLOT_ORDER.find(s => SLOTS[s].key === key), product = catalog.find(p => p.id === productId);
    if (!slot || !product || !product.slots.includes(slot) || !product.colors.some(c => c.name === color) || !hasRoom(outfit, slot)) continue;
    const design = designOf(designId), garment = garmentOf(product.garmentId);
    const zone = (printZone || "front") as View;
    const print = design && product.designIds?.includes(design.id) && garment?.printZones[zone] && design.supportedZones.includes(zone) ? { designId: design.id, printZone: zone } : {};
    outfit = { ...outfit, [slot]: [...itemsIn(outfit, slot), { productId, color, size: product.sizes.includes(size) ? size : "", ...print }] };
  }
  return outfit;
}
