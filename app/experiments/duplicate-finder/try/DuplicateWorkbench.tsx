"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { MAX_FILES, MAX_HASH_BYTES, categoryLabels, cleanupCsv, entryKey, formatBytes, groupDuplicates, hashFile, limitError, matchesSearch, planScan, recoverable, suggestedKeeper, summarize, typeLabel, type Category, type Entry, type Group } from "../engine";
import { canPickFolders, fromDrop, fromInput, type Collected } from "./collect";

type Phase = "select" | "scanning" | "results";
type Live = { hashedBytes: number; hashedFiles: number; groups: number; duplicateFiles: number; recoverableBytes: number };
const emptyLive: Live = { hashedBytes: 0, hashedFiles: 0, groups: 0, duplicateFiles: 0, recoverableBytes: 0 };
const categories = Object.keys(categoryLabels) as Category[];
const PAGE = 25;
// Heights for the progress meter bars, in percent. Purely visual.
const meterBars = [30, 52, 74, 46, 88, 62, 38, 70, 94, 58, 34, 66, 82, 50, 28, 60, 90, 72, 44, 64, 86, 54, 36, 24];
const noSubscribe = () => () => {};
const dateLabel = (time: number) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(time);

export default function DuplicateWorkbench() {
  const [selection, setSelection] = useState<Entry<File>[]>([]);
  const [phase, setPhase] = useState<Phase>("select");
  const [live, setLive] = useState<Live>(emptyLive);
  const [groups, setGroups] = useState<Group<File>[]>([]);
  const [keepers, setKeepers] = useState<Record<string, string>>({});
  const [unreadable, setUnreadable] = useState(0);
  const [filter, setFilter] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [dragging, setDragging] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const folderInput = useRef<HTMLInputElement>(null);
  const filesInput = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);
  const nextId = useRef(0);
  const folders = useSyncExternalStore(noSubscribe, canPickFolders, () => true);
  const plan = useMemo(() => planScan(selection), [selection]);
  const busy = phase === "scanning" || collecting;
  // Limits are explained as soon as a selection is too big, not only after pressing Find duplicates.
  const overLimit = limitError(plan.scanned.length, plan.candidateBytes);

  useEffect(() => () => abort.current?.abort(), []);

  function startOver() {
    abort.current?.abort(); abort.current = null;
    setSelection([]); setPhase("select"); setLive(emptyLive); setGroups([]); setKeepers({}); setUnreadable(0);
    setFilter("all"); setQuery(""); setShown(PAGE); setError(""); setNote("");
    for (const input of [folderInput.current, filesInput.current]) if (input) input.value = "";
  }

  function add({ files, skipped, truncated }: Collected) {
    setCollecting(false);
    if (phase === "results") { setPhase("select"); setGroups([]); setKeepers({}); setLive(emptyLive); setUnreadable(0); }
    setError("");
    if (truncated) { setError(limitError(MAX_FILES + 2, 0)!); return; }
    const seen = new Set(selection.map(entryKey)), added: Entry<File>[] = [];
    for (const { file, path } of files) {
      const entry = { id: String(nextId.current++), name: file.name, path, size: file.size, type: file.type, lastModified: file.lastModified, file };
      if (!seen.has(entryKey(entry))) { seen.add(entryKey(entry)); added.push(entry); }
    }
    const repeats = files.length - added.length;
    setNote([repeats && `${repeats.toLocaleString()} ${repeats === 1 ? "file was" : "files were"} already selected.`, skipped && `Skipped ${skipped.toLocaleString()} system ${skipped === 1 ? "item" : "items"}.`].filter(Boolean).join(" "));
    setSelection([...selection, ...added]);
  }

  async function scan() {
    if (overLimit) return;
    if (!plan.scanned.length) { setError("There are no files to scan. Empty and system files are skipped."); return; }
    const controller = new AbortController(); abort.current = controller;
    setPhase("scanning"); setError(""); setNote("");
    const progress = { ...emptyLive }, counts = new Map<string, number>(), hashed: { entry: Entry<File>; hash: string }[] = [];
    let failed = 0, lastPaint = 0;
    const paint = (force = false) => { const now = performance.now(); if (force || now - lastPaint > 80) { lastPaint = now; setLive({ ...progress }); } };
    paint(true);
    try {
      for (const entry of plan.candidates) {
        try {
          const hash = await hashFile(entry.file, { signal: controller.signal, onBytes: bytes => { progress.hashedBytes += bytes; paint(); } });
          hashed.push({ entry, hash });
          // Live totals: a second copy creates a group; every further copy adds to it.
          const key = `${entry.size}:${hash}`, seen = (counts.get(key) ?? 0) + 1;
          counts.set(key, seen);
          if (seen === 2) progress.groups++;
          if (seen >= 2) { progress.duplicateFiles++; progress.recoverableBytes += entry.size; }
        } catch (caught) {
          if (controller.signal.aborted) throw caught;
          failed++; // Moved, deleted, or unreadable since it was chosen.
        }
        progress.hashedFiles++;
        paint();
      }
      const found = groupDuplicates(hashed);
      setGroups(found); setKeepers(Object.fromEntries(found.map(group => [group.id, suggestedKeeper(group)])));
      setUnreadable(failed); setLive({ ...progress, hashedBytes: plan.candidateBytes }); setPhase("results");
    } catch {
      if (abort.current !== controller) return;
      setPhase("select"); setLive(emptyLive); setError("The scan stopped unexpectedly. Try again, or scan fewer files.");
    } finally { if (abort.current === controller) abort.current = null; }
  }

  function cancel() { abort.current?.abort(); abort.current = null; setPhase("select"); setLive(emptyLive); setNote("Scan cancelled. Your selection is still here."); }

  function downloadReport() {
    const blob = new Blob(["\uFEFF", cleanupCsv(groups, keepers)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob), anchor = document.createElement("a");
    anchor.href = url; anchor.download = `duplicate-finder-cleanup-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  const totals = phase === "results" ? summarize(groups) : { groups: live.groups, duplicateFiles: live.duplicateFiles, recoverableBytes: live.recoverableBytes };
  const fraction = phase === "results" ? 1 : plan.candidateBytes ? Math.min(1, live.hashedBytes / plan.candidateBytes) : phase === "scanning" ? 1 : 0;
  const status = phase === "scanning" ? `Comparing contents… ${Math.floor(fraction * 100)}% · ${formatBytes(Math.min(live.hashedBytes, plan.candidateBytes))} of ${formatBytes(plan.candidateBytes)} · ${live.hashedFiles.toLocaleString()} of ${plan.candidates.length.toLocaleString()} files`
    : phase === "results" ? `Scan complete. ${plan.candidates.length.toLocaleString()} same-size ${plan.candidates.length === 1 ? "file was" : "files were"} compared by SHA-256.` : "";
  const counts = Object.fromEntries(categories.map(category => [category, groups.filter(group => group.category === category).length])) as Record<Category, number>;
  const visible = groups.filter(group => (filter === "all" || group.category === filter) && matchesSearch(group, query));

  return <div className="dupe-workbench">
    <section className={`dupe-drop ${dragging ? "is-dragging" : ""}`} aria-label="Choose or drop a folder or files"
      onDragOver={event => { event.preventDefault(); if (!busy) setDragging(true); }}
      onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }}
      onDrop={event => { event.preventDefault(); setDragging(false); if (busy) return; setCollecting(true); fromDrop(event.dataTransfer).then(add, () => { setCollecting(false); setError("Your browser couldn’t read what was dropped. Try Choose folder or Choose files instead."); }); }}>
      <div><p className="eyebrow">01 / Choose what to scan</p><h2>{folders ? "Drop a folder here." : "Choose the files to check."}</h2>
        <p>{folders ? "Or choose a folder or some files. Add more than one folder to compare them against each other." : "This browser can’t open whole folders, so choose multiple files instead. On iPhone and iPad you can pick from Photos or Files."}</p>
        <p className="small-note">Scans up to {MAX_FILES.toLocaleString()} files and compares up to {formatBytes(MAX_HASH_BYTES)} of same-size files at a time.</p></div>
      <div className="dupe-pick">
        <input ref={element => { element?.setAttribute("webkitdirectory", ""); folderInput.current = element; }} type="file" multiple className="sr-only" tabIndex={-1} aria-label="Choose a folder" disabled={busy} onChange={event => { add(fromInput(event.target.files)); event.target.value = ""; }} />
        <input ref={filesInput} type="file" multiple className="sr-only" tabIndex={-1} aria-label="Choose files" disabled={busy} onChange={event => { add(fromInput(event.target.files)); event.target.value = ""; }} />
        {folders && <button type="button" className="ink-button" disabled={busy} onClick={() => folderInput.current?.click()}>Choose folder ↗</button>}
        <button type="button" className={folders ? "text-link" : "ink-button"} disabled={busy} onClick={() => filesInput.current?.click()}>Choose files{folders ? "" : " ↗"}</button>
      </div>
    </section>

    {error && <p className="dupe-error" role="alert">{error}</p>}
    {note && <p className="small-note" role="status">{note}</p>}
    {collecting && <p className="small-note" role="status">Reading the folder list…</p>}

    <section className="dupe-panel" aria-labelledby="dupe-scan-heading">
      <div className="dupe-panel-heading"><div><p className="eyebrow">02 / Scan</p><h2 id="dupe-scan-heading">{selection.length ? `${plan.scanned.length.toLocaleString()} ${plan.scanned.length === 1 ? "file" : "files"} · ${formatBytes(plan.scannedBytes)}` : "Nothing selected yet"}</h2></div>
        {phase === "select" && <div className="detail-links"><button type="button" className="ink-button" disabled={!selection.length || busy || !!overLimit} onClick={scan}>Find duplicates ↗</button>{selection.length > 0 && <button type="button" className="text-link" onClick={startOver}>Clear selection</button>}</div>}
        {phase === "scanning" && <button type="button" className="text-link" onClick={cancel}>Cancel scan</button>}
      </div>
      {phase === "select" && overLimit && <p className="dupe-error" role="alert">{overLimit}</p>}
      {selection.length > 0 && (plan.skippedEmpty > 0 || plan.skippedSystem > 0) && <p className="small-note">Skipping {[plan.skippedEmpty && `${plan.skippedEmpty.toLocaleString()} empty`, plan.skippedSystem && `${plan.skippedSystem.toLocaleString()} system`].filter(Boolean).join(" and ")} {plan.skippedEmpty + plan.skippedSystem === 1 ? "file" : "files"}.</p>}
      {selection.length > 0 && phase === "select" && !overLimit && <p className="small-note">{plan.candidates.length ? `${plan.candidates.length.toLocaleString()} files share a size with another file, so ${formatBytes(plan.candidateBytes)} will be compared. Files with a unique size can’t be duplicates and aren’t read.` : "No two files share the same size, so there’s nothing to compare."}</p>}
      <div className="dupe-meter" role="progressbar" aria-label="Scan progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={phase === "select" ? undefined : Math.floor(fraction * 100)} aria-valuetext={status || "Not started"}>
        {meterBars.map((height, index) => <span key={index} className={index < Math.floor(fraction * meterBars.length) ? "is-on" : ""} style={{ height: `${height}%` }} />)}
      </div>
      <p className="dupe-status" role="status">{status}</p>
      <dl className="dupe-stats">
        <div><dt>Files scanned</dt><dd>{phase === "select" ? "—" : plan.scanned.length.toLocaleString()}</dd></div>
        <div><dt>Data scanned</dt><dd>{phase === "select" ? "—" : formatBytes(plan.scannedBytes)}</dd></div>
        <div><dt>Duplicate groups</dt><dd>{phase === "select" ? "—" : totals.groups.toLocaleString()}</dd></div>
        <div><dt>Duplicate files</dt><dd>{phase === "select" ? "—" : totals.duplicateFiles.toLocaleString()}</dd></div>
        <div><dt>Space you could recover</dt><dd>{phase === "select" ? "—" : formatBytes(totals.recoverableBytes)}</dd></div>
      </dl>
      {unreadable > 0 && <p className="small-note">{unreadable.toLocaleString()} {unreadable === 1 ? "file" : "files"} couldn’t be read (moved or changed since you chose {unreadable === 1 ? "it" : "them"}) and {unreadable === 1 ? "was" : "were"} left out.</p>}
    </section>

    {phase === "results" && <section className="dupe-results" aria-labelledby="dupe-review-heading">
      <p className="eyebrow">03 / Review &amp; choose what to keep</p>
      <h2 id="dupe-review-heading">{groups.length ? `${groups.length.toLocaleString()} ${groups.length === 1 ? "group" : "groups"} of identical files` : "No duplicates found."}</h2>
      {groups.length ? <>
        <p className="dupe-lede">Every file in a group has exactly the same contents. We picked the copy with the shortest path to keep. Change it with <strong>Keep This One</strong>.</p>
        <div className="dupe-tools">
          <div className="filter-list" role="group" aria-label="Filter by file type">
            <button type="button" aria-pressed={filter === "all"} onClick={() => { setFilter("all"); setShown(PAGE); }}>All · {groups.length}</button>
            {categories.map(category => <button key={category} type="button" aria-pressed={filter === category} disabled={!counts[category]} onClick={() => { setFilter(category); setShown(PAGE); }}>{categoryLabels[category]} · {counts[category]}</button>)}
          </div>
          <label className="dupe-search">Search<input type="search" value={query} onChange={event => { setQuery(event.target.value); setShown(PAGE); }} placeholder="Name or extension, like .jpg" /></label>
        </div>
        {visible.length ? <ol className="dupe-groups">{visible.slice(0, shown).map(group => {
          const keeper = keepers[group.id];
          return <li key={group.id} className="dupe-group">
            <div className="dupe-group-heading"><h3>{group.files.find(file => file.id === keeper)?.name}</h3>
              <p><span className="status-tag">{group.files.length} identical copies</span> {formatBytes(group.size)} each · {typeLabel(group.files[0])} · <strong>{formatBytes(recoverable(group))} recoverable</strong></p></div>
            <ul>{group.files.map(file => {
              const keeping = file.id === keeper;
              return <li key={file.id} className={keeping ? "is-keeper" : ""}>
                <div className="dupe-file"><span className="dupe-name">{file.name}</span><span className="dupe-path">{file.path.includes("/") ? file.path : "No folder path (chosen as a single file)"}</span><span className="dupe-meta">{formatBytes(file.size)} · {typeLabel(file)} · Modified {dateLabel(file.lastModified)}</span></div>
                {keeping ? <span className="dupe-keeping">✓ Keeping</span> : <><span className="dupe-copy">Duplicate copy</span><button type="button" className="dupe-keep" onClick={() => setKeepers(current => ({ ...current, [group.id]: file.id }))} aria-label={`Keep this one: ${file.path}`}>Keep This One</button></>}
              </li>;
            })}</ul>
          </li>;
        })}</ol> : <p className="dupe-none">No groups match this filter or search.</p>}
        {visible.length > shown && <button type="button" className="text-link dupe-more" onClick={() => setShown(count => count + PAGE)}>Show more groups ({(visible.length - shown).toLocaleString()} more)</button>}
      </> : <p className="dupe-lede">None of the {plan.scanned.length.toLocaleString()} files have an identical copy in this selection. Nice and tidy.</p>}
    </section>}

    {phase === "results" && <section className="dupe-panel dupe-finish" aria-labelledby="dupe-finish-heading">
      <p className="eyebrow">04 / Take your cleanup list</p>
      <h2 id="dupe-finish-heading">{groups.length ? "Your files, your call." : "All done."}</h2>
      <p className="dupe-lede">Duplicate Finder only reads your files. Nothing has been deleted, moved, or changed. {groups.length ? "The cleanup list marks one KEEP and every DUPLICATE copy for each group, so you can remove copies yourself in Finder or File Explorer when you’re ready." : ""}</p>
      <div className="detail-links">
        {groups.length > 0 && <button type="button" className="ink-button" onClick={downloadReport}>Download cleanup list (CSV) ↓</button>}
        <button type="button" className="text-link" onClick={startOver}>Start Over</button>
      </div>
      {groups.length > 0 && <p className="small-note">The list includes every group, even ones hidden by filters. It’s created on your device and isn’t sent anywhere.</p>}
    </section>}
  </div>;
}
