import type { ReactNode } from "react";
import { contactHref, reasonsFor, type ContactRequest } from "../data/contact";
import GmailHint from "./GmailHint";

/**
 * One contact action, e.g. "Found something wrong?". Opens the visitor's email app addressed to the maker,
 * with the subject ("Workbench — Correction — <title>") and an editable starter message filled in
 * (see app/data/contact.ts). The label defaults to the action's standard wording. `hint` adds the Gmail label
 * note (GmailHint) under it, for an action that stands alone; a group of actions shows one note for the group.
 */
export default function ContactAction({ className = "contact-action", arrow = false, hint = false, children, ...request }: ContactRequest & { className?: string; arrow?: boolean; hint?: boolean; children?: ReactNode }) {
  const label = children ?? reasonsFor(request.source).find(r => r.id === request.reason)?.action;
  const link = <a className={className} href={contactHref(request)}>{label}{arrow && " →"}</a>;
  return hint ? <span className="contact-action-wrap">{link}<GmailHint source={request.source} /></span> : link;
}
