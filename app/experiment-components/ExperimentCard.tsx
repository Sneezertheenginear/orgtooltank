"use client";
import Image from "next/image";
import RenameProIdentity from "./RenameProIdentity";
import Link from "next/link";
import { categories, dateLabel, type Experiment } from "../data/experiments";
import ExperimentActions from "./ExperimentActions";
export default function ExperimentCard({ experiment }: { experiment: Experiment }) {
  return <article className="experiment-card">
    <Link href={`/experiments/${experiment.slug}`} className="card-art" aria-label={`Open ${experiment.title}`}>
      <span className="card-stamp">Untested / As-is</span>
      {experiment.slug === "rename-pro" ? <div className="rename-card-identity"><RenameProIdentity /></div> : experiment.logo ? <div className="card-identity"><Image src={experiment.logo.src} alt={experiment.logo.alt} width={80} height={80} /><span>{experiment.title}</span></div>
        : experiment.image ? <Image src={experiment.image.src} alt={experiment.image.alt} width={1200} height={800} className="object-contain" />
        : <div className="card-identity"><span>{experiment.title}</span></div>}
      <span className="art-caption">{experiment.browserAvailable ? "Open for exploring" : "Project listed / browser version not available"} ↗</span>
    </Link>
    <div className="card-body">
      <div className="card-meta"><span>{categories.find(c => c.id === experiment.category)?.name}</span><time dateTime={experiment.dateAdded}>Added {dateLabel(experiment.dateAdded)}</time></div>
      <h3><Link href={`/experiments/${experiment.slug}`}>{experiment.title}</Link></h3>
      <p>{experiment.description}</p><span className="status-tag">◌ {experiment.status}</span>
      <dl className="availability"><div><dt>Browser</dt><dd>{experiment.browserAvailable ? "Available to try" : "Not available yet"}</dd></div><div><dt>Desktop</dt><dd>{experiment.desktopAvailable ? "Available — see details" : "Not offered here yet"}</dd></div></dl>
      <ExperimentActions experiment={experiment} showDetail />
    </div>
  </article>;
}
