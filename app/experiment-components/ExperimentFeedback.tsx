import Link from "next/link";
import ContactAction from "./ContactAction";
import ShareAction from "./ShareAction";
import { contactPageHref } from "../data/contact";

/**
 * "What happened?" at the bottom of each browser tool: three ways to email the maker about it (worked,
 * problem, idea), each with the tool's name in the subject and message, plus Share. No counts, nothing stored.
 */
export default function ExperimentFeedback({ title }: { title: string }) {
  return <section className="experiment-feedback" aria-labelledby="experiment-feedback-heading">
    <h2 id="experiment-feedback-heading">What happened?</h2>
    <div className="interact-actions">
      <ContactAction source="experiment" title={title} reason="worked" />
      <ContactAction source="experiment" title={title} reason="problem" />
      <ContactAction source="experiment" title={title} reason="suggestion" />
      <ShareAction title={title} label="Share experiment" />
    </div>
    <p className="interact-note">Opens your email app. Nothing is posted publicly. No email app? <Link href={contactPageHref("experiment", title)}>Write it on the contact page</Link>.</p>
  </section>;
}
