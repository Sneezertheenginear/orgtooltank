import Link from "next/link";
import Shell from "../../experiment-components/Shell";
import OutfitBuilder from "./OutfitBuilder";
import { findAssets } from "./assets.server";
import { collectionById } from "./catalog";
import "../shop.css";
import "./outfit-builder.css";

export const metadata = { title: "Build an Outfit", description: "Mix and match shirts, pants, jackets, shoes, hats, and accessories from real products on one outfit board, against different backgrounds." };

// ?collection=<id> (from the Shop page's collection links) opens the builder with that collection selected.
export default async function OutfitBuilderPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const collection = collectionById((await searchParams).collection)?.name;
  return <Shell><div className="wrap page-space ob-page">
    <Link href="/shop" className="text-link">← Shop</Link>
    <p className="eyebrow shop-eyebrow">Shop / Clothing</p>
    <h1 className="page-title">Build an Outfit</h1>
    <p className="page-intro">Mix and match real products on one outfit board, then try the look against different backgrounds.</p>
    <p className="shop-note"><span className="status-tag">Preview</span> Real products, shown as a preview. Nothing is for sale here yet.</p>
    {/* Setup mode (next dev) marks missing images; production shows only real images. */}
    <OutfitBuilder assets={findAssets()} setup={process.env.NODE_ENV !== "production"} collection={collection} />
  </div></Shell>;
}
