import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { MAX_FILES, MAX_HASH_BYTES, categoryOf, cleanupCsv, entryKey, groupDuplicates, hashFile, isClutter, limitError, matchesSearch, planScan, suggestedKeeper, summarize, typeLabel } from "./engine.ts";

let next = 0;
const entry = (path, content, type = "") => {
  const file = new Blob([content]);
  return { id: String(next++), name: path.split("/").pop(), path, size: file.size, type, lastModified: 1, file };
};
const scan = async entries => {
  const { candidates } = planScan(entries);
  return groupDuplicates(await Promise.all(candidates.map(async e => ({ entry: e, hash: await hashFile(e.file) }))));
};

test("hashFile matches Node's SHA-256, including files larger than one chunk", async () => {
  const big = new Uint8Array(9 * 1024 * 1024 + 7).map((_, i) => (i * 31) % 256);
  let seen = 0;
  assert.equal(await hashFile(new Blob([big]), { onBytes: n => { seen += n; } }), createHash("sha256").update(big).digest("hex"));
  assert.equal(seen, big.length);
  assert.equal(await hashFile(new Blob(["abc"])), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  const controller = new AbortController(); controller.abort();
  await assert.rejects(hashFile(new Blob([big]), { signal: controller.signal }));
});

test("finds identical content, not matching names or sizes", async () => {
  const groups = await scan([
    entry("Photos/beach.jpg", "SAME-PHOTO-BYTES", "image/jpeg"),
    entry("Backup/Old/IMG_0001.jpg", "SAME-PHOTO-BYTES", "image/jpeg"),
    entry("Downloads/beach (1).jpg", "SAME-PHOTO-BYTES", "image/jpeg"),
    entry("Other/beach.jpg", "DIFF-PHOTO-BYTES", "image/jpeg"), // same name and size, different bytes
    entry("notes.txt", "hello"),
    entry("copy of notes.txt", "hello"),
    entry("unique.pdf", "only one of these"),
  ]);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0].files.map(f => f.path), ["Backup/Old/IMG_0001.jpg", "Downloads/beach (1).jpg", "Photos/beach.jpg"]);
  assert.equal(groups[0].category, "photos");
  assert.deepEqual(summarize(groups), { groups: 2, duplicateFiles: 3, recoverableBytes: 16 * 2 + 5 });
});

test("only same-size files are read, and empty or system files are skipped", () => {
  const plan = planScan([entry("a.txt", "12345"), entry("b.txt", "54321"), entry("c.txt", "1234567"), entry("empty1", ""), entry("empty2", ""),
    entry("Folder/.DS_Store", "x"), entry("Folder/.DS_Store2", "x"), entry("._a.txt", "12345"), entry("Thumbs.db", "12345"), entry("__MACOSX/a.txt", "12345"), entry("proj/node_modules/x.js", "12345")]);
  assert.deepEqual(plan.candidates.map(e => e.path), ["a.txt", "b.txt"]);
  assert.equal(plan.candidateBytes, 10);
  assert.equal(plan.scanned.length, 4);
  assert.equal(plan.skippedEmpty, 2);
  assert.equal(plan.skippedSystem, 5);
  assert.equal(isClutter("Icon\r", "Folder/Icon\r"), true);
  assert.equal(isClutter("photo.jpg", "My .gitignore stuff/photo.jpg"), false);
});

test("explains limits instead of scanning", () => {
  assert.equal(limitError(MAX_FILES, MAX_HASH_BYTES), null);
  assert.match(limitError(MAX_FILES + 1, 0), /up to 20,000 files/);
  assert.match(limitError(MAX_FILES + 50, 0), /more than 20,000/);
  assert.match(limitError(10, MAX_HASH_BYTES + 1), /up to 4 GB/);
});

test("keeper, search, categories and type labels", () => {
  const group = { files: [entry("Backup/2020/Photos/a.jpg", "x"), entry("Photos/a.jpg", "x"), entry("Photos/b.jpg", "x")] };
  assert.equal(group.files.find(f => f.id === suggestedKeeper(group)).path, "Photos/a.jpg");
  assert.ok(matchesSearch(group, "backup")); assert.ok(matchesSearch(group, ".JPG")); assert.ok(matchesSearch(group, "jpg")); assert.ok(matchesSearch(group, "*.jpg")); assert.ok(matchesSearch(group, "  "));
  assert.equal(matchesSearch(group, "pdf"), false);
  assert.equal(categoryOf({ name: "a.HEIC", type: "" }), "photos");
  assert.equal(categoryOf({ name: "clip.mov", type: "" }), "videos");
  assert.equal(categoryOf({ name: "song", type: "audio/mpeg" }), "audio");
  assert.equal(categoryOf({ name: "report.docx", type: "" }), "documents");
  assert.equal(categoryOf({ name: "archive.zip", type: "application/zip" }), "other");
  assert.equal(typeLabel({ name: "a.tar.gz", type: "" }), "GZ file");
  assert.equal(typeLabel({ name: "README", type: "" }), "File");
  assert.equal(entryKey({ path: "a", size: 1, lastModified: 2 }) === entryKey({ path: "a", size: 1, lastModified: 3 }), false);
});

test("cleanup CSV marks one keeper per group and is safe to open in spreadsheets", async () => {
  const groups = await scan([entry("Music/song, live.mp3", "AUDIO"), entry("Downloads/=cmd.mp3", "AUDIO"), entry('Old/"quoted".mp3', "AUDIO")]);
  const keeper = groups[0].files.find(f => f.path === "Downloads/=cmd.mp3").id;
  const lines = cleanupCsv(groups, { [groups[0].id]: keeper }).trim().split("\r\n");
  assert.equal(lines[0], "Group,Action,File name,Path,Size (bytes),Size,Type,Copies in group,SHA-256");
  assert.equal(lines.length, 4);
  assert.match(lines[1], /^1,KEEP,'=cmd\.mp3,Downloads\/=cmd\.mp3,5,5 B,MP3 file,3,[0-9a-f]{64}$/);
  assert.ok(lines.some(l => l.includes('"Old/""quoted"".mp3"')));
  assert.ok(lines.some(l => l.startsWith('1,DUPLICATE,"song, live.mp3","Music/song, live.mp3"')));
  assert.equal(lines.filter(l => l.includes(",KEEP,")).length, 1);
  // Without a chosen keeper the suggested one is used.
  assert.equal(cleanupCsv(groups, {}).split("\r\n").filter(l => l.includes(",KEEP,")).length, 1);
});
