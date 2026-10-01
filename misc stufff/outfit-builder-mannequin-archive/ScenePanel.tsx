"use client";

import { useState } from "react";
import { SCENE_CATEGORIES, formatPrice, sceneCategoryOf, sceneProducts, type SceneCategoryId, type SceneProduct } from "./products";
import { UNITS_PER_INCH, priceOf, stepSize, type PlacedItem, type SceneItem } from "./scene";
import { SceneThumb } from "./Room";

// Wall art in the builder's side column: the product list (tap to hang it), and the rows for pieces
// already on the wall, with Change, Remove, finish, size, and move buttons that do the same as dragging.

/** The wall art list. With `changing` set, a tap swaps that piece instead of adding a new one. */
export function ScenePicker({ step, changing, onPick, onCancel }: {
  step: number; changing: PlacedItem | null; onPick: (product: SceneProduct) => void; onCancel: () => void;
}) {
  const [filter, setFilter] = useState<"all" | SceneCategoryId>("all");
  const shown = sceneProducts.filter(p => filter === "all" || p.category === filter);
  return <section className="ob-panel ob-scene-picker" aria-labelledby="ob-scene-heading">
    <h2 id="ob-scene-heading" className="ob-step"><span>{step}</span> Wall art</h2>
    {changing && <p className="ob-sub">Choosing a replacement for {changing.product.name}. <button type="button" className="text-link" onClick={onCancel}>Cancel</button></p>}
    <div className="ob-filters" role="group" aria-label="Wall art type">
      <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All</button>
      {SCENE_CATEGORIES.map(c => <button key={c.id} type="button" aria-pressed={filter === c.id} disabled={!c.available} onClick={() => setFilter(c.id)}>{c.name}{!c.available && " (later)"}</button>)}
    </div>
    <ul className="ob-products">{shown.map(p => <li key={p.id} className="ob-product">
      <button type="button" className="ob-product-main" onClick={() => onPick(p)} aria-label={`${changing ? "Swap in" : "Add"} ${p.name}, from ${formatPrice(p.price)}`}>
        <SceneThumb product={p} color={p.colors[0].name} />
        <span className="ob-product-name">{p.name}</span>
        <span className="ob-product-meta">{sceneCategoryOf(p.category).name} · from {formatPrice(p.price)}</span>
        <span className="ob-product-cta">{changing ? "Swap in" : "Add to wall"}</span>
      </button>
    </li>)}</ul>
  </section>;
}

const MOVE = UNITS_PER_INCH * 3;

/** Pieces on the wall, for the summary: each with its details, Change and Remove, and its choices below. */
export function SceneRows({ placed, selectedKey, changingKey, onSelect, onChange, onRemove, onUpdate }: {
  placed: PlacedItem[]; selectedKey: string | null; changingKey: string | null;
  onSelect: (key: string) => void; onChange: (key: string) => void; onRemove: (key: string) => void;
  onUpdate: (key: string, product: SceneProduct, change: Partial<Pick<SceneItem, "x" | "y" | "color" | "size">>) => void;
}) {
  return <>{placed.map(({ item, product }) => {
    const hex = product.colors.find(c => c.name === item.color)?.hex, update = (change: Parameters<typeof onUpdate>[2]) => { onSelect(item.key); onUpdate(item.key, product, change); };
    return <div key={item.key} className="ob-slot-block" data-art-row={item.key}>
      <div className="ob-slot" data-focus={item.key === changingKey || item.key === selectedKey ? "" : undefined}>
        <span className="ob-slot-item">
          <strong><button type="button" className="ob-art-name" onClick={() => onSelect(item.key)} aria-pressed={item.key === selectedKey}>{product.name}</button></strong>
          <span className="ob-piece-detail"><span className="ob-piece-dot" style={{ background: hex }} aria-hidden="true" />{item.color} • {item.size}<span className="ob-piece-price">{formatPrice(priceOf(product, item.size))}</span></span>
        </span>
        <span className="ob-slot-actions">
          <button type="button" className="ob-mini" onClick={() => onChange(item.key)}>Change<span className="sr-only"> {product.name}</span></button>
          <button type="button" className="ob-mini" onClick={() => onRemove(item.key)}>Remove<span className="sr-only"> {product.name}</span></button>
        </span>
      </div>
      <div className="ob-piece-choices">
        {product.colors.length > 1 && <div className="ob-choice" role="group" aria-label={`${product.name} finish`}>
          <span className="ob-swatches">{product.colors.map(c => <button key={c.name} type="button" className="ob-swatch" style={{ background: c.hex }} aria-pressed={item.color === c.name} title={c.name} onClick={() => update({ color: c.name })}><span className="sr-only">{c.name}</span></button>)}</span>
        </div>}
        <div className="ob-choice" role="group" aria-label={`${product.name} size`}>
          <span className="ob-sizes">{product.sceneSizes.map(s => <button key={s.size} type="button" aria-pressed={item.size === s.size} onClick={() => update({ size: s.size })}>{s.size.replace(" in", "")}</button>)}</span>
          <span className="ob-art-resize">
            <button type="button" className="ob-mini" disabled={product.sizes[0] === item.size} onClick={() => update({ size: stepSize(product, item.size, -1) })}>Smaller</button>
            <button type="button" className="ob-mini" disabled={product.sizes.at(-1) === item.size} onClick={() => update({ size: stepSize(product, item.size, 1) })}>Larger</button>
          </span>
        </div>
        <div className="ob-choice ob-move" role="group" aria-label={`Move ${product.name}`}>
          <span className="ob-move-label">Move <span className="ob-move-hint">or drag it</span></span>
          <button type="button" className="ob-zoom-btn" aria-label="Move left" onClick={() => update({ x: item.x - MOVE })}>←</button>
          <button type="button" className="ob-zoom-btn" aria-label="Move up" onClick={() => update({ y: item.y - MOVE })}>↑</button>
          <button type="button" className="ob-zoom-btn" aria-label="Move down" onClick={() => update({ y: item.y + MOVE })}>↓</button>
          <button type="button" className="ob-zoom-btn" aria-label="Move right" onClick={() => update({ x: item.x + MOVE })}>→</button>
        </div>
      </div>
    </div>;
  })}</>;
}
