import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

// Modules import siblings without extensions (bundler style); resolve them to .ts here.
registerHooks({ resolve: (specifier, context, next) => { try { return next(specifier, context); } catch (error) { if (specifier.startsWith(".")) return next(`${specifier}.ts`, context); throw error; } } });
const P = await import("./products.ts");
const O = await import("./outfit.ts");
const find = id => P.products.find(p => p.id === id);

const Z = await import("./zones.ts");
const L = await import("./layers.ts");
/** The first (or only) piece in a slot. */
const one = (outfit, slot) => outfit[slot]?.[0];

test("every placeholder product has the fields a real catalog will fill", () => {
  const ids = new Set();
  for (const p of P.products) {
    assert.ok(!ids.has(p.id), `duplicate ${p.id}`); ids.add(p.id);
    for (const key of ["id", "name", "category", "bodyArea", "slots", "price", "image", "frontImage", "leftImage", "rightImage", "backImage", "colors", "sizes", "provider", "affiliateUrl", "brand", "productModel", "fitType", "garmentWeight", "sizeChart", "womensSizeChart", "sizingNotes", "runsSmall", "runsLarge", "oversizedFit", "details", "shopifyProductId", "shopifyVariantId"]) assert.ok(key in p, `${p.id} missing ${key}`);
    assert.ok(Number.isInteger(p.price) && p.price > 0, `${p.id} price in cents`);
    assert.equal(p.bodyArea, P.categoryOf(p.category).zones[0]);
    assert.deepEqual(p.slots, P.categoryOf(p.category).slots);
    assert.ok(p.colors.length && p.sizes.length, p.id);
  }
  for (const c of P.CATEGORIES.filter(c => c.available)) assert.ok(P.products.some(p => p.category === c.id), `no products in ${c.id}`);
});

test("every zone from head to toe, with the right kinds of products", () => {
  assert.deepEqual(Z.ZONES.map(z => z.name), ["Head", "Face", "Ears", "Neck", "Upper body", "Left shoulder", "Right shoulder", "Left wrist", "Right wrist", "Left hand", "Right hand", "Waist", "Legs", "Left ankle", "Right ankle", "Feet"]);
  const by = zone => P.CATEGORIES.filter(c => c.zones.includes(zone)).map(c => c.name);
  assert.deepEqual(by("head"), ["Hats", "Beanies", "Headwear"]);
  assert.deepEqual(by("face"), ["Glasses", "Sunglasses"]);
  assert.deepEqual(by("ears"), ["Earrings"]);
  assert.deepEqual(by("neck"), ["Chains", "Necklaces", "Pendants", "Scarves"]);
  assert.deepEqual(by("upper"), ["T-shirts", "Long sleeves", "Hoodies", "Sweatshirts", "Jackets", "Coats"]);
  assert.deepEqual(by("leftShoulder"), ["Backpacks", "Bookbags", "Sling bags", "Shoulder bags"]);
  assert.deepEqual(by("rightWrist"), ["Watches", "Bracelets", "Wristbands"]);
  assert.deepEqual(by("leftHand"), ["Rings", "Gloves"]);
  assert.deepEqual(by("waist"), ["Belts", "Waist bags", "Belt bags"]);
  assert.deepEqual(by("legs"), ["Joggers", "Pants", "Shorts", "Leggings"]);
  assert.deepEqual(by("leftAnkle"), ["Anklets"]);
  assert.deepEqual(by("feet"), ["Socks", "Shoes", "Boots", "Slides"]);
  const slot = id => P.categoryOf(id).slots[0];
  assert.deepEqual(["tshirts", "longsleeves", "hoodies", "sweatshirts", "jackets", "coats"].map(slot), ["base", "base", "mid", "mid", "outer", "outer"]);
  assert.equal(P.categoryOf("leggings").available, false);
  // Every slot is offered by a zone, shown in the summary once, and has a stable key.
  assert.deepEqual([...Z.SLOT_ORDER].sort(), Object.keys(Z.SLOTS).sort());
  assert.equal(new Set(Object.values(Z.SLOTS).map(s => s.key)).size, Object.keys(Z.SLOTS).length);
  for (const s of Z.SLOT_ORDER) assert.ok(Z.ZONES.some(z => z.slots.includes(s)), s);
  for (const c of P.CATEGORIES) for (const z of c.zones) assert.ok(c.slots.some(s => Z.zoneOf(z).slots.includes(s)), `${c.id} in ${z}`);
  // Left and right are different slots.
  assert.notEqual(Z.zoneOf("leftWrist").slots[0], Z.zoneOf("rightWrist").slots[0]);
  assert.equal(Z.SLOTS.leftEar.side, "left"); assert.equal(Z.SLOTS.rightAnkle.side, "right");
});

test("the upper body layers: tee alone, hoodie over tee, jacket over hoodie, jacket over tee, plus a scarf", () => {
  const layersOf = outfit => O.pieces(outfit, P.products).map(p => `${p.slot}:${p.product.id}`);
  const tee = O.wear({}, find("logo-tee"));
  assert.deepEqual(layersOf(tee), ["base:logo-tee"]);
  const hoodieOverTee = O.wear(tee, find("idea-hoodie"));
  assert.deepEqual(layersOf(hoodieOverTee), ["base:logo-tee", "mid:idea-hoodie"]);
  const jacketOverHoodie = O.wear(hoodieOverTee, find("coach-jacket"));
  assert.deepEqual(layersOf(jacketOverHoodie), ["base:logo-tee", "mid:idea-hoodie", "outer:coach-jacket"]);
  const jacketOverTee = O.remove(jacketOverHoodie, "mid");
  assert.deepEqual(layersOf(jacketOverTee), ["base:logo-tee", "outer:coach-jacket"]);
  const withScarf = O.wear(jacketOverHoodie, find("knit-scarf"));
  assert.deepEqual(layersOf(withScarf), ["scarf:knit-scarf", "base:logo-tee", "mid:idea-hoodie", "outer:coach-jacket"], "listed head to toe");
  const coatSwap = O.wear(withScarf, find("chore-coat"));
  assert.equal(one(coatSwap, "outer").productId, "chore-coat", "a coat replaces the jacket in the outer layer");
  assert.equal(one(coatSwap, "mid").productId, "idea-hoodie"); assert.equal(one(coatSwap, "scarf").productId, "knit-scarf");
});

test("wearing a piece replaces only its own layer, and changing color keeps the size", () => {
  let outfit = O.wear(O.wear(O.wear({}, find("logo-tee")), find("coach-jacket"), "Navy"), find("everyday-joggers"));
  outfit = O.update(outfit, "base", { size: "L" });
  const swapped = O.wear(outfit, find("scattered-tee"));
  assert.equal(one(swapped, "base").productId, "scattered-tee"); assert.equal(one(swapped, "base").size, "", "a new product starts without a size");
  assert.equal(one(swapped, "outer").color, "Navy");
  const recolored = O.wear(outfit, find("logo-tee"), "White");
  assert.equal(one(recolored, "base").color, "White"); assert.equal(one(recolored, "base").size, "L");
  assert.equal(one(O.wear({}, find("dad-hat")), "head").size, "One size", "one-size products need no choice");
  const removed = O.remove(outfit, "outer");
  assert.equal(removed.outer, undefined); assert.equal(one(removed, "base").productId, "logo-tee");
});

test("left and right are separate: a watch on the left wrist, a bracelet on the right, earrings on both ears", () => {
  let outfit = O.wear({}, find("field-watch"), undefined, O.placeFor({}, find("field-watch"), "leftWrist"));
  outfit = O.wear(outfit, find("cord-bracelet"), undefined, O.placeFor(outfit, find("cord-bracelet"), "rightWrist"));
  assert.equal(one(outfit, "leftWrist").productId, "field-watch"); assert.equal(one(outfit, "rightWrist").productId, "cord-bracelet");
  assert.equal(outfit.rightWrist.length, 1); assert.equal(outfit.leftWrist.length, 1);
  // Earrings: the first tap goes on the left ear, the second on the right; then both ears are full.
  const hoop = find("hoop-earring");
  let ears = O.wear({}, hoop, "Gold", O.placeFor({}, hoop, "ears"));
  assert.deepEqual(O.placeFor(ears, hoop, "ears"), { slot: "rightEar" });
  ears = O.wear(ears, hoop, "Gold", O.placeFor(ears, hoop, "ears"));
  assert.equal(one(ears, "leftEar").productId, "hoop-earring"); assert.equal(one(ears, "rightEar").productId, "hoop-earring");
  assert.equal(O.placeFor(ears, find("stud-earring"), "ears"), null, "both ears full: choose which to change");
  assert.equal(O.outfitToCartLines(ears, P.products).length, 2, "one earring per ear, each its own cart line");
  // Removing one side leaves the other.
  assert.equal(one(O.remove(ears, "leftEar"), "rightEar").productId, "hoop-earring");
});

test("multi-item zones: a watch and bracelets on one wrist, one watch at a time, rings, chains with a scarf", () => {
  const w = zone => (outfit, id) => O.wear(outfit, find(id), undefined, O.placeFor(outfit, find(id), zone));
  const left = w("leftWrist");
  let outfit = left(left(left({}, "field-watch"), "cord-bracelet"), "link-bracelet");
  assert.deepEqual(outfit.leftWrist.map(p => p.productId), ["field-watch", "cord-bracelet", "link-bracelet"]);
  assert.equal(O.hasRoom(outfit, "leftWrist"), false);
  assert.equal(O.placeFor(outfit, find("terry-wristband"), "leftWrist"), null, "a full wrist doesn't silently drop something");
  outfit = O.remove(outfit, "leftWrist", 1);
  assert.deepEqual(outfit.leftWrist.map(p => p.productId), ["field-watch", "link-bracelet"], "removing one keeps the others");
  const second = { ...find("field-watch"), id: "other-watch" };
  assert.deepEqual(O.placeFor(outfit, second, "leftWrist", [...P.products, second]), { slot: "leftWrist", index: 0 }, "a second watch replaces the first");
  // Change a specific piece: replace the bracelet at index 1.
  const changed = O.wear(outfit, find("terry-wristband"), undefined, { slot: "leftWrist", index: 1 });
  assert.deepEqual(changed.leftWrist.map(p => p.productId), ["field-watch", "terry-wristband"]);
  const hand = w("rightHand");
  const rings = hand(hand({}, "band-ring"), "band-ring");
  assert.equal(rings.rightHand.length, 1, "tapping the same ring again doesn't duplicate it");
  const neck = w("neck");
  const both = neck(neck(neck({}, "rope-chain"), "bar-pendant"), "knit-scarf");
  assert.deepEqual(both.necklace.map(p => p.productId), ["rope-chain", "bar-pendant"]); assert.equal(one(both, "scarf").productId, "knit-scarf");
  // Backpack over a jacket: its own slot, from either shoulder.
  const bag = O.wear(O.wear({}, find("coach-jacket")), find("day-backpack"), undefined, O.placeFor({}, find("day-backpack"), "rightShoulder"));
  assert.equal(one(bag, "back").productId, "day-backpack"); assert.equal(one(bag, "outer").productId, "coach-jacket");
  assert.deepEqual(O.placeFor({}, find("sling-bag"), "rightShoulder"), { slot: "rightShoulder" });
  assert.deepEqual(O.placeFor({}, find("knit-gloves"), "leftHand"), { slot: "gloves" });
  assert.deepEqual(O.placeFor({}, find("canvas-sneakers"), "feet"), { slot: "shoes" });
});

test("total, missing sizes, and cart lines: clothing and accessories alike", () => {
  let outfit = O.wear(O.wear(O.wear({}, find("idea-hoodie")), find("work-pants")), find("cuff-beanie"));
  outfit = O.wear(outfit, find("field-watch"), undefined, { slot: "leftWrist" });
  outfit = O.wear(outfit, find("band-ring"), "Gold", { slot: "rightHand" });
  assert.equal(O.total(outfit, P.products), 5800 + 6800 + 2200 + 8500 + 2400);
  assert.equal(P.formatPrice(O.total(outfit, P.products)), "$257.00");
  assert.deepEqual(O.missingSizes(outfit, P.products).map(p => p.id), ["idea-hoodie", "band-ring", "work-pants"], "the one-size watch needs no choice; the ring does");
  outfit = O.update(O.update(O.update(outfit, "mid", { size: "M" }), "legs", { size: "L" }), "rightHand", { size: "9" });
  assert.deepEqual(O.missingSizes(outfit, P.products), []);
  const lines = O.outfitToCartLines(outfit, P.products);
  assert.ok(lines.every(l => "provider" in l && "shopifyProductId" in l && "shopifyVariantId" in l), "each line can map to a provider, product, and variant");
  assert.deepEqual(lines.map(l => [l.productId, l.color, l.size, l.quantity]), [["cuff-beanie", "Black", "One size", 1], ["idea-hoodie", "Charcoal", "M", 1], ["field-watch", "Black", "One size", 1], ["band-ring", "Gold", "9", 1], ["work-pants", "Tan", "L", 1]]);
  const withVariants = { ...find("logo-tee"), shopifyVariantId: "default", variants: [{ color: "White", size: "M", shopifyVariantId: "gid://shopify/ProductVariant/1" }] };
  assert.equal(O.variantIdFor(withVariants, "White", "M"), "gid://shopify/ProductVariant/1");
  assert.equal(O.variantIdFor(withVariants, "Black", "M"), "default");
});

test("the test cart takes a whole outfit in one call", async () => {
  let seen = [];
  const cart = O.createTestCart(lines => { seen = lines; });
  assert.deepEqual(await cart.addLines([]), { ok: false, error: "The outfit is empty." });
  const lines = O.outfitToCartLines(O.wear(O.wear({}, find("dad-hat")), find("crew-socks")), P.products);
  assert.deepEqual(await cart.addLines(lines), { ok: true });
  assert.equal(seen.length, 2);
});

test("remove and replace: taking off a top layer reveals what's underneath; a new item replaces the old one", () => {
  const layersOf = outfit => O.pieces(outfit, P.products).map(p => p.slot);
  let outfit = O.wear(O.wear(O.wear({}, find("logo-tee")), find("idea-hoodie")), find("chore-coat"));
  assert.deepEqual(layersOf(outfit), ["base", "mid", "outer"]);
  outfit = O.remove(outfit, "outer");
  assert.deepEqual(layersOf(outfit), ["base", "mid"], "the hoodie is on top now");
  outfit = O.remove(outfit, "mid");
  assert.deepEqual(layersOf(outfit), ["base"], "the tee stays");
  outfit = O.wear(outfit, find("chore-coat"));
  outfit = O.wear(outfit, find("coach-jacket"));
  assert.equal(one(outfit, "outer").productId, "coach-jacket", "the jacket replaced the coat");
  assert.deepEqual(layersOf(outfit), ["base", "outer"]);
  assert.deepEqual(O.remove({}, "outer"), {}, "removing an empty slot is harmless");
  assert.equal(O.total(O.remove(outfit, "outer"), P.products), find("logo-tee").price);
});

test("outfit encoding for a future share link round-trips and ignores anything invalid", () => {
  let outfit = O.wear(O.wear(O.wear({}, find("logo-tee")), find("coach-jacket"), "Navy"), find("knit-scarf"));
  outfit = O.update(outfit, "base", { size: "L" });
  outfit = O.wear(O.wear(outfit, find("field-watch"), "Brown", { slot: "leftWrist" }), find("cord-bracelet"), "Rust", { slot: "leftWrist" });
  const text = O.encodeOutfit(outfit);
  assert.deepEqual(O.decodeOutfit(text, P.products), outfit);
  assert.deepEqual(O.decodeOutfit("upperBody.outer~no-such-thing~Black~M;upperBody.base~logo-tee~Purple~M;head~logo-tee~Black~M", P.products), {}, "unknown products, colors, or wrong slots are dropped");
  assert.equal(one(O.decodeOutfit("upperBody.base~logo-tee~Black~XXXL", P.products), "base").size, "", "an unknown size must be chosen again");
  assert.deepEqual(O.decodeOutfit("", P.products), {});
});

test("each product can carry its own image for the front, left side, right side, and back", () => {
  assert.deepEqual(P.VIEWS.map(v => v.id), ["front", "left", "right", "back"]);
  assert.deepEqual(P.VIEWS.map(v => v.name), ["Front", "Left side", "Right side", "Back"]);
  const withArt = { ...find("idea-hoodie"), frontImage: "/f.png", leftImage: "", rightImage: "/r.png", backImage: "/b.png" };
  assert.equal(P.imageFor(withArt, "front"), "/f.png");
  assert.equal(P.imageFor(withArt, "right"), "/r.png");
  assert.equal(P.imageFor(withArt, "back"), "/b.png");
  assert.equal(P.imageFor(withArt, "left"), "", "no left image yet: the drawn placeholder is used, not a mirrored photo");
});

test("zoom runs 75% to 300% in 25% steps, and 100% fits the whole stage", async () => {
  const V = await import("./view.ts");
  assert.equal(V.clampZoom(0.5), 0.75); assert.equal(V.clampZoom(4), 3); assert.equal(V.clampZoom(1.3), 1.25);
  const steps = []; for (let z = V.ZOOM.min; z <= V.ZOOM.max + 1e-9; z += V.ZOOM.step) steps.push(Math.round(V.clampZoom(z) * 100));
  assert.deepEqual(steps, [75, 100, 125, 150, 175, 200, 225, 250, 275, 300]);
  const fit = V.fitSize({ w: 400, h: 600 });
  assert.equal(fit.h, 600, "a tall stage fits by height"); assert.ok(Math.abs(fit.w - 600 * 350 / 730) < 1e-9);
  const narrow = V.fitSize({ w: 150, h: 600 });
  assert.ok(Math.abs(narrow.w - 150) < 1e-9, "a narrow viewer fits by width"); assert.ok(Math.abs(narrow.h - 150 * 730 / 350) < 1e-9);
});

test("pan room is zero while the figure fits, grows with zoom, and pan is kept inside it", async () => {
  const V = await import("./view.ts");
  const viewer = { w: 400, h: 600 };
  assert.deepEqual(V.panRoom(1, viewer), { x: 0, y: 0 });
  assert.equal(V.canPan(V.panRoom(0.75, viewer)), false);
  const room = V.panRoom(2.5, viewer);
  assert.ok(room.y > 0.29 && room.y < 0.31, "at 250% the figure can move about 30% of its height either way");
  assert.ok(room.x > 0 && V.canPan(room));
  assert.deepEqual(V.clampPan({ x: 5, y: -5 }, room), { x: room.x, y: -room.y });
  assert.deepEqual(V.clampPan({ x: 0.01, y: 0.02 }, room), { x: 0.01, y: 0.02 });
  assert.deepEqual(V.clampPan({ x: 0.2, y: 0.2 }, V.panRoom(1, viewer)), { x: 0, y: 0 }, "zooming back out recenters");
});


// ---------- Mannequin and fit ----------

const F = await import("./fit.ts");
const B = await import("./body.ts");
const profile = change => ({ ...F.DEFAULT_PROFILE, ...change, measurements: { ...change?.measurements } });
const rec = (id, change) => F.recommendSize(find(id), profile(change));
const manufacturer = (base, rows) => ({ ...base, sizeChart: { source: "manufacturer", rows } });

test("with nothing entered there is no size guess, just a request for more", () => {
  const r = rec("idea-hoodie");
  assert.equal(r.status, "needed"); assert.equal(r.size, "");
  assert.match(r.why, /height and weight, or your chest measurement/);
  assert.match(rec("work-pants").why, /waist measurement/);
  assert.equal(rec("dad-hat").status, "none", "one-size pieces get no size guidance");
  assert.equal(rec("crew-socks").status, "none"); assert.match(rec("crew-socks").why, /isn’t available/);
});

test("height and weight alone only ever give an estimate, with a tip to add a measurement", () => {
  const r = rec("idea-hoodie", { height: 70, weight: 154 });
  assert.equal(r.status, "estimated"); assert.equal(r.size, "M"); assert.equal(r.headline, "Estimated size: M");
  assert.match(r.why, /height and weight/); assert.match(r.tip, /chest measurement/);
  assert.match(r.why, /sample size chart/, "sample charts are called samples");
  assert.equal(rec("idea-hoodie", { weight: 154 }).status, "needed", "weight without height isn't enough");
});

test("a measurement with the product's own chart is a best match; measurements beat height and weight", () => {
  const r = rec("idea-hoodie", { height: 70, weight: 154, measurements: { chest: 46 } });
  assert.equal(r.status, "best"); assert.equal(r.headline, "Recommended size: XL");
  assert.match(r.why, /chest measurement and regular fit line up most closely with XL/);
  assert.equal(rec("idea-hoodie", { measurements: { chest: 46 } }).size, "XL", "a measurement alone is enough");
  // No chart of its own: a measurement still only gives an estimate, and the "runs small" note counts.
  const tee = rec("scattered-tee", { measurements: { chest: 38 } });
  assert.equal(tee.status, "estimated"); assert.match(tee.why, /doesn’t have its own size chart/);
  assert.equal(tee.size, "L", "runs small: one size up from the general chart's M");
  assert.ok(tee.notes.some(n => /runs about a size small/.test(n)));
});

test("fit preference moves the suggestion, and tone never changes it", () => {
  const body = { height: 70, weight: 180, measurements: { chest: 41 } };
  const sizes = ["fitted", "regular", "relaxed", "oversized"].map(f => rec("logo-tee", { ...body, fitPreference: f }).size);
  const order = P.products.find(p => p.id === "logo-tee").sizes;
  for (let i = 1; i < sizes.length; i++) assert.ok(order.indexOf(sizes[i]) >= order.indexOf(sizes[i - 1]), sizes.join(" "));
  assert.ok(order.indexOf(sizes[3]) > order.indexOf(sizes[1]), "oversized suggests a bigger size than regular");
  for (const id of P.products.map(p => p.id)) {
    const results = F.TONES.map(t => JSON.stringify(rec(id, { ...body, tone: t.id })));
    assert.equal(new Set(results).size, 1, `${id}: tone changed the suggestion`);
  }
});

test("each piece is sized on its own chart: one body can be L, XL, and 2XL across an outfit", () => {
  const body = { height: 72, weight: 210, measurements: { chest: 44, waist: 36 } };
  const chart = start => ["XS", "S", "M", "L", "XL", "2XL", "3XL"].map((size, i) => ({ size, chestWidth: start + i * 2 }));
  const tee = manufacturer(find("logo-tee"), chart(17)), hoodie = manufacturer(find("idea-hoodie"), chart(17)), jacket = manufacturer(find("coach-jacket"), chart(16));
  const sizes = [tee, hoodie, jacket].map(p => F.recommendSize(p, profile(body)).size);
  assert.deepEqual(sizes, ["L", "XL", "2XL"]);
  // Two providers' "XL" aren't the same: a roomier cut suggests a smaller size for the same shopper.
  const printful = manufacturer({ ...find("idea-hoodie"), provider: "printful" }, ["S", "M", "L", "XL"].map((size, i) => ({ size, chestWidth: 20 + i * 2 })));
  const apliiq = manufacturer({ ...find("idea-hoodie"), provider: "apliiq" }, ["S", "M", "L", "XL"].map((size, i) => ({ size, chestWidth: 22 + i * 2 })));
  const [a, b] = [printful, apliiq].map(p => F.recommendSize({ ...p, sizes: ["S", "M", "L", "XL"] }, profile(body)));
  assert.equal(a.status, "best"); assert.notEqual(a.size, b.size);
  assert.match(a.why, /hoodie’s size chart/, "a maker's chart isn't called a sample");
});

test("length and edge-of-chart notes, and no promises", () => {
  const long = rec("work-pants", { measurements: { waist: 33, inseam: 35 } });
  assert.ok(long.notes.some(n => /inseam may be short/.test(n)), long.notes.join(" | "));
  const big = rec("logo-tee", { measurements: { chest: 62 } });
  assert.equal(big.size, "3XL"); assert.ok(big.notes.some(n => /largest size/.test(n)));
  for (const p of P.products) for (const change of [{}, { height: 66, weight: 140 }, { measurements: { chest: 40, waist: 34 } }]) {
    const r = F.recommendSize(p, profile(change));
    assert.doesNotMatch(JSON.stringify(r), /guarantee/i);
    assert.ok(!r.size || p.sizes.includes(r.size), `${p.id}: suggested a size it isn't sold in`);
  }
});

test("measurements are used before estimates for the body", () => {
  const { body, source } = F.estimateBody(profile({ height: 70, weight: 154, measurements: { chest: 44 } }));
  assert.equal(body.chest, 44); assert.equal(source.chest, "measured"); assert.equal(source.waist, "estimated");
  assert.equal(F.estimateBody(profile()).source.chest, "reference");
  assert.equal(F.formatHeight(70), "5 ft 10 in");
  assert.equal(F.inToCm(70), 178); assert.equal(F.lbToKg(205), 93);
});

test("the mannequin shape follows height, build, and weight (never tone)", () => {
  const ref = B.shapeFor(profile({ height: 70, weight: 154 }));
  for (const k of ["scale", "shoulders", "chest", "waist", "hips"]) assert.ok(Math.abs(ref[k] - 1) < 0.001, `${k} ${ref[k]}`);
  assert.ok(B.shapeFor(profile({ height: 78 })).scale > 1.1 && B.shapeFor(profile({ height: 60 })).scale < 0.9);
  const build = b => B.shapeFor(profile({ build: b }));
  assert.ok(build("slim").chest < build("regular").chest && build("regular").chest < build("broad").chest);
  assert.ok(build("broad").shoulders > build("plus").shoulders, "broad is about the shoulders");
  assert.ok(build("plus").waist > build("broad").waist, "plus is about the waist and hips");
  assert.ok(B.shapeFor(profile({ height: 70, weight: 230 })).waist > B.shapeFor(profile({ height: 70, weight: 150 })).waist);
  for (const b of ["slim", "regular", "broad", "plus"]) for (const w of [90, 450]) {
    const s = B.shapeFor(profile({ build: b, height: 64, weight: w }));
    for (const k of ["shoulders", "chest", "waist", "hips"]) assert.ok(s[k] >= 0.8 && s[k] <= 1.35, "kept within gentle limits");
  }
  assert.deepEqual(B.shapeFor(profile({ tone: "light", build: "plus" })), B.shapeFor(profile({ tone: "dark", build: "plus" })));
});

test("the body warp: reference is unchanged, the feet stay on the floor, taller reaches higher", async () => {
  const same = B.bodyWarp(B.REFERENCE_SHAPE, false);
  assert.equal(B.warpPath("M90,142 C76,154 72,184 70,226 L80,348 Z", same), "M 90,142 C 76,154 72,184 70,226 L 80,348 Z");
  const tall = B.bodyWarp({ ...B.REFERENCE_SHAPE, scale: 80 / 70 }, false);
  assert.deepEqual(tall(150, B.FLOOR), [150, B.FLOOR]);
  assert.ok(tall(150, 24)[1] < 24 - 80, "the head is higher");
  assert.ok(tall(150, 24)[1] > -90, "and still inside the stage");
  const wide = B.bodyWarp({ ...B.REFERENCE_SHAPE, waist: 1.2 }, false);
  assert.ok(wide(110, 285)[0] < 110 && wide(190, 285)[0] > 190, "a wider waist moves both sides out");
  assert.deepEqual(wide(150, 285), [150, 285], "the center line stays put");
  const box = B.warpBox({ x: 100, y: 300, w: 100, h: 50 }, wide);
  assert.ok(box.w > 100 && box.x < 100);
  // The widest, tallest mannequin in its roomiest coat still fits on the stage.
  const V = await import("./view.ts");
  const biggest = B.bodyWarp({ scale: 82 / 70, shoulders: 1.35, chest: 1.35, waist: 1.35, hips: 1.35 }, false);
  const points = [[58, 346], [242, 346], [64, 226]].map(([x, y]) => biggest(...B.roomWarp(1.1, false, true)(x, y)));
  for (const [px, py] of [...points, biggest(150, 18)]) {
    assert.ok(px >= V.STAGE.x && px <= V.STAGE.x + V.STAGE.width && py >= V.STAGE.y, `${px},${py}`);
  }
});

test("the chosen size sets how roomy a piece looks: bigger is fuller, within limits", () => {
  const p = profile({ height: 70, weight: 154 }), hoodie = find("idea-hoodie");
  const rooms = hoodie.sizes.map(s => F.garmentRoom(hoodie, s, p));
  for (let i = 1; i < rooms.length; i++) assert.ok(rooms[i] >= rooms[i - 1]);
  assert.ok(rooms.at(-1) > 1.05 && rooms[0] < 1, rooms.join(" "));
  assert.ok(rooms.every(r => r >= 0.985 && r <= 1.1));
  assert.equal(F.garmentRoom(find("dad-hat"), "One size", p), 1);
  assert.equal(F.garmentRoom(hoodie, "", p), 1);
});

test("the master layer stack puts things in a natural order", () => {
  const rank = id => L.rankOf(P.categoryOf(id).draw);
  const below = (a, b, why) => assert.ok(rank(a) < rank(b), `${a} under ${b}: ${why}`);
  below("socks", "pants", "pants cover sock tops"); below("anklets", "pants", "long pants cover anklets");
  below("belts", "tshirts", "an untucked tee covers the belt"); below("watches", "longsleeves", "a long sleeve partly covers a watch");
  below("tshirts", "chains", "a chain over a tee"); below("chains", "hoodies", "a hoodie partly covers a chain");
  below("jackets", "backpacks", "a backpack over outerwear"); below("backpacks", "scarves", "a scarf over bag straps");
  below("rings", "gloves", "gloves cover rings"); below("coats", "waistbags", "a waist bag over a coat");
  assert.equal(L.DRAW_ORDER.at(-1), "hat", "the hat goes on last");
  assert.equal(L.rankOf("wrist", 50) > L.rankOf("wrist"), true, "layerPriority nudges within a layer");
});

test("visibility rules: side views show the near side only, glasses vanish from the back, gloves hide rings", () => {
  const item = (slot, draw) => ({ slot, index: 0, zone: Z.zoneForSlot(slot), side: Z.SLOTS[slot].side, draw });
  const watchLeft = item("leftWrist", "wrist"), glasses = item("face", "glasses"), ring = item("rightHand", "rings"), gloves = item("gloves", "gloves");
  assert.equal(L.isVisible(watchLeft, "left", [watchLeft]), true);
  assert.equal(L.isVisible(watchLeft, "right", [watchLeft]), false, "the left wrist is behind the body from the right side");
  assert.equal(L.isVisible(watchLeft, "front", [watchLeft]), true);
  assert.equal(L.isVisible(glasses, "back", [glasses]), false); assert.equal(L.isVisible(glasses, "left", [glasses]), true);
  assert.equal(L.isVisible(ring, "front", [ring]), true); assert.equal(L.isVisible(ring, "front", [ring, gloves]), false);
  assert.equal(L.isVisible(item("back", "bag"), "front", []), true, "a backpack still shows its straps from the front");
});

test("placement data can differ by angle, build, and height, and stays an internal detail", () => {
  const spec = { offsetY: 2, scale: 1, byBuild: { plus: { scale: 1.1 } }, byHeight: [{ maxInches: 62, placement: { offsetY: -4 } }], byView: { back: { offsetX: 3 } } };
  assert.deepEqual(L.resolvePlacement(spec, { view: "front", build: "regular", height: 70 }), { offsetY: 2, scale: 1 });
  assert.deepEqual(L.resolvePlacement(spec, { view: "back", build: "plus", height: 60 }), { offsetY: -4, scale: 1.1, offsetX: 3 });
  assert.deepEqual(L.resolvePlacement(undefined, { view: "front", build: "regular", height: 70 }), {});
  assert.equal(L.placementWarp({}), null, "no placement, no change");
  const move = L.placementWarp({ offsetX: 5, offsetY: -2 });
  assert.deepEqual(move(100, 100), [105, 98]);
  const turn = L.placementWarp({ anchorX: 0, anchorY: 0, rotation: 90 });
  const [x, y] = turn(10, 0); assert.ok(Math.abs(x) < 1e-9 && Math.abs(y - 10) < 1e-9);
});

test("accessories get their own sizing, not clothing fit guidance", () => {
  const p = profile({ height: 70, weight: 170, measurements: { chest: 40, waist: 33 } });
  assert.equal(F.recommendSize(find("field-watch"), p).status, "none");
  const ring = F.recommendSize(find("band-ring"), p);
  assert.equal(ring.status, "none"); assert.match(ring.why, /ring size/);
  assert.match(F.recommendSize(find("canvas-sneakers"), p).why, /shoe size/);
  assert.equal(F.recommendSize(find("idea-hoodie"), p).status, "best", "clothing still gets guidance");
  assert.equal(F.garmentRoom(find("web-belt"), "M", p), 1, "accessories don't change shape with size");
  assert.equal(P.detailsText(find("field-watch")), "Fits wrists 6–8 in · Adjustable strap");
  assert.equal(P.detailsText(find("day-backpack")), "17 × 12 × 6 in · Adjustable padded straps");
  assert.equal(P.detailsText(find("cuff-beanie")), "Stretch knit, fits most", "only measurements get a \"Fits\" prefix");
  assert.equal(P.categoryOf("rings").sizeName, "Ring size (US)");
});

test("mannequin type: female has narrower shoulders, a more defined waist, and fuller hips; male stays the default", () => {
  assert.equal(F.DEFAULT_PROFILE.bodyType, "male");
  assert.deepEqual(F.BODY_TYPES.map(b => b.name), ["Male", "Female"]);
  for (const build of ["slim", "regular", "broad", "plus"]) {
    const male = B.shapeFor(profile({ build, height: 66, weight: 150 })), female = B.shapeFor(profile({ build, bodyType: "female", height: 66, weight: 150 }));
    assert.ok(female.shoulders < male.shoulders, `${build}: shoulders`);
    assert.ok(female.waist < male.waist, `${build}: waist`);
    assert.ok(female.hips > male.hips, `${build}: hips`);
    assert.equal(female.scale, male.scale, "type never changes height");
  }
  // Builds still apply to a female mannequin.
  const f = build => B.shapeFor(profile({ build, bodyType: "female" }));
  assert.ok(f("slim").chest < f("regular").chest && f("regular").waist < f("plus").waist && f("broad").shoulders > f("regular").shoulders);
  // Gentle: no part more than about 12% off the male shape at the same size.
  const m = B.shapeFor(profile({ height: 70, weight: 154 })), w = B.shapeFor(profile({ bodyType: "female", height: 70, weight: 154 }));
  for (const k of ["shoulders", "chest", "waist", "hips"]) assert.ok(Math.abs(w[k] / m[k] - 1) <= 0.12, `${k}: ${w[k]} vs ${m[k]}`);
});

test("mannequin type picks a women's chart only when a product has one, and never overrides measurements", () => {
  const body = { height: 66, weight: 140, measurements: { chest: 38 } };
  const male = rec("logo-tee", body), female = rec("logo-tee", { ...body, bodyType: "female" });
  assert.equal(male.status, "best"); assert.equal(female.status, "best");
  assert.match(female.why, /women’s sample size chart/); assert.doesNotMatch(male.why, /women/);
  assert.notEqual(male.size, female.size, "the women's cut is closer, so the same chest suggests a larger size");
  // No separate women's chart: the same chart, and with a measurement the same answer.
  assert.equal(rec("idea-hoodie", body).size, rec("idea-hoodie", { ...body, bodyType: "female" }).size);
  assert.doesNotMatch(rec("idea-hoodie", { ...body, bodyType: "female" }).why, /women/);
});

test("Very Light is the lightest tone, not white, and tone is visual only", () => {
  assert.deepEqual(F.TONES.map(t => t.name), ["Very Light", "Light", "Medium", "Brown", "Dark"]);
  const lum = hex => { const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const [veryLight, light] = F.TONES;
  assert.ok(lum(veryLight.fill) > lum(light.fill) + 0.1, "noticeably lighter than Light");
  assert.notEqual(veryLight.fill.toLowerCase(), "#ffffff");
  const contrast = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  assert.ok(contrast(veryLight.edge, "#f6f6f4") >= 2.5, "its outline stands out on the stage");
  assert.equal(F.toneOf("brown").name, "Brown");
  const body = { height: 64, weight: 130, bodyType: "female", measurements: { waist: 29 } };
  for (const id of P.products.map(p => p.id)) assert.equal(new Set(F.TONES.map(t => JSON.stringify(rec(id, { ...body, tone: t.id })))).size, 1);
  assert.deepEqual(B.shapeFor(profile({ ...body, tone: "veryLight" })), B.shapeFor(profile({ ...body, tone: "dark" })));
});

// ---------- Scene and Full Look ----------

const S = await import("./scene.ts");
const { ROOM_STAGE: V_ROOM } = await import("./view.ts");
const E = await import("./env.ts");
const art = id => P.sceneProducts.find(p => p.id === id);

test("scene products are their own kind, with real sizes, prices by size, and the same store fields", () => {
  assert.ok(P.products.every(p => p.kind === "wearable"));
  for (const p of P.sceneProducts) {
    assert.equal(p.kind, "scene");
    for (const key of ["id", "name", "category", "price", "image", "colors", "sizes", "sceneSizes", "provider", "affiliateUrl", "shopifyProductId", "shopifyVariantId"]) assert.ok(key in p, `${p.id} missing ${key}`);
    assert.deepEqual(p.sizes, p.sceneSizes.map(s => s.size));
    assert.equal(p.price, Math.min(...p.sceneSizes.map(s => s.price)), "the listed price is the lowest (from)");
    assert.ok(P.sceneCategoryOf(p.category).available);
  }
  assert.deepEqual(P.SCENE_CATEGORIES.filter(c => !c.available).map(c => c.name), ["Mugs", "Tote bags", "Decor"], "later, not faked");
  // An 18×24 poster is drawn at real size next to the 70 in mannequin.
  const { w, h } = S.dimensions(art("scattered-poster"), "18×24 in");
  assert.ok(Math.abs(w / S.UNITS_PER_INCH - 18) < 1e-9 && Math.abs(h / S.UNITS_PER_INCH - 24) < 1e-9);
});

test("wall art: add, move, resize, recolor, change, remove, and it stays on the wall", () => {
  const poster = art("scattered-poster"), framed = art("idea-framed");
  let items = S.addItem([], poster, true);
  assert.equal(items.length, 1); assert.equal(items[0].size, "18×24 in", "starts at the middle size");
  assert.ok(items[0].x > 300, "in Full Look it hangs beside the mannequin, not on it");
  items = S.addItem(items, framed, true);
  assert.notEqual(items[0].key, items[1].key); assert.ok(Math.hypot(items[0].x - items[1].x, items[0].y - items[1].y) > 70, "a second piece gets its own spot");
  const moved = S.updateItem(items, items[0].key, poster, { x: 5000, y: -5000 });
  const { w, h } = S.dimensions(poster, moved[0].size);
  assert.ok(moved[0].x + w / 2 <= V_ROOM.x + V_ROOM.width && moved[0].y - h / 2 >= V_ROOM.y, "dragging past the edge stops at the wall's edge");
  const floorTry = S.updateItem(items, items[0].key, poster, { y: 2000 });
  assert.ok(floorTry[0].y + h / 2 <= B.FLOOR, "art never goes below the floor line");
  assert.equal(S.stepSize(poster, "18×24 in", 1), "24×36 in"); assert.equal(S.stepSize(poster, "24×36 in", 1), "24×36 in"); assert.equal(S.stepSize(poster, "12×18 in", -1), "12×18 in");
  const bigger = S.updateItem(items, items[1].key, framed, { size: "24×32 in", color: "Oak frame" });
  assert.equal(bigger[1].size, "24×32 in"); assert.equal(bigger[1].color, "Oak frame");
  const changed = S.replaceItem(bigger, bigger[1].key, poster);
  assert.equal(changed[1].productId, "scattered-poster"); assert.equal(changed[1].size, "18×24 in", "a size the new product doesn't come in falls back to its middle size");
  assert.equal(changed[1].key, bigger[1].key, "CHANGE keeps its place");
  assert.deepEqual(S.removeItem(changed, changed[0].key).map(i => i.key), [changed[1].key]);
});

test("wall art prices by size and goes in the same cart as clothing", () => {
  let items = S.addItem([], art("idea-framed"), false);
  items = S.updateItem(items, items[0].key, art("idea-framed"), { size: "24×32 in" });
  items = S.addItem(items, art("scattered-poster"), false);
  assert.equal(S.sceneTotal(items, P.sceneProducts), 9500 + 2400);
  const lines = S.sceneToCartLines(items, P.sceneProducts);
  assert.deepEqual(lines.map(l => [l.kind, l.productId, l.color, l.size, l.price, l.quantity]), [["scene", "idea-framed", "Black frame", "24×32 in", 9500, 1], ["scene", "scattered-poster", "Matte paper", "18×24 in", 2400, 1]]);
  const wearables = O.outfitToCartLines(O.wear({}, find("dad-hat")), P.products);
  assert.equal(wearables[0].kind, "wearable");
  for (const l of [...lines, ...wearables]) for (const key of ["provider", "shopifyProductId", "shopifyVariantId", "size", "color", "quantity"]) assert.ok(key in l);
});

test("environment presets: the requested colors, dark ones flagged so outlines turn light", () => {
  for (const name of ["White", "Black", "Gray", "Red", "Cream"]) assert.ok(E.WALLS.some(w => w.name === name), name);
  assert.equal(E.isDark(E.wallOf("black").hex), true); assert.equal(E.isDark(E.wallOf("red").hex), true);
  assert.equal(E.isDark(E.wallOf("white").hex), false); assert.equal(E.isDark(E.wallOf("cream").hex), false);
  assert.ok(E.FLOORS.length >= 2); assert.equal(E.DEFAULT_ENVIRONMENT.wall, "white");
});

test("switching to Full Look moves art out from behind the mannequin, and leaves the rest alone", () => {
  let items = S.addItem([], art("scattered-poster"), false);
  items = S.updateItem(items, items[0].key, art("scattered-poster"), { x: -150, y: 200 });
  items = S.addItem(items, art("idea-framed"), false);
  assert.ok(Math.abs(items[1].x - 150) < 1, "hung in the middle of the wall in Scene mode");
  const look = S.clearOfMannequin(items, P.sceneProducts);
  assert.deepEqual(look[0], items[0], "art already beside the mannequin stays put");
  const { w } = S.dimensions(art("idea-framed"), look[1].size);
  assert.ok(look[1].x - w / 2 >= 280 || look[1].x + w / 2 <= 20, `moved beside the mannequin: ${look[1].x}`);
  assert.ok(Math.hypot(look[1].x - look[0].x, look[1].y - look[0].y) > 70, "and not on top of the other piece");
});

test("builder tee keeps separate artwork through recoloring, cart and serialization", async () => {
  const { classicTee, garments } = await import("./garment-models.ts");
  assert.equal(garments.length, 1);
  assert.deepEqual(Object.keys(classicTee.views).sort(), ["back", "front", "left", "right"]);
  assert.deepEqual([...new Set(P.products.filter(p => p.garmentId).map(p => p.garmentId))], [classicTee.id]);
  const tee = find("logo-tee");
  const plain = O.wear({}, tee);
  assert.equal(one(plain, "base").designId, undefined);
  const printed = O.update(plain, "base", { designId: "pain-got-frequency", printZone: "front", size: "L" });
  const white = O.wear(printed, tee, "White");
  assert.equal(one(white, "base").designId, "pain-got-frequency");
  assert.equal(one(white, "base").size, "L");
  assert.deepEqual(O.decodeOutfit(O.encodeOutfit(white), P.products), white);
  assert.equal(O.outfitToCartLines(white, P.products)[0].designId, "pain-got-frequency");
  assert.equal(one(O.wear(white, find("long-sleeve")), "base").designId, undefined);
  const invalid = O.encodeOutfit(white).replace("pain-got-frequency", "unknown-art");
  assert.equal(one(O.decodeOutfit(invalid, P.products), "base").designId, undefined);
});

test("local Printful catalog item uses color mockups only for browsing and one existing garment", async () => {
  const { existsSync } = await import("node:fs");
  const { classicTee, garments } = await import("./garment-models.ts");
  const product = find("i-renamed-the-pain");
  assert.equal(product.name, "I RENAMED THE PAIN");
  assert.equal(product.provider, "Printful");
  assert.equal(product.productModel, "Unisex classic tee");
  assert.equal(product.printingMethod, "DTG");
  assert.equal(product.localOnly, true);
  assert.equal(product.priceKind, "demo");
  assert.equal(P.productPriceLabel(product), "$28.00");
  assert.deepEqual(product.sizes, ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"]);
  assert.deepEqual(product.colors.map(c => c.name), ["Black", "Maroon"]);
  assert.equal(garments.length, 1);
  assert.equal(product.garmentId, classicTee.id);
  for (const color of product.colors) {
    const filename = color.name === "Black" ? "unisex-classic-tee-black-front-6abc103a5d2c3.png" : "unisex-classic-tee-maroon-front-6abc103a5d2fe.png";
    const preview = P.productPreviewImage(product, color.name);
    assert.equal(preview, `/outfit-builder/products/printful/${filename}`);
    assert.ok(existsSync(new URL(`../../../public${preview}`, import.meta.url)));
    assert.ok(classicTee.colors.some(c => c.name === color.name && c.hex === color.hex));
  }
  assert.ok(product.sizes.every(size => classicTee.sizes.includes(size)));
  for (const { id } of P.VIEWS) assert.equal(P.imageFor(product, id), "", "mockups never enter mannequin view assets");
  assert.equal(P.productPreviewImage(product), P.productPreviewImage(product, "Black"));
  assert.equal(P.productPreviewImage(find("logo-tee"), "Black"), "", "drawn previews remain supported");
  assert.equal(product.sizeChart, null, "no fabricated supplier chart");
  assert.equal(product.shopifyProductId, "");
});

test("local Printful item preserves chosen artwork and size when switching colors, including plain", () => {
  const product = find("i-renamed-the-pain");
  let outfit = O.wear({}, product);
  assert.equal(one(outfit, "base").designId, "i-renamed-the-pain");
  assert.equal(one(outfit, "base").printZone, "front");
  outfit = O.update(outfit, "base", { size: "5XL" });
  outfit = O.wear(outfit, product, "Maroon");
  assert.deepEqual(one(outfit, "base"), { productId: product.id, color: "Maroon", size: "5XL", designId: "i-renamed-the-pain", printZone: "front" });
  assert.deepEqual(O.decodeOutfit(O.encodeOutfit(outfit), P.products), outfit);
  const line = O.outfitToCartLines(outfit, P.products)[0];
  assert.equal(line.provider, "Printful"); assert.equal(line.color, "Maroon"); assert.equal(line.size, "5XL");
  outfit = O.update(outfit, "base", { designId: undefined });
  outfit = O.wear(outfit, product, "Black");
  assert.equal(one(outfit, "base").designId, undefined, "plain choice survives recoloring/reselecting");
  assert.equal(one(outfit, "base").size, "5XL");
});

test("Printful artwork is product-specific, with no frequency choice or decoded cross-product design", async () => {
  const { designsForProduct, designOf } = await import("./designs.ts");
  const { readFileSync } = await import("node:fs");
  const product = find("i-renamed-the-pain"), sample = find("logo-tee");
  assert.deepEqual(designsForProduct(product).map(d => d.id), ["i-renamed-the-pain"]);
  assert.deepEqual(designsForProduct(sample).map(d => d.id), ["pain-got-frequency"]);
  const design = designOf(product.defaultDesignId);
  for (const asset of [design.blackArtwork, design.whiteArtwork]) {
    const svg = readFileSync(new URL(`../../../public${asset}`, import.meta.url), "utf8");
    assert.deepEqual([...svg.matchAll(/<text\b[^>]*>([^<]+)<\/text>/g)].map(m => m[1]), ["I RENAMED", "THE", "PAIN."]);
    assert.doesNotMatch(svg, /<image|FREQUENCY/);
  }
  const old = O.update(O.wear({}, sample), "base", { designId: "pain-got-frequency", printZone: "front" });
  const selected = O.wear(old, product);
  assert.equal(one(selected, "base").designId, "i-renamed-the-pain", "switching catalog items loads the new default");
  const invalid = O.encodeOutfit(O.update(selected, "base", { designId: "pain-got-frequency" }));
  assert.equal(one(O.decodeOutfit(invalid, P.products), "base").designId, undefined);
});

// ---------- Realistic person ----------

test("person photos: WebP before PNG, side photos need their near-arm cut-out, left falls back to right", async () => {
  const Pe = await import("./person.ts");
  assert.deepEqual(Pe.personFileNames("front", "base"), ["front.webp", "front.png"]);
  assert.deepEqual(Pe.personFileNames("right", "foreground"), ["right-foreground.webp", "right-foreground.png"]);
  assert.equal(Pe.personFor(undefined, "front"), undefined, "no photos: every angle stays drawn");
  const front = { base: "/f.png" }, right = { base: "/r.png", foreground: "/rf.png" };
  assert.equal(Pe.personFor({ front }, "front"), front);
  assert.equal(Pe.personFor({ front }, "back"), undefined);
  assert.equal(Pe.personFor({ right: { base: "/r.png" } }, "right"), undefined, "a side photo without its arm cut-out isn't used");
  assert.equal(Pe.personFor({ right }, "right"), right);
  assert.equal(Pe.personFor({ right }, "left"), right, "left uses the right photo, mirrored");
  const left = { base: "/l.png", foreground: "/lf.png" };
  assert.equal(Pe.personFor({ right, left }, "left"), left);
});
