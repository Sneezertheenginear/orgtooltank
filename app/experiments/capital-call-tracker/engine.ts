// Capital calls, urgency, totals, saved data, and the CSV export.
// It organizes what the user enters. It never checks amounts against fund documents.

export const statuses = ["Outstanding", "Paid"] as const;
export type Status = typeof statuses[number];
export const DUE_SOON_DAYS = 30, MAX_CALLS = 500, MAX_AMOUNT = 1_000_000_000_000;
export const CURRENCY = "USD";
export const LIMITS = { fund: 150, entity: 150, notice: 200, notes: 1000 } as const;

/** `amount` is a real number in US dollars, rounded to cents. `paidOn` is set only while Paid. */
export type Call = { id: string; fund: string; entity: string; amount: number; due: string; notice: string; notes: string; status: Status; paidOn?: string };

// ---------- Dates (calendar days in the user's own time zone) ----------

export const isoDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const validIso = (text: string) => /^\d{4}-\d{2}-\d{2}$/.test(text) && isoDate(new Date(+text.slice(0, 4), +text.slice(5, 7) - 1, +text.slice(8, 10))) === text;
const utc = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
export const daysUntil = (due: string, today: string) => Math.round((utc(due) - utc(today)) / 86_400_000);
export const formatDate = (iso: string) => new Date(utc(iso)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
export function relativeDue(due: string, today: string) {
  const days = daysUntil(due, today);
  if (days === 0) return "Due today";
  return days > 0 ? `In ${days} ${days === 1 ? "day" : "days"}` : `${-days} ${days === -1 ? "day" : "days"} overdue`;
}

// ---------- Amounts ----------

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: CURRENCY });
export const formatAmount = (amount: number) => money.format(amount);
/** Reads what someone typed ("250000", "$250,000.50") as dollars. Returns null unless it's a positive amount with at most two decimals. */
export function parseAmount(text: string): number | null {
  const cleaned = text.trim().replace(/^\$/, "").replace(/,/g, "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return value > 0 && value <= MAX_AMOUNT ? Math.round(value * 100) / 100 : null;
}
/** Plain text for an amount input, without currency symbols or separators. */
export const amountInput = (amount: number) => String(amount);
/** Adds in whole cents so totals never pick up floating-point drift. */
export const sum = (amounts: number[]) => amounts.reduce((total, amount) => total + Math.round(amount * 100), 0) / 100;

// ---------- What needs attention ----------

export type Urgency = "Overdue" | "Due soon" | "Later" | "Paid";
/** Worked out from the due date, never chosen by hand. Due soon means due today or within the next 30 days. */
export function urgency(call: Pick<Call, "due" | "status">, today: string): Urgency {
  if (call.status === "Paid") return "Paid";
  const days = daysUntil(call.due, today);
  return days < 0 ? "Overdue" : days <= DUE_SOON_DAYS ? "Due soon" : "Later";
}
const rank: Record<Urgency, number> = { Overdue: 0, "Due soon": 1, Later: 2, Paid: 3 };
/** Overdue, then due soon, then later, each by due date (soonest first). Paid calls go last, most recently due first. */
export function byUrgency(calls: Call[], today: string) {
  return [...calls].sort((a, b) => {
    const ua = urgency(a, today), ub = urgency(b, today);
    return rank[ua] - rank[ub] || (ua === "Paid" ? b.due.localeCompare(a.due) : a.due.localeCompare(b.due)) || a.fund.localeCompare(b.fund);
  });
}

export const filters = ["All", "Outstanding", "Due soon"] as const;
export type Filter = typeof filters[number];
export function applyFilter(calls: Call[], filter: Filter, today: string) {
  if (filter === "Outstanding") return calls.filter(call => call.status === "Outstanding");
  if (filter === "Due soon") return calls.filter(call => urgency(call, today) === "Due soon");
  return calls;
}

export function summary(calls: Call[], today: string) {
  const outstanding = calls.filter(call => call.status === "Outstanding");
  const overdue = outstanding.filter(call => urgency(call, today) === "Overdue");
  const soon = outstanding.filter(call => urgency(call, today) === "Due soon");
  return {
    outstandingTotal: sum(outstanding.map(call => call.amount)), outstandingCount: outstanding.length,
    overdueCount: overdue.length, overdueTotal: sum(overdue.map(call => call.amount)),
    dueSoonTotal: sum(soon.map(call => call.amount)), dueSoonCount: soon.length,
  };
}

export const markPaid = (call: Call, paidOn: string): Call => ({ ...call, status: "Paid", paidOn });
export function markOutstanding(call: Call): Call {
  const rest = { ...call, status: "Outstanding" as const };
  delete rest.paidOn;
  return rest;
}

// ---------- Saved data ----------

const text = (value: unknown, max: number) => typeof value === "string" ? value.slice(0, max) : "";
/** Rebuilds the list from untrusted saved data, keeping only known fields and valid values. Returns null if it isn’t a list of calls. */
export function parseCalls(value: unknown): Call[] | null {
  if (!Array.isArray(value) || value.length > MAX_CALLS) return null;
  const calls: Call[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") return null;
    const r = raw as Record<string, unknown>;
    const fund = text(r.fund, LIMITS.fund).trim(), entity = text(r.entity, LIMITS.entity).trim();
    const amount = typeof r.amount === "number" && Number.isFinite(r.amount) && r.amount > 0 && r.amount <= MAX_AMOUNT ? Math.round(r.amount * 100) / 100 : null;
    const due = typeof r.due === "string" && validIso(r.due) ? r.due : "";
    if (!fund || !entity || amount === null || !due) return null;
    const status: Status = r.status === "Paid" ? "Paid" : "Outstanding";
    const paidOn = status === "Paid" && typeof r.paidOn === "string" && validIso(r.paidOn) ? r.paidOn : undefined;
    calls.push({ id: text(r.id, 80) || crypto.randomUUID(), fund, entity, amount, due, notice: text(r.notice, LIMITS.notice), notes: text(r.notes, LIMITS.notes), status, ...(paidOn ? { paidOn } : {}) });
  }
  return calls;
}

export const STORAGE_KEY = "orgtooltank:capital-call-tracker:v1";
export const serializeSaved = (calls: Call[]) => JSON.stringify({ version: 1, calls });
export function parseSaved(raw: string | null): Call[] | null {
  if (!raw) return null;
  try { const data = JSON.parse(raw); return data?.version === 1 ? parseCalls(data.calls) : null; } catch { return null; }
}

// ---------- CSV export ----------

const cell = (value: string | number) => {
  const s = String(value), safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
/** Most urgent first. Amounts are plain numbers (no symbols) so spreadsheets can add them up. */
export function callsCsv(calls: Call[], today: string) {
  const rows: (string | number)[][] = [["Fund / Deal", "Investing entity", `Amount (${CURRENCY})`, "Due date", "Urgency", "Status", "Paid date", "Notice reference", "Notes"]];
  for (const call of byUrgency(calls, today)) rows.push([call.fund, call.entity, call.amount.toFixed(2), call.due, urgency(call, today), call.status, call.paidOn ?? "", call.notice, call.notes]);
  return "\uFEFF" + rows.map(row => row.map(cell).join(",")).join("\r\n") + "\r\n";
}
