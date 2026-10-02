import Image from "next/image";
import Link from "next/link";
import Shell from "../experiment-components/Shell";
import { workbenchCategories, workbenchCategoryName, type WorkbenchCategory } from "../data/workbench";
import { loadNotes } from "./notes";
import NoteCard from "./NoteCard";
import "./workbench.css";

export const metadata = { title: "The Workbench", description: "Notes on computers, old operating systems, electronics, audio gear, cables, software, tools, buying tips, and repair: things repaired, bought, built, tested, and learned from." };

export default async function WorkbenchPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  // Read from content/workbench/*.md on each visit, so a saved article shows up on refresh.
  const notes = loadNotes();
  const active = workbenchCategories.find(c => c.id === category)?.id;
  const shown = active ? notes.filter(n => n.categories.includes(active as WorkbenchCategory)) : notes;

  return <Shell><div className="wrap page-space wb-page">
    <section className="wb-hero" aria-labelledby="wb-title">
      <div className="wb-hero-copy">
        <h1 id="wb-title">The Workbench</h1>
        <p>A place for electronics geeks, programmers, fixers, builders, and anybody who likes figuring things out.</p>
        <p>I use this space to talk about things I’ve repaired, bought, built, tested, coded, broken, fixed again, and learned from along the way.</p>
        <p>Computers, old operating systems, electronics, audio gear, sensors, cables, software, tools, buying tips, repair tricks, and whatever else ends up on the bench.</p>
      </div>
      <div className="wb-hero-image">
        <Image src="/workbench/hero.webp" alt="A workbench with a laptop, a multimeter, wire spools, and a circuit board" fill sizes="(max-width: 860px) 100vw, 560px" loading="eager" fetchPriority="high" />
      </div>
    </section>

    <nav className="wb-filters" aria-label="Workbench categories">
      <ul>
        <li><Link href="/workbench" scroll={false} aria-current={!active ? "page" : undefined}>All</Link></li>
        {workbenchCategories.map(c => <li key={c.id}><Link href={`/workbench?category=${c.id}`} scroll={false} aria-current={active === c.id ? "page" : undefined}>{c.name}</Link></li>)}
      </ul>
    </nav>

    <h2 className="sr-only">{active ? `${workbenchCategoryName(active)} notes` : "All notes"}</h2>
    {shown.length
      ? <div className="wb-grid">{shown.map(n => <NoteCard key={n.slug} note={n} />)}</div>
      : <p className="wb-empty">No notes in {workbenchCategoryName(active!)} yet. <Link className="text-link" href="/workbench" scroll={false}>See all notes</Link></p>}
  </div></Shell>;
}
