import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "../../../experiment-components/Shell";
import BrowserDesktop from "../../../experiment-components/BrowserDesktop";
import { categories, experiments } from "../../../data/experiments";
import IdeaFocus from "./IdeaFocus";
import "./full-app-researcher.css";

export const metadata = { title: "Full App Researcher", description: "Describe an app idea, check whether the first version is focused enough to try, and get a one-page brief to copy or download. Nothing is saved or sent." };

// The tool lives under /try so /experiments/full-app-researcher stays the shared detail page with feedback.
export default function FullAppResearcherPage() {
  const experiment = experiments.find(e => e.slug === "full-app-researcher");
  if (!experiment) notFound();
  return <Shell><div className="wrap page-space ar-page">
    <div className="detail-links ar-back"><Link href="/experiments" className="text-link">← All experiments</Link><Link href={`/experiments/${experiment.slug}`} className="text-link">About this experiment</Link></div>
    <div className="experiment-heading">
      <p className="eyebrow">{categories.find(c => c.id === experiment.category)?.name} / <span className="status-tag">Browser Experiment</span></p>
      <div className="ar-title-row">{experiment.logo && <Image src={experiment.logo.src} alt={experiment.logo.alt} width={96} height={96} className="ar-logo" />}<h1 className="page-title">{experiment.title}</h1></div>
      <p className="page-intro">Have an app idea?<br />Check the first version is small enough to try, and leave with a one-page brief.</p>
    </div>
    <IdeaFocus />
    <BrowserDesktop experiment={experiment} />
    <p className="ar-feedback"><Link className="text-link" href={`/experiments/${experiment.slug}#feedback`}>Tell me how it went ↗</Link></p>
  </div></Shell>;
}
