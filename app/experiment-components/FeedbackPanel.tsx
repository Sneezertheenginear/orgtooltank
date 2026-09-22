"use client";
import { useState, type FormEvent } from "react";
import { saveFeedback, useFeedback } from "./feedback-store";
export default function FeedbackPanel({ slug, title }: { slug: string; title: string }) {
  const feedback = useFeedback(slug);
  const [message, setMessage] = useState("");
  const [text, setText] = useState("");
  const [next, setNext] = useState("");
  function vote(value: "like" | "unlike") {
    const saved = saveFeedback(slug, { ...feedback, vote: feedback.vote === value ? null : value });
    setMessage(saved ? "Reaction saved on this browser." : "Your browser couldn’t save this reaction. You can email your feedback instead.");
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim() && !next.trim()) { setMessage("Write a comment or an idea for what this should do next."); return; }
    const saved = saveFeedback(slug, { ...feedback, comments: [...feedback.comments, { id: crypto.randomUUID(), text: text.trim(), next: next.trim(), created: new Date().toISOString() }] });
    if (saved) { setText(""); setNext(""); setMessage("Comment saved on this browser. It hasn’t been sent to the maker. Use the email link below to share it."); }
    else setMessage("Your browser couldn’t save this comment. Your text is still here; use the email link to share it.");
  }
  const emailBody = [text, next && `What it should do next: ${next}`, ...feedback.comments.map(c => `${c.text}\n${c.next ? `Next: ${c.next}` : ""}`)].filter(Boolean).join("\n\n");
  return <section id="feedback" className="feedback-panel"><p className="eyebrow">Leave a note on the workbench</p><h2>What do you think?</h2><p>Feedback is saved only in this browser for now. It isn’t public or sent to me. You can email it to me below.</p><div className="reaction-buttons"><button aria-pressed={feedback.vote === "like"} onClick={() => vote("like")}>↑ Like · {Number(feedback.vote === "like")}</button><button aria-pressed={feedback.vote === "unlike"} onClick={() => vote("unlike")}>↓ Unlike · {Number(feedback.vote === "unlike")}</button><a href="#comment">Comment · {feedback.comments.length}</a></div><form onSubmit={submit} className="workshop-form"><label htmlFor="comment">{feedback.vote === "like" ? "Why did you like it? (optional)" : feedback.vote === "unlike" ? "Why didn’t this work for you? (optional)" : "Comment — what worked or didn’t?"}</label><textarea id="comment" value={text} onChange={e => setText(e.target.value)} maxLength={3000} rows={4} placeholder="A small detail is useful, too." /><label htmlFor="next-idea">What should this do next?</label><textarea id="next-idea" value={next} onChange={e => setNext(e.target.value)} maxLength={3000} rows={3} placeholder="What would make this better?" /><button className="ink-button" type="submit">Save comment on this browser ↗</button></form><p role="status" className="small-note">{message}</p><a className="text-link" href={`mailto:orgtooltank@gmail.com?subject=${encodeURIComponent(`Feedback: ${title}`)}&body=${encodeURIComponent(emailBody)}`}>Email feedback to the maker ↗</a><div className="saved-comments"><h3>Your saved comments</h3>{feedback.comments.length ? feedback.comments.map(c => <article key={c.id}><p className="small-note">Local note · <time dateTime={c.created}>{new Date(c.created).toLocaleDateString()}</time></p>{c.text && <p>{c.text}</p>}{c.next && <p><strong>What’s next:</strong> {c.next}</p>}<button className="text-link" onClick={() => setMessage(saveFeedback(slug, { ...feedback, comments: feedback.comments.filter(note => note.id !== c.id) }) ? "Local comment removed." : "Your browser couldn’t remove this comment.")}>Remove local comment</button></article>) : <p className="small-note">No comments saved in this browser yet.</p>}</div></section>;
}
