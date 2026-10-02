import Image from "next/image";
import Link from "next/link";
import Shell from "../experiment-components/Shell";
import ContactAction from "../experiment-components/ContactAction";
import "./shop.css";

export const metadata = { title: "Shop", description: "Original products, rebuilt electronics, useful project gear, and things we make. Coming soon." };

// Shop categories, all Coming Soon: no products, prices, cart, or checkout yet, and nothing is connected
// to a store or print-on-demand service. The photos in public/shop/ are temporary, cropped from
// design/workbench-shop-preview.png; Original Goods uses the real Printful tee photo. Replace a photo by
// saving a new file with the same name. `wide` cards take the second row (two across instead of three).
// `ask` adds one contact action to a card (app/data/contact.ts: an email with the subject and message filled in).
// No checkout or inventory.
const categories: { id: string; name: string; description: string; image: { src: string; alt: string; product?: boolean }; wide?: boolean; ask?: { source: "shop"; reason: "question" | "similar" } | { source: "custom-build"; reason: "request" } }[] = [
  { id: "original-goods", name: "Original Goods", description: "Clothing, prints, accessories, and original OrgToolTank designs.",
    image: { src: "/outfit-builder/products/printful/unisex-classic-tee-black-front-6abc103a5d2c3.png", alt: "Black “I Renamed the Pain.” T-shirt", product: true } },
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

export default function ShopPage() {
  return <Shell><div className="wrap page-space shop-page">
    <h1 className="shop-title">Shop</h1>
    <p className="shop-subtitle">Original products, rebuilt electronics, useful project gear, and things we make.</p>
    <p className="shop-note"><span className="status-tag">Coming soon</span> Nothing is for sale yet. Products will show up here as they’re ready.</p>
    <div className="shop-cards">{categories.map(c => <section key={c.id} className="shop-card" data-wide={c.wide ? "" : undefined} aria-labelledby={`shop-${c.id}`}>
      <div className="shop-card-image" data-product={c.image.product ? "" : undefined}>
        <Image src={c.image.src} alt={c.image.alt} fill sizes={c.wide ? "(max-width: 900px) 100vw, 590px" : "(max-width: 560px) 100vw, (max-width: 900px) 50vw, 390px"} />
      </div>
      <div className="shop-card-body">
        <h2 id={`shop-${c.id}`}>{c.name}</h2>
        <p>{c.description}</p>
        <div className="shop-card-foot">
          {c.id === "original-goods" && <Link href="/shop/outfit-builder" className="text-link">Build an Outfit →</Link>}
          {c.ask && <ContactAction className="text-link" arrow hint {...c.ask} title={c.name} />}
          <span className="shop-card-status">Coming soon</span>
        </div>
      </div>
    </section>)}</div>
  </div></Shell>;
}
