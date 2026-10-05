import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import Link from "next/link";
import Shell from "../experiment-components/Shell";
import { categories, experiments } from "../data/experiments";
// Same card system as the Shop page (image strip, body, foot), plus a few category-only touches.
import "../shop/shop.css";
import "./categories.css";
export const metadata = { title: "Categories" };

// Shop isn't an experiment category (it holds products, not experiments), so it's added here
// rather than to the experiment categories, which also drive the experiment filters.
//
// Card images: real photos only, all given the same dark treatment so the six read as one family.
// One photo, or a strip of three (Shop: the clothing; Random: mixed objects). A real product cutout is
// shown on a dark tile so it matches. To use your own photo for a card, save it as
// public/categories/<id>.webp (or .jpg/.png), e.g. public/categories/cars.webp; it replaces the images below.
type Tile = { src: string; alt: string; product?: boolean };
type Drawer = { id: string; name: string; description: string; href: string; label: string; action: string; art: Tile[] };
const ART: Record<string, Tile[]> = {
  cars: [{ src: "/workbench/notes/my-bench-tools.webp", alt: "A multimeter, wire, and hand tools on a workbench" }],
  tools: [{ src: "/workbench/hero.webp", alt: "A workbench with a laptop, a multimeter, and a circuit board" }],
  music: [{ src: "/workbench/notes/cables-are-not-all-the-same.webp", alt: "Audio cables with metal connectors" }],
  business: [{ src: "/workbench/notes/what-i-check-before-buying-a-used-computer.webp", alt: "A laptop beside a printed checklist" }],
  shop: [
    { src: "/outfit-builder/products/printful/unisex-classic-tee-maroon-front-6abc103a5d2fe.png", alt: "Maroon “I Renamed the Pain.” T-shirt", product: true },
    { src: "/outfit-builder/products/printful/pain-black-sweatpants.webp", alt: "Black “I Renamed the Pain.” sweatpants", product: true },
    { src: "/outfit-builder/products/printful/pain-white-slides.webp", alt: "White “I Renamed the Pain.” slides", product: true },
  ],
  random: [
    { src: "/workbench/notes/software-and-hardware-belong-together.webp", alt: "Code on a screen" },
    { src: "/workbench/notes/old-software-still-has-a-place.webp", alt: "An old beige desktop computer" },
    { src: "/workbench/notes/the-connector-can-be-the-problem.webp", alt: "A close-up of a cable connector" },
  ],
};
/** A photo saved in public/categories/ for this card, if there is one (checked when the page is built). */
function ownPhoto(id: string): Tile[] | undefined {
  const file = ["webp", "jpg", "jpeg", "png"].map(ext => `/categories/${id}.${ext}`).find(f => existsSync(join(process.cwd(), "public", f)));
  return file ? [{ src: file, alt: "" }] : undefined;
}
/** The cards, in order. Built per render, so a photo saved in public/categories/ shows on refresh in dev (and on each build). */
const buildDrawers = (): Drawer[] => categories.flatMap<Drawer>(c => {
  const count = experiments.filter(e => e.category === c.id).length;
  const drawer: Drawer = { id: c.id, name: c.name, description: c.description, href: `/experiments?category=${c.id}`, label: count ? `${count} experiment${count === 1 ? "" : "s"}` : "Future category", action: "Explore category", art: ownPhoto(c.id) ?? ART[c.id] };
  return c.id === "business" ? [drawer, { id: "shop", name: "Shop", description: "Original clothing and goods from OrgToolTank.", href: "/shop", label: "Clothing", action: "Visit the Shop", art: ownPhoto("shop") ?? ART.shop }] : [drawer];
});

function CardArt({ art }: { art: Tile[] }) {
  const sizes = art.length > 1 ? "(max-width: 560px) 34vw, (max-width: 900px) 17vw, 130px" : "(max-width: 560px) 100vw, (max-width: 900px) 50vw, 390px";
  return <div className={`shop-card-image cat-art${art.length > 1 ? " cat-art-strip" : ""}`}>
    {art.map(t => <div key={t.src} className="cat-art-tile" data-product={t.product ? "" : undefined}><Image src={t.src} alt={t.alt} fill sizes={sizes} /></div>)}
  </div>;
}

export default function CategoriesPage() {
 const drawers = buildDrawers();
 return <Shell><div className="wrap page-space"><p className="eyebrow">A place for every kind of idea</p><h1 className="page-title">See what’s here.</h1><p className="page-intro">Not everything has something in it yet. That’s part of the experiment.</p>
  <div className="shop-cards cat-cards">{drawers.map((c, i) => <Link key={c.id} className="shop-card cat-card" href={c.href}>
    <CardArt art={c.art} />
    <div className="shop-card-body">
      <p className="cat-card-meta">{String(i + 1).padStart(2, "0")} / {c.label}</p>
      <h2>{c.name}</h2>
      <p>{c.description}</p>
      <div className="shop-card-foot"><span className="cat-card-action">{c.action} →</span></div>
    </div>
  </Link>)}</div>
 </div></Shell>;
}
