import type { Metadata } from "next";
import AutoPage, { TopicCards } from "../AutoPage";

export const metadata: Metadata = { title: "How Cars Work", description: "A car is a collection of systems working together. Start with what each one does, then build an understanding of how they connect." };
const topics = [{"title": "Engine & cooling", "text": "The engine turns fuel into motion. The cooling system manages the heat produced along the way."}, {"title": "Transmission & drivetrain", "text": "These parts transfer power from the engine to the wheels and match it to the speed of the car."}, {"title": "Brakes", "text": "The braking system uses friction to slow the wheels and bring the car to a stop."}, {"title": "Suspension & steering", "text": "These systems help the tires stay in contact with the road and let you control the direction of travel."}, {"title": "Electrical & starting", "text": "The battery, starter, charging system, and wiring supply and distribute the power the car needs."}, {"title": "Heating & air conditioning", "text": "These systems manage cabin temperature and help keep the windows clear."}];

export default function Page() {
  return <AutoPage eyebrow="Understand the basics" title="The systems behind every journey." intro="A car is a collection of systems working together. Start with what each one does, then build an understanding of how they connect.">
    <section aria-labelledby="topics-heading"><h2 id="topics-heading" className="mb-8 text-3xl font-bold">Explore the main systems</h2><TopicCards items={topics} /></section>
    <aside className="rounded-2xl border border-neutral-200 p-7"><h2 className="text-xl font-bold">The library is taking shape</h2><p className="mt-3 max-w-3xl text-lg leading-8 text-neutral-600">These are introductions to the topics we will cover. Detailed explanations and vehicle-specific procedures are still to come.</p></aside>
  </AutoPage>;
}
