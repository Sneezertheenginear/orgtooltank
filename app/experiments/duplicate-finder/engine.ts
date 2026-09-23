import { createSHA256 } from "hash-wasm";

export const MAX_FILES = 20_000;
export const MAX_HASH_BYTES = 4 * 1024 ** 3;
const CHUNK_BYTES = 4 * 1024 * 1024;

export type Category = "photos" | "videos" | "audio" | "documents" | "other";
export const categoryLabels: Record<Category, string> = { photos: "Photos", videos: "Videos", audio: "Audio", documents: "Documents", other: "Other" };
export type Entry<F extends Blob = Blob> = { id: string; name: string; path: string; size: number; type: string; lastModified: number; file: F };
export type Group<F extends Blob = Blob> = { id: string; hash: string; size: number; category: Category; files: Entry<F>[] };

const clutterNames = new Set([".ds_store", "thumbs.db", "ehthumbs.db", "desktop.ini", ".localized", "icon\r", ".directory"]);
const clutterFolders = /(^|\/)(__MACOSX|\.Trashes|\.Spotlight-V100|\.fseventsd|\.git|node_modules)(\/|$)/;
/** Operating-system clutter that is identical everywhere but isn't something people mean to clean up. */
export function isClutter(name: string, path: string) {
  return clutterNames.has(name.toLowerCase()) || name.startsWith("._") || clutterFolders.test(path);
}

/** A stable identity for one selected file, so adding the same folder twice doesn't match a file with itself. */
export const entryKey = (entry: Pick<Entry, "path" | "size" | "lastModified">) => `${entry.path}\u0000${entry.size}\u0000${entry.lastModified}`;

export function planScan<F extends Blob>(entries: Entry<F>[]) {
  const scanned: Entry<F>[] = [];
  let skippedEmpty = 0, skippedSystem = 0;
  for (const entry of entries) {
    if (isClutter(entry.name, entry.path)) skippedSystem++;
    else if (entry.size === 0) skippedEmpty++;
    else scanned.push(entry);
  }
  const bySize = new Map<number, Entry<F>[]>();
  for (const entry of scanned) { const same = bySize.get(entry.size); if (same) same.push(entry); else bySize.set(entry.size, [entry]); }
  // Only files that share an exact size with another file can be identical, so only those are read.
  const candidates = [...bySize.values()].filter(same => same.length > 1).flat();
  return {
    scanned, candidates, skippedEmpty, skippedSystem,
    scannedBytes: scanned.reduce((total, entry) => total + entry.size, 0),
    candidateBytes: candidates.reduce((total, entry) => total + entry.size, 0),
  };
}

export function limitError(fileCount: number, candidateBytes: number) {
  if (fileCount > MAX_FILES) return `This selection has ${fileCount > MAX_FILES + 1 ? "more than " : ""}${MAX_FILES.toLocaleString("en-US")} files. This browser experiment scans up to ${MAX_FILES.toLocaleString("en-US")} files at a time. Choose a smaller folder, or scan it in parts.`;
  if (candidateBytes > MAX_HASH_BYTES) return `${formatBytes(candidateBytes)} of same-size files would need to be compared. This browser experiment compares up to ${formatBytes(MAX_HASH_BYTES)} per scan. Choose a smaller folder, or scan it in parts.`;
  return null;
}

type HashOptions = { signal?: AbortSignal; onBytes?: (bytes: number) => void };
/** SHA-256 of a file, read in 4 MB chunks so large files never sit in memory whole. */
export async function hashFile(file: Blob, { signal, onBytes }: HashOptions = {}) {
  const hasher = await createSHA256();
  hasher.init();
  for (let start = 0; start < file.size; start += CHUNK_BYTES) {
    signal?.throwIfAborted();
    const chunk = new Uint8Array(await file.slice(start, start + CHUNK_BYTES).arrayBuffer());
    hasher.update(chunk);
    onBytes?.(chunk.length);
  }
  return hasher.digest("hex");
}

/** Groups files whose size and SHA-256 both match. Largest recoverable space first. */
export function groupDuplicates<F extends Blob>(hashed: { entry: Entry<F>; hash: string }[]): Group<F>[] {
  const byHash = new Map<string, Entry<F>[]>();
  for (const { entry, hash } of hashed) {
    const key = `${entry.size}:${hash}`, same = byHash.get(key);
    if (same) same.push(entry); else byHash.set(key, [entry]);
  }
  return [...byHash.entries()].filter(([, files]) => files.length > 1).map(([key, files]) => {
    const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));
    return { id: key, hash: key.slice(key.indexOf(":") + 1), size: sorted[0].size, category: categoryOf(sorted[0]), files: sorted };
  }).sort((a, b) => recoverable(b) - recoverable(a) || a.files[0].path.localeCompare(b.files[0].path));
}

export const recoverable = (group: Pick<Group, "size" | "files">) => group.size * (group.files.length - 1);

export function summarize(groups: Pick<Group, "size" | "files">[]) {
  return { groups: groups.length, duplicateFiles: groups.reduce((total, group) => total + group.files.length - 1, 0), recoverableBytes: groups.reduce((total, group) => total + recoverable(group), 0) };
}

const extensionCategories: [Category, RegExp][] = [
  ["photos", /\.(jpe?g|png|gif|webp|heic|heif|avif|bmp|tiff?|raw|cr2|cr3|nef|arw|dng|orf|rw2|svg|psd)$/i],
  ["videos", /\.(mp4|m4v|mov|avi|mkv|webm|wmv|flv|mpe?g|3gp|mts|m2ts)$/i],
  ["audio", /\.(mp3|wav|aiff?|flac|aac|m4a|ogg|oga|opus|wma|alac|mid|midi)$/i],
  ["documents", /\.(pdf|docx?|txt|rtf|odt|pages|xlsx?|csv|numbers|pptx?|key|odp|ods|md|epub)$/i],
];
export function categoryOf(entry: Pick<Entry, "name" | "type">): Category {
  if (entry.type.startsWith("image/")) return "photos";
  if (entry.type.startsWith("video/")) return "videos";
  if (entry.type.startsWith("audio/")) return "audio";
  return extensionCategories.find(([, pattern]) => pattern.test(entry.name))?.[0] ?? (entry.type === "application/pdf" || entry.type.startsWith("text/") ? "documents" : "other");
}

export function typeLabel(entry: Pick<Entry, "name" | "type">) {
  const dot = entry.name.lastIndexOf(".");
  return dot > 0 && dot < entry.name.length - 1 ? `${entry.name.slice(dot + 1).toUpperCase()} file` : entry.type || "File";
}

/** Suggested keeper: the copy with the shortest path (usually the least nested), then alphabetical. */
export function suggestedKeeper(group: Pick<Group, "files">) {
  return [...group.files].sort((a, b) => a.path.length - b.path.length || a.path.localeCompare(b.path))[0].id;
}

export function matchesSearch(group: Pick<Group, "files">, query: string) {
  const needle = query.trim().toLowerCase().replace(/^\*?\./, ".");
  return !needle || group.files.some(file => file.path.toLowerCase().includes(needle) || file.name.toLowerCase().includes(needle));
}

// Leading =, +, -, @ make spreadsheet apps treat a cell as a formula, so those cells get a quote.
const csvCell = (value: string | number) => {
  const text = String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** Cleanup list: every copy in every group, marked KEEP or DUPLICATE. Nothing in it is acted on automatically. */
export function cleanupCsv(groups: Group[], keepers: Record<string, string>) {
  const rows: (string | number)[][] = [["Group", "Action", "File name", "Path", "Size (bytes)", "Size", "Type", "Copies in group", "SHA-256"]];
  groups.forEach((group, index) => {
    const keeper = keepers[group.id] ?? suggestedKeeper(group);
    for (const file of [...group.files].sort((a, b) => Number(b.id === keeper) - Number(a.id === keeper))) {
      rows.push([index + 1, file.id === keeper ? "KEEP" : "DUPLICATE", file.name, file.path, file.size, formatBytes(file.size), typeLabel(file), group.files.length, group.hash]);
    }
  });
  return rows.map(row => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

export function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = size / 1024, unit = 0;
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit++; }
  return `${value.toFixed(1).replace(/\.0$/, "")} ${units[unit]}`;
}
