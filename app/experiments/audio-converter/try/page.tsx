import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "../../../experiment-components/Shell";
import BrowserDesktop from "../../../experiment-components/BrowserDesktop";
import { categories, experiments } from "../../../data/experiments";
import AudioWorkbench from "./AudioWorkbench";
import "./audio-converter.css";

export const metadata = { title: "Audio Converter", description: "Convert MP3 and WAV audio locally in your browser. Your audio stays on your device during conversion." };

// The tool lives under /try so /experiments/audio-converter stays the shared detail page with feedback.
export default function AudioConverterPage() {
  const experiment = experiments.find(e => e.slug === "audio-converter");
  if (!experiment) notFound();
  return <Shell><div className="wrap page-space audio-converter">
    <div className="detail-links audio-back"><Link href="/experiments" className="text-link">← All experiments</Link><Link href={`/experiments/${experiment.slug}`} className="text-link">About this experiment</Link></div>
    <div className="experiment-heading">
      <p className="eyebrow">{categories.find(c => c.id === experiment.category)?.name} / <span className="status-tag">Browser Experiment</span></p>
      <div className="audio-title-row">{experiment.logo && <Image src={experiment.logo.src} alt={experiment.logo.alt} width={96} height={96} className="audio-logo" />}<h1 className="page-title">{experiment.title}</h1></div>
      <p className="page-intro">Same sound. A different file.<br />Convert MP3 to WAV or WAV to MP3, then download the result.</p>
      <p className="audio-privacy">Your audio stays on your device during conversion.</p>
    </div>
    <AudioWorkbench />
    <BrowserDesktop experiment={experiment} />
    <p className="audio-feedback"><Link className="text-link" href={`/experiments/${experiment.slug}#feedback`}>Tell me how it went ↗</Link></p>
  </div></Shell>;
}
