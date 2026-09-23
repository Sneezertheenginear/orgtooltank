export type RenameOptions = {
  preserveExtension: boolean;
  find: string;
  replace: string;
  remove: string;
  prefix: string;
  suffix: string;
  letterCase: "unchanged" | "lower" | "upper" | "title";
  clean: boolean;
  number: boolean;
  start: string;
  padding: string;
};
export const defaultOptions: RenameOptions = {
  preserveExtension: true, find: "", replace: "", remove: "", prefix: "", suffix: "",
  letterCase: "unchanged", clean: false, number: false, start: "1", padding: "3",
};
export function splitFilename(name: string) {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? { stem: name.slice(0, dot), extension: name.slice(dot) } : { stem: name, extension: "" };
}
export function optionErrors(options: RenameOptions, count: number): string[] {
  if (!options.number) return [];
  const errors: string[] = [];
  if (!/^\d+$/.test(options.start) || !Number.isSafeInteger(Number(options.start) + count)) errors.push("Numbering must start at a non-negative safe integer.");
  if (!/^[1-8]$/.test(options.padding)) errors.push("Number width must be between 1 and 8.");
  return errors;
}
export function validateName(name: string, stem = name): string[] {
  const errors: string[] = [];
  if (!stem.trim() || name === "." || name === "..") errors.push("Filename cannot be empty.");
  if (/[<>:"/\\|?*]/.test(name) || [...name].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) errors.push("Remove invalid characters (including / \\ : * ? and control characters).");
  if (/[. ]$/.test(name)) errors.push("Filename cannot end with a space or dot.");
  if (/^(con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i.test(name)) errors.push("This filename is reserved by Windows.");
  if (new TextEncoder().encode(name).length > 255) errors.push("Filename is too long (maximum 255 UTF-8 bytes).");
  return errors;
}
export function previewNames<T extends { id: string; name: string }>(files: T[], options: RenameOptions) {
  const rows = files.map((file, index) => {
    const parts = splitFilename(file.name);
    let stem = options.preserveExtension ? parts.stem : file.name;
    if (options.find) stem = stem.split(options.find).join(options.replace);
    if (options.remove) stem = stem.split(options.remove).join("");
    stem = options.prefix + stem + options.suffix;
    if (options.letterCase === "lower") stem = stem.toLowerCase();
    if (options.letterCase === "upper") stem = stem.toUpperCase();
    if (options.letterCase === "title") stem = stem.toLowerCase().replace(/(^|[^\p{L}\p{N}])(\p{L})/gu, (_, boundary, letter) => boundary + letter.toUpperCase());
    if (options.clean) stem = [...stem.normalize("NFC")].filter(char => char.charCodeAt(0) >= 32 && char.charCodeAt(0) !== 127).join("").replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, " ").trim().replace(/[. ]+$/g, "");
    if (options.number && !optionErrors(options, files.length).length) stem += `_${String(Number(options.start) + index).padStart(Number(options.padding), "0")}`;
    const output = stem + (options.preserveExtension ? parts.extension : "");
    return { ...file, output, errors: validateName(output, stem) };
  });
  const counts = new Map<string, number>();
  const key = (name: string) => name.normalize("NFC").toLowerCase();
  rows.forEach(row => counts.set(key(row.output), (counts.get(key(row.output)) ?? 0) + 1));
  return rows.map(row => ({ ...row, errors: [...row.errors, ...((counts.get(key(row.output)) ?? 0) > 1 ? ["Duplicate output name (case-insensitive)."] : [])] }));
}
