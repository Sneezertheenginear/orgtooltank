import Link from "next/link";
import Shell from "./experiment-components/Shell";
import ExperimentCard from "./experiment-components/ExperimentCard";
import DesktopRequest from "./experiment-components/DesktopRequest";
import { experiments } from "./data/experiments";
export default function Home() {
  return <Shell>
    <section className="workshop-hero wrap"><div className="hero-topline"><span className="eyebrow">Ideas out in the open</span><span className="edition">Est. 2026 / Always in progress</span></div><h1>THE SCATTERED<br />MIND <span>EXPERIMENT</span><sup>↗</sup></h1><div className="hero-bottom"><p>There’s always something<br />new to discover.</p><a className="ink-button" href="#latest">Look around <span aria-hidden="true">↓</span></a></div></section>
    <section className="intro-note wrap">
      <p className="eyebrow">A note from the maker<br /><span className="hand-arrow" aria-hidden="true">↳</span></p>
      <div className="prose-copy">
        <h2>These are ideas I’ve had in my head for years.</h2>
        <p>I always wanted to learn how to code because I had ideas I couldn’t build yet for one reason or another.</p>
        <p>AI changed that.</p>
        <p>Now I can challenge my own thinking, use AI as a tool, and turn ideas into something real while they’re still fresh in my mind.</p>
        <p>This site is where the human mind and AI meet to look at everyday problems, useful tools, strange ideas, and different ways of doing things.</p>
        <p>Some ideas may be useful. Some may be rough. Some may never go any further than what you see here.</p>
        <p>Most are untested and posted as-is.</p>
        <p>Use them. Play with them. Like them, unlike them, comment, and tell me why.</p>
        <p className="underlined-note">No guarantees. No promises. Just ideas being put into the world to see what happens.</p>
      </div>
    </section>
    <section id="latest" className="workbench"><div className="wrap"><div className="section-heading"><div><p className="eyebrow">On the workbench / {String(experiments.length).padStart(3, "0")}</p><h2>Latest experiments</h2></div><Link href="/experiments" className="text-link">All {experiments.length} experiments ↗</Link></div><div className="feed-grid">{[...experiments].filter(experiment => experiment.featured).sort((a, b) => b.dateAdded.localeCompare(a.dateAdded)).map(experiment => <ExperimentCard key={experiment.slug} experiment={experiment} />)}<aside className="empty-workbench"><span className="rough-star" aria-hidden="true">✳</span><h3>The next idea<br />could be anything.</h3><p>A tiny tool. Something musical. A fix for an everyday annoyance. There’s room on the bench.</p><Link className="text-link" href="/categories">See what’s here ↗</Link><span className="pencil-note">Nothing here has to be the final version.</span></aside></div><div className="played-note"><h3>Most played with</h3><p>No public play counts yet. Take a look around and see what you find.</p></div></div></section>
    <div className="wrap"><DesktopRequest /></div>
  </Shell>;
}
