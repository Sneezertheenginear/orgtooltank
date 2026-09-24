import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

// The engine imports sibling files without extensions (bundler style); resolve them to .ts here.
registerHooks({ resolve: (specifier, context, next) => { try { return next(specifier, context); } catch (error) { if (specifier.startsWith(".")) return next(`${specifier}.ts`, context); throw error; } } });
const E = await import("./engine.ts");
const { demoTracker } = await import("./demo.ts");
const { addMonths, backupJson, blankTracker, byUrgency, calendarEventCount, calendarIcs, counts, dateState, daysUntil, parseBackup, parseSaved, parseTracker, relativeDue, renew, serializeSaved, trackerCsv, undoRenewal } = E;

const TODAY = "2026-09-24";
const item = (over = {}) => ({ id: "i", title: "Permit", category: "License / Permit", due: "", status: "Current", owner: "", notes: "", repeatMonths: 0, ...over });

test("date states: no date, future, due soon, due today, overdue, not applicable", () => {
  assert.equal(dateState(item(), TODAY, 14), "No date");
  assert.equal(dateState(item({ due: "2026-12-01" }), TODAY, 14), "Upcoming");
  assert.equal(dateState(item({ due: "2026-10-08" }), TODAY, 14), "Due soon", "exactly 14 days away is inside the window");
  assert.equal(dateState(item({ due: "2026-10-09" }), TODAY, 14), "Upcoming", "15 days away is outside a 14-day window");
  assert.equal(dateState(item({ due: TODAY }), TODAY, 14), "Due soon");
  assert.equal(dateState(item({ due: "2026-09-23" }), TODAY, 14), "Overdue");
  assert.equal(dateState(item({ due: "2026-09-23", status: "Not applicable" }), TODAY, 14), "Not applicable");
  for (const status of ["Not started", "In progress", "Current"]) assert.equal(dateState(item({ due: "2026-09-01", status }), TODAY, 14), "Overdue", status);
  assert.deepEqual(["2026-09-25", TODAY, "2026-09-21", ""].map(d => relativeDue(d, TODAY)), ["In 1 day", "Due today", "3 days overdue", "No date"]);
});

test("changing the Due soon window from 14 to 7, 30 and 60 days", () => {
  const in20 = item({ due: "2026-10-14" });
  assert.deepEqual([7, 14, 30, 60].map(days => dateState(in20, TODAY, days)), ["Upcoming", "Upcoming", "Due soon", "Due soon"]);
  const in10 = item({ due: "2026-10-04" });
  assert.deepEqual([7, 14, 30, 60].map(days => dateState(in10, TODAY, days)), ["Upcoming", "Due soon", "Due soon", "Due soon"]);
});

test("day counts use calendar dates, including across daylight-saving changes", () => {
  assert.equal(daysUntil("2026-11-02", "2026-10-31"), 2);
  assert.equal(daysUntil("2026-03-09", "2026-03-07"), 2);
  assert.equal(daysUntil("2027-01-01", "2026-12-31"), 1);
});

test("most urgent first: overdue, due soon, upcoming by date, no date, then not applicable", () => {
  const items = [item({ id: "na", title: "N/A", due: "2026-09-01", status: "Not applicable" }), item({ id: "nodate", title: "No date" }), item({ id: "later", title: "Later", due: "2027-01-01" }), item({ id: "soon2", title: "Soon B", due: "2026-10-01" }), item({ id: "late", title: "Late", due: "2026-08-01" }), item({ id: "soon1", title: "Soon A", due: "2026-09-26" }), item({ id: "mid", title: "Mid", due: "2026-11-15" })];
  assert.deepEqual(byUrgency(items, TODAY, 14).map(i => i.id), ["late", "soon1", "soon2", "mid", "later", "nodate", "na"]);
});

test("counts: overdue, due soon, current (not flagged), in progress, not started", () => {
  const items = [item({ due: "2026-09-01" }), item({ due: "2026-09-30" }), item({ due: "2027-01-01" }), item({ status: "In progress", due: "2027-01-01" }), item({ status: "Not started" }), item({ status: "Not applicable", due: "2026-09-01" })];
  assert.deepEqual(counts(items, TODAY, 14), { overdue: 1, dueSoon: 1, current: 1, inProgress: 1, notStarted: 1 });
});

test("adding months clamps to the end of shorter months", () => {
  assert.equal(addMonths("2026-01-31", 1), "2026-02-28");
  assert.equal(addMonths("2028-01-31", 1), "2028-02-29");
  assert.equal(addMonths("2026-11-15", 3), "2027-02-15");
  assert.equal(addMonths("2026-06-30", 12), "2027-06-30");
  assert.equal(addMonths("2026-03-31", -1), "2026-02-28");
});

test("Mark Renewed moves to the next date, skips missed periods, marks it current, and can be undone", () => {
  const yearly = item({ due: "2026-10-01", status: "In progress", repeatMonths: 12 });
  const renewed = renew(yearly, TODAY);
  assert.deepEqual([renewed.due, renewed.status, renewed.renewed], ["2027-10-01", "Current", { on: TODAY, previousDue: "2026-10-01", previousStatus: "In progress" }]);
  const lateMonthly = item({ due: "2026-06-24", repeatMonths: 1 });
  assert.equal(renew(lateMonthly, TODAY).due, "2026-10-24", "three missed months are skipped");
  assert.equal(renew(item({ due: "2026-08-24", repeatMonths: 1 }), TODAY).due, "2026-10-24", "a renewal never lands on today");
  assert.equal(renew(item({ due: "2026-09-30", repeatMonths: 6 }), TODAY).due, "2027-03-30");
  assert.equal(renew(item({ due: "2026-09-30", repeatMonths: 18 }), TODAY).due, "2028-03-30", "custom months");
  assert.deepEqual(undoRenewal(renewed), yearly);
  assert.deepEqual(renew(item({ due: "2026-10-01" }), TODAY), item({ due: "2026-10-01" }), "items that don't repeat are unchanged");
  assert.deepEqual(renew(item({ repeatMonths: 12 }), TODAY), item({ repeatMonths: 12 }), "items with no date are unchanged");
});

test("saved data round-trips; anything malformed is ignored", () => {
  const tracker = { organization: "Acme", dueSoonDays: 30, items: [item({ id: "a", due: "2026-10-01", repeatMonths: 12, owner: "Sam", notes: "n" })] };
  assert.deepEqual(parseSaved(serializeSaved(tracker)), tracker);
  for (const bad of [null, "", "nope", "{}", JSON.stringify({ version: 2, tracker })]) assert.equal(parseSaved(bad), null);
  const cleaned = parseTracker({ organization: 5, dueSoonDays: 99, items: [{ id: "x", title: " Keep ", category: "Bogus", due: "2026-02-30", status: "Compliant!", repeatMonths: 999, extra: "dropped" }] });
  assert.deepEqual(cleaned, { organization: "", dueSoonDays: 14, items: [{ id: "x", title: "Keep", category: "Other", due: "", status: "Not started", owner: "", notes: "", repeatMonths: 0 }] });
  assert.equal(parseTracker({ items: [{ title: "  " }] }), null, "every item needs a title");
});

test("JSON backup restores exactly; wrong, damaged or foreign files are rejected with a reason", () => {
  const tracker = demoTracker(new Date(2026, 8, 24));
  const result = parseBackup(backupJson(tracker, new Date("2026-09-24T12:00:00Z")));
  assert.deepEqual(result.tracker, tracker);
  assert.match(parseBackup("not json").error, /isn’t valid JSON/);
  assert.match(parseBackup(JSON.stringify({ app: "something-else", version: 1, tracker })).error, /isn’t a Compliance Watch backup/);
  assert.match(parseBackup(JSON.stringify({ app: "orgtooltank-compliance-watch", version: 7, tracker })).error, /different version/);
  assert.match(parseBackup(JSON.stringify({ app: "orgtooltank-compliance-watch", version: 1, tracker: { items: "nope" } })).error, /damaged or incomplete/);
  assert.match(parseBackup(JSON.stringify({ app: "orgtooltank-compliance-watch", version: 1, tracker: { items: Array.from({ length: 501 }, () => ({ title: "x" })) } })).error, /up to 500/);
});

test("CSV export: urgency order, date status, and spreadsheet-safe cells", () => {
  const tracker = { organization: "=Acme, Inc.", dueSoonDays: 14, items: [item({ id: "b", title: "Later", due: "2027-01-01" }), item({ id: "a", title: "=HYPERLINK(\"x\")", due: "2026-09-01", repeatMonths: 12, notes: "line1\nline2" })] };
  const lines = trackerCsv(tracker, TODAY).replace(/^\uFEFF/, "").split("\r\n");
  assert.equal(lines[0], "Organization,Requirement,Category,Due or renewal date,Date status,Status,Responsible,Repeats,Last renewed,Notes");
  assert.equal(lines[1], `"'=Acme, Inc.","'=HYPERLINK(""x"")",License / Permit,2026-09-01,Overdue,Current,,Yearly,,"line1\nline2"`, "a line break inside notes stays inside its quoted cell");
  assert.ok(lines[2].startsWith(`"'=Acme, Inc.",Later,License / Permit,2027-01-01,Upcoming,`));
});

test("calendar export: all-day events for dated, tracked items, with repeats, escaping and folding", () => {
  const tracker = { organization: "Acme", dueSoonDays: 30, items: [item({ id: "r", title: "Renew insurance; policy, #2", due: "2026-10-05", repeatMonths: 12, notes: "Call broker\nBring docs" }), item({ id: "n", title: "No date" }), item({ id: "x", title: "Skip me", due: "2026-10-01", status: "Not applicable" }), item({ id: "m", title: "Monthly check with a very long title that goes on and on to test line folding in calendars é", due: "2026-10-31", repeatMonths: 1 })] };
  const ics = calendarIcs(tracker, new Date("2026-09-24T15:04:05Z"));
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n") && ics.endsWith("END:VCALENDAR\r\n"));
  assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, 2);
  assert.equal(calendarEventCount(tracker), 2);
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20261005\r\nDTEND;VALUE=DATE:20261006"));
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20261031\r\nDTEND;VALUE=DATE:20261101"));
  assert.ok(ics.includes("SUMMARY:Due: Renew insurance\\; policy\\, #2"));
  assert.ok(ics.includes("RRULE:FREQ=MONTHLY;INTERVAL=12") && ics.includes("RRULE:FREQ=MONTHLY;INTERVAL=1"));
  assert.ok(ics.includes("TRIGGER:-P30D") && ics.includes("DTSTAMP:20260924T150405Z"));
  assert.ok(!ics.includes("Skip me"));
  for (const line of ics.split("\r\n")) assert.ok(new TextEncoder().encode(line).length <= 75, `line too long: ${line}`);
  const unfolded = ics.replace(/\r\n /g, "");
  assert.ok(unfolded.includes("Notes: Call broker\\nBring docs"));
  assert.ok(unfolded.includes("in calendars é"));
});

test("the demo is clearly fictional and shows every state", () => {
  const tracker = demoTracker(new Date(2026, 8, 24));
  const states = tracker.items.map(i => dateState(i, TODAY, tracker.dueSoonDays));
  for (const s of ["Overdue", "Due soon", "Upcoming", "No date", "Not applicable"]) assert.ok(states.includes(s), s);
  assert.ok(tracker.items.every(i => i.title.startsWith("Example:")) && tracker.organization.includes("fictional"));
  assert.ok(tracker.items.some(i => i.repeatMonths) && tracker.items.some(i => i.renewed));
  assert.ok(new Set(tracker.items.map(i => i.category)).size >= 5);
  assert.deepEqual(parseTracker(tracker), tracker, "demo data passes validation");
  assert.deepEqual(blankTracker(), { organization: "", dueSoonDays: 14, items: [] });
});
