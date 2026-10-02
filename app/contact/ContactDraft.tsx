"use client";
import { useState } from "react";
import { CONTACT_EMAIL, contactMessage, mailtoHref, reasonsFor, type ContactRequest } from "../data/contact";

/**
 * The Contact page's prefilled message, when a visitor arrives from a feedback or Shop action (for example
 * without an email app set up). Subject and message are filled in and fully editable; nothing is sent from
 * this site: "Open in my email app" hands it to their own email, and "Copy message" copies it to paste anywhere.
 */
export default function ContactDraft({ initial }: { initial: ContactRequest }) {
  const reasons = reasonsFor(initial.source).filter(r => r.choice);
  const [reason, setReason] = useState<string>(initial.reason);
  const start = (r: string) => contactMessage({ ...initial, reason: r } as ContactRequest);
  const [subject, setSubject] = useState(start(initial.reason).subject);
  const [body, setBody] = useState(start(initial.reason).body);
  const [copied, setCopied] = useState<string | null>(null);

  function pick(r: string) {
    // Switching what it's about swaps in that subject and starter message.
    setReason(r); const m = start(r); setSubject(m.subject); setBody(m.body); setCopied(null);
  }
  async function copy() {
    try { await navigator.clipboard.writeText(`To: ${CONTACT_EMAIL}\nSubject: ${subject}\n\n${body}`); setCopied("Copied. Paste it into any email to " + CONTACT_EMAIL + "."); }
    catch { setCopied("Copying isn’t allowed here. Select the text above and copy it."); }
  }

  return <section className="request-draft contact-draft" aria-labelledby="contact-draft-heading">
    <h2 id="contact-draft-heading">You’re writing about</h2>
    <p className="contact-draft-about">{start(reason).about}</p>
    {reasons.length > 1 && <fieldset className="contact-draft-reasons">
      <legend>What it’s about</legend>
      <div className="radio-row">{reasons.map(r => <label key={r.id}><input type="radio" name="contact-reason" value={r.id} checked={reason === r.id} onChange={() => pick(r.id)} />{r.action}</label>)}</div>
    </fieldset>}
    <label htmlFor="contact-subject">Subject</label>
    <input id="contact-subject" className="contact-draft-subject" value={subject} onChange={e => setSubject(e.target.value)} maxLength={200} />
    <label htmlFor="contact-body">Message</label>
    <textarea id="contact-body" value={body} onChange={e => setBody(e.target.value)} rows={9} />
    <p className="contact-draft-actions">
      <a className="ink-button" href={mailtoHref(subject, body)}>Open in my email app ↗</a>
      <button type="button" className="contact-action" onClick={copy}>Copy message</button>
    </p>
    <p className="interact-note" role="status">{copied ?? `Goes to ${CONTACT_EMAIL} from your own email. Nothing is sent or saved by this site.`}</p>
  </section>;
}
