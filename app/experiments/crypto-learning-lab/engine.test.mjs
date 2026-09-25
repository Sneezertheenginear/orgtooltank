import assert from "node:assert/strict";
import { test } from "node:test";

const { answeredCount, findings, glossary, questions, verdict } = await import("./engine.ts");
const all = value => Object.fromEntries(questions.map(q => [q.id, value]));
const safeAnswers = () => Object.fromEntries(questions.map(q => [q.id, q.warnWhen === "yes" ? "no" : "yes"]));

test("every question is complete and its glossary words exist", () => {
  assert.ok(questions.length >= 8 && questions.length <= 12);
  assert.equal(new Set(questions.map(q => q.id)).size, questions.length);
  const terms = new Set(glossary.map(g => g.id));
  for (const q of questions) {
    assert.ok(q.text.endsWith("?"), q.id);
    assert.ok(q.warning.title && q.warning.why && q.warning.next, q.id);
    for (const t of q.terms) assert.ok(terms.has(t), `${q.id} -> ${t}`);
  }
});

test("every glossary entry is used by at least one question", () => {
  const used = new Set(questions.flatMap(q => q.terms));
  for (const g of glossary) assert.ok(used.has(g.id), g.id);
});

test("only the warning answer raises a warning; Not sure asks to check first", () => {
  const q = questions.find(x => x.id === "network"); // warns on "No"
  assert.deepEqual(findings({ network: "yes" }), []);
  assert.equal(findings({ network: "no" })[0].kind, "warning");
  assert.equal(findings({ network: "unsure" })[0].kind, "check");
  assert.equal(q.warnWhen, "no");
});

test("serious warnings come first, then warnings, then things to check", () => {
  const answers = { "first-send": "yes", network: "unsure", "seed-phrase": "yes" };
  assert.deepEqual(findings(answers).map(f => f.question.id), ["seed-phrase", "first-send", "network"]);
});

test("the overall result never calls anything safe", () => {
  assert.equal(verdict({}), "not-started");
  assert.equal(verdict({ network: "yes" }), "in-progress");
  assert.equal(verdict({ network: "unsure" }), "check");
  assert.equal(verdict({ pressure: "yes" }), "caution");
  assert.equal(verdict({ pressure: "yes", guaranteed: "yes" }), "stop");
  assert.equal(verdict(safeAnswers()), "none-found");
  assert.equal(verdict(all("unsure")), "check");
  assert.equal(answeredCount(safeAnswers()), questions.length);
});

test("ordinary fees and approvals aren’t treated as scams on their own", () => {
  const fee = questions.find(q => q.id === "withdraw-fee"), approval = questions.find(q => q.id === "approval");
  assert.match(fee.hint, /Normal withdrawal or network fees/);
  assert.match(fee.text, /send more first/);
  assert.match(approval.hint, /is normal/);
  assert.match(approval.text, /don’t know or trust.*unlimited.*quickly/);
  for (const q of [fee, approval, questions.find(x => x.id === "guaranteed"), questions.find(x => x.id === "seed-phrase")]) assert.equal(q.severity, "stop", q.id);
});

test("wording stays educational: no price, trading, or safety promises", () => {
  const text = JSON.stringify({ questions, glossary }).toLowerCase();
  for (const phrase of ["is safe", "guaranteed safe", "buy now", "you should invest", "price target", "you will earn"]) assert.ok(!text.includes(phrase), phrase);
});
