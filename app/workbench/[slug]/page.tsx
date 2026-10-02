import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "../../experiment-components/Shell";
import { dateLabel } from "../../data/experiments";
import { workbenchCategoryName } from "../../data/workbench";
import { loadNote, loadNotes } from "../notes";
import ReaderFeedback from "../ReaderFeedback";
import "../workbench.css";

// One Workbench article, from content/workbench/<slug>.md: path, title and metadata on the left with the photo
// beside them; the article below, with any “What I learned”, “What I’d do differently”, and “Tools & Parts”
// sections in a box on the right (no box when the article has none). Any other address is a 404.

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return loadNotes().map(n => ({ slug: n.slug }));
}
export async function generateMetadata({ params }: Props) {
  const note = loadNote((await params).slug);
  return note ? { title: note.title, description: note.description } : {};
}

export default async function WorkbenchNotePage({ params }: Props) {
  const note = loadNote((await params).slug);
  if (!note) notFound();
  const main = note.categories[0];

  return <Shell><div className="wrap page-space wb-page">
    <article className="wb-article">
      <header className="wb-article-head">
        <nav aria-label="Breadcrumb" className="wb-crumbs">
          <ol>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/workbench">Workbench</Link></li>
            {main && <li><Link href={`/workbench?category=${main}`}>{workbenchCategoryName(main)}</Link></li>}
            <li aria-current="page">{note.title}</li>
          </ol>
        </nav>
        <h1>{note.title}</h1>
        <p className="wb-article-meta">{note.categoryLabel && <span>{note.categoryLabel}</span>}{note.date && <time dateTime={note.date}>{dateLabel(note.date)}</time>}</p>
      </header>

      {note.image && <div className="wb-article-image">
        <Image src={note.image.src} alt={note.image.alt} fill sizes="(max-width: 860px) 100vw, 440px" loading="eager" fetchPriority="high" />
      </div>}

      {/* The article's own Markdown, rendered on the server from the site owner's file. */}
      <div className="wb-article-body" dangerouslySetInnerHTML={{ __html: note.bodyHtml }} />

      {note.sidebar.length > 0 && <aside className="wb-article-aside" aria-label="Notes from the bench">
        {note.sidebar.map(s => <section key={s.kind}>
          <h2>{s.heading}</h2>
          <div dangerouslySetInnerHTML={{ __html: s.html }} />
        </section>)}
      </aside>}
    </article>
    <ReaderFeedback title={note.title} />
  </div></Shell>;
}
