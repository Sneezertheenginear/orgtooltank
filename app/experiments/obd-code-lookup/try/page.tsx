import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "../../../experiment-components/Shell";
import BrowserDesktop from "../../../experiment-components/BrowserDesktop";
import { categories, experiments } from "../../../data/experiments";
import { CODE_NOTE } from "../engine";
import CodeLookup from "./CodeLookup";
import "./obd-code-lookup.css";

export const metadata = { title: "OBD Code Lookup", description: "Enter an OBD-II trouble code like P0300, P0420, or P0123 to see what it means and what to check next. Works in your browser; nothing is saved or sent." };

// The tool lives under /try so /experiments/obd-code-lookup stays the shared detail page with feedback.
export default function ObdCodeLookupPage() {
  const experiment = experiments.find(e => e.slug === "obd-code-lookup");
  if (!experiment) notFound();
  return <Shell><div className="wrap page-space obd-page">
    <div className="detail-links obd-back"><Link href="/experiments" className="text-link">← All experiments</Link><Link href={`/experiments/${experiment.slug}`} className="text-link">About this experiment</Link></div>
    <div className="experiment-heading">
      <p className="eyebrow">{categories.find(c => c.id === experiment.category)?.name} / <span className="status-tag">Browser Experiment</span></p>
      <div className="obd-title-row">{experiment.logo && <Image src={experiment.logo.src} alt={experiment.logo.alt} width={96} height={96} className="obd-logo" />}<h1 className="page-title">{experiment.title}</h1></div>
      <p className="page-intro">Enter a trouble code like P0300, P0420, or P0123 to see what it means and what to check next.</p>
      <p className="obd-note">{CODE_NOTE}</p>
    </div>
    <CodeLookup />
    <BrowserDesktop experiment={experiment} />
    <p className="obd-feedback"><Link className="text-link" href={`/experiments/${experiment.slug}#feedback`}>Tell me how it went ↗</Link></p>
  </div></Shell>;
}
