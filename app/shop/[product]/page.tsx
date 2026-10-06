import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "../../experiment-components/Shell";
import { findAssets } from "../outfit-builder/assets.server";
import { collectionById, formatPrice, garmentOf, productOf, productReady, resolveImage } from "../outfit-builder/catalog";
import ProductDetail from "./ProductDetail";
import "../shop.css";

type Props = { params: Promise<{ product: string }>; searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

export async function generateMetadata({ params }: Props) {
  const p = productOf((await params).product);
  return p ? { title: p.name, description: `${p.name}, ${garmentOf(p).toLowerCase()}, from the OrgToolTank Shop.` } : {};
}

// A product page: /shop/<product id>, opened from VIEW SHIRT / VIEW PRODUCT on a Shop card. ?color= picks the
// starting color and ?collection= is the Shop filter to go back to. Each color's photo is passed only if the
// file is really there, so a color without one is shown as such instead of with a stand-in.
export default async function ProductPage({ params, searchParams }: Props) {
  const [{ product: id }, query] = await Promise.all([params, searchParams]);
  const found = new Set(findAssets()), p = productOf(id);
  if (!p || !productReady(found, p)) notFound();
  const colors = (p.colors ?? []).map(c => ({ name: c.name, hex: c.hex, photo: resolveImage(found, c.image) }));
  const startColor = colors.find(c => c.name === query.color)?.name ?? colors.find(c => c.photo)?.name;
  const collection = collectionById(query.collection);
  return <Shell><div className="wrap page-space pd-page">
    <Link href={collection ? `/shop?collection=${collection.id}` : "/shop"} className="text-link">← {collection ? `Shop / ${collection.name}` : "Shop"}</Link>
    <ProductDetail
      product={{ id: p.id, name: p.name, garment: garmentOf(p), price: p.price !== undefined ? formatPrice(p.price) : undefined, shirt: p.category === "shirts", photo: resolveImage(found, p.image), sizes: p.sizes }}
      colors={colors} startColor={startColor} />
  </div></Shell>;
}
