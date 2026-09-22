"use client";
import { useSyncExternalStore } from "react";
export type Feedback = { vote: "like" | "unlike" | null; comments: { id: string; text: string; next: string; created: string }[] };
const empty: Feedback = { vote: null, comments: [] };
const event = "orgtooltank-feedback";
const key = (slug: string) => `orgtooltank:feedback:v1:${slug}`;
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback); window.addEventListener(event, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(event, callback); };
}
function snapshot(slug: string) { try { return localStorage.getItem(key(slug)); } catch { return null; } }
export function parseFeedback(raw: string | null): Feedback {
  try {
    const value = JSON.parse(raw || "null");
    if (!value || ![null, "like", "unlike"].includes(value.vote) || !Array.isArray(value.comments)) return empty;
    return { vote: value.vote, comments: value.comments.filter((c: Feedback["comments"][number]) => c && typeof c.id === "string" && typeof c.text === "string" && typeof c.next === "string" && typeof c.created === "string") };
  } catch { return empty; }
}
export function useFeedback(slug: string) {
  return parseFeedback(useSyncExternalStore(subscribe, () => snapshot(slug), () => null));
}
// Integration point: replace browser storage with a server-backed feedback adapter.
// Public counts, moderation and abuse prevention belong in that adapter.
export function saveFeedback(slug: string, feedback: Feedback): boolean {
  try { localStorage.setItem(key(slug), JSON.stringify(feedback)); window.dispatchEvent(new Event(event)); return true; } catch { return false; }
}

export function useFeedbackCollection(slugs: string[]): Record<string, Feedback> {
  const raw = useSyncExternalStore(subscribe, () => JSON.stringify(slugs.map(slug => snapshot(slug))), () => "[]");
  const values: (string | null)[] = JSON.parse(raw);
  return Object.fromEntries(slugs.map((slug, index) => [slug, parseFeedback(values[index] ?? null)]));
}
