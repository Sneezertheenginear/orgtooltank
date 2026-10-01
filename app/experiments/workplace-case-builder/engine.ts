// Case data, timeline ordering, the "Things You May Want to Add" checks, and the plain-text summary.
// It organizes what the user enters. It never decides whether anyone has a legal claim, scores a case,
// or says where or when to file anything.

export const federalOptions = ["Yes", "No", "Not sure"] as const;
export type Federal = "" | typeof federalOptions[number];
export const roleOptions = ["Supervisor or manager", "Coworker", "HR", "Witness", "Decision maker", "Union or representative", "Other"] as const;
export type Role = "" | typeof roleOptions[number];
export const evidenceTypes = ["Email", "Text message", "Work document", "Photo or screenshot", "Witness information", "Other record"] as const;
export type EvidenceType = typeof evidenceTypes[number];
export const actionTypes = ["Spoke with supervisor", "Reported to HR", "Sent email", "Filed internal complaint", "Requested accommodation", "Contacted union or representative", "Other"] as const;
export type ActionType = typeof actionTypes[number];
export const MAX_ENTRIES = 200;

export type Basics = { personName: string; employer: string; jobTitle: string; location: string; state: string; federal: Federal; description: string };
export type TimelineEvent = { id: string; date: string; title: string; people: string; description: string };
export type Person = { id: string; name: string; role: Role; relationship: string };
export type Evidence = { id: string; type: EvidenceType; title: string; date: string; eventId: string; why: string };
export type Action = { id: string; date: string; action: ActionType; contacted: string; response: string; notes: string };
export type CaseFile = { basics: Basics; events: TimelineEvent[]; people: Person[]; evidence: Evidence[]; actions: Action[] };

export const blankCase = (): CaseFile => ({ basics: { personName: "", employer: "", jobTitle: "", location: "", state: "", federal: "", description: "" }, events: [], people: [], evidence: [], actions: [] });
export const isEmptyCase = (c: CaseFile) => !Object.values(c.basics).some(v => v.trim()) && !c.events.length && !c.people.length && !c.evidence.length && !c.actions.length;

// ---------- Dates ----------

export const isoDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const validIso = (text: string) => /^\d{4}-\d{2}-\d{2}$/.test(text) && isoDate(new Date(+text.slice(0, 4), +text.slice(5, 7) - 1, +text.slice(8, 10))) === text;
export const formatDate = (iso: string) => iso ? new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10))).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "No date";

/** Oldest first; undated items go last, in the order they were added. */
export function byDate<T extends { date: string }>(items: T[]) {
  return items.map((item, index) => ({ item, index })).sort((a, b) => (a.item.date || "9999").localeCompare(b.item.date || "9999") || a.index - b.index).map(entry => entry.item);
}

// ---------- Things You May Want to Add ----------

export type Section = "basics" | "timeline" | "people" | "evidence" | "actions";
export type Check = { id: string; section: Section; text: string; detail?: string };

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
export const SHORT_DESCRIPTION_WORDS = 15;
const list = (names: string[]) => names.map(n => `“${n}”`).join(", ");

/** Names written in an event's "people involved" field. Split on commas, semicolons, ampersands, and "and". */
export function namesIn(text: string) {
  return text.split(/,|;|&|\band\b/i).map(n => n.trim()).filter(n => n.length > 1);
}
/** Names mentioned in the timeline that don't match anyone in People (loosely, ignoring case). */
export function unlistedNames(c: CaseFile) {
  const known = c.people.map(p => p.name.trim().toLowerCase()).filter(Boolean);
  const seen = new Map<string, string>();
  for (const event of c.events) for (const name of namesIn(event.people)) {
    const lower = name.toLowerCase();
    if (!known.some(k => k.includes(lower) || lower.includes(k)) && !seen.has(lower)) seen.set(lower, name);
  }
  return [...seen.values()];
}

/**
 * Plain-English gaps in how the information is organized. Not a score, and not a judgment of the case:
 * it only notices blanks and loose ends in what has been entered.
 */
export function missingPieces(c: CaseFile): Check[] {
  const checks: Check[] = [];
  const description = c.basics.description.trim();
  if (!description) checks.push({ id: "no-description", section: "basics", text: "There’s no short description of what happened yet.", detail: "A few sentences in your own words help anyone reading the summary understand the rest." });
  else if (words(description) < SHORT_DESCRIPTION_WORDS) checks.push({ id: "short-description", section: "basics", text: "The description of what happened is very short.", detail: "Someone reading it for the first time may not be able to tell what happened. Add who, what, and roughly when." });
  if (!c.basics.employer.trim()) checks.push({ id: "no-employer", section: "basics", text: "The employer or company isn’t filled in." });

  if (!c.events.length) checks.push({ id: "no-events", section: "timeline", text: "No timeline events have been added yet.", detail: "Add the key moments in order, even if you only know the month." });
  const undated = c.events.filter(e => !e.date);
  if (undated.length) checks.push({ id: "undated-events", section: "timeline", text: `${undated.length} timeline ${undated.length === 1 ? "event has" : "events have"} no date.`, detail: `${list(undated.map(e => e.title))}. An approximate date is fine; mention in the description that it’s approximate.` });
  const blank = c.events.filter(e => !e.description.trim());
  if (blank.length) checks.push({ id: "events-no-description", section: "timeline", text: `${blank.length} timeline ${blank.length === 1 ? "event doesn’t" : "events don’t"} describe what happened.`, detail: list(blank.map(e => e.title)) });

  const unlisted = unlistedNames(c);
  if (unlisted.length) checks.push({ id: "unlisted-people", section: "people", text: `${unlisted.length} ${unlisted.length === 1 ? "name appears" : "names appear"} in the timeline but not in People.`, detail: `${list(unlisted)}. Adding them with their role makes it clear who each person is.` });
  const unclear = c.people.filter(p => !p.role || (p.role === "Other" && !p.relationship.trim()));
  if (unclear.length) checks.push({ id: "unclear-roles", section: "people", text: `${unclear.length === 1 ? "1 person’s role is" : `${unclear.length} people’s roles are`} unclear.`, detail: `${list(unclear.map(p => p.name))}. Choose a role or describe how they’re connected.` });

  const loose = c.evidence.filter(e => !e.eventId || !c.events.some(ev => ev.id === e.eventId));
  if (loose.length) checks.push({ id: "loose-evidence", section: "evidence", text: `${loose.length} evidence ${loose.length === 1 ? "item isn’t" : "items aren’t"} connected to a timeline event.`, detail: `${list(loose.map(e => e.title))}. Connecting each item to an event shows what it relates to.` });
  const noWhy = c.evidence.filter(e => !e.why.trim());
  if (noWhy.length) checks.push({ id: "evidence-no-why", section: "evidence", text: `${noWhy.length} evidence ${noWhy.length === 1 ? "item doesn’t" : "items don’t"} say why it may matter.`, detail: list(noWhy.map(e => e.title)) });

  const noResponse = c.actions.filter(a => !a.response.trim());
  if (noResponse.length) checks.push({ id: "actions-no-response", section: "actions", text: `${noResponse.length} ${noResponse.length === 1 ? "action has" : "actions have"} no response recorded.`, detail: `${list(noResponse.map(actionLabel))}. If nobody responded, write “No response yet” so it’s clear.` });
  const undatedActions = c.actions.filter(a => !a.date);
  if (undatedActions.length) checks.push({ id: "undated-actions", section: "actions", text: `${undatedActions.length} ${undatedActions.length === 1 ? "action has" : "actions have"} no date.`, detail: list(undatedActions.map(actionLabel)) });
  return checks;
}
export const actionLabel = (a: Pick<Action, "action" | "contacted">) => a.contacted.trim() ? `${a.action} (${a.contacted.trim()})` : a.action;

// ---------- Summary (Copy Summary) ----------

export const DISCLAIMER = "This tool helps you organize workplace information. It does not determine whether you have a legal claim and is not legal advice.";

export function summaryText(c: CaseFile, today = new Date()) {
  const b = c.basics, events = byDate(c.events), eventTitle = (id: string) => c.events.find(e => e.id === id)?.title;
  const lines: string[] = ["WORKPLACE CASE SUMMARY", `Prepared ${formatDate(isoDate(today))} with Workplace Case Builder (OrgToolTank)`, ""];
  const field = (label: string, value: string) => { if (value.trim()) lines.push(`${label}: ${value.trim()}`); };
  lines.push("CASE BASICS");
  field("Name", b.personName); field("Employer / company", b.employer); field("Job title", b.jobTitle); field("Work location", b.location); field("State", b.state); field("Federal employee", b.federal);
  if (lines[lines.length - 1] === "CASE BASICS") lines.push("Not filled in.");
  lines.push("", "WHAT HAPPENED", b.description.trim() || "Not filled in.");
  lines.push("", "TIMELINE");
  if (!events.length) lines.push("No events added.");
  events.forEach((e, i) => {
    lines.push(`${i + 1}. ${formatDate(e.date)} — ${e.title}`);
    if (e.people.trim()) lines.push(`   People involved: ${e.people.trim()}`);
    if (e.description.trim()) lines.push(`   ${e.description.trim()}`);
  });
  lines.push("", "PEOPLE");
  if (!c.people.length) lines.push("No people added.");
  for (const p of c.people) lines.push(`- ${p.name} — ${p.role || "Role not given"}${p.relationship.trim() ? `. ${p.relationship.trim()}` : ""}`);
  lines.push("", "EVIDENCE");
  if (!c.evidence.length) lines.push("No evidence listed.");
  for (const e of byDate(c.evidence)) {
    lines.push(`- ${e.type}: ${e.title}${e.date ? ` (${formatDate(e.date)})` : ""}`);
    lines.push(`   Related event: ${eventTitle(e.eventId) ?? "Not connected"}`);
    if (e.why.trim()) lines.push(`   Why it may matter: ${e.why.trim()}`);
  }
  lines.push("", "ACTIONS ALREADY TAKEN");
  if (!c.actions.length) lines.push("No actions recorded.");
  for (const a of byDate(c.actions)) {
    lines.push(`- ${formatDate(a.date)} — ${actionLabel(a)}`);
    lines.push(`   Response: ${a.response.trim() || "None recorded"}`);
    if (a.notes.trim()) lines.push(`   Notes: ${a.notes.trim()}`);
  }
  const checks = missingPieces(c);
  lines.push("", "THINGS YOU MAY WANT TO ADD");
  if (!checks.length) lines.push("Nothing obvious is missing from what’s been entered.");
  for (const check of checks) lines.push(`- ${check.text}${check.detail ? ` ${check.detail}` : ""}`);
  lines.push("", DISCLAIMER);
  return lines.join("\n");
}

// ---------- Saving (only if the user turns it on) ----------

export const STORAGE_KEY = "orgtooltank:workplace-case-builder:v1";
export const serializeSaved = (c: CaseFile) => JSON.stringify({ version: 1, case: c });

const text = (value: unknown, max: number) => typeof value === "string" ? value.slice(0, max) : "";
const pick = <T extends readonly string[]>(options: T, value: unknown, fallback: T[number] | ""): T[number] | "" => (options as readonly unknown[]).includes(value) ? value as T[number] : fallback;
const date = (value: unknown) => typeof value === "string" && validIso(value) ? value : "";
const id = (value: unknown) => text(value, 80) || crypto.randomUUID();
const rows = (value: unknown) => Array.isArray(value) ? value.slice(0, MAX_ENTRIES).filter((r): r is Record<string, unknown> => !!r && typeof r === "object") : [];

/** Rebuilds a case from untrusted saved data, keeping only known fields and valid values. */
export function parseCase(value: unknown): CaseFile | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>, b = (data.basics ?? {}) as Record<string, unknown>;
  return {
    basics: { personName: text(b.personName, 120), employer: text(b.employer, 150), jobTitle: text(b.jobTitle, 120), location: text(b.location, 150), state: text(b.state, 60), federal: pick(federalOptions, b.federal, ""), description: text(b.description, 4000) },
    events: rows(data.events).map(r => ({ id: id(r.id), date: date(r.date), title: text(r.title, 200) || "Untitled event", people: text(r.people, 300), description: text(r.description, 4000) })),
    people: rows(data.people).map(r => ({ id: id(r.id), name: text(r.name, 120) || "Unnamed person", role: pick(roleOptions, r.role, ""), relationship: text(r.relationship, 500) })),
    evidence: rows(data.evidence).map(r => ({ id: id(r.id), type: pick(evidenceTypes, r.type, "Other record") as EvidenceType, title: text(r.title, 200) || "Untitled item", date: date(r.date), eventId: text(r.eventId, 80), why: text(r.why, 1000) })),
    actions: rows(data.actions).map(r => ({ id: id(r.id), date: date(r.date), action: pick(actionTypes, r.action, "Other") as ActionType, contacted: text(r.contacted, 150), response: text(r.response, 1000), notes: text(r.notes, 2000) })),
  };
}
export function parseSaved(raw: string | null): CaseFile | null {
  if (!raw) return null;
  try { const data = JSON.parse(raw); return data?.version === 1 ? parseCase(data.case) : null; } catch { return null; }
}
