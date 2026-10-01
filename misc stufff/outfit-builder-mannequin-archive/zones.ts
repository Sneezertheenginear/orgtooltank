// Where things go on the mannequin. A ZONE is something the shopper taps (Left wrist, Feet); a SLOT is a
// place that holds products (the left wrist, or socks and shoes). A zone offers one or more slots:
//   single:  one slot, one product (Head: a hat)
//   layered: several slots worn over each other (Upper body: base, mid, outer; Feet: socks, shoes)
//   multi:   a slot that holds several products at once (Left wrist: a watch and bracelets)
// Left and right are the MANNEQUIN's own left and right, and always separate slots. To add a zone or slot,
// add it here and give its categories that slot in products.ts; the builder picks it up from these lists.

export type Side = "left" | "right";
export type ZoneId = "head" | "face" | "ears" | "neck" | "upper" | "leftShoulder" | "rightShoulder" | "leftWrist" | "rightWrist"
  | "leftHand" | "rightHand" | "waist" | "legs" | "leftAnkle" | "rightAnkle" | "feet";
export type SlotId = "head" | "face" | "leftEar" | "rightEar" | "necklace" | "scarf" | "base" | "mid" | "outer" | "back" | "leftShoulder" | "rightShoulder"
  | "leftWrist" | "rightWrist" | "leftHand" | "rightHand" | "gloves" | "belt" | "waistBag" | "legs" | "leftAnkle" | "rightAnkle" | "socks" | "shoes";

export type Slot = {
  /** Stable name, e.g. for a saved outfit or analytics. */
  key: string;
  name: string;
  /** How many products it holds at once. */
  capacity: number;
  side?: Side;
};
export const SLOTS: Record<SlotId, Slot> = {
  head: { key: "head", name: "Head", capacity: 1 },
  face: { key: "face", name: "Face", capacity: 1 },
  leftEar: { key: "ears.left", name: "Left ear", capacity: 1, side: "left" },
  rightEar: { key: "ears.right", name: "Right ear", capacity: 1, side: "right" },
  necklace: { key: "neck.jewelry", name: "Chains & necklaces", capacity: 3 },
  scarf: { key: "neck.scarf", name: "Scarf", capacity: 1 },
  base: { key: "upperBody.base", name: "Base layer", capacity: 1 },
  mid: { key: "upperBody.mid", name: "Mid layer", capacity: 1 },
  outer: { key: "upperBody.outer", name: "Outer layer", capacity: 1 },
  back: { key: "back", name: "Back", capacity: 1 },
  leftShoulder: { key: "shoulder.left", name: "Left shoulder", capacity: 1, side: "left" },
  rightShoulder: { key: "shoulder.right", name: "Right shoulder", capacity: 1, side: "right" },
  leftWrist: { key: "wrist.left", name: "Left wrist", capacity: 3, side: "left" },
  rightWrist: { key: "wrist.right", name: "Right wrist", capacity: 3, side: "right" },
  leftHand: { key: "hand.left", name: "Left hand", capacity: 3, side: "left" },
  rightHand: { key: "hand.right", name: "Right hand", capacity: 3, side: "right" },
  gloves: { key: "hands.gloves", name: "Gloves", capacity: 1 },
  belt: { key: "waist.belt", name: "Belt", capacity: 1 },
  waistBag: { key: "waist.bag", name: "Waist bag", capacity: 1 },
  legs: { key: "legs", name: "Lower body", capacity: 1 },
  leftAnkle: { key: "ankle.left", name: "Left ankle", capacity: 2, side: "left" },
  rightAnkle: { key: "ankle.right", name: "Right ankle", capacity: 2, side: "right" },
  socks: { key: "feet.socks", name: "Socks", capacity: 1 },
  shoes: { key: "feet.shoes", name: "Shoes", capacity: 1 },
};

export type Zone = { id: ZoneId; name: string; hint: string; kind: "single" | "layered" | "multi"; slots: SlotId[]; side?: Side };
/** Every tappable zone, head to toe. */
export const ZONES: Zone[] = [
  { id: "head", name: "Head", hint: "Hats, beanies", kind: "single", slots: ["head"] },
  { id: "face", name: "Face", hint: "Glasses, sunglasses", kind: "single", slots: ["face"] },
  { id: "ears", name: "Ears", hint: "Earrings", kind: "multi", slots: ["leftEar", "rightEar"] },
  { id: "neck", name: "Neck", hint: "Chains, scarves", kind: "layered", slots: ["necklace", "scarf"] },
  { id: "upper", name: "Upper body", hint: "Base, mid, outer", kind: "layered", slots: ["base", "mid", "outer"] },
  { id: "leftShoulder", name: "Left shoulder", hint: "Backpacks, bags", kind: "layered", slots: ["back", "leftShoulder"], side: "left" },
  { id: "rightShoulder", name: "Right shoulder", hint: "Backpacks, bags", kind: "layered", slots: ["back", "rightShoulder"], side: "right" },
  { id: "leftWrist", name: "Left wrist", hint: "Watches, bracelets", kind: "multi", slots: ["leftWrist"], side: "left" },
  { id: "rightWrist", name: "Right wrist", hint: "Watches, bracelets", kind: "multi", slots: ["rightWrist"], side: "right" },
  { id: "leftHand", name: "Left hand", hint: "Rings, gloves", kind: "multi", slots: ["leftHand", "gloves"], side: "left" },
  { id: "rightHand", name: "Right hand", hint: "Rings, gloves", kind: "multi", slots: ["rightHand", "gloves"], side: "right" },
  { id: "waist", name: "Waist", hint: "Belts, waist bags", kind: "layered", slots: ["belt", "waistBag"] },
  { id: "legs", name: "Legs", hint: "Joggers, pants, shorts", kind: "single", slots: ["legs"] },
  { id: "leftAnkle", name: "Left ankle", hint: "Anklets", kind: "multi", slots: ["leftAnkle"], side: "left" },
  { id: "rightAnkle", name: "Right ankle", hint: "Anklets", kind: "multi", slots: ["rightAnkle"], side: "right" },
  { id: "feet", name: "Feet", hint: "Socks, shoes", kind: "layered", slots: ["socks", "shoes"] },
];
export const zoneOf = (id: ZoneId) => ZONES.find(z => z.id === id)!;

/** How the outfit summary is grouped, head to toe. Every slot appears in exactly one group. */
export const SLOT_GROUPS: { id: string; name: string; zone: ZoneId; slots: SlotId[] }[] = [
  { id: "head", name: "Head", zone: "head", slots: ["head"] },
  { id: "face", name: "Face", zone: "face", slots: ["face"] },
  { id: "ears", name: "Ears", zone: "ears", slots: ["leftEar", "rightEar"] },
  { id: "neck", name: "Neck", zone: "neck", slots: ["necklace", "scarf"] },
  { id: "upper", name: "Upper body", zone: "upper", slots: ["base", "mid", "outer"] },
  { id: "back", name: "Back and shoulders", zone: "leftShoulder", slots: ["back", "leftShoulder", "rightShoulder"] },
  { id: "leftWrist", name: "Left wrist", zone: "leftWrist", slots: ["leftWrist"] },
  { id: "rightWrist", name: "Right wrist", zone: "rightWrist", slots: ["rightWrist"] },
  { id: "hands", name: "Hands", zone: "leftHand", slots: ["leftHand", "rightHand", "gloves"] },
  { id: "waist", name: "Waist", zone: "waist", slots: ["belt", "waistBag"] },
  { id: "legs", name: "Legs", zone: "legs", slots: ["legs"] },
  { id: "ankles", name: "Ankles", zone: "leftAnkle", slots: ["leftAnkle", "rightAnkle"] },
  { id: "feet", name: "Feet", zone: "feet", slots: ["socks", "shoes"] },
];
/** Every slot, head to toe (the order for the summary and the cart). */
export const SLOT_ORDER: SlotId[] = SLOT_GROUPS.flatMap(g => g.slots);
/** The zone to open for a slot's ADD or CHANGE (a sided slot opens its own side). */
export function zoneForSlot(slot: SlotId): ZoneId {
  return ZONES.find(z => z.slots.includes(slot) && (!SLOTS[slot].side || z.side === SLOTS[slot].side || !z.side))!.id;
}
/** The three upper-body layers, in the order they're worn. */
export const UPPER_LAYERS: SlotId[] = ["base", "mid", "outer"];
