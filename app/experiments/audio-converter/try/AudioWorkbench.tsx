"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_DURATION_SECONDS, MAX_INPUT_BYTES, detectAudio, downloadName, encodeMp3, encodeWav, formatBytes, formatDuration, mimeTypes, mp3Bitrates, outputName, targetSampleRate, type AudioFormat, type AudioInfo, type Mp3Bitrate } from "../engine";

type Selected = { file: File; info: AudioInfo; nameMismatch: boolean };
type Phase = "idle" | "reading" | "decoding" | "encoding" | "done";
type Result = { url: string; name: string; size: number };
const formats: AudioFormat[] = ["mp3", "wav"];
const labels: Record<AudioFormat, string> = { mp3: "MP3", wav: "WAV" };
// Heights for the progress meter bars, in percent. Purely visual.
const meterBars = [30, 52, 74, 46, 88, 62, 38, 70, 94, 58, 34, 66, 82, 50, 28, 60, 90, 72, 44, 64, 86, 54, 36, 24];
const tooLong = `This browser experiment converts audio up to ${MAX_DURATION_SECONDS / 60} minutes long. Try a shorter file.`;

export default function AudioWorkbench() {
  const [selected, setSelected] = useState<Selected | null>(null);
  const [output, setOutput] = useState<AudioFormat>("mp3");
  const [bitrate, setBitrate] = useState<Mp3Bitrate>(192);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [fileStem, setFileStem] = useState("");
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);
  const resultUrl = useRef<string | null>(null);
  const busy = phase === "reading" || phase === "decoding" || phase === "encoding";
  const sameFormat = selected?.info.format === output;

  useEffect(() => () => { abort.current?.abort(); if (resultUrl.current) URL.revokeObjectURL(resultUrl.current); }, []);

  function clearResult() {
    if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
    resultUrl.current = null; setResult(null); setProgress(0); setPhase("idle");
  }
  function startOver() {
    abort.current?.abort(); abort.current = null;
    clearResult(); setSelected(null); setError(""); setNote(""); setOutput("mp3"); setBitrate(192);
    if (input.current) input.current.value = "";
  }
  async function choose(files: File[]) {
    if (busy || !files.length) return;
    startOver();
    const file = files[0];
    if (files.length > 1) setNote(`Only one file at a time. Using ${file.name}.`);
    if (file.size > MAX_INPUT_BYTES) { setError(`${file.name} is ${formatBytes(file.size)}. This browser experiment accepts files up to ${formatBytes(MAX_INPUT_BYTES)}.`); return; }
    let detected;
    try { detected = detectAudio(new Uint8Array(await file.arrayBuffer())); }
    catch { setError("Your browser couldn’t read this file. Try choosing it again."); return; }
    if (!detected.ok) { setError(`${file.name}: ${detected.error}`); return; }
    const { info } = detected;
    if (info.duration && info.duration > MAX_DURATION_SECONDS) { setError(tooLong); return; }
    const extension = file.name.split(".").pop()?.toLowerCase();
    setSelected({ file, info, nameMismatch: extension !== info.format });
    setOutput(info.format === "mp3" ? "wav" : "mp3");
  }
  function pickOutput(format: AudioFormat) { setOutput(format); clearResult(); setError(""); }
  function pickBitrate(value: Mp3Bitrate) { setBitrate(value); clearResult(); setError(""); }

  async function convert() {
    if (!selected || sameFormat || busy) return;
    clearResult(); setError("");
    const controller = new AbortController(); abort.current = controller;
    try {
      setPhase("reading");
      const bytes = await selected.file.arrayBuffer();
      controller.signal.throwIfAborted();
      setPhase("decoding");
      // Decoding happens in the browser's own audio engine, resampled to the rate the output needs.
      const context = new OfflineAudioContext(1, 1, targetSampleRate(selected.info.sampleRate, output));
      let audio: AudioBuffer;
      try { audio = await context.decodeAudioData(bytes); }
      catch { throw new Error("Your browser couldn’t decode this audio. The file may be damaged or use a variant this browser doesn’t support."); }
      controller.signal.throwIfAborted();
      if (audio.duration > MAX_DURATION_SECONDS) throw new Error(tooLong);
      if (output === "mp3" && audio.numberOfChannels > 2) throw new Error("MP3 output supports mono or stereo audio. This file has more channels; convert it with a desktop tool.");
      const channels = Array.from({ length: audio.numberOfChannels }, (_, i) => audio.getChannelData(i));
      setPhase("encoding"); setProgress(0);
      const options = { signal: controller.signal, onProgress: setProgress };
      const parts = output === "mp3" ? await encodeMp3(channels, audio.sampleRate, bitrate, options) : await encodeWav(channels, audio.sampleRate, options);
      const blob = new Blob(parts, { type: mimeTypes[output] });
      resultUrl.current = URL.createObjectURL(blob);
      const name = outputName(selected.file.name, output);
      setResult({ url: resultUrl.current, name, size: blob.size }); setFileStem(name.slice(0, -(output.length + 1)));
      setPhase("done");
    } catch (caught) {
      if (controller.signal.aborted) return;
      setPhase("idle"); setProgress(0);
      setError(caught instanceof Error && caught.message.length < 200 ? caught.message : "Conversion failed. Try again, or try a shorter file.");
    } finally { if (abort.current === controller) abort.current = null; }
  }

  const status = phase === "reading" ? "Reading your file…" : phase === "decoding" ? "Decoding audio…" : phase === "encoding" ? `Encoding ${labels[output]}… ${Math.floor(progress * 100)}%` : phase === "done" ? "Done. Your converted file is ready." : "";
  const download = downloadName(fileStem, output);
  const filled = phase === "done" ? meterBars.length : phase === "encoding" ? Math.floor(progress * meterBars.length) : 0;

  return <div className="audio-workbench">
    <section className={`audio-drop ${dragging ? "is-dragging" : ""}`} aria-label="Choose or drop an audio file"
      onDragOver={event => { event.preventDefault(); if (!busy) setDragging(true); }}
      onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }}
      onDrop={event => { event.preventDefault(); setDragging(false); choose(Array.from(event.dataTransfer.files)); }}>
      <div><p className="eyebrow">01 / Bring your audio</p><h2>Drop an MP3 or WAV here.</h2><p>Or choose one from your device. One file at a time, up to {formatBytes(MAX_INPUT_BYTES)} and {MAX_DURATION_SECONDS / 60} minutes.</p></div>
      <input ref={input} type="file" accept=".mp3,.wav,audio/mpeg,audio/wav,audio/x-wav,audio/wave" className="sr-only" tabIndex={-1} aria-label="Choose an audio file" disabled={busy} onChange={event => { choose(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
      <button type="button" className="ink-button" disabled={busy} onClick={() => input.current?.click()}>Choose audio file ↗</button>
    </section>

    {error && <p className="audio-error" role="alert">{error}</p>}
    {note && <p className="small-note">{note}</p>}

    <div className="audio-chain">
      <section className="audio-panel audio-source" aria-labelledby="audio-source-heading">
        <p className="eyebrow">Source</p><h2 id="audio-source-heading">Your file</h2>
        {selected ? <dl className="audio-facts">
          <div><dt>File</dt><dd className="audio-filename">{selected.file.name}</dd></div>
          <div><dt>Type</dt><dd>{labels[selected.info.format]}</dd></div>
          <div><dt>Size</dt><dd>{formatBytes(selected.file.size)}</dd></div>
          <div><dt>Audio</dt><dd>{selected.info.sampleRate / 1000} kHz · {selected.info.channels === 1 ? "mono" : selected.info.channels === 2 ? "stereo" : `${selected.info.channels} channels`}{selected.info.duration ? ` · ${formatDuration(selected.info.duration)}` : ""}</dd></div>
        </dl> : <div className="audio-empty"><span aria-hidden="true">.wav ⇄ .mp3</span><p>No file yet. Its name, type, and size will show here.</p></div>}
        {selected?.nameMismatch && <p className="small-note">The file name doesn’t end in .{selected.info.format}, but its contents are {labels[selected.info.format]}. It will be converted based on its contents.</p>}
      </section>

      <div className="audio-arrow" aria-hidden="true"><span>→</span></div>

      <section className="audio-panel" aria-labelledby="audio-output-heading">
        <p className="eyebrow">02 / Choose output</p><h2 id="audio-output-heading">Convert to</h2>
        <fieldset className="audio-options" disabled={busy}>
          <legend className="sr-only">Output format</legend>
          <div className="audio-formats">{formats.map(format => <button key={format} type="button" aria-pressed={output === format} disabled={selected?.info.format === format} onClick={() => pickOutput(format)}>{labels[format]}<small>{format === "mp3" ? "Smaller, compressed" : "Uncompressed, 16-bit"}</small></button>)}</div>
          {selected && <p className="small-note">Your file is already {labels[selected.info.format]}, so converting to the same format isn’t offered here.</p>}
          {output === "mp3" && <><p className="audio-label" id="audio-bitrate-label">MP3 bitrate</p>
            <div className="audio-bitrates" role="group" aria-labelledby="audio-bitrate-label">{mp3Bitrates.map(value => <button key={value} type="button" aria-pressed={bitrate === value} onClick={() => pickBitrate(value)}>{value}<small>kbps</small></button>)}</div>
            <p className="small-note">Higher bitrate: better quality, bigger file. 192 kbps is a good everyday choice.</p></>}
        </fieldset>
      </section>
    </div>

    <section className="audio-run" aria-labelledby="audio-run-heading">
      <div className="audio-run-heading"><p className="eyebrow">03 / Convert &amp; download</p><h2 id="audio-run-heading">{selected ? `${labels[selected.info.format]} → ${labels[output]}${output === "mp3" ? ` · ${bitrate} kbps` : ""}` : "Ready when you are"}</h2></div>
      <div className="audio-meter" role="progressbar" aria-label="Conversion progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={phase === "encoding" || phase === "done" ? Math.floor((phase === "done" ? 1 : progress) * 100) : undefined} aria-valuetext={status || "Not started"}>
        {meterBars.map((height, index) => <span key={index} className={index < filled ? "is-on" : ""} style={{ height: `${height}%` }} />)}
      </div>
      <p role="status" className="audio-status">{status}</p>
      {result && <div className="audio-result">
        <label htmlFor="audio-filename" className="audio-label">Name your file</label>
        <div className="audio-name-field"><input id="audio-filename" value={fileStem} onChange={event => setFileStem(event.target.value)} spellCheck={false} autoComplete="off" aria-describedby="audio-filename-extension audio-filename-note" aria-invalid={!!download.error} /><span id="audio-filename-extension">.{output}</span></div>
        <p id="audio-filename-note" className={download.error ? "audio-name-error" : "small-note"} aria-live="polite">{download.error ?? <>Downloads as <strong>{download.name}</strong> · {formatBytes(result.size)}. Your original file is unchanged.</>}</p>
      </div>}
      <div className="detail-links">
        {result ? download.error ? <button type="button" className="ink-button" disabled>Download {labels[output]} ↓</button> : <a className="ink-button" href={result.url} download={download.name}>Download {labels[output]} ↓</a>
          : <button type="button" className="ink-button" disabled={!selected || sameFormat || busy} onClick={convert}>{busy ? "Converting…" : "Convert ↗"}</button>}
        <button type="button" className="text-link" disabled={!selected && !error && !note} onClick={startOver}>{busy ? "Cancel / Start Over" : "Start Over"}</button>
      </div>
    </section>
  </div>;
}
