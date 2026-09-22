import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/app/Header";
import Footer from "@/app/Footer";
import Breadcrumbs, { vehicleCrumbs } from "./Breadcrumbs";
import { ENGINE_AIR_PATH, engineAirParts } from "./parts";

export const metadata: Metadata = {
  title: "Engine & Air — 2007 Mazda 3 2.3L",
  description: "Understand the parts that control airflow, crankcase ventilation, combustion support, and engine operation on the 2007 Mazda 3 2.3L.",
};

const airPath = ["Intake", "Air filter / air metering", "Throttle body", "Intake manifold", "Engine"];

const cardMotion = "motion-safe:transition motion-safe:duration-200 motion-safe:hover:-translate-y-1 hover:border-neutral-400 hover:shadow-sm";

export default function EngineAirPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Header />
      <main id="main-content">
        <section className="border-b border-black/10 bg-neutral-50">
          <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
            <Link href="/cars" className="inline-block text-sm font-bold underline-offset-4 hover:underline">← Back to Mazda 3</Link>
            <div className="mt-6"><Breadcrumbs items={[...vehicleCrumbs, { label: "Engine & Air" }]} /></div>
            <p className="mt-10 text-sm font-bold uppercase tracking-[0.18em] text-neutral-500">2007 Mazda 3 — 2.3L</p>
            <h1 className="mt-4 text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">Engine &amp; Air</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-600 md:text-xl">Understand the parts that control airflow, crankcase ventilation, combustion support, and engine operation before you start replacing anything.</p>
          </div>
        </section>

        <section aria-labelledby="parts-heading" className="mx-auto max-w-7xl px-6 py-14 md:py-20">
          <h2 id="parts-heading" className="text-3xl font-black tracking-tight md:text-4xl">What are you working on?</h2>
          <ul className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {engineAirParts.map(part => (
              <li key={part.slug}>
                <Link href={`${ENGINE_AIR_PATH}/${part.slug}`} className={`group flex h-full min-h-44 flex-col rounded-2xl border border-neutral-200 bg-white p-6 md:p-7 ${cardMotion}`}>
                  <h3 className="text-2xl font-bold tracking-tight">{part.title}</h3>
                  <p className="mt-3 text-base leading-7 text-neutral-600">{part.detail}</p>
                  <span className="mt-auto pt-6 text-sm font-bold">Open <span aria-hidden="true">→</span><span className="sr-only"> {part.title}</span></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="learn-heading" className="border-y border-neutral-200 bg-neutral-50">
          <div className="mx-auto max-w-7xl px-6 py-14 md:py-20">
            <h2 id="learn-heading" className="text-3xl font-black tracking-tight md:text-4xl">Learn the system first</h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-neutral-600">Your engine needs a steady supply of clean air. Following the path that air takes makes it much easier to tell which part is involved when something feels off.</p>
            <ol aria-label="Engine air path" className="mt-9 grid gap-3 md:grid-cols-5">
              {airPath.map((step, index) => (
                <li key={step} className="relative rounded-xl border border-neutral-200 bg-white p-5">
                  <p className="font-mono text-xs text-neutral-500">0{index + 1}</p>
                  <p className="mt-2 text-lg font-bold leading-snug">{step}</p>
                  {index < airPath.length - 1 && <span aria-hidden="true" className="absolute -bottom-3.5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-neutral-50 px-1 text-sm leading-none text-neutral-400 md:-right-3.5 md:bottom-auto md:left-auto md:top-1/2 md:-translate-y-1/2 md:translate-x-0 md:px-0"><span className="md:hidden">↓</span><span className="hidden md:inline">→</span></span>}
                </li>
              ))}
            </ol>
            <div className="mt-9 max-w-3xl rounded-2xl border border-neutral-200 bg-white p-6 md:p-8">
              <h3 className="text-xl font-bold">The PCV system runs separately</h3>
              <p className="mt-3 text-base leading-7 text-neutral-600">While the engine runs, a little combustion gas slips past the pistons into the crankcase. The PCV system handles those crankcase vapors on their own path and routes them back into the intake system, so they are burned instead of building up pressure inside the engine.</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="bay-heading" className="mx-auto max-w-7xl px-6 py-14 md:py-20">
          <figure>
            <div className="flex aspect-[16/10] w-full items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-6 text-center md:aspect-[21/9]">
              <h2 id="bay-heading" className="text-2xl font-black tracking-tight text-neutral-700 sm:text-3xl">2007 Mazda 3 2.3L Engine Bay</h2>
            </div>
            <figcaption id="bay-caption" className="mt-4 text-center text-base font-semibold text-neutral-500">Interactive part locations coming next</figcaption>
          </figure>
        </section>
      </main>
      <Footer />
    </div>
  );
}
