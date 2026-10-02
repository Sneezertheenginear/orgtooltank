import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "../../../experiment-components/Shell";
import BrowserDesktop from "../../../experiment-components/BrowserDesktop";
import SupportNote from "../../../experiment-components/SupportNote";
import { categories, experiments } from "../../../data/experiments";
import { DISCLAIMER } from "../engine";
import CaseWorkbench from "./CaseWorkbench";
import "./workplace-case-builder.css";

export const metadata = { title: "Workplace Case Builder", description: "Organize a workplace problem into a clean case summary: basics, timeline, people, evidence, and actions already taken. Print it, save it as a PDF, or copy it." };

// The tool lives under /try so /experiments/workplace-case-builder stays the shared detail page with feedback.
export default function WorkplaceCaseBuilderPage() {
  const experiment = experiments.find(e => e.slug === "workplace-case-builder");
  if (!experiment) notFound();
  return <Shell><div className="wrap page-space wc-page">
    <div className="detail-links wc-back"><Link href="/experiments" className="text-link">← All experiments</Link><Link href={`/experiments/${experiment.slug}`} className="text-link">About this experiment</Link></div>
    <div className="experiment-heading">
      <p className="eyebrow">{categories.find(c => c.id === experiment.category)?.name} / <span className="status-tag">Browser Experiment</span></p>
      <div className="wc-title-row">{experiment.logo && <Image src={experiment.logo.src} alt={experiment.logo.alt} width={96} height={96} className="wc-logo" />}<h1 className="page-title">{experiment.title}</h1></div>
      <p className="page-intro">Something going on at work?<br />Organize it section by section into one clear summary you can print or keep.</p>
      <p className="wc-disclaimer">{DISCLAIMER}</p>
    </div>
    <CaseWorkbench />
    <BrowserDesktop experiment={experiment} />
    <p className="wc-feedback"><Link className="text-link" href={`/experiments/${experiment.slug}#feedback`}>Tell me how it went ↗</Link></p>
    <SupportNote />
  </div></Shell>;
}
