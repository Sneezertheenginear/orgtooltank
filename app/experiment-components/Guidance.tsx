import type { ReactNode } from "react";

// Shared first-use guidance for browser experiments. Plain text on the page, visually secondary
// to the tool itself: no overlays, tours, or popups.

/** One short line near a tool's first action: what to do first, and what the tool does next. */
export function QuickStart({ children }: { children: ReactNode }) {
  return <p className="quick-start"><strong>Quick start:</strong> {children}</p>;
}

/** A short hint after an action completes, pointing to the next move. */
export function NextStep({ children }: { children: ReactNode }) {
  return <p className="next-step"><strong>Next:</strong> {children}</p>;
}
