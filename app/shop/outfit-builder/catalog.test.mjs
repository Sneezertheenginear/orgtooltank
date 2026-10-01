import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const C = await import("./catalog.ts");
const root = join(import.meta.dirname, "../../../public");

test("every product is a real listing: required fields, known category and source, and its image is in the project", () => {
  const ids = new Set();
  for (const p of C.PRODUCTS) {
    assert.ok(!ids.has(p.id), `duplicate ${p.id}`); ids.add(p.id);
    for (const key of ["id", "name", "category", "image", "source", "available"]) assert.ok(p[key] !== undefined, `${p.id} missing ${key}`);
    assert.ok(C.CATEGORIES.some(c => c.id === p.category), `${p.id} category`);
    assert.ok(["Printful", "Apliiq", "OrgToolTank"].includes(p.source), `${p.id} source`);
    assert.ok(p.image.startsWith("/outfit-builder/products/") || /^https:\/\//.test(p.image), `${p.id} image lives under products/`);
    if (p.image.startsWith("/")) assert.ok(existsSync(join(root, p.image)), `${p.id}: ${p.image} is missing`);
  }
});

test("one product per category; picking it again takes it off", () => {
  const [black, maroon] = C.productsIn("shirts");
  let look = C.toggleProduct({}, black);
  assert.equal(look.shirts, black.id);
  look = C.toggleProduct(look, maroon);
  assert.equal(look.shirts, maroon.id);
  assert.equal(C.toggleProduct(look, maroon).shirts, undefined);
  assert.equal(C.clearCategory(look, "shirts").shirts, undefined);
  assert.deepEqual(C.lookProducts(look).map(p => p.id), [maroon.id]);
});

test("totals count priced products and say how many have no price yet", () => {
  const look = { shirts: C.PRODUCTS[0].id };
  const t = C.lookTotal(look);
  assert.equal(t.cents, C.PRODUCTS[0].price ?? 0);
  assert.equal(t.unpriced, C.PRODUCTS[0].price === undefined ? 1 : 0);
  assert.equal(C.formatPrice(2400), "$24");
  assert.equal(C.formatPrice(2450), "$24.50");
});

test("images: a missing file resolves to nothing, so it is never shown", () => {
  assert.deepEqual(C.candidates("/outfit-builder/scenes/studio.webp"), ["/outfit-builder/scenes/studio.webp", "/outfit-builder/scenes/studio.png", "/outfit-builder/scenes/studio.jpg"]);
  assert.equal(C.resolveImage(new Set(), "/outfit-builder/scenes/studio.webp"), undefined);
  assert.equal(C.resolveImage(new Set(["/outfit-builder/scenes/studio.jpg"]), "/outfit-builder/scenes/studio.webp"), "/outfit-builder/scenes/studio.jpg");
  assert.ok(C.PRODUCTS.every(p => !C.productReady(new Set(), p)));
  assert.ok(C.sceneReady(new Set(), C.sceneOf("plain")) && C.sceneReady(new Set(), C.sceneOf("custom")));
});

const L = await import("./board-layout.ts");
const ALL = ["shirts", "pants", "jackets", "shoes", "hats", "accessories"];
const combos = Array.from({ length: 63 }, (_, n) => ALL.filter((_, i) => n + 1 & 1 << i));
const overlap = (a, b) => Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left) > 0.5 && Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top) > 0.5;

test("outfit board: every combination fits the board, keeps images square, and reads top to bottom", () => {
  for (const cats of combos) {
    const b = L.boardLayout(cats), name = cats.join("+");
    assert.deepEqual(Object.keys(b).sort(), [...cats].sort(), name);
    for (const [c, box] of Object.entries(b)) {
      assert.ok(box.left >= -0.01 && box.top >= -0.01 && box.left + box.width <= 100.01 && box.top + box.height <= 100.01, `${name}: ${c} off the board`);
      // Spots are square in real pixels on the 3:4 board, so square product images are never squeezed.
      assert.ok(Math.abs(box.width / box.height - 4 / 3) < 1e-9, `${name}: ${c} not square`);
    }
    const order = ["hats", "shirts", "pants", "shoes"].filter(c => b[c]);
    for (let i = 1; i < order.length; i++) assert.ok(b[order[i]].top > b[order[i - 1]].top, `${name}: ${order[i]} below ${order[i - 1]}`);
    const middle = ["hats", "pants", "shoes"].filter(c => b[c]).map(c => b[c].left + b[c].width / 2);
    assert.ok(middle.every(x => Math.abs(x - middle[0]) < 1e-9), `${name}: column lines up`);
    if (b.shirts && b.jackets) assert.ok(b.jackets.left > b.shirts.left && b.jackets.top > b.shirts.top && b.jackets.z < b.shirts.z, `${name}: jacket offset behind shirt`);
    if (b.accessories && cats.length > 1) for (const c of cats.filter(c => c !== "accessories")) assert.ok(!overlap(b.accessories, b[c]), `${name}: accessory overlaps ${c}`);
  }
});

test("zoom: buttons step by 25% within 50–300%, wheel values are clamped, and 100% changes nothing", () => {
  assert.equal(L.stepZoom(1, 1), 1.25);
  assert.equal(L.stepZoom(1, -1), 0.75);
  assert.equal(L.stepZoom(1.13, 1), 1.25);
  assert.equal(L.stepZoom(1.13, -1), 1);
  assert.equal(L.stepZoom(3, 1), 3);
  assert.equal(L.stepZoom(0.5, -1), 0.5);
  assert.equal(L.clampZoom(10), 3);
  assert.equal(L.clampZoom(0.01), 0.5);
  const c = L.compositionCenter(L.boardLayout(["shirts", "pants", "shoes"]));
  assert.ok(Math.abs(c.x - 50) < 1e-6, "column composition is centered");
  assert.equal(L.zoomTransform(1, { x: 40, y: 55 }).transform, "translate(0%, 0%) scale(1)");
  assert.equal(L.zoomTransform(2, { x: 40, y: 55 }).transform, "translate(10%, -5%) scale(2)");
  assert.deepEqual(L.compositionCenter({}), { x: 50, y: 50 });
});

test("pan: moves the composition as one piece, can't lose it off the board, and reset is the default", () => {
  const c = { x: 50, y: 50 };
  assert.equal(L.zoomTransform(1, c, { x: 10, y: -20 }).transform, "translate(10%, -20%) scale(1)");
  assert.equal(L.zoomTransform(2, { x: 40, y: 55 }, { x: 3, y: 4 }).transform, "translate(13%, -1%) scale(2)");
  assert.deepEqual(L.clampPan({ x: 999, y: -999 }, 1, c), { x: 45, y: -45 }, "middle stays 5% inside the board");
  assert.deepEqual(L.clampPan({ x: 12, y: -7 }, 2, c), { x: 12, y: -7 }, "small pans are untouched");
  assert.ok(L.isCentered(L.CENTERED) && !L.isCentered({ x: 1, y: 0 }));
  assert.equal(L.zoomTransform(1, c, L.CENTERED).transform, L.zoomTransform(1, c).transform, "reset position is the default layout");
});
