import { existsSync } from "node:fs";
import { join } from "node:path";
import { VIEWS } from "./products";
import { PERSON_DIR, personFileNames, type PersonSet, type PersonView } from "./person";

/**
 * The person photos present in public/outfit-builder/person/, checked when the page is built, so the
 * builder never asks for a photo that isn't there. Dropping a photo in (and rebuilding) is all it takes.
 */
export function findPersonPhotos(): PersonSet {
  const find = (view: (typeof VIEWS)[number]["id"], part: keyof PersonView) => {
    const name = personFileNames(view, part).find(n => existsSync(join(process.cwd(), "public", PERSON_DIR, n)));
    return name && `${PERSON_DIR}/${name}`;
  };
  const set: PersonSet = {};
  for (const { id } of VIEWS) {
    const base = find(id, "base");
    if (base) set[id] = { base, foreground: find(id, "foreground") };
  }
  return set;
}
