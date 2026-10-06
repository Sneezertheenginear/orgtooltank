"use client";
/* eslint-disable @next/next/no-img-element -- product thumbnails shown whole with object-fit: contain */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CATEGORIES, PLAIN_COLOR, PRODUCTS, SCENES, WALL_COLORS, categoryOf, cleanLook, clearCategory, collectionsWith, formatPrice, inCollection, linkOf, lookProducts, lookTotal, productOf, productReady,
  productsIn, resolveImage, sceneOf, toggleProduct, type CategoryId, type CollectionName, type Look, type LookItem, type Product, type SceneId,
} from "./catalog";
import OutfitBoard from "./OutfitBoard";
import { CENTERED, ZOOM, isCentered, stepZoom, type Pan } from "./board-layout";

// Mix and match real products on an outfit board: pick products on the left, see them together in the
// center, save variations and choose a background on the right.
// Nothing is saved to an account, sent, or sold yet. The outfit itself is kept in this browser tab for the visit
// (sessionStorage), so ADD TO OUTFIT from the Shop adds to the same outfit instead of starting over.
//
// Only real product images are shown. With `setup` on (next dev), a product or background whose image is
// missing shows a marked "image needed" slot with its exact file path.
// With it off (production), anything missing is simply left out.

type Variation = { id: number; name: string; look: Look };
const MAX_VARIATIONS = 6;
const START = "Choose a shirt, pants, or shoes to start building your look.";
const OUTFIT_KEY = "orgtooltank-outfit";

/** `collection`: the collection to start with (from a Shop link); ignored if it has no products shown.
 *  `add`: a product to put on the board (ADD TO OUTFIT from the Shop), joining the outfit kept for this visit. */
export default function OutfitBuilder({ assets, setup, collection: startCollection, add }: { assets: string[]; setup: boolean; collection?: CollectionName; add?: LookItem }) {
  const found = useMemo(() => new Set(assets), [assets]);
  const added = add && productOf(add.id);
  const [category, setCategory] = useState<CategoryId>(added?.category ?? "shirts");
  const [look, setLook] = useState<Look>(() => added ? { [added.category]: add } : {});
  const [sceneId, setSceneId] = useState<SceneId>("plain");
  const [wall, setWall] = useState(PLAIN_COLOR);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [message, setMessage] = useState(() => added ? `Added ${add.color ? `${added.name}, ${add.color}` : added.name}.` : "");
  // The outfit kept for this visit: read back once after the page loads (the product just added keeps its
  // place), then saved on every change. Reading it after load keeps the first render the same as the server's.
  const restored = useRef(false);
  useEffect(() => {
    let saved: Look = {};
    try { saved = cleanLook(JSON.parse(sessionStorage.getItem(OUTFIT_KEY) ?? "null")); } catch {}
    restored.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from browser storage after hydration
    if (Object.keys(saved).length) setLook(l => ({ ...saved, ...l }));
    // Drop ?add= from the address so a reload doesn't add the product again after it's been taken off.
    if (add) { const url = new URL(location.href); url.searchParams.delete("add"); url.searchParams.delete("color"); history.replaceState(history.state, "", url); }
  }, [add]);
  useEffect(() => { if (restored.current) try { sessionStorage.setItem(OUTFIT_KEY, JSON.stringify(look)); } catch {} }, [look]);
  // Preview zoom and position: 1 and centered is the board as laid out. Kept when the look changes, so comparing
  // looks keeps the same view. Reset Zoom puts both back.
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Pan>(CENTERED);

  const scene = sceneOf(sceneId);
  const shown = (p: Product) => setup || productReady(found, p);
  // Only collections with at least one shown product get a button.
  const collections = collectionsWith(PRODUCTS.filter(shown));
  // Browsing filter only: which collection's products the cards show (none = All Products). The look isn't affected.
  const [collection, setCollection] = useState<CollectionName | undefined>(() => collections.some(c => c.name === startCollection) ? startCollection : undefined);
  const offered = (c: CategoryId) => productsIn(c).filter(p => shown(p) && inCollection(p, collection));
  const chosen = lookProducts(look), total = lookTotal(look);
  const canZoom = chosen.length > 0;

  /** Add to Look / Remove. A product in colors goes on in the color picked on its card. */
  function pick(p: Product, color?: string) {
    const current = look[p.category], on = current?.id === p.id && current.color === color, name = color ? `${p.name}, ${color}` : p.name;
    setLook(l => toggleProduct(l, p, color));
    setMessage(on ? `Removed ${name}.` : current ? `Swapped in ${name}.` : `Added ${name}.`);
  }
  /** Picking another color for a product that's on the board changes it there too. */
  function recolor(p: Product, color: string) {
    if (look[p.category]?.id !== p.id) return;
    setLook(l => ({ ...l, [p.category]: { id: p.id, color } }));
    setMessage(`Switched to ${p.name}, ${color}.`);
  }
  function remove(c: CategoryId) { const p = chosen.find(x => x.category === c); setLook(l => clearCategory(l, c)); if (p) setMessage(`Removed ${p.name}.`); }
  function reset() { setLook({}); setMessage("Look reset. Pick something new to start again."); }
  /** Plain: back to its clean starting color. */
  function chooseScene(id: SceneId) { setSceneId(id); setWall(PLAIN_COLOR); setMessage(`Background: ${sceneOf(id).name}.`); }
  function chooseWall(hex: string) { setWall(hex); }
  /** Save Look keeps the look in Outfit Variations for this visit. Nothing leaves the page. */
  function saveLook() {
    if (!chosen.length) { setMessage("Add a product first, then save the look."); return; }
    if (variations.length >= MAX_VARIATIONS) { setMessage(`You can keep up to ${MAX_VARIATIONS} looks. Delete one to save another.`); return; }
    const id = (variations.at(-1)?.id ?? 0) + 1;
    setVariations(v => [...v, { id, name: `Look ${id}`, look }]);
    setMessage(`Saved as Look ${id} in Outfit Variations. Saved looks last until you leave the page.`);
  }

  return <><div className="ob-builder">
    {/* Left: products */}
    <section className="ob-panel ob-left" aria-labelledby="ob-mode-heading">
      <h2 id="ob-mode-heading" className="ob-mode">Clothing</h2>

      <div>
        {collections.length > 0 && <div className="ob-collections">
          <h3 id="ob-collections-heading" className="ob-subheading">Shop Collections</h3>
          <div className="ob-collection-list" role="group" aria-labelledby="ob-collections-heading">
            <button type="button" aria-pressed={!collection} onClick={() => setCollection(undefined)}>All Products</button>
            {collections.map(c => <button key={c.id} type="button" aria-pressed={collection === c.name} onClick={() => setCollection(c.name)}>{c.name}</button>)}
          </div>
        </div>}
        <div className="ob-cats" role="group" aria-label="Category">
          {CATEGORIES.map(c => <button key={c.id} type="button" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
            {c.name}{look[c.id] && <span className="ob-count" aria-label="1 selected">1</span>}
          </button>)}
        </div>
        {offered(category).length
          ? <ul className="ob-items">{offered(category).map(p => <ProductCard key={p.id} product={p} found={found} setup={setup} worn={look[p.category]?.id === p.id ? look[p.category] : undefined} onPick={color => pick(p, color)} onColor={color => recolor(p, color)} />)}</ul>
          : <p className="ob-empty">{collection && !PRODUCTS.some(p => shown(p) && inCollection(p, collection))
            ? <>{collection} pieces are being added. <button type="button" className="text-link" onClick={() => setCollection(undefined)}>Show all products</button></>
            : collection
            ? <>No {categoryOf(category).name.toLowerCase()} in {collection} yet. <button type="button" className="text-link" onClick={() => setCollection(undefined)}>Show all products</button></>
            : setup
            ? <>No {categoryOf(category).name.toLowerCase()} yet. Add the real product image to <code>public/outfit-builder/products/&lt;source&gt;/</code> and list it in <code>catalog.ts</code>.</>
            : `${categoryOf(category).name} are coming soon.`}</p>}
      </div>
    </section>

    {/* Center: the outfit board */}
    <div className="ob-center">
      <OutfitBoard found={found} products={chosen} showOutfit scene={scene} wall={wall} setup={setup} empty={START} zoom={zoom} onZoom={setZoom} pan={pan} onPan={setPan} />
      <div className="ob-stage-bar">
        <div className="ob-zoom" role="group" aria-label="Preview zoom">
          <button type="button" className="ob-zoom-btn" onClick={() => setZoom(z => stepZoom(z, -1))} disabled={!canZoom || zoom <= ZOOM.min} aria-label="Zoom out" title="Zoom out">−</button>
          <output className="ob-zoom-level" aria-live="polite">{Math.round(zoom * 100)}%</output>
          <button type="button" className="ob-zoom-btn" onClick={() => setZoom(z => stepZoom(z, 1))} disabled={!canZoom || zoom >= ZOOM.max} aria-label="Zoom in" title="Zoom in">+</button>
          <button type="button" className="ob-mini ob-zoom-reset" onClick={() => { setZoom(1); setPan(CENTERED); }} disabled={zoom === 1 && isCentered(pan)} title="Reset zoom and position">Reset Zoom</button>
        </div>
        <div className="ob-look-actions">
          <button type="button" className="ob-mini" onClick={reset} disabled={!chosen.length}>Reset Look</button>
          <button type="button" className="ink-button ob-save" onClick={saveLook}>Save Look</button>
        </div>
      </div>
      <p className="ob-message" role="status">{message}</p>
    </div>

    {/* Right: variations and background */}
    <div className="ob-right">
      <section className="ob-panel" aria-labelledby="ob-variations-heading">
        <h2 id="ob-variations-heading" className="ob-heading">Outfit Variations</h2>
        <h3 className="ob-subheading">This look</h3>
        {chosen.length ? <ul className="ob-worn">{chosen.map(p => <li key={p.id}>
          <span className="ob-worn-thumb" aria-hidden="true">{resolveImage(found, p.thumbnail ?? p.image) && <img src={resolveImage(found, p.thumbnail ?? p.image)} alt="" />}</span>
          <span className="ob-worn-name">{p.name}<small>{p.source}</small></span>
          <span className="ob-worn-price">{p.price !== undefined ? formatPrice(p.price) : "Price soon"}</span>
          <button type="button" className="ob-x" onClick={() => remove(p.category)} aria-label={`Remove ${p.name}`}>×</button>
        </li>)}</ul> : <p className="ob-empty">{START}</p>}
        {chosen.length > 0 && total.unpriced < chosen.length && <p className="ob-total"><span>Total{total.unpriced ? ` (${total.unpriced} without a price yet)` : ""}</span><strong>{formatPrice(total.cents)}</strong></p>}
        <h3 className="ob-subheading ob-saved-heading">Saved looks</h3>
        {variations.length ? <ul className="ob-variations">{variations.map(v => <li key={v.id}>
          <button type="button" className="ob-variation" onClick={() => { setLook(v.look); setMessage(`Showing ${v.name}.`); }}>
            <strong>{v.name}</strong>
            <span className="ob-variation-items">{lookProducts(v.look).map(p => <span key={p.id}>{p.name}</span>)}</span>
          </button>
          <button type="button" className="ob-x" onClick={() => setVariations(all => all.filter(x => x.id !== v.id))} aria-label={`Delete ${v.name}`}>×</button>
        </li>)}</ul> : <p className="ob-note">Use Save Look to keep this combination, then try another and switch between them.</p>}
      </section>

      <section className="ob-panel" aria-labelledby="ob-bg-heading">
        <h2 id="ob-bg-heading" className="ob-heading">Background / Scene</h2>
        <ScenePicker sceneId={sceneId} wall={wall} onScene={chooseScene} onWall={chooseWall} />
      </section>
    </div>
  </div></>;
}

/** A product card: its real image, name, source, price, and Add to Look / Remove. A product in colors shows one
 *  swatch per color that has a real photo; the picture and Add to Look follow the chosen color. */
function ProductCard({ product: p, found, setup, worn, onPick, onColor }: {
  product: Product; found: ReadonlySet<string>; setup: boolean; worn?: LookItem; onPick: (color?: string) => void; onColor: (color: string) => void;
}) {
  // Only colors with a real photo can go on the board (a color listed without one is for the product page).
  const colors = (p.colors ?? []).filter(c => c.image && (setup || resolveImage(found, c.image)));
  const [picked, setPicked] = useState(colors[0]?.name);
  const on = !!worn, colorName = worn?.color ?? picked, color = colors.find(c => c.name === colorName);
  const image = color?.image ?? p.image, link = linkOf(p);
  const thumb = color ? resolveImage(found, color.image) : resolveImage(found, p.thumbnail) ?? resolveImage(found, p.image);
  const label = color ? `${p.name}, ${color.name}` : p.name;
  return <li className="ob-item" data-on={on ? "" : undefined}>
    <span className="ob-item-thumb">{thumb ? <img src={thumb} alt={label} loading="lazy" />
      : setup && <span className="ob-slot"><strong>Product image needed</strong><code>public{image}</code></span>}</span>
    <span className="ob-item-name">{p.name}</span>
    {colors.length > 0 && <span className="ob-item-colors" role="group" aria-label={`${p.name} color`}>
      {colors.map(c => <button key={c.name} type="button" className="ob-item-color" style={{ background: c.hex }} title={c.name} aria-pressed={c.name === colorName}
        onClick={() => { setPicked(c.name); onColor(c.name); }}><span className="sr-only">{c.name}</span></button>)}
    </span>}
    <span className="ob-item-meta">{p.source}{color && ` · ${color.name}`} · {p.price !== undefined ? formatPrice(p.price) : "Price coming soon"}</span>
    <button type="button" className={on ? "ob-mini ob-item-action" : "ink-button ob-item-action"} disabled={!p.available} onClick={() => onPick(color?.name)}>
      {!p.available ? "Coming soon" : on ? "Remove" : "Add to Look"}<span className="sr-only"> {label}</span>
    </button>
    {link && <a className="ob-item-link" href={link} target="_blank" rel="noopener noreferrer">View product ↗</a>}
  </li>;
}

/** The background (Plain, shown in the current wall color) and the wall color. Shown in the right panel. */
function ScenePicker({ sceneId, wall, onScene, onWall }: {
  sceneId: SceneId; wall: string; onScene: (id: SceneId) => void; onWall: (hex: string) => void;
}) {
  return <div className="ob-scene-picker">
    <div className="ob-scenes" role="group" aria-label="Background">{SCENES.map(s =>
      <button key={s.id} type="button" className="ob-scene" aria-pressed={sceneId === s.id && wall === PLAIN_COLOR} onClick={() => onScene(s.id)}>
        <span className="ob-scene-thumb" style={{ background: wall }} />
        <span>{s.name}</span>
      </button>)}</div>
    <div className="ob-walls" role="group" aria-label="Wall color">
      <span className="ob-walls-label">Wall color</span>
      <span className="ob-swatches">
        {WALL_COLORS.map(c => <button key={c.hex} type="button" className="ob-swatch" style={{ background: c.hex }} title={c.name} aria-pressed={wall === c.hex} onClick={() => onWall(c.hex)}><span className="sr-only">{c.name}</span></button>)}
        <label className="ob-picker" title="Pick any color"><input type="color" value={wall} onChange={e => onWall(e.target.value)} /><span className="sr-only">Pick any wall color</span></label>
      </span>
    </div>
  </div>;
}

