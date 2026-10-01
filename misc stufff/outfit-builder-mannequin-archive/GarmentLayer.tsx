import { garmentOf } from "./garment-models";
import { designOf } from "./designs";
import { garmentParts } from "./garments";
import { angleOf } from "./layers";
import { paint, type Parts } from "./draw";
import { isDark } from "./env";
import type { View } from "./products";

/** Pure SVG nodes so the existing body/placement warp also moves garment and print together. */
export function builderGarmentParts(garmentId: string, view: View, hex: string, skin: string, designId?: string, printZone: View = "front"): Parts | null {
  const garment = garmentOf(garmentId);
  if (!garment) return null;
  const asset = garment.views[view];
  const maskPart = (src: string, part: string) => {
    const id = `tee-${garment.id}-${view}-${part}-${hex.replace("#", "")}`;
    return <g><defs><mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={300} height={640} style={{ maskType: "alpha" }}><image href={src} x={0} y={0} width={300} height={640} /></mask></defs><rect x={0} y={0} width={300} height={640} fill={hex} mask={`url(#${id})`} /></g>;
  };
  const placeholder = garmentParts("tshirts", angleOf(view), skin)!;
  const parts: Parts = asset.kind === "placeholder"
    ? { main: paint(hex, placeholder.main), arm: placeholder.arm && paint(hex, placeholder.arm) }
    : { main: maskPart(asset.mask, "main"), arm: asset.armMask && maskPart(asset.armMask, "arm") };
  const design = designOf(designId), zone = garment.printZones[view];
  if (design && zone && printZone === view && design.supportedZones.includes(view)) {
    parts.main = <>{parts.main}<image data-design={design.id} href={isDark(hex) ? design.whiteArtwork : design.blackArtwork} {...zone} preserveAspectRatio="xMidYMid meet" /></>;
  }
  return parts;
}
