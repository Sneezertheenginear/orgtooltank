"use client";

import { useState } from "react";
import { BODY_TYPES, BUILDS, FIT_PREFERENCES, HEIGHT_OPTIONS, MEASUREMENTS, TONES, WEIGHT, formatHeight, type FitProfile, type MeasurementKey } from "./fit";

// Choose your mannequin: tone, build, height, weight, and fit preference up front; body measurements
// tucked away as optional. Nothing is required, so shopping can start right away, and every change
// reshapes the mannequin without touching the outfit. The profile only lives in page state.

export default function MannequinPanel({ profile, onChange }: { profile: FitProfile; onChange: (change: Partial<FitProfile>) => void }) {
  const measured = MEASUREMENTS.filter(m => profile.measurements[m.id]).length;
  const setMeasurement = (key: MeasurementKey, value: number | null) => {
    const next = { ...profile.measurements };
    if (value === null) delete next[key]; else next[key] = value;
    onChange({ measurements: next });
  };
  const status = measured
    ? `Size suggestions use your ${measured === 1 ? "measurement" : "measurements"} first, then each product’s size chart.`
    : profile.height && profile.weight
      ? "Size suggestions are estimates from your height and weight. Measurements make them better."
      : "Add your height and weight, or measurements, to see size suggestions. You can start dressing the mannequin now.";

  return <section className="ob-panel ob-profile" aria-labelledby="ob-profile-heading">
    <div className="ob-area-head">
      <h2 id="ob-profile-heading" className="ob-step">Choose your mannequin</h2>
      <p className="ob-profile-private">Optional. Stays on this page; nothing is saved or sent.</p>
    </div>

    <div className="ob-profile-grid">
      <fieldset className="ob-field">
        <legend>Mannequin tone</legend>
        <div className="ob-seg ob-tones">{TONES.map(t => <button key={t.id} type="button" aria-pressed={profile.tone === t.id} onClick={() => onChange({ tone: t.id })}>
          <span className="ob-tone-dot" style={{ background: t.fill, borderColor: t.edge }} aria-hidden="true" />{t.name}
        </button>)}</div>
        <p className="ob-field-hint">Changes the look only, never the size suggestions.</p>
      </fieldset>

      <fieldset className="ob-field">
        <legend>Mannequin type</legend>
        <div className="ob-seg is-two">{BODY_TYPES.map(b => <button key={b.id} type="button" aria-pressed={profile.bodyType === b.id} onClick={() => onChange({ bodyType: b.id })}>{b.name}</button>)}</div>
      </fieldset>

      <fieldset className="ob-field">
        <legend>Body build</legend>
        <div className="ob-seg">{BUILDS.map(b => <button key={b.id} type="button" aria-pressed={profile.build === b.id} onClick={() => onChange({ build: b.id })}>{b.name}</button>)}</div>
      </fieldset>

      <div className="ob-field-pair">
        <label className="ob-field">
          <span className="ob-field-name">Height</span>
          <select value={profile.height ?? ""} onChange={e => onChange({ height: e.target.value ? Number(e.target.value) : null })}>
            <option value="">Choose height</option>
            {HEIGHT_OPTIONS.map(h => <option key={h} value={h}>{formatHeight(h)}</option>)}
          </select>
        </label>
        <NumberField name="Weight" unit="lb" min={WEIGHT.min} max={WEIGHT.max} step={1} placeholder="e.g. 170" value={profile.weight} onChange={weight => onChange({ weight })} />
      </div>

      <fieldset className="ob-field">
        <legend>How do you like your clothes to fit?</legend>
        <div className="ob-seg">{FIT_PREFERENCES.map(f => <button key={f.id} type="button" aria-pressed={profile.fitPreference === f.id} onClick={() => onChange({ fitPreference: f.id })}>{f.name}</button>)}</div>
      </fieldset>
    </div>

    <details className="ob-measure">
      <summary>Add measurements for a better fit{measured > 0 && <span className="ob-measure-count"> · {measured} added</span>}</summary>
      <p className="ob-field-hint">All optional. Measure your body, not a garment, in inches. Measurements count before height and weight when suggesting sizes.</p>
      <div className="ob-measure-grid">{MEASUREMENTS.map(m => <NumberField key={m.id} name={m.name} hint={m.hint} unit="in" min={m.min} max={m.max} step={0.5} value={profile.measurements[m.id] ?? null} onChange={v => setMeasurement(m.id, v)} />)}</div>
    </details>

    <p className="ob-profile-status" aria-live="polite">{status}</p>
  </section>;
}

/** A number box that accepts partial typing and only passes on values inside its range (or null when emptied). */
function NumberField({ name, hint, unit, min, max, step, placeholder, value, onChange }: {
  name: string; hint?: string; unit: string; min: number; max: number; step: number; placeholder?: string; value: number | null; onChange: (value: number | null) => void;
}) {
  const [text, setText] = useState(value === null ? "" : String(value));
  const n = Number(text), invalid = text.trim() !== "" && !(Number.isFinite(n) && n >= min && n <= max);
  return <label className="ob-field">
    <span className="ob-field-name">{name}</span>
    <span className="ob-input-unit">
      <input type="number" inputMode="decimal" min={min} max={max} step={step} placeholder={placeholder} value={text} aria-invalid={invalid || undefined}
        onChange={e => {
          const t = e.target.value, v = Number(t);
          setText(t);
          // Half-typed or out-of-range numbers keep the last good value (and show a hint); empty clears it.
          if (t.trim() === "") onChange(null);
          else if (Number.isFinite(v) && v >= min && v <= max) onChange(v);
        }} />
      <span>{unit}</span>
    </span>
    {invalid ? <span className="ob-field-error">Use {min}–{max} {unit}.</span> : hint && <span className="ob-field-hint">{hint}</span>}
  </label>;
}
