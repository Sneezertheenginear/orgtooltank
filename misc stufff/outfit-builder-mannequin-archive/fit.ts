// Fit profile and size guidance for the Outfit Builder. Pure functions, tested on their own.
//
// This is fit GUIDANCE, never a guarantee. Height and weight alone can't size clothing well, so they
// are only used when better information is missing. Each product is sized on its own. The order of
// trust is:
//   1. the shopper's own body measurements
//   2. the product's own size chart (a general chart for its category when it has none)
//   3. the shopper's preferred fit
//   4. an estimate from height, weight, and build
// The profile stays in page state. Nothing here is saved or sent anywhere.

import { categoryOf, type Product, type SizeChartRow } from "./products";
import type { SlotId } from "./zones";

// ---------- The profile ----------

export type ToneId = "veryLight" | "light" | "medium" | "brown" | "dark";
/** Mannequin tones. Visual only: tone is never read by any sizing code. Add a tone here to offer it. */
export const TONES: { id: ToneId; name: string; fill: string; edge: string }[] = [
  // Pale but not white: a darker edge keeps the body readable on the light stage.
  { id: "veryLight", name: "Very Light", fill: "#f4e2cf", edge: "#b99474" },
  { id: "light", name: "Light", fill: "#e3bf9c", edge: "#bf9670" },
  { id: "medium", name: "Medium", fill: "#bf8a5f", edge: "#9a6841" },
  { id: "brown", name: "Brown", fill: "#8a5a3b", edge: "#6f4529" },
  { id: "dark", name: "Dark", fill: "#553624", edge: "#3b2416" },
];
export const toneOf = (id: ToneId) => TONES.find(t => t.id === id) ?? TONES.find(t => t.id === "brown")!;

/**
 * Mannequin type. It shapes the mannequin (shoulders, waist, hips) and the starting estimate of body
 * measurements when none are given, and picks a product's women's size chart when it has one. It never
 * decides a size by itself: measurements and each product's own chart still come first.
 */
export type BodyType = "male" | "female";
export const BODY_TYPES: { id: BodyType; name: string }[] = [{ id: "male", name: "Male" }, { id: "female", name: "Female" }];

export type Build = "slim" | "regular" | "broad" | "plus";
export const BUILDS: { id: Build; name: string }[] = [
  { id: "slim", name: "Slim" }, { id: "regular", name: "Regular" }, { id: "broad", name: "Broad" }, { id: "plus", name: "Plus" },
];
export type FitPreference = "fitted" | "regular" | "relaxed" | "oversized";
export const FIT_PREFERENCES: { id: FitPreference; name: string }[] = [
  { id: "fitted", name: "Fitted" }, { id: "regular", name: "Regular" }, { id: "relaxed", name: "Relaxed" }, { id: "oversized", name: "Oversized" },
];

/** Body measurements, always kept in inches. */
export type MeasurementKey = "chest" | "waist" | "hips" | "inseam" | "shoulderWidth" | "sleeveLength";
export const MEASUREMENTS: { id: MeasurementKey; name: string; hint: string; min: number; max: number }[] = [
  { id: "chest", name: "Chest", hint: "Around the fullest part", min: 26, max: 70 },
  { id: "waist", name: "Waist", hint: "Where you wear your pants", min: 20, max: 70 },
  { id: "hips", name: "Hips", hint: "Around the fullest part", min: 26, max: 76 },
  { id: "inseam", name: "Inseam", hint: "Crotch to ankle", min: 22, max: 40 },
  { id: "shoulderWidth", name: "Shoulder width", hint: "Shoulder point to shoulder point, across the back", min: 12, max: 26 },
  { id: "sleeveLength", name: "Sleeve length", hint: "Shoulder point to wrist", min: 18, max: 30 },
];

/**
 * Everything the shopper tells us, stored in inches and pounds. `units` only says how to show and enter
 * values; metric (cm, kg) can be offered later without changing the stored numbers.
 */
export type FitProfile = {
  tone: ToneId;
  bodyType: BodyType;
  build: Build;
  /** Height in inches, or null when not given. */
  height: number | null;
  /** Weight in pounds, or null when not given. */
  weight: number | null;
  measurements: Partial<Record<MeasurementKey, number>>;
  fitPreference: FitPreference;
  units: { length: "in" | "cm"; weight: "lb" | "kg" };
};
export const DEFAULT_PROFILE: FitProfile = { tone: "brown", bodyType: "male", build: "regular", height: null, weight: null, measurements: {}, fitPreference: "regular", units: { length: "in", weight: "lb" } };

export const HEIGHT = { min: 56, max: 82, reference: 70 };
export const WEIGHT = { min: 80, max: 450 };
export const inToCm = (inches: number) => Math.round(inches * 2.54);
export const lbToKg = (lb: number) => Math.round(lb * 0.4536);
export const formatHeight = (inches: number) => `${Math.floor(inches / 12)} ft ${inches % 12} in`;
/** Every height the mannequin can show, for a simple picker. */
export const HEIGHT_OPTIONS = Array.from({ length: HEIGHT.max - HEIGHT.min + 1 }, (_, i) => HEIGHT.min + i);

// ---------- Body estimate ----------

export type Body = { chest: number; waist: number; hips: number; inseam: number; shoulderWidth: number; sleeveLength: number };
/** Where each body number came from. */
export type BodySource = Record<keyof Body, "measured" | "estimated" | "reference">;

/** A reference male body at 5 ft 10 in and 154 lb (BMI about 22). The mannequin drawing matches it. */
export const REFERENCE_BODY: Body = { chest: 38, waist: 32, hips: 38, inseam: 31.5, shoulderWidth: 17.5, sleeveLength: 25 };
/**
 * Starting points for estimates, by mannequin type, at the same height and weight. The female one has
 * narrower shoulders, a more defined waist, and fuller hips; drawn against the male reference, that is
 * what gives the female mannequin its shape. Measurements replace any of these.
 */
const REFERENCE_BODIES: Record<BodyType, Body> = {
  male: REFERENCE_BODY,
  female: { chest: 37, waist: 29.5, hips: 40.5, inseam: 31.5, shoulderWidth: 15.8, sleeveLength: 24 },
};
const REFERENCE_WEIGHT = 154;
/** A typical BMI for each build, used only to shape the mannequin when no weight is given. */
const BUILD_BMI: Record<Build, number> = { slim: 20, regular: 23, broad: 25, plus: 31 };
/** How each build shifts girth from the height/weight estimate: broad is chest and shoulders; plus is waist and hips. */
const BUILD_SHAPE: Record<Build, Partial<Record<keyof Body, number>>> = {
  slim: { chest: 0.98, waist: 0.96, hips: 0.98, shoulderWidth: 0.97 },
  regular: {},
  broad: { chest: 1.05, waist: 0.98, hips: 1, shoulderWidth: 1.08 },
  plus: { chest: 1.02, waist: 1.07, hips: 1.05, shoulderWidth: 1.02 },
};

const weightFromBmi = (bmi: number, height: number) => (bmi * height * height) / 703;

/**
 * The shopper's body, measured where they gave a measurement and estimated otherwise. Girths grow with
 * the square root of weight per inch of height (the waist a little faster); lengths grow with height.
 * Estimates are rough on purpose, and are labeled as estimates wherever they're used.
 */
export function estimateBody(profile: FitProfile): { body: Body; source: BodySource } {
  const height = profile.height ?? HEIGHT.reference;
  const weight = profile.weight ?? weightFromBmi(BUILD_BMI[profile.build], height);
  const girth = Math.sqrt((weight / height) / (REFERENCE_WEIGHT / HEIGHT.reference));
  const tall = height / HEIGHT.reference, shape = BUILD_SHAPE[profile.build], ref = REFERENCE_BODIES[profile.bodyType];
  const estimate: Body = {
    chest: ref.chest * girth * (shape.chest ?? 1),
    waist: ref.waist * girth ** 1.3 * (shape.waist ?? 1),
    hips: ref.hips * girth * (shape.hips ?? 1),
    inseam: ref.inseam * tall,
    shoulderWidth: ref.shoulderWidth * tall ** 0.5 * girth ** 0.35 * (shape.shoulderWidth ?? 1),
    sleeveLength: ref.sleeveLength * tall,
  };
  const known = profile.height !== null && profile.weight !== null;
  const body = { ...estimate }, source = {} as BodySource;
  for (const key of Object.keys(estimate) as (keyof Body)[]) {
    const measured = profile.measurements[key];
    if (measured) { body[key] = measured; source[key] = "measured"; }
    else source[key] = known || (profile.height !== null && (key === "inseam" || key === "sleeveLength")) ? "estimated" : "reference";
  }
  return { body, source };
}

// ---------- Size charts ----------

/**
 * General charts by layer, used only for a product with no size chart of its own. These are rough
 * averages of common unisex cuts, so anything sized from them is an estimate. Garment measurements in
 * inches: chestWidth is flat across the chest (pit to pit); sleeveLength runs shoulder seam to cuff;
 * waist and hip are garment circumferences.
 */
const tops = (chest0: number, step: number, length0: number, sleeve0?: number) =>
  ["XS", "S", "M", "L", "XL", "2XL", "3XL"].map((size, i) => ({ size, chestWidth: chest0 + i * step, bodyLength: length0 + i, ...(sleeve0 ? { sleeveLength: sleeve0 + i * 0.5 } : {}) }));
export const GENERIC_CHARTS: Partial<Record<SlotId, SizeChartRow[]>> = {
  base: tops(17, 2, 27),
  mid: tops(18, 2, 26, 24),
  outer: tops(19, 2, 27, 24.5),
  legs: ["XS", "S", "M", "L", "XL", "2XL", "3XL"].map((size, i) => ({ size, waist: 26 + i * 3, hip: 36 + i * 3, inseam: 30 + Math.min(i, 3) * 0.5 })),
};

/** Extra room each preference wants over the body, in inches of circumference. */
const EASE: Record<"base" | "mid" | "outer" | "legs", Record<FitPreference, number>> = {
  base: { fitted: 1, regular: 3, relaxed: 5.5, oversized: 9 },
  mid: { fitted: 3, regular: 6, relaxed: 9, oversized: 13 },
  outer: { fitted: 5, regular: 8, relaxed: 11, oversized: 15 },
  legs: { fitted: -0.5, regular: 0.5, relaxed: 1.5, oversized: 3 },
};
/** Only clothing gets fit guidance: tops by layer, and bottoms. Accessories use their own sizes (rings, shoes) or none. */
const easeKind = (product: Product) => { const slot = product.slots[0]; return slot === "base" || slot === "mid" || slot === "outer" || slot === "legs" ? slot : null; };

/**
 * The chart used for a product: its women's chart for a female mannequin when it has separate women's
 * sizing, otherwise its own chart (with the sizes it's sold in), otherwise the general one.
 */
export function chartFor(product: Product, bodyType: BodyType = "male"): { rows: SizeChartRow[]; own: boolean; womens: boolean } {
  const womens = bodyType === "female" && !!product.womensSizeChart?.rows.length, chart = womens ? product.womensSizeChart : product.sizeChart;
  const own = chart?.rows.filter(r => product.sizes.includes(r.size));
  if (own?.length) return { rows: own, own: true, womens };
  return { rows: (GENERIC_CHARTS[product.slots[0]] ?? []).filter(r => product.sizes.includes(r.size)), own: false, womens: false };
}
/** The garment's girth for a size: chest circumference for tops, waist for bottoms. */
const girthOf = (row: SizeChartRow, legs: boolean) => legs ? row.waist : row.chestWidth === undefined ? undefined : row.chestWidth * 2;

// ---------- Recommendations ----------

export type FitStatus = "best" | "estimated" | "needed" | "none";
export const STATUS_NAMES: Record<FitStatus, string> = { best: "Best match", estimated: "Estimated match", needed: "More measurements needed", none: "" };
export type Recommendation = {
  status: FitStatus;
  /** The suggested size, or "" when there isn't enough to go on. */
  size: string;
  /** "Recommended size: XL" or "Estimated size: L". */
  headline: string;
  /** Plain reasons, or what to add for a suggestion. */
  why: string;
  /** Length or edge-of-chart notes, e.g. sleeves may be short. */
  notes: string[];
  /** A measurement that would make this better, if any. */
  tip: string;
};

const PREFERENCE_WORDS: Record<FitPreference, string> = { fitted: "fitted", regular: "regular", relaxed: "relaxed", oversized: "oversized" };
const KIND_WORDS: Partial<Record<string, string>> = { tshirts: "tee", longsleeves: "long sleeve", hoodies: "hoodie", sweatshirts: "sweatshirt", jackets: "jacket", coats: "coat", joggers: "joggers", pants: "pants", shorts: "shorts" };
const list = (items: string[]) => items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;

/**
 * The size suggestion for ONE product. Every piece is sized separately: a tee, a hoodie, and a jacket
 * can each come out different. The shopper can always pick any other size.
 */
export function recommendSize(product: Product, profile: FitProfile): Recommendation {
  const none = (why = ""): Recommendation => ({ status: "none", size: "", headline: "", why, notes: [], tip: "" });
  if (product.sizes.length <= 1) return none();
  const kind = easeKind(product);
  // Accessories aren't sized from the body: show how to pick their size instead, if there is anything to say.
  if (!kind) return none(categoryOf(product.category).sizeHelp ?? "Size guidance isn’t available for this item yet.");
  const legs = kind === "legs", key: keyof Body = legs ? "waist" : "chest", keyName = legs ? "waist" : "chest";
  const { body, source } = estimateBody(profile);
  if (source[key] === "reference") return {
    status: "needed", size: "", headline: "", notes: [],
    why: `Add your height and weight, or your ${keyName} measurement, for a size suggestion.`, tip: "",
  };

  const chart = chartFor(product, profile.bodyType), rows = chart.rows.filter(r => girthOf(r, legs) !== undefined);
  if (!rows.length) return none("Size guidance isn’t available for this item yet.");
  const target = body[key] + EASE[kind][profile.fitPreference];
  // Closest garment girth to the body plus the wanted room. Between two sizes, go up (down for fitted).
  const looser = profile.fitPreference !== "fitted";
  let index = 0;
  rows.forEach((r, i) => {
    const d = Math.abs(girthOf(r, legs)! - target), best = Math.abs(girthOf(rows[index], legs)! - target);
    if (d < best - 0.01 || (Math.abs(d - best) <= 0.01 && looser)) index = i;
  });
  // Only a general chart needs the product's "runs small/large" note; its own chart already shows it.
  if (!chart.own) index = Math.min(rows.length - 1, Math.max(0, index + (product.runsSmall ? 1 : 0) - (product.runsLarge ? 1 : 0)));
  const row = rows[index], size = row.size, girth = girthOf(row, legs)!;

  const notes: string[] = [];
  if (index === rows.length - 1 && girth < target - 2) notes.push(`${size} is the largest size and may feel snug.`);
  if (index === 0 && girth > target + 3) notes.push(`${size} is the smallest size and may feel loose.`);
  if (legs && source.inseam === "measured" && row.inseam !== undefined && body.inseam - row.inseam >= 1.5) notes.push(`The ${row.inseam} in inseam may be short for you.`);
  if (legs && source.inseam === "measured" && row.inseam !== undefined && row.inseam - body.inseam >= 2) notes.push(`The ${row.inseam} in inseam may be long for you.`);
  if (!legs && source.sleeveLength === "measured" && row.sleeveLength !== undefined && product.category !== "tshirts" && body.sleeveLength - row.sleeveLength >= 1.5) notes.push("Sleeves may be short for you.");
  if (!legs && source.shoulderWidth === "measured" && row.shoulderWidth !== undefined && body.shoulderWidth - row.shoulderWidth >= 1) notes.push("Shoulders may feel tight.");
  if (product.sizingNotes) notes.push(product.sizingNotes);

  const measured = source[key] === "measured", thing = KIND_WORDS[product.category] ?? "item", pref = PREFERENCE_WORDS[profile.fitPreference];
  // Placeholder products carry sample charts; say so rather than pass them off as a maker's chart.
  const used = chart.womens ? product.womensSizeChart : product.sizeChart;
  const chartName = `${chart.womens ? "women’s " : ""}${used?.source === "sample" ? "sample size chart" : "size chart"}`;
  const extra = legs ? (source.hips === "measured" ? ["hips"] : []) : (source.shoulderWidth === "measured" && row.shoulderWidth !== undefined ? ["shoulder"] : []);
  if (measured && chart.own) return {
    status: "best", size, headline: `Recommended size: ${size}`, notes, tip: "",
    why: `Your ${list([keyName, ...extra])} ${extra.length ? "measurements" : "measurement"} and ${pref} fit line up most closely with ${size} in this ${thing}’s ${chartName}.`,
  };
  if (measured) return {
    status: "estimated", size, headline: `Estimated size: ${size}`, notes, tip: "",
    why: `Based on your ${keyName} measurement and ${pref} fit, using a general ${legs ? "bottoms" : "tops"} chart. This ${thing} doesn’t have its own size chart yet.`,
  };
  const basis = list(["height", "weight", "build"].filter(k => k !== "build" || profile.build !== "regular"));
  return {
    status: "estimated", size, headline: `Estimated size: ${size}`, notes,
    why: `Estimated from your ${basis} and ${pref} fit${chart.own ? ` with this ${thing}’s ${chartName}` : " with a general size chart"}. Height and weight alone can’t size clothing exactly.`,
    tip: `Add your ${keyName} measurement for better guidance.`,
  };
}

/**
 * How roomy the chosen (or suggested) size looks on the mannequin, for the drawing only: 1 is the
 * drawn regular fit; more is fuller, a little less is closer to the body.
 */
export function garmentRoom(product: Product, size: string, profile: FitProfile): number {
  const kind = easeKind(product);
  if (!kind || !size) return 1;
  const legs = kind === "legs", row = chartFor(product, profile.bodyType).rows.find(r => r.size === size), girth = row && girthOf(row, legs);
  if (girth === undefined) return 1;
  const body = estimateBody(profile).body[legs ? "waist" : "chest"];
  const room = (girth - (body + EASE[kind].regular)) / body;
  return Math.min(1.1, Math.max(0.985, 1 + room * 0.6));
}
