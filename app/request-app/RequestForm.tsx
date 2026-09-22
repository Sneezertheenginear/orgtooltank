"use client";
import { useState, type FormEvent } from "react";
import { experiments } from "../data/experiments";
export default function RequestForm({ initialExperiment }: { initialExperiment: string }) {
  const [draft, setDraft] = useState<string | null>(null);
  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = Array.from(data.entries()).map(([key, value]) => `${key}:\n${value}`).join("\n\n");
    // Integration point: send to a verified email provider/server action when configured.
    // Until then, prepare a user-reviewable email; never claim server delivery.
    setDraft(body);
  }
  return <><form onSubmit={prepare} onChange={() => setDraft(null)} className="workshop-form request-form"><div className="form-pair"><label>Name<input name="Name" autoComplete="name" required maxLength={100} /></label><label>Email<input name="Email" type="email" autoComplete="email" required maxLength={254} /></label></div><label>Experiment you’re interested in<select name="Experiment" defaultValue={initialExperiment}><option value="">Another idea / not sure yet</option>{experiments.map(e => <option key={e.slug} value={e.slug}>{e.title}</option>)}</select></label><fieldset><legend>Windows / Mac / Both</legend><div className="radio-row">{["Windows", "Mac", "Both"].map(platform => <label key={platform}><input type="radio" name="Platform" value={platform} required />{platform}</label>)}</div></fieldset><label>What do you want the desktop version to do?<textarea name="What it should do" rows={5} required maxLength={4000} /></label><label>Do you want changes or extra features?<textarea name="Changes or extra features" rows={3} maxLength={3000} /></label><label>Is this for personal use or a business?<select name="Use" required defaultValue=""><option value="" disabled>Select one</option><option>Personal use</option><option>Business</option><option>Both</option></select></label><label>Anything else I should know?<textarea name="Anything else" rows={3} maxLength={3000} /></label><p className="small-note">This form prepares an email to orgtooltank@gmail.com. Review it, then send it from your email app. Nothing is submitted or stored on a server.</p><button className="ink-button" type="submit">Prepare request email ↗</button></form>{draft !== null && <section className="request-draft" role="status"><h2>Your request is ready to send.</h2><p>It hasn’t been sent yet. Open your email app to review and send it, or copy this draft and email <a href="mailto:orgtooltank@gmail.com">orgtooltank@gmail.com</a>.</p><label htmlFor="email-draft">Request draft</label><textarea id="email-draft" readOnly value={draft} rows={12} /><a className="ink-button" href={`mailto:orgtooltank@gmail.com?subject=${encodeURIComponent("Desktop / custom app request")}&body=${encodeURIComponent(draft)}`}>Open email app to send ↗</a></section>}</>;
}
