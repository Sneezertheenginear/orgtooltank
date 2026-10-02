import DonateLink from "./DonateLink";

/**
 * A quiet note at the bottom of each free browser tool: the tool is free, and donations help keep it that
 * way. Shown once per tool page, below everything else, so it never gets in the way of using the tool.
 * The button opens the donation link directly (see data/support.ts), or the /support page until it's set.
 */
export default function SupportNote() {
  return <aside className="support-note" aria-label="Support OrgToolTank">
    <p>This tool is free. Donations help keep it that way.</p>
    <DonateLink className="support-note-button">Support OrgToolTank</DonateLink>
  </aside>;
}
