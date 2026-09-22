import type { ReactNode } from "react";
import Link from "next/link";
import Header from "@/app/Header";
import Footer from "@/app/Footer";
import Breadcrumbs, { vehicleCrumbs } from "./Breadcrumbs";
import PartFigure from "./PartFigure";
import type { PartGuide } from "./guides/types";
import { ENGINE_AIR_PATH, VEHICLE_LABEL, type EngineAirPart } from "./parts";

/** Page chrome shared by every Engine & Air part page: header, breadcrumb, back link. */
export function PartPageShell({ part, children }: { part: EngineAirPart; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Header />
      <main id="main-content">
        <section className="border-b border-black/10 bg-neutral-50">
          <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
            <Link href={ENGINE_AIR_PATH} className="inline-block text-sm font-bold underline-offset-4 hover:underline">← Back to Engine &amp; Air</Link>
            <div className="mt-6"><Breadcrumbs items={[...vehicleCrumbs, { label: "Engine & Air", href: ENGINE_AIR_PATH }, { label: part.title }]} /></div>
            <p className="mt-10 text-sm font-bold uppercase tracking-[0.18em] text-neutral-500">{VEHICLE_LABEL} · Engine &amp; Air</p>
            <h1 className="mt-4 text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">{part.title}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-600 md:text-xl">{part.detail}</p>
          </div>
        </section>
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default function PartGuideTemplate({ part, guide }: { part: EngineAirPart; guide: PartGuide }) {
  const specs = [
    { label: "Part name", value: guide.partName },
    { label: "System", value: guide.system },
    { label: "Vehicle", value: VEHICLE_LABEL },
    { label: "OEM Mazda part number", value: guide.oemPartNumber },
    { label: "Status", value: guide.status },
  ];

  return (
    <PartPageShell part={part}>
      <section aria-label="Part and location illustrations" className="mx-auto grid max-w-7xl gap-6 px-6 py-10 md:py-14 lg:grid-cols-2">
        <PartFigure id="part-figure-title" figure={guide.partFigure} />
        <PartFigure id="location-figure-title" figure={guide.locationFigure} />
      </section>

      <section aria-labelledby="info-heading" className="mx-auto max-w-7xl px-6 pb-14 md:pb-20">
        <h2 id="info-heading" className="text-3xl font-black tracking-tight md:text-4xl">Part information</h2>
        <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-200">
          <dl className="grid gap-x-8 gap-y-6 p-6 sm:grid-cols-2 md:p-8 lg:grid-cols-3">
            {specs.map(spec => (
              <div key={spec.label}>
                <dt className="text-xs font-bold uppercase tracking-widest text-neutral-500">{spec.label}</dt>
                <dd className="mt-2 text-lg font-semibold leading-7">
                  {spec.value ?? <span className="inline-block rounded-full border border-neutral-300 bg-neutral-50 px-3 py-1 text-base">Verification in progress</span>}
                </dd>
              </div>
            ))}
          </dl>
          <div className="grid gap-4 border-t border-neutral-200 bg-neutral-50 p-6 md:grid-cols-3 md:p-8">
            {guide.notes.map(note => (
              <div key={note.title} className="rounded-xl border border-neutral-200 bg-white p-5">
                <h3 className="text-base font-bold">{note.title}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-600">{note.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="About this part" className="mx-auto max-w-7xl px-6 pb-14 md:pb-20">
        <div className="grid gap-5 md:grid-cols-2">
          {guide.sections.map(section => (
            <article key={section.heading} className="rounded-2xl border border-neutral-200 p-6 md:p-8">
              <h2 className="text-2xl font-black tracking-tight">{section.heading}</h2>
              {section.body && <p className="mt-4 text-base leading-7 text-neutral-600">{section.body}</p>}
              {section.items && <ul className="mt-4 space-y-2 text-base leading-7">{section.items.map(item => <li key={item} className="border-l-2 border-neutral-300 pl-4">{item}</li>)}</ul>}
              {section.note && <p className="mt-5 border-t border-neutral-100 pt-4 text-sm leading-6 text-neutral-500">{section.note}</p>}
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="outline-heading" className="border-y border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-7xl px-6 py-14 md:py-20">
          <h2 id="outline-heading" className="text-3xl font-black tracking-tight md:text-4xl">Repair guide structure</h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-neutral-600">Every part page will follow this same structure. Here is what the {part.title} guide will cover as it is built.</p>
          <ol className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {guide.guideOutline.map((step, index) => (
              <li key={step.title} className="rounded-xl border border-neutral-200 bg-white p-6">
                <div className="flex items-center justify-between"><span className="font-mono text-xs text-neutral-500">0{index + 1}</span><span className="text-xs font-medium text-neutral-500">Planned</span></div>
                <h3 className="mt-4 text-xl font-bold tracking-tight">{step.title}</h3>
                <p className="mt-2 text-base leading-7 text-neutral-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <Link href={ENGINE_AIR_PATH} className="font-bold underline underline-offset-4">← Back to Engine &amp; Air</Link>
      </div>
    </PartPageShell>
  );
}
