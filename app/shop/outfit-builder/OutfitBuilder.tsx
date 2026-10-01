"use client";
/* eslint-disable @next/next/no-img-element -- product thumbnails shown whole with object-fit: contain */

import { useMemo, useState } from "react";
import {
  CATEGORIES, SCENES, WALL_COLORS, categoryOf, clearCategory, formatPrice, linkOf, lookProducts, lookTotal, productReady,
  productsIn, resolveImage, sceneOf, sceneReady, toggleProduct, type CategoryId, type Look, type Product, type SceneId,
} from "./catalog";
import OutfitBoard from "./OutfitBoard";
import { CENTERED, ZOOM, isCentered, stepZoom, type Pan } from "./board-layout";

// Mix and match real products on an outfit board: pick products on the left, see them together in the
// center, save variations and choose a background on the right. The Scene tab works without any clothing,
// for trying backgrounds (and, later, wall art) on their own.
// Everything is page state only: nothing is saved to an account, sent, or sold yet.
//
// Only real product images are shown. With `setup` on (next dev), a product or background whose image is
// missing shows a marked "image needed" slot with its exact file path.
// With it off (production), anything missing is simply left out.

type Tab = "clothing" | "scene";
type Variation = { id: number; name: string; look: Look };
const MAX_VARIATIONS = 6;
const START = "Choose a shirt, pants, shoes, or scene to start building your look.";

export default function OutfitBuilder({ assets, setup }: { assets: string[]; setup: boolean }) {
  const found = useMemo(() => new Set(assets), [assets]);
  const [tab, setTab] = useState<Tab>("clothing");
  const [category, setCategory] = useState<CategoryId>("shirts");
  const [look, setLook] = useState<Look>({});
  const [showOutfit, setShowOutfit] = useState(true);
  const [sceneId, setSceneId] = useState<SceneId>("plain");
  const [wall, setWall] = useState(WALL_COLORS[0].hex);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [message, setMessage] = useState("");
  // Preview zoom and position: 1 and centered is the board as laid out. Kept when the look changes, so comparing
  // looks keeps the same view. Reset Zoom puts both back.
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Pan>(CENTERED);

  const scene = sceneOf(sceneId);
  const offered = (c: CategoryId) => productsIn(c).filter(p => setup || productReady(found, p));
  const chosen = lookProducts(look), total = lookTotal(look);
  const canZoom = showOutfit && chosen.length > 0;

  function pick(p: Product) {
    const on = look[p.category] === p.id, replacing = look[p.category];
    setLook(l => toggleProduct(l, p));
    setMessage(on ? `Removed ${p.name}.` : replacing ? `Swapped in ${p.name}.` : `Added ${p.name}.`);
  }
  function remove(c: CategoryId) { const p = chosen.find(x => x.category === c); setLook(l => clearCategory(l, c)); if (p) setMessage(`Removed ${p.name}.`); }
  function reset() { setLook({}); setMessage("Look reset. Pick something new to start again."); }
  function chooseScene(id: SceneId) { setSceneId(id); setMessage(`Background: ${sceneOf(id).name}.`); }
  function chooseWall(hex: string) { setWall(hex); setSceneId("custom"); }
  /** Save Look keeps the look in Outfit Variations for this visit. Nothing leaves the page. */
  function saveLook() {
    if (!chosen.length) { setMessage("Add a product first, then save the look."); return; }
    if (variations.length >= MAX_VARIATIONS) { setMessage(`You can keep up to ${MAX_VARIATIONS} looks. Delete one to save another.`); return; }
    const id = (variations.at(-1)?.id ?? 0) + 1;
    setVariations(v => [...v, { id, name: `Look ${id}`, look }]);
    setMessage(`Saved as Look ${id} in Outfit Variations. Saved looks last until you leave the page.`);
  }

  return <><div className="ob-builder">
    {/* Left: products and scene */}
    <section className="ob-panel ob-left" aria-label="Build">
      <div className="ob-tabs" role="tablist" aria-label="Builder">
        {(["clothing", "scene"] as Tab[]).map(t => <button key={t} type="button" role="tab" id={`ob-tab-${t}`} aria-controls={`ob-tabpanel-${t}`} aria-selected={tab === t} onClick={() => setTab(t)}>
          {t === "clothing" ? "Clothing" : "Scene"}
        </button>)}
      </div>

      {tab === "clothing" ? <div role="tabpanel" id="ob-tabpanel-clothing" aria-labelledby="ob-tab-clothing">
        <div className="ob-cats" role="group" aria-label="Category">
          {CATEGORIES.map(c => <button key={c.id} type="button" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
            {c.name}{look[c.id] && <span className="ob-count" aria-label="1 selected">1</span>}
          </button>)}
        </div>
        {!showOutfit && <p className="ob-note">The outfit is hidden. <button type="button" className="text-link" onClick={() => setShowOutfit(true)}>Show outfit</button> to see it on the board.</p>}
        {offered(category).length
          ? <ul className="ob-items">{offered(category).map(p => <ProductCard key={p.id} product={p} found={found} setup={setup} on={look[p.category] === p.id} onPick={() => pick(p)} />)}</ul>
          : <p className="ob-empty">{setup
            ? <>No {categoryOf(category).name.toLowerCase()} yet. Add the real product image to <code>public/outfit-builder/products/&lt;source&gt;/</code> and list it in <code>catalog.ts</code>.</>
            : `${categoryOf(category).name} are coming soon.`}</p>}
      </div> : <div role="tabpanel" id="ob-tabpanel-scene" aria-labelledby="ob-tab-scene" className="ob-scene-tab">
        <p className="ob-note">Try backgrounds on their own, or with your outfit.</p>
        <label className="ob-toggle"><input type="checkbox" checked={showOutfit} onChange={e => { setShowOutfit(e.target.checked); setMessage(e.target.checked ? "Outfit shown." : "Outfit hidden. Only the background is showing."); }} /> Show outfit on the board</label>
        <ScenePicker sceneId={sceneId} wall={wall} found={found} setup={setup} onScene={chooseScene} onWall={chooseWall} />
        <p className="ob-note ob-later">Wall art and room products are coming later.</p>
      </div>}
    </section>

    {/* Center: the outfit board */}
    <div className="ob-center">
      <OutfitBoard found={found} products={chosen} showOutfit={showOutfit} scene={scene} wall={wall} setup={setup} empty={START} zoom={zoom} onZoom={setZoom} pan={pan} onPan={setPan} />
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
        <ScenePicker sceneId={sceneId} wall={wall} found={found} setup={setup} onScene={chooseScene} onWall={chooseWall} />
      </section>
    </div>
  </div></>;
}

/** A product card: its real image, name, source, price, and Add to Look / Remove. */
function ProductCard({ product: p, found, setup, on, onPick }: { product: Product; found: ReadonlySet<string>; setup: boolean; on: boolean; onPick: () => void }) {
  const thumb = resolveImage(found, p.thumbnail) ?? resolveImage(found, p.image), link = linkOf(p);
  return <li className="ob-item" data-on={on ? "" : undefined}>
    <span className="ob-item-thumb">{thumb ? <img src={thumb} alt={p.name} loading="lazy" />
      : setup && <span className="ob-slot"><strong>Product image needed</strong><code>public{p.image}</code></span>}</span>
    <span className="ob-item-name">{p.name}</span>
    <span className="ob-item-meta">{p.source} · {p.price !== undefined ? formatPrice(p.price) : "Price coming soon"}</span>
    <button type="button" className={on ? "ob-mini ob-item-action" : "ink-button ob-item-action"} disabled={!p.available} onClick={onPick}>
      {!p.available ? "Coming soon" : on ? "Remove" : "Add to Look"}<span className="sr-only"> {p.name}</span>
    </button>
    {link && <a className="ob-item-link" href={link} target="_blank" rel="noopener noreferrer">View product ↗</a>}
  </li>;
}

/** Background choices and the custom wall color. Used in both the Scene tab and the right panel, sharing one state. */
function ScenePicker({ sceneId, wall, found, setup, onScene, onWall }: {
  sceneId: SceneId; wall: string; found: ReadonlySet<string>; setup: boolean; onScene: (id: SceneId) => void; onWall: (hex: string) => void;
}) {
  return <div className="ob-scene-picker">
    <div className="ob-scenes" role="group" aria-label="Background">{SCENES.filter(s => setup || sceneReady(found, s)).map(s => { const img = resolveImage(found, s.image);
      return <button key={s.id} type="button" className="ob-scene" aria-pressed={sceneId === s.id} onClick={() => onScene(s.id)}>
        <span className="ob-scene-thumb" style={s.id === "custom" ? { background: wall } : img ? { backgroundImage: `url(${img})` } : s.color ? { background: s.color } : undefined}>
          {s.image && !img && <span className="ob-slot-mini">Photo needed</span>}
        </span>
        <span>{s.name}</span>
      </button>; })}</div>
    <div className="ob-walls" role="group" aria-label="Wall color">
      <span className="ob-walls-label">Wall color</span>
      <span className="ob-swatches">
        {WALL_COLORS.map(c => <button key={c.hex} type="button" className="ob-swatch" style={{ background: c.hex }} title={c.name} aria-pressed={sceneId === "custom" && wall === c.hex} onClick={() => onWall(c.hex)}><span className="sr-only">{c.name}</span></button>)}
        <label className="ob-picker" title="Pick any color"><input type="color" value={wall} onChange={e => onWall(e.target.value)} /><span className="sr-only">Pick any wall color</span></label>
      </span>
    </div>
  </div>;
}

