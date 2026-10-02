import Image from "next/image";
import Link from "next/link";
import { categories, dateLabel, experiments } from "./data/experiments";
import { loadNotes } from "./workbench/notes";

// Homepage "latest" cards: the newest browser experiment beside the newest Workbench note.
// Both are picked from the data, so adding a newer experiment (app/data/experiments.ts, by dateAdded)
// or a newer Workbench post (content/workbench/*.md, by date) updates the homepage on its own.

/** The newest experiment that can be tried in the browser. Same-day ties keep the order of the data file. */
export function latestBrowserExperiment() {
  return [...experiments].filter(e => e.browserAvailable).sort((a, b) => b.dateAdded.localeCompare(a.dateAdded))[0];
}

export default function HomeFeatured() {
  const experiment = latestBrowserExperiment();
  const note = loadNotes()[0]; // already newest first
  return <div className="home-featured">
    {experiment?.browserAvailable && <article className="home-card">
      <p className="home-card-label">Latest experiment</p>
      <Link href={experiment.browserRoute} className="home-card-media home-card-identity" tabIndex={-1} aria-hidden="true">
        {experiment.logo ? <Image src={experiment.logo.src} alt="" width={104} height={104} />
          : experiment.image ? <Image src={experiment.image.src} alt="" fill sizes="(max-width: 760px) 100vw, 560px" className="home-card-contain" />
          : <span>{experiment.title}</span>}
      </Link>
      <div className="home-card-body">
        <p className="home-card-path">{categories.find(c => c.id === experiment.category)?.name} / {experiment.status}</p>
        <h3><Link href={experiment.browserRoute}>{experiment.title}</Link></h3>
        <p className="home-card-summary">{experiment.description}</p>
        <div className="home-card-foot">
          <time dateTime={experiment.dateAdded}>Added {dateLabel(experiment.dateAdded)}</time>
          <Link href={experiment.browserRoute} className="home-card-cta" aria-label={`Try experiment: ${experiment.title}`}>Try experiment →</Link>
        </div>
      </div>
    </article>}
    {note && <article className="home-card">
      <p className="home-card-label">Latest from the Workbench</p>
      {note.image && <Link href={`/workbench/${note.slug}`} className="home-card-media" tabIndex={-1} aria-hidden="true">
        <Image src={note.image.src} alt="" fill sizes="(max-width: 760px) 100vw, 560px" />
      </Link>}
      <div className="home-card-body">
        {note.categoryLabel && <p className="home-card-path">{note.categoryLabel}</p>}
        <h3><Link href={`/workbench/${note.slug}`}>{note.title}</Link></h3>
        {note.description && <p className="home-card-summary">{note.description}</p>}
        <div className="home-card-foot">
          {note.date ? <time dateTime={note.date}>{dateLabel(note.date)}</time> : <span />}
          <Link href={`/workbench/${note.slug}`} className="home-card-cta" aria-label={`Read note: ${note.title}`}>Read note →</Link>
        </div>
      </div>
      <p className="home-card-more"><Link href="/workbench" className="text-link">All Workbench notes →</Link></p>
    </article>}
  </div>;
}
