import { mirror } from "./draw";

/** Neutral front illustration on the existing 300 × 640 reference canvas.
 * Keep shoulder, wrist, waist and floor anchors compatible with the garment stack.
 * Return SVG nodes directly so body.ts can warp every point for the existing fit profile. */
export function frontMannequin(tone: { fill: string; edge: string }) {
  return <g fill={tone.fill} stroke={tone.edge} strokeWidth={1.1} strokeLinejoin="round" strokeLinecap="round">
    {/* Relaxed arms: deltoid, upper arm, elbow, forearm and wrist flow into the hand. */}
    {mirror(<>
      <path d="M97,140
        C85,139 77,151 74,170
        C70,190 70,215 70,235
        C69,246 67,253 66,263
        C64,282 65,302 65,319
        L64,343
        C64,350 60,355 60,363
        L61,376 C61,380 64,381 66,378
        L66,363 L66,380 C66,384 70,384 71,380
        L72,364 L72,378 C73,382 77,380 77,377
        L78,361 L80,366 C82,369 85,366 84,363
        C83,356 78,350 79,343
        C80,329 85,308 87,286
        C89,272 86,257 87,245
        C89,224 95,208 99,190
        C102,173 108,151 97,140 Z" />
    </>)}
    {/* Continuous torso, hips and legs avoid the old horizontal joints and blocky pelvis. */}
    <path d="M138,94
      C138,104 138,113 133,119
      C122,122 110,124 101,129
      C92,134 87,142 88,153
      C88,169 94,184 98,202
      C102,222 103,242 108,262
      C112,280 112,298 107,316
      C102,332 101,348 102,363
      C102,386 105,409 109,432
      C112,446 113,456 112,468
      C111,481 108,493 110,510
      C112,534 117,555 117,579
      C117,587 114,594 110,601
      C107,606 106,612 110,616
      C118,618 134,618 142,616
      C146,614 146,609 143,604
      C138,597 136,590 136,581
      C135,559 139,538 141,516
      C143,496 137,480 138,466
      C139,441 145,414 146,391
      C147,379 147,370 150,366
      C153,370 153,379 154,391
      C155,414 161,441 162,466
      C163,480 157,496 159,516
      C161,538 165,559 164,581
      C164,590 162,597 157,604
      C154,609 154,614 158,616
      C166,618 182,618 190,616
      C194,612 193,606 190,601
      C186,594 183,587 183,579
      C183,555 188,534 190,510
      C192,493 189,481 188,468
      C187,456 188,446 191,432
      C195,409 198,386 198,363
      C199,348 198,332 193,316
      C188,298 188,280 192,262
      C197,242 198,222 202,202
      C206,184 212,169 212,153
      C213,142 208,134 199,129
      C190,124 178,122 167,119
      C162,113 162,104 162,94 Z" />
    {/* Only a light collarbone suggestion; clothing naturally covers these lines. */}
    <g fill="none" opacity={0.35}>
      <path d="M115,139 C127,135 137,135 145,141 M155,141 C163,135 173,135 185,139" />
    </g>
    {/* Small ears and a shaped skull, cheeks, jaw and chin; deliberately no face. */}
    {mirror(<path d="M122,61 C114,58 114,65 116,72 C117,78 120,80 124,77 Z" />)}
    <path d="M150,24
      C133,24 122,35 121,49
      C120,60 122,70 125,79
      C128,87 133,94 139,98
      C144,102 156,102 161,98
      C167,94 172,87 175,79
      C178,70 180,60 179,49
      C178,35 167,24 150,24 Z" />
  </g>;
}
