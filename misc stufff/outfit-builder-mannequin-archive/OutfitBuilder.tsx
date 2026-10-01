"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { CATEGORIES, categoryOf, detailsText, formatPrice, productPriceLabel, products, sceneProducts, type CategoryId, type Product, type SceneProduct, type View } from "./products";
import { createTestCart, itemsIn, missingSizes, outfitToCartLines, pieces, placeFor, remove, slotsFor, total, update, wear, type CartLine, type Outfit, type Target } from "./outfit";
import { SLOTS, SLOT_GROUPS, UPPER_LAYERS, ZONES, zoneForSlot, zoneOf, type SlotId, type ZoneId } from "./zones";
import { GarmentThumb, type Layer } from "./Mannequin";
import DesignChoices from "./DesignChoices";
import MannequinPanel from "./MannequinPanel";
import OutfitPreview, { type PreviewWords } from "./OutfitPreview";
import { DEFAULT_PROFILE, HEIGHT, STATUS_NAMES, garmentRoom, recommendSize, type FitProfile, type Recommendation } from "./fit";
import { shapeFor } from "./body";
import { MannequinViewer, ViewerControls } from "./Viewer";
import { CENTER, ROOM_STAGE, STAGE, clampPan, type Pan } from "./view";
import { DEFAULT_ENVIRONMENT, isDark, wallOf, type Environment } from "./env";
import { addItem, clearOfMannequin, placed, priceOf, removeItem, replaceItem, sceneToCartLines, sceneTotal, updateItem, type SceneItem } from "./scene";
import { Backdrop, EnvironmentControls } from "./Room";
import { SceneRows, ScenePicker } from "./ScenePanel";
import type { PersonSet } from "./person";

// One builder, three ways to use it:
//   Outfit:    dress the mannequin, against any background color
//   Scene:     hang wall art on a wall, no mannequin
//   Full Look: the dressed mannequin in the room, with the wall art
// pick → try → switch → layer → turn → zoom → change the background → preview → buy.
// The outfit and the wall art are both kept when switching modes; the mode only decides what's shown,
// totaled, and added to the cart. Every slot holds its own pieces (left and right are separate), and the
// mannequin is redrawn from the slots, so taking off a top layer shows what's under it. Everything
// happens on this one page; there are no product pages to visit.

type Mode = "outfit" | "scene" | "look";
const MODES: { id: Mode; name: string; hint: string }[] = [
  { id: "outfit", name: "Outfit", hint: "Dress the mannequin" },
  { id: "scene", name: "Scene", hint: "Hang wall art" },
  { id: "look", name: "Full Look", hint: "Outfit and wall art together" },
];
const WORDS: Record<Mode, PreviewWords> = {
  outfit: { eyebrow: "Outfit preview", title: "Your outfit", empty: "Nothing on the mannequin yet.", total: "OUTFIT TOTAL", cart: "Add Whole Outfit to Cart", edit: "Edit Outfit" },
  scene: { eyebrow: "Scene preview", title: "Your scene", empty: "No wall art yet.", total: "SCENE TOTAL", cart: "Add Scene to Cart", edit: "Edit Scene" },
  look: { eyebrow: "Full look preview", title: "Your look", empty: "Nothing in your look yet.", total: "LOOK TOTAL", cart: "Add Whole Look to Cart", edit: "Edit Look" },
};

const zoneLabels = Object.fromEntries(ZONES.map(z => [z.id, z.name.toUpperCase()])) as Record<ZoneId, string>;
const hexOf = (p: Product, color: string) => p.colors.find(c => c.name === color)?.hex ?? p.colors[0].hex;
const SHORT_LAYERS: Partial<Record<SlotId, string>> = { base: "Base", mid: "Mid", outer: "Outer" };
const pieceKey = (slot: SlotId, index: number) => `${slot}:${index}`;

type Filter = "all" | CategoryId;

/** `person`: the realistic person photos found for each angle (see person.ts); angles without one use the drawn mannequin. */
export default function OutfitBuilder({ person }: { person?: PersonSet }) {
  const [mode, setMode] = useState<Mode>("outfit");
  // The background color (Outfit) or wall and floor (Scene, Full Look), shared by all three modes.
  const [env, setEnv] = useState<Environment>(DEFAULT_ENVIRONMENT);
  const [art, setArt] = useState<SceneItem[]>([]);
  const [selectedArt, setSelectedArt] = useState<string | null>(null);
  // Set by CHANGE on a piece of wall art: the next wall art picked replaces it.
  const [changingArt, setChangingArt] = useState<string | null>(null);
  const withOutfit = mode !== "scene", withArt = mode !== "outfit", inRoom = mode !== "outfit";
  // null means nothing selected: just looking at the outfit.
  const [area, setArea] = useState<ZoneId | null>(null);
  // Set by ADD or CHANGE on a slot row: the next product picked goes exactly there.
  const [target, setTarget] = useState<Target | null>(null);
  const [zoom, setZoom] = useState(1);
  const [preview, setPreview] = useState(false);
  // One viewer state for the builder and Preview Outfit: the angle, zoom, and position always match.
  const [view, setView] = useState<View>("front");
  const [pan, setPan] = useState<Pan>(CENTER);
  const [room, setRoom] = useState<Pan>(CENTER);
  /** The visible viewer reports how far the zoomed figure can move; the position is kept inside that. */
  const reportRoom = useCallback((r: Pan) => {
    setRoom(r);
    setPan(p => { const c = clampPan(p, r); return c.x === p.x && c.y === p.y ? p : c; });
  }, []);
  const viewerControls = {
    view, onView: setView, zoom, onZoom: setZoom, room,
    onFit: () => { setZoom(1); setPan(CENTER); },
    onReset: () => { setZoom(1); setPan(CENTER); setView("front"); },
    onNudge: (dx: number, dy: number) => setPan(p => clampPan({ x: p.x + dx * 0.08, y: p.y + dy * 0.08 }, room)),
  };
  const previewButton = useRef<HTMLButtonElement>(null);
  const areasHeading = useRef<HTMLHeadingElement>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [outfit, setOutfit] = useState<Outfit>({});
  // The shopper's mannequin and fit details. Page state only: not saved or sent anywhere.
  const [profile, setProfile] = useState<FitProfile>(DEFAULT_PROFILE);
  const shape = useMemo(() => shapeFor(profile), [profile]);
  const fitBody = useMemo(() => ({ build: profile.build, height: profile.height ?? HEIGHT.reference }), [profile.build, profile.height]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [message, setMessage] = useState("");
  const pickerRef = useRef<HTMLElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);
  // Test cart until a store is connected; see outfit.ts for the Shopify integration point.
  const cartAdapter = useMemo(() => createTestCart(setCart), []);

  const worn = pieces(outfit, products);
  const outfitTotal = total(outfit, products), needSizes = missingSizes(outfit, products);
  // Each piece gets its own size suggestion; none is shared across the outfit.
  const recs = useMemo(() => new Map(pieces(outfit, products).map(w => [pieceKey(w.slot, w.index), recommendSize(w.product, profile)])), [outfit, profile]);
  const layers = useMemo(() => {
    const result: Layer[] = [];
    let under = 0;
    for (const w of pieces(outfit, products)) {
      // The chosen size, or the suggested one until a size is chosen, sets how roomy the piece looks.
      let room = garmentRoom(w.product, w.piece.size || recs.get(pieceKey(w.slot, w.index))?.size || "", profile);
      // An upper layer never looks tighter than the one under it, so it still covers it.
      if (UPPER_LAYERS.includes(w.slot)) { room = Math.max(room, under); under = room; }
      result.push({ slot: w.slot, index: w.index, product: w.product, hex: hexOf(w.product, w.piece.color), designId: w.piece.designId, printZone: w.piece.printZone, room });
    }
    return result;
  }, [outfit, profile, recs]);
  const hung = placed(art, sceneProducts), artTotal = sceneTotal(art, sceneProducts);
  const count = (withOutfit ? worn.length : 0) + (withArt ? hung.length : 0);
  const buildTotal = (withOutfit ? outfitTotal : 0) + (withArt ? artTotal : 0);
  const words = WORDS[mode], wall = wallOf(env.wall).hex;
  const productAt = (slot: SlotId, index: number) => { const piece = itemsIn(outfit, slot)[index]; return piece ? products.find(p => p.id === piece.productId) ?? null : null; };

  function chooseArea(next: ZoneId, focusList = false) {
    setArea(next); setTarget(null); setFilter("all"); setMessage("");
    requestAnimationFrame(() => {
      pickerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      if (focusList) pickerRef.current?.focus({ preventScroll: true });
    });
  }
  /** ADD (index undefined) or CHANGE (index given) on a slot: opens its zone and shows what can go there. */
  function openSlot(slot: SlotId, index?: number) {
    const zone = area && zoneOf(area).slots.includes(slot) ? area : zoneForSlot(slot);
    if (zone !== area) chooseArea(zone, true);
    setTarget({ slot, index }); setFilter("all");
    requestAnimationFrame(() => productsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }
  function put(product: Product, color?: string) {
    const to = target && product.slots.includes(target.slot) ? target : placeFor(outfit, product, area ?? undefined);
    if (!to) { setMessage(`${area ? zoneOf(area).name : "That spot"} is full. Choose Change or Remove on one of its pieces first.`); return; }
    const current = to.index === undefined ? null : productAt(to.slot, to.index);
    setOutfit(o => wear(o, product, color, to));
    setTarget(null);
    const where = SLOTS[to.slot].side ? ` (${SLOTS[to.slot].name.toLowerCase()})` : "";
    setMessage(!current ? `Added ${product.name}${where}.` : current.id === product.id ? `${product.name}: ${color ?? "same color"}.` : `Swapped ${current.name} for ${product.name}${where}.`);
  }
  function takeOff(slot: SlotId, index: number) {
    const current = productAt(slot, index);
    if (!current) return;
    // Say what's showing now that the top layer is gone.
    const below = UPPER_LAYERS.slice(0, UPPER_LAYERS.indexOf(slot)).reverse().map(s => productAt(s, 0)).find(Boolean);
    setOutfit(o => remove(o, slot, index)); setTarget(null);
    setMessage(`Removed ${current.name}.${UPPER_LAYERS.includes(slot) && below ? ` ${below.name} is showing.` : ""}`);
  }
  /** Adds what this mode shows (the outfit, the wall art, or both) to the cart in one go. */
  async function addOutfit() {
    if (!count) return;
    if (withOutfit && needSizes.length) { setMessage(`Choose a size for: ${needSizes.map(p => p.name).join(", ")}.`); return; }
    const lines = [...(withOutfit ? outfitToCartLines(outfit, products) : []), ...(withArt ? sceneToCartLines(art, sceneProducts) : [])];
    const result = await cartAdapter.addLines(lines);
    setMessage(result.ok ? `Added ${lines.length} ${lines.length === 1 ? "piece" : "pieces"} to the test cart. Checkout isn’t available yet.` : result.error);
  }
  /** View Outfit: deselect the zone (and its outline) and any wall art. Nothing is removed. */
  function viewOutfit() { setArea(null); setTarget(null); setFilter("all"); setSelectedArt(null); setChangingArt(null); }
  function switchMode(next: Mode) {
    if (next === mode) return;
    // Each mode frames its own stage (the mannequin, or the whole room), so the view starts fitted.
    setMode(next); setZoom(1); setPan(CENTER); viewOutfit(); setMessage("");
    // Wall art hung where the mannequin now stands moves beside it, so nothing is hidden.
    if (next === "look") setArt(a => clearOfMannequin(a, sceneProducts));
  }
  function pickArt(product: SceneProduct) {
    const changing = hung.find(h => h.item.key === changingArt);
    if (changing) {
      setArt(a => replaceItem(a, changing.item.key, product)); setSelectedArt(changing.item.key); setChangingArt(null);
      setMessage(`Swapped ${changing.product.name} for ${product.name}.`);
      return;
    }
    const next = addItem(art, product, mode === "look");
    setArt(next); setSelectedArt(next[next.length - 1].key);
    setMessage(`Hung ${product.name}. Drag it to move it.`);
  }
  function removeArt(key: string) {
    const gone = hung.find(h => h.item.key === key);
    setArt(a => removeItem(a, key)); setSelectedArt(null); setChangingArt(null);
    if (gone) setMessage(`Removed ${gone.product.name}.`);
  }
  const moveArt = (key: string, x: number, y: number) => {
    const p = hung.find(h => h.item.key === key)?.product;
    if (p) setArt(a => updateItem(a, key, p, { x, y }));
  };
  function closePreview(edit = false) {
    setPreview(false);
    requestAnimationFrame(() => (edit ? areasHeading.current : previewButton.current)?.focus({ preventScroll: !edit }));
  }
  function startOver() {
    if (withOutfit) setOutfit({});
    if (withArt) setArt([]);
    viewOutfit(); setMessage(mode === "scene" ? "Started over. The wall is empty." : mode === "look" ? "Started over. The mannequin and wall are empty." : "Started over. The mannequin is empty.");
  }

  const slotRows = (slot: SlotId, label: string | null, detail?: (index: number) => { inline: ReactNode; below: ReactNode }) =>
    <SlotRows slot={slot} label={label} names={itemsIn(outfit, slot).map((_, i) => productAt(slot, i)?.name ?? "")} target={target} detail={detail} onOpen={openSlot} onRemove={takeOff} />;

  const card = (p: Product) => {
    const zoneSlots = slotsFor(p, area ?? undefined);
    const on = zoneSlots.flatMap(slot => itemsIn(outfit, slot).flatMap((piece, index) => piece.productId === p.id ? [{ slot, index, piece }] : []))[0];
    const to = target && p.slots.includes(target.slot) ? target : placeFor(outfit, p, area ?? undefined);
    const replacing = to?.index !== undefined ? productAt(to.slot, to.index) : null;
    const cta = !to ? "Full" : replacing && replacing.id !== p.id ? "Swap in" : on && to.index !== undefined ? null : on ? "Add another" : "Add";
    const colorOf = on ? on.piece.color : p.colors[0].name;
    return <li key={p.id} className="ob-product" data-on={on ? "" : undefined}>
      {on && <span className="ob-on-badge">On mannequin</span>}
      <button type="button" className="ob-product-main" onClick={() => put(p, on && to?.index !== undefined ? on.piece.color : undefined)}
        aria-label={cta === "Swap in" ? `Swap ${replacing!.name} for ${p.name}, ${productPriceLabel(p)}` : cta === "Add" || cta === "Add another" ? `${cta} ${p.name}, ${productPriceLabel(p)}` : `${p.name}, ${productPriceLabel(p)}, on the mannequin`}>
        <GarmentThumb product={p} color={colorOf} hex={hexOf(p, colorOf)} tone={profile.tone} />
        <span className="ob-product-name">{p.name}</span>
        <span className="ob-product-meta">{p.productModel || categoryOf(p.category).name} · {productPriceLabel(p)}</span>
        {cta && <span className="ob-product-cta">{cta}</span>}
      </button>
      <div className="ob-swatches" role="group" aria-label={`${p.name} colors`}>{p.colors.map(c => <button key={c.name} type="button" className="ob-swatch" style={{ background: c.hex }} aria-pressed={!!on && on.piece.color === c.name} title={c.name}
        onClick={() => { if (!on) { put(p, c.name); return; } setOutfit(o => update(o, on.slot, { color: c.name }, on.index)); setMessage(`${p.name}: ${c.name}.`); }}><span className="sr-only">{p.name} in {c.name}</span></button>)}</div>
      {on && p.garmentId && <DesignChoices product={p} value={on.piece.designId} onChange={designId => setOutfit(o => update(o, on.slot, { designId, printZone: "front" }, on.index))} />}
      {on && <button type="button" className="ob-mini ob-card-remove" onClick={() => takeOff(on.slot, on.index)}>Remove<span className="sr-only"> {p.name}</span></button>}
    </li>;
  };

  const zone = area ? zoneOf(area) : null;
  /** Product groups for the open zone: one per distinct set of categories (both ears share one group). */
  const groups = zone ? zone.slots.reduce<{ slots: SlotId[]; cats: typeof CATEGORIES }[]>((all, slot) => {
    const cats = CATEGORIES.filter(c => c.slots.includes(slot) && c.zones.includes(zone.id));
    const same = all.find(g => g.cats.map(c => c.id).join() === cats.map(c => c.id).join());
    if (same) same.slots.push(slot); else all.push({ slots: [slot], cats });
    return all;
  }, []) : [];
  const focusGroup = target ? groups.find(g => g.slots.includes(target.slot)) : null;
  const productsFor = (cats: typeof CATEGORIES) => products.filter(p => cats.some(c => c.id === p.category) && (p.category !== "tshirts" || p.garmentId));
  const emptyGroups = SLOT_GROUPS.filter(g => g.slots.every(s => !itemsIn(outfit, s).length));

  const stage = inRoom ? ROOM_STAGE : STAGE;
  const backdrop = (interactive: boolean) => <Backdrop room={inRoom} env={env} stage={stage} items={withArt ? hung : []} selectedKey={selectedArt} interactive={interactive}
    onSelect={key => { setSelectedArt(key); setArea(null); }} onMove={moveArt} onBackground={viewOutfit} />;
  // What the viewer shows, shared by the builder and Preview.
  const viewerProps = {
    layers, shape, tone: profile.tone, fitBody, person, view, pan, onPan: setPan, stage, background: wall, dark: isDark(wall), showMannequin: withOutfit, guides: !inRoom,
  };
  const controls = { ...viewerControls, angles: withOutfit, fitLabel: mode === "outfit" ? "Fit Outfit" : mode === "scene" ? "Fit Scene" : "Fit Look" };
  const steps = mode === "scene" ? { art: 1, summary: 2 } : mode === "look" ? { zones: 1, piece: 2, art: 3, summary: 4 } : { zones: 1, piece: 2, summary: 3 };
  const selectedName = hung.find(h => h.item.key === selectedArt)?.product.name;

  return <div className="ob-builder" data-mode={mode}>
    <div className="ob-modes" role="group" aria-label="Builder mode">
      {MODES.map(m => <button key={m.id} type="button" aria-pressed={mode === m.id} onClick={() => switchMode(m.id)}><strong>{m.name}</strong><span>{m.hint}</span></button>)}
    </div>

    {/* Tapping empty space around the viewer also deselects. */}
    <div className="ob-stage" onClick={e => { if (e.target === e.currentTarget) viewOutfit(); }}>
      <MannequinViewer className="ob-stage-viewer" {...viewerProps} backdrop={backdrop(true)} zoom={zoom} onRoom={preview ? undefined : reportRoom}
        selected={area} onSelect={a => { chooseArea(a); setSelectedArt(null); }} onDeselect={viewOutfit} labels={zoneLabels} />
      {zone ? <p className="ob-stage-hint">Selected: {zone.name}</p>
        : selectedName ? <p className="ob-stage-hint">Selected: {selectedName}. Drag it to move it.</p>
        : mode === "scene" ? !hung.length && <p className="ob-stage-hint">Pick wall art to hang it here.</p>
        : !worn.length && <p className="ob-stage-hint">Tap anywhere on the mannequin, head to toe, to start.</p>}
      {withOutfit && !worn.some(w => w.product.garmentId) && <p className="ob-stage-hint">Choose a shirt to start building your outfit. <button type="button" className="text-link" onClick={() => { chooseArea("upper", true); setFilter("tshirts"); }}>Choose tee</button></p>}
      <ViewerControls {...controls} />
      <EnvironmentControls room={inRoom} env={env} onChange={setEnv} />
      <button type="button" ref={previewButton} className="ink-button ob-preview-open" onClick={() => { setMessage(""); setPreview(true); }} disabled={!count}>{mode === "outfit" ? "Preview Outfit" : mode === "scene" ? "Preview Scene" : "Preview Look"}</button>
    </div>

    <div className="ob-controls">
      {withOutfit && <>
      <MannequinPanel profile={profile} onChange={change => setProfile(p => ({ ...p, ...change }))} />

      <section className="ob-panel" aria-labelledby="ob-area-heading">
        <div className="ob-area-head">
          <h2 id="ob-area-heading" className="ob-step" ref={areasHeading} tabIndex={-1}><span>{steps.zones}</span> Choose where</h2>
          <button type="button" className="ob-mini" onClick={viewOutfit} disabled={!area}>View Outfit</button>
        </div>
        <div className="ob-areas" role="group" aria-label="Body zone">
          {ZONES.map(z => <button key={z.id} type="button" className="ob-area" aria-pressed={area === z.id} onClick={() => chooseArea(z.id)}>
            <strong>{z.name}</strong><span>{z.hint}</span>
          </button>)}
        </div>
      </section>

      <section className="ob-panel ob-picker" aria-labelledby="ob-picker-heading" ref={pickerRef} tabIndex={-1}>
        <h2 id="ob-picker-heading" className="ob-step"><span>{steps.piece}</span> {zone ? zone.name : "Choose a piece"}</h2>
        {!zone ? <p className="ob-empty">Tap the mannequin or choose a spot above, from head to feet.</p> : <>
          <div className="ob-slots">{zone.slots.map(slot => <div key={slot} className="ob-slot-set">
            {slotRows(slot, zone.slots.length > 1 || SLOTS[slot].capacity > 1 ? SLOTS[slot].name : null)}
          </div>)}</div>
          <div ref={productsRef}>
            {zone.slots.length > 1 ? <>
              {focusGroup && groups.length > 1 && <p className="ob-sub">Showing {focusGroup.cats.map(c => c.name.toLowerCase()).join(", ")} for {SLOTS[target!.slot].name.toLowerCase()}. <button type="button" className="text-link" onClick={() => setTarget(null)}>Show everything</button></p>}
              {groups.filter(g => !focusGroup || groups.length === 1 || g === focusGroup).map(g => <div key={g.slots.join()} className="ob-layer-group">
                <h3 className="ob-layer-heading"><span>{g.slots.length > 1 ? g.cats.map(c => c.name).join(", ") : SLOTS[g.slots[0]].name}</span>
                  {g.slots.length === 1 && <span className="ob-layer-kinds">{g.cats.map(c => c.name).join(", ")}</span>}</h3>
                <ul className="ob-products">{productsFor(g.cats).map(card)}</ul>
              </div>)}
            </> : <>
              {groups[0]?.cats.length > 1 && <div className="ob-filters" role="group" aria-label="Category">
                <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All</button>
                {groups[0].cats.map(c => <button key={c.id} type="button" aria-pressed={filter === c.id} disabled={!c.available} onClick={() => setFilter(c.id)}>{c.name}{!c.available && " (later)"}</button>)}
              </div>}
              <ul className="ob-products">{productsFor(groups[0]?.cats ?? []).filter(p => filter === "all" || p.category === filter).map(card)}</ul>
            </>}
          </div>
        </>}
        {message && <p className="ob-message" role="status">{message}</p>}
      </section>
      </>}

      {withArt && <ScenePicker step={steps.art!} changing={hung.find(h => h.item.key === changingArt) ?? null} onPick={pickArt} onCancel={() => setChangingArt(null)} />}
      {!withOutfit && message && <p className="ob-message" role="status">{message}</p>}

      <section className="ob-panel ob-outfit" aria-labelledby="ob-outfit-heading">
        <h2 id="ob-outfit-heading" className="ob-step"><span>{steps.summary}</span> {words.title}</h2>
        {!count && <p className="ob-empty">{words.empty}</p>}
        {withOutfit && <div className="ob-summary">{SLOT_GROUPS.filter(g => !emptyGroups.includes(g)).map(g => <div key={g.id} className="ob-summary-group">
          <h3 className="ob-summary-heading">{g.name}</h3>
          {g.slots.map(slot => {
            const label = SHORT_LAYERS[slot] ?? (g.slots.length > 1 || SLOTS[slot].capacity > 1 ? SLOTS[slot].name : null);
            const items = itemsIn(outfit, slot);
            if (!items.length) return <div key={slot} className="ob-piece is-empty">{slotRows(slot, label)}</div>;
            return <div key={slot} className="ob-piece-set">{slotRows(slot, label, index => {
              const piece = items[index], current = productAt(slot, index)!, details = detailsText(current);
              return {
                inline: <><span className="ob-piece-detail"><span className="ob-piece-dot" style={{ background: hexOf(current, piece.color) }} aria-hidden="true" />{piece.color} • {piece.size || "choose a size"}<span className="ob-piece-price">{productPriceLabel(current)}</span></span>
                  {details && <span className="ob-piece-facts">{details}</span>}</>,
                below: <>{current.garmentId && <DesignChoices product={current} value={piece.designId} onChange={designId => setOutfit(o => update(o, slot, { designId, printZone: "front" }, index))} />}<PieceChoices product={current} color={piece.color} size={piece.size} rec={recs.get(pieceKey(slot, index))}
                  onColor={c => setOutfit(o => update(o, slot, { color: c }, index))} onSize={s => setOutfit(o => update(o, slot, { size: s }, index))} /></>,
              };
            })}</div>;
          })}
        </div>)}</div>}
        {withArt && hung.length > 0 && <div className="ob-summary ob-summary-art"><div className="ob-summary-group">
          <h3 className="ob-summary-heading">Wall art</h3>
          <SceneRows placed={hung} selectedKey={selectedArt} changingKey={changingArt} onSelect={key => { setSelectedArt(key); setArea(null); }} onRemove={removeArt}
            onChange={key => { setChangingArt(key); setSelectedArt(key); requestAnimationFrame(() => document.getElementById("ob-scene-heading")?.scrollIntoView({ behavior: "smooth", block: "start" })); }}
            onUpdate={(key, product, change) => setArt(a => updateItem(a, key, product, change))} />
        </div></div>}
        {/* The other mode's pieces are kept, not lost: say so, since they aren't in this total. */}
        {mode === "outfit" && hung.length > 0 && <p className="ob-kept">Your wall art ({hung.length}) is kept for Scene and Full Look.</p>}
        {mode === "scene" && worn.length > 0 && <p className="ob-kept">Your outfit ({worn.length} {worn.length === 1 ? "piece" : "pieces"}) is kept for Outfit and Full Look.</p>}
        {withOutfit && worn.length > 0 && emptyGroups.length > 0 && <p className="ob-more">Add more: {emptyGroups.map((g, i) => <span key={g.id}>{i > 0 && " · "}<button type="button" className="text-link" onClick={() => chooseArea(g.zone, true)}>{g.name}</button></span>)}</p>}

        <div className="ob-total">
          <p className="ob-total-label">{words.total}</p>
          <p className="ob-total-value">{formatPrice(buildTotal)}</p>
          <p className="ob-total-count">{count} {count === 1 ? "piece" : "pieces"}</p>
        </div>
        {withOutfit && needSizes.length > 0 && <p className="ob-need">Choose a size for {needSizes.map(p => p.name).join(", ")} before adding to the cart.</p>}
        <button type="button" className="ink-button ob-add" disabled={!count} onClick={addOutfit}>{words.cart}</button>
        {count > 0 && <button type="button" className="text-link ob-start-over" onClick={startOver}>Start Over</button>}
        {cart.length > 0 && <p className="ob-cart">Test cart: {cart.length} {cart.length === 1 ? "item" : "items"} · {formatPrice(cart.reduce((n, l) => n + l.price * l.quantity, 0))}. This is a preview cart; nothing is for sale yet.</p>}
      </section>
    </div>
    {preview && <OutfitPreview viewer={{ ...viewerProps, backdrop: backdrop(false), onRoom: reportRoom }} total={buildTotal} words={words} controls={controls}
      names={[
        ...(withOutfit ? worn.map(w => `${w.product.name} · ${w.piece.color}${w.product.sizes.length > 1 ? ` · ${w.piece.size || "size not chosen"}` : ""}${SLOTS[w.slot].side ? ` (${SLOTS[w.slot].name.toLowerCase()})` : ""}`) : []),
        ...(withArt ? hung.map(h => `${h.product.name} · ${h.item.color} · ${h.item.size} · ${formatPrice(priceOf(h.product, h.item.size))}`) : []),
      ]}
      onEdit={() => closePreview(true)} onClose={() => closePreview()} onAddToCart={addOutfit} message={message} />}
  </div>;
}

/** A piece's color and size choices, with size guidance under the sizes where it makes sense. */
function PieceChoices({ product, color, size, rec, onColor, onSize }: {
  product: Product; color: string; size: string; rec?: Recommendation; onColor: (color: string) => void; onSize: (size: string) => void;
}) {
  const sizeName = categoryOf(product.category).sizeName;
  return <div className="ob-piece-choices">
    <div className="ob-choice" role="group" aria-label={`${product.name} color`}>
      <span className="ob-swatches">{product.colors.map(c => <button key={c.name} type="button" className="ob-swatch" style={{ background: c.hex }} aria-pressed={color === c.name} title={c.name} onClick={() => onColor(c.name)}><span className="sr-only">{c.name}</span></button>)}</span>
    </div>
    {product.sizes.length > 1 && <div className="ob-choice" role="group" aria-label={`${product.name} ${sizeName?.toLowerCase() ?? "size"}`}>
      {sizeName && <span className="ob-size-name">{sizeName}</span>}
      {/* Any size can be chosen; the suggestion is only marked, never picked for the shopper. */}
      <span className="ob-sizes">{product.sizes.map(s => { const suggested = rec?.size === s;
        return <button key={s} type="button" aria-pressed={size === s} data-suggested={suggested ? "" : undefined} onClick={() => onSize(s)}>{s}{suggested && <span className="sr-only"> (suggested)</span>}</button>; })}</span>
    </div>}
    {rec && <FitGuidance rec={rec} chosen={size} />}
  </div>;
}

/** The size suggestion under a piece's size buttons: how sure it is, why, and any notes. */
function FitGuidance({ rec, chosen }: { rec: Recommendation; chosen: string }) {
  if (rec.status === "none") return rec.why ? <p className="ob-fit-plain">{rec.why}</p> : null;
  return <div className="ob-fit" data-status={rec.status}>
    <p className="ob-fit-head"><span className="ob-fit-status">{STATUS_NAMES[rec.status]}</span>{rec.headline && <strong>{rec.headline}</strong>}</p>
    <p className="ob-fit-why">{rec.why}</p>
    {rec.notes.map(n => <p key={n} className="ob-fit-note">{n}</p>)}
    {rec.tip && <p className="ob-fit-tip">{rec.tip}</p>}
    {chosen && rec.size && chosen !== rec.size && <p className="ob-fit-choice">You chose {chosen}; the suggestion was {rec.size}. Your choice stays.</p>}
  </div>;
}

/**
 * One slot's rows: each piece in it with CHANGE and REMOVE, "Nothing selected" with ADD when it's empty,
 * and ADD ANOTHER when a multi slot (a wrist) still has room.
 */
function SlotRows({ slot, label, names, target, detail, onOpen, onRemove }: {
  slot: SlotId; label: string | null; names: string[]; target: Target | null;
  detail?: (index: number) => { inline: ReactNode; below: ReactNode };
  onOpen: (slot: SlotId, index?: number) => void; onRemove: (slot: SlotId, index: number) => void;
}) {
  const { capacity, key } = SLOTS[slot];
  const row = (index: number | null) => {
    const name = index === null ? null : names[index];
    const focused = target?.slot === slot && (index === null ? target.index === undefined : target.index === index);
    const extra = index !== null ? detail?.(index) : undefined;
    return <div key={index ?? "add"} className="ob-slot-block"><div className="ob-slot" data-slot={key} data-empty={name ? undefined : ""} data-focus={focused ? "" : undefined}>
      {label && <span className="ob-slot-label">{index === null || index === 0 ? label : ""}</span>}
      <span className="ob-slot-item">{name ? <strong>{name}</strong> : <span className="ob-slot-none">Nothing selected</span>}{extra?.inline}</span>
      <span className="ob-slot-actions">{index !== null
        ? <><button type="button" className="ob-mini" onClick={() => onOpen(slot, index)}>Change<span className="sr-only"> {name}</span></button><button type="button" className="ob-mini" onClick={() => onRemove(slot, index)}>Remove<span className="sr-only"> {name}</span></button></>
        : <button type="button" className="ob-mini is-add" onClick={() => onOpen(slot)}>Add<span className="sr-only"> {label ?? SLOTS[slot].name}</span></button>}</span>
    </div>{extra?.below}</div>;
  };
  if (!names.length) return row(null);
  return <>{names.map((_, i) => row(i))}{capacity > names.length && capacity > 1 &&
    <div className="ob-another" data-focus={target?.slot === slot && target.index === undefined ? "" : undefined}>
      <button type="button" className="ob-mini is-add" onClick={() => onOpen(slot)}>Add another<span className="sr-only"> to {SLOTS[slot].name}</span></button>
    </div>}</>;
}
