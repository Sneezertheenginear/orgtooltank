"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { canPickFolders, selectionFromDrop, selectionFromInput, type Selection } from "../../../experiment-components/file-selection";
import { MAX_BYTES, MAX_FILES, PLAN_NAME, TOP, buildItems, buildZip, categories, formatBytes, limitError, planCsv, planOutputs, renameStyles, zipRootName, type Placement, type RenameStyle, type Source } from "../engine";

type Phase = "select" | "zipping" | "done";
type Result = { url: string; name: string; size: number };
const placements: Placement[] = [...categories, TOP];
const SHOWN = 12;
// Heights for the progress meter bars, in percent. Purely visual.
const meterBars = [30, 52, 74, 46, 88, 62, 38, 70, 94, 58, 34, 66, 82, 50, 28, 60, 90, 72, 44, 64, 86, 54, 36, 24];
const noSubscribe = () => () => {};
const sourceKey = (source: Pick<Source, "path" | "size" | "lastModified">) => `${source.path}\u0000${source.size}\u0000${source.lastModified}`;

export default function OrganizeWorkbench() {
  const [sources, setSources] = useState<Source<File>[]>([]);
  const [chosen, setChosen] = useState<Record<string, Placement>>({});
  const [style, setStyle] = useState<RenameStyle>("keep");
  const [phase, setPhase] = useState<Phase>("select");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [expanded, setExpanded] = useState<Set<Placement>>(new Set());
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [dragging, setDragging] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const folderInput = useRef<HTMLInputElement>(null);
  const filesInput = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);
  const resultUrl = useRef<string | null>(null);
  const nextId = useRef(0);
  const folders = useSyncExternalStore(noSubscribe, canPickFolders, () => true);
  const items = useMemo(() => buildItems(sources), [sources]);
  const outputs = useMemo(() => planOutputs(items, chosen, style), [items, chosen, style]);
  const totalBytes = useMemo(() => sources.reduce((total, source) => total + source.size, 0), [sources]);
  const overLimit = limitError(sources.length, totalBytes);
  const busy = phase === "zipping" || collecting;

  useEffect(() => () => { abort.current?.abort(); if (resultUrl.current) URL.revokeObjectURL(resultUrl.current); }, []);

  function clearResult() {
    abort.current?.abort(); abort.current = null;
    if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
    resultUrl.current = null; setResult(null); setPhase("select"); setProgress(0);
  }
  function startOver() {
    clearResult(); setSources([]); setChosen({}); setStyle("keep"); setExpanded(new Set()); setError(""); setNote("");
    for (const input of [folderInput.current, filesInput.current]) if (input) input.value = "";
  }
  function add({ files, skipped, truncated }: Selection) {
    setCollecting(false); clearResult(); setError("");
    if (truncated) { setError(limitError(MAX_FILES + 2, 0)!); return; }
    const seen = new Set(sources.map(sourceKey)), added: Source<File>[] = [];
    for (const { file, path } of files) {
      const source = { id: String(nextId.current++), file, name: file.name, path, size: file.size, lastModified: file.lastModified };
      if (!seen.has(sourceKey(source))) { seen.add(sourceKey(source)); added.push(source); }
    }
    const repeats = files.length - added.length;
    setNote([repeats && `${repeats.toLocaleString()} ${repeats === 1 ? "file was" : "files were"} already selected.`, skipped && `Skipped ${skipped.toLocaleString()} system ${skipped === 1 ? "file" : "files"}.`].filter(Boolean).join(" "));
    setSources([...sources, ...added]);
  }
  function place(id: string, placement: Placement) { clearResult(); setChosen(current => ({ ...current, [id]: placement })); }
  function remove(id: string) { clearResult(); const item = items.find(entry => entry.id === id); if (item) setSources(sources.filter(source => !item.files.includes(source))); }

  async function create() {
    if (overLimit || !outputs.length || busy) return;
    clearResult(); setError("");
    const controller = new AbortController(); abort.current = controller;
    setPhase("zipping");
    let done = 0, lastPaint = 0;
    try {
      const root = zipRootName(items);
      const parts = await buildZip(outputs, [{ path: `${root}/${PLAN_NAME}`, data: new TextEncoder().encode(planCsv(outputs)) }], {
        signal: controller.signal,
        onBytes: bytes => { done += bytes; const now = performance.now(); if (now - lastPaint > 80) { lastPaint = now; setProgress(totalBytes ? done / totalBytes : 1); } },
      });
      const blob = new Blob(parts as Uint8Array<ArrayBuffer>[], { type: "application/zip" });
      resultUrl.current = URL.createObjectURL(blob);
      setResult({ url: resultUrl.current, name: `${root}.zip`, size: blob.size }); setProgress(1); setPhase("done");
    } catch (caught) {
      if (controller.signal.aborted) return;
      setPhase("select"); setProgress(0);
      setError(caught instanceof Error && caught.message.startsWith("Couldn’t read") ? caught.message : "The ZIP couldn’t be created. Try again, or choose fewer files.");
    } finally { if (abort.current === controller) abort.current = null; }
  }

  // One row per item (loose file or kept folder), grouped by where it ends up.
  const rows = useMemo(() => {
    const first = new Map(outputs.map(output => [output.item.id, output] as const).reverse());
    return items.map(item => {
      const output = first.get(item.id)!;
      const name = item.kind === "file" ? output.newName : output.folder.split("/")[output.placement === TOP ? 0 : 1];
      return { item, placement: output.placement, name, renamed: name !== item.name };
    });
  }, [items, outputs]);
  const sections = placements.map(placement => ({ placement, rows: rows.filter(row => row.placement === placement) })).filter(section => section.rows.length);
  const looseCount = items.filter(item => item.kind === "file").length, folderCount = items.length - looseCount;
  const status = phase === "zipping" ? `Creating your ZIP… ${Math.floor(progress * 100)}% · ${formatBytes(Math.round(progress * totalBytes))} of ${formatBytes(totalBytes)}` : phase === "done" ? "Done. Your organized ZIP is ready." : "";

  return <div className="organize-workbench">
    <section className={`organize-drop ${dragging ? "is-dragging" : ""}`} aria-label="Choose or drop a folder or files"
      onDragOver={event => { event.preventDefault(); if (!busy) setDragging(true); }}
      onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }}
      onDrop={event => { event.preventDefault(); setDragging(false); if (busy) return; setCollecting(true); selectionFromDrop(event.dataTransfer, { maxFiles: MAX_FILES }).then(add, () => { setCollecting(false); setError("Your browser couldn’t read what was dropped. Try Choose folder or Choose files instead."); }); }}>
      <div><p className="eyebrow">01 / Choose what to organize</p><h2>{folders ? "Drop a messy folder here." : "Choose the files to organize."}</h2>
        <p>{folders ? "Or choose a folder or some files. Loose files are sorted by type; folders you already made stay whole." : "This browser can’t open whole folders, so choose multiple files instead. On iPhone and iPad you can pick from Photos or Files."}</p>
        <p className="small-note">Up to {MAX_FILES.toLocaleString()} files and {formatBytes(MAX_BYTES)} at a time.</p></div>
      <div className="organize-pick">
        <input ref={element => { element?.setAttribute("webkitdirectory", ""); folderInput.current = element; }} type="file" multiple className="sr-only" tabIndex={-1} aria-label="Choose a folder" disabled={busy} onChange={event => { add(selectionFromInput(event.target.files, { maxFiles: MAX_FILES })); event.target.value = ""; }} />
        <input ref={filesInput} type="file" multiple className="sr-only" tabIndex={-1} aria-label="Choose files" disabled={busy} onChange={event => { add(selectionFromInput(event.target.files, { maxFiles: MAX_FILES })); event.target.value = ""; }} />
        {folders && <button type="button" className="ink-button" disabled={busy} onClick={() => folderInput.current?.click()}>Choose folder ↗</button>}
        <button type="button" className={folders ? "text-link" : "ink-button"} disabled={busy} onClick={() => filesInput.current?.click()}>Choose files{folders ? "" : " ↗"}</button>
      </div>
    </section>

    {error && <p className="organize-error" role="alert">{error}</p>}
    {note && <p className="small-note" role="status">{note}</p>}
    {collecting && <p className="small-note" role="status">Reading the folder list…</p>}

    {sources.length > 0 && <div className="organize-summary">
      <dl>
        <div><dt>Files</dt><dd>{sources.length.toLocaleString()} <small>of {MAX_FILES.toLocaleString()}</small></dd></div>
        <div><dt>Size</dt><dd>{formatBytes(totalBytes)} <small>of {formatBytes(MAX_BYTES)}</small></dd></div>
        <div><dt>Loose files</dt><dd>{looseCount.toLocaleString()}</dd></div>
        <div><dt>Folders kept whole</dt><dd>{folderCount.toLocaleString()}</dd></div>
      </dl>
      {overLimit && <p className="organize-error" role="alert">{overLimit}</p>}
    </div>}

    <section className="organize-panel" aria-labelledby="organize-preview-heading">
      <p className="eyebrow">02 / Preview the organization</p>
      <h2 id="organize-preview-heading">{sources.length ? (folderSections => `${folderSections} ${folderSections === 1 ? "folder" : "folders"} in your organized copy`)(sections.filter(section => section.placement !== TOP).length) : "Your organized folders will appear here"}</h2>
      {sources.length ? <>
        <p className="organize-lede">Each item shows where its copy will go. Change any destination; nothing on your device moves.</p>
        <div className="organize-sections">{sections.map(({ placement, rows: sectionRows }) => {
          const open = expanded.has(placement), visible = open ? sectionRows : sectionRows.slice(0, SHOWN);
          return <section key={placement} className="organize-section" aria-label={placement}>
            <header><h3>{placement === TOP ? "Top level" : `${placement}/`}</h3><span>{sectionRows.length} {sectionRows.length === 1 ? "item" : "items"} · {formatBytes(sectionRows.reduce((total, row) => total + row.item.size, 0))}</span></header>
            <ul>{visible.map(({ item, name, renamed }) => <li key={item.id} className={item.kind === "folder" ? "is-folder" : ""}>
              <span className="organize-kind" aria-hidden="true">{item.kind === "folder" ? "DIR" : "FILE"}</span>
              <div className="organize-item">
                <span className="organize-name">{name}{item.kind === "folder" ? "/" : ""}</span>
                <span className="organize-meta">{item.kind === "folder" ? `Kept whole · ${item.files.length.toLocaleString()} ${item.files.length === 1 ? "file" : "files"} · ${formatBytes(item.size)} · ${item.detail}` : `${item.detail} · ${formatBytes(item.size)}`}</span>
                <span className="organize-from">{renamed ? `Was ${item.name} · ` : ""}From {item.path}{item.kind === "folder" ? "/" : ""}</span>
              </div>
              <label className="organize-move"><span className="sr-only">Destination for {item.name}</span>
                <select value={chosen[item.id] ?? item.suggested} disabled={busy} onChange={event => place(item.id, event.target.value as Placement)}>
                  {placements.map(option => <option key={option} value={option}>{option === TOP ? "Top level" : option}{option === item.suggested ? " (suggested)" : ""}</option>)}
                </select>
              </label>
              <button type="button" className="organize-remove" disabled={busy} aria-label={`Leave out ${item.name}`} onClick={() => remove(item.id)}>×</button>
            </li>)}</ul>
            {sectionRows.length > SHOWN && <button type="button" className="text-link organize-more" onClick={() => setExpanded(current => { const next = new Set(current); if (open) next.delete(placement); else next.add(placement); return next; })}>{open ? "Show fewer" : `Show all ${sectionRows.length}`}</button>}
          </section>;
        })}</div>
      </> : <div className="organize-empty"><span aria-hidden="true">mess/ → Photos/ Documents/ Audio/</span><p>Choose a folder or files to see where everything will go.</p></div>}
    </section>

    <section className="organize-panel" aria-labelledby="organize-rename-heading">
      <p className="eyebrow">03 / Light rename (optional)</p>
      <h2 id="organize-rename-heading">Tidy loose file names</h2>
      <div className="organize-styles" role="radiogroup" aria-label="Rename style">{renameStyles.map(option => <label key={option.id} className={style === option.id ? "is-on" : ""}>
        <input type="radio" name="rename-style" value={option.id} checked={style === option.id} disabled={busy} onChange={() => { clearResult(); setStyle(option.id); }} />
        <span><strong>{option.label}</strong><small>{option.hint}</small></span>
      </label>)}</div>
      <p className="small-note">Extensions are always kept. Files inside kept folders keep their names. Need more control? Try <Link className="text-link" href="/experiments/rename-pro">Rename Pro</Link>.</p>
    </section>

    <section className="organize-panel" aria-labelledby="organize-zip-heading">
      <p className="eyebrow">04 / Create &amp; download</p>
      <h2 id="organize-zip-heading">{sources.length ? `${outputs.length.toLocaleString()} ${outputs.length === 1 ? "copy" : "copies"} + ${PLAN_NAME}` : "Your organized ZIP"}</h2>
      <p className="organize-lede">The ZIP holds organized copies of your files and a plan listing where each one went. Your originals are never moved or changed.</p>
      <div className="organize-meter" role="progressbar" aria-label="ZIP progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={phase === "select" ? undefined : Math.floor(progress * 100)} aria-valuetext={status || "Not started"}>
        {meterBars.map((height, index) => <span key={index} className={index < Math.floor(progress * meterBars.length) ? "is-on" : ""} style={{ height: `${height}%` }} />)}
      </div>
      <p className="organize-status" role="status">{status}</p>
      {result && <p className="organize-result"><strong>{result.name}</strong> · {formatBytes(result.size)}</p>}
      <div className="detail-links">
        {result ? <a className="ink-button" href={result.url} download={result.name}>Download ZIP ↓</a>
          : <button type="button" className="ink-button" disabled={!sources.length || !!overLimit || busy} onClick={create}>{phase === "zipping" ? "Creating ZIP…" : "Create organized ZIP ↗"}</button>}
        <button type="button" className="text-link" disabled={!sources.length && !error && !note} onClick={startOver}>{phase === "zipping" ? "Cancel / Start Over" : "Start Over"}</button>
      </div>
    </section>
  </div>;
}
