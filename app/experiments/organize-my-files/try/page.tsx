import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "../../../experiment-components/Shell";
import BrowserDesktop from "../../../experiment-components/BrowserDesktop";
import { categories, experiments } from "../../../data/experiments";
import OrganizeWorkbench from "./OrganizeWorkbench";
import "./organize-my-files.css";

export const metadata = { title: "Organize My Files", description: "Sort a messy folder into tidy categories in your browser and download an organized ZIP. Your files stay on your device." };

// The tool lives under /try so /experiments/organize-my-files stays the shared detail page with feedback.
export default function OrganizeMyFilesPage() {
  const experiment = experiments.find(e => e.slug === "organize-my-files");
  if (!experiment) notFound();
  return <Shell><div className="wrap page-space organize-my-files">
    <div className="detail-links organize-back"><Link href="/experiments" className="text-link">← All experiments</Link><Link href={`/experiments/${experiment.slug}`} className="text-link">About this experiment</Link></div>
    <div className="experiment-heading">
      <p className="eyebrow">{categories.find(c => c.id === experiment.category)?.name} / <span className="status-tag">Browser Experiment</span></p>
      <div className="organize-title-row">{experiment.logo && <Image src={experiment.logo.src} alt={experiment.logo.alt} width={96} height={96} className="organize-logo" />}<h1 className="page-title">{experiment.title}</h1></div>
      <p className="page-intro">Everything in its place.<br />Sort a messy folder into tidy categories and download an organized copy.</p>
      <p className="organize-privacy">Your files stay on your device. Organizing happens in your browser, and your originals are never moved or changed.</p>
    </div>
    <OrganizeWorkbench />
    <BrowserDesktop experiment={experiment} />
    <p className="organize-feedback"><Link className="text-link" href={`/experiments/${experiment.slug}#feedback`}>Tell me how it went ↗</Link></p>
  </div></Shell>;
}
