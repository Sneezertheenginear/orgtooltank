import Link from "next/link";
export default function DesktopRequest({ slug }: { slug?: string }) {
  return <section className="desktop-note">
    <div><p className="eyebrow">A different version of the same idea</p><h2>Want this as a<br />desktop app?</h2></div>
    <div className="prose-copy"><p>Like one of these ideas enough to want your own desktop version? Tell me what you want it to do.</p><p>Maybe you want the same idea as a simple desktop app. Maybe you want extra features. Maybe you want it customized for your workflow or business.</p><p>Tell me what you want built, and I’ll tell you what I can do and what it would cost.</p><Link className="ink-button" href={slug ? `/request-app?experiment=${encodeURIComponent(slug)}` : "/request-app"}>Request a desktop version <span aria-hidden="true">↗</span></Link><p className="small-note">No fixed price. We’ll talk about what you need first.</p></div>
  </section>;
}
