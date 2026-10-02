import Link from "next/link";
import ContactAction from "../experiment-components/ContactAction";
import ShareAction from "../experiment-components/ShareAction";
import { CONTACT_EMAIL, contactPageHref } from "../data/contact";

// The note at the bottom of every Workbench article: readers share their experience privately by email,
// through the site's shared contact actions (app/data/contact.ts). Nothing is posted or stored on this site.

export default function ReaderFeedback({ title }: { title: string }) {
  return <section className="wb-feedback" aria-labelledby="wb-feedback-heading">
    <div className="wb-feedback-copy">
      <h2 id="wb-feedback-heading">Got experience with this too?</h2>
      <p>Ran into the same problem, found a better fix, or have something useful to add?</p>
    </div>
    <div className="wb-feedback-actions">
      <ContactAction className="ink-button wb-feedback-button" source="workbench" title={title} reason="experience" />
      <div className="interact-actions">
        <ContactAction source="workbench" title={title} reason="better-way" />
        <ContactAction source="workbench" title={title} reason="correction" />
        <ShareAction title={title} label="Share note" />
      </div>
    </div>
    <p className="wb-feedback-note interact-note">Opens your email app, addressed to {CONTACT_EMAIL}. Nothing is posted publicly. No email app? <Link href={contactPageHref("workbench", title)}>Write it on the contact page</Link>.</p>
  </section>;
}
