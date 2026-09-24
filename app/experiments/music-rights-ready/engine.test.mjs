import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

// The engine imports sibling files without extensions (bundler style); resolve them to .ts here.
registerHooks({ resolve: (specifier, context, next) => { try { return next(specifier, context); } catch (error) { if (specifier.startsWith(".")) return next(`${specifier}.ts`, context); throw error; } } });
const { checklistText, counts, emptyState, masterSplits, notesFor, parseSaved, parseShare, serialize, songSplits, statusOf, writesSong } = await import("./engine.ts");
const { items, officialLinks } = await import("./content.ts");

let n = 0;
const person = (name, roles, extra = {}) => ({ id: `p${n++}`, name, roles, sharesSong: false, songShare: "", pro: "", publishing: "", ...extra });
const withPeople = (people, more = {}) => ({ ...emptyState(), song: { title: "Night Drive", artist: "Maya Lane", released: "unreleased", date: "" }, people, ...more });

test("shares parse exactly in hundredths of a percent", () => {
  assert.equal(parseShare("50"), 5000);
  assert.equal(parseShare("33.33"), 3333);
  assert.equal(parseShare("12.5%"), 1250);
  assert.equal(parseShare("100"), 10000);
  for (const bad of ["", "abc", "-5", "101", "12.345", "1e2"]) assert.equal(parseShare(bad), null, bad);
});

test("one songwriter at 100% is complete", () => {
  const check = songSplits(withPeople([person("Maya Lane", ["Songwriter"], { songShare: "100" })]));
  assert.deepEqual([check.ok, check.message], [true, "Adds up to 100%."]);
});

test("several songwriters: exact 100% with thirds, and a clear warning when it isn't 100%", () => {
  const thirds = songSplits(withPeople([person("A", ["Songwriter"], { songShare: "33.33" }), person("B", ["Composer"], { songShare: "33.33" }), person("C", ["Songwriter"], { songShare: "33.34" })]));
  assert.equal(thirds.ok, true);
  const short = songSplits(withPeople([person("A", ["Songwriter"], { songShare: "50" }), person("B", ["Songwriter"], { songShare: "40" })]));
  assert.deepEqual([short.ok, short.message], [false, "These add up to 90%, not 100%."]);
  const over = songSplits(withPeople([person("A", ["Songwriter"], { songShare: "60" }), person("B", ["Songwriter"], { songShare: "60.5" })]));
  assert.equal(over.message, "These add up to 120.5%, not 100%.");
  const missing = songSplits(withPeople([person("A", ["Songwriter"], { songShare: "50" }), person("B", ["Songwriter"])]));
  assert.equal(missing.message, "B has no share yet. Entered shares add up to 50%.");
  assert.match(songSplits(withPeople([person("A", ["Songwriter"], { songShare: "fifty" })])).message, /numbers from 0 to 100/);
  assert.equal(songSplits(withPeople([])).message, "No songwriters added yet.");
});

test("producers and featured artists are not songwriters unless the user says so", () => {
  const producer = person("DJ Kilo", ["Producer"], { songShare: "25" }), featured = person("Rae", ["Featured artist"]);
  const state = withPeople([person("Maya Lane", ["Songwriter"], { songShare: "100" }), producer, featured]);
  assert.equal(writesSong(producer), false);
  assert.equal(songSplits(state).ok, true, "the producer's typed share is ignored while they aren't a songwriter");
  const cowriting = withPeople([person("Maya Lane", ["Songwriter"], { songShare: "75" }), { ...producer, sharesSong: true }]);
  assert.equal(songSplits(cowriting).ok, true);
  assert.match(notesFor("master", state).join(" "), /Producer: DJ Kilo\. Write down whether they own part of the recording, get points, or were paid a fee/);
  assert.match(notesFor("releaseDetails", state).join(" "), /Credit featured artist the same way everywhere: Rae/);
});

test("the recording is tracked separately from the song", () => {
  const state = withPeople([person("Maya Lane", ["Songwriter"], { songShare: "100" })], { owners: [{ id: "o1", name: "Maya Lane", share: "60" }, { id: "o2", name: "Night Owl Records LLC", share: "40" }] });
  assert.equal(masterSplits(state).ok, true);
  assert.equal(masterSplits({ ...state, owners: [{ id: "o1", name: "Maya", share: "70" }] }).message, "These add up to 70%, not 100%.");
  assert.deepEqual(notesFor("master", { ...state, ownersNotSure: true }), ["You marked recording ownership as not sure yet."]);
});

test("Not sure answers are surfaced, never treated as done", () => {
  const state = withPeople([person("Maya", ["Songwriter"], { songShare: "100", pro: "Not sure", publishing: "Not sure" }), person("Jules", ["Not sure"])]);
  assert.match(notesFor("splits", state).join(" "), /Role not sure yet: Jules/);
  assert.deepEqual(notesFor("proJoin", state), ["No PRO confirmed yet for: Maya."]);
  assert.deepEqual(notesFor("publishing", state), ["Publishing not sure yet for: Maya."]);
  assert.deepEqual(notesFor("proJoin", withPeople([person("Maya", ["Songwriter"], { pro: "BMI" })])), ["Every songwriter you listed has a PRO recorded."]);
});

test("released and unreleased songs", () => {
  const unreleased = withPeople([]), released = { ...unreleased, song: { ...unreleased.song, released: "released", date: "2026-05-01" } };
  assert.deepEqual(notesFor("proRegister", unreleased), []);
  assert.match(notesFor("proRegister", released)[0], /already released/);
  assert.match(checklistText(released), /Status: Already released\nRelease date: 2026-05-01/);
  assert.match(checklistText(unreleased), /Status: Not released yet/);
});

test("the checklist is fixed at 12 items with simple statuses and no score", () => {
  assert.equal(items.length, 12);
  const state = { ...emptyState(), statuses: { splits: "Done", isrc: "Not applicable", upc: "Not sure", master: "In progress" } };
  assert.equal(statusOf(state, "copyright"), "Not started");
  assert.deepEqual(counts(state), { "Not started": 8, "In progress": 1, Done: 1, "Not applicable": 1, "Not sure": 1 });
  const text = checklistText(state);
  assert.doesNotMatch(text, /\d+%\s*(ready|complete)|legally cleared|fully protected|guaranteed/i);
  assert.match(text, /“Done” means you marked the task complete\./);
});

test("content has no prices, fees, or revenue shares, and every link is an official https site", () => {
  const all = JSON.stringify(items);
  assert.doesNotMatch(all, /\$\s?\d|\d+\s?%\s?(fee|cut|commission)|per year|\/year/i);
  for (const item of items) for (const id of item.links ?? []) assert.ok(officialLinks.some(link => link.id === id), id);
  for (const link of officialLinks) assert.match(link.url, /^https:\/\//);
});

test("saved progress round-trips and anything malformed is ignored", () => {
  const state = withPeople([person("Maya", ["Songwriter", "Producer"], { songShare: "100", pro: "ASCAP" })], { owners: [{ id: "o", name: "Maya", share: "100" }], statuses: { splits: "Done" } });
  const restored = parseSaved(serialize(state, "2026-09-23T12:00:00.000Z"));
  assert.deepEqual(restored.state, state);
  assert.equal(restored.savedAt, "2026-09-23T12:00:00.000Z");
  for (const bad of [null, "", "not json", "{}", JSON.stringify({ version: 2, state })]) assert.equal(parseSaved(bad), null);
  const tampered = parseSaved(JSON.stringify({ version: 1, state: { people: [{ name: "X", roles: ["Hacker", "Producer"], pro: "EvilPRO" }], statuses: { splits: "Totally cleared", bogus: "Done" } } }));
  assert.deepEqual(tampered.state.people[0].roles, ["Producer"]);
  assert.equal(tampered.state.people[0].pro, "");
  assert.deepEqual(tampered.state.statuses, {});
});

test("the plain-text checklist includes the song, people, both kinds of ownership, every item, links and the disclaimer", () => {
  const state = withPeople([person("Maya Lane", ["Songwriter"], { songShare: "70", pro: "BMI" }), person("Theo", ["Composer"], { songShare: "30" }), person("DJ Kilo", ["Producer"])], { owners: [{ id: "o", name: "Maya Lane", share: "100" }] });
  const text = checklistText(state, new Date(2026, 8, 23));
  for (const part of ["MUSIC RIGHTS READY: Night Drive", "Created September 23, 2026", "- Maya Lane: 70%", "- Theo: 30%", "THE RECORDING (MASTER)", "- Maya Lane: 100%", "[Not started] Agree on the songwriting splits", "Note: No PRO confirmed yet for: Theo.", "https://www.copyright.gov/registration/", "not legal or financial advice"]) assert.ok(text.includes(part), part);
  assert.equal(items.every(item => text.includes(item.title)), true);
});
