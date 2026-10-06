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
    for (const c of p.colors ?? []) {
      if (c.image) assert.ok(existsSync(join(root, c.image)), `${p.id} ${c.name}: ${c.image} is missing`);
      assert.match(c.hex ?? "", /^#[0-9a-f]{6}$/i, `${p.id} ${c.name}: swatch color`);
      assert.ok(["white", "black"].includes(c.ink) && Number.isInteger(c.printfulTemplateId), `${p.id} ${c.name}: ink and template`);
    }
  }
});

test("collections: unique, every name used is a known collection, and only collections with products are listed", () => {
  const names = C.COLLECTIONS.map(c => c.name);
  assert.equal(new Set(C.COLLECTIONS.map(c => c.id)).size, C.COLLECTIONS.length, "duplicate collection id");
  assert.equal(new Set(names).size, names.length, "duplicate collection name");
  for (const p of C.PRODUCTS) for (const c of p.collections ?? []) assert.ok(names.includes(c), `${p.id}: unknown collection ${c}`);
  for (const [design, list] of Object.entries(C.DESIGN_COLLECTIONS)) for (const c of list) assert.ok(names.includes(c), `${design}: unknown collection ${c}`);
  // A product can be in several collections; a collection with no products isn't listed.
  const [tee] = C.productsIn("shirts");
  assert.ok(tee.collections.length > 1);
  const listed = C.collectionsWith([tee]).map(c => c.name);
  assert.deepEqual(listed, names.filter(n => tee.collections.includes(n) || n === "Comedy" || n === "Biotech"), "listed in COLLECTIONS order");
  assert.ok(!listed.includes("Garage / Mechanical"));
  // Only collections marked showEmpty (Comedy, Biotech) are listed with no products.
  assert.deepEqual(C.collectionsWith([]).map(c => c.name), ["Comedy", "Biotech"]);
  assert.equal(listed.at(-1), "Biotech", "Biotech comes last");
  assert.ok(C.inCollection(tee, undefined), "no collection = All Products");
  assert.ok(C.inCollection(tee, "Quotables"));
  assert.ok(!C.inCollection(tee, "Garage / Mechanical"));
  // Shop links use the id: /shop/outfit-builder?collection=quotables
  assert.equal(C.collectionById("quotables")?.name, "Quotables");
  assert.equal(C.collectionById("not-a-collection"), undefined);
  assert.equal(C.collectionById(["quotables"]), undefined, "a repeated ?collection= is ignored");
});

test("one product per category; picking it again takes it off", () => {
  const [first, second] = C.productsIn("shirts");
  let look = C.toggleProduct({}, first);
  assert.equal(look.shirts.id, first.id);
  look = C.toggleProduct(look, second);
  assert.equal(look.shirts.id, second.id);
  assert.equal(C.toggleProduct(look, second).shirts, undefined);
  assert.equal(C.clearCategory(look, "shirts").shirts, undefined);
  assert.deepEqual(C.lookProducts(look).map(p => p.id), [second.id]);
});

test("Electronic: one product per design, its colors pick the artwork version and the image on the board", () => {
  const electronic = C.PRODUCTS.filter(p => C.inCollection(p, "Electronic"));
  assert.deepEqual(electronic.map(p => p.name), ["Power Leaves Traces Tee", "Frequency Bends Time Tee", "Current Got Memory Tee", "Circuits Carry Prayer Tee"]);
  for (const p of electronic) {
    // Photographed colors first: Maroon (white ink) and Red (black ink); every other color has no photo yet.
    assert.deepEqual(p.colors.filter(c => c.image).map(c => `${c.name}:${c.ink}`), ["Maroon:white", "Red:black"], p.id);
    assert.deepEqual(p.colors.slice(0, 2).map(c => c.name), ["Maroon", "Red"]);
    assert.equal(new Set(p.colors.map(c => c.name)).size, p.colors.length, `${p.id}: each color once`);
    assert.equal(new Set(p.colors.map(c => c.printfulTemplateId)).size, 2, `${p.id}: two inks, two templates`);
    assert.deepEqual(p.sizes, ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"]);
  }
  const ccp = electronic.find(p => p.id === "circuits-carry-prayer-tee");
  for (const c of ["Carolina Blue", "Sand", "Daisy", "Sky", "Light Pink"]) assert.ok(!ccp.colors.some(x => x.name === c), `CCP has no ${c} until its black-ink template does`);
  assert.ok(!C.PRODUCTS.some(p => p.colors?.some(c => c.printfulTemplateId === 108403792)), "charcoal duplicate not used");
  const [tee] = electronic;
  let look = C.toggleProduct({}, tee, "Red");
  assert.deepEqual(look.shirts, { id: tee.id, color: "Red" });
  const [worn] = C.lookProducts(look);
  assert.equal(worn.name, "Power Leaves Traces Tee, Red");
  assert.equal(worn.image, tee.colors[1].image);
  look = C.toggleProduct(look, tee, "Maroon");
  assert.equal(C.lookProducts(look)[0].image, tee.colors[0].image, "another color swaps the shirt");
  assert.equal(C.toggleProduct(look, tee, "Maroon").shirts, undefined, "same color again takes it off");
});

test("I Renamed the Pain tee is one product, Black and Maroon its photographed colors", () => {
  const tees = C.productsIn("shirts").filter(p => p.name.startsWith("I Renamed the Pain"));
  assert.deepEqual(tees.map(p => p.id), ["i-renamed-the-pain-tee"]);
  assert.deepEqual(tees[0].colors.filter(c => c.image).map(c => c.name), ["Black", "Maroon"]);
  assert.ok(tees[0].colors.every(c => c.ink === "white" && c.printfulTemplateId === 108098684));
  assert.ok(C.productOf("i-renamed-the-pain-sweatpants-black") && C.productOf("i-renamed-the-pain-slides-white"), "sweatpants and slides unchanged");
  assert.equal(C.productOf("i-renamed-the-pain-slides-white").sizes, undefined, "slide sizes not known yet");
});

test("ADD TO OUTFIT links and the saved outfit only ever hold real products and colors", () => {
  assert.deepEqual(C.lookItemFor("power-leaves-traces-tee", "Red"), { id: "power-leaves-traces-tee", color: "Red" });
  assert.deepEqual(C.lookItemFor("power-leaves-traces-tee", "Purple"), { id: "power-leaves-traces-tee", color: "Maroon" }, "a color without a photo: first photographed color");
  assert.deepEqual(C.lookItemFor("power-leaves-traces-tee", "Teal"), { id: "power-leaves-traces-tee", color: "Maroon" }, "unknown color");
  assert.deepEqual(C.lookItemFor("power-leaves-traces-tee"), { id: "power-leaves-traces-tee", color: "Maroon" });
  assert.deepEqual(C.lookItemFor("i-renamed-the-pain-sweatpants-black", "Red"), { id: "i-renamed-the-pain-sweatpants-black" }, "no colors: color ignored");
  assert.equal(C.lookItemFor("not-a-product"), undefined);
  assert.equal(C.lookItemFor(["power-leaves-traces-tee"]), undefined);
  const saved = { shirts: { id: "current-got-memory-tee", color: "Red" }, pants: { id: "i-renamed-the-pain-tee" }, shoes: { id: "i-renamed-the-pain-tee-black" }, hats: "x" };
  assert.deepEqual(C.cleanLook(saved), { shirts: { id: "current-got-memory-tee", color: "Red" } }, "wrong category and old or unknown products dropped");
  assert.deepEqual(C.cleanLook(null), {});
  assert.deepEqual(C.cleanLook("junk"), {});
  assert.equal(C.garmentOf(C.productOf("i-renamed-the-pain-slides-white")), "Slides");
  assert.equal(C.garmentOf({ ...C.PRODUCTS[0], garment: undefined }), "Shirt");
});

test("totals count priced products and say how many have no price yet", () => {
  const look = { shirts: { id: C.PRODUCTS[0].id } };
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
  assert.deepEqual(C.SCENES.map(s => s.id), ["plain"], "Plain is the only background");
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
