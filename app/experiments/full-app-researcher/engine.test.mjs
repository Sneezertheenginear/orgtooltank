import assert from "node:assert/strict";
import { test } from "node:test";

const { answeredCount, briefFileName, briefText, emptyIdea, exampleAnswers, exampleIdea, fields, focusResult, GUIDANCE_NOTE, hasContent, questions, results } = await import("./engine.ts");
const all = value => Object.fromEntries(questions.map(q => [q.id, value]));
const mix = (...values) => Object.fromEntries(questions.map((q, i) => [q.id, values[i]]));

test("five fields and five questions, each with a hint", () => {
  assert.equal(fields.length, 5);
  assert.equal(questions.length, 5);
  for (const item of [...fields, ...questions]) assert.ok(item.hint, item.id);
  for (const q of questions) assert.ok(q.text.endsWith("?"), q.id);
});

test("no result until all five questions are answered", () => {
  assert.equal(focusResult({}), null);
  assert.equal(focusResult({ "one-group": "yes" }), null);
  assert.equal(answeredCount({ "one-group": "yes", "one-job": "no" }), 2);
});

test("results follow the answers", () => {
  assert.equal(focusResult(all("yes")), "focused");
  assert.equal(focusResult(mix("yes", "yes", "yes", "yes", "unsure")), "focused");
  assert.equal(focusResult(mix("yes", "yes", "yes", "unsure", "unsure")), "narrow");
  assert.equal(focusResult(mix("yes", "no", "yes", "yes", "yes")), "narrow");
  assert.equal(focusResult(mix("no", "no", "yes", "yes", "yes")), "narrow");
  assert.equal(focusResult(mix("no", "no", "no", "yes", "yes")), "broad");
  assert.equal(focusResult(mix("no", "unsure", "unsure", "unsure", "yes")), "broad");
  assert.equal(focusResult(all("unsure")), "broad");
  assert.equal(focusResult(all("no")), "broad");
});

test("the brief includes every answer, the result, and the guidance note", () => {
  const text = briefText(exampleIdea(), exampleAnswers(), "2026-09-25");
  for (const f of fields) { assert.ok(text.includes(f.heading), f.id); assert.ok(text.includes(exampleIdea()[f.id]), f.id); }
  assert.ok(text.includes(`RESULT: ${results.focused.title}`));
  assert.ok(text.includes(GUIDANCE_NOTE));
  assert.equal((text.match(/ Yes$/gm) || []).length, 5);
  assert.ok(text.includes("2026-09-25"));
});

test("an unfinished brief says what’s missing", () => {
  const text = briefText(emptyIdea(), {}, "2026-09-25");
  assert.equal((text.match(/\(not written yet\)/g) || []).length, 5);
  assert.equal((text.match(/\(not answered\)/g) || []).length, 5);
  assert.match(text, /RESULT: Not finished/);
});

test("content detection and file names", () => {
  assert.equal(hasContent(emptyIdea()), false);
  assert.equal(hasContent({ ...emptyIdea(), who: "  " }), false);
  assert.equal(hasContent({ ...emptyIdea(), who: "Dog walkers" }), true);
  assert.equal(briefFileName(exampleIdea(), "2026-09-25"), "app-brief-see-which-clients-still-owe-for-2026-09-25.txt");
  assert.equal(briefFileName(emptyIdea(), "2026-09-25"), "app-brief-2026-09-25.txt");
});

test("wording is guidance, not a verdict on the idea", () => {
  const text = JSON.stringify({ results, GUIDANCE_NOTE, questions }).toLowerCase();
  assert.ok(GUIDANCE_NOTE.includes("not a score"));
  for (const phrase of ["bad idea", "good idea", "will succeed", "will fail", "score:"]) assert.ok(!text.includes(phrase), phrase);
});
