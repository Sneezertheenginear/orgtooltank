// Import, categorize and total. Money is whole cents, signed: positive = money in, negative = money out.
// Adapted from the desktop app's analysis engine, with its column-guessing and duplicate-row bugs fixed.
import Papa from "papaparse";
import { RULES } from "./rules";

export const MAX_BYTES = 10 * 1024 * 1024;
export const MAX_ROWS = 50_000;

export type AmountStyle = "signed_in" | "signed_out" | "debit_credit";
export const amountStyles: { id: AmountStyle; label: string }[] = [
  { id: "signed_in", label: "One amount column: minus means money out" },
  { id: "signed_out", label: "One amount column: purchases are positive (common for credit cards)" },
  { id: "debit_credit", label: "Separate Debit (out) and Credit (in) columns" },
];
export type Mapping = { date?: string; description?: string; amount?: string; debit?: string; credit?: string; category?: string; account?: string };
export type Settings = { mapping: Mapping; style: AmountStyle; dayFirst: boolean };
export type ParsedFile = { name: string; headers: string[]; rows: string[][]; errors: string[] };
/** One imported row. `id` is file + row number, so identical rows stay separate transactions. */
export type RawTxn = { id: string; file: string; row: number; date: string; description: string; amountCents: number; fileCategory?: string; account: string };
export type Txn = RawTxn & { merchant: string; merchantKey: string; category: string; source: "file" | "rule" | "auto" | "you"; transfer: boolean };
export type Choices = { merchantCategories: Record<string, string>; transferCategories: string[]; transferOverrides: Record<string, boolean> };
export const emptyChoices = (): Choices => ({ merchantCategories: {}, transferCategories: [], transferOverrides: {} });

// ---------- CSV ----------

export const isSpreadsheet = (name: string) => /\.(xlsx|xlsm|xls|numbers|ods)$/i.test(name);
export function limitError(bytes: number, rows: number) {
  const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1).replace(/\.0$/, "")} MB`;
  if (bytes > MAX_BYTES) return `These files add up to ${mb(bytes)}. This browser experiment reads up to ${mb(MAX_BYTES)} of CSV data at a time. Try a shorter date range or fewer files.`;
  if (rows > MAX_ROWS) return `These files have ${rows.toLocaleString("en-US")} rows. This browser experiment reads up to ${MAX_ROWS.toLocaleString("en-US")} rows at a time. Try a shorter date range or fewer files.`;
  return null;
}

/** Parses CSV text. Skips bank preamble lines by finding the header row that names a date column. */
export function parseCsv(text: string, name: string): ParsedFile {
  const result = Papa.parse<string[]>(text.replace(/^\uFEFF/, ""), { skipEmptyLines: "greedy" });
  const data = result.data.map(row => row.map(cell => String(cell ?? "").trim()));
  const errors: string[] = [];
  if (!data.length) return { name, headers: [], rows: [], errors: ["This file is empty."] };
  const headerIndex = Math.max(0, data.slice(0, 15).findIndex(row => row.filter(Boolean).length >= 2 && row.some(cell => /date/i.test(cell))));
  const seen = new Map<string, number>();
  const headers = data[headerIndex].map((cell, index) => {
    const base = cell || `Column ${index + 1}`, count = (seen.get(base.toLowerCase()) ?? 0) + 1;
    seen.set(base.toLowerCase(), count);
    return count > 1 ? `${base} (${count})` : base;
  });
  if (headers.length < 3) errors.push("We couldn’t find a header row with at least date, description, and amount columns.");
  if (result.errors.some(error => error.code === "MissingQuotes")) errors.push("A quoted value isn’t closed, so some rows may be unreadable.");
  return { name, headers, rows: data.slice(headerIndex + 1).filter(row => row.some(Boolean)), errors };
}

const keyOf = (header: string) => header.toLowerCase().replace(/[^a-z0-9]/g, "");
/**
 * Guesses columns by exact names first, then careful partial matches. A header is only used once,
 * and dates and amounts are never guessed as descriptions (so "Transaction Date" stays the date).
 */
export function guessMapping(headers: string[]): { mapping: Mapping; style: AmountStyle } {
  const used = new Set<string>();
  const pick = (exact: string[], partial: string[] = [], avoid: RegExp = /$^/) => {
    const available = headers.filter(header => !used.has(header) && !avoid.test(keyOf(header)));
    const found = exact.map(candidate => available.find(header => keyOf(header) === candidate)).find(Boolean)
      ?? partial.map(candidate => available.find(header => keyOf(header).includes(candidate))).find(Boolean);
    if (found) used.add(found);
    return found;
  };
  const date = pick(["date", "transactiondate", "transdate", "posteddate", "postingdate", "postdate", "bookingdate", "valuedate"], ["date"]);
  const debit = pick(["debit", "debits", "debitamount", "withdrawal", "withdrawals", "withdrawalamount", "moneyout", "paidout"], ["debit", "withdraw"]);
  const credit = pick(["credit", "credits", "creditamount", "deposit", "deposits", "depositamount", "moneyin", "paidin"], ["deposit"], /card/);
  const amount = pick(["amount", "transactionamount", "amountusd", "net", "value"], ["amount"], /balance/);
  const description = pick(["description", "transactiondescription", "originaldescription", "merchant", "merchantname", "payee", "name", "details", "narrative", "memo"], ["description", "merchant", "payee", "memo", "details"], /date|amount|balance|type|category/);
  const category = pick(["category", "transactioncategory", "categoryname"], ["category"]);
  const account = pick(["account", "accountname", "accountnumber"], ["account"], /type/);
  const style: AmountStyle = debit && credit ? "debit_credit" : "signed_in";
  return { mapping: { date, description, amount: style === "debit_credit" ? undefined : amount, debit: style === "debit_credit" ? debit : undefined, credit: style === "debit_credit" ? credit : undefined, category, account }, style };
}

/** Picks sign style and day order from the data itself; the user confirms both. */
export function guessSettings(file: ParsedFile): Settings {
  const { mapping, style } = guessMapping(file.headers);
  const column = (header?: string) => header ? file.headers.indexOf(header) : -1;
  let finalStyle = style;
  if (style === "signed_in" && mapping.amount) {
    const values = file.rows.slice(0, 500).map(row => parseAmount(row[column(mapping.amount)] ?? "").cents).filter(Boolean);
    // Card exports usually list purchases as positive numbers with only a few negative payments.
    if (values.length >= 5 && values.filter(value => value > 0).length / values.length >= 0.8) finalStyle = "signed_out";
  }
  let dayFirst = false;
  for (const row of file.rows.slice(0, 500)) {
    const match = (row[column(mapping.date)] ?? "").match(/^(\d{1,2})[/.-](\d{1,2})[/.-]\d{2,4}$/);
    if (match && +match[1] > 12) { dayFirst = true; break; }
    if (match && +match[2] > 12) break;
  }
  return { mapping, style: finalStyle, dayFirst };
}

// ---------- Amounts and dates ----------

/** Parses "$1,234.56", "(45.00)", "45-", "1.234,56", "USD 12" into cents. Letters mean invalid. */
export function parseAmount(raw: string): { cents: number; valid: boolean; empty: boolean } {
  let text = raw.trim();
  if (!text || /^(n\/?a|null|-|—|–)$/i.test(text)) return { cents: 0, valid: true, empty: true };
  let negative = false;
  if (/^\(.*\)$/.test(text)) { negative = true; text = text.slice(1, -1); }
  if (/-\s*$/.test(text)) { negative = true; text = text.replace(/-\s*$/, ""); }
  if (/^\s*[-−]/.test(text)) { negative = true; text = text.replace(/^\s*[-−]/, ""); }
  text = text.replace(/\b(?:usd|eur|gbp|cad|aud)\b/gi, "");
  if (/[a-z]/i.test(text)) return { cents: 0, valid: false, empty: false };
  text = text.replace(/[^\d.,]/g, "");
  if (!text) return { cents: 0, valid: false, empty: false };
  const lastComma = text.lastIndexOf(","), lastDot = text.lastIndexOf(".");
  let decimal = "";
  if (lastComma >= 0 && lastDot >= 0) decimal = lastComma > lastDot ? "," : ".";
  else if (lastComma >= 0) decimal = /,\d{1,2}$/.test(text) ? "," : "";
  else if (lastDot >= 0) decimal = /\.\d{1,2}$/.test(text) ? "." : "";
  const split = decimal ? text.lastIndexOf(decimal) : text.length;
  const whole = text.slice(0, split).replace(/[.,]/g, ""), fraction = text.slice(split + 1).replace(/[.,]/g, "");
  const cents = (negative ? -1 : 1) * (Number(whole || "0") * 100 + Number((fraction + "00").slice(0, 2)));
  return Number.isSafeInteger(cents) ? { cents, valid: true, empty: false } : { cents: 0, valid: false, empty: false };
}

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
function iso(y: number, m: number, d: number) {
  const check = new Date(Date.UTC(y, m - 1, d));
  return y >= 1000 && check.getUTCFullYear() === y && check.getUTCMonth() === m - 1 && check.getUTCDate() === d ? `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` : null;
}
/** Parses ISO, yyyy/mm/dd, m/d/y or d/m/y, and "Aug 14, 2025" / "14 Aug 2025" into yyyy-mm-dd. */
export function parseDate(raw: string, dayFirst = false): string | null {
  const text = raw.trim();
  let match = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T ].*)?$/);
  if (match) return iso(+match[1], +match[2], +match[3]);
  match = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})(?:\s.*)?$/);
  if (match) {
    const a = +match[1], b = +match[2], year = +match[3] < 100 ? (+match[3] >= 70 ? 1900 : 2000) + +match[3] : +match[3];
    const [month, day] = a > 12 ? [b, a] : b > 12 ? [a, b] : dayFirst ? [b, a] : [a, b];
    return iso(year, month, day);
  }
  const words = text.toLowerCase().replace(/,/g, "");
  match = words.match(/^([a-z]{3,9})\.?\s+(\d{1,2})\s+(\d{4})$/);
  if (match && MONTHS[match[1].slice(0, 3)]) return iso(+match[3], MONTHS[match[1].slice(0, 3)], +match[2]);
  match = words.match(/^(\d{1,2})\s+([a-z]{3,9})\.?\s+(\d{4})$/);
  if (match && MONTHS[match[2].slice(0, 3)]) return iso(+match[3], MONTHS[match[2].slice(0, 3)], +match[1]);
  return null;
}

// ---------- Rows to transactions ----------

export function readRows(file: ParsedFile, settings: Settings): { txns: RawTxn[]; invalid: { row: number; reason: string }[] } {
  const { mapping, style, dayFirst } = settings;
  const col = (header?: string) => header ? file.headers.indexOf(header) : -1;
  const at = (row: string[], header?: string) => col(header) >= 0 ? (row[col(header)] ?? "").trim() : "";
  const account = file.name.replace(/\.csv$/i, "");
  const txns: RawTxn[] = [], invalid: { row: number; reason: string }[] = [];
  file.rows.forEach((row, index) => {
    const rowNumber = index + 2; // header is row 1 in a spreadsheet
    const rawDate = at(row, mapping.date), description = at(row, mapping.description);
    const reasons: string[] = [];
    const date = parseDate(rawDate, dayFirst);
    if (!date) reasons.push(rawDate ? `couldn’t read the date “${rawDate}”` : "no date");
    let amountCents = 0;
    if (style === "debit_credit") {
      const debit = parseAmount(at(row, mapping.debit)), credit = parseAmount(at(row, mapping.credit));
      if (!debit.valid || !credit.valid) reasons.push("couldn’t read the amount");
      else if (debit.empty && credit.empty) reasons.push("no amount");
      else if (debit.cents && credit.cents) reasons.push("both debit and credit have values");
      amountCents = Math.abs(credit.cents) - Math.abs(debit.cents);
    } else {
      const amount = parseAmount(at(row, mapping.amount));
      if (!amount.valid) reasons.push("couldn’t read the amount");
      else if (amount.empty) reasons.push("no amount");
      amountCents = style === "signed_out" ? -amount.cents : amount.cents;
    }
    if (!description) reasons.push("no description");
    if (reasons.length) { invalid.push({ row: rowNumber, reason: reasons.join("; ") }); return; }
    txns.push({ id: `${file.name}#${rowNumber}`, file: file.name, row: rowNumber, date: date!, description, amountCents: amountCents || 0, fileCategory: at(row, mapping.category) || undefined, account: at(row, mapping.account) || account });
  });
  return { txns, invalid };
}

/** A fingerprint of a whole file, so choosing the same export twice is caught without touching its rows. */
export function fileFingerprint(text: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 0x01000193); }
  return `${text.length}:${(hash >>> 0).toString(16)}`;
}

// ---------- Merchants and categories ----------

const NOISE = ["purchase authorized on", "recurring payment authorized on", "pos purchase", "pos debit", "debit card purchase", "card purchase", "ach debit", "ach credit", "electronic withdrawal", "checkcard", "sq *", "sq*", "tst*", "paypal *", "paypal*", "google *", "chkcardpurchase"];
/** Readable merchant name from a raw bank description (strips store numbers, card tails, dates). */
export function cleanMerchant(raw: string) {
  if (!raw) return "Unknown";
  let text = ` ${raw.toLowerCase()} `.replace(/\s+/g, " ");
  for (const prefix of NOISE) { const at = text.indexOf(prefix); if (at >= 0) text = text.slice(at + prefix.length); }
  text = text.replace(/\bx{2,}\d+\b/g, " ").replace(/\b\d{2}\/\d{2}(\/\d{2,4})?\b/g, " ").replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ").replace(/#\s*\d+/g, " ")
    .replace(/\bstore\s*\d+\b/g, " ").replace(/\bref\s*#?\s*\w+\b/g, " ").replace(/\bid:?\s*\w+\b/g, " ").replace(/\bauth\s*#?\s*\w+\b/g, " ")
    .replace(/\b\d{5,}\b/g, " ").replace(/\b[a-z]{2}\s*$/i, " ").replace(/[*#]+/g, " ").replace(/\s{2,}/g, " ").trim();
  const short = text.split(" ").filter(Boolean).slice(0, 4).join(" ") || raw.trim();
  return short.replace(/\b\w/g, char => char.toUpperCase()).replace(/\bLlc\b/, "LLC").replace(/\bInc\b/, "Inc");
}
export const merchantKeyOf = (merchant: string) => merchant.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 40);

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const compiled = [...RULES].sort((a, b) => a.priority - b.priority).map(rule => ({
  ...rule,
  regex: new RegExp(`${/^[a-z0-9]/.test(rule.pattern) ? "(?:^|[^a-z0-9])" : ""}${escape(rule.pattern)}${/[a-z0-9]$/.test(rule.pattern) ? "(?:$|[^a-z0-9])" : ""}`),
}));
export function ruleFor(description: string, amountCents: number) {
  const text = description.toLowerCase().replace(/\s+/g, " ");
  return compiled.find(rule => (rule.category !== "Money In" || amountCents > 0) && rule.regex.test(text));
}
const transferName = /transfer|credit card payment/i;

/**
 * Applies categories and transfers. Order: your merchant choice, the file's own category, keyword
 * rules, then Money In / Uncategorized. A transaction is a transfer if its category is one, you
 * marked its category as transfers, or you marked that transaction.
 */
export function categorize(raw: RawTxn[], choices: Choices): Txn[] {
  const transferCategories = new Set(choices.transferCategories);
  return raw.map(txn => {
    const rule = ruleFor(txn.description, txn.amountCents);
    const merchant = rule?.merchant ?? cleanMerchant(txn.description), key = merchantKeyOf(merchant);
    const chosen = choices.merchantCategories[key];
    const [category, source]: [string, Txn["source"]] = chosen ? [chosen, "you"] : txn.fileCategory ? [txn.fileCategory, "file"] : rule ? [rule.category, "rule"] : [txn.amountCents > 0 ? "Money In" : "Uncategorized", "auto"];
    // A description that clearly says "card payment" or "transfer" wins even over the file's own category.
    const transfer = choices.transferOverrides[txn.id] ?? (transferCategories.has(category) || category === "Transfer" || transferName.test(category) || rule?.category === "Transfer");
    return { ...txn, merchant, merchantKey: key, category, source, transfer };
  });
}

// ---------- Totals and periods ----------

export function summarize(txns: Txn[]) {
  let moneyIn = 0, moneyOut = 0, inCount = 0, outCount = 0, transfers = 0;
  for (const txn of txns) {
    if (txn.transfer) { transfers++; continue; }
    if (txn.amountCents > 0) { moneyIn += txn.amountCents; inCount++; } else if (txn.amountCents < 0) { moneyOut -= txn.amountCents; outCount++; }
  }
  return { moneyIn, moneyOut, left: moneyIn - moneyOut, inCount, outCount, transfers };
}

export type Period = "all" | "last3" | `${number}-${number}`;
export const monthsOf = (txns: Pick<Txn, "date">[]) => [...new Set(txns.map(txn => txn.date.slice(0, 7)))].sort().reverse();
export function inPeriod<T extends Pick<Txn, "date">>(txns: T[], period: Period): T[] {
  if (period === "all") return txns;
  if (period === "last3") {
    const latest = monthsOf(txns)[0];
    if (!latest) return txns;
    const [y, m] = latest.split("-").map(Number), start = new Date(Date.UTC(y, m - 3, 1)).toISOString().slice(0, 7);
    return txns.filter(txn => txn.date.slice(0, 7) >= start);
  }
  return txns.filter(txn => txn.date.startsWith(period));
}
export function periodLabel(period: Period) {
  if (period === "all") return "All imported months";
  if (period === "last3") return "Last 3 months";
  const [y, m] = period.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

/** Spending by category, largest first. Refunds and transfers don’t count as spending. */
export function spendingByCategory(txns: Txn[]) {
  const totals = new Map<string, { category: string; cents: number; count: number }>();
  let all = 0;
  for (const txn of txns) {
    if (txn.transfer || txn.amountCents >= 0) continue;
    const row = totals.get(txn.category) ?? { category: txn.category, cents: 0, count: 0 };
    row.cents -= txn.amountCents; row.count++; all -= txn.amountCents;
    totals.set(txn.category, row);
  }
  return [...totals.values()].map(row => ({ ...row, share: all ? row.cents / all : 0 })).sort((a, b) => b.cents - a.cents);
}

export function topMerchants(txns: Txn[], limit = 8) {
  const totals = new Map<string, { merchant: string; cents: number; count: number }>();
  for (const txn of txns) {
    if (txn.transfer || txn.amountCents >= 0) continue;
    const row = totals.get(txn.merchantKey) ?? { merchant: txn.merchant, cents: 0, count: 0 };
    row.cents -= txn.amountCents; row.count++;
    totals.set(txn.merchantKey, row);
  }
  return [...totals.values()].sort((a, b) => b.cents - a.cents).slice(0, limit);
}

export function formatMoney(cents: number, { sign = false } = {}) {
  const text = (Math.abs(cents) / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  return cents < 0 ? `−${text}` : sign && cents > 0 ? `+${text}` : text;
}
export const formatDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
