import type { ReactNode } from "react";
import type { View } from "./products";
import { CANVAS } from "./view";
import { imageTransform, warpSvg, type Warp } from "./body";
import { angleOf } from "./layers";
import { mirror } from "./draw";
import { frontMannequin } from "./FrontMannequin";
import { personFor, type PersonSet } from "./person";

// The base person under the clothing, in two parts: the body (drawn under every garment) and, in side
// views, the near arm (drawn over the torso clothing, under sleeves and what's worn on the wrist). Each
// angle uses a realistic photo when there is one (see person.ts) and the drawn mannequin otherwise.
//
// A photo can't be reshaped point by point like the drawing, so it's scaled as a whole: its height with
// the shopper's height, its width with their build and weight at the chest. The clothing still follows
// the drawn body's shape, so on builds far from the reference the photo is an approximation until photos
// made for each build exist.

export type Skin = { fill: string; edge: string };
const skinGroup = (tone: Skin, children: ReactNode) => <g fill={tone.fill} stroke={tone.edge} strokeWidth={1.2} strokeLinejoin="round">{children}</g>;

/** Original back silhouette, retained until the back illustration is upgraded. */
function bodyBack(tone: Skin) {
  return skinGroup(tone, <>
    {mirror(<>
      <path d="M90,142 C76,154 72,184 70,226 C68,268 66,306 64,346 L80,348 C84,308 88,270 92,232 C94,206 98,182 104,164 Z" />
      <ellipse cx={72} cy={362} rx={10} ry={17} />
      <path d="M104,352 C102,420 105,480 110,540 L113,590 L141,590 L143,540 C145,480 147,420 148,356 Z" />
      <path d="M110,586 C104,600 104,612 112,618 L146,618 C150,612 148,598 142,586 Z" />
    </>)}
    <path d="M109,316 C104,330 102,344 103,358 L197,358 C198,344 196,330 191,316 Z" />
    <path d="M150,118 C122,118 96,124 88,144 C84,166 94,212 101,250 C105,272 111,292 109,318 L191,318 C189,292 195,272 199,250 C206,212 216,166 212,144 C204,124 178,118 150,118 Z" />
    <path d="M138,96 L138,126 L162,126 L162,96 Z" />
    {mirror(<ellipse cx={118} cy={66} rx={5} ry={10} />)}
    <ellipse cx={150} cy={64} rx={32} ry={40} />
  </>);
}
/** Side profile, facing right. The near arm is drawn separately, above the torso clothing. */
function bodySide(tone: Skin) {
  return skinGroup(tone, <>
    <path d="M126,356 C124,420 128,480 132,540 L134,590 L160,590 L162,540 C166,480 172,420 176,356 Z" />
    <path d="M132,586 C130,600 130,612 134,618 L186,618 C190,612 186,602 176,598 L160,586 Z" />
    <path d="M124,316 L178,316 C182,332 182,346 180,360 L122,360 C120,346 120,332 124,316 Z" />
    <path d="M126,122 C116,140 114,180 118,230 C122,270 124,300 124,320 L178,320 C180,300 184,270 186,236 C190,196 188,150 176,124 C166,118 136,118 126,122 Z" />
    <path d="M140,96 L140,126 L164,126 L164,96 Z" />
    <ellipse cx={152} cy={64} rx={29} ry={40} />
    <ellipse cx={148} cy={66} rx={6} ry={10} />
  </>);
}
const sideArm = (tone: Skin) => skinGroup(tone, <>
  <path d="M140,138 C132,160 132,200 134,240 C136,280 138,310 140,346 L158,346 C158,310 158,280 158,240 C158,200 160,160 164,140 Z" />
  <ellipse cx={149} cy={362} rx={9} ry={16} />
</>);

/** The level a photo's width is matched to the body at: the chest, where the clothing fits closest. */
const PHOTO_LEVEL = 205;
const UNMIRROR = `translate(${CANVAS.width},0) scale(-1,1)`;

/** Which person an angle shows, and whether its photo needs turning back (see `photo`). */
export function personOf(photos: PersonSet | undefined, view: View) {
  const photo = personFor(photos, view);
  // The viewer mirrors the whole left-side figure. A left photo of its own already faces left, so it's
  // mirrored first to come out as it was taken; the right photo standing in for it just gets mirrored.
  return photo ? { photo, unmirror: view === "left" && photos?.left === photo } : null;
}

function photo(src: string, warp: Warp, side: boolean, unmirror: boolean, className: string) {
  return <image className={className} href={src} x={0} y={0} width={CANVAS.width} height={CANVAS.height} preserveAspectRatio="xMidYMid meet"
    transform={`${imageTransform(warp, PHOTO_LEVEL, side)}${unmirror ? ` ${UNMIRROR}` : ""}`} />;
}

/** The body layer for an angle, under all the clothing. */
export function personBody(view: View, warp: Warp, skin: Skin, photos?: PersonSet) {
  const side = angleOf(view) === "side", person = personOf(photos, view);
  if (person) return <g data-layer="body" data-person="photo">{photo(person.photo.base, warp, side, person.unmirror, "ob-person")}</g>;
  return <g data-layer="body" data-person="drawn">{warpSvg(side ? bodySide(skin) : view === "front" ? frontMannequin(skin) : bodyBack(skin), warp)}</g>;
}

/**
 * The body parts drawn over the torso clothing: the drawn near arm in side views, or a photo's
 * foreground cut-out. Null when the angle has neither.
 */
export function personForeground(view: View, warp: Warp, skin: Skin, photos?: PersonSet): ReactNode {
  const side = angleOf(view) === "side", person = personOf(photos, view);
  if (person) return person.photo.foreground ? <g data-layer="arm" data-person="photo">{photo(person.photo.foreground, warp, side, person.unmirror, "ob-person")}</g> : null;
  return side ? <g data-layer="arm" data-person="drawn">{warpSvg(sideArm(skin), warp)}</g> : null;
}
