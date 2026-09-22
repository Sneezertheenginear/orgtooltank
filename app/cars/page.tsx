import type { Metadata } from "next";
import Link from "next/link";
import AutoPage from "../AutoPage";

export const metadata: Metadata = { title: "Cars", description: "Explore the growing OrgToolTank vehicle library, organized by make, model, year, engine, and repair system." };
const vehiclePath = [{ label: "Make", value: "Mazda" }, { label: "Model", value: "Mazda 3" }, { label: "Year", value: "2007" }, { label: "Engine", value: "2.3L" }, { label: "Browse by", value: "Repair system" }];

export default function CarsPage() {
  return <AutoPage eyebrow="Cars / Vehicle library" title="Start with your car." intro="Repair information should match the vehicle in front of you. The library narrows things down by make, model, year, and engine before you choose a repair system.">
    <section className="rounded-2xl border border-neutral-300 p-6"><h2 className="text-2xl font-bold">The Mazda 3 experiment is open.</h2><p className="my-4 text-neutral-600">Explore the growing repair library, illustrations, and Engine &amp; Air guides.</p><Link href="/experiments/mazda-3" className="font-bold underline underline-offset-4">Open the Mazda 3 experiment →</Link></section>
    <section aria-labelledby="vehicle-heading" className="rounded-2xl border border-neutral-200 p-6 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4"><h2 id="vehicle-heading" className="text-3xl font-bold">First vehicle on the workbench</h2><span className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold">Growing experiment</span></div>
      <p className="mt-4 text-lg leading-8 text-neutral-600">Mazda 3 · 2007 · 2.3L. Here is how you will find the right information:</p>
      <ol aria-label="Planned vehicle hierarchy" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{vehiclePath.map((step, index) => <li key={step.label} className="rounded-xl bg-neutral-50 p-5"><p className="text-sm text-neutral-500">{index + 1}. {step.label}</p><p className="mt-2 text-xl font-bold">{step.value}</p></li>)}</ol>
      <h3 className="mt-10 text-xl font-bold">Repair systems on the workbench</h3>
      <ul className="mt-4 grid gap-3 text-lg text-neutral-600 sm:grid-cols-2 lg:grid-cols-3">{["Engine & cooling", "Brakes", "Suspension & steering", "Electrical & starting", "Transmission & drivetrain", "Heating & air conditioning"].map(system => <li key={system} className="border-l-2 border-neutral-300 pl-4">{system}</li>)}</ul>
      <p className="mt-8 text-base leading-7 text-neutral-600">Engine & Air guides are available through the Mazda 3 experiment. Other repair systems are still taking shape.</p>
    </section>
    <section><h2 className="text-2xl font-bold">Build your understanding first</h2><p className="mt-3 max-w-2xl text-lg leading-8 text-neutral-600">Explore the main systems of a car while the vehicle library takes shape.</p><Link href="/how-cars-work" className="mt-5 inline-block font-bold underline underline-offset-4">Explore How Cars Work →</Link></section>
  </AutoPage>;
}
