import Link from "next/link";
import Shell from "../experiment-components/Shell";
import "./shop.css";

export const metadata = { title: "Shop", description: "Original OrgToolTank designs on clothing, accessories, and other physical products. Coming soon." };

// Placeholders for future product listings. No products, prices, cart, or checkout yet,
// and nothing is connected to a store or print-on-demand service.
const sections = [
  { id: "clothing", name: "Clothing", description: "T-shirts, hoodies, jackets, and other wearable designs." },
  { id: "accessories", name: "Hats & Accessories", description: "Hats, bags, and smaller everyday items." },
  { id: "home", name: "Home & Other", description: "Mugs, posters, and other physical products as they are added." },
];

export default function ShopPage() {
  return <Shell><div className="wrap page-space">
    <Link href="/categories" className="text-link">← All categories</Link>
    <p className="eyebrow shop-eyebrow">Original OrgToolTank products</p>
    <h1 className="page-title">Shop</h1>
    <p className="page-intro">Original designs on clothing, accessories, and other physical products.</p>
    <p className="shop-note"><span className="status-tag">Coming soon</span> Nothing is for sale yet. Products will show up here as they’re ready.</p>
    <div className="category-grid shop-grid">{sections.map((s, i) => <section key={s.id} className="category-drawer shop-section" aria-labelledby={`shop-${s.id}`}>
      <span className="eyebrow">{String(i + 1).padStart(2, "0")} / Coming soon</span>
      <h2 id={`shop-${s.id}`}>{s.name}</h2>
      <p>{s.description}</p>
      {s.id === "clothing" && <p className="shop-outfit"><Link href="/shop/outfit-builder" className="text-link">Build an Outfit ↗</Link><span>Mix and match real products on an outfit board.</span></p>}
    </section>)}</div>
  </div></Shell>;
}
