import { CONTACT_EMAIL, contactHref } from "../data/contact";

// Feedback goes to the maker by email, through the site's shared contact helper (subject
// "Experiment — Feedback — <name>"). Nothing is stored on this site.

export default function FeedbackPanel({ title }: { title: string }) {
  const body = "What worked?\n\n\nWhat didn’t?\n\n\nWhat should it do next?\n\n";
  const href = contactHref({ source: "experiment", title, reason: "feedback", starter: body });
  return <section id="feedback" className="feedback-panel"><p className="eyebrow">Leave a note on the workbench</p><h2>What do you think?</h2>
    <p>Tell me what worked, what didn’t, and what it should do next. Your email app opens with a short note ready to fill in.</p>
    <p className="feedback-action"><a className="ink-button" href={href}>Email feedback to the maker ↗</a></p>
    <p className="small-note">Sends to {CONTACT_EMAIL}. Nothing is posted publicly.</p>
  </section>;
}
