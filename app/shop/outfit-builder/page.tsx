import Link from "next/link";
import Shell from "../../experiment-components/Shell";
import OutfitBuilder from "./OutfitBuilder";
import { findAssets } from "./assets.server";
import { collectionById, lookItemFor } from "./catalog";
import "../shop.css";
import "./outfit-builder.css";

export const metadata = { title: "Build an Outfit", description: "Mix and match shirts, pants, jackets, shoes, hats, and accessories from real products on one outfit board, against different backgrounds." };

// From the Shop: ?add=<product id>&color=<Color> (ADD TO OUTFIT) puts that product on the board, and
// ?collection=<id> starts with that collection selected.
export default async function OutfitBuilderPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const collection = collectionById(params.collection)?.name, add = lookItemFor(params.add, params.color);
  return <Shell><div className="wrap page-space ob-page">
    <Link href="/shop" className="text-link">← Shop</Link>
    <p className="eyebrow shop-eyebrow">Shop / Clothing</p>
    <h1 className="page-title">Build an Outfit</h1>
    <p className="page-intro">Mix and match real products on one outfit board, then try the look against different backgrounds.</p>
    <p className="shop-note"><span className="status-tag">Preview</span> Real products, shown as a preview. Nothing is for sale here yet.</p>
    {/* Setup mode (next dev) marks missing images; production shows only real images. */}
    <OutfitBuilder assets={findAssets()} setup={process.env.NODE_ENV !== "production"} collection={collection} add={add} />
  </div></Shell>;
}
