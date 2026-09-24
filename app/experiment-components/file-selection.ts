// Shared browser file selection for experiments: file inputs, folder inputs, and dropped folders.
// Everything stays in the browser; nothing here reads file contents.

export type PickedFile = { file: File; path: string };
export type Selection = { files: PickedFile[]; skipped: number; truncated: boolean };
type Options = { maxFiles: number; skip?: (name: string, path: string) => boolean };

const clutterNames = new Set([".ds_store", "thumbs.db", "ehthumbs.db", "desktop.ini", ".localized", "icon\r", ".directory"]);
const clutterFolders = /(^|\/)(__MACOSX|\.Trashes|\.Spotlight-V100|\.fseventsd)(\/|$)/;
/** Operating-system files that people don't mean to select. */
export function isSystemFile(name: string, path: string) {
  return clutterNames.has(name.toLowerCase()) || name.startsWith("._") || clutterFolders.test(path);
}

/** Files from a file input. Folder inputs include each file's path inside the chosen folder. */
export function selectionFromInput(list: FileList | null, { maxFiles, skip = isSystemFile }: Options): Selection {
  const result: Selection = { files: [], skipped: 0, truncated: false };
  for (const file of Array.from(list ?? [])) {
    const path = file.webkitRelativePath || file.name;
    if (skip(file.name, path)) { result.skipped++; continue; }
    result.files.push({ file, path });
    if (result.files.length > maxFiles) { result.truncated = true; break; }
  }
  return result;
}

/**
 * Files from a drop. Dropped folders are walked through the browser's entry API and walking stops
 * once there are more files than allowed. Entries must be read synchronously inside the drop event,
 * so call this before any await.
 */
export function selectionFromDrop(transfer: DataTransfer, options: Options): Promise<Selection> {
  const entries = Array.from(transfer.items ?? [], item => item.kind === "file" ? item.webkitGetAsEntry?.() : null).filter((entry): entry is FileSystemEntry => !!entry);
  if (!entries.length) return Promise.resolve(selectionFromInput(transfer.files, options));
  return walk(entries, options);
}

async function walk(roots: FileSystemEntry[], { maxFiles, skip = isSystemFile }: Options): Promise<Selection> {
  const result: Selection = { files: [], skipped: 0, truncated: false };
  const visit = async (entry: FileSystemEntry): Promise<void> => {
    if (result.truncated) return;
    const path = entry.fullPath.replace(/^\//, "");
    if (skip(entry.name, path)) { result.skipped++; return; }
    if (entry.isFile) {
      try {
        result.files.push({ file: await new Promise<File>((resolve, reject) => (entry as FileSystemFileEntry).file(resolve, reject)), path });
        if (result.files.length > maxFiles) result.truncated = true;
      } catch { result.skipped++; }
      return;
    }
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    // readEntries returns folders in batches; keep reading until it returns an empty batch.
    for (;;) {
      const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => reader.readEntries(resolve, reject)).catch(() => []);
      if (!batch.length || result.truncated) return;
      for (const child of batch) await visit(child);
    }
  };
  for (const root of roots) await visit(root);
  return result;
}

/** Folder picking works in desktop browsers; iPhone and iPad only offer individual files. */
export function canPickFolders() {
  if (typeof document === "undefined") return true;
  const touchMac = navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1;
  return "webkitdirectory" in document.createElement("input") && !/iPad|iPhone|iPod/.test(navigator.userAgent) && !touchMac;
}
