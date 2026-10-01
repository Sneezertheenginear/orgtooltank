import type { ReactNode } from "react";
import type { View } from "./products";
import type { Side } from "./zones";
import { CANVAS } from "./view";

// Shared helpers for the placeholder drawings (garments.tsx, accessories.tsx).

export const INK = "rgba(0, 0, 0, 0.3)", SHADE = "rgba(0, 0, 0, 0.14)";

/**
 * A product's drawing from one angle, in up to three parts: `behind` draws before the body (a backpack
 * seen from the front), `main` in its place in the layer stack, and `arm` over the near arm in side views
 * (sleeves, a watch on that wrist).
 */
export type Parts = { behind?: ReactNode; main?: ReactNode; arm?: ReactNode };

const MIRROR = `translate(${CANVAS.width},0) scale(-1,1)`;
/** Draws the left half; the right half is mirrored across the center line. */
export const mirror = (node: ReactNode) => <>{node}<g data-mirror="" transform={MIRROR}>{node}</g></>;
/** The same drawing on the other side of the center line. */
export const flip = (node: ReactNode) => <g data-mirror="" transform={MIRROR}>{node}</g>;
/**
 * Places a one-sided drawing. Side drawings are made for the side that appears on the viewer's LEFT: the
 * wearer's right from the front, the wearer's left from the back. Side views show only the near side.
 */
export function onSide(node: ReactNode, side: Side | undefined, view: View) {
  if (!side || view === "left" || view === "right") return node;
  const onViewerLeft = view === "front" ? side === "right" : side === "left";
  return onViewerLeft ? node : flip(node);
}

export const paint = (hex: string, children: ReactNode) => <g fill={hex} stroke={INK} strokeWidth={1.2} strokeLinejoin="round">{children}</g>;
/** A thin line in the product's color, for chains, straps, and bands. */
export const line = (hex: string, d: string, width = 2) => <path d={d} fill="none" stroke={hex} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />;
