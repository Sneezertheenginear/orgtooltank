import Shell from "../experiment-components/Shell";
import RequestForm from "./RequestForm";
import { experiments } from "../data/experiments";
export const metadata = { title: "Request an App", description: "Tell me what you want built. Desktop versions and customizations priced around your needs." };
export default async function RequestApp({ searchParams }: { searchParams: Promise<{ experiment?: string }> }) {
  const { experiment } = await searchParams;
  return <Shell><div className="wrap page-space narrow-page"><p className="eyebrow">Let’s see what we can build</p><h1 className="page-title">Your version<br />of an idea.</h1><p className="page-intro">Want an experiment as a desktop app? Extra features? Something that fits the way you work? Tell me about it.</p><div className="as-is-note"><p>Pricing depends on what you want built. There’s no universal price. I’ll look at your request and we’ll discuss what’s possible and what it would cost.</p></div><RequestForm initialExperiment={experiments.some(e => e.slug === experiment) ? experiment! : ""} /></div></Shell>;
}
