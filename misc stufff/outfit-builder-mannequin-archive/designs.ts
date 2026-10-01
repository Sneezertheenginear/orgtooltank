import type { Product, View } from "./products";
export type Design = { id: string; title: string; blackArtwork: string; whiteArtwork: string; supportedZones: View[] };
export const designs: Design[] = [{
  id: "pain-got-frequency", title: "PAIN GOT FREQUENCY",
  blackArtwork: "/outfit-builder/pain-frequency-black.svg",
  whiteArtwork: "/outfit-builder/pain-frequency-white.svg", supportedZones: ["front"],
}, {
  id: "i-renamed-the-pain", title: "I RENAMED THE PAIN",
  blackArtwork: "/outfit-builder/i-renamed-the-pain-black.svg",
  whiteArtwork: "/outfit-builder/i-renamed-the-pain-white.svg", supportedZones: ["front"],
}];
export const designOf = (id?: string) => designs.find(d => d.id === id);

export const designsForProduct = (product: Pick<Product, "designIds">) => designs.filter(d => product.designIds?.includes(d.id));
