"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Color = { name: string; hex: string; photo?: string };
type Detail = { id: string; name: string; garment: string; price?: string; shirt: boolean; photo?: string; sizes?: string[] };

/**
 * The product page's picture and choices: color (the picture follows it; a color without a real photo says so),
 * size, a Buy placeholder until checkout opens, and Build an Outfit, which takes this product in the chosen
 * color to the outfit builder. The chosen color is kept in the address (?color=) so the page can be shared.
 */
export default function ProductDetail({ product: p, colors, startColor }: { product: Detail; colors: Color[]; startColor?: string }) {
  const [colorName, setColorName] = useState(startColor);
  const [size, setSize] = useState<string>();
  const color = colors.find(c => c.name === colorName);
  const photo = colors.length ? color?.photo : p.photo;
  const photographed = colors.filter(c => c.photo).map(c => c.name);
  // The outfit board needs a real photo of the chosen color.
  const canBuild = colors.length ? !!color?.photo : !!p.photo;
  const builderHref = `/shop/outfit-builder?${new URLSearchParams({ add: p.id, ...(color && { color: color.name }) })}`;

  useEffect(() => {
    if (!colorName) return;
    const url = new URL(location.href);
    url.searchParams.set("color", colorName);
    history.replaceState(history.state, "", url);
  }, [colorName]);

  return <div className="pd">
    <div className="pd-image">
      {photo
        ? <Image src={photo} alt={color ? `${p.name}, ${color.name}` : p.name} fill priority sizes="(max-width: 860px) 100vw, 640px" />
        : <div className="pd-no-photo" role="img" aria-label={`No preview image of ${p.name} in ${colorName} yet`}>
            <span className="pd-no-photo-swatch" style={{ background: color?.hex }} />
            <strong>Preview image not available yet</strong>
            <span>{p.name} is offered in {colorName}, but its photo hasn’t been added.</span>
          </div>}
    </div>

    <div className="pd-info">
      <h1>{p.name}</h1>
      <p className="pd-meta">{p.garment} · {p.price ?? "Price coming soon"}</p>

      {colors.length > 0 && <section className="pd-choice" aria-labelledby="pd-color-label">
        <h2 id="pd-color-label" className="pd-label">Color: <b>{colorName}</b>{!color?.photo && <span className="pd-label-note"> · preview image not available yet</span>}</h2>
        <div className="pd-colors" role="group" aria-labelledby="pd-color-label">
          {colors.map(c => <button key={c.name} type="button" style={{ background: c.hex }} title={c.photo ? c.name : `${c.name} (no preview image yet)`}
            aria-pressed={c.name === colorName} onClick={() => setColorName(c.name)}>
            <span className="sr-only">{c.name}{!c.photo && " (no preview image yet)"}</span>
          </button>)}
        </div>
        {photographed.length < colors.length && <p className="pd-note">Preview images so far: {photographed.join(", ")}. Other colors show without a photo for now.</p>}
      </section>}

      <section className="pd-choice" aria-labelledby="pd-size-label">
        <h2 id="pd-size-label" className="pd-label">Size{p.sizes && <>: <b>{size ?? "choose one"}</b></>}</h2>
        {p.sizes
          ? <div className="pd-sizes" role="group" aria-labelledby="pd-size-label">
              {p.sizes.map(s => <button key={s} type="button" aria-pressed={s === size} onClick={() => setSize(s)}>{s}</button>)}
            </div>
          : <p className="pd-note">Sizes coming soon.</p>}
      </section>

      <div className="pd-actions">
        <button type="button" className="ink-button pd-buy" disabled>{p.shirt ? "Buy Shirt" : "Buy Now"}</button>
        <p className="pd-note">Checkout opens soon. Nothing can be bought yet.</p>
        {canBuild
          ? <Link className="pd-secondary" href={builderHref}>Build an Outfit</Link>
          : <button type="button" className="pd-secondary" disabled>Build an Outfit</button>}
        <p className="pd-note">{canBuild ? "Optional: try it with other pieces on the outfit board." : `Build an Outfit needs a preview image of ${colorName}. Pick a color with a photo to try it on the board.`}</p>
      </div>
    </div>
  </div>;
}
