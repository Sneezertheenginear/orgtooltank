"use client";

import { useRef, useState } from "react";
import { EXAMPLES, STOP_DRIVING, lookup, urgencyText, type Lookup } from "../engine";

// Lookups run against the local code library in the page. Nothing is saved or sent anywhere.
type Vehicle = { year: string; make: string; model: string; engine: string };
const vehicleFields: { key: keyof Vehicle; label: string; placeholder: string; inputMode?: "numeric" }[] = [
  { key: "year", label: "Year", placeholder: "e.g. 2014", inputMode: "numeric" },
  { key: "make", label: "Make", placeholder: "e.g. Ford" },
  { key: "model", label: "Model", placeholder: "e.g. F-150" },
  { key: "engine", label: "Engine", placeholder: "e.g. 3.5L V6" },
];
const familyText = {
  generic: "It’s in the generic OBD-II range, so it’s likely one we just haven’t added yet.",
  manufacturer: "Its number range is set by each vehicle manufacturer, so its meaning depends on the vehicle. The same code can mean different things on different makes.",
  either: "Its number range can be generic or manufacturer-specific, depending on the exact code, so its meaning may depend on the vehicle.",
};

export default function CodeLookup() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<Lookup | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle>({ year: "", make: "", model: "", engine: "" });
  const heading = useRef<HTMLHeadingElement>(null);
  const vehicleName = [vehicle.year, vehicle.make, vehicle.model, vehicle.engine].map(v => v.trim()).filter(Boolean).join(" ");

  function run(text: string) {
    const next = lookup(text);
    setResult(next);
    if (next.kind !== "invalid") setInput(next.code);
    requestAnimationFrame(() => heading.current?.focus());
  }

  const vehicleBox = (code: string, found: boolean) => <section className="obd-vehicle" aria-labelledby="obd-vehicle-heading">
    <h3 id="obd-vehicle-heading">Want a more specific answer? Add your vehicle.</h3>
    <p>Generic OBD-II codes can have manufacturer-specific test procedures, and some causes are much more common on certain engines. Year, make, model, and engine are all optional. {found ? "This answer stays generic until vehicle-specific data is added in a later version." : "Vehicle-specific lookups are planned for a later version."}</p>
    <div className="obd-vehicle-fields">{vehicleFields.map(f => <label key={f.key}><span>{f.label} <small>(optional)</small></span><input value={vehicle[f.key]} inputMode={f.inputMode} maxLength={40} placeholder={f.placeholder} onChange={e => setVehicle({ ...vehicle, [f.key]: e.target.value })} /></label>)}</div>
    {found && <p className="obd-generic-tag"><strong>Generic result.</strong> {vehicleName ? `This explains ${code} in general. It isn’t specific to your ${vehicleName}.` : `This explains ${code} in general, not for a specific vehicle.`}</p>}
  </section>;

  return <div className="obd-tool">
    <form className="obd-form" role="search" onSubmit={e => { e.preventDefault(); run(input); }}>
      <label htmlFor="obd-code">Trouble code</label>
      <div className="obd-input-row">
        <input id="obd-code" value={input} onChange={e => setInput(e.target.value)} placeholder="e.g. P0300" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={12} aria-describedby="obd-code-hint" />
        <button type="submit" className="ink-button">Look Up Code</button>
      </div>
      <p className="obd-examples" id="obd-code-hint"><span>Examples:</span>{EXAMPLES.map(code => <button key={code} type="button" onClick={() => run(code)}>{code}</button>)}</p>
    </form>

    {!result && <section className="obd-empty" aria-label="How to use this lookup">
      <ol>
        <li><span><strong>Find the code from your scanner.</strong> It starts with a letter, like P0300.</span></li>
        <li><span><strong>Enter it above</strong> and choose Look Up Code, or press Enter.</span></li>
        <li><span><strong>Read what to check first</strong> before you replace any parts.</span></li>
      </ol>
      <p className="small-note">Starts with common generic engine and transmission codes (P0xxx). Manufacturer-specific codes aren’t included yet.</p>
    </section>}

    {result?.kind === "invalid" && <section className="obd-message" aria-live="polite">
      <h2 ref={heading} tabIndex={-1}>{result.input ? `“${result.input}” doesn’t look like an OBD-II code` : "Enter a code first"}</h2>
      <p>Try a code like <button type="button" className="text-link" onClick={() => run("P0300")}>P0300</button> or <button type="button" className="text-link" onClick={() => run("P0420")}>P0420</button>. Codes are one letter (P, B, C, or U) followed by four characters.</p>
    </section>}

    {result?.kind === "unknown" && <section className="obd-message" aria-live="polite">
      <p className="eyebrow">{result.code} / {result.system}</p>
      <h2 ref={heading} tabIndex={-1}>We don’t have this code in the local lookup yet.</h2>
      {result.fixedLetterO && <p className="obd-fixed">Read as {result.code}, with a zero instead of the letter O.</p>}
      <p>{familyText[result.family]} {result.code[0] !== "P" && "This first version only covers powertrain (P) codes."}</p>
      <p>Manufacturer-specific codes may need the vehicle’s year, make, model, and engine to look up correctly. Check the service information for your vehicle, or ask a repair shop with manufacturer-level scan tools.</p>
      {vehicleBox(result.code, false)}
    </section>}

    {result?.kind === "found" && <article className="obd-result" aria-live="polite">
      <header className="obd-result-head">
        <p className="eyebrow">{result.info.system}</p>
        <h2 ref={heading} tabIndex={-1}><span className="obd-code">{result.code}</span>{result.info.title}</h2>
        {result.fixedLetterO && <p className="obd-fixed">Read as {result.code}, with a zero instead of the letter O.</p>}
      </header>
      <section><h3>Plain-English meaning</h3><p>{result.info.meaning}</p></section>
      {vehicleBox(result.code, true)}
      <section><h3>What you may notice</h3><p className="obd-sub">Some vehicles show a few of these. Many show nothing but the check-engine light.</p><ul>{result.info.symptoms.map(s => <li key={s}>{s}</li>)}</ul></section>
      <section className="obd-check"><h3>Check first</h3><ol>{result.info.checkFirst.map(s => <li key={s}>{s}</li>)}</ol></section>
      <section className="obd-assume"><h3>Possible causes — and what not to assume</h3>
        <p className="obd-sub">A trouble code identifies a condition the computer detected. It doesn’t prove which component failed.</p>
        <ul>{result.info.causes.map(s => <li key={s}>{s}</li>)}</ul>
        <p className="obd-dont"><strong>Don’t replace right away:</strong> {result.info.dontReplace}</p>
      </section>
      <section><h3>Good next diagnostic {result.info.nextSteps.length === 1 ? "step" : "steps"}</h3><ul>{result.info.nextSteps.map(s => <li key={s}>{s}</li>)}</ul></section>
      <section className="obd-drive" data-urgency={result.info.urgency}><h3>Driving concern</h3>
        <p><strong>{urgencyText[result.info.urgency]}</strong>{result.info.urgencyNote && ` ${result.info.urgencyNote}`}</p>
        <p>{STOP_DRIVING} The code alone can’t tell you whether the vehicle is safe to drive.</p>
      </section>
    </article>}
  </div>;
}
