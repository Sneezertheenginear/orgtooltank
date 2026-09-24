// Recurring charges, possible duplicates, the savings goal, and the summary download.
// Detection logic is adapted from the desktop app. Results are estimates, never conclusions.
import { formatMoney, periodLabel, type Period, type Txn } from "./engine";

const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
const median = (values: number[]) => { const s = [...values].sort((a, b) => a - b), mid = s.length >> 1; return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2); };

export type Cadence = "weekly" | "every 2 weeks" | "monthly" | "quarterly" | "yearly";
const cadences: [Cadence, number, number, number, number][] = [
  // name, min gap, max gap, expected days, charges per year
  ["weekly", 5, 9, 7, 52], ["every 2 weeks", 11, 18, 14, 26], ["monthly", 24, 38, 30.44, 12], ["quarterly", 78, 104, 91.31, 4], ["yearly", 330, 400, 365, 1],
];
export type Recurring = { merchant: string; cadence: Cadence; amountCents: number; yearlyCents: number; count: number; lastDate: string; ids: string[]; priceIncrease?: { fromCents: number; toCents: number; since: string } };

/**
 * A merchant counts as recurring only when its charges are both evenly spaced and similar in amount,
 * with at least 3 charges. Showing up often is not enough.
 */
export function detectRecurring(txns: Txn[]): Recurring[] {
  const byMerchant = new Map<string, Txn[]>();
  for (const txn of txns) if (!txn.transfer && txn.amountCents < 0) { const list = byMerchant.get(txn.merchantKey); if (list) list.push(txn); else byMerchant.set(txn.merchantKey, [txn]); }
  const found: Recurring[] = [];
  for (const list of byMerchant.values()) {
    if (list.length < 3) continue;
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date)), amounts = sorted.map(txn => -txn.amountCents);
    const gaps = sorted.slice(1).map((txn, i) => daysBetween(sorted[i].date, txn.date)), gap = median(gaps);
    const cadence = cadences.find(([, lo, hi]) => gap >= lo && gap <= hi);
    if (!cadence || gap <= 0) continue;
    const [name, , , expected, perYear] = cadence;
    const intervalScore = gaps.reduce((sum, g) => sum + Math.max(0, 1 - Math.abs(g - expected) / (expected * 0.35)), 0) / gaps.length;
    if (intervalScore < 0.4) continue;
    const typical = median(amounts);
    if (typical <= 0) continue;
    const amountScore = amounts.reduce((sum, a) => sum + Math.max(0, 1 - Math.abs(a - typical) / (typical * 0.25)), 0) / amounts.length;
    const confidence = 0.5 * intervalScore + 0.3 * amountScore + 0.2 * Math.min(1, (sorted.length - 2) / 4);
    if (confidence < 0.55) continue;
    const latest = amounts[amounts.length - 1], amount = Math.abs(latest - typical) <= typical * 0.25 ? latest : typical;
    // Price increase: earlier charges were steady (like a subscription, not a utility bill that
    // varies) and the latest is at least 5% and $1 above them.
    const before = median(amounts.slice(0, -1)), steady = amounts.slice(0, -1).every(a => Math.abs(a - before) <= before * 0.03);
    const priceIncrease = steady && latest - before >= 100 && (latest - before) / before >= 0.05 ? { fromCents: before, toCents: latest, since: sorted.find(txn => -txn.amountCents >= latest * 0.99)!.date } : undefined;
    found.push({ merchant: sorted[sorted.length - 1].merchant, cadence: name, amountCents: amount, yearlyCents: Math.round(amount * perYear), count: sorted.length, lastDate: sorted[sorted.length - 1].date, ids: sorted.map(txn => txn.id), priceIncrease });
  }
  return found.sort((a, b) => b.yearlyCents - a.yearlyCents);
}

/** Months covered by the data, used to explain when there’s too little history for recurring charges. */
export const monthsCovered = (txns: Pick<Txn, "date">[]) => {
  if (!txns.length) return 0;
  const dates = txns.map(txn => txn.date).sort();
  return Math.max(0, daysBetween(dates[0], dates[dates.length - 1])) / 30.44;
};

export type PossibleDuplicate = { merchant: string; amountCents: number; dates: string[]; ids: string[]; reason: string };
/**
 * Charges to the same (or a very similar) merchant for the same or nearly the same amount within
 * 3 days. These are only flagged for review; nothing is ever removed.
 */
export function detectDuplicates(txns: Txn[]): PossibleDuplicate[] {
  const spend = txns.filter(txn => !txn.transfer && txn.amountCents < 0).sort((a, b) => a.date.localeCompare(b.date) || a.amountCents - b.amountCents);
  const parent = spend.map((_, i) => i);
  const find = (x: number): number => parent[x] === x ? x : (parent[x] = find(parent[x]));
  const words = (text: string) => new Set(text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  const similar = (a: string, b: string) => { const x = words(a), y = words(b); let shared = 0; for (const w of x) if (y.has(w)) shared++; return x.size && y.size ? shared / (x.size + y.size - shared) : 0; };
  for (let i = 0; i < spend.length; i++) {
    for (let j = i + 1; j < spend.length; j++) {
      const a = spend[i], b = spend[j];
      if (daysBetween(a.date, b.date) > 3) break;
      const allowed = Math.max(100, Math.round(Math.max(-a.amountCents, -b.amountCents) * 0.01));
      if (Math.abs(a.amountCents - b.amountCents) > allowed) continue;
      if (a.merchantKey === b.merchantKey || similar(a.merchant, b.merchant) >= 0.6) parent[find(i)] = find(j);
    }
  }
  const groups = new Map<number, Txn[]>();
  spend.forEach((txn, i) => { const root = find(i), group = groups.get(root); if (group) group.push(txn); else groups.set(root, [txn]); });
  return [...groups.values()].filter(group => group.length > 1).map(group => {
    const dates = group.map(txn => txn.date).sort(), amounts = group.map(txn => -txn.amountCents), span = daysBetween(dates[0], dates[dates.length - 1]);
    const exact = Math.max(...amounts) === Math.min(...amounts);
    return {
      merchant: group[0].merchant, amountCents: Math.round(amounts.reduce((s, v) => s + v, 0) / amounts.length), dates, ids: group.map(txn => txn.id),
      reason: `${group.length} charges ${exact ? "for the same amount" : "for nearly the same amount"} ${span === 0 ? "on the same day" : `within ${span} ${span === 1 ? "day" : "days"}`}`,
    };
  }).sort((a, b) => b.amountCents - a.amountCents);
}

// ---------- Savings goal ----------

/** Average monthly Actually Left over every calendar month from the first to the last transaction. */
export function averageMonthlyLeft(txns: Txn[]) {
  const counted = txns.filter(txn => !txn.transfer);
  if (!counted.length) return { cents: 0, months: 0 };
  const months = counted.map(txn => txn.date.slice(0, 7)).sort();
  const [y1, m1] = months[0].split("-").map(Number), [y2, m2] = months[months.length - 1].split("-").map(Number);
  const span = (y2 - y1) * 12 + (m2 - m1) + 1, left = counted.reduce((sum, txn) => sum + txn.amountCents, 0);
  return { cents: Math.round(left / span), months: span };
}

export type GoalEstimate = { remainingCents: number; months: number | null; date: string | null; done: boolean };
/** Months = remaining ÷ monthly amount, rounded up. The date is today plus that many months. */
export function estimateGoal(targetCents: number, savedCents: number, monthlyCents: number, today: Date): GoalEstimate {
  const remainingCents = Math.max(0, targetCents - savedCents);
  if (remainingCents === 0) return { remainingCents, months: 0, date: null, done: true };
  if (monthlyCents <= 0) return { remainingCents, months: null, date: null, done: false };
  const months = Math.ceil(remainingCents / monthlyCents);
  const target = new Date(today.getFullYear(), today.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(today.getDate(), lastDay));
  return { remainingCents, months, date: `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`, done: false };
}

/** Parses a typed dollar amount like "5,000" or "$250.50" into cents; invalid or negative is null. */
export function dollarsToCents(text: string) {
  const clean = text.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{0,2})?$/.test(clean)) return null;
  const [whole, fraction = ""] = clean.split(".");
  return Number(whole) * 100 + Number((fraction + "00").slice(0, 2));
}

// ---------- Summary download ----------

const cell = (value: string | number) => {
  const text = String(value), safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
const money = (cents: number) => (cents / 100).toFixed(2);

export type SummaryInput = {
  period: Period; files: string[]; totals: { moneyIn: number; moneyOut: number; left: number; transfers: number };
  categories: { category: string; cents: number; share: number; count: number }[]; recurring: Recurring[]; duplicates: PossibleDuplicate[];
  goal?: { name: string; targetCents: number; savedCents: number; monthlyCents: number; estimate: GoalEstimate };
};
/** A plain CSV of sections. Amounts are dollars with two decimals; money out is shown as a positive amount. */
export function summaryCsv(input: SummaryInput) {
  const rows: (string | number)[][] = [["Section", "Item", "Amount (USD)", "Detail"]];
  rows.push(["Summary", "Period", "", periodLabel(input.period)], ["Summary", "Files", "", input.files.join("; ")]);
  rows.push(["Summary", "Money In", money(input.totals.moneyIn), ""], ["Summary", "Money Out", money(input.totals.moneyOut), ""], ["Summary", "Actually Left", money(input.totals.left), input.totals.left < 0 ? "More went out than came in" : ""]);
  rows.push(["Summary", "Transfers not counted", "", `${input.totals.transfers} transfers between your own accounts`]);
  for (const c of input.categories) rows.push(["Spending by category", c.category, money(c.cents), `${Math.round(c.share * 100)}% of spending · ${c.count} transactions`]);
  for (const r of input.recurring) rows.push(["Recurring charges (estimated)", r.merchant, money(r.amountCents), `${r.cadence}; about ${formatMoney(r.yearlyCents)} a year${r.priceIncrease ? `; went up from ${formatMoney(r.priceIncrease.fromCents)} on ${r.priceIncrease.since}` : ""}`]);
  for (const d of input.duplicates) rows.push(["Possible duplicate charges (review)", d.merchant, money(d.amountCents), `${d.reason}: ${d.dates.join(", ")}`]);
  if (input.goal) {
    const { name, targetCents, savedCents, monthlyCents, estimate } = input.goal;
    rows.push(["Savings goal", name || "Goal", money(targetCents), `Saved ${formatMoney(savedCents)}; ${formatMoney(monthlyCents)} a month; ${estimate.done ? "already reached" : estimate.months ? `about ${estimate.months} months, around ${estimate.date}` : "no estimate at this monthly amount"}`]);
  }
  rows.push(["Note", "", "", "Estimates based only on the imported transactions. Not accounting, tax, or financial advice."]);
  return "\uFEFF" + rows.map(row => row.map(cell).join(",")).join("\r\n") + "\r\n";
}
