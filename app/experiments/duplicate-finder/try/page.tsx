import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "../../../experiment-components/Shell";
import BrowserDesktop from "../../../experiment-components/BrowserDesktop";
import { categories, experiments } from "../../../data/experiments";
import DuplicateWorkbench from "./DuplicateWorkbench";
import "./duplicate-finder.css";

export const metadata = { title: "Duplicate Finder", description: "Find identical files in a folder you choose, locally in your browser. Your files stay on your device." };

// The tool lives under /try so /experiments/duplicate-finder stays the shared detail page with feedback.
export default function DuplicateFinderPage() {
  const experiment = experiments.find(e => e.slug === "duplicate-finder");
  if (!experiment) notFound();
  return <Shell><div className="wrap page-space duplicate-finder">
    <div className="detail-links dupe-back"><Link href="/experiments" className="text-link">← All experiments</Link><Link href={`/experiments/${experiment.slug}`} className="text-link">About this experiment</Link></div>
    <div className="experiment-heading">
      <p className="eyebrow">{categories.find(c => c.id === experiment.category)?.name} / <span className="status-tag">Browser Experiment</span></p>
      <div className="dupe-title-row">{experiment.logo && <Image src={experiment.logo.src} alt={experiment.logo.alt} width={96} height={96} className="dupe-logo" />}<h1 className="page-title">{experiment.title}</h1></div>
      <p className="page-intro">Same file. Too many places.<br />Find identical files, choose the copy to keep, and take away a cleanup list.</p>
      <p className="dupe-privacy">Your files stay on your device. Duplicate scanning happens in your browser.</p>
    </div>
    <DuplicateWorkbench />
    <BrowserDesktop experiment={experiment} />
    <p className="dupe-feedback"><Link className="text-link" href={`/experiments/${experiment.slug}#feedback`}>Tell me how it went ↗</Link></p>
  </div></Shell>;
}
