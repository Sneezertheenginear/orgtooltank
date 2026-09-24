import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

// The engine imports sibling files without extensions (bundler style); resolve them to .ts here.
registerHooks({ resolve: (specifier, context, next) => { try { return next(specifier, context); } catch (error) { if (specifier.startsWith(".")) return next(`${specifier}.ts`, context); throw error; } } });
const { applyFilter, byUrgency, callsCsv, daysUntil, formatAmount, markOutstanding, markPaid, parseAmount, parseSaved, relativeDue, serializeSaved, sum, summary, urgency } = await import("./engine.ts");
const { demoCalls } = await import("./demo.ts");

const TODAY = "2026-09-24";
const call = (over = {}) => ({ id: "c", fund: "Fund III", entity: "Family Trust", amount: 1000, due: "2026-10-01", notice: "", notes: "", status: "Outstanding", ...over });

test("amounts are read as real numbers, rounded to cents", () => {
  assert.equal(parseAmount("250000"), 250000);
  assert.equal(parseAmount("$250,000.50"), 250000.5);
  assert.equal(parseAmount(" 1,234.5 "), 1234.5);
  for (const bad of ["", "abc", "-5", "0", "1.234", "12e3", "1,2,3.456"]) assert.equal(parseAmount(bad), null, bad);
  assert.equal(formatAmount(1234.5), "$1,234.50");
});

test("totals add in cents without floating-point drift", () => {
  assert.equal(sum([0.1, 0.2]), 0.3);
  assert.equal(sum([48500.5, 0.25, 0.25]), 48501);
});

test("urgency comes from the due date; due soon is today through 30 days", () => {
  assert.equal(urgency(call({ due: "2026-09-23" }), TODAY), "Overdue");
  assert.equal(urgency(call({ due: TODAY }), TODAY), "Due soon");
  assert.equal(urgency(call({ due: "2026-10-24" }), TODAY), "Due soon");
  assert.equal(urgency(call({ due: "2026-10-25" }), TODAY), "Later");
  assert.equal(urgency(call({ due: "2026-01-01", status: "Paid" }), TODAY), "Paid");
  assert.equal(daysUntil("2026-10-24", TODAY), 30);
  assert.equal(relativeDue("2026-09-22", TODAY), "2 days overdue");
  assert.equal(relativeDue(TODAY, TODAY), "Due today");
});

test("the list sorts overdue, due soon, later, then paid", () => {
  const list = [
    call({ id: "paid-old", due: "2026-01-01", status: "Paid" }), call({ id: "later", due: "2027-01-01" }),
    call({ id: "soon-2", due: "2026-10-10" }), call({ id: "over", due: "2026-09-01" }),
    call({ id: "soon-1", due: "2026-09-30" }), call({ id: "paid-new", due: "2026-08-01", status: "Paid" }),
  ];
  assert.deepEqual(byUrgency(list, TODAY).map(c => c.id), ["over", "soon-1", "soon-2", "later", "paid-new", "paid-old"]);
});

test("filters: all, outstanding (including overdue), and due soon only", () => {
  const list = [call({ id: "over", due: "2026-09-01" }), call({ id: "soon" }), call({ id: "later", due: "2027-01-01" }), call({ id: "paid", status: "Paid" })];
  assert.equal(applyFilter(list, "All", TODAY).length, 4);
  assert.deepEqual(applyFilter(list, "Outstanding", TODAY).map(c => c.id), ["over", "soon", "later"]);
  assert.deepEqual(applyFilter(list, "Due soon", TODAY).map(c => c.id), ["soon"]);
});

test("summary: outstanding total, overdue count, and amount due in the next 30 days", () => {
  const list = [call({ amount: 100.1, due: "2026-09-01" }), call({ amount: 200.2 }), call({ amount: 300, due: "2027-01-01" }), call({ amount: 5000, status: "Paid", paidOn: TODAY })];
  const s = summary(list, TODAY);
  assert.equal(s.outstandingTotal, 600.3);
  assert.equal(s.outstandingCount, 3);
  assert.equal(s.overdueCount, 1);
  assert.equal(s.overdueTotal, 100.1);
  assert.equal(s.dueSoonTotal, 200.2);
  assert.equal(s.dueSoonCount, 1);
});

test("mark paid records the date; marking outstanding again removes it", () => {
  const paid = markPaid(call(), TODAY);
  assert.equal(paid.status, "Paid");
  assert.equal(paid.paidOn, TODAY);
  const back = markOutstanding(paid);
  assert.equal(back.status, "Outstanding");
  assert.equal("paidOn" in back, false);
});

test("saved data round-trips and rejects anything malformed", () => {
  const list = [call(), call({ id: "p", status: "Paid", paidOn: TODAY, amount: 12.5 })];
  assert.deepEqual(parseSaved(serializeSaved(list)), list);
  assert.equal(parseSaved(null), null);
  assert.equal(parseSaved("not json"), null);
  assert.equal(parseSaved(JSON.stringify({ version: 2, calls: list })), null);
  for (const bad of [{ amount: "1000" }, { amount: -1 }, { fund: " " }, { entity: "" }, { due: "2026-02-30" }]) {
    assert.equal(parseSaved(serializeSaved([call(bad)])), null, JSON.stringify(bad));
  }
  const cleaned = parseSaved(JSON.stringify({ version: 1, calls: [{ ...call(), paidOn: TODAY, extra: "x" }] }));
  assert.deepEqual(cleaned, [call()]);
});

test("CSV: most urgent first, plain-number amounts, and spreadsheet-safe text", () => {
  const csv = callsCsv([call({ id: "later", fund: "Later Fund", due: "2027-01-01" }), call({ fund: "=HYPERLINK(\"x\")", notes: "line one\nline two", amount: 250000.5, due: "2026-09-01" })], TODAY);
  const lines = csv.replace(/^\uFEFF/, "").split("\r\n");
  assert.equal(lines[0], "Fund / Deal,Investing entity,Amount (USD),Due date,Urgency,Status,Paid date,Notice reference,Notes");
  assert.match(lines[1], /^"'=HYPERLINK\(""x""\)",Family Trust,250000\.50,2026-09-01,Overdue,Outstanding,,,"line one/);
  assert.ok(csv.startsWith("\uFEFF"));
});

test("demo data shows every state and is valid saved data", () => {
  const demo = demoCalls(new Date(2026, 8, 24));
  const states = new Set(demo.map(c => urgency(c, TODAY)));
  for (const state of ["Overdue", "Due soon", "Later", "Paid"]) assert.ok(states.has(state), state);
  assert.deepEqual(parseSaved(serializeSaved(demo)), demo);
});
