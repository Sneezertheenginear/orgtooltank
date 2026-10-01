"use client";

import { useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { DISCLAIMER, MAX_ENTRIES, STORAGE_KEY, actionLabel, actionTypes, blankCase, byDate, evidenceTypes, federalOptions, formatDate, isEmptyCase, isoDate, missingPieces, parseSaved, roleOptions, serializeSaved, summaryText, type Basics, type CaseFile, type Federal, type Section } from "../engine";
import { exampleCase } from "../demo";
import { NextStep, QuickStart } from "../../../experiment-components/Guidance";

// The case stays in this page's memory. It's saved to this browser's local storage only if the user
// turns saving on. The example case is never saved.
const CHANGED = "orgtooltank-workplace-case-saved";
const subscribe = (callback: () => void) => { window.addEventListener("storage", callback); window.addEventListener(CHANGED, callback); return () => { window.removeEventListener("storage", callback); window.removeEventListener(CHANGED, callback); }; };
const readSaved = () => { try { return localStorage.getItem(STORAGE_KEY); } catch { return null; } };

const steps = [
  { id: "basics", name: "Case Basics" },
  { id: "timeline", name: "Timeline" },
  { id: "people", name: "People & Evidence" },
  { id: "actions", name: "Actions Taken" },
  { id: "check", name: "Things to Add" },
  { id: "summary", name: "Case Summary" },
] as const;
type Step = typeof steps[number]["id"];
const stepFor: Record<Section, Step> = { basics: "basics", timeline: "timeline", people: "people", evidence: "people", actions: "actions" };

// ---------- Entry forms (timeline events, people, evidence, actions) ----------

type Kind = "events" | "people" | "evidence" | "actions";
type Field = { key: string; label: string; type: "text" | "date" | "textarea" | "select"; max?: number; optional?: boolean; required?: boolean; wide?: boolean; hint?: string; placeholder?: string; options?: { value: string; label: string }[] };
type Draft = Record<string, string>;
const opts = (values: readonly string[]) => values.map(value => ({ value, label: value }));
const nouns: Record<Kind, string> = { events: "event", people: "person", evidence: "evidence item", actions: "action" };

function fieldsFor(kind: Kind, c: CaseFile): Field[] {
  switch (kind) {
    case "events": return [
      { key: "date", label: "Date", type: "date", optional: true, hint: "Your best guess is fine." },
      { key: "title", label: "Short title", type: "text", max: 200, required: true, placeholder: "e.g. Written warning" },
      { key: "people", label: "People involved", type: "text", max: 300, optional: true, hint: "Separate names with commas." },
      { key: "description", label: "What happened", type: "textarea", max: 4000, wide: true, placeholder: "Who said or did what, where, and anything you remember about it." },
    ];
    case "people": return [
      { key: "name", label: "Name", type: "text", max: 120, required: true, placeholder: "A name, or a description like “night shift manager”" },
      { key: "role", label: "Role", type: "select", options: [{ value: "", label: "Not sure yet" }, ...opts(roleOptions)] },
      { key: "relationship", label: "Relationship to the situation", type: "textarea", max: 500, optional: true, wide: true, placeholder: "e.g. Made the decision, saw the meeting, received my complaint" },
    ];
    case "evidence": return [
      { key: "type", label: "Type", type: "select", options: opts(evidenceTypes) },
      { key: "title", label: "Title or description", type: "text", max: 200, required: true, placeholder: "e.g. Email from HR about my schedule" },
      { key: "date", label: "Date", type: "date", optional: true, hint: "If you know it." },
      { key: "eventId", label: "Related timeline event", type: "select", options: [{ value: "", label: "Not connected yet" }, ...byDate(c.events).map(e => ({ value: e.id, label: `${formatDate(e.date)} — ${e.title}` }))] },
      { key: "why", label: "Why it may matter", type: "textarea", max: 1000, optional: true, wide: true, placeholder: "What does it show?" },
    ];
    case "actions": return [
      { key: "action", label: "Action taken", type: "select", options: opts(actionTypes) },
      { key: "date", label: "Date", type: "date", optional: true },
      { key: "contacted", label: "Who you contacted", type: "text", max: 150, optional: true },
      { key: "response", label: "Response received", type: "textarea", max: 1000, optional: true, wide: true, hint: "If you haven’t heard back, write “No response yet”." },
      { key: "notes", label: "Notes", type: "textarea", max: 2000, optional: true, wide: true, placeholder: "e.g. how you contacted them, what you sent" },
    ];
  }
}
const blankDraft = (kind: Kind): Draft => ({ events: { date: "", title: "", people: "", description: "" }, people: { name: "", role: "", relationship: "" }, evidence: { type: "Email", title: "", date: "", eventId: "", why: "" }, actions: { action: "Spoke with supervisor", date: "", contacted: "", response: "", notes: "" } })[kind];

export default function CaseWorkbench() {
  const raw = useSyncExternalStore(subscribe, readSaved, () => null);
  const saved = useMemo(() => parseSaved(raw), [raw]);
  const [saveChoice, setSaveChoice] = useState<boolean | null>(null);
  const [edited, setEdited] = useState<CaseFile | undefined>(undefined);
  const [example, setExample] = useState<CaseFile | null>(null);
  const [step, setStep] = useState<Step>("basics");
  const [editing, setEditing] = useState<{ kind: Kind; id: string } | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState("");
  const [removed, setRemoved] = useState<{ kind: Kind; item: CaseFile[Kind][number]; index: number } | null>(null);
  const top = useRef<HTMLDivElement>(null);
  const saving = saveChoice ?? !!saved;
  const mine = edited ?? saved ?? blankCase();
  const current = example ?? mine;
  const checks = missingPieces(current);
  const restored = !edited && !!saved && saveChoice === null && !example && !message;

  function write(next: CaseFile) {
    try { localStorage.setItem(STORAGE_KEY, serializeSaved(next)); window.dispatchEvent(new Event(CHANGED)); return true; }
    catch { setMessage("This browser couldn’t save the case (storage may be full or turned off). It’s still here until you leave the page, so print or copy the summary to keep it."); return false; }
  }
  function removeSaved() { try { localStorage.removeItem(STORAGE_KEY); window.dispatchEvent(new Event(CHANGED)); } catch { /* nothing stored */ } }
  function commit(next: CaseFile) {
    if (example) { setExample(next); return; }
    setEdited(next);
    if (saving) write(next);
  }
  function toggleSaving(on: boolean) {
    setEdited(mine); setSaveChoice(on);
    if (on) { if (write(mine)) setMessage("Saving is on. This case is saved only in this browser on this device."); }
    else { removeSaved(); setMessage("Saving is off, and the saved copy was removed from this browser."); }
  }
  function startOver() {
    if (!isEmptyCase(mine) && !window.confirm("Clear this case and start over?\n\nEverything you entered will be removed from this page and from this browser. Print or copy the summary first if you want to keep it.")) return;
    removeSaved(); setEdited(blankCase()); setSaveChoice(false); setExample(null); setEditing(null); setRemoved(null); go("basics");
    setMessage("Cleared. Nothing from this case is saved in this browser.");
  }
  function loadExample() { setExample(exampleCase()); setEditing(null); setRemoved(null); setMessage("Loaded a fictional example case. Look through each section, then open Case Summary."); }
  function leaveExample() { setExample(null); setEditing(null); setRemoved(null); go("basics"); setMessage("Left the example. Nothing from it was saved."); }
  function go(next: Step) {
    setStep(next); setEditing(null); setFormError("");
    requestAnimationFrame(() => { const el = top.current; if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: "smooth", block: "start" }); });
  }

  const setBasics = (key: keyof Basics, value: string) => commit({ ...current, basics: { ...current.basics, [key]: value } });

  function openNew(kind: Kind) { setEditing({ kind, id: "new" }); setDraft(blankDraft(kind)); setFormError(""); }
  function openEdit(kind: Kind, item: Draft & { id: string }) { const { id, ...rest } = item; setEditing({ kind, id }); setDraft(rest); setFormError(""); }
  function saveDraft() {
    if (!editing) return;
    const { kind, id } = editing, fields = fieldsFor(kind, current);
    const clean: Draft = {};
    for (const f of fields) clean[f.key] = f.type === "text" ? (draft[f.key] ?? "").trim().slice(0, f.max) : (draft[f.key] ?? "").slice(0, f.max);
    const missing = fields.find(f => f.required && !clean[f.key]);
    if (missing) { setFormError(`Add a ${missing.label.toLowerCase()} so you can find this later.`); return; }
    const items = current[kind] as unknown as (Draft & { id: string })[];
    if (id === "new" && items.length >= MAX_ENTRIES) { setFormError(`This browser version keeps up to ${MAX_ENTRIES} of each kind of entry.`); return; }
    const next = id === "new" ? [...items, { id: crypto.randomUUID(), ...clean }] : items.map(item => item.id === id ? { ...item, ...clean } : item);
    commit({ ...current, [kind]: next });
    setEditing(null); setRemoved(null);
    setMessage(id === "new" ? `Added the ${nouns[kind]}.` : "Saved your changes.");
  }
  function remove(kind: Kind, id: string) {
    const items = current[kind] as { id: string }[], index = items.findIndex(item => item.id === id);
    setRemoved({ kind, item: current[kind][index], index });
    commit({ ...current, [kind]: items.filter(item => item.id !== id) });
    if (editing?.id === id) setEditing(null);
    setMessage(`Deleted the ${nouns[kind]}.`);
  }
  function undoRemove() {
    if (!removed) return;
    const items = [...current[removed.kind] as unknown[]];
    items.splice(Math.min(removed.index, items.length), 0, removed.item);
    commit({ ...current, [removed.kind]: items }); setRemoved(null); setMessage("Put it back.");
  }
  async function copySummary() {
    try { await navigator.clipboard.writeText(summaryText(current)); setMessage("Summary copied. Paste it into an email, a note, or a document."); }
    catch { setMessage("Your browser didn’t allow copying. Use Print / Save as PDF instead."); }
  }

  const form = editing && <form className="wc-form" onSubmit={event => { event.preventDefault(); saveDraft(); }} aria-label={`${editing.id === "new" ? "Add" : "Edit"} ${nouns[editing.kind]}`}>
    <h3>{editing.id === "new" ? "Add" : "Edit"} {nouns[editing.kind]}</h3>
    <div className="wc-fields">{fieldsFor(editing.kind, current).map((f, i) => {
      const value = draft[f.key] ?? "", set = (v: string) => setDraft({ ...draft, [f.key]: v }), hintId = f.hint ? `wc-hint-${f.key}` : undefined;
      const label = <>{f.label}{f.optional && <small> (optional)</small>}</>;
      return <div key={f.key} className={`wc-field${f.wide ? " is-wide" : ""}`}>
        <label>{label}
          {f.type === "select" ? <select value={value} onChange={e => set(e.target.value)} aria-describedby={hintId}>{f.options!.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
            : f.type === "textarea" ? <textarea value={value} maxLength={f.max} rows={3} placeholder={f.placeholder} onChange={e => set(e.target.value)} aria-describedby={hintId} />
            : <input type={f.type} value={value} maxLength={f.max} placeholder={f.placeholder} onChange={e => set(e.target.value)} aria-describedby={hintId} autoFocus={i === 0 || (f.required && i === 1)} />}
        </label>
        {f.hint && <p className="wc-hint" id={hintId}>{f.hint}</p>}
      </div>;
    })}</div>
    {formError && <p className="wc-error" role="alert">{formError}</p>}
    <div className="detail-links"><button type="submit" className="ink-button">{editing.id === "new" ? `Add ${nouns[editing.kind]}` : "Save changes"}</button><button type="button" className="text-link" onClick={() => setEditing(null)}>Cancel</button></div>
  </form>;

  /** One list of entries: empty hint, Add button, and each entry with Edit / Delete. */
  function entries<T extends { id: string }>(kind: Kind, items: T[], empty: string, render: (item: T) => ReactNode) {
    const adding = editing?.kind === kind && editing.id === "new";
    return <>
      {!items.length && !adding && <p className="wc-empty">{empty}</p>}
      {items.length > 0 && <ol className="wc-list">{items.map(item => editing?.kind === kind && editing.id === item.id
        ? <li key={item.id} className="wc-item is-editing">{form}</li>
        : <li key={item.id} className="wc-item"><div className="wc-item-main">{render(item)}</div>
          <span className="wc-row-links"><button type="button" className="text-link" onClick={() => openEdit(kind, item as unknown as Draft & { id: string })}>Edit</button><button type="button" className="text-link" onClick={() => remove(kind, item.id)}>Delete</button></span></li>)}</ol>}
      {adding ? form : <button type="button" className="ink-button wc-add" onClick={() => openNew(kind)}>Add {nouns[kind]} +</button>}
    </>;
  }
  const blank = (text: string) => text.trim() ? text : <span className="wc-missing">Not given</span>;
  const eventTitle = (id: string) => current.events.find(e => e.id === id)?.title;
  const stepIndex = steps.findIndex(s => s.id === step), nextStep = steps[stepIndex + 1];
  const counts: Partial<Record<Step, number>> = { timeline: current.events.length, people: current.people.length + current.evidence.length, actions: current.actions.length, check: checks.length };
  const nextButton = (hint: ReactNode) => nextStep && <div className="wc-next">
    <NextStep>{hint}</NextStep>
    <button type="button" className="ink-button" onClick={() => go(nextStep.id)}>Next: {nextStep.name} →</button>
  </div>;

  return <div className="wc-workbench">
    <section className="wc-save" aria-label="Where this case is kept">
      {example ? <><p><strong>Example case.</strong> The people, company, and events are fictional, and nothing here is saved. Your own case is waiting when you leave the example.</p><button type="button" className="text-link" onClick={leaveExample}>Leave example</button></>
        : <>
          <label className="wc-check"><input type="checkbox" checked={saving} onChange={event => toggleSaving(event.target.checked)} />Save this case in this browser</label>
          <p>{saving ? "Saved only in this browser on this device, and never sent to OrgToolTank. Anyone who uses this browser could open it, so turn this off on a shared or work computer." : "Off: nothing is stored, and reloading or leaving the page clears the case. Turn this on to keep it in this browser only."}</p>
          <span className="wc-save-links"><button type="button" className="text-link" onClick={loadExample}>Load Example</button><button type="button" className="text-link" onClick={startOver}>Clear Case / Start Over</button></span>
        </>}
      {restored && <p className="wc-message" role="status">Restored your saved case from this browser.</p>}
      {message && <p className="wc-message" role="status">{message}{removed && <> <button type="button" className="text-link" onClick={undoRemove}>Undo</button></>}</p>}
    </section>

    <QuickStart>You’re organizing information here, not filing anything. Fill in Case Basics, add what happened to the Timeline, then check Things to Add and print your Case Summary. Not ready to start? <button type="button" className="text-link" onClick={example ? leaveExample : loadExample}>{example ? "Leave the example" : "Load an example"}</button>.</QuickStart>

    <div className="wc-space" ref={top}>
      <nav className="wc-steps" aria-label="Case sections"><ol>{steps.map((s, i) => <li key={s.id}>
        <button type="button" aria-current={step === s.id ? "step" : undefined} onClick={() => go(s.id)}>
          <span className="wc-step-num">{String(i + 1).padStart(2, "0")}</span><span className="wc-step-name">{s.name}</span>{counts[s.id] ? <span className="wc-count" aria-label={`${counts[s.id]} ${s.id === "check" ? "suggestions" : "entries"}`}>{counts[s.id]}</span> : null}
        </button>
      </li>)}</ol></nav>

      <section className="wc-panel" aria-labelledby="wc-step-heading">
        <p className="eyebrow">{String(stepIndex + 1).padStart(2, "0")} / {steps[stepIndex].name}</p>

        {step === "basics" && <>
          <h2 id="wc-step-heading">Start with the basics</h2>
          <p className="wc-lede">Who, where, and a few sentences about what happened. Everything is optional, and you can change it any time.</p>
          <div className="wc-fields wc-basics">
            <label>Your name <small>(optional)</small><input value={current.basics.personName} maxLength={120} onChange={e => setBasics("personName", e.target.value)} /></label>
            <label>Employer or company<input value={current.basics.employer} maxLength={150} onChange={e => setBasics("employer", e.target.value)} /></label>
            <label>Job title<input value={current.basics.jobTitle} maxLength={120} onChange={e => setBasics("jobTitle", e.target.value)} /></label>
            <label>Work location<input value={current.basics.location} maxLength={150} placeholder="e.g. Main office, Store #12" onChange={e => setBasics("location", e.target.value)} /></label>
            <label>State<input value={current.basics.state} maxLength={60} onChange={e => setBasics("state", e.target.value)} /></label>
            <fieldset className="wc-radio"><legend>Federal employee?</legend><div>{federalOptions.map(o => <label key={o} className="wc-option"><input type="radio" name="wc-federal" checked={current.basics.federal === o} onChange={() => setBasics("federal", o as Federal)} />{o}</label>)}</div></fieldset>
            <div className="wc-field is-wide"><label>What happened, in short<textarea value={current.basics.description} maxLength={4000} rows={5} onChange={e => setBasics("description", e.target.value)} placeholder="A few sentences in your own words. The details go in the Timeline next." aria-describedby="wc-hint-desc" /></label><p className="wc-hint" id="wc-hint-desc">Imagine explaining it to someone who knows nothing about your job.</p></div>
          </div>
          {nextButton("Add each key moment to the Timeline, in any order. It sorts them by date.")}
        </>}

        {step === "timeline" && <>
          <h2 id="wc-step-heading">Timeline</h2>
          <p className="wc-lede">Add each key moment as its own event. They’re shown oldest first; events without a date go at the end.</p>
          {entries("events", byDate(current.events), "No events yet. Start with the first thing that happened, or the one you remember best.", e => <>
            <p className="wc-date">{e.date ? formatDate(e.date) : <span className="wc-missing">No date</span>}</p>
            <strong>{e.title}</strong>
            {e.people && <p className="wc-meta">People involved: {e.people}</p>}
            {e.description && <p className="wc-notes">{e.description}</p>}
          </>)}
          {nextButton("List the people involved and any evidence you have.")}
        </>}

        {step === "people" && <>
          <h2 id="wc-step-heading">People &amp; Evidence</h2>
          <h3 className="wc-sub">People</h3>
          <p className="wc-lede">Anyone involved, who saw something, or who you reported to.</p>
          {entries("people", current.people, "No people yet. Add the people named in your timeline first.", p => <>
            <strong>{p.name}</strong>
            <p className="wc-meta">{p.role || <span className="wc-missing">Role not given</span>}</p>
            {p.relationship && <p className="wc-notes">{p.relationship}</p>}
          </>)}
          <h3 className="wc-sub">Evidence</h3>
          <p className="wc-lede">Describe what you have and where it fits. You don’t upload anything here; keep the originals somewhere safe.</p>
          {entries("evidence", byDate(current.evidence), "No evidence listed yet. Emails, texts, schedules, write-ups, and photos are common examples.", e => <>
            <p className="wc-date">{e.type}{e.date && ` · ${formatDate(e.date)}`}</p>
            <strong>{e.title}</strong>
            <p className="wc-meta">Related event: {eventTitle(e.eventId) ?? <span className="wc-missing">Not connected</span>}</p>
            {e.why && <p className="wc-notes">{e.why}</p>}
          </>)}
          {nextButton("Record anything you’ve already done about it, like talking to a supervisor or HR.")}
        </>}

        {step === "actions" && <>
          <h2 id="wc-step-heading">Actions already taken</h2>
          <p className="wc-lede">Who you’ve told or asked, inside or outside the workplace, and what they said.</p>
          {entries("actions", byDate(current.actions), "Nothing recorded yet. If you’ve spoken to a supervisor, emailed HR, or filed an internal complaint, add it here. If you haven’t, that’s fine; skip ahead.", a => <>
            <p className="wc-date">{a.date ? formatDate(a.date) : <span className="wc-missing">No date</span>}</p>
            <strong>{actionLabel(a)}</strong>
            <p className="wc-meta">Response: {blank(a.response)}</p>
            {a.notes && <p className="wc-notes">{a.notes}</p>}
          </>)}
          {nextButton("See whether anything looks incomplete before you print.")}
        </>}

        {step === "check" && <>
          <h2 id="wc-step-heading">Things you may want to add</h2>
          <p className="wc-lede">This only looks for blanks and loose ends in what you’ve entered. It doesn’t judge your situation or say whether you have a case.</p>
          {checks.length ? <ul className="wc-checks">{checks.map(check => <li key={check.id}>
            <p><strong>{check.text}</strong>{check.detail && <> {check.detail}</>}</p>
            <button type="button" className="text-link" onClick={() => go(stepFor[check.section])}>Go to {steps.find(s => s.id === stepFor[check.section])!.name}</button>
          </li>)}</ul> : <p className="wc-all-set">Nothing obvious is missing from what you’ve entered.</p>}
          {nextButton(checks.length ? "Fill in what you can, or go on to the summary. These are suggestions, not requirements." : "Review your summary, then print it or copy it.")}
        </>}

        {step === "summary" && <>
          <h2 id="wc-step-heading">Case summary</h2>
          <p className="wc-lede">Everything you entered, in one place. Print it, save it as a PDF, or copy it into an email or document.</p>
          <div className="wc-exports">
            <button type="button" className="ink-button" onClick={() => window.print()}>Print / Save as PDF</button>
            <button type="button" className="ink-button is-secondary" onClick={copySummary}>Copy Summary</button>
          </div>
          <p className="small-note">To save a PDF, choose Print, then “Save as PDF” as the printer.</p>
          <div className="wc-doc-frame"><SummaryDoc c={current} example={!!example} /></div>
        </>}
      </section>
    </div>

    <div className="wc-print" aria-hidden="true"><SummaryDoc c={current} example={!!example} /></div>
  </div>;
}

/** The case summary, shown on the Case Summary step and used for printing. */
function SummaryDoc({ c, example }: { c: CaseFile; example: boolean }) {
  const b = c.basics, checks = missingPieces(c), eventTitle = (id: string) => c.events.find(e => e.id === id)?.title;
  const basics: [string, string][] = [["Name", b.personName], ["Employer / company", b.employer], ["Job title", b.jobTitle], ["Work location", b.location], ["State", b.state], ["Federal employee", b.federal]];
  const none = (text: string) => <p className="wc-doc-none">{text}</p>;
  return <article className="wc-doc">
    <div className="wc-doc-head"><p className="wc-doc-kicker">Workplace case summary</p><p className="wc-doc-title">{b.employer.trim() || "Workplace case"}</p><p className="wc-doc-meta">Prepared {formatDate(isoDate(new Date()))} with Workplace Case Builder{example && " · Fictional example"}</p></div>
    <section><h3>Case Basics</h3>{basics.some(([, v]) => v.trim()) ? <dl className="wc-doc-basics">{basics.filter(([, v]) => v.trim()).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl> : none("Not filled in.")}</section>
    <section><h3>What Happened</h3>{b.description.trim() ? <p className="wc-doc-text">{b.description}</p> : none("Not filled in.")}</section>
    <section><h3>Timeline</h3>{c.events.length ? <ol className="wc-doc-list">{byDate(c.events).map(e => <li key={e.id}><p className="wc-doc-date">{formatDate(e.date)}</p><div><p><strong>{e.title}</strong></p>{e.people.trim() && <p className="wc-doc-sub">People involved: {e.people}</p>}{e.description.trim() && <p className="wc-doc-text">{e.description}</p>}</div></li>)}</ol> : none("No events added.")}</section>
    <section><h3>People</h3>{c.people.length ? <table><thead><tr><th>Name</th><th>Role</th><th>Relationship to the situation</th></tr></thead><tbody>{c.people.map(p => <tr key={p.id}><td>{p.name}</td><td>{p.role || "Not given"}</td><td>{p.relationship}</td></tr>)}</tbody></table> : none("No people added.")}</section>
    <section><h3>Evidence</h3>{c.evidence.length ? <table><thead><tr><th>Type</th><th>Description</th><th>Date</th><th>Related event</th><th>Why it may matter</th></tr></thead><tbody>{byDate(c.evidence).map(e => <tr key={e.id}><td>{e.type}</td><td>{e.title}</td><td>{e.date ? formatDate(e.date) : ""}</td><td>{eventTitle(e.eventId) ?? "Not connected"}</td><td>{e.why}</td></tr>)}</tbody></table> : none("No evidence listed.")}</section>
    <section><h3>Actions Already Taken</h3>{c.actions.length ? <ol className="wc-doc-list">{byDate(c.actions).map(a => <li key={a.id}><p className="wc-doc-date">{formatDate(a.date)}</p><div><p><strong>{actionLabel(a)}</strong></p><p className="wc-doc-sub">Response: {a.response.trim() || "None recorded"}</p>{a.notes.trim() && <p className="wc-doc-text">{a.notes}</p>}</div></li>)}</ol> : none("No actions recorded.")}</section>
    <section><h3>Things You May Want to Add</h3>{checks.length ? <ul className="wc-doc-checks">{checks.map(check => <li key={check.id}>{check.text}{check.detail && ` ${check.detail}`}</li>)}</ul> : none("Nothing obvious is missing from what’s been entered.")}</section>
    <p className="wc-doc-note">{DISCLAIMER}</p>
  </article>;
}
