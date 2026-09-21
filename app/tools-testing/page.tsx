import type { Metadata } from "next";
import AutoPage, { TopicCards } from "../AutoPage";

export const metadata: Metadata = { title: "Tools & Testing", description: "Get familiar with the tools used around a car and the purpose of testing. This is a starting point for the learning library, with detailed tool and testing guides to follow." };
const topics = [{"title": "Hand tools", "text": "Sockets, wrenches, and screwdrivers help with access and fasteners. The right fit matters as much as the tool itself."}, {"title": "Diagnostic tools", "text": "A scan tool reads information from the car’s computers. A trouble code is a starting point for investigation, not a verdict on which part to replace."}, {"title": "Electrical testing", "text": "A multimeter measures electrical values such as voltage and resistance. The correct setting and test method depend on the circuit."}, {"title": "Inspection & observation", "text": "A clear description of the symptom, when it happens, and what has changed helps give testing a direction."}, {"title": "Measurements & specifications", "text": "Test results need something to compare against. Specifications must match the vehicle, engine, and procedure."}, {"title": "Workspace & support equipment", "text": "Lighting, protective equipment, and correctly rated vehicle supports are part of preparing for a job."}];

export default function Page() {
  return <AutoPage eyebrow="Understand before replacing" title="Good repairs start with good information." intro="Get familiar with the tools used around a car and the purpose of testing. This is a starting point for the learning library, with detailed tool and testing guides to follow.">
    <section aria-labelledby="topics-heading"><h2 id="topics-heading" className="mb-8 text-3xl font-bold">Explore tools and testing</h2><TopicCards items={topics} /></section>
    <aside className="rounded-2xl border border-neutral-200 p-7"><h2 className="text-xl font-bold">The library is taking shape</h2><p className="mt-3 max-w-3xl text-lg leading-8 text-neutral-600">These are introductions to the topics we will cover. Detailed explanations and vehicle-specific procedures are still to come.</p></aside>
  </AutoPage>;
}
