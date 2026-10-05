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
  { id: "electronic-circuit-life", name: "Electronic / Circuit Life" },
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
};

const PRINTFUL = "/outfit-builder/products/printful";

// Only real products. To add one, drop its image in public/outfit-builder/products/<source>/ and add a line here.
export const PRODUCTS: Product[] = [
  {
    id: "i-renamed-the-pain-tee-black", name: "I Renamed the Pain Tee, Black", category: "shirts", source: "Printful", available: true,
    image: `${PRINTFUL}/unisex-classic-tee-black-front-6abc103a5d2c3.png`,
    collections: DESIGN_COLLECTIONS["I Renamed the Pain"],
  },
  {
    id: "i-renamed-the-pain-tee-maroon", name: "I Renamed the Pain Tee, Maroon", category: "shirts", source: "Printful", available: true,
    image: `${PRINTFUL}/unisex-classic-tee-maroon-front-6abc103a5d2fe.png`,
    collections: DESIGN_COLLECTIONS["I Renamed the Pain"],
  },
  {
    id: "i-renamed-the-pain-sweatpants-black", name: "I Renamed the Pain Sweatpants, Black", category: "pants", source: "Printful", available: true,
    image: `${PRINTFUL}/pain-black-sweatpants.webp`,
    collections: ["OrgToolTank"],
  },
  {
    id: "i-renamed-the-pain-slides-white", name: "I Renamed the Pain Slides, White", category: "shoes", source: "Printful", available: true,
    image: `${PRINTFUL}/pain-white-slides.webp`,
    collections: ["OrgToolTank"],
  },
];
export const productOf = (id: string) => PRODUCTS.find(p => p.id === id);
export const productsIn = (category: CategoryId) => PRODUCTS.filter(p => p.category === category);
export const linkOf = (p: Product) => p.affiliateUrl ?? p.productUrl;
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

/** What's on the board: one product id per category. */
export type Look = Partial<Record<CategoryId, string>>;

/** Adds a product, replacing what's in its category; picking the one already there takes it off. */
export function toggleProduct(look: Look, product: Product): Look {
  return { ...look, [product.category]: look[product.category] === product.id ? undefined : product.id };
}
export const clearCategory = (look: Look, category: CategoryId): Look => ({ ...look, [category]: undefined });

/** Everything in the look, in category order. */
export function lookProducts(look: Look): Product[] {
  return CATEGORIES.flatMap(c => { const p = look[c.id] ? productOf(look[c.id]!) : undefined; return p ? [p] : []; });
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

