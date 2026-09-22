import Shell from "../experiment-components/Shell";
import ExperimentBrowser from "./ExperimentBrowser";
import { categories } from "../data/experiments";
export const metadata = { title: "Experiments", description: "Browse rough ideas, working experiments, and whatever comes next." };
export default async function ExperimentsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const initial = categories.some(c => c.id === category) ? category! : "all";
  return <Shell><div className="wrap page-space"><p className="eyebrow">The open workbench</p><h1 className="page-title">Experiments.</h1><p className="page-intro">Useful, strange, unfinished. Pick something up and see what it does.</p><ExperimentBrowser key={initial} initialCategory={initial} /></div></Shell>;
}
