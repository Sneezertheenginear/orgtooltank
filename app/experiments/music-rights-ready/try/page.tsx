import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "../../../experiment-components/Shell";
import BrowserDesktop from "../../../experiment-components/BrowserDesktop";
import { categories, experiments } from "../../../data/experiments";
import { DISCLAIMER } from "../content";
import RightsWorkbench from "./RightsWorkbench";
import "./music-rights-ready.css";

export const metadata = { title: "Music Rights Ready", description: "For one song: who wrote it, who owns the recording, and what to register before and after release. A plain-English checklist that stays on your device." };

// The tool lives under /try so /experiments/music-rights-ready stays the shared detail page with feedback.
export default function MusicRightsReadyPage() {
  const experiment = experiments.find(e => e.slug === "music-rights-ready");
  if (!experiment) notFound();
  return <Shell><div className="wrap page-space music-page">
    <div className="detail-links music-back"><Link href="/experiments" className="text-link">← All experiments</Link><Link href={`/experiments/${experiment.slug}`} className="text-link">About this experiment</Link></div>
    <div className="experiment-heading">
      <p className="eyebrow">{categories.find(c => c.id === experiment.category)?.name} / <span className="status-tag">Browser Experiment</span></p>
      <div className="music-title-row">{experiment.logo && <Image src={experiment.logo.src} alt={experiment.logo.alt} width={96} height={96} className="music-logo" />}<h1 className="page-title">{experiment.title}</h1></div>
      <p className="page-intro">Finish the song. Know what comes next.<br />For one song: who wrote it, who owns the recording, and what to register before and after release.</p>
      <p className="music-privacy">Song details, names, splits, and checklist progress stay on your device. Nothing is sent to OrgToolTank.</p>
      <p className="music-disclaimer">{DISCLAIMER}</p>
    </div>
    <RightsWorkbench />
    <BrowserDesktop experiment={experiment} />
    <p className="music-feedback"><Link className="text-link" href={`/experiments/${experiment.slug}#feedback`}>Tell me how it went ↗</Link></p>
  </div></Shell>;
}
