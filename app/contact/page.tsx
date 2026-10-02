import Link from "next/link";
import Shell from "../experiment-components/Shell";
import { contactFromQuery } from "../data/contact";
import ContactDraft from "./ContactDraft";
export const metadata = { title: "Contact" };
// Arriving from a feedback or Shop action (?about=…&title=…&reason=…) adds a prefilled, editable message
// (ContactDraft). Visited directly, the page is unchanged.
export default async function ContactPage({ searchParams }: { searchParams: Promise<{ about?: string; title?: string; reason?: string }> }) {
 const draft = contactFromQuery(await searchParams);
 return <Shell><div className="wrap page-space narrow-page"><p className="eyebrow">A note, a question, a strange idea</p><h1 className="page-title">Talk to me.</h1>{draft && <ContactDraft key={`${draft.source}:${draft.title}`} initial={draft} />}<div className="prose-copy about-copy"><p>Tried an experiment? Tell me what worked, what didn’t, or what you wish it could do. Questions about existing purchases and downloads are welcome here, too.</p><a className="contact-email text-link" href="mailto:orgtooltank@gmail.com">orgtooltank@gmail.com ↗</a><h2>Want something built?</h2><p>Tell me which experiment caught your eye and what you need. We’ll work out the scope and price together.</p><Link className="ink-button" href="/request-app">Request an app ↗</Link></div></div></Shell>;
}
