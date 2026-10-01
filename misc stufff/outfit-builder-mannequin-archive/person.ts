import type { View } from "./products";

// The base person under the clothing. Each angle can use a realistic photo of a person (a transparent
// PNG or WebP cut-out); an angle without one keeps the drawn mannequin, so the builder works before any
// photos exist and each angle can be added on its own. Clothing, designs, fit, tap zones, and the
// background don't change either way: the photo only replaces the body layer.
//
// Photos go in public/outfit-builder/person/ and are found when the page is built (see person.server.ts):
//   front.png   left.png   right.png   back.png            (or .webp; WebP wins when both exist)
//   front-foreground.png ...                              optional, see PersonView.foreground
//
// Every photo is laid out on the same 300 × 640 reference canvas as the drawn mannequin and the garment
// art (any size with that 15:32 shape, e.g. 900 × 1920, works). Lined up to the reference mannequin:
//   - centered at x 150 (side views: the body's center near x 152, facing right)
//   - top of the head at y 24, soles of the feet on y 618 (the floor); 5 ft 10 in
//   - shoulders about y 122–140, reaching x 88 and 212 from the front
//   - arms slightly away from the torso, wrists near y 345 (x 64 and 236 from the front), hands open and
//     visible, legs straight and a little apart, crotch near y 366
//   - neutral, straight, relaxed stance; neutral expression
//   - close-fitting plain underwear or a bodysuit, nothing loose that clothing would have to hide
//   - hair short or tied back, clear of the collar and shoulders
//   - even, soft lighting with no cast shadow and nothing but transparency around the person
// The left photo faces the viewer's left, laid out as the right one mirrored (body center near x 148);
// without one, the right photo is mirrored for the left side.

export type PersonView = {
  /** The whole person, under all clothing. */
  base: string;
  /**
   * Optional cut-out of body parts that must sit over the torso clothing but under what's worn on them:
   * the near arm and hand in a side view, so a tee's torso goes behind the arm and its sleeve goes on top.
   * Side photos need one (a side photo without it is skipped); leave it out of the front and back views.
   */
  foreground?: string;
};
/** The photos found for each angle. An angle that's missing uses the drawn mannequin. */
export type PersonSet = Partial<Record<View, PersonView>>;

export const PERSON_DIR = "/outfit-builder/person";
export const PERSON_FORMATS = ["webp", "png"] as const;
/** The file names looked for, per angle and part, in order of preference. */
export const personFileNames = (view: View, part: keyof PersonView) =>
  PERSON_FORMATS.map(ext => `${view}${part === "base" ? "" : `-${part}`}.${ext}`);

/** A side photo is only usable with its near-arm cut-out; otherwise the torso clothing would cover that arm. */
const usable = (view: View, photo?: PersonView) => photo && (view === "front" || view === "back" || photo.foreground) ? photo : undefined;
/**
 * The photo for an angle, or undefined to use the drawn mannequin. The left side falls back to the
 * right photo, mirrored like the drawn mannequin's left side is.
 */
export function personFor(set: PersonSet | undefined, view: View): PersonView | undefined {
  return usable(view, set?.[view]) ?? (view === "left" ? usable("right", set?.right) : undefined);
}
