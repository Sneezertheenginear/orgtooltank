// Local demo catalog for the Outfit Builder. Products may include supplied provider mockups; prices are for testing the
// builder; nothing here is for sale yet. To connect a real store, replace `products` with data from
// Printful, Apliiq, Shopify, affiliate partners, local creators, or another source, mapped to the same
// Product shape. Nothing else in the builder needs to change.

import { classicTee } from "./garment-models";
import type { DrawLayer, PlacementSpec } from "./layers";
import type { SlotId, ZoneId } from "./zones";

export type CategoryId =
  | "hats" | "beanies" | "headwear" | "glasses" | "sunglasses" | "earrings"
  | "chains" | "necklaces" | "pendants" | "scarves"
  | "tshirts" | "longsleeves" | "hoodies" | "sweatshirts" | "jackets" | "coats"
  | "backpacks" | "bookbags" | "slingbags" | "shoulderbags"
  | "watches" | "bracelets" | "wristbands" | "rings" | "gloves"
  | "belts" | "waistbags" | "beltbags"
  | "joggers" | "pants" | "shorts" | "leggings" | "anklets"
  | "socks" | "shoes" | "boots" | "slides";

export type Category = {
  id: CategoryId;
  name: string;
  /** The zones whose product list shows this category. */
  zones: ZoneId[];
  /** The slots it can be worn in. A sided category (watches) lists both sides; the zone picks one. */
  slots: SlotId[];
  /** Its place in the drawing order (layers.ts). */
  draw: DrawLayer;
  available: boolean;
  /** Only one of these per slot, even in a slot that holds several things (one watch per wrist). */
  exclusive?: boolean;
  /** What its sizes are, when they aren't clothing sizes, e.g. "Ring size (US)". */
  sizeName?: string;
  /** Shown with the sizes for products without fit guidance, e.g. how to pick a ring size. */
  sizeHelp?: string;
  /** Draw the product picture from the back (a backpack is mostly straps from the front). */
  thumbFromBack?: boolean;
};

const cat = (id: CategoryId, name: string, zones: ZoneId[], slots: SlotId[], draw: DrawLayer, more: Partial<Category> = {}): Category =>
  ({ id, name, zones, slots, draw, available: true, ...more });
const SHOULDERS: ZoneId[] = ["leftShoulder", "rightShoulder"], WRISTS: ZoneId[] = ["leftWrist", "rightWrist"], HANDS: ZoneId[] = ["leftHand", "rightHand"], ANKLES: ZoneId[] = ["leftAnkle", "rightAnkle"];
export const CATEGORIES: Category[] = [
  cat("hats", "Hats", ["head"], ["head"], "hat"),
  cat("beanies", "Beanies", ["head"], ["head"], "hat"),
  cat("headwear", "Headwear", ["head"], ["head"], "hat"),
  cat("glasses", "Glasses", ["face"], ["face"], "glasses"),
  cat("sunglasses", "Sunglasses", ["face"], ["face"], "glasses"),
  cat("earrings", "Earrings", ["ears"], ["leftEar", "rightEar"], "earrings"),
  cat("chains", "Chains", ["neck"], ["necklace"], "necklace"),
  cat("necklaces", "Necklaces", ["neck"], ["necklace"], "necklace"),
  cat("pendants", "Pendants", ["neck"], ["necklace"], "necklace"),
  cat("scarves", "Scarves", ["neck"], ["scarf"], "scarf"),
  cat("tshirts", "T-shirts", ["upper"], ["base"], "base"),
  cat("longsleeves", "Long sleeves", ["upper"], ["base"], "base"),
  cat("hoodies", "Hoodies", ["upper"], ["mid"], "mid"),
  cat("sweatshirts", "Sweatshirts", ["upper"], ["mid"], "mid"),
  cat("jackets", "Jackets", ["upper"], ["outer"], "outer"),
  cat("coats", "Coats", ["upper"], ["outer"], "outer"),
  cat("backpacks", "Backpacks", SHOULDERS, ["back"], "bag", { thumbFromBack: true }),
  cat("bookbags", "Bookbags", SHOULDERS, ["back"], "bag", { thumbFromBack: true }),
  cat("slingbags", "Sling bags", SHOULDERS, ["leftShoulder", "rightShoulder"], "bag"),
  cat("shoulderbags", "Shoulder bags", SHOULDERS, ["leftShoulder", "rightShoulder"], "bag"),
  cat("watches", "Watches", WRISTS, ["leftWrist", "rightWrist"], "wrist", { exclusive: true }),
  cat("bracelets", "Bracelets", WRISTS, ["leftWrist", "rightWrist"], "wrist"),
  cat("wristbands", "Wristbands", WRISTS, ["leftWrist", "rightWrist"], "wrist"),
  cat("rings", "Rings", HANDS, ["leftHand", "rightHand"], "rings", { sizeName: "Ring size (US)", sizeHelp: "Choose your usual ring size (US). Ring size guidance isn’t available yet." }),
  cat("gloves", "Gloves", HANDS, ["gloves"], "gloves"),
  cat("belts", "Belts", ["waist"], ["belt"], "belt", { sizeHelp: "Belt sizes follow your pants waist size." }),
  cat("waistbags", "Waist bags", ["waist"], ["waistBag"], "waistBag"),
  cat("beltbags", "Belt bags", ["waist"], ["waistBag"], "waistBag"),
  cat("joggers", "Joggers", ["legs"], ["legs"], "legs"),
  cat("pants", "Pants", ["legs"], ["legs"], "legs"),
  cat("shorts", "Shorts", ["legs"], ["legs"], "legs"),
  cat("leggings", "Leggings", ["legs"], ["legs"], "legs", { available: false }),
  cat("anklets", "Anklets", ANKLES, ["leftAnkle", "rightAnkle"], "anklets"),
  cat("socks", "Socks", ["feet"], ["socks"], "socks"),
  cat("shoes", "Shoes", ["feet"], ["shoes"], "shoes", { sizeName: "US size", sizeHelp: "Choose your usual US shoe size. Shoe size guidance is coming later." }),
  cat("boots", "Boots", ["feet"], ["shoes"], "shoes", { sizeName: "US size", sizeHelp: "Choose your usual US shoe size. Shoe size guidance is coming later." }),
  cat("slides", "Slides", ["feet"], ["shoes"], "shoes", { sizeHelp: "Slides run S (US 6–7) to XL (US 12–13)." }),
];
export const categoryOf = (id: CategoryId) => CATEGORIES.find(c => c.id === id)!;

export type ProductColor = { name: string; hex: string; /** Browsing image only; never a mannequin layer. */ previewImage?: string };

/**
 * One size in a product's size chart: GARMENT measurements in inches (not body sizes). chestWidth is
 * flat across the chest, pit to pit; bodyLength runs from the high shoulder to the hem; shoulderWidth is
 * seam to seam; sleeveLength runs shoulder seam to cuff; waist and hip are garment circumferences.
 */
export type SizeChartRow = { size: string; chestWidth?: number; bodyLength?: number; shoulderWidth?: number; sleeveLength?: number; waist?: number; hip?: number; inseam?: number; rise?: number };
/**
 * A product's own size chart. Suppliers cut differently (a Printful XL isn't an Apliiq XL), so each
 * product carries its own chart. `source` says where it came from: "manufacturer" for a supplier's
 * published chart, "sample" for the placeholder charts used until the real catalog is connected.
 */
export type SizeChart = { source: "manufacturer" | "sample"; rows: SizeChartRow[] };
/** How the product is cut. It's shown to shoppers, and it's reflected in the chart's measurements. */
export type FitType = "fitted" | "regular" | "relaxed" | "oversized";
/**
 * Facts that matter for accessories, which don't use clothing measurements. All optional; each category
 * uses what fits it. Ring and shoe sizes are the product's `sizes`.
 */
export type AccessoryDetails = {
  /** Watches, bracelets: e.g. "6–8 in". */
  wristSizeRange?: string;
  strapLength?: string;
  /** Hats: e.g. "21.5–23.5 in". */
  headSizeRange?: string;
  adjustable?: boolean;
  /** Bags: e.g. "17 × 12 × 6 in". */
  dimensions?: string;
  strapAdjustability?: string;
  /** Chains and necklaces: e.g. "20 in". */
  chainLength?: string;
  /** Shoes: width options, later. */
  shoeWidths?: string[];
};

/** A wearable product: it goes on a body zone of the mannequin. (Scene products are further down.) */
export type Product = {
  kind: "wearable";
  garmentId?: string;
  /** Optional initial artwork; the selection remains separate from the garment. */
  defaultDesignId?: string;
  /** Designs allowed on this catalog item; artwork remains in designs.ts. */
  designIds?: string[];
  printingMethod?: "DTG";
  localOnly?: boolean;
  priceKind?: "demo";
  id: string;
  name: string;
  category: CategoryId;
  /** The zone it's mainly for (its category's first zone). */
  bodyArea: ZoneId;
  /** Where it can be worn (from its category). */
  slots: SlotId[];
  /** Price in cents, so totals never pick up rounding errors. */
  price: number;
  /** Product photo for the browser. Blank for now: a drawn placeholder is shown instead. */
  image: string;
  /**
   * Transparent PNGs to place on the mannequin, one per viewing angle (front, left side, right side,
   * back), all on the mannequin's 300 × 640 canvas. This works the same for clothing, jewelry, bags,
   * shoes, and hats. Blank for now: drawn placeholder layers are used for any angle without an image.
   * Side accessories (a watch) are drawn for the wearer's right side; the left is mirrored.
   */
  frontImage: string;
  leftImage: string;
  rightImage: string;
  backImage: string;
  colors: ProductColor[];
  /** The sizes it's sold in, smallest first: clothing sizes, ring sizes, shoe sizes, or "One size". */
  sizes: string[];
  /**
   * Who fulfills it: "printful", "apliiq", "shopify", "affiliate", "creator", or any future source. Any
   * product can appear in the builder as long as it has product and variant data. Blank until connected.
   */
  provider: string;
  /** For partner and affiliate products that are bought elsewhere. Blank for store products. */
  affiliateUrl: string;
  /** The blank's brand and model from the provider, e.g. for matching its size chart. Blank for sample products. */
  brand: string;
  productModel: string;
  fitType: FitType;
  /** Fabric weight as the provider states it, e.g. "6.5 oz". Blank until known. */
  garmentWeight: string;
  /** The product's own size chart, or null to fall back on a general chart (sizes from it are only estimates). */
  sizeChart: SizeChart | null;
  /** A separate women's chart, for products with separate men's and women's sizing. Used for a female mannequin. */
  womensSizeChart: SizeChart | null;
  /** A short note shown with the size guidance, e.g. "Cut long in the body." */
  sizingNotes: string;
  /** Only used with the general chart; a product's own chart already shows how it runs. */
  runsSmall: boolean;
  runsLarge: boolean;
  /** Designed to be worn big. */
  oversizedFit: boolean;
  details: AccessoryDetails;
  /** Optional fine-tuning for where it sits on the mannequin, by angle, build, and height (layers.ts). */
  placement?: PlacementSpec;
  shopifyProductId: string;
  /** Default variant. Real products usually have one variant per color and size; see `variants`. */
  shopifyVariantId: string;
  /** Optional per-color/size variant IDs for when the real catalog is connected. */
  variants?: { color: string; size: string; shopifyVariantId: string }[];
};

const BLACK = { name: "Black", hex: "#1f1f1f" }, CHARCOAL = { name: "Charcoal", hex: "#3d3d3d" }, HEATHER = { name: "Heather gray", hex: "#9b9b96" };
const WHITE = { name: "White", hex: "#f3f3ef" }, NAVY = { name: "Navy", hex: "#27314a" }, OLIVE = { name: "Olive", hex: "#5a5d3a" }, TAN = { name: "Tan", hex: "#b89b74" }, RUST = { name: "Rust", hex: "#8e4a2e" };
const GOLD = { name: "Gold", hex: "#c9a24a" }, SILVER = { name: "Silver", hex: "#b9bcc1" }, BROWN = { name: "Brown", hex: "#6b4a2f" }, TORTOISE = { name: "Tortoise", hex: "#7a4e2a" };
const TOPS = ["XS", "S", "M", "L", "XL", "2XL", "3XL"], BOTTOMS = ["S", "M", "L", "XL", "2XL"], ONE = ["One size"], SOCKS = ["S/M", "L/XL"];
const RINGS = ["6", "7", "8", "9", "10", "11", "12"], SHOES = ["6", "7", "8", "9", "10", "11", "12", "13"];
type More = Partial<Pick<Product, "garmentId" | "defaultDesignId" | "designIds" | "printingMethod" | "localOnly" | "priceKind" | "image" | "productModel" | "provider" | "fitType" | "sizeChart" | "womensSizeChart" | "sizingNotes" | "runsSmall" | "runsLarge" | "oversizedFit" | "details" | "placement">>;
const item = (id: string, name: string, category: CategoryId, price: number, colors: ProductColor[], sizes: string[], more: More = {}): Product => {
  const c = categoryOf(category);
  return {
    kind: "wearable", id, name, category, bodyArea: c.zones[0], slots: c.slots, price, image: "", frontImage: "", leftImage: "", rightImage: "", backImage: "", colors, sizes,
    provider: "", affiliateUrl: "", brand: "", productModel: "", fitType: "regular", garmentWeight: "", sizeChart: null, womensSizeChart: null, sizingNotes: "", runsSmall: false, runsLarge: false, oversizedFit: false,
    details: {}, shopifyProductId: "", shopifyVariantId: "", ...more,
  };
};
/**
 * SAMPLE size charts for the placeholder products, made up to show how sizing works. They are not any
 * supplier's real measurements; replace them with each product's published chart when it's connected.
 */
const sample = (sizes: string[], row: (i: number) => Omit<SizeChartRow, "size">): SizeChart => ({ source: "sample", rows: sizes.map((size, i) => ({ size, ...row(i) })) });

export const products: Product[] = [
  // Head and face
  item("dad-hat", "Workbench Dad Hat", "hats", 2600, [BLACK, TAN, WHITE], ONE, { details: { headSizeRange: "21.5–23.5 in", adjustable: true } }),
  item("five-panel", "Five-Panel Cap", "hats", 2800, [CHARCOAL, OLIVE], ONE, { details: { headSizeRange: "21.5–23.5 in", adjustable: true } }),
  item("cuff-beanie", "Cuffed Beanie", "beanies", 2200, [BLACK, HEATHER, OLIVE], ONE, { details: { headSizeRange: "Stretch knit, fits most" } }),
  item("knit-headband", "Knit Headband", "headwear", 1800, [HEATHER, BLACK, RUST], ONE, { details: { headSizeRange: "Stretch knit, fits most" } }),
  item("round-glasses", "Round Frame Glasses", "glasses", 4800, [TORTOISE, BLACK, GOLD], ONE),
  item("classic-shades", "Classic Sunglasses", "sunglasses", 3600, [BLACK, TORTOISE], ONE),
  // Ears: sold one earring at a time, so each ear is its own item.
  item("hoop-earring", "Small Hoop Earring", "earrings", 1800, [GOLD, SILVER], ONE, { sizingNotes: "Sold individually." }),
  item("stud-earring", "Stud Earring", "earrings", 1400, [SILVER, GOLD, BLACK], ONE, { sizingNotes: "Sold individually." }),
  // Neck
  item("rope-chain", "Rope Chain", "chains", 4200, [GOLD, SILVER], ONE, { details: { chainLength: "20 in" } }),
  item("bead-necklace", "Bead Necklace", "necklaces", 2800, [BLACK, WHITE, RUST], ONE, { details: { chainLength: "18 in" } }),
  item("bar-pendant", "Bar Pendant", "pendants", 3400, [SILVER, GOLD], ONE, { details: { chainLength: "22 in" } }),
  item("knit-scarf", "Knit Scarf", "scarves", 3400, [CHARCOAL, RUST, HEATHER], ONE),
  item("wool-scarf", "Wool Blend Scarf", "scarves", 4200, [NAVY, TAN, BLACK], ONE),
  // Upper body: supplied Printful mockups are browsing assets, not mannequin images.
  item("i-renamed-the-pain", "I RENAMED THE PAIN", "tshirts", 2800,
    [
      { ...BLACK, previewImage: "/outfit-builder/products/printful/unisex-classic-tee-black-front-6abc103a5d2c3.png" },
      { name: "Maroon", hex: "#500b27", previewImage: "/outfit-builder/products/printful/unisex-classic-tee-maroon-front-6abc103a5d2fe.png" },
    ], ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
    { garmentId: classicTee.id, provider: "Printful", productModel: "Unisex classic tee", printingMethod: "DTG",
      localOnly: true, priceKind: "demo", defaultDesignId: "i-renamed-the-pain", designIds: ["i-renamed-the-pain"],
      sizingNotes: "No supplier size chart loaded; size guidance is an estimate." }),
  // Has separate women's sizing (a closer, shorter cut), to show how a second chart is used.
  item("logo-tee", "OrgToolTank Classic Tee", "tshirts", 2800, [BLACK, WHITE, HEATHER], TOPS,
    { garmentId: classicTee.id, designIds: ["pain-got-frequency"], provider: classicTee.provider, sizeChart: sample(TOPS, i => ({ chestWidth: 16.5 + i * 2, bodyLength: 27 + i, shoulderWidth: 16 + i * 1.25 })),
      womensSizeChart: sample(TOPS, i => ({ chestWidth: 15.5 + i * 2, bodyLength: 25 + i, shoulderWidth: 14.5 + i * 1.25 })) }),
  // No chart of its own, so its sizes are always estimates from the general chart.
  item("scattered-tee", "Scattered Mind Tee", "tshirts", 3000, [WHITE, CHARCOAL, NAVY], TOPS,
    { fitType: "fitted", runsSmall: true, sizingNotes: "Sample note: slim cut that runs about a size small." }),
  item("long-sleeve", "Workbench Long Sleeve", "longsleeves", 3400, [WHITE, BLACK, OLIVE], TOPS,
    { sizeChart: sample(TOPS, i => ({ chestWidth: 17 + i * 2, bodyLength: 27.5 + i, shoulderWidth: 16 + i * 1.25, sleeveLength: 23.5 + i * 0.5 })) }),
  item("idea-hoodie", "Idea Hoodie", "hoodies", 5800, [CHARCOAL, BLACK, HEATHER], TOPS,
    { sizeChart: sample(TOPS, i => ({ chestWidth: 18 + i * 2, bodyLength: 26 + i, shoulderWidth: 17.5 + i * 1.25, sleeveLength: 24 + i * 0.5 })) }),
  item("zip-hoodie", "Zip Hoodie", "hoodies", 6200, [HEATHER, NAVY], TOPS,
    { fitType: "oversized", oversizedFit: true, sizingNotes: "Sample note: cut roomy with dropped shoulders.",
      sizeChart: sample(TOPS, i => ({ chestWidth: 20 + i * 2, bodyLength: 27 + i, shoulderWidth: 20 + i * 1.25, sleeveLength: 23 + i * 0.5 })) }),
  item("crew-sweat", "Workbench Crewneck", "sweatshirts", 5200, [HEATHER, BLACK, OLIVE], TOPS),
  item("coach-jacket", "Coach Jacket", "jackets", 7800, [BLACK, NAVY, OLIVE], TOPS,
    { sizeChart: sample(TOPS, i => ({ chestWidth: 19 + i * 2, bodyLength: 27 + i, shoulderWidth: 17.5 + i * 1.25, sleeveLength: 24.5 + i * 0.5 })) }),
  item("chore-coat", "Chore Coat", "coats", 9800, [TAN, CHARCOAL, NAVY], TOPS,
    { fitType: "relaxed", sizingNotes: "Sample note: roomy enough to layer over a hoodie.",
      sizeChart: sample(TOPS, i => ({ chestWidth: 21.5 + i * 2, bodyLength: 30 + i, shoulderWidth: 18.5 + i * 1.25, sleeveLength: 25 + i * 0.5 })) }),
  // Back and shoulders
  item("day-backpack", "Everyday Backpack", "backpacks", 6800, [BLACK, OLIVE, NAVY], ONE, { details: { dimensions: "17 × 12 × 6 in", strapAdjustability: "Adjustable padded straps" } }),
  item("canvas-bookbag", "Canvas Bookbag", "bookbags", 5400, [TAN, CHARCOAL], ONE, { details: { dimensions: "16 × 11 × 5 in", strapAdjustability: "Adjustable straps" } }),
  item("sling-bag", "Sling Bag", "slingbags", 3800, [BLACK, OLIVE], ONE, { details: { dimensions: "12 × 7 × 3 in", strapAdjustability: "Adjustable strap" } }),
  item("canvas-tote", "Canvas Shoulder Bag", "shoulderbags", 4400, [TAN, BLACK], ONE, { details: { dimensions: "14 × 13 × 4 in", strapAdjustability: "Fixed shoulder strap" } }),
  // Wrists and hands
  item("field-watch", "Field Watch", "watches", 8500, [BLACK, BROWN, SILVER], ONE, { details: { wristSizeRange: "6–8 in", strapLength: "Adjustable strap" } }),
  item("cord-bracelet", "Cord Bracelet", "bracelets", 1600, [BLACK, RUST, TAN], ONE, { details: { wristSizeRange: "6–8.5 in", adjustable: true } }),
  item("link-bracelet", "Link Bracelet", "bracelets", 3000, [SILVER, GOLD], ONE, { details: { wristSizeRange: "7.5 in" } }),
  item("terry-wristband", "Terry Wristband", "wristbands", 1000, [WHITE, BLACK], ONE, { details: { wristSizeRange: "Stretch, fits most" } }),
  item("band-ring", "Band Ring", "rings", 2400, [SILVER, GOLD, BLACK], RINGS),
  item("knit-gloves", "Knit Gloves", "gloves", 2200, [CHARCOAL, BLACK, OLIVE], SOCKS),
  // Waist and legs
  item("web-belt", "Web Belt", "belts", 2600, [BLACK, OLIVE, TAN], BOTTOMS),
  item("waist-bag", "Waist Bag", "waistbags", 3400, [BLACK, NAVY], ONE, { details: { dimensions: "10 × 5 × 3 in", strapAdjustability: "Adjustable strap" } }),
  item("belt-bag", "Belt Bag", "beltbags", 4000, [TAN, BLACK], ONE, { details: { dimensions: "8 × 5 × 2 in", strapAdjustability: "Adjustable strap" } }),
  item("everyday-joggers", "Everyday Joggers", "joggers", 5400, [CHARCOAL, BLACK, HEATHER], BOTTOMS,
    { sizeChart: sample(BOTTOMS, i => ({ waist: 29 + i * 3, hip: 39 + i * 3, inseam: 30 + Math.min(i, 2) * 0.5, rise: 11 + i * 0.5 })) }),
  item("work-pants", "Work Pants", "pants", 6800, [TAN, BLACK, OLIVE], BOTTOMS,
    { sizeChart: sample(BOTTOMS, i => ({ waist: 30 + i * 3, hip: 40 + i * 3, inseam: 32, rise: 11.5 + i * 0.5 })) }),
  item("sweat-shorts", "Sweat Shorts", "shorts", 3800, [HEATHER, BLACK, NAVY], BOTTOMS, { fitType: "relaxed" }),
  // Ankles and feet
  item("chain-anklet", "Chain Anklet", "anklets", 1800, [SILVER, GOLD], ONE, { details: { chainLength: "9–10 in, adjustable" } }),
  item("crew-socks", "Crew Socks", "socks", 1600, [WHITE, BLACK, HEATHER], SOCKS),
  item("canvas-sneakers", "Canvas Sneakers", "shoes", 6400, [WHITE, BLACK, NAVY], SHOES),
  item("work-boots", "Work Boots", "boots", 12000, [BROWN, BLACK], SHOES),
  item("pool-slides", "Pool Slides", "slides", 2800, [BLACK, WHITE, OLIVE], ["S", "M", "L", "XL"]),
];

/** Plain facts about an accessory for the shopper, e.g. "Fits wrists 6–8 in · Adjustable strap". */
export function detailsText(p: Product) {
  const d = p.details, fits = (what: string, v?: string) => v && (/^\d/.test(v) ? `Fits ${what} ${v}` : v);
  return [
    fits("wrists", d.wristSizeRange), fits("heads", d.headSizeRange), d.chainLength && `Length ${d.chainLength}`,
    d.dimensions, d.strapLength, d.strapAdjustability, d.adjustable && !d.strapLength && !d.strapAdjustability && "Adjustable",
  ].filter(Boolean).join(" · ");
}

// ---------- Scene products: placed in the room, not worn ----------

export type SceneCategoryId = "posters" | "framedPosters" | "canvas" | "wallArt" | "mugs" | "totes" | "decor";
/**
 * Scene categories. Version 1 is wall art; mugs, totes, and decor are listed for later (they'll sit on a
 * surface rather than hang on the wall). Add a category here and give it products to offer it.
 */
export const SCENE_CATEGORIES: { id: SceneCategoryId; name: string; available: boolean; placement: "wall" | "surface" }[] = [
  { id: "posters", name: "Posters", available: true, placement: "wall" },
  { id: "framedPosters", name: "Framed prints", available: true, placement: "wall" },
  { id: "canvas", name: "Canvas", available: true, placement: "wall" },
  { id: "wallArt", name: "Wall art", available: true, placement: "wall" },
  { id: "mugs", name: "Mugs", available: false, placement: "surface" },
  { id: "totes", name: "Tote bags", available: false, placement: "surface" },
  { id: "decor", name: "Decor", available: false, placement: "surface" },
];
/** One size of a scene product: its label, real width and height in inches, and its price in cents. */
export type SceneSize = { size: string; w: number; h: number; price: number };
/** The drawn placeholder artwork, until a product has a real image. */
export type ArtStyle = "dots" | "grid" | "bulb" | "stripes" | "orbit" | "type";
/**
 * A scene product. It shares the store fields with wearables (provider, Shopify IDs, variants), so both
 * go in the same cart, but it's placed on the wall at its real size instead of being worn.
 */
export type SceneProduct = {
  kind: "scene";
  id: string;
  name: string;
  category: SceneCategoryId;
  /** The lowest price, in cents ("from"). Each size has its own price in `sceneSizes`. */
  price: number;
  /** Flat image of the artwork. Blank for now: a drawn placeholder is shown instead. */
  image: string;
  /** Frame or finish choices, e.g. "Black frame". */
  colors: ProductColor[];
  sizes: string[];
  sceneSizes: SceneSize[];
  /** How it's mounted, for drawing: bare paper, a frame with a mat, or a canvas with depth. */
  mount: "paper" | "frame" | "canvas" | "wood";
  art: ArtStyle;
  provider: string;
  affiliateUrl: string;
  brand: string;
  productModel: string;
  shopifyProductId: string;
  shopifyVariantId: string;
  variants?: { color: string; size: string; shopifyVariantId: string }[];
};
/** Anything in the catalog. */
export type CatalogItem = Product | SceneProduct;

const PAPER = { name: "Matte paper", hex: "#f3f1ea" };
const sceneItem = (id: string, name: string, category: SceneCategoryId, mount: SceneProduct["mount"], art: ArtStyle, colors: ProductColor[], sizes: SceneSize[]): SceneProduct => ({
  kind: "scene", id, name, category, price: Math.min(...sizes.map(s => s.price)), image: "", colors, sizes: sizes.map(s => s.size), sceneSizes: sizes, mount, art,
  provider: "", affiliateUrl: "", brand: "", productModel: "", shopifyProductId: "", shopifyVariantId: "",
});
const size = (w: number, h: number, price: number): SceneSize => ({ size: `${w}×${h} in`, w, h, price });

/** PLACEHOLDER wall art, like the clothing above: sample products and prices, nothing for sale yet. */
export const sceneProducts: SceneProduct[] = [
  sceneItem("scattered-poster", "Scattered Mind Poster", "posters", "paper", "dots", [PAPER], [size(12, 18, 1800), size(18, 24, 2400), size(24, 36, 3400)]),
  sceneItem("blueprint-poster", "Workbench Blueprint Poster", "posters", "paper", "grid", [PAPER], [size(12, 18, 2000), size(18, 24, 2600), size(24, 36, 3600)]),
  sceneItem("idea-framed", "Idea Bulb Framed Print", "framedPosters", "frame", "bulb",
    [{ name: "Black frame", hex: "#1f1f1f" }, { name: "White frame", hex: "#f3f3ef" }, { name: "Oak frame", hex: "#b8905f" }], [size(12, 16, 4500), size(18, 24, 6500), size(24, 32, 9500)]),
  sceneItem("night-shift-framed", "Night Shift Framed Print", "framedPosters", "frame", "stripes",
    [{ name: "Black frame", hex: "#1f1f1f" }, { name: "Oak frame", hex: "#b8905f" }], [size(12, 16, 4800), size(18, 24, 6800), size(24, 32, 9800)]),
  sceneItem("tool-wall-canvas", "Tool Wall Canvas", "canvas", "canvas", "orbit",
    [{ name: "Black edges", hex: "#1f1f1f" }, { name: "White edges", hex: "#f3f3ef" }], [size(16, 20, 5500), size(24, 30, 7900), size(30, 40, 11900)]),
  sceneItem("build-mode-sign", "Build Mode Wood Sign", "wallArt", "wood", "type",
    [{ name: "Natural wood", hex: "#c9a878" }, { name: "Walnut", hex: "#6b4a2f" }], [size(12, 12, 3800), size(18, 18, 5400)]),
];
export const sceneCategoryOf = (id: SceneCategoryId) => SCENE_CATEGORIES.find(c => c.id === id)!;

export const formatPrice = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

/** Viewing angles for the mannequin, shared by the builder and Preview Outfit. */
export type View = "front" | "left" | "right" | "back";
export const VIEWS: { id: View; name: string; short: string }[] = [
  { id: "front", name: "Front", short: "Front" },
  { id: "left", name: "Left side", short: "Left" },
  { id: "right", name: "Right side", short: "Right" },
  { id: "back", name: "Back", short: "Back" },
];
/**
 * The product's layer image for an angle, or "" when that angle still uses the drawn placeholder.
 * Real photos aren't mirrored for the other side, since logos and prints would read backwards.
 */
export const imageFor = (p: Product, view: View) => ({ front: p.frontImage, left: p.leftImage, right: p.rightImage, back: p.backImage })[view];

/** Resolve a catalog preview by color without exposing it to the mannequin image resolver. */
export function productPreviewImage(product: Product, color?: string): string {
  return product.colors.find(c => c.name === (color ?? product.colors[0]?.name))?.previewImage ?? product.image ?? "";
}
export const productPriceLabel = (product: Product) => formatPrice(product.price);
