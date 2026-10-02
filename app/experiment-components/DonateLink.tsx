import Link from "next/link";
import type { ReactNode } from "react";
import { DONATION_URL } from "../data/support";

/**
 * A link that donates directly: it opens the donation payment link (data/support.ts) in a new tab, so the
 * tool or page stays open. Until that link is set, it goes to the /support page instead.
 */
export default function DonateLink({ className, current, children }: { className?: string; current?: boolean; children: ReactNode }) {
  return DONATION_URL
    ? <a className={className} href={DONATION_URL} target="_blank" rel="noopener noreferrer">{children}</a>
    : <Link className={className} href="/support" aria-current={current ? "page" : undefined}>{children}</Link>;
}
