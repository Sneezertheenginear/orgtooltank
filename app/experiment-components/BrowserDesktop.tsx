import Link from "next/link";
import type { ReactNode } from "react";
import type { Experiment } from "../data/experiments";

/**
 * Browser Ready experiments: only a Details control that starts closed. The page's own controls
 * already offer Try in browser and Request desktop version, so nothing is repeated here. Details holds
 * the tool-specific information (how data is handled, browser constraints, what a desktop version
 * could offer). `children` adds extra tool-specific detail text inside Details.
 * `desktopLink` shows the desktop request (or desktop version) link inside Details. Pages that already
 * show that link at the top (the experiment detail pages) turn it off so it isn’t repeated.
 * Experiments without a browser version keep the original section unchanged.
 */
export default function BrowserDesktop({ experiment, desktopLink = true, children }: { experiment: Experiment; desktopLink?: boolean; children?: ReactNode }) {
  if (!experiment.browserAvailable) return <section className="browser-desktop prose-copy">
    <h2>Browser version</h2>
    <p>{experiment.status === "Browser Version In Progress" ? "The browser version is being worked on, but isn’t available to try yet." : "This project does not have a working browser version here yet. This page is its place in the collection, with room for your feedback while conversion is still ahead."}</p>
    <h3>Known limitations</h3><ul>{experiment.limitations.map(item => <li key={item}>{item}</li>)}</ul>
    <h3>{experiment.desktopAvailable ? "About the desktop version" : "What a desktop version could offer"}</h3>
    <ul>{experiment.desktopBenefits.map(item => <li key={item}>{item}</li>)}</ul>
  </section>;

  return <section className="browser-desktop browser-use" aria-label={`${experiment.title} details`}>
    <details className="browser-details">
      <summary>Details</summary>
      <div className="browser-details-body prose-copy">
        {experiment.versionSummary ? <>
          <p><strong>In your browser:</strong> {experiment.versionSummary.browser}</p>
          <p><strong>Desktop version:</strong> {experiment.versionSummary.desktop}</p>
        </> : <>
          <p>This is the browser experiment. You can use it here without installing anything.</p>
          <p>Browsers limit what a website can access on your computer, so some features may be unavailable here. A desktop version can usually work more directly with your files, folders, devices, or operating system.</p>
        </>}
        {children}
        <p className="details-label">How this browser version works</p>
        <ul>{experiment.limitations.map(item => <li key={item}>{item}</li>)}</ul>
        <p className="details-label">{experiment.desktopAvailable ? "About the desktop version" : "What a desktop version could offer"}</p>
        <ul>{experiment.desktopBenefits.map(item => <li key={item}>{item}</li>)}</ul>
        {desktopLink && <p>{experiment.desktopAvailable
          ? <Link className="text-link" href={experiment.desktopRoute}>Desktop version available ↗</Link>
          : <>If you like this idea and want a desktop or custom version, tell me what you want it to do. <Link className="text-link" href={`/request-app?experiment=${encodeURIComponent(experiment.slug)}`}>Request desktop version ↗</Link></>}</p>}
      </div>
    </details>
  </section>;
}
