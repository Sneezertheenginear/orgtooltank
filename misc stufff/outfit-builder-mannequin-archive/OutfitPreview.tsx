"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { VIEWS, formatPrice } from "./products";
import { MannequinViewer, ViewerControls } from "./Viewer";

export const PREVIEW_FIGURE_ID = "ob-preview-figure";

/** What the preview calls things in each builder mode ("Your outfit", "LOOK TOTAL", ...). */
export type PreviewWords = { eyebrow: string; title: string; empty: string; total: string; cart: string; edit: string };

/**
 * Preview: the same viewer as the builder (same outfit, mannequin, background, wall art, angle, zoom, and
 * position), larger and without editing outlines, with the controls in a side panel (below it on
 * phones). Closing or editing returns to the builder exactly as it was.
 *
 * Future sharing: a SHARE action belongs in the panel's actions. encodeOutfit() in outfit.ts gives
 * compact text for a shareable link or saved outfit ID, and the figure SVG (id PREVIEW_FIGURE_ID) can
 * be rendered to an image snapshot. Nothing is shared or saved yet.
 */
export default function OutfitPreview({ viewer, names, total, words, controls, onEdit, onClose, onAddToCart, message }: {
  /** Everything the builder's viewer shows, minus editing. */
  viewer: Omit<ComponentProps<typeof MannequinViewer>, "className" | "id" | "zoom" | "interactive" | "selected" | "onSelect" | "labels">;
  names: string[]; total: number; words: PreviewWords;
  controls: Omit<ComponentProps<typeof ViewerControls>, "long">;
  onEdit: () => void; onClose: () => void; onAddToCart: () => void; message: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = dialog.current, root = document.documentElement, overflow = root.style.overflow;
    if (d && !d.open) d.showModal();
    // The page underneath shouldn't scroll while the preview covers it.
    root.style.overflow = "hidden";
    return () => { d?.close(); root.style.overflow = overflow; };
  }, []);
  const angles = controls.angles !== false, viewName = VIEWS.find(v => v.id === viewer.view)!.name;

  return <dialog ref={dialog} className="ob-preview" aria-labelledby="ob-preview-title" onCancel={e => { e.preventDefault(); onClose(); }}>
    <div className="ob-preview-inner">
      <div className="ob-preview-viewer">
        <p className="ob-view-label" aria-live="polite">{angles ? <>Viewing: <strong>{viewName}</strong></> : <strong>{words.eyebrow}</strong>}</p>
        <MannequinViewer className="ob-preview-canvas" id={PREVIEW_FIGURE_ID} {...viewer} zoom={controls.zoom} interactive={false} />
      </div>

      <aside className="ob-preview-panel" aria-label="Preview controls">
        <p className="eyebrow">{words.eyebrow}</p>
        <h2 id="ob-preview-title">{words.title}</h2>
        {names.length ? <ul className="ob-preview-list">{names.map((n, i) => <li key={i}>{n}</li>)}</ul> : <p className="ob-preview-none">{words.empty}</p>}
        <p className="ob-preview-total"><span>{words.total}</span><strong>{formatPrice(total)}</strong></p>

        <div className="ob-preview-group">
          <p className="ob-preview-label">{angles ? "View and zoom" : "Zoom"}</p>
          <ViewerControls {...controls} long />
        </div>

        <div className="ob-preview-actions">
          <button type="button" className="ink-button" onClick={onAddToCart} disabled={!names.length}>{words.cart}</button>
          <button type="button" className="ink-button is-secondary" onClick={onEdit}>{words.edit}</button>
          {/* Start focus on a button, not the scrolling panel (which would get a focus ring around it). */}
          <button type="button" className="text-link ob-preview-close" onClick={onClose} autoFocus>Close Preview</button>
        </div>
        {message && <p className="ob-message" role="status">{message}</p>}
      </aside>
    </div>
  </dialog>;
}
