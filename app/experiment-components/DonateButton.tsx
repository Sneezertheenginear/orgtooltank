import { DONATION_URL } from "../data/support";

/**
 * The site's donate button: "Donate — help keep the tools free" (shown in capitals). Used on the
 * Experiments page and the /support page so it looks the same everywhere.
 * It opens the donation link (data/support.ts) directly, in a new tab. Until that link is set, the button
 * stays visible but can't be clicked, with no message to visitors.
 */
export default function DonateButton() {
  return DONATION_URL
    ? <a className="ink-button site-donate-button" href={DONATION_URL} target="_blank" rel="noopener noreferrer">Donate — help keep the tools free</a>
    : <button type="button" className="ink-button site-donate-button" disabled>Donate — help keep the tools free</button>;
}
