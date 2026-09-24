"use client";

// Browser side of shared feedback. Counts come from the server (never computed here), and all the
// cards on a page share one batched request instead of one request each.
import { useEffect, useSyncExternalStore } from "react";

export type Vote = "like" | "unlike";
export type Counts = { like: number; unlike: number; comments: number };
export type Entry = { counts: Counts; mine: Vote | null } | "unavailable";

const cache = new Map<string, Entry>();
const queued = new Set<string>();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | null = null;
let version = 0;
const notify = () => { version++; listeners.forEach(listener => listener()); };
const zero: Counts = { like: 0, unlike: 0, comments: 0 };

async function flush() {
  timer = null;
  const slugs = [...queued]; queued.clear();
  for (let i = 0; i < slugs.length; i += 50) {
    const chunk = slugs.slice(i, i + 50);
    try {
      const response = await fetch(`/api/feedback?slugs=${encodeURIComponent(chunk.join(","))}`, { cache: "no-store" });
      if (!response.ok) throw new Error(String(response.status));
      const data = await response.json() as { counts: Record<string, Counts>; mine: Record<string, Vote | null> };
      for (const slug of chunk) cache.set(slug, { counts: data.counts[slug] ?? zero, mine: data.mine?.[slug] ?? null });
    } catch {
      for (const slug of chunk) cache.set(slug, "unavailable");
    }
  }
  notify();
}

function request(slugs: string[]) {
  for (const slug of slugs) if (slug && !cache.has(slug)) queued.add(slug);
  if (queued.size && !timer) timer = setTimeout(flush, 0);
}

/** Updates one experiment's counts after this browser votes. */
export function setEntry(slug: string, entry: Entry) { cache.set(slug, entry); notify(); }

const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
/** Shared counts (and this browser's own vote) for the given experiments. undefined while loading. */
export function useFeedbackEntries(slugs: string[]): Record<string, Entry | undefined> {
  const key = slugs.join(",");
  useEffect(() => request(key.split(",")), [key]);
  useSyncExternalStore(subscribe, () => version, () => 0);
  return Object.fromEntries(slugs.map(slug => [slug, cache.get(slug)]));
}

/** POSTs JSON to a feedback endpoint and returns the status with the parsed reply. */
export async function postFeedback(url: string, body: Record<string, unknown>): Promise<{ status: number; data: Record<string, unknown> }> {
  try {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
    const data = await response.json().catch(() => ({})) as Record<string, unknown>;
    return { status: response.status, data };
  } catch {
    return { status: 0, data: {} };
  }
}
