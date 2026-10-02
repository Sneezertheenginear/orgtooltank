// The note at the bottom of every Workbench article: readers share their experience privately by email.
// Same method as the rest of the site (Contact, Request an App, experiment feedback): a mailto link to
// orgtooltank@gmail.com with the subject filled in. Nothing is posted or stored on this site.
const EMAIL = "orgtooltank@gmail.com";

export default function ReaderFeedback({ title }: { title: string }) {
  const subject = `Workbench feedback: ${title}`;
  const body = "What happened when you tried this?\n\n\nDid you find a better fix, or something useful to add?\n\n";
  const href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return <section className="wb-feedback" aria-labelledby="wb-feedback-heading">
    <div className="wb-feedback-copy">
      <h2 id="wb-feedback-heading">Got experience with this too?</h2>
      <p>Ran into the same problem, found a better fix, or have something useful to add?</p>
      <p className="wb-feedback-note">Opens your email app, addressed to {EMAIL}. Nothing is posted publicly.</p>
    </div>
    <a className="ink-button wb-feedback-button" href={href}>Send me your experience</a>
  </section>;
}
