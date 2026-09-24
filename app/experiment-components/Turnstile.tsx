"use client";

// Cloudflare Turnstile for comment submission. Uses "interaction-only" appearance, so most visitors
// never see anything; a challenge appears only when Cloudflare wants one. Only the public site key
// is used here; the secret key stays on the server.
import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";

type TurnstileApi = { render(element: HTMLElement, options: Record<string, unknown>): string; reset(id?: string): void; remove(id: string): void };
declare global { interface Window { turnstile?: TurnstileApi } }

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export default function Turnstile({ onToken, resetSignal }: { onToken: (token: string) => void; resetSignal: number }) {
  const box = useRef<HTMLDivElement>(null), widget = useRef<string | null>(null), callback = useRef(onToken);
  useEffect(() => { callback.current = onToken; });
  const render = useCallback(() => {
    if (!TURNSTILE_SITE_KEY || !box.current || !window.turnstile || widget.current) return;
    widget.current = window.turnstile.render(box.current, {
      sitekey: TURNSTILE_SITE_KEY, appearance: "interaction-only", action: "comment",
      callback: (token: string) => callback.current(token),
      "expired-callback": () => callback.current(""), "error-callback": () => callback.current(""),
    });
  }, []);
  useEffect(() => {
    render();
    return () => { if (widget.current && window.turnstile) window.turnstile.remove(widget.current); widget.current = null; };
  }, [render]);
  useEffect(() => { if (resetSignal && widget.current && window.turnstile) window.turnstile.reset(widget.current); }, [resetSignal]);
  if (!TURNSTILE_SITE_KEY) return null;
  return <>
    <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={render} />
    <div ref={box} className="turnstile-box" />
  </>;
}
