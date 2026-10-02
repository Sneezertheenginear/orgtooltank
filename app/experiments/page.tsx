import Shell from "../experiment-components/Shell";
import ExperimentBrowser from "./ExperimentBrowser";
import { categories } from "../data/experiments";
import DonateButton from "../experiment-components/DonateButton";
export const metadata = { title: "Experiments", description: "Browse rough ideas, working experiments, and whatever comes next." };
export default async function ExperimentsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const initial = categories.some(c => c.id === category) ? category! : "all";
  return <Shell><div className="wrap page-space"><p className="eyebrow">The open workbench</p><h1 className="page-title">Experiments.</h1><p className="page-intro">Useful, strange, unfinished. Pick something up and see what it does.</p>{/* Site-level donation. Goes straight to the donation payment link (opens in a new tab); donating is optional.
     NOTE: DONATION_URL in app/data/support.ts is still null until the real donation link is added, so the button
     is shown but can't be clicked. Do not point it at a placeholder or test checkout. */}
    <div className="site-donate">
      <DonateButton />
      <p>OrgToolTank browser tools are free. Donations help cover hosting, development, and maintenance so we can keep them free for everyone.</p>
    </div><ExperimentBrowser key={initial} initialCategory={initial} /></div></Shell>;
}
