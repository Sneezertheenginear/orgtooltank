// Live View's connection state, kept in one place so the page can never blur the three cases:
// - disconnected: no real traffic source. Nothing moves; sample data is labeled as sample.
// - demo: the user chose Preview Demo. Sample traffic streams, with a DEMO MODE banner.
// - live: a real traffic source is connected. Only then does the page say LIVE and "Watching: <site>".
// No real source exists yet, so "live" can't happen until a connection is built and passed in.
import type { Req } from "./engine";

/** What a real connection will provide. Nothing creates one yet. */
export type LiveSource = { site: string; status: "connected" | "reconnecting"; connectedAt: number; lastEventAt: number | null; events: Req[] };
export type ConnectionState = "disconnected" | "demo" | "live";

export function connectionState(source: LiveSource | null, demoRunning: boolean): ConnectionState {
  if (source) return "live";
  return demoRunning ? "demo" : "disconnected";
}

export const statusLabel: Record<ConnectionState, string> = { disconnected: "Not connected", demo: "Demo", live: "Live" };

/** "just now", "12 sec ago", "3 min ago", "2 hr ago". */
export function ago(then: number | null, now: number): string {
  if (then === null) return "nothing yet";
  const s = Math.max(0, Math.round((now - then) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s} sec ago`;
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  return `${Math.floor(s / 3600)} hr ago`;
}

/** How long a connection has been up: "45 sec", "12 min", "3 hr 5 min". */
export function connectedFor(since: number, now: number): string {
  const s = Math.max(0, Math.round((now - since) / 1000));
  if (s < 60) return `${s} sec`;
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return m ? `${h} hr ${m} min` : `${h} hr`;
}
