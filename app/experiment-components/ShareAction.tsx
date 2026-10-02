"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Share this page, with nothing sent to or stored by the site: the browser's own share sheet when it has one,
 * otherwise the page's address is copied. If copying isn't allowed either, the address is shown to copy by hand.
 */
export default function ShareAction({ title, label = "Copy link" }: { title: string; label?: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const show = (text: string, ms = 2500) => { setStatus(text); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setStatus(null), ms); };

  async function share() {
    const url = window.location.href.split("#")[0];
    if (navigator.share) {
      try { await navigator.share({ title, url }); return; }
      catch (e) { if (e instanceof DOMException && e.name === "AbortError") return; } // closed the share sheet
    }
    try { await navigator.clipboard.writeText(url); show("Link copied"); }
    catch { show(`Copy this link: ${url}`, 8000); }
  }

  return <span className="share-action">
    <button type="button" onClick={share}>{label}</button>
    <span className="share-status" role="status">{status}</span>
  </span>;
}
