import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "../../../experiment-components/Shell";
import BrowserDesktop from "../../../experiment-components/BrowserDesktop";
import { categories, experiments } from "../../../data/experiments";
import CryptoChecklist from "./CryptoChecklist";
import "./crypto-learning-lab.css";

export const metadata = { title: "Crypto Warning Check", description: "A short checklist of common crypto warning signs to go through before you send money, buy crypto, or connect a wallet. Nothing is saved or sent." };

const DISCLAIMER = "Educational only. Not financial, investment, legal, or tax advice. It can’t tell you whether any coin, website, wallet, or person is legitimate.";

// The tool lives under /try so /experiments/crypto-learning-lab stays the shared detail page with feedback.
export default function CryptoLearningLabPage() {
  const experiment = experiments.find(e => e.slug === "crypto-learning-lab");
  if (!experiment) notFound();
  return <Shell><div className="wrap page-space cl-page">
    <div className="detail-links cl-back"><Link href="/experiments" className="text-link">← All experiments</Link><Link href={`/experiments/${experiment.slug}`} className="text-link">About this experiment</Link></div>
    <div className="experiment-heading">
      <p className="eyebrow">{categories.find(c => c.id === experiment.category)?.name} / <span className="status-tag">Browser Experiment</span></p>
      <div className="cl-title-row">{experiment.logo && <Image src={experiment.logo.src} alt={experiment.logo.alt} width={96} height={96} className="cl-logo" />}<h1 className="page-title">{experiment.title}</h1></div>
      <p className="page-intro">About to send money, buy crypto, or connect a wallet?<br />Check for common warning signs first.</p>
      <p className="cl-disclaimer">{DISCLAIMER}</p>
    </div>
    <CryptoChecklist />
    <BrowserDesktop experiment={experiment} />
    <p className="cl-feedback"><Link className="text-link" href={`/experiments/${experiment.slug}#feedback`}>Tell me how it went ↗</Link></p>
  </div></Shell>;
}
