"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { CURRENCY, DUE_SOON_DAYS, LIMITS, MAX_CALLS, STORAGE_KEY, amountInput, applyFilter, byUrgency, callsCsv, filters, formatAmount, formatDate, isoDate, markOutstanding, markPaid, parseAmount, parseSaved, relativeDue, serializeSaved, statuses, summary, urgency, validIso, type Call, type Filter, type Status } from "../engine";
import { demoCalls } from "../demo";
import { NextStep, QuickStart } from "../../../experiment-components/Guidance";

// The user's calls are saved in this browser's local storage only. Demo data is never saved.
const CHANGED = "orgtooltank-capital-call-tracker-saved";
const subscribe = (callback: () => void) => { window.addEventListener("storage", callback); window.addEventListener(CHANGED, callback); return () => { window.removeEventListener("storage", callback); window.removeEventListener(CHANGED, callback); }; };
const readSaved = () => { try { return localStorage.getItem(STORAGE_KEY); } catch { return null; } };

type Draft = { fund: string; entity: string; amount: string; due: string; notice: string; notes: string; status: Status; paidOn: string };
const emptyDraft = (): Draft => ({ fund: "", entity: "", amount: "", due: "", notice: "", notes: "", status: "Outstanding", paidOn: "" });
const draftOf = (call: Call): Draft => ({ fund: call.fund, entity: call.entity, amount: amountInput(call.amount), due: call.due, notice: call.notice, notes: call.notes, status: call.status, paidOn: call.paidOn ?? "" });

export default function CapitalCallWorkbench() {
  const raw = useSyncExternalStore(subscribe, readSaved, () => null);
  const saved = useMemo(() => parseSaved(raw), [raw]);
  // undefined = nothing changed yet (use what's saved); null = cleared, back to the start screen.
  const [edited, setEdited] = useState<Call[] | null | undefined>(undefined);
  const [demo, setDemo] = useState<Call[] | null>(null);
  const [filter, setFilter] = useState<Filter>("All");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState("");
  const [next, setNext] = useState("");
  const [removed, setRemoved] = useState<{ call: Call; index: number } | null>(null);
  const mine = edited === undefined ? saved : edited;
  const calls = demo ?? mine;
  const today = isoDate(new Date());

  function write(list: Call[]) {
    try { localStorage.setItem(STORAGE_KEY, serializeSaved(list)); window.dispatchEvent(new Event(CHANGED)); }
    catch { setMessage("This browser couldn’t save your changes (storage may be full or turned off). Download a CSV so you don’t lose them."); }
  }
  function commit(list: Call[]) {
    if (demo) { setDemo(list); return; }
    setEdited(list); write(list);
  }
  const update = (change: (current: Call[]) => Call[]) => { if (calls) commit(change(calls)); };
  const say = (text: string, hint = "") => { setMessage(text); setNext(hint); };

  function startBlank() { setDemo(null); setEdited([]); write([]); openNew(); say(""); }
  function tryDemo() { setDemo(demoCalls()); setEditing(null); setRemoved(null); setFilter("All"); say(""); }
  function leaveDemo() { setDemo(null); setEditing(null); setRemoved(null); setFilter("All"); say("Left the demo. Nothing from it was saved."); }
  function clearSaved() {
    if (!window.confirm("Delete your saved capital calls from this browser?\n\nThis removes every call you’ve entered. Download a CSV first if you might need them.")) return;
    try { localStorage.removeItem(STORAGE_KEY); window.dispatchEvent(new Event(CHANGED)); } catch { /* nothing stored */ }
    setEdited(null); setDemo(null); setEditing(null); setRemoved(null); setFilter("All"); say("Saved data was cleared from this browser.");
  }

  function openNew() { setEditing("new"); setDraft(emptyDraft()); setFormError(""); }
  function openEdit(call: Call) { setEditing(call.id); setDraft(draftOf(call)); setFormError(""); }
  function saveDraft() {
    if (!calls) return;
    const fund = draft.fund.trim(), entity = draft.entity.trim(), amount = parseAmount(draft.amount);
    if (!fund) { setFormError("Add the fund or deal name."); return; }
    if (!entity) { setFormError("Add the investing entity that received the call."); return; }
    if (amount === null) { setFormError("Enter the amount as a positive number, like 250000 or 250,000.50."); return; }
    if (!validIso(draft.due)) { setFormError("Choose the due date from the notice."); return; }
    const paidOn = draft.status === "Paid" ? (validIso(draft.paidOn) ? draft.paidOn : today) : undefined;
    const fields: Omit<Call, "id"> = { fund: fund.slice(0, LIMITS.fund), entity: entity.slice(0, LIMITS.entity), amount, due: draft.due, notice: draft.notice.trim().slice(0, LIMITS.notice), notes: draft.notes.trim().slice(0, LIMITS.notes), status: draft.status, ...(paidOn ? { paidOn } : {}) };
    if (editing === "new") {
      if (calls.length >= MAX_CALLS) { setFormError(`This browser experiment tracks up to ${MAX_CALLS} calls.`); return; }
      update(current => [...current, { id: crypto.randomUUID(), ...fields }]);
      say(`Added ${formatAmount(amount)} for ${fund}.`, calls.length ? "" : "When it’s paid, choose Mark Paid. Add more calls as notices arrive, then download a CSV any time.");
    } else {
      update(current => current.map(call => call.id === editing ? { id: call.id, ...fields } : call));
      say(`Saved changes to ${fund}.`);
    }
    setEditing(null); setRemoved(null);
  }
  function remove(call: Call) {
    if (!calls) return;
    setRemoved({ call, index: calls.findIndex(entry => entry.id === call.id) });
    update(current => current.filter(entry => entry.id !== call.id));
    if (editing === call.id) setEditing(null);
    say(`Deleted ${formatAmount(call.amount)} for ${call.fund}.`);
  }
  function undoRemove() {
    if (!removed) return;
    update(current => { const list = [...current]; list.splice(Math.min(removed.index, list.length), 0, removed.call); return list; });
    say(`Put back ${formatAmount(removed.call.amount)} for ${removed.call.fund}.`); setRemoved(null);
  }
  function setStatus(call: Call, paid: boolean) {
    update(current => current.map(entry => entry.id === call.id ? (paid ? markPaid(entry, today) : markOutstanding(entry)) : entry));
    setRemoved(null);
    say(paid ? `Marked ${formatAmount(call.amount)} for ${call.fund} as paid today (${formatDate(today)}).` : `Marked ${call.fund} as outstanding again. The paid date was removed.`, paid ? "To use a different paid date, choose Edit." : "");
  }
  function downloadCsv(list: Call[]) {
    const url = URL.createObjectURL(new Blob([callsCsv(list, today)], { type: "text/csv;charset=utf-8" })), anchor = document.createElement("a");
    anchor.href = url; anchor.download = `capital-calls-${today}.csv`; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    setRemoved(null); say("CSV downloaded. It opens in Excel, Numbers, or Google Sheets.");
  }

  const saveBar = <section className="cc-save" aria-label="Where your data is saved">
    {demo ? <><p><strong>Demo data.</strong> These funds, entities, and amounts are fictional, and none of it is saved.</p><button type="button" className="text-link" onClick={leaveDemo}>Leave demo</button></>
      : <><p>Your capital calls are saved only in this browser on this device. They aren’t sent to OrgToolTank.</p>{mine && <button type="button" className="text-link" onClick={clearSaved}>Clear saved data</button>}</>}
    {message && <p className="cc-message" role="status">{message}{removed && <> <button type="button" className="text-link" onClick={undoRemove}>Undo</button></>}</p>}
    {message && next && <NextStep>{next}</NextStep>}
  </section>;

  if (!calls) return <div className="cc-workbench">
    {saveBar}
    <section className="cc-panel cc-start" aria-labelledby="cc-start-heading">
      <QuickStart>Choose Start Blank to enter your first capital call notice, or Try Demo Data to see a filled-in example first.</QuickStart>
      <p className="eyebrow">01 / Start</p>
      <h2 id="cc-start-heading">Which capital calls do you need to keep track of?</h2>
      <p className="cc-lede">Enter each call notice you receive: the fund, the investing entity, the amount, and the due date. The tracker shows what’s overdue and what’s due in the next {DUE_SOON_DAYS} days, and adds up what’s still outstanding.</p>
      <div className="cc-choices">
        <button type="button" className="ink-button" onClick={startBlank}>Start Blank ↗</button>
        <button type="button" className="ink-button is-secondary" onClick={tryDemo}>Try Demo Data</button>
      </div>
      <p className="small-note">Start Blank opens a short form for your first call, and your list saves in this browser as you go. The demo uses fictional funds and amounts and isn’t saved.</p>
    </section>
  </div>;

  const sorted = byUrgency(applyFilter(calls, filter, today), today), totals = summary(calls, today);
  const form = <form className="cc-form" onSubmit={event => { event.preventDefault(); saveDraft(); }} aria-label={editing === "new" ? "Add a capital call" : "Edit capital call"} noValidate>
    <h3>{editing === "new" ? "Add a capital call" : "Edit capital call"}</h3>
    <div className="cc-fields">
      <div className="cc-field"><label>Fund / Deal Name<input value={draft.fund} maxLength={LIMITS.fund} onChange={event => setDraft({ ...draft, fund: event.target.value })} placeholder="e.g. Growth Fund III" aria-describedby="cc-hint-fund" autoFocus /></label><p className="field-hint" id="cc-hint-fund">The fund or deal that sent the notice.</p></div>
      <div className="cc-field"><label>Investing Entity<input value={draft.entity} maxLength={LIMITS.entity} onChange={event => setDraft({ ...draft, entity: event.target.value })} placeholder="e.g. Family Trust" aria-describedby="cc-hint-entity" /></label><p className="field-hint" id="cc-hint-entity">Who is paying: the trust, LLC, or person named on the notice.</p></div>
      <div className="cc-field"><label>Amount ({CURRENCY})<input value={draft.amount} inputMode="decimal" onChange={event => setDraft({ ...draft, amount: event.target.value })} placeholder="e.g. 250,000" aria-describedby="cc-hint-amount" /></label><p className="field-hint" id="cc-hint-amount">The amount called, in US dollars. Copy it from the notice.</p></div>
      <div className="cc-field"><label>Due Date<input type="date" value={draft.due} onChange={event => setDraft({ ...draft, due: event.target.value })} aria-describedby="cc-hint-due" /></label><p className="field-hint" id="cc-hint-due">When the payment is due, from the notice.</p></div>
      <div className="cc-field"><label>Notice Reference <small>(optional)</small><input value={draft.notice} maxLength={LIMITS.notice} onChange={event => setDraft({ ...draft, notice: event.target.value })} placeholder="e.g. Call notice #7" aria-describedby="cc-hint-notice" /></label><p className="field-hint" id="cc-hint-notice">A name or number to find the notice again. Files aren’t uploaded.</p></div>
      <div className="cc-field"><label>Status<select value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value as Status, paidOn: event.target.value === "Paid" ? draft.paidOn || today : draft.paidOn })}>{statuses.map(s => <option key={s}>{s}</option>)}</select></label>{draft.status === "Paid" && <label>Paid date<input type="date" value={draft.paidOn} onChange={event => setDraft({ ...draft, paidOn: event.target.value })} /></label>}</div>
      <label className="is-wide">Notes <small>(optional)</small><textarea value={draft.notes} maxLength={LIMITS.notes} rows={2} onChange={event => setDraft({ ...draft, notes: event.target.value })} placeholder="e.g. wire sent from which account, who confirmed it" /></label>
    </div>
    {formError && <p className="cc-error" role="alert">{formError}</p>}
    <div className="detail-links"><button type="submit" className="ink-button">{editing === "new" ? "Add capital call" : "Save changes"}</button><button type="button" className="text-link" onClick={() => setEditing(null)}>Cancel</button></div>
  </form>;

  return <div className="cc-workbench">
    {saveBar}
    <div className="cc-screen">
      <QuickStart>Add each capital call notice with its amount and due date. The list puts overdue calls first, then those due in the next {DUE_SOON_DAYS} days. Choose Mark Paid once a call is paid.</QuickStart>

      <section className="cc-panel" aria-labelledby="cc-summary-heading">
        <p className="eyebrow">01 / Summary</p>
        <h2 id="cc-summary-heading">{!calls.length ? "No capital calls yet" : totals.overdueCount ? `${totals.overdueCount} ${totals.overdueCount === 1 ? "call is" : "calls are"} overdue` : totals.outstandingCount ? "Nothing is overdue" : "Everything entered is paid"}</h2>
        <dl className="cc-tiles">
          <div><dt>Total outstanding</dt><dd>{formatAmount(totals.outstandingTotal)}</dd><span>{totals.outstandingCount} unpaid {totals.outstandingCount === 1 ? "call" : "calls"}</span></div>
          <div className={totals.overdueCount ? "is-overdue" : ""}><dt>Overdue</dt><dd>{totals.overdueCount}</dd><span>{totals.overdueCount ? `${formatAmount(totals.overdueTotal)} past due` : "past the due date"}</span></div>
          <div className={totals.dueSoonCount ? "is-soon" : ""}><dt>Due in the next {DUE_SOON_DAYS} days</dt><dd>{formatAmount(totals.dueSoonTotal)}</dd><span>{totals.dueSoonCount} {totals.dueSoonCount === 1 ? "call" : "calls"}</span></div>
        </dl>
      </section>

      <section className="cc-panel" aria-labelledby="cc-list-heading">
        <p className="eyebrow">02 / Capital calls</p>
        <h2 id="cc-list-heading">Most urgent first</h2>
        {!calls.length && <p className="cc-empty-note">Nothing here yet. Add the first call notice you’ve received, or <button type="button" className="text-link" onClick={tryDemo}>load demo data</button> to see how the tracker works.</p>}
        {editing === "new" ? form : <button type="button" className="ink-button cc-add" onClick={openNew}>Add a capital call +</button>}
        {calls.length > 0 && <div className="filter-list cc-filters" role="group" aria-label="Show">{filters.map(f => <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>{f === "Due soon" ? `Due Soon (${DUE_SOON_DAYS} days)` : f}</button>)}</div>}
        {calls.length > 0 && !sorted.length && <p className="cc-empty-note">{filter === "Due soon" ? `Nothing is due in the next ${DUE_SOON_DAYS} days. Overdue calls are under Outstanding.` : "No outstanding calls. Everything you’ve entered is marked paid."} <button type="button" className="text-link" onClick={() => setFilter("All")}>Show all</button></p>}
        <ol className="cc-list">{sorted.map(call => {
          const state = urgency(call, today);
          if (editing === call.id) return <li key={call.id} className="cc-item is-editing">{form}</li>;
          return <li key={call.id} className="cc-item" data-state={state}>
            <div className="cc-item-main">
              <div className="cc-item-top"><span className="cc-badge" data-state={state}>{state}</span><strong>{call.fund}</strong></div>
              <p className="cc-amount">{formatAmount(call.amount)}</p>
              <p className="cc-meta">{call.entity}{call.notice && ` · ${call.notice}`}</p>
              <p className="cc-due"><strong>Due {formatDate(call.due)}</strong>{call.status === "Paid" ? (call.paidOn ? ` · Paid ${formatDate(call.paidOn)}` : " · Paid") : ` · ${relativeDue(call.due, today)}`}</p>
              {call.notes && <p className="cc-notes">{call.notes}</p>}
            </div>
            <div className="cc-item-actions">
              {call.status === "Outstanding" ? <button type="button" className="cc-status" onClick={() => setStatus(call, true)}>Mark Paid</button> : <button type="button" className="cc-status is-undo" onClick={() => setStatus(call, false)}>Mark Outstanding</button>}
              <span className="cc-row-links"><button type="button" className="text-link" onClick={() => openEdit(call)}>Edit</button><button type="button" className="text-link" onClick={() => remove(call)}>Delete</button></span>
            </div>
          </li>;
        })}</ol>
        {calls.length > 0 && <p className="small-note">Overdue and Due Soon are worked out from each due date. Due Soon means due today or within the next {DUE_SOON_DAYS} days. Paid calls move to the end of the list.</p>}
      </section>

      <section className="cc-panel" aria-labelledby="cc-export-heading">
        <p className="eyebrow">03 / Take it with you</p>
        <h2 id="cc-export-heading">Download a CSV</h2>
        <p className="cc-lede">Every call, most urgent first, with amounts as plain numbers so a spreadsheet can add them up. Keep a copy: saved data lives only in this browser.</p>
        <div className="cc-exports"><button type="button" className="ink-button" disabled={!calls.length} onClick={() => downloadCsv(calls)}>Download CSV ↓</button></div>
      </section>
    </div>
  </div>;
}
