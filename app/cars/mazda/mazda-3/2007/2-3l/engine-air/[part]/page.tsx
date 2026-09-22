import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { partGuides } from "../guides";
import PartGuideTemplate, { PartPageShell } from "../PartGuideTemplate";
import { engineAirParts } from "../parts";

type PartPageProps = { params: Promise<{ part: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return engineAirParts.map(({ slug }) => ({ part: slug }));
}

export async function generateMetadata({ params }: PartPageProps): Promise<Metadata> {
  const { part: slug } = await params;
  const part = engineAirParts.find(p => p.slug === slug);
  return part ? { title: `${part.title} — 2007 Mazda 3 2.3L`, description: part.detail } : {};
}

export default async function EngineAirPartPage({ params }: PartPageProps) {
  const { part: slug } = await params;
  const part = engineAirParts.find(p => p.slug === slug);
  if (!part) notFound();

  const guide = partGuides[part.slug];
  if (guide) return <PartGuideTemplate part={part} guide={guide} />;

  return (
    <PartPageShell part={part}>
      <section className="mx-auto max-w-7xl px-6 py-14 md:py-20">
        <div className="max-w-3xl rounded-2xl border border-neutral-200 p-6 md:p-8">
          <span className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold">Guide being built</span>
          <p className="mt-5 text-lg leading-8 text-neutral-600">The full {part.title} guide for this vehicle is still being written. Check back soon, or head back to Engine &amp; Air to browse the other parts.</p>
        </div>
      </section>
    </PartPageShell>
  );
}
