import type { CategoryId } from "./products";
import type { Angle } from "./layers";
import { INK, SHADE, mirror, type Parts } from "./draw";

// Placeholder clothing drawings, one per category and angle, on the 300 × 640 canvas for the reference
// body (body.ts reshapes them). Side views face right. Real transparent PNGs replace these per product.

// Front/back shapes. Each upper-body layer is a little larger than the one under it so layers read as layers.
const baseBody = <path d="M150,120 C120,120 94,126 86,146 C82,168 92,214 99,250 C103,272 108,294 106,322 L194,322 C192,294 197,272 201,250 C208,214 218,168 214,146 C206,126 180,120 150,120 Z" />;
// Tee-only torso: retain the shoulders, then fall almost straight to a wider, slightly lower hem.
const teeBody = <path d="M150,120 C120,120 94,126 86,146 C82,168 92,214 94,250 C95,276 96,304 96,328 L204,328 C204,304 205,276 206,250 C208,214 218,168 214,146 C206,126 180,120 150,120 Z" />;
const shortSleeves = mirror(<path d="M90,142 C76,152 70,172 68,200 L94,208 C96,190 100,176 106,166 Z" />);
/** Front-only relaxed tee: one continuous garment outline, with an open crew neck.
 * The neckline reveals the existing mannequin; seams stay clear of the print zone. */
const teeFront = <>
  <path d="M132,120
    C117,121 101,127 89,138
    C77,151 69,176 63,201
    C71,206 82,210 91,211
    L96,197
    C93,222 94,248 97,274
    C99,297 98,317 98,338
    C115,342 135,344 150,343
    C169,344 187,342 202,338
    C202,317 201,297 203,274
    C206,248 207,222 204,197
    L209,211
    C218,210 229,206 237,201
    C231,176 223,151 211,138
    C199,127 183,121 168,120
    C167,130 161,136 150,136
    C139,136 133,130 132,120 Z" />
  {/* Ribbed collar, dropped shoulder seams, sleeve cuffs and a softly turned hem. */}
  <path d="M128,122 C130,145 170,145 172,122" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={2.4} />
  <g fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth={1}>
    {mirror(<>
      <path d="M91,138 C92,155 97,178 96,197" />
      <path d="M65,194 C73,199 83,203 93,204" />
      <path d="M97,211 C102,218 103,224 103,233" opacity={0.55} />
    </>)}
    <path d="M99,332 C117,337 137,339 150,338 C169,339 185,337 201,332" />
  </g>
</>;
const baseLongSleeves = mirror(<path d="M90,142 C76,154 71,184 69,226 C67,268 65,306 63,344 L81,347 C85,308 89,270 93,232 C95,206 99,182 105,164 Z" />);
const midBody = <path d="M150,116 C120,116 92,122 84,144 C80,168 90,214 97,252 C101,276 106,300 104,334 L196,334 C194,300 199,276 203,252 C210,214 220,168 216,144 C208,122 180,116 150,116 Z" />;
const midSleeves = mirror(<path d="M88,140 C74,152 69,182 67,226 C65,268 63,306 61,344 L83,348 C86,308 90,270 94,232 C96,206 100,182 106,164 Z" />);
const outerSleeves = mirror(<path d="M86,138 C71,150 66,182 64,226 C62,268 60,306 58,346 L84,351 C87,308 91,270 95,232 C97,206 101,182 107,164 Z" />);
/** Open-front outer layer (front view): two panels with a gap down the middle, so the layers underneath show. */
const openFront = (bottom: number) => mirror(<path d={`M143,124 C124,114 94,118 82,142 C76,168 87,214 93,254 C97,286 99,${bottom - 40} ${bottom > 360 ? 96 : 100},${bottom} L143,${bottom} Z`} />);
/** Closed back of an outer layer. */
const closedBack = (bottom: number) => <path d={`M150,112 C118,112 88,118 80,142 C76,168 86,214 93,254 C97,286 99,${bottom - 40} ${bottom > 360 ? 96 : 100},${bottom} L${bottom > 360 ? 204 : 200},${bottom} C201,${bottom - 40} 203,286 207,254 C214,214 224,168 220,142 C212,118 182,112 150,112 Z`} />;
const backCollar = <path d="M136,121 C142,126 158,126 164,121" fill="none" />;
const legsPath = mirror(<path d="M151,312 L100,312 C98,332 99,348 100,358 C99,420 102,480 107,540 L110,586 L146,586 L147,540 C149,480 150,420 151,368 Z" />);
const shortsPath = mirror(<path d="M151,312 L100,312 C98,332 99,348 100,358 L103,452 L149,452 L151,372 Z" />);
const waist = <path d="M100,326 L200,326" fill="none" />;
const backPockets = mirror(<path d="M116,338 L138,338 L137,356 L117,356 Z" fill="none" />);

// Side shapes (facing right; the back of the body is on the left).
const sideTorso = (grow: number, bottom: number) => {
  const g = grow;
  return <path d={`M${124 - g},${120 - g} C${113 - g},${140 - g} ${111 - g},180 ${115 - g},230 C${119 - g},270 ${121 - g},298 ${bottom > 360 ? 110 : 121 - g},${bottom} L${bottom > 360 ? 192 : 181 + g},${bottom} C${183 + g},298 ${187 + g},270 ${189 + g},236 C${193 + g},196 ${191 + g},150 ${179 + g},${122 - g} C${168 + g},${115 - g} ${134 - g},${115 - g} ${124 - g},${120 - g} Z`} />;
};
const teeSideTorso = <path d="M124,120 C113,140 111,180 115,230 C115,270 115,300 115,328 L189,328 C189,300 189,270 189,236 C193,196 191,150 179,122 C168,115 134,115 124,120 Z" />;
const sideSleeve = (grow: number, long: boolean) => long
  ? <path d={`M${138 - grow},${134 - grow} C${130 - grow},158 ${130 - grow},200 ${132 - grow},240 C${134 - grow},280 ${136 - grow},310 ${138 - grow},${346 + grow} L${160 + grow},${346 + grow} C${160 + grow},310 ${160 + grow},280 ${160 + grow},240 C${160 + grow},200 ${162 + grow},158 ${166 + grow},${136 - grow} Z`} />
  : <path d="M137,134 C130,152 129,172 130,194 L162,196 C162,174 163,154 167,136 Z" />;
const sideNeck = (skin: string) => <ellipse cx={152} cy={119} rx={12} ry={4} fill={skin} stroke={INK} />;
const sideLeg = <path d="M120,312 L182,312 C184,332 184,348 182,362 C176,420 170,480 166,540 L164,588 L130,588 L128,540 C124,480 120,420 120,362 C118,348 118,332 120,312 Z" />;
const sideShorts = <path d="M120,312 L182,312 C184,332 184,348 182,362 L176,452 L124,452 L120,362 C118,348 118,332 120,312 Z" />;
const sideWaist = <path d="M119,326 L183,326" fill="none" />;


/** The placeholder drawing for one piece, from one angle. In side view, sleeves go in `arm` (drawn above the arm). */
export function garmentParts(category: CategoryId, angle: Angle, skin: string): Parts | null {
  const side = angle === "side", back = angle === "back";
  switch (category) {
    // Base layer
    case "tshirts": return side ? { main: <>{teeSideTorso}{sideNeck(skin)}</>, arm: sideSleeve(0, false) }
      : { main: back ? <>{shortSleeves}{teeBody}{backCollar}</> : teeFront };
    case "longsleeves": return side ? { main: <>{sideTorso(0, 324)}{sideNeck(skin)}<rect x={121} y={316} width={60} height={8} fill={SHADE} stroke="none" /></>, arm: sideSleeve(0, true) }
      : { main: <>{baseLongSleeves}{baseBody}{back ? backCollar : <ellipse cx={150} cy={123} rx={14} ry={7} fill={skin} stroke={INK} />}<rect x={106} y={314} width={88} height={8} fill={SHADE} stroke="none" /></> };
    // Mid layer
    case "hoodies": return side ? { main: <>
        {sideTorso(3, 336)}
        <path d="M140,106 C130,94 114,98 112,114 C110,132 116,150 124,160 L132,124 Z" />
        <path d="M178,126 L180,160" fill="none" />
        <rect x={117} y={326} width={68} height={10} fill={SHADE} stroke="none" />
      </>, arm: sideSleeve(2, true) }
      : back ? { main: <>
        {midSleeves}{midBody}
        <path d="M122,118 C122,104 178,104 178,118 C176,152 166,172 150,174 C134,172 124,152 122,118 Z" />
        <path d="M150,112 L150,172" fill="none" />
        <rect x={104} y={324} width={92} height={10} fill={SHADE} stroke="none" />
      </> }
      : { main: <>
        {midSleeves}{midBody}
        <path d="M124,130 C124,112 136,104 150,104 C164,104 176,112 176,130 L166,132 C162,122 138,122 134,132 Z" />
        <path d="M122,262 L178,262 L186,302 L114,302 Z" fill="none" />
        <path d="M144,130 L143,164 M156,130 L157,164" fill="none" />
        <rect x={104} y={324} width={92} height={10} fill={SHADE} stroke="none" />
      </> };
    case "sweatshirts": return side ? { main: <>{sideTorso(3, 336)}{sideNeck(skin)}<rect x={117} y={326} width={68} height={10} fill={SHADE} stroke="none" /></>, arm: sideSleeve(2, true) }
      : { main: <>
        {midSleeves}{midBody}
        {back ? backCollar : <><ellipse cx={150} cy={122} rx={15} ry={8} fill={skin} stroke={INK} /><path d="M135,122 C140,132 160,132 165,122" fill="none" /></>}
        <rect x={104} y={324} width={92} height={10} fill={SHADE} stroke="none" />
      </> };
    // Outer layer
    case "jackets": return side ? { main: <>
        {sideTorso(6, 344)}
        <path d="M168,112 L186,120 L178,138 Z" fill={SHADE} />
        <path d="M186,130 L184,342" fill="none" />
      </>, arm: sideSleeve(4, true) }
      : back ? { main: <>{outerSleeves}{closedBack(340)}<path d="M86,160 C120,168 180,168 214,160" fill="none" /><path d="M128,114 C140,120 160,120 172,114" fill="none" /></> }
      : { main: <>
        {outerSleeves}{openFront(340)}
        {mirror(<path d="M143,124 L128,118 L143,168 Z" fill={SHADE} />)}
        <circle cx={138} cy={200} r={2.5} fill={INK} stroke="none" /><circle cx={138} cy={250} r={2.5} fill={INK} stroke="none" /><circle cx={138} cy={300} r={2.5} fill={INK} stroke="none" />
      </> };
    case "coats": return side ? { main: <>
        {sideTorso(6, 432)}
        <path d="M166,112 L188,120 L180,150 Z" fill={SHADE} />
        <path d="M186,130 L188,430" fill="none" /><path d="M158,300 L182,300" fill="none" />
      </>, arm: sideSleeve(4, true) }
      : back ? { main: <>{outerSleeves}{closedBack(430)}<path d="M118,300 L182,300" fill="none" /><path d="M150,340 L150,430" fill="none" /><path d="M128,114 C140,120 160,120 172,114" fill="none" /></> }
      : { main: <>
        {outerSleeves}{openFront(430)}
        {mirror(<><path d="M143,124 L124,116 L118,150 L143,190 Z" fill={SHADE} /><path d="M104,292 L128,292" fill="none" /></>)}
        <circle cx={162} cy={220} r={3} fill={INK} stroke="none" /><circle cx={162} cy={280} r={3} fill={INK} stroke="none" /><circle cx={162} cy={340} r={3} fill={INK} stroke="none" />
      </> };
    // Neck layer: a wrap around the neck; the tail hangs down the front, so the back shows only the wrap.
    case "scarves": return side ? { main: <>
        <path d="M176,122 L188,122 L190,214 L176,214 Z" />
        <path d="M179,214 L179,224 M185,214 L185,224" fill="none" />
        <ellipse cx={152} cy={120} rx={25} ry={10} />
      </> }
      : { main: <>
        {!back && <><path d="M152,126 L168,126 L172,226 L154,226 Z" /><path d="M156,226 L156,236 M162,226 L162,236 M168,226 L168,236" fill="none" /></>}
        <path d="M118,118 C118,104 182,104 182,118 C182,136 118,136 118,118 Z" />
        <path d="M126,120 C140,128 160,128 174,120" fill="none" />
      </> };
    // Lower body
    case "pants": case "joggers": return side ? { main: <>
        {sideLeg}{sideWaist}
        {category === "joggers" && <path d="M128,572 L165,572 L164,588 L130,588 Z" fill={SHADE} />}
      </> }
      : { main: <>
        {legsPath}{waist}{back && backPockets}
        {category === "joggers" && mirror(<path d="M110,570 L146,570 L146,586 L110,586 Z" fill={SHADE} />)}
      </> };
    case "shorts": return side ? { main: <>{sideShorts}{sideWaist}</> } : { main: <>{shortsPath}{waist}{back && backPockets}</> };
    case "socks": return side ? { main: <>
        <path d="M130,552 L162,552 L162,588 L178,598 C188,602 190,612 186,618 L132,618 C128,610 128,600 130,590 Z" />
        <path d="M130,560 L162,560" fill="none" />
      </> }
      : { main: mirror(<>
        <path d="M111,552 L142,552 L142,590 C147,598 148,610 146,618 L112,618 C104,612 104,600 110,588 Z" />
        <path d="M111,560 L142,560" fill="none" />
      </>) };
    case "hats": return side ? { main: <>
        <path d="M122,54 C122,28 136,20 152,20 C168,20 180,30 180,54 Z" />
        <path d="M176,50 L214,56 C214,63 198,65 176,60 Z" />
        <path d="M176,50 L214,56 C214,63 198,65 176,60 Z" fill={SHADE} />
      </> }
      : back ? { main: <>
        <path d="M116,54 C116,28 132,18 150,18 C168,18 184,28 184,54 Z" />
        <path d="M138,54 C140,44 160,44 162,54 Z" fill={skin} />
        <circle cx={150} cy={20} r={3} />
      </> }
      : { main: <>
        <path d="M116,54 C116,28 132,18 150,18 C168,18 184,28 184,54 Z" />
        <path d="M112,54 C130,62 170,62 188,54 C190,61 178,71 150,71 C122,71 110,61 112,54 Z" />
        <path d="M112,54 C130,62 170,62 188,54 C190,61 178,71 150,71 C122,71 110,61 112,54 Z" fill={SHADE} />
        <circle cx={150} cy={20} r={3} />
      </> };
    case "beanies": return side ? { main: <>
        <path d="M122,60 C120,30 136,18 152,18 C168,18 182,30 180,60 Z" />
        <path d="M120,48 L182,48 L182,64 L120,64 Z" />
        <path d="M120,48 L182,48 L182,64 L120,64 Z" fill={SHADE} />
      </> }
      : { main: <>
        <path d="M116,60 C114,30 132,18 150,18 C168,18 186,30 184,60 Z" />
        <path d="M114,48 L186,48 L186,64 L114,64 Z" />
        <path d="M114,48 L186,48 L186,64 L114,64 Z" fill={SHADE} />
      </> };
    default: return null;
  }
}

