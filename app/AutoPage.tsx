import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

export default function AutoPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return <div className="min-h-screen bg-white text-neutral-900">
    <a href="#main-content" className="skip-link">Skip to content</a>
    <Header />
    <main id="main-content">
      <section className="border-b border-black/10 bg-neutral-50">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-neutral-500">{eyebrow}</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">{title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-600 md:text-xl">{intro}</p>
        </div>
      </section>
      <div className="mx-auto max-w-7xl space-y-16 px-6 py-16 md:py-20">{children}</div>
    </main>
    <Footer />
  </div>;
}

export function TopicCards({ items }: { items: { title: string; text: string }[] }) {
  return <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{items.map((item, index) => <article key={item.title} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-7">
    <p className="text-sm font-semibold text-neutral-500">{String(index + 1).padStart(2, "0")}</p>
    <h3 className="mt-5 text-2xl font-bold tracking-tight">{item.title}</h3>
    <p className="mt-3 text-lg leading-8 text-neutral-600">{item.text}</p>
  </article>)}</div>;
}
