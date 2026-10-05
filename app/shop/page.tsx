import Image from "next/image";
import Link from "next/link";
import Shell from "../experiment-components/Shell";
import ContactAction from "../experiment-components/ContactAction";
import { shopCategories } from "../data/shop";
import "./shop.css";

export const metadata = { title: "Shop", description: "Original OrgToolTank clothing and goods: products we're making, wearing, using, and putting to work." };

// The categories are in app/data/shop.ts (only ones with real products are shown).
export default function ShopPage() {
  return <Shell><div className="wrap page-space shop-page">
    <h1 className="shop-title">Shop</h1>
    <p className="shop-subtitle">Products we’re making, wearing, using, and putting to work. More may be added over time based on what people ask for and what we decide to build.</p>
    <p className="shop-note">Clothing comes first. Checkout opens soon. Until then, try the pieces together in the outfit builder.</p>
    <div className="shop-cards">{shopCategories.map(c => <section key={c.id} className="shop-card" data-wide={c.wide ? "" : undefined} aria-labelledby={`shop-${c.id}`}>
      <div className="shop-card-image" data-product={c.image.product ? "" : undefined}>
        <Image src={c.image.src} alt={c.image.alt} fill sizes={c.wide ? "(max-width: 900px) 100vw, 590px" : "(max-width: 560px) 100vw, (max-width: 900px) 50vw, 390px"} />
      </div>
      <div className="shop-card-body">
        <h2 id={`shop-${c.id}`}>{c.name}</h2>
        <p>{c.description}</p>
        <div className="shop-card-foot">
          {c.id === "original-goods" && <Link href="/shop/outfit-builder" className="text-link">Build an Outfit →</Link>}
          {c.ask && <ContactAction className="text-link" arrow hint {...c.ask} title={c.name} />}
        </div>
      </div>
    </section>)}</div>
  </div></Shell>;
}
