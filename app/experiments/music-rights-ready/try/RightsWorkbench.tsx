"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { LINKS_CHECKED, explainers, items, officialLinks, registrationItems, type ItemId } from "../content";
import { QuickStart } from "../../../experiment-components/Guidance";
import { STORAGE_KEY, checklistText, counts, emptyState, masterSplits, notesFor, parseSaved, proOptions, publishingOptions, roles, serialize, songSplits, statusOf, statuses, writesSong, type Owner, type Person, type RightsState, type Role, type Status } from "../engine";

// Saved progress lives only in this browser's local storage, and only when the user turns it on.
const CHANGED = "orgtooltank-music-rights-saved";
const subscribe = (callback: () => void) => { window.addEventListener("storage", callback); window.addEventListener(CHANGED, callback); return () => { window.removeEventListener("storage", callback); window.removeEventListener(CHANGED, callback); }; };
const readSaved = () => { try { return localStorage.getItem(STORAGE_KEY); } catch { return null; } };
const stages = [...new Set(items.map(item => item.stage))];
const linkFor = (id: string) => officialLinks.find(link => link.id === id)!;
const savedLabel = (iso: string) => { const date = new Date(iso); return Number.isNaN(date.getTime()) ? "earlier" : date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }); };

export default function RightsWorkbench() {
  const raw = useSyncExternalStore(subscribe, readSaved, () => null);
  const saved = useMemo(() => parseSaved(raw), [raw]);
  const [edited, setEdited] = useState<RightsState | null>(null);
  const [saveChoice, setSaveChoice] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  const [downloaded, setDownloaded] = useState("");
  const saving = saveChoice ?? !!saved;
  const state = edited ?? saved?.state ?? emptyState();

  function write(next: RightsState) {
    try { localStorage.setItem(STORAGE_KEY, serialize(next, new Date().toISOString())); window.dispatchEvent(new Event(CHANGED)); return true; }
    catch { setMessage("This browser couldn’t save your progress (storage may be full or turned off). Your checklist is still here until you leave the page."); return false; }
  }
  function update(change: (current: RightsState) => RightsState) {
    const next = change(state);
    setEdited(next);
    if (saving) write(next);
  }
  function toggleSaving(on: boolean) {
    setEdited(state); setSaveChoice(on);
    if (on) { if (write(state)) setMessage("Saving is on. Your checklist is saved only in this browser on this device."); }
    else clearSaved("Saving is off and the saved copy was removed from this browser.");
  }
  function clearSaved(note = "Saved progress was cleared from this browser. What you see stays until you leave the page or start over.") {
    setEdited(state); setSaveChoice(false);
    try { localStorage.removeItem(STORAGE_KEY); window.dispatchEvent(new Event(CHANGED)); } catch { /* nothing stored */ }
    setMessage(note);
  }
  function startOver() {
    const next = emptyState();
    setEdited(next); if (saving) write(next);
    setMessage(saving ? "Started over. The saved copy in this browser was replaced with a blank checklist." : "Started over.");
  }
  function download() {
    const blob = new Blob([checklistText(state)], { type: "text/plain;charset=utf-8" });
    const slug = (state.song.title.trim() || "song").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "song";
    const url = URL.createObjectURL(blob), anchor = document.createElement("a");
    anchor.href = url; anchor.download = `music-rights-checklist-${slug}.txt`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    setDownloaded(`Checklist downloaded as ${anchor.download}. It was created on your device.`);
  }

  const setSong = (field: keyof RightsState["song"], value: string) => update(current => ({ ...current, song: { ...current.song, [field]: value } }));
  const setPerson = (id: string, change: Partial<Person>) => update(current => ({ ...current, people: current.people.map(person => person.id === id ? { ...person, ...change } : person) }));
  const toggleRole = (person: Person, role: Role) => setPerson(person.id, { roles: person.roles.includes(role) ? person.roles.filter(r => r !== role) : [...person.roles, role] });
  const addPerson = () => update(current => ({ ...current, people: [...current.people, { id: crypto.randomUUID(), name: "", roles: [], sharesSong: false, songShare: "", pro: "", publishing: "" }] }));
  const setOwner = (id: string, change: Partial<Owner>) => update(current => ({ ...current, owners: current.owners.map(owner => owner.id === id ? { ...owner, ...change } : owner) }));
  const setStatus = (id: ItemId, status: Status) => update(current => ({ ...current, statuses: { ...current.statuses, [id]: status } }));

  const writers = state.people.filter(writesSong), song = songSplits(state), master = masterSplits(state), tally = counts(state);
  const statusSelect = (id: ItemId, label: string) => <label className="music-status"><span className="sr-only">Status for {label}</span>
    <select value={statusOf(state, id)} data-status={statusOf(state, id)} onChange={event => setStatus(id, event.target.value as Status)}>{statuses.map(option => <option key={option}>{option}</option>)}</select></label>;
  const links = (ids?: string[]) => ids?.length ? <p className="music-links">{ids.map(id => <a key={id} href={linkFor(id).url} target="_blank" rel="noopener noreferrer">{linkFor(id).name} ↗</a>)}</p> : null;

  return <div className="music-workbench">
    <section className="music-save" aria-label="Saving your progress">
      <label className="music-check"><input type="checkbox" checked={saving} onChange={event => toggleSaving(event.target.checked)} />Save my progress in this browser</label>
      <p>{saving ? `Your checklist is saved only in this browser on this device${saved?.savedAt ? `, last saved ${savedLabel(saved.savedAt)}` : ""}. It isn’t sent to OrgToolTank.` : "Off: nothing is stored, and leaving the page clears it. Turn this on to keep your checklist in this browser only."}</p>
      {saving && <button type="button" className="text-link" onClick={() => clearSaved()}>Clear saved progress</button>}
      {!edited && saved && saving && <p className="music-restored" role="status">Restored your saved progress.</p>}
      {message && <p className="small-note" role="status">{message}</p>}
    </section>

    <QuickStart>Enter the song, add everyone who worked on it, then fill in who owns what. Your checklist at the bottom updates as you go.</QuickStart>
    <div className="music-steps">
      <section className="music-panel" aria-labelledby="music-song-heading">
        <p className="eyebrow">01 / About the song</p>
        <h2 id="music-song-heading">Which song is this for?</h2>
        <div className="music-grid">
          <label>Song title<input value={state.song.title} maxLength={200} onChange={event => setSong("title", event.target.value)} placeholder="Night Drive" /></label>
          <label>Artist or release name <small>(optional)</small><input value={state.song.artist} maxLength={200} onChange={event => setSong("artist", event.target.value)} placeholder="Maya Lane" /></label>
        </div>
        <fieldset className="music-choice"><legend>Is it out yet?</legend>
          {([["unreleased", "Not released yet"], ["released", "Already released"]] as const).map(([value, label]) => <label key={value}><input type="radio" name="released" checked={state.song.released === value} onChange={() => setSong("released", value)} />{label}</label>)}
        </fieldset>
        <label className="music-date">{state.song.released === "released" ? "Release date" : "Expected release date"} <small>(optional)</small><input type="date" value={state.song.date} onChange={event => setSong("date", event.target.value)} /></label>
      </section>

      <section className="music-panel" aria-labelledby="music-people-heading">
        <p className="eyebrow">02 / Who made it</p>
        <h2 id="music-people-heading">Everyone who worked on the song</h2>
        <div className="music-explain"><div><strong>The song (composition)</strong><p>{explainers.composition}</p></div><div><strong>The recording (master)</strong><p>{explainers.master}</p></div></div>
        <p className="music-lede">Add each person and what they did. A producer or featured artist doesn’t automatically share in the songwriting.</p>
        {state.people.map((person, index) => {
          const writer = person.roles.includes("Songwriter") || person.roles.includes("Composer");
          return <article key={person.id} className="music-person" aria-label={person.name || `Person ${index + 1}`}>
            <div className="music-person-head"><label>Name<input value={person.name} maxLength={120} onChange={event => setPerson(person.id, { name: event.target.value })} placeholder="Full or professional name" /></label>
              <button type="button" className="text-link" onClick={() => update(current => ({ ...current, people: current.people.filter(p => p.id !== person.id) }))}>Remove</button></div>
            <fieldset className="music-roles"><legend>What they did</legend>{roles.map(role => <label key={role}><input type="checkbox" checked={person.roles.includes(role)} onChange={() => toggleRole(person, role)} />{role}</label>)}</fieldset>
            {!writer && person.roles.length > 0 && <label className="music-check"><input type="checkbox" checked={person.sharesSong} onChange={event => setPerson(person.id, { sharesSong: event.target.checked })} />Everyone agrees this person also helped write the song</label>}
            {writesSong(person) && <div className="music-grid">
              <div><label>PRO <small>(performing rights organization)</small><select value={person.pro} aria-describedby={`pro-hint-${person.id}`} onChange={event => setPerson(person.id, { pro: event.target.value as Person["pro"] })}>{proOptions.map(option => <option key={option} value={option}>{option || "Choose…"}</option>)}</select></label><p className="field-hint music-hint" id={`pro-hint-${person.id}`}>Collects this writer’s performance royalties. “Not sure” is fine for now.</p></div>
              <div><label>Publishing<select value={person.publishing} aria-describedby={`pub-hint-${person.id}`} onChange={event => setPerson(person.id, { publishing: event.target.value as Person["publishing"] })}>{publishingOptions.map(option => <option key={option} value={option}>{option || "Choose…"}</option>)}</select></label><p className="field-hint music-hint" id={`pub-hint-${person.id}`}>Who collects the publisher share of this writer’s song income, if anyone yet.</p></div>
            </div>}
          </article>;
        })}
        {!state.people.length && <p className="small-note music-empty">No one added yet. Add each person who wrote, produced, or performed on the song.</p>}
        <button type="button" className="ink-button" onClick={addPerson}>{state.people.length ? "Add another person" : "Add a person"} +</button>
      </section>

      <section className="music-panel" aria-labelledby="music-owns-heading">
        <p className="eyebrow">03 / Who owns what</p>
        <h2 id="music-owns-heading">Two kinds of ownership</h2>
        <p className="music-lede">This organizes what you enter. It doesn’t decide what anyone legally owns; that’s for everyone involved to agree, ideally in writing.</p>
        <div className="music-own">
          <div>
            <h3>The song: proposed songwriter splits</h3><p className="field-hint">Each songwriter’s agreed share of the song. Together they usually add up to 100%.</p>
            {writers.length ? writers.map(person => <label key={person.id} className="music-share">{person.name.trim() || "Unnamed"}<span><input inputMode="decimal" value={person.songShare} maxLength={8} onChange={event => setPerson(person.id, { songShare: event.target.value })} placeholder="0" aria-label={`${person.name || "Unnamed"} share of the song`} />%</span></label>)
              : <p className="small-note">Mark people as Songwriter or Composer in step 02 to enter splits.</p>}
            <p className={song.ok ? "music-ok" : "music-warn"} role="status">{song.ok ? "✓ " : "! "}{song.message}</p>
          </div>
          <div>
            <h3>The recording: master owners</h3><p className="field-hint">Who owns the recorded audio. Owners can be people or a company, like a label.</p>
            <label className="music-check"><input type="checkbox" checked={state.ownersNotSure} onChange={event => update(current => ({ ...current, ownersNotSure: event.target.checked }))} />Not sure yet</label>
            {!state.ownersNotSure && <>
              {state.owners.map(owner => <div key={owner.id} className="music-owner">
                <input list="music-people" value={owner.name} maxLength={120} onChange={event => setOwner(owner.id, { name: event.target.value })} placeholder="Person or company" aria-label="Owner name" />
                <span><input inputMode="decimal" value={owner.share} maxLength={8} onChange={event => setOwner(owner.id, { share: event.target.value })} placeholder="0" aria-label={`${owner.name || "Owner"} share of the recording`} />%</span>
                <button type="button" className="music-remove" aria-label={`Remove ${owner.name || "owner"}`} onClick={() => update(current => ({ ...current, owners: current.owners.filter(o => o.id !== owner.id) }))}>×</button>
              </div>)}
              <datalist id="music-people">{state.people.filter(person => person.name.trim()).map(person => <option key={person.id} value={person.name} />)}</datalist>
              <button type="button" className="text-link" onClick={() => update(current => ({ ...current, owners: [...current.owners, { id: crypto.randomUUID(), name: "", share: "" }] }))}>+ Add an owner</button>
              <p className={master.ok ? "music-ok" : "music-warn"} role="status">{master.ok ? "✓ " : "! "}{master.message}</p>
            </>}
          </div>
        </div>
      </section>

      <section className="music-panel" aria-labelledby="music-done-heading">
        <p className="eyebrow">04 / What’s already registered</p>
        <h2 id="music-done-heading">What have you already handled?</h2>
        <div className="music-explain is-three"><div><strong>PROs</strong><p>{explainers.pro}</p></div><div><strong>Copyright registration</strong><p>{explainers.copyright}</p></div><div><strong>Distributors</strong><p>{explainers.distributor}</p></div></div>
        <ul className="music-quick">{registrationItems.map(id => { const item = items.find(entry => entry.id === id)!; return <li key={id}><span>{item.title}</span>{statusSelect(id, item.title)}</li>; })}</ul>
        <p className="small-note">OrgToolTank isn’t connected to any of these organizations and can’t check or submit registrations. These answers only update your checklist.</p>
      </section>

      <section className="music-panel" aria-labelledby="music-list-heading">
        <p className="eyebrow">05 / Your rights checklist</p>
        <h2 id="music-list-heading">{state.song.title.trim() ? `Checklist for “${state.song.title.trim()}”` : "Your rights checklist"}</h2>
        <p className="music-counts">{statuses.map(status => `${tally[status]} ${status.toLowerCase()}`).join(" · ")}</p>
        <p className="small-note">“Done” only means you marked the task complete. It doesn’t confirm ownership, registration, or royalties.</p>
        {stages.map(stage => <div key={stage} className="music-stage"><h3>{stage}</h3>
          <ol>{items.filter(item => item.stage === stage).map(item => <li key={item.id} data-status={statusOf(state, item.id)}>
            <div className="music-item"><strong>{item.title}</strong><p>{item.detail}</p>
              {notesFor(item.id, state).map(note => <p key={note} className="music-note">{note}</p>)}{links(item.links)}</div>
            {statusSelect(item.id, item.title)}
          </li>)}</ol></div>)}
        <p className="music-sync"><strong>Licensing for film, TV, ads, or games</strong> is a separate process that involves both the composition and the master. It isn’t covered here.</p>
        <p className="small-note">Official links checked {LINKS_CHECKED}. Check each organization’s current requirements and fees before registering.</p>
        <div className="detail-links"><button type="button" className="ink-button" onClick={download}>Download checklist (.txt) ↓</button><button type="button" className="ink-button is-secondary" onClick={() => window.print()}>Print / Save as PDF</button><button type="button" className="text-link" onClick={startOver}>Start Over</button></div>
        {downloaded && <p className="small-note" role="status">{downloaded}</p>}
      </section>
    </div>

    <PrintView state={state} />
  </div>;
}

/** A clean print layout: summary, both kinds of ownership, the checklist, and a draft split sheet to sign. */
function PrintView({ state }: { state: RightsState }) {
  const writers = state.people.filter(writesSong);
  return <div className="music-print" aria-hidden="true">
    <h1>Music Rights Ready: {state.song.title.trim() || "Untitled song"}</h1>
    <p>{state.song.artist.trim() && <>Artist: {state.song.artist.trim()} · </>}{state.song.released === "released" ? "Already released" : state.song.released === "unreleased" ? "Not released yet" : "Release status not entered"}{state.song.date && ` · ${state.song.date}`} · Printed {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
    <h2>Who made it</h2>
    <ul>{state.people.map(person => <li key={person.id}>{person.name.trim() || "Unnamed"}: {person.roles.join(", ") || "role not set"}{person.pro && ` · PRO: ${person.pro}`}{person.publishing && ` · ${person.publishing}`}</li>)}</ul>
    <h2>The recording (master): owners as entered</h2>
    <p>{state.ownersNotSure ? "Not sure yet." : state.owners.map(owner => `${owner.name.trim() || "Unnamed"} ${owner.share.trim().replace(/%$/, "") || "?"}%`).join(" · ") || "None entered."} {!state.ownersNotSure && `(${masterSplits(state).message})`}</p>
    <h2>Checklist</h2>
    {stages.map(stage => <div key={stage}><h3>{stage}</h3><ul>{items.filter(item => item.stage === stage).map(item => <li key={item.id}><strong>[{statusOf(state, item.id)}] {item.title}</strong> {item.detail} {notesFor(item.id, state).join(" ")} {(item.links ?? []).map(id => `${linkFor(id).name}: ${linkFor(id).url}`).join(" · ")}</li>)}</ul></div>)}
    <p>“Done” only means it was marked complete here. Official links checked {LINKS_CHECKED}.</p>
    <section className="music-print-sheet">
      <h2>Draft split sheet: {state.song.title.trim() || "Untitled song"}</h2>
      <p>Songwriter shares of the song (composition) as proposed. Everyone listed should review and sign. This draft doesn’t decide legal ownership.</p>
      <table><thead><tr><th>Songwriter</th><th>Share</th><th>PRO</th><th>Signature</th><th>Date</th></tr></thead>
        <tbody>{(writers.length ? writers : [null, null, null]).map((person, index) => <tr key={person?.id ?? index}><td>{person?.name}</td><td>{person?.songShare ? `${person.songShare.replace(/%$/, "")}%` : ""}</td><td>{person?.pro}</td><td /><td /></tr>)}</tbody></table>
      <p>{songSplits(state).message}</p>
    </section>
  </div>;
}
