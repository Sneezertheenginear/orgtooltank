import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "../../experiment-components/Shell";
import DesktopRequest from "../../experiment-components/DesktopRequest";
import FeedbackPanel from "../../experiment-components/FeedbackPanel";
import ExperimentActions from "../../experiment-components/ExperimentActions";
import BrowserDesktop from "../../experiment-components/BrowserDesktop";
import Mazda3Illustration from "../../Mazda3Illustration";
import { categories, experiments, dateLabel } from "../../data/experiments";
export function generateStaticParams() { return experiments.map(e => ({ slug: e.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const experiment = experiments.find(e => e.slug === slug);
  return { title: experiment?.title || "Experiment not found", description: experiment?.description };
}
export default async function ExperimentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const experiment = experiments.find(e => e.slug === slug);
  if (!experiment) notFound();
  return <Shell><div className="wrap page-space"><Link href="/experiments" className="text-link">← All experiments</Link><div className="experiment-heading"><p className="eyebrow">{categories.find(c => c.id === experiment.category)?.name} / {experiment.status}</p><h1 className="page-title">{experiment.title}</h1><p className="page-intro">{experiment.description}</p><p className="small-note">Added to the experiment collection <time dateTime={experiment.dateAdded}>{dateLabel(experiment.dateAdded)}</time></p><dl className="availability"><div><dt>Browser</dt><dd>{experiment.browserAvailable ? "Available to try" : "Not available yet"}</dd></div><div><dt>Desktop</dt><dd>{experiment.desktopAvailable ? "Available — see details" : "Not offered here yet"}</dd></div></dl><ul className="experiment-tags" aria-label="Tags">{experiment.tags.map(tag => <li key={tag}>{tag}</li>)}</ul><ExperimentActions experiment={experiment} /></div><aside className="as-is-note"><h2>Untested experiment</h2><p>This was built as an idea and posted as-is. It may be incomplete, buggy, inaccurate, changed, expanded, abandoned, or rebuilt at any time.</p><p>Use it at your own discretion and tell me what worked or what didn’t.</p></aside>{slug === "mazda-3" && <section className="mazda-detail"><Mazda3Illustration /><h2>One real car. A growing set of notes.</h2><p>The repair systems, illustrations, part locations, and guides are all here. Start with the library or go straight to Engine &amp; Air.</p><div className="detail-links"><Link className="text-link" href="/cars/mazda-3-repair">Full repair library ↗</Link><Link className="text-link" href="/cars/mazda/mazda-3/2007/2-3l/engine-air">Engine &amp; Air guides ↗</Link><Link className="text-link" href="/tools-testing">Tools &amp; Testing ↗</Link></div></section>}<BrowserDesktop experiment={experiment} /><FeedbackPanel title={experiment.title} /><DesktopRequest slug={slug} /></div></Shell>;
}
