import Link from "next/link";
import Shell from "../experiment-components/Shell";
import ShopProductCard from "./ShopProductCard";
import { findAssets } from "./outfit-builder/assets.server";
import { CATEGORIES, PRODUCTS, collectionById, collectionsWith, inCollection, productReady } from "./outfit-builder/catalog";
import "./shop.css";

export const metadata = { title: "Shop", description: "Original OrgToolTank clothing and goods: products we're making, wearing, using, and putting to work." };

type Search = Promise<{ [key: string]: string | string[] | undefined }>;

// The Shop catalog: every product with a real image (catalog.ts), filtered by collection (?collection=<id>) and
// garment type (?category=<id>). Filtering happens here on the server, so a filtered list has its own link.
// VIEW SHIRT / VIEW PRODUCT on a card opens its product page (app/shop/[product]), where colors and sizes are
// chosen; the outfit builder is optional, reachable from a product page or the link under the products.
export default async function ShopPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams, found = new Set(findAssets());
  // Only products whose image is in place.
  const products = PRODUCTS.filter(p => productReady(found, p));
  const collections = collectionsWith(products);
  const collection = collections.find(c => c.id === collectionById(params.collection)?.id);
  const inThis = products.filter(p => inCollection(p, collection?.name));
  const categories = CATEGORIES.filter(c => inThis.some(p => p.category === c.id));
  const category = categories.find(c => c.id === params.category);
  const shown = inThis.filter(p => !category || p.category === category.id);
  const href = (q: { collection?: string; category?: string }) => {
    const s = new URLSearchParams(Object.entries(q).filter((e): e is [string, string] => !!e[1])).toString();
    return s ? `/shop?${s}` : "/shop";
  };

  return <Shell><div className="wrap page-space shop-page">
    <h1 className="shop-title">Shop</h1>
    <p className="shop-subtitle">Products we’re making, wearing, using, and putting to work. More may be added over time based on what people ask for and what we decide to build.</p>
    <p className="shop-note">Clothing comes first. Checkout opens soon. Until then, try the pieces together in the outfit builder.</p>
    {collections.length > 0 && <nav className="shop-collections" aria-labelledby="shop-collections-heading">
      <h2 id="shop-collections-heading">Shop Collections</h2>
      <ul>
        <li><Link href={href({})} aria-current={!collection ? "page" : undefined}>All Products</Link></li>
        {collections.map(c => <li key={c.id}><Link href={href({ collection: c.id })} aria-current={collection?.id === c.id ? "page" : undefined}>{c.name}</Link></li>)}
      </ul>
    </nav>}
    {categories.length > 1 && <nav className="shop-types" aria-label="Garment type">
      <ul>
        <li><Link href={href({ collection: collection?.id })} aria-current={!category ? "page" : undefined}>All</Link></li>
        {categories.map(c => <li key={c.id}><Link href={href({ collection: collection?.id, category: c.id })} aria-current={category?.id === c.id ? "page" : undefined}>{c.name}</Link></li>)}
      </ul>
    </nav>}

    {shown.length
      ? <ul className="shop-products" aria-label={collection ? collection.name : "All products"}>{shown.map(p => <ShopProductCard key={p.id} product={p} collection={collection?.id} />)}</ul>
      : <p className="shop-empty">{collection ? `${collection.name} pieces are being added.` : "Products are being added."} <Link href="/shop" className="text-link">Show all products</Link></p>}

    <p className="shop-builder-link"><Link href="/shop/outfit-builder" className="text-link">Build an Outfit →</Link> <span>Mix pieces on one board and try them against different backgrounds.</span></p>
  </div></Shell>;
}
