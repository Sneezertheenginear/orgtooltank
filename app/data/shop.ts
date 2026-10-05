// Shop categories. The Shop shows only `shopCategories`: things we're selling or getting ready to sell now.
//
// Card photos: Clothing & Original Goods uses the real Printful tee photo. `wide` cards take half a row
// (two across instead of three). `ask` adds one contact action to a card (app/data/contact.ts: an email
// with the subject and message filled in). No checkout or inventory.
export type ShopCategory = {
  id: string; name: string; description: string;
  image: { src: string; alt: string; product?: boolean };
  wide?: boolean;
  ask?: { source: "shop"; reason: "question" | "similar" } | { source: "custom-build"; reason: "request" };
};

export const shopCategories: ShopCategory[] = [
  { id: "original-goods", name: "Clothing & Original Goods", description: "T-shirts, sweatpants, slides, and other original OrgToolTank designs.",
    image: { src: "/outfit-builder/products/printful/unisex-classic-tee-black-front-6abc103a5d2c3.png", alt: "Black “I Renamed the Pain.” T-shirt", product: true }, wide: true },
];

// Ideas for later Shop categories. Not shown anywhere: nothing in them is for sale. Move one into
// `shopCategories` once it has real products. (Electronics, repairs, old computers, and custom projects
// are talked about on the Workbench in the meantime.) Their photos are in public/shop/.
export const laterShopCategories: ShopCategory[] = [
  { id: "electronics-audio", name: "Electronics & Audio", description: "Useful cables, adapters, small electronics, audio gear, sensors, and project hardware.",
    image: { src: "/shop/electronics-audio.webp", alt: "Audio cables and connectors" },
    ask: { source: "shop", reason: "question" } },
  { id: "rebuilt-reused", name: "Rebuilt & Reused", description: "Electronics we repair, clean, test, and put back into service.",
    image: { src: "/shop/rebuilt-reused.webp", alt: "Used speakers and audio equipment" },
    ask: { source: "shop", reason: "similar" } },
  { id: "computer-legacy-systems", name: "Computer & Legacy Systems", description: "Older computers, operating-system projects, upgrades, repairs, and ways to keep useful hardware working.",
    image: { src: "/shop/computer-legacy-systems.webp", alt: "A laptop with drives and cables on a workbench" }, wide: true,
    ask: { source: "shop", reason: "question" } },
  { id: "custom-builds", name: "Custom Builds", description: "Small practical electronics, cable assemblies, enclosures, and project work built by request.",
    image: { src: "/shop/custom-builds.webp", alt: "A small electronics enclosure on a workbench" }, wide: true,
    ask: { source: "custom-build", reason: "request" } },
];
