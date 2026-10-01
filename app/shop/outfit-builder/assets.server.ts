import { existsSync } from "node:fs";
import { join } from "node:path";
import { PRODUCTS, SCENES, candidates } from "./catalog";

/**
 * The builder images present in public/, checked when the page is rendered, so the builder never asks
 * for a file that isn't there. Dropping a file in (and reloading, or rebuilding in production) is all it takes.
 */
export function findAssets(): string[] {
  const paths = new Set<string>();
  const add = (path?: string) => { if (path) for (const p of candidates(path)) paths.add(p); };
  for (const p of PRODUCTS) { add(p.image); add(p.thumbnail); }
  for (const s of SCENES) add(s.image);
  return [...paths].filter(p => p.startsWith("/") && existsSync(join(process.cwd(), "public", p)));
}
