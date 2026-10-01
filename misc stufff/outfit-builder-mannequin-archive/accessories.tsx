import type { ReactNode } from "react";
import type { CategoryId, View } from "./products";
import { angleOf } from "./layers";
import type { Side } from "./zones";
import { INK, SHADE, line, mirror, onSide, paint, type Parts } from "./draw";

// Placeholder accessory drawings: jewelry, glasses, bags, belts, gloves, shoes, headwear. Same canvas and
// reference body as the clothing (garments.tsx). One-sided pieces are drawn for the side that shows on the
// viewer's left and placed with onSide(). Side views face right and only show the near side.
// Real per-angle PNGs (frontImage, leftImage, rightImage, backImage) replace these per product.

export type AccessoryContext = { hex: string; view: View; side?: Side; index: number; productId: string };
const METAL = "#b9bcc1", FACE = "#ecebe6";

export function accessoryParts(category: CategoryId, ctx: AccessoryContext): Parts | null {
  const { hex, view, side, index, productId } = ctx, angle = angleOf(view), sideView = angle === "side", back = angle === "back";
  const placed = (node: ReactNode) => onSide(node, side, view);
  switch (category) {
    case "headwear": return { main: paint(hex, sideView
      ? <path d="M124,46 C140,37 166,37 180,46 L180,57 C166,48 140,48 124,57 Z" />
      : <path d="M117,46 C130,34 170,34 183,46 L183,57 C170,45 130,45 117,57 Z" />) };

    case "glasses": case "sunglasses": {
      const lens = category === "sunglasses" ? "#26262a" : "rgba(255, 255, 255, 0.28)";
      if (back) return null;
      if (sideView) return { main: <g stroke={hex} strokeWidth={2} fill={lens}><rect x={172} y={62} width={9} height={12} rx={3} />{line(hex, "M172,65 L149,69")}</g> };
      return { main: <g stroke={hex} strokeWidth={2} fill={lens}>
        {mirror(<><rect x={127} y={62} width={19} height={12} rx={4} />{line(hex, "M127,65 L119,67")}</>)}
        {line(hex, "M146,65 C148,63 152,63 154,65")}
      </g> };
    }

    case "earrings": {
      const hoop = productId.includes("hoop"), [x, y] = sideView ? [148, 77] : [117, 77];
      return { main: placed(hoop
        ? <circle cx={x} cy={y + 4} r={4.5} fill="none" stroke={hex} strokeWidth={1.8} />
        : <circle cx={x} cy={y} r={2.6} fill={hex} stroke={INK} strokeWidth={0.6} />) };
    }

    case "chains": case "necklaces": case "pendants": {
      // Each extra chain hangs a little lower, so layered chains show.
      const drop = (category === "necklaces" ? 156 : 168) + index * 12;
      const width = category === "necklaces" ? 4 : 2, dash = category === "necklaces" ? "0 5.5" : undefined;
      const path = sideView ? `M150,121 C156,${drop - 34} 166,${drop - 18} 178,${drop - 20}` : back ? "M137,118 C143,123 157,123 163,118" : `M137,120 C138,${drop - 20} 144,${drop} 150,${drop} C156,${drop} 162,${drop - 20} 163,120`;
      const pendant = category === "pendants" && !back && (sideView ? <rect x={176} y={drop - 22} width={5} height={13} rx={1} /> : <rect x={146.5} y={drop} width={7} height={15} rx={1.5} />);
      return { main: <g>
        <path d={path} fill="none" stroke={hex} strokeWidth={width} strokeLinecap="round" strokeDasharray={dash} />
        {pendant && <g fill={hex} stroke={INK} strokeWidth={0.6}>{pendant}</g>}
      </g> };
    }

    case "backpacks": case "bookbags": {
      const book = category === "bookbags";
      const bag = <path d="M104,152 C104,138 196,138 196,152 L198,298 C198,308 102,308 102,298 Z" />;
      if (back) return { main: paint(hex, <>
        {bag}
        <path d="M138,142 C138,128 162,128 162,142" fill="none" strokeWidth={3} />
        {book ? <><path d="M104,152 C104,138 196,138 196,152 L196,204 L104,204 Z" fill={SHADE} />{mirror(<rect x={124} y={198} width={8} height={16} rx={1} fill={METAL} />)}</>
          : <><rect x={118} y={226} width={64} height={62} rx={8} fill={SHADE} /><path d="M112,176 L188,176" fill="none" /></>}
      </>) };
      if (sideView) return { main: paint(hex, <>
        <path d="M120,148 L94,152 C86,154 84,162 84,170 L86,288 C86,298 92,302 100,302 L121,300 Z" />
        <path d="M124,126 C140,118 164,122 172,140 L176,232 L168,234 L164,146 C158,132 140,130 126,136 Z" />
      </>) };
      // From the front, just the straps; the bag itself is behind the body.
      return { behind: paint(hex, <path d="M96,150 C96,136 204,136 204,150 L206,298 L94,298 Z" />),
        main: paint(hex, mirror(<path d="M113,124 L124,125 C118,150 118,192 120,242 L110,244 C107,192 107,150 113,124 Z" />)) };
    }

    case "slingbags": {
      if (sideView) return { main: paint(hex, <><path d="M150,124 L158,122 L186,298 L178,300 Z" /><rect x={176} y={280} width={20} height={38} rx={6} /></>) };
      return { main: placed(paint(hex, <>
        <path d="M100,132 L110,127 L202,294 L192,300 Z" />
        {!back && <><rect x={170} y={280} width={46} height={40} rx={9} /><path d="M176,292 L210,292" fill="none" /></>}
      </>)) };
    }
    case "shoulderbags": {
      const bag = <><rect x={128} y={250} width={44} height={70} rx={4} /><path d="M146,126 L154,126 L156,252 L148,252 Z" /></>;
      if (sideView) return { arm: paint(hex, bag) };
      return { main: placed(paint(hex, <><path d="M98,130 L107,132 L68,258 L59,256 Z" /><rect x={30} y={254} width={44} height={72} rx={4} /></>)) };
    }

    case "watches": {
      const w = sideView ? <><rect x={138} y={340} width={22} height={9} rx={2} fill={hex} /><rect x={143} y={337} width={12} height={15} rx={3} fill={FACE} stroke={hex} strokeWidth={1.6} /></>
        : <><rect x={62} y={340} width={21} height={9} rx={2} fill={hex} /><rect x={66.5} y={337} width={12} height={15} rx={3} fill={FACE} stroke={hex} strokeWidth={1.6} /></>;
      return sideView ? { arm: <g stroke={INK} strokeWidth={0.6}>{w}</g> } : { main: placed(<g stroke={INK} strokeWidth={0.6}>{w}</g>) };
    }
    case "bracelets": case "wristbands": {
      const y = [345, 351, 334][index] ?? 345, x = sideView ? 137 : 61;
      const band = category === "wristbands" ? <rect x={x} y={y - 8} width={24} height={13} rx={3} fill={hex} stroke={INK} strokeWidth={0.6} />
        : productId.includes("link") ? line(hex, `M${x + 1},${y + 1.5} L${x + 22},${y + 1.5}`, 3.5)
        : <rect x={x + 1} y={y} width={22} height={3.5} rx={1.5} fill={hex} stroke={INK} strokeWidth={0.5} />;
      return sideView ? { arm: band } : { main: placed(band) };
    }
    case "rings": {
      const y = 368 + index * 5, band = <rect x={sideView ? 141 : 64} y={y} width={16} height={3} rx={1.5} fill={hex} stroke={INK} strokeWidth={0.5} />;
      return sideView ? { arm: band } : { main: placed(band) };
    }
    case "gloves": return sideView
      ? { arm: paint(hex, <><rect x={137} y={336} width={24} height={14} rx={3} /><ellipse cx={149} cy={364} rx={11} ry={18} /></>) }
      : { main: paint(hex, mirror(<><rect x={60} y={336} width={24} height={14} rx={3} /><ellipse cx={72} cy={364} rx={12} ry={19} /></>)) };

    case "belts": return { main: <g stroke={INK} strokeWidth={0.8}>
      <rect x={sideView ? 118 : 101} y={319} width={sideView ? 66 : 98} height={9} fill={hex} />
      {!back && <rect x={sideView ? 176 : 143} y={316.5} width={sideView ? 7 : 14} height={14} rx={2} fill={METAL} />}
    </g> };
    case "waistbags": case "beltbags": {
      const small = category === "beltbags";
      if (back) return { main: paint(hex, <rect x={100} y={322} width={100} height={4} />) };
      if (sideView) return { main: paint(hex, <><rect x={118} y={322} width={66} height={4} /><rect x={180} y={small ? 316 : 312} width={18} height={small ? 26 : 34} rx={7} /></>) };
      return { main: paint(hex, <>
        <rect x={100} y={322} width={100} height={4} />
        <rect x={small ? 130 : 122} y={small ? 316 : 312} width={small ? 40 : 56} height={small ? 26 : 34} rx={9} />
        <path d={small ? "M134,324 L166,324" : "M128,322 L172,322"} fill="none" />
      </>) };
    }

    case "anklets": {
      const y = 576 - index * 5;
      return { main: placed(sideView ? line(hex, `M133,${y} C142,${y + 4} 154,${y + 4} 162,${y}`, 1.8) : line(hex, `M112,${y} C120,${y + 4} 134,${y + 4} 142,${y}`, 1.8)) };
    }

    case "shoes": case "boots": case "slides": {
      const sole = (x: number, w: number) => <rect x={x} y={617} width={w} height={5} rx={2} fill={category === "shoes" ? "#f3f3ef" : "#2a2a2a"} />;
      if (sideView) return { main: paint(hex, category === "slides"
        ? <><path d="M140,596 L176,598 L178,608 L138,608 Z" />{sole(128, 64)}</>
        : <><path d={category === "boots" ? "M130,548 L162,548 L163,592 L176,598 C188,601 192,612 190,620 L128,620 C126,600 128,570 130,548 Z" : "M130,588 L160,588 L174,598 C188,601 192,612 190,620 L128,620 C126,610 127,598 130,588 Z"} />
          {category === "shoes" && <path d="M150,592 L166,598" fill="none" />}{sole(127, 66)}</>) };
      return { main: paint(hex, mirror(category === "slides"
        ? <><path d="M108,596 L146,596 L147,608 L107,608 Z" />{sole(105, 46)}</>
        : <><path d={category === "boots" ? "M108,548 L145,548 L146,590 C151,600 152,612 148,620 L108,620 C102,612 102,600 108,588 Z" : "M107,588 C102,600 102,612 108,620 L148,620 C152,612 151,600 145,588 Z"} />
          {category === "shoes" && !back && <path d="M119,594 L135,594 M119,600 L135,600" fill="none" />}{sole(104, 47)}</>)) };
    }
    default: return null;
  }
}
