"use client";

import { Fragment, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { MAX_LOADS, STORAGE_KEY, backupJson, createLoad, draftOf, dueState, editLoad, emptyDraft, followUpMailto, formatDate, formatMoney, formatTime, isoDate, loadsCsv, logContact, markReady, markReceived, moveBack, parseBackup, parseSaved, serializeSaved, snooze, statusLabel, summary, validateDraft, visible, type Draft, type DraftErrors, type Load, type View } from "../engine";
import { exampleLoads } from "../demo";
import { QuickStart } from "../../../experiment-components/Guidance";

// Loads are saved in this browser's local storage only. Example data is never saved.
const CHANGED = "orgtooltank-pod-chaser-saved";
const subscribe = (callback: () => void) => { window.addEventListener("storage", callback); window.addEventListener(CHANGED, callback); return () => { window.removeEventListener("storage", callback); window.removeEventListener(CHANGED, callback); }; };
const readSaved = () => { try { return localStorage.getItem(STORAGE_KEY); } catch { return null; } };
const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

const views: { id: View; name: string }[] = [{ id: "missing", name: "Chase" }, { id: "review", name: "Review" }, { id: "ready", name: "Ready to Bill" }, { id: "all", name: "Show All" }];
const viewNotes: Record<View, string> = {
  missing: "Delivered loads still missing a signed POD, soonest follow-up first.",
  review: "POD received. Check the paperwork, then mark each load ready to bill.",
  ready: "Paperwork complete. These loads are ready for your billing process.",
  all: "Every load, soonest follow-up first.",
};
const emptyNotes: Record<View, string> = {
  missing: "Nothing to chase. Every load in the list has its POD.",
  review: "Nothing to review. Loads show up here after you mark their POD received.",
  ready: "Nothing ready to bill yet. Loads show up here after you review them and mark them ready.",
  all: "",
};
const fieldDefs: { key: keyof Draft; label: string; type?: string; optional?: boolean; placeholder?: string; inputMode?: "decimal" }[] = [
  { key: "loadNumber", label: "Load number", placeholder: "e.g. 48217" },
  { key: "deliveredDate", label: "Delivered date", type: "date" },
  { key: "carrier", label: "Carrier" },
  { key: "contactName", label: "Contact name", optional: true },
  { key: "contactEmail", label: "Contact email", type: "email", optional: true },
  { key: "amount", label: "Amount (USD)", placeholder: "e.g. 1,250.00", inputMode: "decimal" },
  { key: "nextFollowUp", label: "First follow-up date", type: "date" },
];

export default function PodWorkbench() {
  const raw = useSyncExternalStore(subscribe, readSaved, () => null);
  const saved = useMemo(() => parseSaved(raw) ?? [], [raw]);
  const [edited, setEdited] = useState<Load[] | undefined>(undefined);
  const [example, setExample] = useState<Load[] | null>(null);
  const [view, setView] = useState<View>("missing");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [errors, setErrors] = useState<DraftErrors>({});
  const [message, setMessage] = useState("");
  const [removed, setRemoved] = useState<{ load: Load; index: number } | null>(null);
  const restoreInput = useRef<HTMLInputElement>(null);
  const mine = edited ?? saved;
  const loads = example ?? mine;
  const today = isoDate(new Date());
  const totals = summary(loads, today), shown = visible(loads, view, query);
  const counts: Record<View, number> = { missing: totals.missing, review: loads.filter(l => l.status === "review").length, ready: totals.readyCount, all: loads.length };

  function write(next: Load[]) {
    try { localStorage.setItem(STORAGE_KEY, serializeSaved(next)); window.dispatchEvent(new Event(CHANGED)); }
    catch { setMessage("This browser couldn’t save your changes (storage may be full or turned off). Export a backup so you don’t lose them."); }
  }
  function commit(next: Load[]) {
    if (example) { setExample(next); return; }
    setEdited(next); write(next);
  }
  function act(load: Load, change: (load: Load) => Load, done: string) {
    commit(loads.map(l => l.id === load.id ? change(l) : l)); setRemoved(null); setMessage(done);
  }

  function loadExample() { setExample(exampleLoads()); setView("missing"); setQuery(""); setOpen(null); setEditing(null); setRemoved(null); setMessage("Loaded fictional example loads. Open a load’s actions to try logging a call or marking its POD received."); }
  function leaveExample() { setExample(null); setOpen(null); setEditing(null); setRemoved(null); setMessage("Left the example. Nothing from it was saved."); }
  function clearSaved() {
    if (!window.confirm("Delete every saved POD Chaser load from this browser?\n\nExport a backup first if you might need them.")) return;
    try { localStorage.removeItem(STORAGE_KEY); window.dispatchEvent(new Event(CHANGED)); } catch { /* nothing stored */ }
    setEdited([]); setOpen(null); setEditing(null); setRemoved(null); setMessage("Saved loads were cleared from this browser.");
  }

  function openNew() { setEditing("new"); setDraft(emptyDraft()); setErrors({}); setOpen(null); }
  function openEdit(load: Load) { setEditing(load.id); setDraft(draftOf(load)); setErrors({}); }
  function saveDraft() {
    const current = editing === "new" ? null : loads.find(l => l.id === editing) ?? null;
    const result = validateDraft(draft, loads, current);
    if ("errors" in result) { setErrors(result.errors); return; }
    if (!current) {
      if (loads.length >= MAX_LOADS) { setErrors({ loadNumber: `This browser version keeps up to ${MAX_LOADS} loads.` }); return; }
      const load = createLoad(result.fields);
      commit([...loads, load]); setView("missing"); setQuery("");
      setMessage(`Added load #${load.loadNumber} to Chase. First follow-up ${formatDate(load.nextFollowUp)}.`);
    } else {
      commit(loads.map(l => l.id === current.id ? editLoad(l, result.fields) : l));
      setMessage(`Saved changes to load #${result.fields.loadNumber}.`);
    }
    setEditing(null); setRemoved(null);
  }
  function remove(load: Load) {
    setRemoved({ load, index: loads.findIndex(l => l.id === load.id) });
    commit(loads.filter(l => l.id !== load.id)); setOpen(null); setEditing(null);
    setMessage(`Deleted load #${load.loadNumber}.`);
  }
  function undoRemove() {
    if (!removed) return;
    const next = [...loads]; next.splice(Math.min(removed.index, next.length), 0, removed.load);
    commit(next); setMessage(`Put back load #${removed.load.loadNumber}.`); setRemoved(null);
  }

  function download(content: string, name: string, type: string) {
    const url = URL.createObjectURL(new Blob([content], { type })), anchor = document.createElement("a");
    anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
  async function restore(file: File | undefined) {
    if (restoreInput.current) restoreInput.current.value = "";
    setRemoved(null);
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) { setMessage("That file is too large to be a POD Chaser backup."); return; }
    let textContent: string;
    try { textContent = await file.text(); } catch { setMessage("Your browser couldn’t read that file."); return; }
    const result = parseBackup(textContent);
    if ("error" in result) { setMessage(`Nothing was changed. ${result.error}`); return; }
    if (mine.length && !window.confirm(`Replace your saved loads (${mine.length}) with this backup (${result.loads.length})?\n\nYour current saved loads will be overwritten.`)) { setMessage("Restore cancelled. Nothing was changed."); return; }
    setExample(null); setOpen(null); setEditing(null); setEdited(result.loads); write(result.loads);
    setMessage(`Restored ${result.loads.length} ${result.loads.length === 1 ? "load" : "loads"} from the backup.`);
  }

  const form = <form className="pc-form" noValidate onSubmit={event => { event.preventDefault(); saveDraft(); }} aria-label={editing === "new" ? "Add a load" : "Edit load"}>
    <h3>{editing === "new" ? "Add a delivered load" : "Edit load"}</h3>
    <div className="pc-fields">{fieldDefs.map((f, i) => {
      const current = editing !== "new" ? loads.find(l => l.id === editing) : undefined;
      if (f.key === "nextFollowUp" && current && current.status !== "missing") return null;
      const label = f.key === "nextFollowUp" && current ? "Next follow-up date" : f.label, error = errors[f.key], errorId = `pc-err-${f.key}`;
      return <div key={f.key} className="pc-field"><label>{label}{f.optional && <small> (optional)</small>}
        <input type={f.type ?? "text"} value={draft[f.key]} inputMode={f.inputMode} placeholder={f.placeholder} maxLength={f.key === "contactEmail" ? 200 : 120} autoFocus={i === 0} aria-invalid={!!error} aria-describedby={error ? errorId : undefined} onChange={event => setDraft({ ...draft, [f.key]: event.target.value })} />
      </label>{error && <p className="pc-error" id={errorId}>{error}</p>}</div>;
    })}</div>
    <div className="detail-links"><button type="submit" className="ink-button">{editing === "new" ? "Add load" : "Save changes"}</button><button type="button" className="text-link" onClick={() => setEditing(null)}>Cancel</button></div>
  </form>;

  const dueText = (load: Load) => ({ overdue: "Overdue", today: "Due today", upcoming: "", none: "" })[dueState(load, today)];

  return <div className="pc-workbench">
    <section className="pc-save" aria-label="Where your loads are saved">
      {example ? <><p><strong>Example data.</strong> These loads and carriers are fictional, and nothing here is saved. Your own loads are waiting when you leave.</p><button type="button" className="text-link" onClick={leaveExample}>Leave example</button></>
        : <><p>Your loads are saved only in this browser on this device. They aren’t sent to OrgToolTank. Clearing browser data removes them, so export a backup now and then.</p>{mine.length > 0 && <button type="button" className="text-link" onClick={clearSaved}>Clear saved data</button>}</>}
      {message && <p className="pc-message" role="status">{message}{removed && <> <button type="button" className="text-link" onClick={undoRemove}>Undo</button></>}</p>}
    </section>

    <QuickStart>Add a delivered load that’s waiting on its signed POD, with a date to first follow up. Log calls and emails as you chase it, then mark the POD received and ready to bill. {!example && <>Want to look around first? <button type="button" className="text-link" onClick={loadExample}>Load Example Data</button>.</>}</QuickStart>

    <dl className="pc-summary" aria-label="Summary">
      <div><dt>Missing PODs</dt><dd>{totals.missing}</dd></div>
      <div className={totals.overdue ? "is-overdue" : ""}><dt>Overdue follow-ups</dt><dd>{totals.overdue}</dd></div>
      <div className={totals.dueToday ? "is-today" : ""}><dt>Follow-ups due today</dt><dd>{totals.dueToday}</dd></div>
      <div><dt>Ready to bill</dt><dd>{formatMoney(totals.readyCents)}</dd></div>
    </dl>

    <section className="pc-panel" aria-labelledby="pc-list-heading">
      <h2 id="pc-list-heading" className="sr-only">Loads</h2>
      <div className="pc-toolbar">
        <div className="pc-tabs" role="group" aria-label="Load views">{views.map(v => <button key={v.id} type="button" aria-pressed={view === v.id} onClick={() => { setView(v.id); setOpen(null); }}>{v.name} <span className="pc-tab-count">{counts[v.id]}</span></button>)}</div>
        <div className="pc-tools">
          <label className="pc-search"><span className="sr-only">Search by load number or carrier</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search load # or carrier" /></label>
          <button type="button" className="ink-button" onClick={openNew}>Add Load +</button>
        </div>
      </div>
      <p className="pc-view-note">{viewNotes[view]}</p>
      {editing === "new" && form}

      {!loads.length && editing !== "new" ? <div className="pc-empty"><p><strong>No loads yet.</strong> Choose Add Load for a delivered load that’s waiting on signed paperwork, or <button type="button" className="text-link" onClick={loadExample}>load example data</button> to see how it works.</p></div>
        : !shown.length ? <div className="pc-empty"><p>{query.trim() ? <>No loads in {views.find(v => v.id === view)!.name} match “{query.trim()}”. <button type="button" className="text-link" onClick={() => setQuery("")}>Clear search</button></> : emptyNotes[view]}</p></div>
        : <table className="pc-table">
          <thead><tr><th>Load #</th><th>Carrier</th><th>Contact</th><th>Delivered</th><th>Status</th><th>Next follow-up</th><th className="pc-num">Amount</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{shown.map(load => {
            const due = dueState(load, today), isOpen = open === load.id;
            return <Fragment key={load.id}>
              <tr className="pc-row" data-due={due} data-open={isOpen || undefined}>
                <td data-label="Load #"><strong>#{load.loadNumber}</strong></td>
                <td data-label="Carrier">{load.carrier}</td>
                <td data-label="Contact">{load.contactName || load.contactEmail || <span className="pc-muted">—</span>}</td>
                <td data-label="Delivered">{formatDate(load.deliveredDate)}</td>
                <td data-label="Status"><span className="pc-status" data-status={load.status}>{statusLabel[load.status]}</span></td>
                <td data-label="Next follow-up">{load.nextFollowUp ? <>{formatDate(load.nextFollowUp)}{dueText(load) && <span className="pc-due">{dueText(load)}</span>}</> : <span className="pc-muted">—</span>}</td>
                <td data-label="Amount" className="pc-num">{formatMoney(load.amountCents)}</td>
                <td className="pc-open"><button type="button" className="pc-toggle" aria-expanded={isOpen} aria-controls={`pc-detail-${load.id}`} onClick={() => { setOpen(isOpen ? null : load.id); if (editing !== "new") setEditing(null); }}>{isOpen ? "Close" : "Actions"}<span aria-hidden="true">{isOpen ? " ▴" : " ▾"}</span><span className="sr-only"> for load {load.loadNumber}</span></button></td>
              </tr>
              {isOpen && <tr className="pc-detail" id={`pc-detail-${load.id}`}><td colSpan={8}>
                {editing === load.id ? form : <>
                  <div className="pc-actions">
                    {load.status === "missing" && <>
                      <button type="button" className="pc-action" onClick={() => act(load, l => logContact(l, "call"), `Call logged for load #${load.loadNumber}. Next follow-up in 2 days.`)}>Log Call</button>
                      <button type="button" className="pc-action" onClick={() => act(load, l => logContact(l, "email"), `Email logged for load #${load.loadNumber}. Next follow-up in 2 days.`)}>Log Email</button>
                      <button type="button" className="pc-action" onClick={() => act(load, l => snooze(l), `Snoozed load #${load.loadNumber} by a day.`)}>Snooze 1 Day</button>
                      <button type="button" className="pc-action is-primary" onClick={() => act(load, l => markReceived(l), `POD received for load #${load.loadNumber}. It’s now in Review.`)}>Mark POD Received</button>
                    </>}
                    {load.status === "review" && <button type="button" className="pc-action is-primary" onClick={() => act(load, l => markReady(l), `Load #${load.loadNumber} is ready to bill.`)}>Mark Ready to Bill</button>}
                    {load.status !== "missing" && <button type="button" className="pc-action" onClick={() => act(load, l => moveBack(l), load.status === "review" ? `Load #${load.loadNumber} is back in Chase, with a follow-up today.` : `Load #${load.loadNumber} is back in Review.`)}>{load.status === "review" ? "Back to Chase" : "Back to Review"}</button>}
                    <span className="pc-row-links"><button type="button" className="text-link" onClick={() => openEdit(load)}>Edit Load</button><button type="button" className="text-link" onClick={() => remove(load)}>Delete Load</button></span>
                  </div>
                  {load.status === "missing" && (load.contactEmail
                    ? <p className="pc-mail"><a className="text-link" href={followUpMailto(load)}>Draft Follow-up Email ↗</a> <span>Opens your email app with a short request for the POD. Nothing is sent from here; choose Log Email after you send it.</span></p>
                    : <p className="pc-mail"><span>Add a contact email (Edit Load) to draft a follow-up email.</span></p>)}
                  <details className="pc-history">
                    <summary>Activity history ({load.history.length})</summary>
                    <ol>{load.history.map((h, i) => <li key={i}><time dateTime={h.at}>{formatTime(h.at)}</time><span>{h.text}</span></li>)}</ol>
                  </details>
                </>}
              </td></tr>}
            </Fragment>;
          })}</tbody>
        </table>}
    </section>

    <section className="pc-panel pc-export" aria-labelledby="pc-export-heading">
      <h2 id="pc-export-heading">Export and backup</h2>
      <div className="pc-exports">
        <button type="button" className="ink-button" disabled={!loads.length} onClick={() => { download(loadsCsv(loads, today), `pod-chaser-${today}.csv`, "text/csv;charset=utf-8"); setRemoved(null); setMessage("CSV exported with every load. It opens in Excel, Numbers, or Google Sheets."); }}>Export CSV ↓</button>
        <button type="button" className="ink-button is-secondary" disabled={!loads.length} onClick={() => { download(backupJson(loads), `pod-chaser-backup-${today}.json`, "application/json"); setRemoved(null); setMessage("Backup exported. Keep it somewhere safe; you can restore it in any browser."); }}>Export Backup (JSON)</button>
        <input ref={restoreInput} type="file" accept=".json,application/json" className="sr-only" tabIndex={-1} aria-label="Choose a POD Chaser backup file" onChange={event => restore(event.target.files?.[0])} />
        <button type="button" className="ink-button is-secondary" onClick={() => restoreInput.current?.click()}>Restore Backup</button>
      </div>
      <p className="small-note">Your loads live only in this browser, so export a backup regularly. Restore Backup replaces the loads saved here with the ones in the file.</p>
    </section>
  </div>;
}
