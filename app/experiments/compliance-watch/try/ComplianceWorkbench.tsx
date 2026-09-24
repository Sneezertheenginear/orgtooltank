"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { MAX_ITEMS, MAX_REPEAT_MONTHS, STORAGE_KEY, backupJson, blankTracker, byUrgency, calendarEventCount, calendarIcs, categories, counts, dateState, dueSoonOptions, formatDate, isoDate, parseBackup, parseSaved, relativeDue, renew, repeatLabel, repeatPresets, serializeSaved, statuses, trackerCsv, undoRenewal, type Category, type DueSoonDays, type Item, type Status, type Tracker } from "../engine";
import { demoTracker } from "../demo";
import { QuickStart } from "../../../experiment-components/Guidance";

// The user's tracker is saved in this browser's local storage only. Demo data is never saved.
const CHANGED = "orgtooltank-compliance-watch-saved";
const subscribe = (callback: () => void) => { window.addEventListener("storage", callback); window.addEventListener(CHANGED, callback); return () => { window.removeEventListener("storage", callback); window.removeEventListener(CHANGED, callback); }; };
const readSaved = () => { try { return localStorage.getItem(STORAGE_KEY); } catch { return null; } };
const MAX_BACKUP_BYTES = 1024 * 1024;

type Draft = { title: string; category: Category; due: string; status: Status; owner: string; notes: string; repeat: string; customMonths: string };
const emptyDraft = (): Draft => ({ title: "", category: "License / Permit", due: "", status: "Not started", owner: "", notes: "", repeat: "0", customMonths: "24" });
const draftOf = (item: Item): Draft => ({ title: item.title, category: item.category, due: item.due, status: item.status, owner: item.owner, notes: item.notes, repeat: repeatPresets.some(p => p.months === item.repeatMonths) ? String(item.repeatMonths) : "custom", customMonths: String(item.repeatMonths || 24) });

export default function ComplianceWorkbench() {
  const raw = useSyncExternalStore(subscribe, readSaved, () => null);
  const saved = useMemo(() => parseSaved(raw), [raw]);
  // undefined = nothing changed yet (use what's saved); null = cleared, back to the start screen.
  const [edited, setEdited] = useState<Tracker | null | undefined>(undefined);
  const [demo, setDemo] = useState<Tracker | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState("");
  const [removed, setRemoved] = useState<{ item: Item; index: number } | null>(null);
  const restoreInput = useRef<HTMLInputElement>(null);
  const mine = edited === undefined ? saved : edited;
  const tracker = demo ?? mine;
  const today = isoDate(new Date());

  function write(next: Tracker) {
    try { localStorage.setItem(STORAGE_KEY, serializeSaved(next)); window.dispatchEvent(new Event(CHANGED)); }
    catch { setMessage("This browser couldn’t save your changes (storage may be full or turned off). Download a backup so you don’t lose them."); }
  }
  function commit(next: Tracker) {
    if (demo) { setDemo(next); return; }
    setEdited(next); write(next);
  }
  const update = (change: (current: Tracker) => Tracker) => { if (tracker) commit(change(tracker)); };

  function startBlank() { const next = blankTracker(); setDemo(null); setEdited(next); write(next); openNew(); setMessage(""); }
  function tryDemo() { setDemo(demoTracker()); setEditing(null); setRemoved(null); setMessage(""); }
  function leaveDemo() { setDemo(null); setEditing(null); setRemoved(null); setMessage("Left the demo. Nothing from it was saved."); }
  function clearSaved() {
    if (!window.confirm("Delete your saved Compliance Watch data from this browser?\n\nThis removes the organization name, settings, and every item. Download a backup first if you might need it.")) return;
    try { localStorage.removeItem(STORAGE_KEY); window.dispatchEvent(new Event(CHANGED)); } catch { /* nothing stored */ }
    setEdited(null); setDemo(null); setEditing(null); setRemoved(null); setMessage("Saved data was cleared from this browser.");
  }

  function openNew() { setEditing("new"); setDraft(emptyDraft()); setFormError(""); }
  function openEdit(item: Item) { setEditing(item.id); setDraft(draftOf(item)); setFormError(""); }
  function saveDraft() {
    if (!tracker) return;
    const title = draft.title.trim();
    if (!title) { setFormError("Give the requirement a title."); return; }
    const months = draft.repeat === "custom" ? Number(draft.customMonths) : Number(draft.repeat);
    if (!Number.isInteger(months) || months < 0 || months > MAX_REPEAT_MONTHS) { setFormError(`Custom repeats need a whole number of months from 1 to ${MAX_REPEAT_MONTHS}.`); return; }
    if (months && !draft.due) { setFormError("A repeating item needs a date so the next one can be worked out."); return; }
    const fields = { title: title.slice(0, 200), category: draft.category, due: draft.due, status: draft.status, owner: draft.owner.trim().slice(0, 120), notes: draft.notes.trim().slice(0, 1000), repeatMonths: months };
    if (editing === "new") {
      if (tracker.items.length >= MAX_ITEMS) { setFormError(`This browser experiment tracks up to ${MAX_ITEMS} items.`); return; }
      update(current => ({ ...current, items: [...current.items, { id: crypto.randomUUID(), ...fields }] }));
      setMessage(`Added “${fields.title}”.`);
    } else {
      update(current => ({ ...current, items: current.items.map(item => item.id === editing ? { ...item, ...fields, ...(item.due !== fields.due ? { renewed: undefined } : {}) } : item) }));
      setMessage(`Saved changes to “${fields.title}”.`);
    }
    setEditing(null); setRemoved(null);
  }
  function remove(item: Item) {
    if (!tracker) return;
    setRemoved({ item, index: tracker.items.findIndex(entry => entry.id === item.id) });
    update(current => ({ ...current, items: current.items.filter(entry => entry.id !== item.id) }));
    if (editing === item.id) setEditing(null);
    setMessage(`Removed “${item.title}”.`);
  }
  function undoRemove() {
    if (!removed) return;
    update(current => { const items = [...current.items]; items.splice(Math.min(removed.index, items.length), 0, removed.item); return { ...current, items }; });
    setMessage(`Put back “${removed.item.title}”.`); setRemoved(null);
  }
  const setItem = (id: string, change: (item: Item) => Item) => update(current => ({ ...current, items: current.items.map(item => item.id === id ? change(item) : item) }));

  function download(content: string, name: string, type: string) {
    const url = URL.createObjectURL(new Blob([content], { type })), anchor = document.createElement("a");
    anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
  const fileBase = () => `compliance-watch${tracker?.organization.trim() ? `-${tracker.organization.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40)}` : ""}`;

  async function restore(file: File | undefined) {
    if (restoreInput.current) restoreInput.current.value = "";
    setRemoved(null);
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) { setMessage("That file is too large to be a Compliance Watch backup."); return; }
    let textContent: string;
    try { textContent = await file.text(); } catch { setMessage("Your browser couldn’t read that file."); return; }
    const result = parseBackup(textContent);
    if ("error" in result) { setMessage(`Nothing was changed. ${result.error}`); return; }
    const existing = mine?.items.length ?? 0;
    if ((mine && (existing || mine.organization)) && !window.confirm(`Replace your saved tracker (${existing} ${existing === 1 ? "item" : "items"}) with this backup (${result.tracker.items.length} ${result.tracker.items.length === 1 ? "item" : "items"})?\n\nYour current saved data will be overwritten.`)) { setMessage("Restore cancelled. Nothing was changed."); return; }
    setDemo(null); setEditing(null); setRemoved(null); setEdited(result.tracker); write(result.tracker);
    setMessage(`Restored ${result.tracker.items.length} ${result.tracker.items.length === 1 ? "item" : "items"} from the backup.`);
  }

  const restoreControl = <>
    <input ref={restoreInput} type="file" accept=".json,application/json" className="sr-only" tabIndex={-1} aria-label="Choose a Compliance Watch backup file" onChange={event => restore(event.target.files?.[0])} />
    <button type="button" className="text-link" onClick={() => restoreInput.current?.click()}>Restore Backup</button>
  </>;

  const saveBar = <section className="cw-save" aria-label="Where your data is saved">
    {demo ? <><p><strong>Demo data.</strong> Everything here is fictional example tracking, not legal requirements, and none of it is saved.</p><button type="button" className="text-link" onClick={leaveDemo}>Leave demo</button></>
      : <><p>Your Compliance Watch data is saved only in this browser on this device. It isn’t sent to OrgToolTank.</p>{mine && <button type="button" className="text-link" onClick={clearSaved}>Clear saved data</button>}</>}
    {message && <p className="cw-message" role="status">{message}{removed && <> <button type="button" className="text-link" onClick={undoRemove}>Undo</button></>}</p>}
  </section>;

  if (!tracker) return <div className="cw-workbench">
    {saveBar}
    <section className="cw-panel cw-start" aria-labelledby="cw-start-heading">
      <QuickStart>Choose Start Blank to add your own items, or Try Demo Data to see a finished example first.</QuickStart>
      <p className="eyebrow">01 / Start</p>
      <h2 id="cw-start-heading">What do you want to keep track of?</h2>
      <p className="cw-lede">Add the licenses, permits, insurance, inspections, trainings, and filings you already know about, with their due or renewal dates. Compliance Watch shows what needs attention first.</p>
      <div className="cw-choices">
        <button type="button" className="ink-button" onClick={startBlank}>Start Blank ↗</button>
        <button type="button" className="ink-button is-secondary" onClick={tryDemo}>Try Demo Data</button>
        {restoreControl}
      </div>
      <p className="small-note">Start Blank opens a short form for your first item; your list saves in this browser as you go. The demo is fictional (not a list of requirements for any business) and isn’t saved.</p>
    </section>
  </div>;

  const sorted = byUrgency(tracker.items, today, tracker.dueSoonDays), tally = counts(tracker.items, today, tracker.dueSoonDays);
  const attention = tally.overdue + tally.dueSoon, events = calendarEventCount(tracker);
  const form = <form className="cw-form" onSubmit={event => { event.preventDefault(); saveDraft(); }} aria-label={editing === "new" ? "Add a requirement" : "Edit requirement"}>
    <h3>{editing === "new" ? "Add a requirement" : "Edit requirement"}</h3>
    <div className="cw-fields">
      <div className="cw-field is-wide"><label>Requirement<input value={draft.title} maxLength={200} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="e.g. Renew business license" aria-describedby="cw-hint-title" autoFocus /></label><p className="cw-hint" id="cw-hint-title">What are you trying to keep current?</p></div>
      <label>Category<select value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value as Category })}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
      <div className="cw-field"><label>Due or renewal date <small>(optional)</small><input type="date" value={draft.due} onChange={event => setDraft({ ...draft, due: event.target.value })} aria-describedby="cw-hint-due" /></label><p className="cw-hint" id="cw-hint-due">When does this need attention again?</p></div>
      <div className="cw-field"><label>Status<select value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value as Status })} aria-describedby="cw-hint-status">{statuses.map(s => <option key={s}>{s}</option>)}</select></label><p className="cw-hint" id="cw-hint-status">Current means you’ve marked it up to date.</p></div>
      <div className="cw-field"><label>Repeats<select value={draft.repeat} onChange={event => setDraft({ ...draft, repeat: event.target.value })} aria-describedby="cw-hint-repeat">{repeatPresets.map(p => <option key={p.months} value={String(p.months)}>{p.label}</option>)}<option value="custom">Custom number of months</option></select></label><p className="cw-hint" id="cw-hint-repeat">Choose this if it renews on a regular schedule.</p></div>
      {draft.repeat === "custom" && <label>Every how many months?<input type="number" min={1} max={MAX_REPEAT_MONTHS} step={1} value={draft.customMonths} onChange={event => setDraft({ ...draft, customMonths: event.target.value })} /></label>}
      <div className="cw-field"><label>Responsible person <small>(optional)</small><input value={draft.owner} maxLength={120} onChange={event => setDraft({ ...draft, owner: event.target.value })} aria-describedby="cw-hint-owner" /></label><p className="cw-hint" id="cw-hint-owner">Who is keeping track of this?</p></div>
      <label className="is-wide">Notes <small>(optional)</small><textarea value={draft.notes} maxLength={1000} rows={2} onChange={event => setDraft({ ...draft, notes: event.target.value })} placeholder="e.g. where the paperwork is kept, license number, who to call" /></label>
    </div>
    {formError && <p className="cw-error" role="alert">{formError}</p>}
    <div className="detail-links"><button type="submit" className="ink-button">{editing === "new" ? "Add requirement" : "Save changes"}</button><button type="button" className="text-link" onClick={() => setEditing(null)}>Cancel</button></div>
  </form>;

  return <div className="cw-workbench">
    {saveBar}
    <div className="cw-screen">
      <QuickStart>Add something you need to track, choose its due or renewal date (and whether it repeats), and Compliance Watch will show what needs attention first.</QuickStart>
      <section className="cw-panel" aria-labelledby="cw-org-heading">
        <p className="eyebrow">01 / Organization &amp; settings</p>
        <h2 id="cw-org-heading" className="sr-only">Organization and settings</h2>
        <div className="cw-settings">
          <label>Organization name <small>(optional)</small><input value={tracker.organization} maxLength={150} onChange={event => update(current => ({ ...current, organization: event.target.value }))} placeholder="Your business or organization" /></label>
          <label>Due soon means within<select value={tracker.dueSoonDays} onChange={event => update(current => ({ ...current, dueSoonDays: Number(event.target.value) as DueSoonDays }))}>{dueSoonOptions.map(days => <option key={days} value={days}>{days} days</option>)}</select></label>
        </div>
      </section>

      <section className="cw-panel" aria-labelledby="cw-attention-heading">
        <p className="eyebrow">02 / What needs attention</p>
        <h2 id="cw-attention-heading">{!tracker.items.length ? "Nothing tracked yet" : attention ? `${attention} ${attention === 1 ? "item needs" : "items need"} attention` : "Nothing is overdue or due soon"}</h2>
        {!tracker.items.length && <p className="cw-empty-note">Add your first requirement below, or <button type="button" className="text-link" onClick={tryDemo}>load demo data</button> to see how Compliance Watch works.</p>}
        <dl className="cw-tiles">
          <div className={tally.overdue ? "is-overdue" : ""}><dt>Overdue</dt><dd>{tally.overdue}</dd></div>
          <div className={tally.dueSoon ? "is-soon" : ""}><dt>Due soon</dt><dd>{tally.dueSoon}</dd><span>within {tracker.dueSoonDays} days</span></div>
          <div><dt>In progress</dt><dd>{tally.inProgress}</dd></div>
          <div><dt>Not started</dt><dd>{tally.notStarted}</dd></div>
          <div><dt>Current</dt><dd>{tally.current}</dd><span>marked current, not due soon</span></div>
        </dl>
        {editing === "new" ? form : <button type="button" className="ink-button cw-add" onClick={openNew}>Add a requirement +</button>}
        <ol className="cw-list">{sorted.map(item => {
          const state = dateState(item, today, tracker.dueSoonDays);
          if (editing === item.id) return <li key={item.id} className="cw-item is-editing">{form}</li>;
          return <li key={item.id} className="cw-item" data-state={state}>
            <div className="cw-item-main">
              <div className="cw-item-top"><span className="cw-badge" data-state={state}>{state}</span><strong>{item.title}</strong></div>
              <p className="cw-meta">{item.category}{item.owner && ` · Responsible: ${item.owner}`}{item.repeatMonths ? ` · Repeats: ${repeatLabel(item.repeatMonths).toLowerCase()}` : ""}</p>
              <p className="cw-due">{item.due ? <><strong>{formatDate(item.due)}</strong> · {relativeDue(item.due, today)}</> : "No date set"}</p>
              {item.notes && <p className="cw-notes">{item.notes}</p>}
              {item.renewed && <p className="cw-renewed">Marked renewed {formatDate(item.renewed.on)} · was due {formatDate(item.renewed.previousDue)} <button type="button" className="text-link" onClick={() => setItem(item.id, undoRenewal)}>Undo</button></p>}
            </div>
            <div className="cw-item-actions">
              <label><span className="sr-only">Status for {item.title}</span><select value={item.status} onChange={event => setItem(item.id, current => ({ ...current, status: event.target.value as Status }))}>{statuses.map(s => <option key={s}>{s}</option>)}</select></label>
              {item.repeatMonths > 0 && item.due && item.status !== "Not applicable" && <button type="button" className="cw-renew" onClick={() => { const next = renew(item, today); setItem(item.id, () => next); setRemoved(null); setMessage(`Marked “${item.title}” renewed. Next due date: ${formatDate(next.due)}.`); }}>Mark Renewed</button>}
              <span className="cw-row-links"><button type="button" className="text-link" onClick={() => openEdit(item)}>Edit</button><button type="button" className="text-link" onClick={() => remove(item)}>Remove</button></span>
            </div>
          </li>;
        })}</ol>
        <p className="small-note">Due soon and Overdue are worked out from each date. “Current” only means you marked the item current; it doesn’t mean a requirement is met. Mark Renewed moves a repeating item to its next due date.</p>
      </section>

      <section className="cw-panel" aria-labelledby="cw-export-heading">
        <p className="eyebrow">03 / Take it with you</p>
        <h2 id="cw-export-heading">Download, print, or back up</h2>
        <div className="cw-exports">
          <button type="button" className="ink-button" disabled={!tracker.items.length} onClick={() => { download(trackerCsv(tracker, today), `${fileBase()}.csv`, "text/csv;charset=utf-8"); setRemoved(null); setMessage("CSV downloaded. It opens in Excel, Numbers, or Google Sheets."); }}>Download CSV ↓</button>
          <button type="button" className="ink-button is-secondary" disabled={!tracker.items.length} onClick={() => window.print()}>Print / Save as PDF</button>
          <button type="button" className="ink-button is-secondary" onClick={() => { download(backupJson(tracker), `${fileBase()}-backup-${today}.json`, "application/json"); setRemoved(null); setMessage("Backup downloaded. Keep it somewhere safe; you can restore it in any browser."); }}>Download Backup</button>
          <button type="button" className="ink-button is-secondary" disabled={!events} onClick={() => { download(calendarIcs(tracker), `${fileBase()}-calendar.ics`, "text/calendar;charset=utf-8"); setRemoved(null); setMessage("Calendar file downloaded. Open it to add the dates to your calendar app."); }}>Calendar (.ics)</button>
        </div>
        <p className="small-note">The calendar file has {events} {events === 1 ? "event" : "events"} for dated items. Add it to Apple Calendar, Google Calendar, Outlook, or another calendar; any reminders come from that calendar app, not from OrgToolTank.</p>
        <p className="small-note">Download Backup saves your organization, settings, and items to a file you keep. {restoreControl} loads that file here or in another browser, replacing the tracker saved in this browser.</p>
      </section>
    </div>

    <div className="cw-print" aria-hidden="true">
      <h1>Compliance Watch{tracker.organization.trim() && `: ${tracker.organization.trim()}`}</h1>
      <p>Printed {formatDate(today)} · Due soon means within {tracker.dueSoonDays} days · {tally.overdue} overdue, {tally.dueSoon} due soon{demo ? " · Fictional demo data" : ""}</p>
      <table><thead><tr><th>Requirement</th><th>Category</th><th>Due / renewal</th><th>Date status</th><th>Status</th><th>Responsible</th><th>Repeats</th><th>Notes</th></tr></thead>
        <tbody>{sorted.map(item => <tr key={item.id}><td>{item.title}</td><td>{item.category}</td><td>{item.due ? formatDate(item.due) : "No date"}</td><td>{dateState(item, today, tracker.dueSoonDays)}</td><td>{item.status}</td><td>{item.owner}</td><td>{item.repeatMonths ? repeatLabel(item.repeatMonths) : ""}</td><td>{item.notes}</td></tr>)}</tbody></table>
      <p>“Current” only means the item was marked current here. Compliance Watch is an organization tool, not legal advice, and doesn’t determine which requirements apply.</p>
    </div>
  </div>;
}
