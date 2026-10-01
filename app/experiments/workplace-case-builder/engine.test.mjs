import assert from "node:assert/strict";
import { test } from "node:test";

const E = await import("./engine.ts");
const { exampleCase } = await import("./demo.ts");
const ids = c => E.missingPieces(c).map(check => check.id);
const words = n => Array.from({ length: n }, (_, i) => `word${i}`).join(" ");

test("a blank case asks for a description, employer, and timeline", () => {
  const c = E.blankCase();
  assert.ok(E.isEmptyCase(c));
  assert.deepEqual(ids(c), ["no-description", "no-employer", "no-events"]);
});

test("a short description is flagged; a fuller one isn’t", () => {
  const c = E.blankCase();
  c.basics.description = "Got fired.";
  assert.ok(ids(c).includes("short-description"));
  c.basics.description = words(E.SHORT_DESCRIPTION_WORDS);
  assert.ok(!ids(c).some(id => id.includes("description")));
});

test("the example shows each kind of gap it was built with, and nothing else", () => {
  assert.deepEqual(ids(exampleCase()), ["undated-events", "unclear-roles", "loose-evidence", "evidence-no-why", "actions-no-response"]);
});

test("a complete case has nothing to add", () => {
  const c = exampleCase();
  c.events[3].date = "2026-04-06";
  c.people[2].role = "HR";
  c.evidence[3].eventId = "ev-1"; c.evidence[3].why = "Shows the appointment dates.";
  c.actions[1].response = "No response yet";
  assert.deepEqual(E.missingPieces(c), []);
});

test("names in the timeline that aren’t in People are noticed, loosely", () => {
  const c = E.blankCase();
  c.events.push({ id: "1", date: "", title: "Meeting", people: "Dana Rivers, Sam and Lee Park; Pat", description: "" });
  c.people.push({ id: "p", name: "Dana", role: "Coworker", relationship: "" }, { id: "q", name: "Lee Park", role: "HR", relationship: "" });
  assert.deepEqual(E.unlistedNames(c), ["Sam", "Pat"]);
});

test("evidence connected to a deleted event counts as not connected", () => {
  const c = exampleCase();
  c.events = c.events.filter(e => e.id !== "ev-1");
  const loose = E.missingPieces(c).find(check => check.id === "loose-evidence");
  assert.match(loose.text, /^2 evidence items/);
});

test("timeline sorts oldest first with undated events last", () => {
  const sorted = E.byDate([{ date: "" , n: 1 }, { date: "2026-05-01", n: 2 }, { date: "2026-01-01", n: 3 }, { date: "", n: 4 }]);
  assert.deepEqual(sorted.map(e => e.n), [3, 2, 1, 4]);
});

test("summary has every section, in order, with the disclaimer and no scores", () => {
  const text = E.summaryText(exampleCase(), new Date(2026, 8, 28));
  const order = ["CASE BASICS", "WHAT HAPPENED", "TIMELINE", "PEOPLE", "EVIDENCE", "ACTIONS ALREADY TAKEN", "THINGS YOU MAY WANT TO ADD"].map(h => text.indexOf(`\n${h}\n`));
  assert.ok(order.every((at, i) => at > 0 && (i === 0 || at > order[i - 1])), order.join());
  assert.ok(text.includes(E.DISCLAIMER));
  assert.ok(text.includes("1. Mar 4, 2026 — Asked for a shift change"));
  assert.ok(text.includes("Related event: Not connected"));
  assert.ok(text.includes("Response: None recorded"));
  assert.doesNotMatch(text, /score|strong case|weak case|deadline|EEOC|you should file/i);
});

test("saved data round-trips and untrusted data is cleaned", () => {
  const c = exampleCase();
  assert.deepEqual(E.parseSaved(E.serializeSaved(c)), c);
  assert.equal(E.parseSaved("not json"), null);
  assert.equal(E.parseSaved(JSON.stringify({ version: 2, case: c })), null);
  const messy = E.parseCase({ basics: { federal: "Maybe", employer: 5 }, events: [{ date: "2026-02-31", title: "" }, null], people: [{ name: "A", role: "Boss" }], evidence: [{ type: "Video" }], actions: [{ action: "Sued" }] });
  assert.equal(messy.basics.federal, "");
  assert.equal(messy.basics.employer, "");
  assert.equal(messy.events.length, 1);
  assert.equal(messy.events[0].date, "");
  assert.equal(messy.events[0].title, "Untitled event");
  assert.equal(messy.people[0].role, "");
  assert.equal(messy.evidence[0].type, "Other record");
  assert.equal(messy.actions[0].action, "Other");
});
