import { gmailColor, gmailLabel, type ContactSource } from "../data/contact";

/**
 * Small note under an email action saying which Gmail label the email will be sorted into: a dot in the label's
 * color, then the label name ("Workbench") in small gray text. Only for actions that open an email (not Share or Copy link).
 * Labels and colors come from CONTACT_SOURCES in app/data/contact.ts.
 */
export default function GmailHint({ source }: { source: ContactSource }) {
  return <span className="gmail-hint"><span className="gmail-dot" aria-hidden="true" style={{ background: gmailColor(source) }} />{gmailLabel(source)}</span>;
}
