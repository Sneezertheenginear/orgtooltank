"use client";

import { useMemo, useRef, useState } from "react";
import { MAX_BYTES, MAX_ROWS, amountStyles, categorize, emptyChoices, fileFingerprint, formatDate, formatMoney, guessSettings, isSpreadsheet, limitError, parseCsv, readRows, type Choices, type Mapping, type ParsedFile, type Settings } from "../engine";
import { demoFiles } from "../demo";
import MoneyResults from "./MoneyResults";

// Everything lives in this component's memory only: no storage, no uploads. Refreshing clears it.
type Imported = { name: string; fingerprint: string; bytes: number; parsed: ParsedFile; settings: Settings };
type Phase = "start" | "confirm" | "results";
const mb = (bytes: number) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1).replace(/\.0$/, "")} MB`;

export default function MoneyWorkbench() {
  const [phase, setPhase] = useState<Phase>("start");
  const [files, setFiles] = useState<Imported[]>([]);
  const [demo, setDemo] = useState(false);
  const [choices, setChoices] = useState<Choices>(emptyChoices());
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [dragging, setDragging] = useState(false);
  const [reading, setReading] = useState(false);
  const [resultsKey, setResultsKey] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const read = useMemo(() => files.map(file => ({ file, ...readRows(file.parsed, file.settings) })), [files]);
  const txns = useMemo(() => categorize(read.flatMap(entry => entry.txns), choices), [read, choices]);
  const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0), totalRows = files.reduce((sum, file) => sum + file.parsed.rows.length, 0);
  const missing = (settings: Settings) => !settings.mapping.date || !settings.mapping.description || (settings.style === "debit_credit" ? !settings.mapping.debit || !settings.mapping.credit : !settings.mapping.amount);
  const ready = read.length > 0 && read.every(entry => !missing(entry.file.settings)) && read.some(entry => entry.txns.length);

  function startOver() {
    setPhase("start"); setFiles([]); setDemo(false); setChoices(emptyChoices()); setError(""); setNote(""); setResultsKey(key => key + 1);
    if (input.current) input.current.value = "";
  }

  async function addFiles(list: File[]) {
    if (!list.length || reading) return;
    setError(""); setNote("");
    const spreadsheet = list.find(file => isSpreadsheet(file.name));
    if (spreadsheet) { setError(`“${spreadsheet.name}” is a spreadsheet file. Save or export it as CSV first, then choose the CSV.`); return; }
    const other = list.find(file => !/\.(csv|txt)$/i.test(file.name));
    if (other) { setError(`“${other.name}” isn’t a CSV file. Export your transactions as CSV from your bank or card account, then choose that file.`); return; }
    const base = demo ? [] : files, bytes = base.reduce((sum, file) => sum + file.bytes, 0) + list.reduce((sum, file) => sum + file.size, 0);
    const tooBig = limitError(bytes, 0);
    if (tooBig) { setError(tooBig); return; }
    setReading(true);
    try {
      const added: Imported[] = [], skipped: string[] = [], seen = new Set(base.map(file => file.fingerprint));
      for (const file of list) {
        const text = await file.text(), fingerprint = fileFingerprint(text);
        if (seen.has(fingerprint)) { skipped.push(file.name); continue; }
        const parsed = parseCsv(text, uniqueName([...base, ...added], file.name));
        if (parsed.errors.length && parsed.headers.length < 3) { setError(`${file.name}: ${parsed.errors.join(" ")}`); return; }
        seen.add(fingerprint);
        added.push({ name: parsed.name, fingerprint, bytes: file.size, parsed, settings: guessSettings(parsed) });
      }
      const rows = [...base, ...added].reduce((sum, file) => sum + file.parsed.rows.length, 0), tooMany = limitError(0, rows);
      if (tooMany) { setError(tooMany); return; }
      if (skipped.length) setNote(`${skipped.join(", ")} ${skipped.length === 1 ? "was" : "were"} already added, so ${skipped.length === 1 ? "it was" : "they were"} skipped. Identical rows inside a file are always kept.`);
      if (!added.length) return;
      if (demo) { setDemo(false); setChoices(emptyChoices()); }
      setFiles([...base, ...added]); setPhase("confirm"); setResultsKey(key => key + 1);
    } catch { setError("Your browser couldn’t read that file. Try choosing it again."); }
    finally { setReading(false); if (input.current) input.current.value = ""; }
  }

  function tryDemo() {
    const loaded = demoFiles().map(({ name, text }) => { const parsed = parseCsv(text, name); return { name, fingerprint: fileFingerprint(text), bytes: text.length, parsed, settings: guessSettings(parsed) }; });
    setFiles(loaded); setDemo(true); setChoices(emptyChoices()); setError(""); setNote(""); setPhase("results"); setResultsKey(key => key + 1);
  }

  function update(name: string, change: (settings: Settings) => Settings) {
    setFiles(current => current.map(file => file.name === name ? { ...file, settings: change(file.settings) } : file));
  }
  const setColumn = (name: string, field: keyof Mapping, value: string) => update(name, settings => ({ ...settings, mapping: { ...settings.mapping, [field]: value || undefined } }));

  return <div className="money-workbench">
    <section className="money-start" aria-labelledby="money-start-heading">
      <div className="money-demo">
        <p className="eyebrow">01 / Bring your numbers</p>
        <h2 id="money-start-heading">See it with demo data first.</h2>
        <p>Six months of a fictional design studio’s checking and credit card, ready to explore.</p>
        <button type="button" className="ink-button" onClick={tryDemo}>Try Demo Data ↗</button>
      </div>
      <div className={`money-drop ${dragging ? "is-dragging" : ""}`} aria-label="Choose or drop CSV files"
        onDragOver={event => { event.preventDefault(); setDragging(true); }}
        onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }}
        onDrop={event => { event.preventDefault(); setDragging(false); addFiles(Array.from(event.dataTransfer.files)); }}>
        <h3>Or use your own CSV files.</h3>
        <p>Checking, credit card, another account: add as many as you like and they’re combined. Download them as CSV from your bank’s website.</p>
        <input ref={input} type="file" multiple accept=".csv,.txt,text/csv" className="sr-only" tabIndex={-1} aria-label="Choose CSV files" onChange={event => addFiles(Array.from(event.target.files ?? []))} />
        <button type="button" className={demo || !files.length ? "text-link" : "ink-button"} disabled={reading} onClick={() => input.current?.click()}>{reading ? "Reading…" : files.length && !demo ? "Add more CSV files" : "Choose CSV files"}</button>
        <p className="small-note">Up to {mb(MAX_BYTES)} and {MAX_ROWS.toLocaleString()} rows in total. Excel files need to be saved as CSV first.</p>
      </div>
    </section>

    {error && <p className="money-error" role="alert">{error}</p>}
    {note && <p className="small-note" role="status">{note}</p>}

    {phase === "confirm" && <section className="money-panel" aria-labelledby="money-confirm-heading">
      <p className="eyebrow">02 / Check the columns</p>
      <h2 id="money-confirm-heading">Does this look right?</h2>
      <p className="money-lede">We guessed the columns in {files.length === 1 ? "your file" : `each of your ${files.length} files`}. Check that dates, descriptions and money in or out look correct, then continue.</p>
      {read.map(({ file, txns: fileTxns, invalid }) => {
        const { settings, parsed } = file, options = parsed.headers;
        const select = (field: keyof Mapping, label: string, optional = false) => <label>{label}
          <select value={settings.mapping[field] ?? ""} onChange={event => setColumn(file.name, field, event.target.value)}>
            <option value="">{optional ? "None" : "Choose a column"}</option>
            {options.map(header => <option key={header} value={header}>{header}</option>)}
          </select></label>;
        const preview = categorize(fileTxns.slice(0, 5), choices);
        return <article key={file.name} className="money-file">
          <header><h3>{file.name}</h3><span>{parsed.rows.length.toLocaleString()} rows</span>
            <button type="button" className="text-link" onClick={() => { const rest = files.filter(other => other.name !== file.name); setFiles(rest); if (!rest.length) setPhase("start"); }}>Remove</button></header>
          <div className="money-columns">
            {select("date", "Date")}{select("description", "Description")}
            {settings.style === "debit_credit" ? <>{select("debit", "Debit (money out)")}{select("credit", "Credit (money in)")}</> : select("amount", "Amount")}
            {select("category", "Category (optional)", true)}{select("account", "Account (optional)", true)}
          </div>
          <fieldset className="money-style"><legend>How are amounts shown?</legend>
            {amountStyles.map(option => <label key={option.id}><input type="radio" name={`style-${file.name}`} checked={settings.style === option.id} onChange={() => update(file.name, current => ({ ...current, style: option.id }))} />{option.label}</label>)}
          </fieldset>
          <label className="money-check"><input type="checkbox" checked={settings.dayFirst} onChange={event => update(file.name, current => ({ ...current, dayFirst: event.target.checked }))} />Dates are day first (31/12/2026)</label>
          {missing(settings) ? <p className="money-error">Choose the {!settings.mapping.date ? "date" : !settings.mapping.description ? "description" : "amount"} column to continue.</p> : <>
            <div className="money-table-scroll"><table className="money-table"><thead><tr><th scope="col">Date</th><th scope="col">Description</th><th scope="col">Category</th><th scope="col" className="num">Money in</th><th scope="col" className="num">Money out</th></tr></thead>
              <tbody>{preview.map(txn => <tr key={txn.id}><td>{formatDate(txn.date)}</td><td>{txn.description}</td><td>{txn.transfer ? "Transfer" : txn.category}</td><td className="num">{txn.amountCents > 0 ? formatMoney(txn.amountCents) : ""}</td><td className="num">{txn.amountCents < 0 ? formatMoney(-txn.amountCents) : ""}</td></tr>)}</tbody></table></div>
            <p className="small-note">{fileTxns.length.toLocaleString()} transactions read.{invalid.length ? ` ${invalid.length.toLocaleString()} ${invalid.length === 1 ? "row" : "rows"} couldn’t be read and will be left out (row ${invalid[0].row}: ${invalid[0].reason}).` : ""}</p>
          </>}
        </article>;
      })}
      <div className="detail-links">
        <button type="button" className="ink-button" disabled={!ready} onClick={() => { setPhase("results"); setResultsKey(key => key + 1); }}>Show where it went ↗</button>
        <button type="button" className="text-link" onClick={startOver}>Start Over</button>
      </div>
      <p className="small-note">{files.length} {files.length === 1 ? "file" : "files"} · {mb(totalBytes)} · {totalRows.toLocaleString()} rows</p>
    </section>}

    {phase === "results" && <MoneyResults key={resultsKey} txns={txns} files={files.map(file => file.name)} demo={demo} setChoices={setChoices} onEditColumns={demo ? undefined : () => setPhase("confirm")} onStartOver={startOver} />}
  </div>;
}

function uniqueName(existing: { name: string }[], name: string) {
  let candidate = name;
  for (let n = 2; existing.some(file => file.name === candidate); n++) candidate = name.replace(/(\.[^.]+)?$/, ` (${n})$1`);
  return candidate;
}
