"use client";

import { useState } from "react";
import { answerLabels, answeredCount, briefFileName, briefText, emptyIdea, exampleAnswers, exampleIdea, fields, focusResult, GUIDANCE_NOTE, hasContent, questions, results, type Answer, type Idea } from "../engine";
import { NextStep, QuickStart } from "../../../experiment-components/Guidance";

// Everything lives only in this page's memory. Nothing is saved to the browser or sent anywhere,
// so reloading or leaving the page clears it. Copy or download the brief to keep it.
const options = (Object.keys(answerLabels) as Answer[]).map(value => ({ value, label: answerLabels[value] }));
const localDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

export default function IdeaFocus() {
  const [idea, setIdea] = useState<Idea>(emptyIdea);
  const [answers, setAnswers] = useState<Record<string, Answer | undefined>>({});
  const [message, setMessage] = useState("");
  const answered = answeredCount(answers), result = focusResult(answers), started = hasContent(idea) || answered > 0;
  const brief = briefText(idea, answers, localDate());

  const setField = (id: keyof Idea, value: string) => { setIdea(current => ({ ...current, [id]: value })); setMessage(""); };
  const setAnswer = (id: string, value: Answer) => { setAnswers(current => ({ ...current, [id]: value })); setMessage(""); };
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  function loadExample() {
    setIdea(exampleIdea()); setAnswers(exampleAnswers());
    setMessage("Example loaded: a fictional dog-walking idea. Change any answer to see how the result and brief update.");
  }
  function startOver() {
    setIdea(emptyIdea()); setAnswers({});
    setMessage("Cleared. Nothing was saved or sent anywhere.");
    scrollTo("ar-idea-heading");
  }
  async function copyBrief() {
    try { await navigator.clipboard.writeText(brief); setMessage("Brief copied. Paste it into a note, email, or document."); }
    catch { setMessage("Couldn’t copy in this browser. Use Download .txt instead, or select the brief text and copy it."); }
  }
  function downloadBrief() {
    const url = URL.createObjectURL(new Blob([brief], { type: "text/plain;charset=utf-8" })), anchor = document.createElement("a");
    anchor.href = url; anchor.download = briefFileName(idea, localDate()); document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Brief downloaded as a .txt file.");
  }

  return <div className="ar-workbench">
    <p className="ar-privacy">Your answers stay on this page only. Nothing is saved or sent anywhere, and reloading the page clears them. Copy or download the brief to keep it.</p>
    {message && <p className="ar-message" role="status">{message}</p>}
    <QuickStart>Describe your app idea in the five boxes, then answer the five focus questions. You’ll get a plain result and a one-page brief to copy or download. Want to see it filled in first? <button type="button" className="text-link" onClick={loadExample}>Load the example idea</button>.</QuickStart>

    <section className="ar-panel" aria-labelledby="ar-idea-heading">
      <p className="eyebrow">01 / Your idea</p>
      <h2 id="ar-idea-heading">Describe the idea</h2>
      <div className="ar-fields">{fields.map(f => <div key={f.id} className="ar-field">
        <label htmlFor={`ar-${f.id}`}>{f.label}</label>
        <p className="field-hint" id={`ar-hint-${f.id}`}>{f.hint}</p>
        <textarea id={`ar-${f.id}`} rows={f.rows} maxLength={600} value={idea[f.id]} placeholder={f.placeholder} aria-describedby={`ar-hint-${f.id}`} onChange={event => setField(f.id, event.target.value)} />
      </div>)}</div>
      {hasContent(idea) && answered === 0 && <NextStep>Answer the focus test below.</NextStep>}
    </section>

    <section className="ar-panel" aria-labelledby="ar-test-heading">
      <p className="eyebrow">02 / Focus test</p>
      <h2 id="ar-test-heading">Is the first version small enough?</h2>
      <p className="ar-progress" aria-live="polite">{answered} of {questions.length} answered</p>
      <ol className="ar-questions">{questions.map((q, index) => <li key={q.id} className="ar-question" data-answered={answers[q.id] ? "" : undefined}>
        <fieldset>
          <legend><span className="ar-number">{String(index + 1).padStart(2, "0")}</span>{q.text}</legend>
          <p className="field-hint ar-hint">{q.hint}</p>
          <div className="ar-options">{options.map(o => <label key={o.value} className="ar-option"><input type="radio" name={q.id} value={o.value} checked={answers[q.id] === o.value} onChange={() => setAnswer(q.id, o.value)} />{o.label}</label>)}</div>
        </fieldset>
      </li>)}</ol>
    </section>

    <section className="ar-panel ar-result" aria-labelledby="ar-result-heading" data-result={result ?? "pending"}>
      <p className="eyebrow">03 / Result and brief</p>
      <h2 id="ar-result-heading">{result ? results[result].title : "Answer all five questions"}</h2>
      <p className="ar-lede">{result ? results[result].text : `The result appears here once every question has an answer. ${answered ? `${questions.length - answered} to go.` : ""}`}</p>
      <p className="ar-guidance">{GUIDANCE_NOTE}</p>

      <h3 className="ar-brief-title">Your one-page brief</h3>
      <pre className="ar-brief" tabIndex={0} aria-label="Brief text">{brief}</pre>
      <div className="ar-actions">
        <button type="button" className="ink-button" disabled={!started} onClick={copyBrief}>Copy Brief</button>
        <button type="button" className="ink-button is-secondary" disabled={!started} onClick={downloadBrief}>Download .txt ↓</button>
        {started && <button type="button" className="ink-button is-secondary" onClick={startOver}>Start Over</button>}
      </div>
      {result && <NextStep>Copy or download the brief and share it with someone who has the problem. Their reaction is the next thing to learn.</NextStep>}
    </section>
  </div>;
}
