"use client";
import { useEffect, useState, type FormEvent } from "react";
import { postFeedback, setEntry, useFeedbackEntries, type Counts, type Vote } from "./feedback-client";
import Turnstile, { TURNSTILE_SITE_KEY } from "./Turnstile";

type PublicComment = { id: string; text: string; next: string; created: string };
const RATE_LIMITED = "Too many requests. Try again in a moment.";
const COMMENT_MAX = 2000, NEXT_MAX = 1000;

export default function FeedbackPanel({ slug, title }: { slug: string; title: string }) {
  const entry = useFeedbackEntries([slug])[slug];
  const [comments, setComments] = useState<PublicComment[] | null | undefined>(undefined);
  const [text, setText] = useState("");
  const [next, setNext] = useState("");
  const [website, setWebsite] = useState("");
  const [token, setToken] = useState("");
  const [resetSignal, setResetSignal] = useState(0);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const available = entry !== undefined && entry !== "unavailable";
  const counts: Counts = available ? entry.counts : { like: 0, unlike: 0, comments: 0 };
  const mine: Vote | null = available ? entry.mine : null;

  useEffect(() => {
    let active = true;
    fetch(`/api/feedback/comments?slug=${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then(response => response.ok ? response.json() : Promise.reject(response.status))
      .then((data: { comments: PublicComment[] }) => { if (active) setComments(data.comments); })
      .catch(() => { if (active) setComments(null); });
    return () => { active = false; };
  }, [slug]);

  const explain = (status: number, data: Record<string, unknown>, fallback: string) =>
    status === 429 ? RATE_LIMITED : status === 0 ? "You seem to be offline. Try again in a moment." : typeof data.message === "string" ? data.message : fallback;

  async function vote(value: Vote | "none") {
    if (busy) return;
    setBusy(true); setMessage("");
    const { status, data } = await postFeedback("/api/feedback/vote", { slug, vote: value });
    if ((status === 200 || status === 409) && data.counts) setEntry(slug, { counts: data.counts as Counts, mine: (data.mine as Vote | null) ?? null });
    setMessage(status === 200 ? (value === "none" ? "Your vote was removed." : `Thanks, your ${value} was counted.`) : explain(status, data, "Your vote couldn’t be saved. Try again in a moment."));
    setBusy(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!text.trim() && !next.trim()) { setMessage("Write a comment or an idea for what this should do next."); return; }
    if (TURNSTILE_SITE_KEY && !token) { setMessage("One moment: we’re checking you’re not a bot. Try again in a few seconds."); return; }
    setBusy(true); setMessage("");
    const { status, data } = await postFeedback("/api/feedback/comments", { slug, text, next, website, token });
    if (status === 202) { setText(""); setNext(""); setMessage(String(data.message ?? "Thanks! Your comment will appear after review.")); }
    else setMessage(explain(status, data, "Your comment couldn’t be sent. Try again in a moment."));
    // A Turnstile token works once, so get a fresh one for the next submission.
    setToken(""); setResetSignal(signal => signal + 1); setBusy(false);
  }

  return <section id="feedback" className="feedback-panel"><p className="eyebrow">Leave a note on the workbench</p><h2>What do you think?</h2>
    <p>Likes are counted for everyone. Comments go to the maker first and appear here after a quick review.</p>
    <div className="reaction-buttons">
      <button type="button" aria-pressed={mine === "like"} disabled={busy || !available} onClick={() => vote("like")}>↑ Like · {available ? counts.like : "–"}</button>
      <button type="button" aria-pressed={mine === "unlike"} disabled={busy || !available} onClick={() => vote("unlike")}>↓ Unlike · {available ? counts.unlike : "–"}</button>
      <a href="#comment">Comments · {available ? counts.comments : "–"}</a>
    </div>
    {entry === "unavailable" && <p className="small-note">Likes and comments aren’t available right now.</p>}
    {mine && <button type="button" className="text-link" disabled={busy} onClick={() => vote("none")}>Remove my vote</button>}
    <form onSubmit={submit} className="workshop-form">
      <label htmlFor="comment">{mine === "like" ? "Why did you like it? (optional)" : mine === "unlike" ? "Why didn’t this work for you? (optional)" : "Comment: what worked or didn’t?"}</label>
      <textarea id="comment" value={text} onChange={e => setText(e.target.value)} maxLength={COMMENT_MAX} rows={4} placeholder="A small detail is useful, too." />
      <label htmlFor="next-idea">What should this do next?</label>
      <textarea id="next-idea" value={next} onChange={e => setNext(e.target.value)} maxLength={NEXT_MAX} rows={3} placeholder="What would make this better?" />
      <div className="hp-field" aria-hidden="true"><label htmlFor={`website-${slug}`}>Website</label><input id={`website-${slug}`} name="website" tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} /></div>
      <Turnstile onToken={setToken} resetSignal={resetSignal} />
      <button className="ink-button" type="submit" disabled={busy}>{busy ? "Sending…" : "Send comment for review ↗"}</button>
    </form>
    <p role="status" className="small-note">{message}</p>
    <a className="text-link" href={`mailto:orgtooltank@gmail.com?subject=${encodeURIComponent(`Feedback: ${title}`)}&body=${encodeURIComponent([text, next && `What it should do next: ${next}`].filter(Boolean).join("\n\n"))}`}>Email feedback to the maker ↗</a>
    <div className="saved-comments"><h3>Comments</h3>
      {comments === undefined ? <p className="small-note">Loading comments…</p>
        : comments === null ? <p className="small-note">Comments couldn’t be loaded right now.</p>
        : comments.length ? comments.map(c => <article key={c.id}><p className="small-note"><time dateTime={c.created}>{new Date(c.created).toLocaleDateString()}</time></p>{c.text && <p>{c.text}</p>}{c.next && <p><strong>What’s next:</strong> {c.next}</p>}</article>)
        : <p className="small-note">No comments yet. Comments appear here after review.</p>}
    </div>
  </section>;
}
