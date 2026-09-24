"use client";
import { useState, type FormEvent } from "react";

type Comment = { id: string; slug: string; text: string; next: string; created: string; voter: string };
type Block = { at: string; route: string; reason: string; slug?: string; ip: string; voter?: string };
type Data = { pending: Comment[]; approved: Comment[]; blocked: Block[] };

// The password is kept in this page's memory only and sent in a header, never in the URL.
export default function AdminClient() {
  const [password, setPassword] = useState("");
  const [data, setData] = useState<Data | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function call(method: "GET" | "POST", body?: Record<string, string>) {
    const response = await fetch("/api/feedback/admin", { method, cache: "no-store", headers: { Authorization: `Bearer ${password}`, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const json = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, json };
  }
  async function load(event?: FormEvent, keepMessage = false) {
    event?.preventDefault(); setBusy(true);
    const { ok, status, json } = await call("GET");
    if (ok) { setData(json as Data); if (!keepMessage) setMessage(""); } else { setData(null); setMessage(status === 429 ? "Too many wrong passwords. Try again later." : String(json.message ?? "Couldn’t load feedback.")); }
    setBusy(false);
  }
  async function act(action: "approve" | "delete", id: string) {
    setBusy(true);
    const { ok, json } = await call("POST", { action, id });
    setMessage(ok ? (action === "approve" ? "Approved. It’s now public." : "Deleted.") : String(json.message ?? "That didn’t work."));
    await load(undefined, true);
  }
  const when = (iso: string) => new Date(iso).toLocaleString();
  const item = (c: Comment, pending: boolean) => <article key={c.id}>
    <p className="small-note">{c.slug} · {when(c.created)} · browser {c.voter}</p>
    {c.text && <p>{c.text}</p>}{c.next && <p><strong>What’s next:</strong> {c.next}</p>}
    <div className="detail-links">{pending && <button type="button" className="ink-button" disabled={busy} onClick={() => act("approve", c.id)}>Approve</button>}<button type="button" className="text-link" disabled={busy} onClick={() => act("delete", c.id)}>Delete</button></div>
  </article>;

  return <div className="saved-comments">
    <form onSubmit={load} className="workshop-form">
      <label htmlFor="admin-password">Moderator password<input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label>
      <button className="ink-button" type="submit" disabled={busy || !password}>{data ? "Refresh" : "Show feedback"}</button>
    </form>
    {message && <p role="status" className="small-note">{message}</p>}
    {data && <>
      <h3>Waiting for review ({data.pending.length})</h3>
      {data.pending.length ? data.pending.map(c => item(c, true)) : <p className="small-note">Nothing waiting.</p>}
      <h3>Recently approved</h3>
      {data.approved.length ? data.approved.map(c => item(c, false)) : <p className="small-note">None yet.</p>}
      <h3>Recently blocked requests</h3>
      {data.blocked.length ? <ul className="small-note">{data.blocked.map((b, i) => <li key={i}>{when(b.at)} · {b.route} · {b.reason}{b.slug ? ` · ${b.slug}` : ""} · network {b.ip}{b.voter ? ` · browser ${b.voter}` : ""}</li>)}</ul> : <p className="small-note">None.</p>}
    </>}
  </div>;
}
