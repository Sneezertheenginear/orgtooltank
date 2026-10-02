import type { ReactNode } from "react";
import { contactHref, reasonsFor, type ContactRequest } from "../data/contact";

/**
 * One contact action, e.g. "Found something wrong?". Opens the visitor's email app addressed to the maker,
 * with the subject ("Workbench — Correction — <title>") and an editable starter message filled in
 * (see app/data/contact.ts). The label defaults to the action's standard wording.
 */
export default function ContactAction({ className = "contact-action", arrow = false, children, ...request }: ContactRequest & { className?: string; arrow?: boolean; children?: ReactNode }) {
  const label = children ?? reasonsFor(request.source).find(r => r.id === request.reason)?.action;
  return <a className={className} href={contactHref(request)}>{label}{arrow && " →"}</a>;
}
