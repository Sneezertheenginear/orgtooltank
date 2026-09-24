import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "../../../experiment-components/Shell";
import BrowserDesktop from "../../../experiment-components/BrowserDesktop";
import { categories, experiments } from "../../../data/experiments";
import MoneyWorkbench from "./MoneyWorkbench";
import "./where-did-my-money-go.css";

export const metadata = { title: "Where Did My Money Go?", description: "Import bank and card CSV files and see money in, money out, and where it went. Analyzed in your browser; nothing is uploaded or saved." };

// The tool lives under /try so /experiments/where-did-my-money-go stays the shared detail page with feedback.
export default function WhereDidMyMoneyGoPage() {
  const experiment = experiments.find(e => e.slug === "where-did-my-money-go");
  if (!experiment) notFound();
  return <Shell><div className="wrap page-space money-page">
    <div className="detail-links money-back"><Link href="/experiments" className="text-link">← All experiments</Link><Link href={`/experiments/${experiment.slug}`} className="text-link">About this experiment</Link></div>
    <div className="experiment-heading">
      <p className="eyebrow">{categories.find(c => c.id === experiment.category)?.name} / <span className="status-tag">Browser Experiment</span></p>
      <div className="money-title-row">{experiment.logo && <Image src={experiment.logo.src} alt={experiment.logo.alt} width={96} height={96} className="money-logo" />}<h1 className="page-title">{experiment.title}</h1></div>
      <p className="page-intro">I made money. Where did it go?<br />See money in, money out, what’s actually left, and where the rest went.</p>
      <p className="money-privacy">Your financial files stay on your device. Everything is analyzed in your browser and nothing is uploaded or saved. Closing this page clears it.</p>
    </div>
    <MoneyWorkbench />
    <p className="money-disclaimer">Estimates based only on the transactions you provide. This isn’t accounting, tax, or financial advice.</p>
    <BrowserDesktop experiment={experiment} />
    <p className="money-feedback"><Link className="text-link" href={`/experiments/${experiment.slug}#feedback`}>Tell me how it went ↗</Link></p>
  </div></Shell>;
}
