// Everything the Outfit Builder shows, as plain data: real products and the background. The UI is built
// from these lists, so adding a product or a scene is a data change only.
//
// Product rule: every product here is a real item that can be offered or linked to, shown with its own
// real product image (Printful, Apliiq, OrgToolTank, or another approved partner). Nothing is drawn,
// generated, or recolored. Images are shown whole, at their own proportions. Full guide: ASSETS.md.

// ---- Categories --------------------------------------------------------------------------------------

export type CategoryId = "shirts" | "pants" | "jackets" | "shoes" | "hats" | "accessories";
export type Category = { id: CategoryId; name: string; /** Singular, for messages ("Remove shirt"). */ one: string };
export const CATEGORIES: Category[] = [
  { id: "shirts", name: "Shirts", one: "shirt" },
  { id: "pants", name: "Pants", one: "pants" },
  { id: "jackets", name: "Jackets", one: "jacket" },
  { id: "shoes", name: "Shoes", one: "shoes" },
  { id: "hats", name: "Hats", one: "hat" },
  { id: "accessories", name: "Accessories", one: "accessory" },
];
export const categoryOf = (id: CategoryId) => CATEGORIES.find(c => c.id === id)!;

// ---- Collections -------------------------------------------------------------------------------------
// Themed groups for browsing, like the old TeePublic collections. A product can be in any number of them.
// A collection is only shown once at least one shown product is in it, so empty ones stay out of sight,
// unless it has `showEmpty: true` (one being actively built: listed now, with a short "being added" note).
// A collection is only a name: each product keeps its own garment and artwork colors.
// To add one: add a line here, then put its name in a product's `collections` (or a design's, below).

export const COLLECTIONS = [
  { id: "quotables", name: "Quotables" },
  // Short funny lines, usually 3 words or less, smart everyday humor (BILLS GOT JOKES., SLEEP OWES ME.), coming next.
  { id: "comedy", name: "Comedy", showEmpty: true },
  { id: "electronic", name: "Electronic" },
  { id: "scattered-mind-experiment", name: "Scattered Mind Experiment" },
  { id: "money-hustle-capital", name: "Money / Hustle / Capital" },
  { id: "code-rules-systems", name: "Code / Rules / Systems" },
  { id: "pain-growth-pressure", name: "Pain / Growth / Pressure" },
  { id: "garage-mechanical", name: "Garage / Mechanical" },
  { id: "music-frequency", name: "Music / Frequency" },
  { id: "orgtooltank", name: "OrgToolTank" },
  // Colorful science / biotech / experimental shirts, coming next.
  { id: "biotech", name: "Biotech", showEmpty: true },
] as const;
export type CollectionName = typeof COLLECTIONS[number]["name"];
/** A collection by its id (as used in links, e.g. /shop/outfit-builder?collection=quotables). */
export const collectionById = (id: unknown) => COLLECTIONS.find(c => c.id === id);

/** Each design's collections, for the products made from it (for now the tees; I Renamed the Pain's
 *  sweatpants and slides are in OrgToolTank only).
 *  Designs whose products aren't added yet are listed here so they're ready when they are. */
export const DESIGN_COLLECTIONS = {
  "Pain Got Frequency": ["Quotables", "Music / Frequency", "Pain / Growth / Pressure", "OrgToolTank"],
  "Dreams Cost Capital": ["Quotables", "Money / Hustle / Capital", "OrgToolTank"],
  "Move by the Code": ["Quotables", "Code / Rules / Systems", "OrgToolTank"],
  "Money Got Legs": ["Quotables", "Money / Hustle / Capital", "OrgToolTank"],
  "I Renamed the Pain": ["Quotables", "Pain / Growth / Pressure", "Scattered Mind Experiment", "OrgToolTank"],
  "Rules Got Receipts": ["Quotables", "Code / Rules / Systems", "OrgToolTank"],
  "Life Ate the Profit": ["Quotables", "Money / Hustle / Capital", "Pain / Growth / Pressure", "OrgToolTank"],
  "Chaos Got Order": ["Quotables", "Scattered Mind Experiment", "Code / Rules / Systems", "OrgToolTank"],
} satisfies Record<string, CollectionName[]>;

// ---- Products ----------------------------------------------------------------------------------------

/** Where a product comes from. Add approved partners here as they're added. */
export type Source = "Printful" | "Apliiq" | "OrgToolTank";

export type Product = {
  id: string;
  name: string;
  category: CategoryId;
  /** What the garment is, shown on Shop cards ("Classic tee", "Sweatpants"). Falls back to the category. */
  garment?: string;
  /** The real product image, shown whole on the outfit board. Lives in public/outfit-builder/products/<source>/. */
  image: string;
  /** A smaller picture for the product card. Falls back to `image`. */
  thumbnail?: string;
  /** In cents. Leave out until the real price is set; the card then says the price is coming. */
  price?: number;
  source: Source;
  /** The product's page in the store. */
  productUrl?: string;
  /** A partner link, used instead of productUrl when set. */
  affiliateUrl?: string;
  /** Whether it can be offered now. Unavailable products show as "Coming soon" and can't be added. */
  available: boolean;
  /** The collections it's browsed under, by name (see COLLECTIONS). Any number, or none. */
  collections?: CollectionName[];
  /** Garment colors to choose from. One product per design: the color decides which artwork version prints
   *  (white ink on dark garments, black ink on light ones). Without colors, the product is the one garment in
   *  `image`. A color can be listed before its photo exists; it's then offered without a picture. */
  colors?: ProductColor[];
  /** Sizes it comes in, from the Printful template. Left out when not known yet. */
  sizes?: string[];
};

export type ProductColor = {
  name: string;
  /** The garment color, for the swatch. */
  hex: string;
  /** The real product image in this color. Left out until a real photo of this color exists: the color is
   *  still offered on the product page, without a picture, and can't go on the outfit board. */
  image?: string;
  /** Which artwork version prints on this color. */
  ink: "white" | "black";
  /** The Printful product template for that artwork version. */
  printfulTemplateId: number;
};

const PRINTFUL = "/outfit-builder/products/printful";

// Classic tee (Printful product 438) garment colors, as Printful lists them.
const TEE_HEX: Record<string, string> = {
  "Ash": "#f3f3f3", "Azalea": "#ff98c6", "Black": "#141313", "Brown Savana": "#9f8971", "Cardinal": "#c21b3a",
  "Carolina Blue": "#96bbff", "Charcoal": "#6a6967", "Daisy": "#ffc946", "Dark Chocolate": "#463b33",
  "Dark Heather": "#595959", "Forest Green": "#1A3B23", "Gold": "#ffb22d", "Graphite Heather": "#858585",
  "Heliconia": "#E33F7A", "Ice Grey": "#E9DDDC", "Irish Green": "#00ba69", "Light Blue": "#d9efff",
  "Light Pink": "#ffd4d5", "Lime": "#A3E05A", "Maroon": "#47001b", "Military Green": "#737a5f", "Natural": "#e8dacd",
  "Navy": "#1a2330", "Orange": "#ff5f2e", "Purple": "#48197d", "Red": "#d80019", "Royal": "#175ac7",
  "Sand": "#d6c0ab", "Sapphire": "#007AB3", "Sky": "#8ee0ff", "Sport Grey": "#c4c0be", "Tropical Blue": "#00A0B3",
  "Turf Green": "#187532", "White": "#fffefa", "Yellow Haze": "#FFD99C",
};
const TEE_SIZES = ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
// The Electronic tees' colors, by artwork version. Every one is in that version's Printful template.
const DARK_TEES = ["Maroon", "Black", "Navy", "Purple", "Forest Green", "Dark Chocolate", "Cardinal", "Royal", "Dark Heather", "Turf Green", "Sapphire", "Charcoal"];
const LIGHT_TEES = ["Red", "Heliconia", "Military Green", "Orange", "Tropical Blue", "Graphite Heather", "Brown Savana", "Irish Green", "Azalea",
  "Carolina Blue", "Gold", "Sport Grey", "Lime", "Daisy", "Sky", "Sand", "Natural", "Yellow Haze", "Light Pink", "Ice Grey", "Light Blue", "Ash", "White"];

/** A Printful classic tee: one product per design. Its colors come from the design's Printful templates (white
 *  ink for dark garments, black ink for light ones); `photos` are the colors with a real mockup, listed first. */
function printfulTee(o: {
  id: string; name: string; collections: CollectionName[];
  white: { template: number; colors: string[] }; black?: { template: number; colors: string[] };
  photos: Record<string, string>;
}): Product {
  const version = (ink: "white" | "black", v?: { template: number; colors: string[] }) =>
    (v?.colors ?? []).map((name): ProductColor => ({ name, hex: TEE_HEX[name], ink, printfulTemplateId: v!.template, image: o.photos[name] }));
  const all = [...version("white", o.white), ...version("black", o.black)];
  const colors = [...all.filter(c => c.image), ...all.filter(c => !c.image)];
  return { id: o.id, name: o.name, category: "shirts", garment: "Classic tee", source: "Printful", available: true,
    image: colors[0].image!, colors, sizes: TEE_SIZES, collections: o.collections };
}
/** An Electronic tee: real mockups so far in Maroon (white ink) and Red (black ink), named <id>-<color>.webp. */
const electronicTee = (id: string, name: string, templates: { white: number; black: number }, light = LIGHT_TEES) => printfulTee({
  id, name, collections: ["Electronic"],
  white: { template: templates.white, colors: DARK_TEES }, black: { template: templates.black, colors: light },
  photos: { Maroon: `${PRINTFUL}/${id}-maroon.webp`, Red: `${PRINTFUL}/${id}-red.webp` },
});

// Only real products. To add one, drop its image in public/outfit-builder/products/<source>/ and add a line here.
export const PRODUCTS: Product[] = [
  // White-ink template 108098684 (its colors as Printful lists them); real photos in Black and Maroon.
  printfulTee({
    id: "i-renamed-the-pain-tee", name: "I Renamed the Pain Tee", collections: DESIGN_COLLECTIONS["I Renamed the Pain"],
    white: { template: 108098684, colors: ["Black", "Maroon", "Navy", "Purple", "Red", "Forest Green", "Cardinal", "Royal", "Dark Heather", "Heliconia", "Charcoal", "Military Green", "Orange", "Brown Savana"] },
    photos: { Black: `${PRINTFUL}/unisex-classic-tee-black-front-6abc103a5d2c3.png`, Maroon: `${PRINTFUL}/unisex-classic-tee-maroon-front-6abc103a5d2fe.png` },
  }),
  {
    id: "i-renamed-the-pain-sweatpants-black", name: "I Renamed the Pain Sweatpants, Black", category: "pants", garment: "Sweatpants", source: "Printful", available: true,
    image: `${PRINTFUL}/pain-black-sweatpants.webp`, sizes: ["XS", "S", "M", "L", "XL", "2XL"],
    collections: ["OrgToolTank"],
  },
  {
    id: "i-renamed-the-pain-slides-white", name: "I Renamed the Pain Slides, White", category: "shoes", garment: "Slides", source: "Printful", available: true,
    image: `${PRINTFUL}/pain-white-slides.webp`,
    collections: ["OrgToolTank"],
  },
  // Electronic. Printful templates: white ink (dark garments) / black ink (light garments).
  electronicTee("power-leaves-traces-tee", "Power Leaves Traces Tee", { white: 108405507, black: 108405598 }),
  electronicTee("frequency-bends-time-tee", "Frequency Bends Time Tee", { white: 108405369, black: 108405258 }),
  electronicTee("current-got-memory-tee", "Current Got Memory Tee", { white: 108403381, black: 108404987 }),
  // Its black-ink template doesn't have Carolina Blue, Sand, Daisy, Sky or Light Pink yet (being fixed in Printful).
  // 108403792 is a charcoal-ink duplicate of this design; not used.
  electronicTee("circuits-carry-prayer-tee", "Circuits Carry Prayer Tee", { white: 108403204, black: 108401258 },
    LIGHT_TEES.filter(c => !["Carolina Blue", "Sand", "Daisy", "Sky", "Light Pink"].includes(c))),
];
export const productOf = (id: string) => PRODUCTS.find(p => p.id === id);
export const productsIn = (category: CategoryId) => PRODUCTS.filter(p => p.category === category);
export const linkOf = (p: Product) => p.affiliateUrl ?? p.productUrl;
/** The garment label for a Shop card: the product's own, or its category ("Shirt"). */
export const garmentOf = (p: Product) => p.garment ?? categoryOf(p.category).one.replace(/^./, c => c.toUpperCase());
/** Whether a product is in a collection (no collection means all products). */
export const inCollection = (p: Product, collection?: CollectionName) => !collection || !!p.collections?.includes(collection);
/** The collections that hold at least one of these products (plus any marked showEmpty), in COLLECTIONS order.
 *  The Shop and the builder only show these, so a collection with nothing in it stays hidden. */
export const collectionsWith = (products: Product[]) =>
  COLLECTIONS.filter(c => ("showEmpty" in c && c.showEmpty) || products.some(p => inCollection(p, c.name)));

// ---- Scenes ------------------------------------------------------------------------------------------

export type SceneId = "plain";
/** The board's background. Plain is the only one; its color is the Wall color the visitor picks. */
export type Scene = { id: SceneId; name: string };
export const SCENES: Scene[] = [{ id: "plain", name: "Plain" }];
export const sceneOf = (id: SceneId) => SCENES.find(s => s.id === id) ?? SCENES[0];
/** Plain's starting color (a clean, light neutral); Plain goes back to it when chosen. */
export const PLAIN_COLOR = "#fafaf8";

/** Preset wall colors for the Plain background. Any other color can be picked too. */
export const WALL_COLORS: { name: string; hex: string }[] = [
  { name: "White", hex: "#f6f6f4" },
  { name: "Cream", hex: "#eee5d1" },
  { name: "Light gray", hex: "#d4d4d0" },
  { name: "Gray", hex: "#8f8f8a" },
  { name: "Charcoal", hex: "#333333" },
  { name: "Black", hex: "#1c1c1c" },
  { name: "Navy", hex: "#26324a" },
  { name: "Olive", hex: "#5f6344" },
  { name: "Red", hex: "#9e2f28" },
  { name: "Sage", hex: "#a9b39a" },
];

/** Whether a color is dark enough that text on it should turn light. */
export function isDark(hex: string) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.45;
}

// ---- The look ----------------------------------------------------------------------------------------

/** One product on the board, and its color for products that come in colors. */
export type LookItem = { id: string; color?: string };
/** What's on the board: one product per category. */
export type Look = Partial<Record<CategoryId, LookItem>>;
/** A product as worn: for a product in colors, its image and name are the chosen color's. */
export type Worn = Product & { color?: ProductColor };

export const colorOf = (p: Product, name?: string) => p.colors?.find(c => c.name === name);

/** Adds a product (in a color, if it has colors), replacing what's in its category; picking the same one again takes it off. */
export function toggleProduct(look: Look, product: Product, color?: string): Look {
  const current = look[product.category], same = current?.id === product.id && current.color === color;
  return { ...look, [product.category]: same ? undefined : { id: product.id, color } };
}
export const clearCategory = (look: Look, category: CategoryId): Look => ({ ...look, [category]: undefined });

/** A product to put on the board, from a link (/shop/outfit-builder?add=<id>&color=<Color>): only a real,
 *  available product, and for a product in colors, one of its colors with a real photo (its first such color
 *  if none is given, or one without a photo). */
export function lookItemFor(id: unknown, color?: unknown): LookItem | undefined {
  const p = typeof id === "string" ? productOf(id) : undefined;
  if (!p?.available) return undefined;
  if (!p.colors?.length) return { id: p.id };
  const photographed = p.colors.filter(c => c.image), wanted = photographed.find(c => c.name === color);
  return photographed.length ? { id: p.id, color: (wanted ?? photographed[0]).name } : undefined;
}
/** A look read back from storage, keeping only real products in their own category (and known colors). */
export function cleanLook(value: unknown): Look {
  const look: Look = {};
  if (!value || typeof value !== "object") return look;
  for (const c of CATEGORIES) {
    const item = (value as Record<string, { id?: unknown; color?: unknown } | undefined>)[c.id];
    const clean = item && lookItemFor(item.id, item.color);
    if (clean && productOf(clean.id)!.category === c.id) look[c.id] = clean;
  }
  return look;
}

/** Everything in the look, in category order, each as worn. */
export function lookProducts(look: Look): Worn[] {
  return CATEGORIES.flatMap(c => {
    const item = look[c.id], p = item && productOf(item.id);
    if (!p) return [];
    const color = colorOf(p, item.color);
    return [color?.image ? { ...p, name: `${p.name}, ${color.name}`, image: color.image, thumbnail: undefined, color } : p];
  });
}
/** The total of the products that have a price, and how many don't have one yet. */
export function lookTotal(look: Look) {
  const products = lookProducts(look);
  return { cents: products.reduce((sum, p) => sum + (p.price ?? 0), 0), unpriced: products.filter(p => p.price === undefined).length };
}
export const formatPrice = (cents: number) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;

// ---- Finding images ----------------------------------------------------------------------------------

/** The files a path may be found as: the path itself, or the same name as .webp, .png, or .jpg. Full URLs are used as they are. */
export function candidates(path: string): string[] {
  if (/^https?:\/\//.test(path)) return [path];
  const base = path.replace(/\.(webp|png|jpe?g)$/i, "");
  return [...new Set([path, `${base}.webp`, `${base}.png`, `${base}.jpg`])];
}
/** The image to show for a path, or undefined while its file hasn't been added. */
export function resolveImage(found: ReadonlySet<string>, path: string | undefined): string | undefined {
  if (!path) return undefined;
  return candidates(path).find(p => /^https?:\/\//.test(p) || found.has(p));
}

// ---- Readiness ---------------------------------------------------------------------------------------
// Visitors only see products whose images exist. While running locally (setup mode),
// a missing image shows as a marked "image needed" slot with its exact file path.

export const productReady = (found: ReadonlySet<string>, p: Product) => !!resolveImage(found, p.image);

