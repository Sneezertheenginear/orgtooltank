import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "../../../experiment-components/Shell";
import BrowserDesktop from "../../../experiment-components/BrowserDesktop";
import SupportNote from "../../../experiment-components/SupportNote";
import { categories, experiments } from "../../../data/experiments";
import BotWatch from "./BotWatch";
import "./bot-watch.css";

export const metadata = { title: "Bot Watch", description: "See who or what is hammering your website. Analyze Past Traffic reads your own traffic files in your browser; Live View isn't connected yet, but you can preview it with sample traffic." };

// The tool lives under /try so /experiments/bot-watch stays the shared detail page with feedback.
export default function BotWatchPage() {
  const experiment = experiments.find(e => e.slug === "bot-watch");
  if (!experiment) notFound();
  return <Shell><div className="wrap page-space bw-page">
    <div className="detail-links bw-back"><Link href="/experiments" className="text-link">← All experiments</Link><Link href={`/experiments/${experiment.slug}`} className="text-link">About this experiment</Link></div>
    <div className="experiment-heading">
      <p className="eyebrow">{categories.find(c => c.id === experiment.category)?.name} / <span className="status-tag">Browser Experiment</span></p>
      <div className="bw-title-row">{experiment.logo && <Image src={experiment.logo.src} alt={experiment.logo.alt} width={96} height={96} className="bw-logo" />}<h1 className="page-title">{experiment.title}</h1></div>
      <p className="page-intro">Is something hammering your website?<br />Watch traffic as it happens, see suspicious behavior, and find out who or what is behind it.</p>
    </div>
    <BotWatch />
    <BrowserDesktop experiment={experiment} />
    <p className="bw-feedback"><Link className="text-link" href={`/experiments/${experiment.slug}#feedback`}>Tell me how it went ↗</Link></p>
    <SupportNote />
  </div></Shell>;
}
