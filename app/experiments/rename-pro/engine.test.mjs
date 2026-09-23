import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultOptions, optionErrors, previewNames, splitFilename, validateName } from "./engine.ts";

const preview = (names, changes = {}) => previewNames(names.map((name, index) => ({ id: String(index), name })), { ...defaultOptions, ...changes });
test("preserves the final extension and handles dotfiles and extensionless files", () => {
  assert.deepEqual(splitFilename("my.photo.final.JPG"), { stem: "my.photo.final", extension: ".JPG" });
  assert.equal(preview(["my.photo.final.JPG"], { letterCase: "upper" })[0].output, "MY.PHOTO.FINAL.JPG");
  assert.deepEqual(preview([".gitignore", "README"], { suffix: "_copy" }).map(row => row.output), [".gitignore_copy", "README_copy"]);
});
test("applies literal replace/remove, affixes and case in the declared order", () => {
  assert.equal(preview(["my.photo.final.JPG"], { find: ".", replace: " ", remove: "final", prefix: "new ", suffix: "copy", letterCase: "title" })[0].output, "New My Photo Copy.JPG");
  assert.equal(preview(["A.TXT"], { preserveExtension: false, letterCase: "lower" })[0].output, "a.txt");
});
test("numbering follows stable input order", () => {
  assert.deepEqual(preview(["z.txt", "a.txt", "z.txt"], { number: true, start: "8", padding: "3" }).map(row => row.output), ["z_008.txt", "a_009.txt", "z_010.txt"]);
  assert.ok(optionErrors({ ...defaultOptions, number: true, start: "" }, 2).length);
  assert.ok(optionErrors({ ...defaultOptions, number: true, padding: "99" }, 2).length);
});
test("validates collisions, normalization, empty stems, reserved and unsafe names", () => {
  for (const names of [["A.txt", "a.txt"], ["é.txt", "e\u0301.txt"]]) assert.ok(preview(names).every(row => row.errors.length));
  assert.ok(preview(["a.txt"], { remove: "a" })[0].errors.length);
  for (const name of ["", "..", "CON.txt", "com¹.txt", "a/b.txt", "a\\b.txt", "file.", "file ", "a\u0000.txt", "é".repeat(128)]) assert.ok(validateName(name).length, name);
  assert.equal(preview(["a?.txt"], { clean: true })[0].output, "a.txt");
  assert.equal(preview(["a?.txt"], { clean: true })[0].errors.length, 0);
});
