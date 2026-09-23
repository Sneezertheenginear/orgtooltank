import { MAX_FILES, isClutter } from "../engine";

export type Picked = { file: File; path: string };
export type Collected = { files: Picked[]; skipped: number; truncated: boolean };

/** Files from a file input. Folder inputs include each file's path inside the chosen folder. */
export function fromInput(list: FileList | null): Collected {
  const files = Array.from(list ?? [], file => ({ file, path: file.webkitRelativePath || file.name }));
  return { files, skipped: 0, truncated: false };
}

/**
 * Files from a drop. Dropped folders are walked through the browser's entry API, skipping system
 * folders such as .git and node_modules, and stopping once there are more files than a scan allows.
 * Entries must be read synchronously inside the drop event, so call this before any await.
 */
export function fromDrop(transfer: DataTransfer): Promise<Collected> {
  const entries = Array.from(transfer.items ?? [], item => item.kind === "file" ? item.webkitGetAsEntry?.() : null).filter((entry): entry is FileSystemEntry => !!entry);
  if (!entries.length) return Promise.resolve(fromInput(transfer.files));
  return walk(entries);
}

async function walk(roots: FileSystemEntry[]): Promise<Collected> {
  const result: Collected = { files: [], skipped: 0, truncated: false };
  const visit = async (entry: FileSystemEntry): Promise<void> => {
    if (result.truncated) return;
    const path = entry.fullPath.replace(/^\//, "");
    if (isClutter(entry.name, path)) { result.skipped++; return; }
    if (entry.isFile) {
      try {
        const file = await new Promise<File>((resolve, reject) => (entry as FileSystemFileEntry).file(resolve, reject));
        result.files.push({ file, path });
        if (result.files.length > MAX_FILES) result.truncated = true;
      } catch { result.skipped++; }
      return;
    }
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    // readEntries returns folders in batches; keep reading until it returns an empty batch.
    for (;;) {
      const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => reader.readEntries(resolve, reject)).catch(() => []);
      if (!batch.length) return;
      for (const child of batch) await visit(child);
      if (result.truncated) return;
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
