import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "../../../experiment-components/Shell";
import BrowserDesktop from "../../../experiment-components/BrowserDesktop";
import { categories, experiments } from "../../../data/experiments";
import PodWorkbench from "./PodWorkbench";
import "./pod-chaser.css";

export const metadata = { title: "POD Chaser", description: "Track delivered freight loads waiting on signed proof of delivery: what needs a follow-up, what needs review, and what’s ready to bill. Saved only in your browser." };

// The tool lives under /try so /experiments/pod-chaser stays the shared detail page with feedback.
export default function PodChaserPage() {
  const experiment = experiments.find(e => e.slug === "pod-chaser");
  if (!experiment) notFound();
  return <Shell><div className="wrap page-space pc-page">
    <div className="detail-links pc-back"><Link href="/experiments" className="text-link">← All experiments</Link><Link href={`/experiments/${experiment.slug}`} className="text-link">About this experiment</Link></div>
    <div className="experiment-heading">
      <p className="eyebrow">{categories.find(c => c.id === experiment.category)?.name} / <span className="status-tag">Browser Experiment</span></p>
      <div className="pc-title-row">{experiment.logo && <Image src={experiment.logo.src} alt={experiment.logo.alt} width={96} height={96} className="pc-logo" />}<h1 className="page-title">{experiment.title}</h1></div>
      <p className="page-intro">Delivered, but still waiting on signed paperwork?<br />See which PODs to chase today and which loads are ready to bill.</p>
    </div>
    <PodWorkbench />
    <BrowserDesktop experiment={experiment} />
    <p className="pc-feedback"><Link className="text-link" href={`/experiments/${experiment.slug}#feedback`}>Tell me how it went ↗</Link></p>
  </div></Shell>;
}
