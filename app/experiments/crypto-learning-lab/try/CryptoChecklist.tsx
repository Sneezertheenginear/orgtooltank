"use client";

import { useState } from "react";
import { answeredCount, findings, glossary, questions, verdict, type Answer } from "../engine";
import { NextStep, QuickStart } from "../../../experiment-components/Guidance";

// Answers live only in this page's memory. Nothing is saved to the browser or sent anywhere,
// so reloading or leaving the page clears them.
const options: { value: Answer; label: string }[] = [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "unsure", label: "Not sure" }];
const termName = (id: string) => glossary.find(g => g.id === id)?.term ?? id;

const headings = {
  "not-started": { title: "Nothing checked yet", text: "Answer the questions above. Any warning signs appear here as you go." },
  "in-progress": { title: "No warning signs so far", text: "Keep going. Answer the rest of the questions to finish the check." },
  stop: { title: "Stop: serious warning signs", text: "At least one answer matches a common scam or a way people lose crypto for good. Don’t send, buy, or approve anything until you’ve dealt with it." },
  caution: { title: "Warning signs found", text: "Slow down and deal with each one below before you go ahead." },
  check: { title: "Some answers need checking", text: "You weren’t sure about some questions. Find out before you go ahead." },
  "none-found": { title: "No warning signs found in these questions", text: "That doesn’t mean it’s safe or legitimate. This checklist can’t check any coin, site, wallet, or person. It only looks for common warning signs." },
} as const;

export default function CryptoChecklist() {
  const [answers, setAnswers] = useState<Record<string, Answer | undefined>>({});
  const [message, setMessage] = useState("");
  const answered = answeredCount(answers), found = findings(answers), state = verdict(answers);
  const set = (id: string, value: Answer) => { setAnswers(current => ({ ...current, [id]: value })); setMessage(""); };
  function startOver() {
    setAnswers({});
    setMessage("Cleared. Your answers were never saved or sent anywhere.");
    document.getElementById("cl-questions-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return <div className="cl-workbench">
    <p className="cl-privacy">Your answers stay on this page only. Nothing is saved or sent anywhere, and reloading the page clears them.</p>
    {message && <p className="cl-message" role="status">{message}</p>}
    <QuickStart>Answer each question about what you’re about to do. Choose Not sure if you don’t know. Warning signs show up underneath, with what to do next.</QuickStart>

    <section className="cl-panel" aria-labelledby="cl-questions-heading">
      <p className="eyebrow">01 / Before you send, buy, or connect</p>
      <h2 id="cl-questions-heading">Answer the questions</h2>
      <p className="cl-progress" aria-live="polite">{answered} of {questions.length} answered</p>
      <ol className="cl-questions">{questions.map((q, index) => {
        const answer = answers[q.id], flagged = answer === q.warnWhen ? "warning" : answer === "unsure" ? "check" : answer ? "ok" : "";
        return <li key={q.id} className="cl-question" data-flag={flagged}>
          <fieldset>
            <legend><span className="cl-number">{String(index + 1).padStart(2, "0")}</span>{q.text}</legend>
            {q.hint && <p className="field-hint cl-hint">{q.hint}</p>}
            {q.terms.length > 0 && <p className="cl-terms">Words: {q.terms.map((t, i) => <span key={t}>{i > 0 && ", "}<a className="text-link" href={`#term-${t}`}>{termName(t)}</a></span>)}</p>}
            <div className="cl-options">{options.map(o => <label key={o.value} className="cl-option"><input type="radio" name={q.id} value={o.value} checked={answer === o.value} onChange={() => set(q.id, o.value)} />{o.label}</label>)}</div>
          </fieldset>
        </li>;
      })}</ol>
    </section>

    <section className="cl-panel cl-results" aria-labelledby="cl-results-heading" data-state={state}>
      <p className="eyebrow">02 / What this checklist noticed</p>
      <h2 id="cl-results-heading">{headings[state].title}</h2>
      <p className="cl-lede">{headings[state].text}</p>
      {found.length > 0 && <ol className="cl-findings">{found.map(({ question, kind }) => <li key={question.id} className="cl-finding" data-kind={kind === "check" ? "check" : question.severity}>
        <p className="cl-badge">{kind === "check" ? "Check this first" : question.severity === "stop" ? "Stop" : "Warning"}</p>
        <h3>{kind === "check" ? `Not sure: ${question.text}` : question.warning.title}</h3>
        <p><strong>Why it matters:</strong> {question.warning.why}</p>
        <p><strong>What to do:</strong> {kind === "check" ? `Find out before you go ahead. If the answer turns out to be a warning sign: ${question.warning.next}` : question.warning.next}</p>
      </li>)}</ol>}
      {state === "none-found" && <NextStep>Checking a different situation? Choose Start Over.</NextStep>}
      {(state === "stop" || state === "caution") && <NextStep>Talk it over with someone you trust before going ahead. If you think it’s a scam, stop contact and report it.</NextStep>}
      {answered > 0 && <button type="button" className="ink-button is-secondary cl-start-over" onClick={startOver}>Start Over</button>}
    </section>

    <section className="cl-panel" aria-labelledby="cl-glossary-heading">
      <p className="eyebrow">03 / Words used here</p>
      <h2 id="cl-glossary-heading">Glossary</h2>
      <dl className="cl-glossary">{glossary.map(g => <div key={g.id} id={`term-${g.id}`}><dt>{g.term}</dt><dd>{g.meaning}</dd></div>)}</dl>
    </section>
  </div>;
}
