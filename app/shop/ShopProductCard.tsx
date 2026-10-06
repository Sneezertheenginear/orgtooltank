import Image from "next/image";
import Link from "next/link";
import { formatPrice, garmentOf, type Product } from "./outfit-builder/catalog";

/**
 * One product in the Shop catalog: its picture, name, garment, price, and a link to its product page, where
 * colors and sizes are chosen. `collection` (the Shop filter in use) lets the product page link back to it.
 */
export default function ShopProductCard({ product: p, collection }: { product: Product; collection?: string }) {
  return <li className="shop-product">
    <div className="shop-product-image">
      <Image src={p.image} alt={p.name} fill sizes="(max-width: 760px) 50vw, (max-width: 1100px) 33vw, 290px" />
    </div>
    <div className="shop-product-body">
      <h3>{p.name}</h3>
      <p className="shop-product-meta">{garmentOf(p)} · {p.price !== undefined ? formatPrice(p.price) : "Price coming soon"}</p>
      <Link className="ink-button shop-product-add" href={`/shop/${p.id}${collection ? `?collection=${collection}` : ""}`}>
        {p.category === "shirts" ? "View Shirt" : "View Product"}<span className="sr-only">: {p.name}</span>
      </Link>
    </div>
  </li>;
}
