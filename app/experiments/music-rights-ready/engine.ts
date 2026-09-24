// State, split checks, checklist notes, saved-progress validation and the plain-text export.
// This organizes what the user enters; it never decides who legally owns anything.
import { DISCLAIMER, LINKS_CHECKED, explainers, items, officialLinks, type ItemId } from "./content";

export const roles = ["Songwriter", "Composer", "Producer", "Featured artist", "Other collaborator", "Not sure"] as const;
export type Role = typeof roles[number];
export const proOptions = ["", "ASCAP", "BMI", "SESAC", "GMR", "Other PRO", "Not a member yet", "Not sure"] as const;
export const publishingOptions = ["", "Self-published / no publisher", "Has a publisher", "Uses a publishing administrator", "Not sure"] as const;
export const statuses = ["Not started", "In progress", "Done", "Not applicable", "Not sure"] as const;
export type Status = typeof statuses[number];

export type Person = { id: string; name: string; roles: Role[]; sharesSong: boolean; songShare: string; pro: typeof proOptions[number]; publishing: typeof publishingOptions[number] };
export type Owner = { id: string; name: string; share: string };
export type RightsState = {
  song: { title: string; artist: string; released: "" | "unreleased" | "released"; date: string };
  people: Person[];
  owners: Owner[];
  ownersNotSure: boolean;
  statuses: Partial<Record<ItemId, Status>>;
};
export const emptyState = (): RightsState => ({ song: { title: "", artist: "", released: "", date: "" }, people: [], owners: [], ownersNotSure: false, statuses: {} });

/** Songwriters and composers share in the song; anyone else only if the user says so. */
export const writesSong = (person: Person) => person.roles.includes("Songwriter") || person.roles.includes("Composer") || person.sharesSong;

/** A percentage in hundredths (so 33.33 + 33.33 + 33.34 is exactly 100.00). null when not a valid 0–100 number. */
export function parseShare(text: string): number | null {
  const clean = text.trim().replace(/%$/, "").trim();
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(clean)) return null;
  const [whole, fraction = ""] = clean.split(".");
  const hundredths = Number(whole) * 100 + Number((fraction + "00").slice(0, 2));
  return hundredths <= 10000 ? hundredths : null;
}
const pct = (hundredths: number) => `${(hundredths / 100).toFixed(2).replace(/\.?0+$/, "")}%`;

export type SplitCheck = { total: number; entered: number; missing: string[]; invalid: string[]; ok: boolean; message: string };
function checkShares(rows: { name: string; share: string }[], what: string): SplitCheck {
  let total = 0, entered = 0;
  const missing: string[] = [], invalid: string[] = [];
  for (const row of rows) {
    const label = row.name.trim() || "Unnamed";
    if (!row.share.trim()) { missing.push(label); continue; }
    const value = parseShare(row.share);
    if (value === null) { invalid.push(label); continue; }
    total += value; entered++;
  }
  const ok = rows.length > 0 && !missing.length && !invalid.length && total === 10000;
  const message = !rows.length ? `No ${what} added yet.`
    : invalid.length ? `Enter shares as numbers from 0 to 100 (check ${invalid.join(", ")}).`
    : missing.length ? `${missing.join(", ")} ${missing.length === 1 ? "has" : "have"} no share yet. Entered shares add up to ${pct(total)}.`
    : total === 10000 ? `Adds up to 100%.` : `These add up to ${pct(total)}, not 100%.`;
  return { total, entered, missing, invalid, ok, message };
}
export const songSplits = (state: RightsState) => checkShares(state.people.filter(writesSong).map(person => ({ name: person.name, share: person.songShare })), "songwriters");
export const masterSplits = (state: RightsState) => checkShares(state.owners, "recording owners");

/** Short notes that tie a checklist item to what the user entered. They never mark anything done. */
export function notesFor(id: ItemId, state: RightsState): string[] {
  const writers = state.people.filter(writesSong), named = (list: Person[]) => list.map(person => person.name.trim() || "Unnamed").join(", ");
  const unsure = state.people.filter(person => person.roles.includes("Not sure"));
  switch (id) {
    case "splits": {
      const check = songSplits(state), notes = [check.message];
      if (unsure.length) notes.push(`Role not sure yet: ${named(unsure)}. Decide whether they helped write the song.`);
      return notes;
    }
    case "master": {
      if (state.ownersNotSure) return ["You marked recording ownership as not sure yet."];
      const notes = [masterSplits(state).message];
      const producers = state.people.filter(person => person.roles.includes("Producer"));
      if (producers.length) notes.push(`Producer${producers.length === 1 ? "" : "s"}: ${named(producers)}. Write down whether they own part of the recording, get points, or were paid a fee.`);
      return notes;
    }
    case "proJoin": {
      const none = writers.filter(person => !person.pro || person.pro === "Not a member yet" || person.pro === "Not sure");
      return writers.length ? [none.length ? `No PRO confirmed yet for: ${named(none)}.` : "Every songwriter you listed has a PRO recorded."] : ["Add songwriters in step 02 to see who needs a PRO."];
    }
    case "publishing": {
      const unset = writers.filter(person => !person.publishing || person.publishing === "Not sure");
      return unset.length ? [`Publishing not sure yet for: ${named(unset)}.`] : [];
    }
    case "releaseDetails": {
      const featured = state.people.filter(person => person.roles.includes("Featured artist"));
      return [...(!state.song.title.trim() || !state.song.artist.trim() ? ["Add the song title and artist name in step 01."] : []), ...(featured.length ? [`Credit featured artist${featured.length === 1 ? "" : "s"} the same way everywhere: ${named(featured)}.`] : [])];
    }
    case "proRegister":
    case "copyright":
      return state.song.released === "released" ? ["The song is already released. Registrations can often still be completed afterward; check each organization’s current rules."] : [];
    default:
      return [];
  }
}

export const statusOf = (state: RightsState, id: ItemId): Status => state.statuses[id] ?? "Not started";
export function counts(state: RightsState) {
  const result = Object.fromEntries(statuses.map(status => [status, 0])) as Record<Status, number>;
  for (const item of items) result[statusOf(state, item.id)]++;
  return result;
}

// ---------- Saved progress (this browser only) ----------

export const STORAGE_KEY = "orgtooltank:music-rights-ready:v1";
const str = (value: unknown, max = 200) => typeof value === "string" ? value.slice(0, max) : "";
const oneOf = <T extends readonly string[]>(list: T, value: unknown): T[number] => (list as readonly unknown[]).includes(value) ? value as T[number] : list[0];

/** Accepts only well-formed saved progress; anything else is ignored rather than trusted. */
export function parseSaved(raw: string | null): { state: RightsState; savedAt: string } | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (!data || data.version !== 1 || typeof data.state !== "object") return null;
    const s = data.state;
    const state: RightsState = {
      song: { title: str(s.song?.title), artist: str(s.song?.artist), released: oneOf(["", "unreleased", "released"] as const, s.song?.released), date: /^\d{4}-\d{2}-\d{2}$/.test(s.song?.date) ? s.song.date : "" },
      people: (Array.isArray(s.people) ? s.people : []).slice(0, 50).map((p: Record<string, unknown>) => ({
        id: str(p?.id, 60) || crypto.randomUUID(), name: str(p?.name, 120),
        roles: (Array.isArray(p?.roles) ? p.roles : []).filter((role: unknown): role is Role => (roles as readonly unknown[]).includes(role)),
        sharesSong: p?.sharesSong === true, songShare: str(p?.songShare, 10), pro: oneOf(proOptions, p?.pro), publishing: oneOf(publishingOptions, p?.publishing),
      })),
      owners: (Array.isArray(s.owners) ? s.owners : []).slice(0, 50).map((o: Record<string, unknown>) => ({ id: str(o?.id, 60) || crypto.randomUUID(), name: str(o?.name, 120), share: str(o?.share, 10) })),
      ownersNotSure: s.ownersNotSure === true,
      statuses: Object.fromEntries(items.map(item => [item.id, s.statuses?.[item.id]]).filter(([, status]) => (statuses as readonly unknown[]).includes(status))),
    };
    return { state, savedAt: typeof data.savedAt === "string" ? data.savedAt : "" };
  } catch { return null; }
}
export const serialize = (state: RightsState, savedAt: string) => JSON.stringify({ version: 1, savedAt, state });

// ---------- Plain-text checklist ----------

export function checklistText(state: RightsState, today = new Date()) {
  const lines: string[] = [], rule = "-".repeat(60);
  const title = state.song.title.trim() || "Untitled song";
  lines.push(`MUSIC RIGHTS READY: ${title}`, `Created ${today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} with OrgToolTank`, "");
  lines.push("ABOUT THE SONG", rule, `Title: ${title}`, `Artist / release name: ${state.song.artist.trim() || "(not entered)"}`,
    `Status: ${state.song.released === "released" ? "Already released" : state.song.released === "unreleased" ? "Not released yet" : "(not entered)"}`,
    ...(state.song.date ? [`${state.song.released === "released" ? "Release date" : "Expected release date"}: ${state.song.date}`] : []), "");
  lines.push("WHO MADE IT", rule, ...(state.people.length ? state.people.map(person => `- ${person.name.trim() || "Unnamed"}: ${person.roles.join(", ") || "role not set"}${person.pro ? `; PRO: ${person.pro}` : ""}${person.publishing ? `; publishing: ${person.publishing}` : ""}`) : ["(no one added yet)"]), "");
  lines.push("THE SONG (COMPOSITION): PROPOSED SPLITS", rule, explainers.composition, "");
  const writers = state.people.filter(writesSong);
  lines.push(...(writers.length ? writers.map(person => `- ${person.name.trim() || "Unnamed"}: ${person.songShare.trim() ? `${person.songShare.trim().replace(/%$/, "")}%` : "share not entered"}`) : ["(no songwriters added yet)"]), `Check: ${songSplits(state).message}`, "");
  lines.push("THE RECORDING (MASTER): OWNERSHIP AS ENTERED", rule, explainers.master, "");
  lines.push(...(state.ownersNotSure ? ["Not sure yet."] : state.owners.length ? [...state.owners.map(owner => `- ${owner.name.trim() || "Unnamed"}: ${owner.share.trim() ? `${owner.share.trim().replace(/%$/, "")}%` : "share not entered"}`), `Check: ${masterSplits(state).message}`] : ["(no owners added yet)"]), "");
  lines.push("YOUR RIGHTS CHECKLIST", rule);
  for (const stage of [...new Set(items.map(item => item.stage))]) {
    lines.push("", stage.toUpperCase());
    for (const item of items.filter(entry => entry.stage === stage)) {
      lines.push(`[${statusOf(state, item.id)}] ${item.title}`, `    ${item.detail}`);
      for (const note of notesFor(item.id, state)) lines.push(`    Note: ${note}`);
      for (const id of item.links ?? []) { const link = officialLinks.find(entry => entry.id === id)!; lines.push(`    ${link.name}: ${link.url}`); }
    }
  }
  lines.push("", "LICENSING FOR FILM, TV, ADS OR GAMES", rule, "Licensing a song is a separate process that involves both the composition and the master. It isn’t covered by this checklist.", "");
  lines.push(`Official links checked ${LINKS_CHECKED}.`, "“Done” means you marked the task complete. It doesn’t confirm ownership, registration, or royalties.", "", DISCLAIMER, "");
  return lines.join("\n");
}
