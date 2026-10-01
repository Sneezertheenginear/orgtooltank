import assert from "node:assert/strict";
import { test } from "node:test";

const E = await import("./engine.ts");
const { exampleLoads } = await import("./demo.ts");
const now = new Date(2026, 8, 28, 10, 0);
const today = "2026-09-28";
const draft = over => ({ ...E.emptyDraft(), loadNumber: "100", deliveredDate: "2026-09-25", carrier: "Test Carrier", amount: "1250", nextFollowUp: "2026-09-29", ...over });
const make = over => E.createLoad(E.validateDraft(draft(over), [], null).fields, now);

test("amounts are parsed to whole cents without rounding errors", () => {
  assert.equal(E.parseAmountCents("1250"), 125000);
  assert.equal(E.parseAmountCents("$1,234.5"), 123450);
  assert.equal(E.parseAmountCents("0.1"), 10);
  assert.equal(E.parseAmountCents(".29"), 29);
  assert.equal(E.parseAmountCents("0"), 0);
  for (const bad of ["-5", "abc", "1.234", "", "1e5", "12..3"]) assert.equal(E.parseAmountCents(bad), null, bad);
  assert.equal(E.centsToDecimal(30), "0.30");
  assert.equal(E.formatMoney(10 + 20), "$0.30");
  assert.equal(E.formatMoney(123450), "$1,234.50");
});

test("validation: required fields, email format, amount, duplicate load numbers", () => {
  const empty = E.validateDraft(E.emptyDraft(), [], null).errors;
  assert.deepEqual(Object.keys(empty).sort(), ["amount", "carrier", "deliveredDate", "loadNumber", "nextFollowUp"]);
  assert.ok(E.validateDraft(draft({ contactEmail: "not-an-email" }), [], null).errors.contactEmail);
  assert.ok(E.validateDraft(draft({ contactEmail: "a@b.co" }), [], null).fields);
  assert.ok(E.validateDraft(draft({ amount: "-1" }), [], null).errors.amount);
  assert.equal(E.validateDraft(draft({ amount: "0" }), [], null).fields.amountCents, 0);
  const existing = make({ loadNumber: "ABC-1" });
  assert.match(E.validateDraft(draft({ loadNumber: " abc-1 " }), [existing], null).errors.loadNumber, /already/);
  // Editing a load may keep its own number.
  assert.ok(E.validateDraft(E.draftOf(existing), [existing], existing).fields);
});

test("an edited load past Chase doesn't need a follow-up date", () => {
  const ready = E.markReady(E.markReceived(make(), now), now);
  const result = E.validateDraft({ ...E.draftOf(ready), nextFollowUp: "" }, [ready], ready);
  assert.equal(result.fields.nextFollowUp, "");
});

test("logging a call or email sets the next follow-up two days from today and records it", () => {
  const load = { ...make(), nextFollowUp: "2026-09-20" };
  const called = E.logContact(load, "call", now);
  assert.equal(called.nextFollowUp, "2026-09-30");
  assert.match(called.history[0].text, /^Call logged/);
  assert.equal(E.logContact(load, "email", now).history[0].text.startsWith("Email logged"), true);
  assert.equal(called.history.length, 2);
});

test("snooze moves an overdue follow-up to tomorrow and a future one by a day", () => {
  assert.equal(E.snooze({ ...make(), nextFollowUp: "2026-09-20" }, now).nextFollowUp, "2026-09-29");
  assert.equal(E.snooze({ ...make(), nextFollowUp: today }, now).nextFollowUp, "2026-09-29");
  assert.equal(E.snooze({ ...make(), nextFollowUp: "2026-10-05" }, now).nextFollowUp, "2026-10-06");
  assert.equal(E.addDays("2026-12-31", 1), "2027-01-01");
});

test("received loads move to Review (not out of the workflow), then Ready to Bill", () => {
  const received = E.markReceived({ ...make(), nextFollowUp: "2026-09-20" }, now);
  assert.equal(received.status, "review");
  assert.equal(received.nextFollowUp, "");
  assert.equal(E.dueState(received, today), "none");
  assert.deepEqual(E.visible([received], "review", "").map(l => l.id), [received.id]);
  assert.deepEqual(E.visible([received], "missing", ""), []);
  const ready = E.markReady(received, now);
  assert.deepEqual(E.visible([ready], "ready", "").map(l => l.id), [ready.id]);
  assert.equal(E.moveBack(ready, now).status, "review");
  const back = E.moveBack(received, now);
  assert.equal(back.status, "missing");
  assert.equal(back.nextFollowUp, today);
  assert.deepEqual(ready.history.map(h => h.text.split(".")[0]), ["Marked ready to bill", "POD received", "Load created"]);
});

test("summary values and follow-up order on the example data", () => {
  const loads = exampleLoads(now);
  assert.deepEqual(E.summary(loads, today), { missing: 4, overdue: 1, dueToday: 1, readyCents: 358099 + 489000, readyCount: 2 });
  assert.equal(E.formatMoney(E.summary(loads, today).readyCents), "$8,470.99");
  assert.deepEqual(E.visible(loads, "missing", "").map(l => E.dueState(l, today)), ["overdue", "today", "upcoming", "upcoming"]);
  assert.deepEqual(E.visible(loads, "all", "").map(l => l.loadNumber).slice(0, 4), ["48217", "48204", "48198", "48186"]);
});

test("search matches load number or carrier, ignoring case", () => {
  const loads = exampleLoads(now);
  assert.deepEqual(E.visible(loads, "all", "4821").map(l => l.loadNumber), ["48217"]);
  assert.deepEqual(E.visible(loads, "all", "summit").map(l => l.loadNumber), ["48153"]);
  assert.deepEqual(E.visible(loads, "missing", "summit"), []);
});

test("CSV quotes commas, quotes, and newlines, guards formulas, and keeps exact amounts", () => {
  const load = { ...make({ carrier: 'Smith, "Big" Haul' }), contactName: "=HYPERLINK()", amountCents: 30 };
  const csv = E.loadsCsv([load], today);
  assert.ok(csv.startsWith("﻿Load #,Carrier"));
  assert.ok(csv.includes('"Smith, ""Big"" Haul"'));
  assert.ok(csv.includes(",'=HYPERLINK(),"));
  assert.ok(csv.includes(",0.30,"));
  assert.ok(csv.endsWith("\r\n"));
});

test("backups round-trip, and bad files are refused with a reason", () => {
  const loads = exampleLoads(now);
  assert.deepEqual(E.parseBackup(E.backupJson(loads, now)).loads, loads);
  assert.deepEqual(E.parseSaved(E.serializeSaved(loads)), loads);
  assert.match(E.parseBackup("nope").error, /valid JSON/);
  assert.match(E.parseBackup(JSON.stringify({ app: "other" })).error, /isn’t a POD Chaser backup/);
  assert.match(E.parseBackup(JSON.stringify({ app: E.BACKUP_APP, version: 1, loads: [loads[0], loads[0]] })).error, /damaged/);
  assert.match(E.parseBackup(JSON.stringify({ app: E.BACKUP_APP, version: 1, loads: [{ ...loads[0], amountCents: 12.5 }] })).error, /damaged/);
  const cleaned = E.parseLoads([{ ...loads[4], nextFollowUp: "2026-10-01", contactEmail: "bad", status: "weird" }]);
  assert.equal(cleaned[0].status, "missing");
  assert.equal(cleaned[0].contactEmail, "");
});

test("the follow-up email draft includes the load number and contact", () => {
  const url = E.followUpMailto(exampleLoads(now)[0]);
  assert.ok(url.startsWith("mailto:dispatch%40northline.example.com?subject=POD%20needed%20for%20load%20%2348217"));
  assert.ok(decodeURIComponent(url).includes("Hi Marcus Lee"));
});
