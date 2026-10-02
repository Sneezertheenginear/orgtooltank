import Link from "next/link";
import Shell from "../experiment-components/Shell";
import DonateButton from "../experiment-components/DonateButton";

export const metadata = { title: "Support OrgToolTank", description: "OrgToolTank’s browser tools are free to use. Donations help cover hosting, development, and maintenance so they can stay free." };

export default function SupportPage() {
  return <Shell><div className="wrap page-space narrow-page">
    <p className="eyebrow">Support OrgToolTank</p>
    <h1 className="page-title">Keep the tools free.</h1>
    <div className="prose-copy support-copy">
      <p>These tools are free to use. If they’ve helped you, consider supporting OrgToolTank. Donations help cover hosting, development, and maintenance so we can keep these tools free for everyone.</p>
      <div className="site-donate"><DonateButton /></div>
      <p>Donating is optional. Every tool works the same either way.</p>
      <p><Link className="text-link" href="/experiments">← Back to the tools</Link></p>
    </div>
  </div></Shell>;
}
