import Link from "next/link";
import type { Experiment } from "../data/experiments";
export default function ExperimentActions({ experiment, showDetail = false }: { experiment: Experiment; showDetail?: boolean }) {
  return <div className="experiment-actions">
    {experiment.browserAvailable && <Link className="ink-button" href={experiment.browserRoute}>Try in browser ↗</Link>}
    {showDetail && <Link className="text-link" href={`/experiments/${experiment.slug}`}>View experiment ↗</Link>}
    {experiment.desktopAvailable
      ? <Link className="text-link" href={experiment.desktopRoute}>Desktop version available ↗</Link>
      : <Link className="text-link" href={`/request-app?experiment=${experiment.slug}`}>Request desktop version ↗</Link>}
  </div>;
}
