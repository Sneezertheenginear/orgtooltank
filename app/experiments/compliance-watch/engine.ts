// Tracker data, date math, attention ordering, renewals, and every export (CSV, calendar, backup).
// It organizes what the user enters. It never decides which requirements apply or whether anyone is compliant.

export const categories = ["License / Permit", "Insurance", "Certification", "Registration / Filing", "Inspection", "Training", "Contract", "Policy review", "Other"] as const;
export type Category = typeof categories[number];
export const statuses = ["Not started", "In progress", "Current", "Not applicable"] as const;
export type Status = typeof statuses[number];
export const dueSoonOptions = [7, 14, 30, 60] as const;
export type DueSoonDays = typeof dueSoonOptions[number];
export const repeatPresets: { months: number; label: string }[] = [{ months: 0, label: "Doesn’t repeat" }, { months: 1, label: "Monthly" }, { months: 3, label: "Quarterly" }, { months: 6, label: "Every 6 months" }, { months: 12, label: "Yearly" }];
export const MAX_ITEMS = 500, MAX_REPEAT_MONTHS = 120;

/** The last renewal only, so it can be shown and undone. Not a history system. */
export type Renewal = { on: string; previousDue: string; previousStatus: Status };
export type Item = { id: string; title: string; category: Category; due: string; status: Status; owner: string; notes: string; repeatMonths: number; renewed?: Renewal };
export type Tracker = { organization: string; dueSoonDays: DueSoonDays; items: Item[] };
export const blankTracker = (): Tracker => ({ organization: "", dueSoonDays: 14, items: [] });

// ---------- Dates (calendar days in the user's own time zone) ----------

export const isoDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const validIso = (text: string) => /^\d{4}-\d{2}-\d{2}$/.test(text) && isoDate(new Date(+text.slice(0, 4), +text.slice(5, 7) - 1, +text.slice(8, 10))) === text;
const utc = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
export const daysUntil = (due: string, today: string) => Math.round((utc(due) - utc(today)) / 86_400_000);
/** Adds whole months; a day that doesn't exist in the new month becomes that month's last day (Jan 31 → Feb 28). */
export function addMonths(iso: string, months: number) {
  const y = +iso.slice(0, 4), m = +iso.slice(5, 7) - 1 + months, d = +iso.slice(8, 10);
  const last = new Date(y, m + 1, 0).getDate();
  return isoDate(new Date(y, m, Math.min(d, last)));
}
export const formatDate = (iso: string) => new Date(utc(iso)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
export function repeatLabel(months: number) {
  return repeatPresets.find(preset => preset.months === months)?.label ?? `Every ${months} months`;
}

// ---------- What needs attention ----------

export type DateState = "Overdue" | "Due soon" | "Upcoming" | "No date" | "Not applicable";
/**
 * Worked out from the date, never chosen by hand. Anything still being tracked (every status except
 * Not applicable) is Overdue once its date has passed and Due soon when it falls inside the window.
 */
export function dateState(item: Pick<Item, "due" | "status">, today: string, dueSoonDays: number): DateState {
  if (item.status === "Not applicable") return "Not applicable";
  if (!item.due) return "No date";
  const days = daysUntil(item.due, today);
  return days < 0 ? "Overdue" : days <= dueSoonDays ? "Due soon" : "Upcoming";
}
export function relativeDue(due: string, today: string) {
  if (!due) return "No date";
  const days = daysUntil(due, today);
  if (days === 0) return "Due today";
  return days > 0 ? `In ${days} ${days === 1 ? "day" : "days"}` : `${-days} ${days === -1 ? "day" : "days"} overdue`;
}

const rank: Record<DateState, number> = { Overdue: 0, "Due soon": 1, Upcoming: 2, "No date": 3, "Not applicable": 4 };
/** Most urgent first: overdue, due soon, upcoming by date, then undated items, then not applicable. */
export function byUrgency(items: Item[], today: string, dueSoonDays: number) {
  return [...items].sort((a, b) => rank[dateState(a, today, dueSoonDays)] - rank[dateState(b, today, dueSoonDays)] || (a.due || "9999").localeCompare(b.due || "9999") || a.title.localeCompare(b.title));
}

export function counts(items: Item[], today: string, dueSoonDays: number) {
  const result = { overdue: 0, dueSoon: 0, current: 0, inProgress: 0, notStarted: 0 };
  for (const item of items) {
    const state = dateState(item, today, dueSoonDays);
    if (state === "Overdue") result.overdue++;
    else if (state === "Due soon") result.dueSoon++;
    if (item.status === "In progress") result.inProgress++;
    if (item.status === "Not started") result.notStarted++;
    // "Current" here means marked current and not flagged by its date.
    if (item.status === "Current" && state !== "Overdue" && state !== "Due soon") result.current++;
  }
  return result;
}

// ---------- Renewals ----------

/**
 * Moves a repeating item to its next date: one period after the current date, then further if that is
 * still today or earlier (a late renewal skips the missed periods). Keeps only the last renewal for Undo.
 */
export function renew(item: Item, today: string): Item {
  if (!item.repeatMonths || !item.due) return item;
  let next = addMonths(item.due, item.repeatMonths);
  for (let guard = 0; daysUntil(next, today) <= 0 && guard < 1200; guard++) next = addMonths(next, item.repeatMonths);
  return { ...item, due: next, status: "Current", renewed: { on: today, previousDue: item.due, previousStatus: item.status } };
}
export function undoRenewal(item: Item): Item {
  if (!item.renewed) return item;
  const { renewed, ...rest } = item;
  return { ...rest, due: renewed.previousDue, status: renewed.previousStatus };
}

// ---------- Validation (saved data and backups) ----------

const text = (value: unknown, max: number) => typeof value === "string" ? value.slice(0, max) : "";
const pick = <T extends readonly (string | number)[]>(list: T, value: unknown, fallback: T[number]): T[number] => (list as readonly unknown[]).includes(value) ? value as T[number] : fallback;
/** Rebuilds a tracker from untrusted data, keeping only known fields and valid values. Returns null if it isn’t a tracker. */
export function parseTracker(value: unknown): Tracker | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  if (!Array.isArray(data.items) || data.items.length > MAX_ITEMS) return null;
  const items: Item[] = [];
  for (const raw of data.items) {
    if (!raw || typeof raw !== "object") return null;
    const r = raw as Record<string, unknown>;
    const title = text(r.title, 200).trim();
    if (!title) return null;
    const due = typeof r.due === "string" && validIso(r.due) ? r.due : "";
    const months = typeof r.repeatMonths === "number" && Number.isInteger(r.repeatMonths) && r.repeatMonths >= 0 && r.repeatMonths <= MAX_REPEAT_MONTHS ? r.repeatMonths : 0;
    const rn = r.renewed as Record<string, unknown> | undefined;
    const renewed = rn && typeof rn.on === "string" && validIso(rn.on) && typeof rn.previousDue === "string" && validIso(rn.previousDue) ? { on: rn.on, previousDue: rn.previousDue, previousStatus: pick(statuses, rn.previousStatus, "Not started") } : undefined;
    items.push({ id: text(r.id, 80) || crypto.randomUUID(), title, category: pick(categories, r.category, "Other"), due, status: pick(statuses, r.status, "Not started"), owner: text(r.owner, 120), notes: text(r.notes, 1000), repeatMonths: months, ...(renewed ? { renewed } : {}) });
  }
  return { organization: text(data.organization, 150), dueSoonDays: pick(dueSoonOptions, data.dueSoonDays, 14), items };
}

export const STORAGE_KEY = "orgtooltank:compliance-watch:v1";
export const serializeSaved = (tracker: Tracker) => JSON.stringify({ version: 1, tracker });
export function parseSaved(raw: string | null): Tracker | null {
  if (!raw) return null;
  try { const data = JSON.parse(raw); return data?.version === 1 ? parseTracker(data.tracker) : null; } catch { return null; }
}

export const BACKUP_APP = "orgtooltank-compliance-watch";
export const backupJson = (tracker: Tracker, now = new Date()) => JSON.stringify({ app: BACKUP_APP, version: 1, exportedAt: now.toISOString(), tracker }, null, 2);
/** Accepts only a Compliance Watch backup; explains what’s wrong otherwise. */
export function parseBackup(raw: string): { tracker: Tracker } | { error: string } {
  let data: Record<string, unknown>;
  try { data = JSON.parse(raw); } catch { return { error: "This file isn’t valid JSON, so it can’t be a Compliance Watch backup." }; }
  if (!data || data.app !== BACKUP_APP) return { error: "This file isn’t a Compliance Watch backup." };
  if (data.version !== 1) return { error: "This backup was made by a different version of Compliance Watch and can’t be restored here." };
  const tracker = parseTracker(data.tracker);
  return tracker ? { tracker } : { error: `This backup is damaged or incomplete (every item needs a title, and there can be up to ${MAX_ITEMS} items).` };
}

// ---------- CSV and calendar exports ----------

const cell = (value: string | number) => {
  const s = String(value), safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
export function trackerCsv(tracker: Tracker, today: string) {
  const rows: (string | number)[][] = [["Organization", "Requirement", "Category", "Due or renewal date", "Date status", "Status", "Responsible", "Repeats", "Last renewed", "Notes"]];
  for (const item of byUrgency(tracker.items, today, tracker.dueSoonDays)) {
    rows.push([tracker.organization, item.title, item.category, item.due, dateState(item, today, tracker.dueSoonDays), item.status, item.owner, item.repeatMonths ? repeatLabel(item.repeatMonths) : "", item.renewed ? `${item.renewed.on} (was due ${item.renewed.previousDue})` : "", item.notes]);
  }
  return "\uFEFF" + rows.map(row => row.map(cell).join(",")).join("\r\n") + "\r\n";
}

const icsText = (value: string) => value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
/** Folds lines longer than 75 bytes as the calendar format requires, without splitting a character. */
function fold(line: string) {
  const encoder = new TextEncoder(), out: string[] = [];
  let current = "", bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > (out.length ? 74 : 75)) { out.push(current); current = ""; bytes = 0; }
    current += char; bytes += size;
  }
  out.push(current);
  return out.join("\r\n ");
}
const icsDate = (iso: string) => iso.replace(/-/g, "");
/**
 * All-day calendar events for dated items that are still tracked. Repeating items get a repeat rule.
 * Each event carries one alert matching the Due soon window; calendar apps may show or ignore it.
 */
export function calendarIcs(tracker: Tracker, now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//OrgToolTank//Compliance Watch browser experiment//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${icsText(`Compliance Watch${tracker.organization ? `: ${tracker.organization}` : ""}`)}`];
  for (const item of tracker.items) {
    if (!item.due || item.status === "Not applicable") continue;
    const details = [`Category: ${item.category}`, `Status when exported: ${item.status}`, item.owner && `Responsible: ${item.owner}`, item.repeatMonths ? `Repeats: ${repeatLabel(item.repeatMonths)}` : "", item.notes && `Notes: ${item.notes}`, "Exported from Compliance Watch (OrgToolTank). A tracking reminder you entered, not legal advice."].filter(Boolean).join("\n");
    lines.push("BEGIN:VEVENT", `UID:${item.id}@compliance-watch.orgtooltank`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${icsDate(item.due)}`, `DTEND;VALUE=DATE:${icsDate(addDays(item.due, 1))}`, `SUMMARY:${icsText(`Due: ${item.title}`)}`, `DESCRIPTION:${icsText(details)}`, "TRANSP:TRANSPARENT");
    if (item.repeatMonths) lines.push(`RRULE:FREQ=MONTHLY;INTERVAL=${item.repeatMonths}`);
    lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsText(`Coming up: ${item.title}`)}`, `TRIGGER:-P${tracker.dueSoonDays}D`, "END:VALARM", "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
function addDays(iso: string, days: number) {
  const date = new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10) + days);
  return isoDate(date);
}
export const calendarEventCount = (tracker: Tracker) => tracker.items.filter(item => item.due && item.status !== "Not applicable").length;
