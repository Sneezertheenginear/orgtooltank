import { useMemo } from "react";
import { categoryOf, imageFor, productPreviewImage, type Product, type View } from "./products";
import { CANVAS, STAGE, type Stage } from "./view";
import { FLOOR, REFERENCE_SHAPE, bodyWarp, compose, imageTransform, inchesToY, roomWarp, warpBox, warpSvg, type Box, type Shape, type Warp } from "./body";
import { HEIGHT, toneOf, type Build, type ToneId } from "./fit";
import { angleOf, isVisible, placementWarp, rankOf, resolvePlacement, type DrawLayer, type WornItem } from "./layers";
import { SLOTS, SLOT_ORDER, UPPER_LAYERS, zoneForSlot, type SlotId, type ZoneId } from "./zones";
import { onSide, paint, type Parts } from "./draw";
import { builderGarmentParts } from "./GarmentLayer";
import { garmentParts } from "./garments";
import { accessoryParts } from "./accessories";
import { personBody, personForeground } from "./PersonLayer";
import type { PersonSet } from "./person";

// The mannequin and everything on it, from the front, left side, right side, or back. The body is drawn
// once; every product is its own layer on top, stacked by the master drawing order in layers.ts (socks,
// pants, belt, shirt, chain, hoodie, jacket, bags, scarf, shoes, glasses, earrings, hat...), with that
// file's visibility rules deciding what can't be seen from an angle. Removing a piece just redraws the
// stack, so whatever was underneath shows again.
//
// All drawing uses one 300 × 640 canvas per angle. Real product art is a transparent PNG per angle
// (frontImage, leftImage, rightImage, backImage) on that same canvas; products without one use the drawn
// placeholders in garments.tsx and accessories.tsx. Side views face right; the left side is mirrored.
//
// Everything is drawn for the reference body. The shopper's height, build, and weight reshape the drawing
// through body.ts, and the mannequin tone only changes the skin color (see TONES in fit.ts). The person
// under the clothing (a realistic photo per angle when there is one, the drawn mannequin otherwise) comes
// from PersonLayer.tsx.

// ---------- Products on the body ----------

/**
 * One worn product. `room` is how roomy its size looks (1 is the drawn regular fit). `index` is its place
 * in a slot that holds several things (a second bracelet).
 */
export type Layer = { slot: SlotId; index: number; product: Product; hex: string; designId?: string; printZone?: View; room?: number };
/** The mannequin's build and height, for products whose placement is tuned per body. */
export type FitBody = { build: Build; height: number };
const REFERENCE_BODY: FitBody = { build: "regular", height: HEIGHT.reference };

/** A product's placeholder drawing, painted in its color: clothing from garments.tsx, everything else from accessories.tsx. */
function drawingFor(layer: Layer, view: View, skin: string): Parts | null {
  if (layer.product.garmentId) return builderGarmentParts(layer.product.garmentId, view, layer.hex, skin, layer.product.designIds?.includes(layer.designId ?? "") ? layer.designId : undefined, layer.printZone);
  const { category } = layer.product, clothing = garmentParts(category, angleOf(view), skin);
  if (clothing) return { main: clothing.main && paint(layer.hex, clothing.main), arm: clothing.arm && paint(layer.hex, clothing.arm) };
  return accessoryParts(category, { hex: layer.hex, view, side: SLOTS[layer.slot].side, index: layer.index, productId: layer.product.id });
}

/** The level each layer is measured at, for fitting a real PNG to the body's width there. */
const IMAGE_LEVEL: Record<DrawLayer, number> = {
  hat: 50, glasses: 60, earrings: 76, scarf: 118, necklace: 150, base: 220, mid: 220, outer: 230, bag: 220, belt: 322, waistBag: 322,
  wrist: 344, rings: 368, gloves: 360, legs: 450, anklets: 576, socks: 590, shoes: 600,
};
type Drawn = { key: string; rank: number; parts: Parts; warp: Warp; layer: Layer; draw: DrawLayer };
/** Everything worn, visible from this angle, in drawing order, with its drawing and the warp that fits it to the body. */
function stack(layers: Layer[], view: View, body: Warp, skin: string, fitBody: FitBody): Drawn[] {
  const side = angleOf(view) === "side";
  const worn = layers.map(l => ({ layer: l, item: { slot: l.slot, index: l.index, zone: zoneForSlot(l.slot), side: SLOTS[l.slot].side, draw: categoryOf(l.product.category).draw } satisfies WornItem }));
  return worn.filter(w => isVisible(w.item, view, worn.map(x => x.item))).flatMap(({ layer, item }) => {
    const placement = resolvePlacement(layer.product.placement, { view, ...fitBody });
    const place = placementWarp(placement), room = roomWarp(layer.room ?? 1, side, UPPER_LAYERS.includes(layer.slot));
    const warp = compose(body, place ? compose(room, place) : room);
    const image = layer.product.garmentId ? "" : imageFor(layer.product, view);
    const parts: Parts | null = image
      ? { main: onSide(<image href={image} x={0} y={0} width={CANVAS.width} height={CANVAS.height} preserveAspectRatio="xMidYMid meet" transform={imageTransform(warp, IMAGE_LEVEL[item.draw], side)} />, item.side, view) }
      : drawingFor(layer, view, skin);
    if (!parts) return [];
    return [{ key: `${layer.slot}-${layer.index}`, rank: rankOf(item.draw, placement.layerPriority) + SLOT_ORDER.indexOf(layer.slot) / 1e4 + layer.index / 1e6, parts, warp: image ? (x: number, y: number) => [x, y] as [number, number] : warp, layer, draw: item.draw }];
  }).sort((a, b) => a.rank - b.rank);
}
const partGroup = (d: Drawn, part: keyof Parts) => d.parts[part] ? <g key={`${d.key}-${part}`} data-layer={d.layer.slot} data-draw={d.draw} data-product={d.layer.product.id} data-index={d.layer.index}
  data-part={part === "main" ? undefined : part} data-room={d.layer.room && d.layer.room !== 1 ? d.layer.room.toFixed(3) : undefined}>{warpSvg(d.parts[part], d.warp)}</g> : null;

// ---------- Tap zones ----------

// Tap targets, drawn for the reference body and reshaped with it. One-sided zones are listed for the side
// that shows on the viewer's left and mirrored for the other side. Big zones come first so the small ones
// on top of them (face, shoulders) win the tap.
const CENTER_FRONT: Partial<Record<ZoneId, Box>> = {
  head: { x: 104, y: 12, w: 92, h: 86 }, upper: { x: 52, y: 132, w: 196, h: 172 }, legs: { x: 92, y: 340, w: 116, h: 214 }, neck: { x: 112, y: 98, w: 76, h: 34 },
  feet: { x: 96, y: 580, w: 108, h: 46 }, waist: { x: 96, y: 304, w: 108, h: 36 }, face: { x: 124, y: 50, w: 52, h: 30 },
};
const SIDED_FRONT = { ears: { x: 102, y: 54, w: 18, h: 32 }, shoulder: { x: 70, y: 122, w: 46, h: 40 }, wrist: { x: 54, y: 326, w: 36, h: 24 }, hand: { x: 56, y: 350, w: 32, h: 36 }, ankle: { x: 100, y: 554, w: 50, h: 26 } };
const CENTER_SIDE: Partial<Record<ZoneId, Box>> = {
  head: { x: 118, y: 12, w: 100, h: 86 }, upper: { x: 98, y: 132, w: 108, h: 170 }, legs: { x: 112, y: 340, w: 82, h: 214 }, neck: { x: 122, y: 98, w: 72, h: 34 },
  feet: { x: 122, y: 580, w: 76, h: 46 }, waist: { x: 112, y: 302, w: 82, h: 38 }, face: { x: 166, y: 48, w: 34, h: 34 },
};
const SIDED_SIDE = { ears: { x: 136, y: 54, w: 22, h: 30 }, shoulder: { x: 128, y: 122, w: 46, h: 40 }, wrist: { x: 128, y: 324, w: 42, h: 24 }, hand: { x: 132, y: 350, w: 34, h: 34 }, ankle: { x: 124, y: 554, w: 52, h: 26 } };
const SIDED_ZONES = { shoulder: ["leftShoulder", "rightShoulder"], wrist: ["leftWrist", "rightWrist"], hand: ["leftHand", "rightHand"], ankle: ["leftAnkle", "rightAnkle"] } as const;
const flipBox = (b: Box): Box => ({ ...b, x: CANVAS.width - b.x - b.w });

/** Each zone's tap boxes from an angle, reshaped with the body. Zones that can't be seen from there have none. */
export function boxesFor(view: View, shape: Shape = REFERENCE_SHAPE): Partial<Record<ZoneId, Box[]>> {
  const side = angleOf(view) === "side", warp = bodyWarp(shape, side), out: Partial<Record<ZoneId, Box[]>> = {};
  const add = (zone: ZoneId, box: Box) => { (out[zone] ??= []).push(warpBox(box, warp)); };
  for (const [zone, box] of Object.entries(side ? CENTER_SIDE : CENTER_FRONT) as [ZoneId, Box][]) if (!(zone === "face" && view === "back")) add(zone, box);
  const sided = side ? SIDED_SIDE : SIDED_FRONT;
  add("ears", sided.ears);
  if (!side) add("ears", flipBox(sided.ears));
  for (const [kind, [left, right]] of Object.entries(SIDED_ZONES)) {
    const box = sided[kind as keyof typeof SIDED_ZONES];
    // From the front the wearer's right is on the viewer's left; from the back, their left is. Side views show the near side.
    if (side) add(view === "left" ? left : right, box);
    else { add(view === "front" ? right : left, box); add(view === "front" ? left : right, flipBox(box)); }
  }
  if (view === "left") for (const boxes of Object.values(out)) for (const b of boxes!) b.x = CANVAS.width - b.x - b.w;
  return out;
}

/** Faint lines at 4, 5, and 6 ft, so height differences are easy to see. */
const HEIGHT_GUIDES = [48, 60, 72];
const heightGuides = <g className="ob-guides" aria-hidden="true">
  {HEIGHT_GUIDES.map(inches => { const y = inchesToY(inches); return <g key={inches}><line x1={STAGE.x} x2={STAGE.x + STAGE.width} y1={y} y2={y} /><text x={STAGE.x + 4} y={y - 4}>{inches / 12} FT</text></g>; })}
  <line className="ob-floor" x1={STAGE.x} x2={STAGE.x + STAGE.width} y1={FLOOR} y2={FLOOR} />
</g>;
/** The mannequin's feet stand on the floor line; in a room the floor itself is drawn by the backdrop. */

/** The selection outline for a zone: its boxes, and its name beside a small zone or inside a big one. */
function selection(boxes: Box[], label: string) {
  const b = boxes[0], big = b.w >= 60 && b.h >= 60, right = b.x + b.w / 2 < CANVAS.width / 2 || boxes.length > 1;
  return <g className="ob-selection" aria-hidden="true">
    {boxes.map((box, i) => <rect key={i} x={box.x} y={box.y} width={box.w} height={box.h} rx={Math.min(10, box.w / 3)} />)}
    {big ? <text x={b.x + 8} y={b.y + 16}>{label}</text>
      : <text x={right ? Math.max(...boxes.map(x => x.x + x.w)) + 6 : b.x - 6} y={b.y + b.h / 2 + 4} textAnchor={right ? "start" : "end"}>{label}</text>}
  </g>;
}

/**
 * The mannequin, from any of the four angles. Tapping a zone calls `onSelect`; tapping empty space calls
 * `onDeselect`. Tap zones are invisible (a faint highlight on hover) and only the selected zone is
 * outlined, so the figure stays clean. The tap targets are hidden from screen readers because the page
 * offers the same choices as regular buttons. With `interactive` off (Preview Outfit) there are no tap
 * targets or outlines. Zoom and pan are handled by the viewer around it.
 */
export function Mannequin({ layers, selected = null, onSelect, onDeselect, labels, interactive = true, id, view = "front", shape = REFERENCE_SHAPE, tone = "brown", fitBody = REFERENCE_BODY, person, stage = STAGE, guides = true }: {
  layers: Layer[]; selected?: ZoneId | null; onSelect?: (zone: ZoneId) => void; onDeselect?: () => void;
  labels?: Partial<Record<ZoneId, string>>; interactive?: boolean; id?: string; view?: View;
  /** The shopper's proportions (see body.ts). */
  shape?: Shape; tone?: ToneId; fitBody?: FitBody;
  /** Realistic person photos per angle (see person.ts); angles without one use the drawn mannequin. */
  person?: PersonSet;
  /** The area the viewer shows (a wider room in Full Look), and whether to draw the height lines. */
  stage?: Stage; guides?: boolean;
}) {
  const side = angleOf(view) === "side";
  const boxes = useMemo(() => boxesFor(view, shape), [view, shape]);
  // Redrawn only when the outfit, body, tone, or angle changes; not while the viewer is dragged around.
  const figure = useMemo(() => {
    const warp = bodyWarp(shape, side), skin = toneOf(tone), drawn = stack(layers, view, warp, skin.fill, fitBody);
    return <>
      {drawn.map(d => partGroup(d, "behind"))}
      {personBody(view, warp, skin, person)}
      {drawn.map(d => partGroup(d, "main"))}
      {/* Side views: the near arm sits in front of the torso; what's on it (watch, sleeves, gloves) goes over it, in order. */}
      {personForeground(view, warp, skin, person)}
      {side && drawn.map(d => partGroup(d, "arm"))}
    </>;
  }, [layers, view, shape, side, tone, fitBody, person]);
  const angleName = { front: "from the front", left: "from the left side", right: "from the right side", back: "from the back" }[view];
  const selectedBoxes = selected ? boxes[selected] : undefined;
  return <svg id={id} className="ob-mannequin" data-view={view} data-tone={tone} viewBox={`${stage.x} ${stage.y} ${stage.width} ${stage.height}`} role="img" aria-label={`Mannequin wearing the outfit you’ve chosen, seen ${angleName}`}>
    {interactive && onDeselect && <rect className="ob-hit ob-backdrop" aria-hidden="true" x={stage.x - stage.width} y={stage.y - stage.height} width={stage.width * 3} height={stage.height * 3} onClick={onDeselect} />}
    {guides && heightGuides}
    {view === "left" ? <g transform={`translate(${CANVAS.width},0) scale(-1,1)`}>{figure}</g> : figure}
    {interactive && selected && selectedBoxes && selection(selectedBoxes, labels?.[selected] ?? selected.toUpperCase())}
    {interactive && onSelect && <g aria-hidden="true">{(Object.entries(boxes) as [ZoneId, Box[]][]).flatMap(([zone, list]) => list.map((b, i) =>
      <rect key={`${zone}-${i}`} className="ob-hit ob-zone" data-area={zone} x={b.x} y={b.y} width={b.w} height={b.h} rx={Math.min(10, b.w / 3)} onClick={() => onSelect(zone)} />))}</g>}
  </svg>;
}

/** Product pictures are cropped to where each kind of product sits. */
const THUMB_VIEW: Record<DrawLayer, string> = {
  hat: "100 6 100 76", glasses: "112 50 76 32", earrings: "100 54 34 38", necklace: "120 108 60 84", scarf: "96 96 108 146",
  base: "44 96 212 250", mid: "44 96 212 250", outer: "44 96 212 250", bag: "24 110 200 220", belt: "96 300 108 44", waistBag: "96 298 108 56",
  wrist: "50 322 46 38", rings: "56 354 32 32", gloves: "50 330 46 58", legs: "88 300 124 292", anklets: "98 558 58 28", socks: "98 546 104 78", shoes: "96 540 108 88",
};
/** A small product picture: its photo when there is one, otherwise its placeholder drawing. */
export function GarmentThumb({ product, hex, color, tone = "brown" }: { product: Product; hex: string; color?: string; tone?: ToneId }) {
  const previewImage = productPreviewImage(product, color ?? product.colors.find(c => c.hex === hex)?.name);
  // Supplier image domains aren't known yet; switch to next/image once they're configured.
  // eslint-disable-next-line @next/next/no-img-element
  if (previewImage) return <img className="ob-thumb" src={previewImage} alt={`${product.name} — ${color ?? product.colors.find(c => c.hex === hex)?.name ?? "product"} preview`} />;
  const cat = categoryOf(product.category), view = cat.thumbFromBack ? "back" : "front";
  const parts = drawingFor({ slot: product.slots.at(-1)!, index: 0, product, hex }, view, toneOf(tone).fill);
  const box = product.category === "coats" ? "40 96 220 344" : cat.id === "backpacks" || cat.id === "bookbags" ? "90 120 120 196" : THUMB_VIEW[cat.draw];
  return <svg className="ob-thumb" viewBox={box} aria-hidden="true">{parts?.behind}{parts?.main}{parts?.arm}</svg>;
}
