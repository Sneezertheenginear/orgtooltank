import assert from "node:assert/strict";
import { test } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import { MAX_BYTES, MAX_FILES, PLAN_NAME, TOP, buildItems, buildZip, categoryOf, classifyFolder, limitError, planCsv, planOutputs, renameFile, zipRootName } from "./engine.ts";

let next = 0;
const JUNE_2024 = new Date(2024, 5, 7, 12).getTime();
const source = (path, content = path) => { const file = new Blob([content]); return { id: String(next++), file, name: path.split("/").pop(), path, size: file.size, lastModified: JUNE_2024 }; };
const join = parts => { const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let at = 0; for (const p of parts) { out.set(p, at); at += p.length; } return out; };

test("categorizes by extension into a few broad folders", () => {
  assert.deepEqual(["a.JPG", "b.heic", "c.mov", "d.m4a", "e.pdf", "f.xlsx", "g.pptx", "h.zip", "i.dmg", "j.tsx", "k.bak", "README"].map(categoryOf),
    ["Photos", "Photos", "Videos", "Audio", "Documents", "Documents", "Documents", "Archives", "Archives", "Code & Projects", "Other", "Other"]);
});

test("loose files are organized individually; each subfolder stays whole with its nested folders", () => {
  const items = buildItems([source("Downloads/beach.jpg"), source("Downloads/taxes.pdf"), source("Downloads/Trip/day1.jpg"), source("Downloads/Trip/day2.jpg"), source("Downloads/Trip/Videos/clip.mov"), source("Downloads/Trip/notes.txt"), source("Downloads/Trip/Deep/Deeper/x.jpg")]);
  assert.deepEqual(items.map(i => `${i.kind}:${i.name}:${i.suggested}`), ["file:beach.jpg:Photos", "file:taxes.pdf:Documents", "folder:Trip:Photos"]);
  const outputs = planOutputs(items, {}, "keep");
  assert.deepEqual(outputs.map(o => o.zipPath).sort(), [
    "Downloads (Organized)/Documents/taxes.pdf",
    "Downloads (Organized)/Photos/Trip/Deep/Deeper/x.jpg",
    "Downloads (Organized)/Photos/Trip/Videos/clip.mov",
    "Downloads (Organized)/Photos/Trip/day1.jpg",
    "Downloads (Organized)/Photos/Trip/day2.jpg",
    "Downloads (Organized)/Photos/Trip/notes.txt",
    "Downloads (Organized)/Photos/beach.jpg",
  ]);
  assert.equal(outputs.find(o => o.source.name === "clip.mov").folder, "Photos/Trip/Videos");
});

test("individual files have no root; several roots share one ZIP folder", () => {
  assert.equal(zipRootName(buildItems([source("a.jpg"), source("b.pdf")])), "Organized Files");
  assert.equal(zipRootName(buildItems([source("A/a.jpg"), source("B/b.pdf")])), "Organized Files");
  assert.equal(zipRootName(buildItems([source("My: Stuff/a.jpg")])), "My Stuff (Organized)");
});

test("folders follow their majority, projects win, and mixed folders are labelled", () => {
  const files = spec => Object.entries(spec).flatMap(([ext, n]) => Array.from({ length: n }, (_, i) => ({ name: `f${i}.${ext}`, path: `R/F/f${i}.${ext}` })));
  assert.equal(classifyFolder(files({ jpg: 8, pdf: 2 })).category, "Photos");
  assert.equal(classifyFolder(files({ mp3: 4, jpg: 2, pdf: 2 })).category, "Audio");
  assert.equal(classifyFolder(files({ jpg: 3, pdf: 3, mp3: 3 })).category, "Mixed Folders");
  assert.equal(classifyFolder([...files({ png: 20 }), { name: "package.json", path: "R/F/package.json" }]).category, "Code & Projects");
  assert.equal(classifyFolder([{ name: "HEAD", path: "R/F/.git/HEAD" }, ...files({ jpg: 5 })]).category, "Code & Projects");
  assert.match(classifyFolder(files({ jpg: 3, pdf: 3, mp3: 3 })).detail, /^Mixed: 3 /);
});

test("light renaming keeps the extension and only touches loose files", () => {
  assert.equal(renameFile("tax_return__final.PDF", "clean"), "Tax return final.PDF");
  assert.equal(renameFile("notes.txt", "date", { lastModified: JUNE_2024 }), "2024-06-07 notes.txt");
  assert.equal(renameFile("2024-06-07 notes.txt", "date", { lastModified: JUNE_2024 }), "2024-06-07 notes.txt");
  assert.equal(renameFile("beach.jpg", "number", { index: 11 }), "012 beach.jpg");
  assert.equal(renameFile(".bashrc", "clean"), ".bashrc");
  assert.equal(renameFile("___.txt", "clean"), "File.txt");
  const outputs = planOutputs(buildItems([source("R/my_photo.jpg"), source("R/Album/raw_shot.jpg"), source("R/Album/x.jpg")]), {}, "clean");
  assert.deepEqual(outputs.map(o => o.newName).sort(), ["My photo.jpg", "raw_shot.jpg", "x.jpg"]);
});

test("numbering counts within each destination folder", () => {
  const outputs = planOutputs(buildItems([source("a.jpg"), source("b.jpg"), source("c.pdf")]), {}, "number");
  assert.deepEqual(outputs.map(o => `${o.folder}/${o.newName}`), ["Photos/001 a.jpg", "Photos/002 b.jpg", "Documents/001 c.pdf"]);
});

test("name conflicts get (2), ignoring case; kept folders keep their names; the plan name is reserved", () => {
  const items = buildItems([source("A/photo.jpg"), source("B/Photo.JPG"), source("A/Trip/x.jpg"), source("B/Trip/y.jpg"), source("A/Trip.jpg"), source("A/organization-plan.csv")]);
  const outputs = planOutputs(items, { [items.find(i => i.name === "organization-plan.csv").id]: TOP }, "keep");
  const paths = outputs.map(o => o.zipPath).sort();
  assert.deepEqual(paths, [
    "Organized Files/Photos/Photo (2).JPG", "Organized Files/Photos/Trip (2)/y.jpg", "Organized Files/Photos/Trip.jpg",
    "Organized Files/Photos/Trip/x.jpg", "Organized Files/Photos/photo.jpg", "Organized Files/organization-plan (2).csv",
  ]);
});

test("placements move whole items, including to the top level", () => {
  const items = buildItems([source("R/song.mp3"), source("R/Album/1.jpg")]);
  const outputs = planOutputs(items, { [items.find(i => i.name === "song.mp3").id]: "Documents", [items.find(i => i.name === "Album").id]: TOP }, "keep");
  assert.deepEqual(outputs.map(o => o.zipPath).sort(), ["R (Organized)/Album/1.jpg", "R (Organized)/Documents/song.mp3"]);
});

test("limits are explained, not enforced silently", () => {
  assert.equal(limitError(MAX_FILES, MAX_BYTES), null);
  assert.match(limitError(MAX_FILES + 1, 0), /up to 2,000 files/);
  assert.match(limitError(MAX_FILES + 9, 0), /more than 2,000/);
  assert.match(limitError(3, MAX_BYTES + 1), /up to 500 MB/);
});

test("ZIP contains organized copies, dates, and a readable plan CSV", async () => {
  const items = buildItems([source("Desk/=weird, name.txt", "hello"), source("Desk/Album/Sub/pic.jpg", "PIXELS"), source("Desk/Résumé.pdf", "PDF")]);
  const outputs = planOutputs(items, {}, "keep");
  const csv = planCsv(outputs);
  let bytes = 0;
  const zip = unzipSync(join(await buildZip(outputs, [{ path: `${zipRootName(items)}/${PLAN_NAME}`, data: new TextEncoder().encode(csv) }], { onBytes: n => { bytes += n; } })));
  assert.deepEqual(Object.keys(zip).sort(), ["Desk (Organized)/Documents/=weird, name.txt", "Desk (Organized)/Documents/Résumé.pdf", "Desk (Organized)/Photos/Album/Sub/pic.jpg", "Desk (Organized)/organization-plan.csv"]);
  assert.equal(strFromU8(zip["Desk (Organized)/Photos/Album/Sub/pic.jpg"]), "PIXELS");
  assert.equal(bytes, 5 + 6 + 3);
  const lines = strFromU8(zip["Desk (Organized)/organization-plan.csv"]).replace(/^\uFEFF/, "").trim().split("\r\n");
  assert.equal(lines[0], "Original file name,Original path,Category,New folder,New file name,File type,Size,Size (bytes)");
  assert.ok(lines.includes(`"'=weird, name.txt","Desk/=weird, name.txt",Documents,Documents,"'=weird, name.txt",TXT file,5 B,5`));
  assert.ok(lines.includes("pic.jpg,Desk/Album/Sub/pic.jpg,Photos,Photos/Album/Sub,pic.jpg,JPG file,6 B,6"));
  const controller = new AbortController(); controller.abort();
  await assert.rejects(buildZip(outputs, [], { signal: controller.signal }));
});

test("a file that can't be read stops the ZIP with its name", async () => {
  const broken = { id: "x", name: "cloud.pdf", path: "R/cloud.pdf", size: 5, lastModified: JUNE_2024, file: { stream: () => new ReadableStream({ pull(controller) { controller.error(new Error("NotReadableError")); } }) } };
  await assert.rejects(buildZip([{ zipPath: "R/Documents/cloud.pdf", source: broken }], []), /Couldn’t read “R\/cloud\.pdf”/);
});
