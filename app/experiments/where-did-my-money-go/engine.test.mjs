import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

// The engine imports sibling files without extensions (bundler style); resolve them to .ts here.
registerHooks({ resolve: (specifier, context, next) => { try { return next(specifier, context); } catch (error) { if (specifier.startsWith(".")) return next(`${specifier}.ts`, context); throw error; } } });
const { categorize, emptyChoices, fileFingerprint, guessMapping, guessSettings, inPeriod, isSpreadsheet, limitError, monthsOf, parseAmount, parseCsv, parseDate, readRows, spendingByCategory, summarize, topMerchants, MAX_BYTES, MAX_ROWS } = await import("./engine.ts");
const { averageMonthlyLeft, detectDuplicates, detectRecurring, dollarsToCents, estimateGoal, monthsCovered, summaryCsv } = await import("./insights.ts");
const { demoFiles } = await import("./demo.ts");

const load = (text, name = "bank.csv", settings) => { const file = parseCsv(text, name); return { file, ...readRows(file, settings ?? guessSettings(file)) }; };
const txnsOf = (text, choices = emptyChoices(), name) => categorize(load(text, name).txns, choices);

test("column guessing never uses a date heading as the description (desktop bug regression)", () => {
  const chase = guessMapping(["Transaction Date", "Post Date", "Description", "Category", "Type", "Amount", "Memo"]);
  assert.deepEqual(chase.mapping, { date: "Transaction Date", description: "Description", amount: "Amount", debit: undefined, credit: undefined, category: "Category", account: undefined });
  const generic = guessMapping(["Transaction Date", "Description", "Amount", "Transaction Type"]);
  assert.equal(generic.mapping.description, "Description");
  assert.equal(generic.mapping.category, undefined, "“Transaction Type” is not a category");
  assert.equal(guessMapping(["Transaction Date", "Payee", "Amount"]).mapping.description, "Payee");
  assert.notEqual(guessMapping(["Transaction Date", "Transaction ID", "Amount"]).mapping.description, "Transaction Date");
  const capitalOne = guessMapping(["Transaction Date", "Posted Date", "Card No.", "Description", "Category", "Debit", "Credit"]);
  assert.equal(capitalOne.style, "debit_credit");
  assert.deepEqual([capitalOne.mapping.date, capitalOne.mapping.description, capitalOne.mapping.debit, capitalOne.mapping.credit], ["Transaction Date", "Description", "Debit", "Credit"]);
  assert.equal(guessMapping(["Date", "Details", "Withdrawals", "Deposits", "Balance"]).mapping.credit, "Deposits");
});

test("identical real purchases in one file are all kept (desktop dedupe bug regression)", () => {
  const { txns, invalid } = load("Date,Description,Amount\n2026-09-01,BLUE BOTTLE COFFEE,-5.00\n2026-09-01,BLUE BOTTLE COFFEE,-5.00\n2026-09-01,BLUE BOTTLE COFFEE,-5.00");
  assert.equal(invalid.length, 0);
  assert.equal(txns.length, 3);
  assert.equal(new Set(txns.map(t => t.id)).size, 3, "each row keeps its own identity");
  const all = categorize(txns, emptyChoices());
  assert.equal(summarize(all).moneyOut, 1500);
  // They may be flagged for review, but nothing is removed.
  assert.equal(detectDuplicates(all)[0].ids.length, 3);
  assert.equal(summarize(all).outCount, 3);
});

test("a re-selected file is recognized by its whole contents, not by matching rows", () => {
  const a = "Date,Description,Amount\n2026-09-01,Coffee,-5", b = "Date,Description,Amount\n2026-09-01,Coffee,-5\n2026-09-01,Coffee,-5";
  assert.equal(fileFingerprint(a), fileFingerprint(`${a}`));
  assert.notEqual(fileFingerprint(a), fileFingerprint(b));
});

test("amounts: currency, parentheses, trailing minus, European decimals, invalid text", () => {
  const cases = { "$1,234.56": 123456, "(45.00)": -4500, "45-": -4500, "-12.5": -1250, "1.234,56": 123456, "1,5": 150, "USD 12": 1200, "−7.25": -725, "1 234.50": 123450 };
  for (const [raw, cents] of Object.entries(cases)) assert.equal(parseAmount(raw).cents, cents, raw);
  assert.equal(parseAmount("abc").valid, false);
  assert.equal(parseAmount("").empty, true);
});

test("dates: ISO, US, day-first, month names, and invalid dates", () => {
  assert.equal(parseDate("2026-03-04"), "2026-03-04");
  assert.equal(parseDate("03/04/2026"), "2026-03-04");
  assert.equal(parseDate("03/04/2026", true), "2026-04-03");
  assert.equal(parseDate("25/12/2026"), "2026-12-25");
  assert.equal(parseDate("Aug 14, 2025"), "2025-08-14");
  assert.equal(parseDate("14 Aug 2025"), "2025-08-14");
  assert.equal(parseDate("2/30/2026"), null);
  assert.equal(guessSettings(parseCsv("Date,Description,Amount\n05/03/2026,A,-1\n25/03/2026,B,-2", "x.csv")).dayFirst, true);
  const dayFirst = load("Date,Description,Amount\n04/03/2026,Rent,-100", "x.csv", { mapping: { date: "Date", description: "Description", amount: "Amount" }, style: "signed_in", dayFirst: true });
  assert.equal(dayFirst.txns[0].date, "2026-03-04");
});

test("sign styles: signed, card-style positive purchases, debit/credit; unreadable rows are reported", () => {
  const card = "Date,Description,Amount\n" + ["12.00", "30.00", "9.99", "45.10", "5.00", "-101.09"].map((a, i) => `2026-01-0${i + 1},Item ${i},${a}`).join("\n");
  assert.equal(guessSettings(parseCsv(card, "card.csv")).style, "signed_out");
  const t = load(card, "card.csv").txns;
  assert.equal(t[0].amountCents, -1200);
  assert.equal(t[5].amountCents, 10109);
  const dc = load("Date,Description,Debit,Credit\n2026-01-01,Rent,1000.00,\n2026-01-02,Client,,250.00\n2026-01-03,Both,1,2\n2026-99-01,Bad date,1,\n2026-01-04,Bad amount,ten,");
  assert.deepEqual(dc.txns.map(t => t.amountCents), [-100000, 25000]);
  assert.deepEqual(dc.invalid.map(i => i.row), [4, 5, 6]);
  assert.match(dc.invalid[0].reason, /both debit and credit/);
});

test("bank preamble lines before the header are skipped", () => {
  const { file, txns } = load("Account: Business Checking\nExported: 09/01/2026\n\nDate,Description,Amount\n2026-08-01,Rent,-10");
  assert.deepEqual(file.headers, ["Date", "Description", "Amount"]);
  assert.equal(txns.length, 1);
});

test("categories: your choice, then the file’s category, then whole-word rules, then Uncategorized", () => {
  const csv = "Date,Description,Amount\n2026-01-01,ADOBE *CREATIVE CLOUD,-59.99\n2026-01-02,SUMMER PROMOTION PRINTING,-80\n2026-01-03,SEASHELL BOUTIQUE,-20\n2026-01-04,SECURITY DEPOSIT REFUND,300\n2026-01-05,SECURITY DEPOSIT,-300\n2026-01-06,MARCOS PIZZA,-12";
  const t = txnsOf(csv);
  assert.deepEqual(t.map(x => x.category), ["Software", "Uncategorized", "Uncategorized", "Money In", "Uncategorized", "Uncategorized"]);
  assert.equal(t[0].merchant, "Adobe");
  const withFile = txnsOf("Date,Description,Amount,Category\n2026-01-01,ADOBE,-10,Design tools\n2026-01-02,ADOBE,-10,");
  assert.deepEqual(withFile.map(x => [x.category, x.source]), [["Design tools", "file"], ["Software", "rule"]]);
  const chosen = txnsOf(csv, { ...emptyChoices(), merchantCategories: { seashellboutique: "Gifts" } });
  assert.deepEqual([chosen[2].category, chosen[2].source], ["Gifts", "you"]);
});

test("transfers between your own accounts are not money in or out; you can mark or unmark them", () => {
  const checking = "Date,Description,Amount\n2026-01-01,CLIENT PAYMENT RECEIVED,1000\n2026-01-05,CARD SERVICES AUTOPAY,-400\n2026-01-06,ONLINE TRANSFER TO SAVINGS,-100\n2026-01-07,ZELLE TO MOM,-50";
  const card = "Transaction Date,Description,Debit,Credit\n2026-01-02,STAPLES,400.00,\n2026-01-05,AUTOPAY PAYMENT - THANK YOU,,400.00";
  const raw = [...load(checking, "checking.csv").txns, ...load(card, "card.csv").txns];
  const t = categorize(raw, emptyChoices());
  assert.deepEqual(summarize(t), { moneyIn: 100000, moneyOut: 45000, left: 55000, inCount: 1, outCount: 2, transfers: 3 });
  const zelle = t.find(x => x.description === "ZELLE TO MOM");
  assert.equal(summarize(categorize(raw, { ...emptyChoices(), transferOverrides: { [zelle.id]: true } })).moneyOut, 40000);
  assert.equal(summarize(categorize(raw, { ...emptyChoices(), transferCategories: ["Uncategorized"] })).moneyOut, 40000);
  const capOne = txnsOf("Transaction Date,Posted Date,Card No.,Description,Category,Debit,Credit\n2026-09-05,2026-09-06,4821,STAPLES,Merchandise,84.20,\n2026-09-25,2026-09-25,4821,CAPITAL ONE AUTOPAY PYMT,Payment/Credit,,250.00\n2026-09-26,2026-09-26,4821,GEICO AUTOPAY,Insurance,120.00,");
  assert.deepEqual(capOne.map(x => [x.category, x.transfer]), [["Merchandise", false], ["Payment/Credit", true], ["Insurance", false]], "a card payment is a transfer even with the file’s category; other autopays are spending");
  const savings = t.find(x => x.description.includes("SAVINGS"));
  assert.equal(summarize(categorize(raw, { ...emptyChoices(), transferOverrides: { [savings.id]: false } })).moneyOut, 55000);
});

test("totals stay exact in cents; periods, categories and merchants", () => {
  const rows = Array.from({ length: 10 }, (_, i) => `2026-0${(i % 4) + 1}-0${(i % 9) + 1},STAPLES,-0.10`).join("\n");
  const t = txnsOf(`Date,Description,Amount\n${rows}\n2026-04-20,ADOBE,-20.00\n2026-01-15,Client,100.00`);
  assert.equal(summarize(t).moneyOut, 2100, "ten 10-cent charges are exactly $1.00, plus $20");
  assert.deepEqual(monthsOf(t), ["2026-04", "2026-03", "2026-02", "2026-01"]);
  assert.equal(inPeriod(t, "last3").every(x => x.date >= "2026-02"), true);
  assert.equal(inPeriod(t, "2026-01").length, 4);
  assert.deepEqual(spendingByCategory(t).map(c => [c.category, c.cents]), [["Software", 2000], ["Supplies", 100]]);
  assert.equal(topMerchants(t)[0].merchant, "Adobe");
});

test("recurring charges need even spacing and similar amounts; price increases are noticed", () => {
  const monthly = [1, 2, 3, 4].map(m => `2026-0${m}-05,NETFLIX.COM,-${m === 4 ? "17.99" : "15.49"}`).join("\n");
  const random = ["2026-01-02", "2026-01-03", "2026-02-20", "2026-04-01"].map(d => `${d},HARDWARE BARN,-${d.slice(-2)}.00`).join("\n");
  const r = detectRecurring(txnsOf(`Date,Description,Amount\n${monthly}\n${random}`));
  assert.equal(r.length, 1);
  assert.equal(r[0].cadence, "monthly");
  assert.equal(r[0].amountCents, 1799);
  assert.equal(r[0].yearlyCents, 1799 * 12);
  assert.deepEqual(r[0].priceIncrease, { fromCents: 1549, toCents: 1799, since: "2026-04-05" });
  assert.equal(detectRecurring(txnsOf("Date,Description,Amount\n2026-01-05,NETFLIX,-15\n2026-02-05,NETFLIX,-15")).length, 0, "two charges are not enough");
  const bills = [["01", "131.40"], ["02", "144.10"], ["03", "128.90"], ["04", "139.00"], ["05", "147.20"]].map(([m, a]) => `2026-${m}-18,PG&E WEB ONLINE,-${a}`).join("\n");
  const utility = detectRecurring(txnsOf(`Date,Description,Amount\n${bills}`));
  assert.equal(utility[0].merchant, "PG&E");
  assert.equal(utility[0].priceIncrease, undefined, "a bill that already varies is not a price increase");
  assert.ok(monthsCovered(txnsOf("Date,Description,Amount\n2026-01-01,A,-1\n2026-02-15,B,-1")) < 3);
});

test("possible duplicates: same merchant and amount within 3 days; distant or different charges are not", () => {
  const d = detectDuplicates(txnsOf("Date,Description,Amount\n2026-07-09,B&H PHOTO VIDEO,-412.50\n2026-07-10,B&H PHOTO VIDEO,-412.50\n2026-07-20,B&H PHOTO VIDEO,-412.50\n2026-07-09,STAPLES,-412.50"));
  assert.equal(d.length, 1);
  assert.deepEqual(d[0].dates, ["2026-07-09", "2026-07-10"]);
  assert.equal(d[0].reason, "2 charges for the same amount within 1 day");
});

test("the single savings goal", () => {
  const t = txnsOf("Date,Description,Amount\n2026-01-01,Client,3000\n2026-01-10,Rent,-2000\n2026-03-01,Client,3000\n2026-03-10,Rent,-2000\n2026-03-11,TRANSFER TO SAVINGS,-900");
  assert.deepEqual(averageMonthlyLeft(t), { cents: Math.round(200000 / 3), months: 3 }, "includes the empty month in between; transfers ignored");
  assert.deepEqual(estimateGoal(500000, 100000, 50000, new Date(2026, 0, 31)), { remainingCents: 400000, months: 8, date: "2026-09-30", done: false });
  assert.equal(estimateGoal(500000, 100000, 30000, new Date(2026, 0, 15)).months, 14);
  assert.deepEqual(estimateGoal(500000, 600000, 0, new Date()), { remainingCents: 0, months: 0, date: null, done: true });
  assert.equal(estimateGoal(500000, 0, -100, new Date()).months, null);
  assert.equal(dollarsToCents("$5,000"), 500000);
  assert.equal(dollarsToCents("250.5"), 25050);
  assert.equal(dollarsToCents("-3"), null);
});

test("summary CSV: totals, categories, recurring, possible duplicates, goal; spreadsheet-safe", () => {
  const t = txnsOf("Date,Description,Amount\n2026-01-01,=cmd,-5\n2026-01-02,Client,10");
  const csv = summaryCsv({ period: "all", files: ["bank.csv"], totals: summarize(t), categories: spendingByCategory(t), recurring: [], duplicates: [], goal: { name: "Van", targetCents: 100000, savedCents: 0, monthlyCents: 500, estimate: estimateGoal(100000, 0, 500, new Date(2026, 0, 1)) } });
  const lines = csv.replace(/^﻿/, "").trim().split("\r\n");
  assert.equal(lines[0], "Section,Item,Amount (USD),Detail");
  assert.ok(lines.includes("Summary,Money In,10.00,"));
  assert.ok(lines.includes("Summary,Money Out,5.00,"));
  assert.ok(lines.includes("Summary,Actually Left,5.00,"));
  assert.ok(lines.some(l => l.startsWith("Spending by category,Uncategorized,5.00,")));
  assert.ok(lines.some(l => l.startsWith("Savings goal,Van,1000.00,") && l.includes("about 200 months")));
});

test("limits and spreadsheet files are explained", () => {
  assert.equal(limitError(MAX_BYTES, MAX_ROWS), null);
  assert.match(limitError(MAX_BYTES + 1, 1), /up to 10 MB/);
  assert.match(limitError(1, MAX_ROWS + 1), /up to 50,000 rows/);
  assert.ok(isSpreadsheet("Statement.XLSX") && isSpreadsheet("a.numbers") && !isSpreadsheet("a.csv"));
});

test("the demo reads cleanly and shows every feature", () => {
  const files = demoFiles().map(({ name, text }) => { const file = parseCsv(text, name); const settings = guessSettings(file); return { name, settings, ...readRows(file, settings) }; });
  assert.deepEqual(files.map(f => [f.settings.style, f.settings.mapping.date, f.settings.mapping.description, f.invalid.length]), [["signed_in", "Date", "Description", 0], ["debit_credit", "Transaction Date", "Description", 0]]);
  const t = categorize(files.flatMap(f => f.txns), emptyChoices());
  const totals = summarize(t);
  assert.ok(totals.moneyIn > 0 && totals.moneyOut > 0 && totals.transfers >= 16);
  const categories = spendingByCategory(t).map(c => c.category);
  for (const c of ["Payroll", "Rent", "Equipment", "Software", "Advertising", "Taxes", "Uncategorized"]) assert.ok(categories.includes(c), c);
  const recurring = detectRecurring(t);
  assert.deepEqual(recurring.filter(r => r.priceIncrease).map(r => r.merchant), ["Adobe"], "exactly one price increase in the demo");
  for (const m of ["Gusto", "State Farm", "Verizon"]) assert.ok(recurring.some(r => r.merchant === m), m);
  assert.deepEqual(detectDuplicates(t).map(d => d.merchant), ["B&H Photo"]);
  assert.ok(t.some(x => x.merchant === "Best Buy" && x.amountCents === -289999));
  assert.ok(averageMonthlyLeft(t).cents > 0);
});
