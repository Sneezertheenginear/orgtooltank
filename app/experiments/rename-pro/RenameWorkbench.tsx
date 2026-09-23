"use client";

import { useRef, useState } from "react";
import { defaultOptions, optionErrors, previewNames, type RenameOptions } from "./engine";

type SelectedFile = { id: string; name: string; file: File };
const MAX_BYTES = 250 * 1024 * 1024;

export default function RenameWorkbench() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [options, setOptions] = useState({ ...defaultOptions });
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const rows = previewNames(files, options);
  const settingsErrors = optionErrors(options, files.length);
  const invalidCount = rows.filter(row => row.errors.length).length;
  const totalBytes = files.reduce((total, item) => total + item.file.size, 0);
  const tooLarge = files.length > 1 && (totalBytes > MAX_BYTES || files.length > 1000);
  const blocked = !files.length || !!invalidCount || !!settingsErrors.length || tooLarge || busy;
  function update<K extends keyof RenameOptions>(key: K, value: RenameOptions[K]) {
    setOptions(previous => ({ ...previous, [key]: value })); setMessage("");
  }
  function addFiles(selected: File[]) {
    if (busy) return;
    const added = selected.map(file => ({ id: crypto.randomUUID(), name: file.name, file }));
    setFiles(previous => [...previous, ...added]); setMessage("");
  }
  function clear() {
    setFiles([]); setOptions({ ...defaultOptions }); setMessage("");
    if (input.current) input.current.value = "";
  }
  async function download() {
    if (blocked) return;
    setBusy(true); setMessage("");
    try {
      let blob: Blob;
      let name: string;
      if (rows.length === 1) { blob = rows[0].file; name = rows[0].output; }
      else {
        const { zip } = await import("fflate");
        const entries: Record<string, Uint8Array> = Object.create(null);
        for (const row of rows) entries[row.output] = new Uint8Array(await row.file.arrayBuffer());
        const bytes = await new Promise<Uint8Array<ArrayBuffer>>((resolve, reject) => {
          zip(entries, { level: 0 }, (error, result) => error ? reject(error) : resolve(result as Uint8Array<ArrayBuffer>));
        });
        blob = new Blob([bytes], { type: "application/zip" }); name = "rename-pro.zip";
      }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setMessage("Download requested. Your original files are unchanged.");
    } catch { setMessage("Could not prepare the download. Try fewer or smaller files, or choose the files again."); }
    finally { setBusy(false); }
  }
  const textField = (key: "find" | "replace" | "remove" | "prefix" | "suffix", label: string, placeholder: string) => <label>{label}<input value={options[key]} onChange={event => update(key, event.target.value)} placeholder={placeholder} /></label>;
  return <div className="rename-workbench">
    <section className={`rename-drop ${dragging ? "is-dragging" : ""}`} aria-label="Choose or drop files"
      onDragOver={event => { event.preventDefault(); if (!busy) setDragging(true); }}
      onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }}
      onDrop={event => { event.preventDefault(); setDragging(false); addFiles(Array.from(event.dataTransfer.files)); }}>
      <div><p className="eyebrow">01 / Bring your files</p><h2>Drop files here.</h2><p>Or choose a few to get started. Your originals stay exactly as they are.</p></div>
      <input ref={input} type="file" multiple className="sr-only" tabIndex={-1} aria-label="Choose files" disabled={busy} onChange={event => { addFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
      <button type="button" className="ink-button" disabled={busy} onClick={() => input.current?.click()}>Choose files ↗</button>
    </section>
    <div className="rename-layout">
      <section className="rename-rules"><p className="eyebrow">02 / Make it yours</p><h2>Rename rules</h2>
        <fieldset className="workshop-form" disabled={busy}>
          <label className="rename-check"><input type="checkbox" checked={options.preserveExtension} onChange={event => update("preserveExtension", event.target.checked)} />Preserve extensions</label>
          <p className="small-note">Keeps the final extension, including its case: my.photo.final.JPG → .JPG</p>
          <div className="form-pair">{textField("find", "Replace text", "Find text")}{textField("replace", "With", "Replacement")}</div>
          {textField("remove", "Remove text", "Text to remove")}
          <div className="form-pair">{textField("prefix", "Add before", "Prefix")}{textField("suffix", "Add after", "Suffix")}</div>
          <label>Letter case<select value={options.letterCase} onChange={event => update("letterCase", event.target.value as RenameOptions["letterCase"])}><option value="unchanged">Keep original case</option><option value="lower">Lowercase</option><option value="upper">UPPERCASE</option><option value="title">Title Case</option></select></label>
          <label className="rename-check"><input type="checkbox" checked={options.clean} onChange={event => update("clean", event.target.checked)} />Clean filenames</label>
          <p className="small-note">Remove invalid characters, collapse whitespace, and trim spaces and dots from the name.</p>
          <label className="rename-check"><input type="checkbox" checked={options.number} onChange={event => update("number", event.target.checked)} />Number files</label>
          {options.number && <div className="form-pair"><label>Start at<input type="number" min="0" step="1" value={options.start} onChange={event => update("start", event.target.value)} /></label><label>Number width<input type="number" min="1" max="8" step="1" value={options.padding} onChange={event => update("padding", event.target.value)} /></label></div>}
          <p className="small-note">Rules apply top to bottom. Text matching is literal and case-sensitive. Numbers are appended as _001 in the preview order; added files go last.</p>
        </fieldset>
      </section>
      <section className="rename-preview"><div className="rename-preview-heading"><div><p className="eyebrow">03 / Check &amp; download</p><h2>Before → After</h2></div><span className="status-tag">{files.length} {files.length === 1 ? "file" : "files"}</span></div>
        {!files.length ? <div className="rename-empty"><span aria-hidden="true">Aa → Aa_001</span><h3>Your next batch starts here.</h3><p>Choose files to see a live preview.<br />Nothing changes until you download copies.</p></div> : <div className="rename-table-scroll"><table><thead><tr><th scope="col"># / Original</th><th scope="col">Renamed copy</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody>{rows.map((row, index) => <tr key={row.id}><td><span className="rename-index">{index + 1} / </span>{row.name}</td><td><strong>{row.output || "(empty)"}</strong>{row.errors.map(error => <p className="rename-error" key={error}>{error}</p>)}</td><td><button type="button" disabled={busy} className="rename-remove" aria-label={`Remove ${row.name}`} onClick={() => { setFiles(previous => previous.filter(file => file.id !== row.id)); setMessage(""); }}>×</button></td></tr>)}</tbody></table></div>}
        <div className="rename-download"><div aria-live="polite">{settingsErrors.map(error => <p className="rename-error" key={error}>{error}</p>)}{invalidCount > 0 && <p className="rename-error">Fix {invalidCount} invalid {invalidCount === 1 ? "name" : "names"} before downloading.</p>}{tooLarge && <p className="rename-error">For this browser experiment, ZIP batches are limited to 250 MB and 1,000 files. Remove files or start a smaller batch.</p>}{files.length > 0 && !invalidCount && !settingsErrors.length && !tooLarge && <p className="small-note">Names look good. {files.length > 1 ? "Your copies will download together in one ZIP." : "Your renamed copy is ready."}</p>}</div>
          <div className="detail-links"><button className="ink-button" type="button" disabled={blocked} onClick={download}>{busy ? "Preparing download…" : files.length > 1 ? "Download ZIP ↓" : "Download renamed copy ↓"}</button><button type="button" className="text-link" disabled={busy || !files.length} onClick={clear}>Start Over / Clear Files</button></div>
          <p role="status" className="small-note">{message}</p>
        </div>
      </section>
    </div>
  </div>;
}
