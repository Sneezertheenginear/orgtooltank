import type { Experiment } from "../data/experiments";
export default function BrowserDesktop({ experiment }: { experiment: Experiment }) {
  return <section className="browser-desktop prose-copy">
    <h2>{experiment.browserAvailable ? "Browser vs Desktop" : "Browser version"}</h2>
    {experiment.browserAvailable ? <>
      <p>This is the browser experiment. You can use it here without installing anything.</p>
      <p>Browsers limit what a website can access on your computer, so some features may be unavailable here.</p>
      <p>A desktop version can usually work more directly with your files, folders, devices, or operating system.</p>
      <p>If you like this idea and want a desktop version or custom version, tell me what you want it to do.</p>
    </> : <p>{experiment.status === "Browser Version In Progress" ? "The browser version is being worked on, but isn’t available to try yet." : "This project does not have a working browser version here yet. This page is its place in the collection, with room for your feedback while conversion is still ahead."}</p>}
    <h3>Known limitations</h3><ul>{experiment.limitations.map(item => <li key={item}>{item}</li>)}</ul>
    <h3>{experiment.desktopAvailable ? "About the desktop version" : "What a desktop version could offer"}</h3>
    <ul>{experiment.desktopBenefits.map(item => <li key={item}>{item}</li>)}</ul>
  </section>;
}
