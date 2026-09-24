import { Zip, ZipPassThrough } from "fflate";

export const MAX_FILES = 2_000;
export const MAX_BYTES = 500 * 1024 ** 2;
export const PLAN_NAME = "organization-plan.csv";

// Adapted from the desktop app's classifier, merged into fewer, broader folders.
export const categories = ["Photos", "Videos", "Audio", "Documents", "Archives", "Code & Projects", "Mixed Folders", "Other"] as const;
export type Category = typeof categories[number];
export const TOP = "Top level";
export type Placement = Category | typeof TOP;
export type RenameStyle = "keep" | "clean" | "date" | "number";
export const renameStyles: { id: RenameStyle; label: string; hint: string }[] = [
  { id: "keep", label: "Keep names", hint: "Names stay exactly as they are." },
  { id: "clean", label: "Clean up", hint: "Underscores become spaces and extra spaces go: my_photo.jpg → My photo.jpg" },
  { id: "date", label: "Add date", hint: "Adds each file’s own modified date first, like 2024-06-07 notes.txt" },
  { id: "number", label: "Add numbers", hint: "Numbers files within each folder: 001 beach.jpg, 002 sunset.jpg" },
];

export type Source<F extends Blob = Blob> = { id: string; file: F; name: string; path: string; size: number; lastModified: number };
export type Item<F extends Blob = Blob> = { id: string; kind: "file" | "folder"; name: string; path: string; root: string | null; files: Source<F>[]; size: number; suggested: Category; detail: string };
export type Output<F extends Blob = Blob> = { source: Source<F>; item: Item<F>; placement: Placement; folder: string; newName: string; zipPath: string };

const extensionCategories: [Category, string[]][] = [
  ["Photos", "jpg jpeg png gif heic heif webp tif tiff bmp svg raw cr2 cr3 nef arw dng avif psd".split(" ")],
  ["Videos", "mp4 mov mkv avi webm m4v wmv mpg mpeg 3gp mts".split(" ")],
  ["Audio", "mp3 wav aac m4a flac ogg oga opus aif aiff mid midi wma".split(" ")],
  ["Documents", "pdf doc docx txt rtf odt pages epub md xls xlsx csv tsv ods numbers ppt pptx key odp".split(" ")],
  ["Archives", "zip rar 7z tar gz tgz bz2 xz iso dmg pkg exe msi appimage deb rpm".split(" ")],
  ["Code & Projects", "rs js jsx mjs ts tsx py java c cpp h hpp go rb php swift kt html css scss sql sh json yaml yml toml ipynb".split(" ")],
];
const byExtension = new Map(extensionCategories.flatMap(([category, extensions]) => extensions.map(extension => [extension, category] as const)));

export function splitName(name: string) {
  const dot = name.lastIndexOf(".");
  return dot > 0 && dot < name.length - 1 ? { stem: name.slice(0, dot), extension: name.slice(dot) } : { stem: name, extension: "" };
}
export const categoryOf = (name: string): Category => byExtension.get(splitName(name).extension.slice(1).toLowerCase()) ?? "Other";
export const typeLabel = (name: string) => splitName(name).extension ? `${splitName(name).extension.slice(1).toUpperCase()} file` : "File";

const projectMarkers = new Set(["package.json", "cargo.toml", "pyproject.toml", "go.mod", "pom.xml", "build.gradle", "gemfile", "composer.json"]);
/** A whole folder goes where most of its files belong, like the desktop app's Safe Mode. */
export function classifyFolder(files: Pick<Source, "name" | "path">[]): { category: Category; detail: string } {
  if (files.some(file => projectMarkers.has(file.name.toLowerCase()) || /(^|\/)(\.git|[^/]+\.xcodeproj)(\/|$)/i.test(file.path))) return { category: "Code & Projects", detail: "Project folder" };
  const counts = new Map<Category, number>();
  for (const file of files) counts.set(categoryOf(file.name), (counts.get(categoryOf(file.name)) ?? 0) + 1);
  const [[top, count], second] = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const share = count / files.length;
  if (share >= 0.6 || (share >= 0.4 && count >= 2 * (second?.[1] ?? 0))) return { category: top, detail: share === 1 ? `All ${top.toLowerCase()}` : `Mostly ${top.toLowerCase()} (${Math.round(share * 100)}%)` };
  return { category: "Mixed Folders", detail: `Mixed: ${[...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([category, n]) => `${n} ${category.toLowerCase()}`).join(", ")}` };
}

/**
 * Loose files are organized one by one. Each subfolder of a chosen folder stays whole, with its
 * own folders and names intact, and is placed as one unit.
 */
export function buildItems<F extends Blob>(sources: Source<F>[]): Item<F>[] {
  const items: Item<F>[] = [], folders = new Map<string, Item<F>>();
  for (const source of sources) {
    const parts = source.path.split("/");
    if (parts.length <= 2) {
      items.push({ id: `file:${source.id}`, kind: "file", name: source.name, path: source.path, root: parts.length === 2 ? parts[0] : null, files: [source], size: source.size, suggested: categoryOf(source.name), detail: typeLabel(source.name) });
      continue;
    }
    const path = `${parts[0]}/${parts[1]}`;
    let folder = folders.get(path);
    if (!folder) { folder = { id: `folder:${path}`, kind: "folder", name: parts[1], path, root: parts[0], files: [], size: 0, suggested: "Other", detail: "" }; folders.set(path, folder); items.push(folder); }
    folder.files.push(source); folder.size += source.size;
  }
  for (const folder of folders.values()) Object.assign(folder, (({ category, detail }) => ({ suggested: category, detail }))(classifyFolder(folder.files)));
  return items.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
}

export function limitError(files: number, bytes: number) {
  if (files > MAX_FILES) return `This selection has ${files > MAX_FILES + 1 ? "more than " : ""}${MAX_FILES.toLocaleString("en-US")} files. This browser experiment organizes up to ${MAX_FILES.toLocaleString("en-US")} files at a time. Choose a smaller folder or fewer files.`;
  if (bytes > MAX_BYTES) return `This selection is ${formatBytes(bytes)}. This browser experiment organizes up to ${formatBytes(MAX_BYTES)} at a time. Choose a smaller folder or fewer files.`;
  return null;
}

const cleanSegment = (name: string) => [...name].filter(char => char.charCodeAt(0) >= 32 && char.charCodeAt(0) !== 127).join("").replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, " ").trim().replace(/[. ]+$/, "");
const localDate = (time: number) => { const d = new Date(time); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

/** Light renaming for loose files. The extension, including its case, is always kept. */
export function renameFile(name: string, style: RenameStyle, { index = 0, lastModified = 0 } = {}) {
  if (style === "keep") return name;
  const { stem, extension } = splitName(name);
  let next = stem;
  if (style === "clean") { next = cleanSegment(stem.replace(/_+/g, " ")); next = next.charAt(0).toUpperCase() + next.slice(1); }
  if (style === "date") { const date = localDate(lastModified); next = stem.startsWith(date) ? stem : `${date} ${stem}`; }
  if (style === "number") next = `${String(index + 1).padStart(3, "0")} ${stem}`;
  return `${cleanSegment(next) || "File"}${extension}`;
}

/** Adds " (2)", " (3)"… until a name is free in its folder, ignoring case like macOS and Windows do. */
function claim(taken: Set<string>, name: string, isFolder: boolean) {
  const { stem, extension } = isFolder ? { stem: name, extension: "" } : splitName(name);
  const key = (candidate: string) => candidate.normalize("NFC").toLowerCase();
  let candidate = name;
  for (let n = 2; taken.has(key(candidate)); n++) candidate = `${stem} (${n})${extension}`;
  taken.add(key(candidate));
  return candidate;
}

export function zipRootName(items: Pick<Item, "root">[]) {
  const roots = new Set(items.map(item => item.root).filter(Boolean));
  return roots.size === 1 ? `${cleanSegment([...roots][0]!) || "Files"} (Organized)` : "Organized Files";
}

export function planOutputs<F extends Blob>(items: Item<F>[], placements: Record<string, Placement>, style: RenameStyle): Output<F>[] {
  const root = zipRootName(items), taken = new Map<Placement, Set<string>>([[TOP, new Set([PLAN_NAME])]]);
  const namespace = (placement: Placement) => { if (!taken.has(placement)) taken.set(placement, new Set()); return taken.get(placement)!; };
  const outputs: Output<F>[] = [];
  // Folders claim their names first so kept folders keep their names; loose files adapt around them.
  for (const item of items.filter(item => item.kind === "folder")) {
    const placement = placements[item.id] ?? item.suggested, name = claim(namespace(placement), item.name, true);
    const base = placement === TOP ? name : `${placement}/${name}`;
    for (const source of item.files) {
      const inner = source.path.slice(item.path.length + 1), folder = [base, ...inner.split("/").slice(0, -1)].join("/");
      outputs.push({ source, item, placement, folder, newName: source.name, zipPath: `${root}/${base}/${inner}` });
    }
  }
  const counters = new Map<Placement, number>();
  for (const item of items.filter(item => item.kind === "file")) {
    const placement = placements[item.id] ?? item.suggested, index = counters.get(placement) ?? 0, source = item.files[0];
    counters.set(placement, index + 1);
    const newName = claim(namespace(placement), renameFile(source.name, style, { index, lastModified: source.lastModified }), false);
    const folder = placement === TOP ? "" : placement;
    outputs.push({ source, item, placement, folder, newName, zipPath: `${root}/${folder ? `${folder}/` : ""}${newName}` });
  }
  return outputs;
}

const csvCell = (value: string | number) => {
  const text = String(value), safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
export function planCsv(outputs: Output[]) {
  const rows: (string | number)[][] = [["Original file name", "Original path", "Category", "New folder", "New file name", "File type", "Size", "Size (bytes)"]];
  for (const output of [...outputs].sort((a, b) => a.zipPath.localeCompare(b.zipPath))) {
    rows.push([output.source.name, output.source.path, output.placement, output.folder || "(top level)", output.newName, typeLabel(output.source.name), formatBytes(output.source.size), output.source.size]);
  }
  return "\uFEFF" + rows.map(row => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

type ZipOptions = { signal?: AbortSignal; onBytes?: (bytes: number) => void };
/** Streams copies into a stored (uncompressed) ZIP, reading each file in chunks. */
export async function buildZip(outputs: Pick<Output, "zipPath" | "source">[], extras: { path: string; data: Uint8Array }[], { signal, onBytes }: ZipOptions = {}) {
  const parts: Uint8Array[] = [];
  let failure: Error | null = null;
  const zip = new Zip((error, chunk) => { if (error) failure = error; else parts.push(chunk); });
  for (const { zipPath, source } of outputs) {
    signal?.throwIfAborted();
    const entry = new ZipPassThrough(zipPath);
    // ZIP dates only cover 1980–2107; files outside that range get the current time instead.
    const year = new Date(source.lastModified).getFullYear();
    if (year >= 1980 && year <= 2107) entry.mtime = source.lastModified;
    zip.add(entry);
    try {
      const reader = source.file.stream().getReader();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        signal?.throwIfAborted();
        entry.push(value); onBytes?.(value.length);
      }
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new Error(`Couldn’t read “${source.path}”. It may have moved, changed, or be stored only in the cloud. Leave it out or download it to this device, then try again.`);
    }
    entry.push(new Uint8Array(0), true);
    if (failure) throw failure;
  }
  for (const extra of extras) { const entry = new ZipPassThrough(extra.path); zip.add(entry); entry.push(extra.data, true); }
  zip.end();
  if (failure) throw failure;
  return parts;
}

export function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  const units = ["KB", "MB", "GB"];
  let value = size / 1024, unit = 0;
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit++; }
  return `${value.toFixed(1).replace(/\.0$/, "")} ${units[unit]}`;
}
