import type { Metadata } from "next";
import Link from "next/link";
import AutoPage, { TopicCards } from "../AutoPage";

export const metadata: Metadata = { title: "About", description: "OrgToolTank is building practical automotive explanations for everyday car owners." };

export default function AboutPage() {
  return <AutoPage eyebrow="About OrgToolTank" title="Car knowledge for everyday people." intro="OrgToolTank is building a practical place to understand cars and approach repair questions with more confidence. You should not need to be a mechanic to follow an explanation.">
    <section><h2 className="mb-8 text-3xl font-bold">Our approach</h2><TopicCards items={[
      { title: "Explain the purpose", text: "Start with what a system does and why it matters, using familiar words and clear explanations." },
      { title: "Make it specific", text: "Organize future repair content around the right make, model, year, and engine so the context is clear." },
      { title: "Understand the evidence", text: "Explain what an observation or test can tell you before moving toward a repair decision." },
    ]} /></section>
    <section className="grid gap-8 border-t border-neutral-200 pt-12 md:grid-cols-2"><h2 className="text-3xl font-bold">A foundation for what comes next.</h2><div className="space-y-5 text-lg leading-8 text-neutral-600"><p>The automotive library is at its starting point. The first planned vehicle is the 2007 Mazda 3 with a 2.3L engine. Detailed repair guides have not been published yet.</p><p>Have a question about OrgToolTank or an existing purchase? Our support and legal information remain available.</p><Link href="/contact" className="inline-block font-bold text-neutral-900 underline underline-offset-4">Contact OrgToolTank</Link><p className="text-base">Existing software customer? <Link href="/tools/duplicate-finder" className="underline underline-offset-4">Visit the Duplicate Finder product page</Link>.</p></div></section>
  </AutoPage>;
}
