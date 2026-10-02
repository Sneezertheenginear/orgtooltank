import Image from "next/image";
import Link from "next/link";
import { dateLabel } from "../data/experiments";
import type { Note } from "../data/workbench";

/** One Workbench card: photo, category, title, description, and the date with “Read note →” at the bottom. */
export default function NoteCard({ note }: { note: Note }) {
  const href = `/workbench/${note.slug}`;
  return <article className="wb-card">
    {/* The photo links too, but only the title and “Read note” are announced and focusable. */}
    {note.image && <Link href={href} className="wb-card-image" tabIndex={-1} aria-hidden="true">
      <Image src={note.image.src} alt="" fill sizes="(max-width: 560px) 100vw, (max-width: 820px) 50vw, (max-width: 1100px) 33vw, 290px" />
    </Link>}
    <div className="wb-card-body">
      {note.categoryLabel && <p className="wb-card-path">{note.categoryLabel}</p>}
      <h3><Link href={href}>{note.title}</Link></h3>
      {note.description && <p className="wb-card-summary">{note.description}</p>}
      <div className="wb-card-foot">
        {note.date ? <time dateTime={note.date}>{dateLabel(note.date)}</time> : <span />}
        <Link href={href} className="wb-read" aria-label={`Read note: ${note.title}`}>Read note →</Link>
      </div>
    </div>
  </article>;
}
