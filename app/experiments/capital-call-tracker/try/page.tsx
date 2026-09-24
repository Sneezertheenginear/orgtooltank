import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "../../../experiment-components/Shell";
import BrowserDesktop from "../../../experiment-components/BrowserDesktop";
import { categories, experiments } from "../../../data/experiments";
import CapitalCallWorkbench from "./CapitalCallWorkbench";
import "./capital-call-tracker.css";

export const metadata = { title: "Capital Call Tracker", description: "Track the capital calls you enter, see what’s overdue or due in the next 30 days, and mark calls paid. Saved only in your browser." };

const DISCLAIMER = "This is a tracking tool, not financial, legal, or tax advice. It does not verify amounts against fund documents.";

// The tool lives under /try so /experiments/capital-call-tracker stays the shared detail page with feedback.
export default function CapitalCallTrackerPage() {
  const experiment = experiments.find(e => e.slug === "capital-call-tracker");
  if (!experiment) notFound();
  return <Shell><div className="wrap page-space cc-page">
    <div className="detail-links cc-back"><Link href="/experiments" className="text-link">← All experiments</Link><Link href={`/experiments/${experiment.slug}`} className="text-link">About this experiment</Link></div>
    <div className="experiment-heading">
      <p className="eyebrow">{categories.find(c => c.id === experiment.category)?.name} / <span className="status-tag">Browser Experiment</span></p>
      <div className="cc-title-row">{experiment.logo && <Image src={experiment.logo.src} alt={experiment.logo.alt} width={96} height={96} className="cc-logo" />}<h1 className="page-title">{experiment.title}</h1></div>
      <p className="page-intro">Which capital calls are due, and how much is still outstanding?<br />Track the call notices you enter, most urgent first.</p>
      <p className="cc-disclaimer">{DISCLAIMER}</p>
    </div>
    <CapitalCallWorkbench />
    <BrowserDesktop experiment={experiment} />
    <p className="cc-feedback"><Link className="text-link" href={`/experiments/${experiment.slug}#feedback`}>Tell me how it went ↗</Link></p>
  </div></Shell>;
}
