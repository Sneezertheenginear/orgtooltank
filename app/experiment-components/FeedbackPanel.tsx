// Feedback goes to the maker by email. Nothing is stored on this site.
const EMAIL = "orgtooltank@gmail.com";

export default function FeedbackPanel({ title }: { title: string }) {
  const body = "What worked?\n\n\nWhat didn’t?\n\n\nWhat should it do next?\n\n";
  const href = `mailto:${EMAIL}?subject=${encodeURIComponent(`Feedback: ${title}`)}&body=${encodeURIComponent(body)}`;
  return <section id="feedback" className="feedback-panel"><p className="eyebrow">Leave a note on the workbench</p><h2>What do you think?</h2>
    <p>Tell me what worked, what didn’t, and what it should do next. Your email app opens with a short note ready to fill in.</p>
    <p className="feedback-action"><a className="ink-button" href={href}>Email feedback to the maker ↗</a></p>
    <p className="small-note">Sends to {EMAIL}. Nothing is posted publicly.</p>
  </section>;
}
