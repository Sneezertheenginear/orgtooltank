// Loads, follow-up dates, status changes, validation, and every export (CSV and backup).
// Money is kept in whole cents so totals never pick up floating-point rounding errors.
// Nothing here sends email or contacts anyone; it only records what the user did.

export const statuses = ["missing", "review", "ready"] as const;
export type Status = typeof statuses[number];
export const statusLabel: Record<Status, string> = { missing: "Missing POD", review: "POD received", ready: "Ready to bill" };
export type Activity = { at: string; text: string };
export type Load = { id: string; loadNumber: string; deliveredDate: string; carrier: string; contactName: string; contactEmail: string; amountCents: number; status: Status; nextFollowUp: string; history: Activity[] };
export const MAX_LOADS = 1000, MAX_HISTORY = 200, MAX_CENTS = 100_000_000_00;

// ---------- Dates (calendar days in the user's own time zone) ----------

export const isoDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const validIso = (text: string) => /^\d{4}-\d{2}-\d{2}$/.test(text) && isoDate(new Date(+text.slice(0, 4), +text.slice(5, 7) - 1, +text.slice(8, 10))) === text;
export const addDays = (iso: string, days: number) => isoDate(new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10) + days));
export const formatDate = (iso: string) => iso ? new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10))).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "—";
export const formatTime = (at: string) => { const d = new Date(at); return Number.isNaN(d.getTime()) ? at : d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }); };

// ---------- Money ----------

/** "$1,234.5" → 123450. Returns null for anything that isn't a plain amount of zero or more with at most two decimals. */
export function parseAmountCents(text: string): number | null {
  const clean = text.trim().replace(/^\$/, "").replace(/,/g, "");
  if (!/^\d+(\.\d{0,2})?$/.test(clean) && !/^\.\d{1,2}$/.test(clean)) return null;
  const [whole, fraction = ""] = clean.split(".");
  const cents = Number(whole || "0") * 100 + Number((fraction + "00").slice(0, 2));
  return Number.isSafeInteger(cents) && cents <= MAX_CENTS ? cents : null;
}
export const formatMoney = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
/** Plain decimal for form fields and CSV, built from the integer so it never shows 0.30000000000000004. */
export const centsToDecimal = (cents: number) => `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;

// ---------- Follow-ups ----------

export type Due = "overdue" | "today" | "upcoming" | "none";
/** Only loads still missing a POD need follow-ups. */
export function dueState(load: Pick<Load, "status" | "nextFollowUp">, today: string): Due {
  if (load.status !== "missing" || !load.nextFollowUp) return "none";
  return load.nextFollowUp < today ? "overdue" : load.nextFollowUp === today ? "today" : "upcoming";
}
export function summary(loads: Load[], today: string) {
  const missing = loads.filter(l => l.status === "missing"), ready = loads.filter(l => l.status === "ready");
  return {
    missing: missing.length,
    overdue: missing.filter(l => dueState(l, today) === "overdue").length,
    dueToday: missing.filter(l => dueState(l, today) === "today").length,
    readyCents: ready.reduce((sum, l) => sum + l.amountCents, 0),
    readyCount: ready.length,
  };
}
/** Next follow-up first (soonest at the top); loads without one follow, oldest delivery first. */
export function byFollowUp(loads: Load[]) {
  return [...loads].sort((a, b) => (a.nextFollowUp || "9999").localeCompare(b.nextFollowUp || "9999") || a.deliveredDate.localeCompare(b.deliveredDate) || a.loadNumber.localeCompare(b.loadNumber, undefined, { numeric: true }));
}
export type View = Status | "all";
export function visible(loads: Load[], view: View, query: string) {
  const q = query.trim().toLowerCase();
  return byFollowUp(loads.filter(l => (view === "all" || l.status === view) && (!q || l.loadNumber.toLowerCase().includes(q) || l.carrier.toLowerCase().includes(q))));
}

// ---------- Actions (each one adds to the activity history) ----------

const note = (load: Load, text: string, now: Date): Load => ({ ...load, history: [{ at: now.toISOString(), text }, ...load.history].slice(0, MAX_HISTORY) });
export const FOLLOW_UP_DAYS = 2;
/** A call or email was made today, so the next follow-up is two days from today. */
export function logContact(load: Load, kind: "call" | "email", now = new Date()): Load {
  const next = addDays(isoDate(now), FOLLOW_UP_DAYS);
  return note({ ...load, nextFollowUp: next }, `${kind === "call" ? "Call" : "Email"} logged. Next follow-up ${formatDate(next)}.`, now);
}
/** One day later than the current follow-up, or tomorrow if it's already due or overdue. */
export function snooze(load: Load, now = new Date()): Load {
  const today = isoDate(now), from = load.nextFollowUp && load.nextFollowUp > today ? load.nextFollowUp : today, next = addDays(from, 1);
  return note({ ...load, nextFollowUp: next }, `Follow-up snoozed to ${formatDate(next)}.`, now);
}
export const markReceived = (load: Load, now = new Date()): Load => note({ ...load, status: "review", nextFollowUp: "" }, "POD received. Waiting for review.", now);
export const markReady = (load: Load, now = new Date()): Load => note({ ...load, status: "ready", nextFollowUp: "" }, "Marked ready to bill.", now);
/** For mistakes: Review goes back to Chase with a follow-up today; Ready goes back to Review. */
export function moveBack(load: Load, now = new Date()): Load {
  if (load.status === "review") return note({ ...load, status: "missing", nextFollowUp: isoDate(now) }, "Moved back to Chase. POD still needed.", now);
  if (load.status === "ready") return note({ ...load, status: "review" }, "Moved back to Review.", now);
  return load;
}

export function followUpMailto(load: Load) {
  const subject = `POD needed for load #${load.loadNumber}`;
  const body = `Hi${load.contactName ? ` ${load.contactName}` : ""},\n\nCould you send the signed proof of delivery for load #${load.loadNumber}${load.deliveredDate ? `, delivered ${formatDate(load.deliveredDate)}` : ""}?\n\nThank you.`;
  return `mailto:${encodeURIComponent(load.contactEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ---------- Add / edit ----------

export type Draft = { loadNumber: string; deliveredDate: string; carrier: string; contactName: string; contactEmail: string; amount: string; nextFollowUp: string };
export const emptyDraft = (): Draft => ({ loadNumber: "", deliveredDate: "", carrier: "", contactName: "", contactEmail: "", amount: "", nextFollowUp: "" });
export const draftOf = (load: Load): Draft => ({ loadNumber: load.loadNumber, deliveredDate: load.deliveredDate, carrier: load.carrier, contactName: load.contactName, contactEmail: load.contactEmail, amount: centsToDecimal(load.amountCents), nextFollowUp: load.nextFollowUp });
export const validEmail = (text: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
export const sameNumber = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
export type DraftErrors = Partial<Record<keyof Draft, string>>;

/**
 * Checks a new or edited load. `editing` is the load being changed (null when adding); its own number
 * doesn't count as a duplicate, and a follow-up date is only needed while the POD is missing.
 */
export function validateDraft(draft: Draft, loads: Load[], editing: Load | null): { errors: DraftErrors } | { fields: Omit<Load, "id" | "status" | "history"> } {
  const errors: DraftErrors = {}, number = draft.loadNumber.trim(), email = draft.contactEmail.trim();
  if (!number) errors.loadNumber = "Enter the load number.";
  else if (loads.some(l => l.id !== editing?.id && sameNumber(l.loadNumber, number))) errors.loadNumber = `Load #${number} is already in the list.`;
  if (!validIso(draft.deliveredDate)) errors.deliveredDate = "Enter the delivered date.";
  if (!draft.carrier.trim()) errors.carrier = "Enter the carrier.";
  if (email && !validEmail(email)) errors.contactEmail = "That email address doesn’t look right. Check it or leave it blank.";
  const cents = parseAmountCents(draft.amount);
  if (!draft.amount.trim()) errors.amount = "Enter the amount (0 is fine).";
  else if (cents === null) errors.amount = "Enter an amount of zero or more, like 1250 or 1,250.00.";
  const needsFollowUp = !editing || editing.status === "missing";
  if (needsFollowUp && !validIso(draft.nextFollowUp)) errors.nextFollowUp = editing ? "Enter the next follow-up date." : "Enter when to first follow up.";
  if (Object.keys(errors).length) return { errors };
  return { fields: { loadNumber: number.slice(0, 40), deliveredDate: draft.deliveredDate, carrier: draft.carrier.trim().slice(0, 120), contactName: draft.contactName.trim().slice(0, 120), contactEmail: email.slice(0, 200), amountCents: cents!, nextFollowUp: needsFollowUp ? draft.nextFollowUp : "" } };
}
export function createLoad(fields: Omit<Load, "id" | "status" | "history">, now = new Date()): Load {
  return note({ ...fields, id: crypto.randomUUID(), status: "missing", history: [] }, `Load created. First follow-up ${formatDate(fields.nextFollowUp)}.`, now);
}
export function editLoad(load: Load, fields: Omit<Load, "id" | "status" | "history">, now = new Date()): Load {
  return note({ ...load, ...fields }, "Load details edited.", now);
}

// ---------- Saved data, backups, and CSV ----------

export const STORAGE_KEY = "orgtooltank:pod-chaser:v1";
export const serializeSaved = (loads: Load[]) => JSON.stringify({ version: 1, loads });
const text = (value: unknown, max: number) => typeof value === "string" ? value.slice(0, max) : "";

/** Rebuilds loads from untrusted data, keeping only known fields and valid values. Returns null if it isn't a load list. */
export function parseLoads(value: unknown): Load[] | null {
  if (!Array.isArray(value) || value.length > MAX_LOADS) return null;
  const loads: Load[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") return null;
    const r = raw as Record<string, unknown>, loadNumber = text(r.loadNumber, 40).trim();
    if (!loadNumber || loads.some(l => sameNumber(l.loadNumber, loadNumber))) return null;
    if (typeof r.amountCents !== "number" || !Number.isSafeInteger(r.amountCents) || r.amountCents < 0 || r.amountCents > MAX_CENTS) return null;
    const status = (statuses as readonly unknown[]).includes(r.status) ? r.status as Status : "missing";
    const next = typeof r.nextFollowUp === "string" && validIso(r.nextFollowUp) ? r.nextFollowUp : "";
    const history = Array.isArray(r.history) ? r.history.slice(0, MAX_HISTORY).filter((h): h is Record<string, unknown> => !!h && typeof h === "object" && typeof h.at === "string" && typeof h.text === "string").map(h => ({ at: text(h.at, 40), text: text(h.text, 300) })) : [];
    const email = text(r.contactEmail, 200).trim();
    loads.push({
      id: text(r.id, 80) || crypto.randomUUID(), loadNumber,
      deliveredDate: typeof r.deliveredDate === "string" && validIso(r.deliveredDate) ? r.deliveredDate : "",
      carrier: text(r.carrier, 120), contactName: text(r.contactName, 120), contactEmail: validEmail(email) ? email : "",
      amountCents: r.amountCents, status, nextFollowUp: status === "missing" ? next : "", history,
    });
  }
  return loads;
}
export function parseSaved(raw: string | null): Load[] | null {
  if (!raw) return null;
  try { const data = JSON.parse(raw); return data?.version === 1 ? parseLoads(data.loads) : null; } catch { return null; }
}

export const BACKUP_APP = "orgtooltank-pod-chaser";
export const backupJson = (loads: Load[], now = new Date()) => JSON.stringify({ app: BACKUP_APP, version: 1, exportedAt: now.toISOString(), loads }, null, 2);
/** Accepts only a POD Chaser backup; explains what's wrong otherwise. */
export function parseBackup(raw: string): { loads: Load[] } | { error: string } {
  let data: Record<string, unknown>;
  try { data = JSON.parse(raw); } catch { return { error: "This file isn’t valid JSON, so it can’t be a POD Chaser backup." }; }
  if (!data || data.app !== BACKUP_APP) return { error: "This file isn’t a POD Chaser backup." };
  if (data.version !== 1) return { error: "This backup was made by a different version of POD Chaser and can’t be restored here." };
  const loads = parseLoads(data.loads);
  return loads ? { loads } : { error: `This backup is damaged or incomplete (every load needs a unique load number and a valid amount, and there can be up to ${MAX_LOADS} loads).` };
}

const cell = (value: string | number) => {
  const s = String(value), safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
export function loadsCsv(loads: Load[], today: string) {
  const dueText: Record<Due, string> = { overdue: "Overdue", today: "Due today", upcoming: "Scheduled", none: "" };
  const rows: (string | number)[][] = [["Load #", "Carrier", "Contact", "Contact email", "Delivered", "Status", "Next follow-up", "Follow-up status", "Amount (USD)", "Last activity"]];
  for (const l of byFollowUp(loads)) rows.push([l.loadNumber, l.carrier, l.contactName, l.contactEmail, l.deliveredDate, statusLabel[l.status], l.nextFollowUp, dueText[dueState(l, today)], centsToDecimal(l.amountCents), l.history[0] ? `${formatTime(l.history[0].at)}: ${l.history[0].text}` : ""]);
  return "﻿" + rows.map(row => row.map(cell).join(",")).join("\r\n") + "\r\n";
}
