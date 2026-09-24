import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "../../../experiment-components/Shell";
import BrowserDesktop from "../../../experiment-components/BrowserDesktop";
import { categories, experiments } from "../../../data/experiments";
import ComplianceWorkbench from "./ComplianceWorkbench";
import "./compliance-watch.css";

export const metadata = { title: "Compliance Watch", description: "Track the licenses, permits, insurance, inspections, and renewals you enter, and see what’s overdue or due soon. Saved only in your browser." };

const DISCLAIMER = "Compliance Watch is an organization tool, not legal advice. It tracks the requirements and dates you enter; it does not determine which laws or regulations apply to your organization. Confirm official requirements with the relevant agency or qualified professional.";

// The tool lives under /try so /experiments/compliance-watch stays the shared detail page with feedback.
export default function ComplianceWatchPage() {
  const experiment = experiments.find(e => e.slug === "compliance-watch");
  if (!experiment) notFound();
  return <Shell><div className="wrap page-space cw-page">
    <div className="detail-links cw-back"><Link href="/experiments" className="text-link">← All experiments</Link><Link href={`/experiments/${experiment.slug}`} className="text-link">About this experiment</Link></div>
    <div className="experiment-heading">
      <p className="eyebrow">{categories.find(c => c.id === experiment.category)?.name} / <span className="status-tag">Browser Experiment</span></p>
      <div className="cw-title-row">{experiment.logo && <Image src={experiment.logo.src} alt={experiment.logo.alt} width={96} height={96} className="cw-logo" />}<h1 className="page-title">{experiment.title}</h1></div>
      <p className="page-intro">What’s due next, and what needs attention?<br />Track the requirements and renewal dates you enter, most urgent first.</p>
      <p className="cw-disclaimer">{DISCLAIMER}</p>
    </div>
    <ComplianceWorkbench />
    <BrowserDesktop experiment={experiment} />
    <p className="cw-feedback"><Link className="text-link" href={`/experiments/${experiment.slug}#feedback`}>Tell me how it went ↗</Link></p>
  </div></Shell>;
}
