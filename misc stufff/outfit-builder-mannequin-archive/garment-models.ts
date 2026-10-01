import type { ProductColor, View } from "./products";

export type PrintZone = { x: number; y: number; width: number; height: number };
/** Assets use the reference mannequin's 300 × 640 canvas. Side assets face right;
 * the existing mannequin mirrors the entire left view. Alpha masks accept any shirt color.
 * Split the near sleeve into armMask so it renders above the mannequin's near arm. */
export type GarmentView = { kind: "placeholder" } | { kind: "asset"; mask: string; armMask?: string };
export type Garment = {
  id: string; name: string; provider: string; providerProductId?: string;
  type: "tshirt"; bodyZone: "upper"; layer: "base";
  colors: ProductColor[]; sizes: string[];
  views: Record<View, GarmentView>;
  printZones: Partial<Record<View, PrintZone>>;
};
export const classicTee: Garment = {
  id: "builder-tee-01", name: "Classic Tee", provider: "Printful",
  type: "tshirt", bodyZone: "upper", layer: "base",
  colors: [{ name: "Black", hex: "#1f1f1f" }, { name: "White", hex: "#f3f3ef" }, { name: "Heather gray", hex: "#9b9b96" }, { name: "Maroon", hex: "#500b27" }],
  sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
  views: { front: { kind: "placeholder" }, left: { kind: "placeholder" }, right: { kind: "placeholder" }, back: { kind: "placeholder" } },
  printZones: { front: { x: 115, y: 166, width: 70, height: 86 } },
};
export const garments: Garment[] = [classicTee];
export const garmentOf = (id?: string) => garments.find(g => g.id === id);
