import Header from "../../Header";
import Footer from "../../Footer";
import DepartmentMotion from "../../DepartmentMotion";
import Link from "next/link";

const truckingTools = [
  {
    name: "Load Tracker",
    description:
      "Keep track of loads, pickup details, delivery status, and important trip information in one simple place.",
    status: "Coming soon",
  },
  {
    name: "Driver Paperwork Helper",
    description:
      "Organize common driver paperwork, documents, receipts, and recurring records without a complicated system.",
    status: "Coming soon",
  },
  {
    name: "Route & Stop Organizer",
    description:
      "Plan stops, keep route notes together, and make everyday trip information easier to manage.",
    status: "Coming soon",
  },
  {
    name: "Truck Expense Tracker",
    description:
      "Track fuel, repairs, tolls, supplies, and other operating expenses with a focused local tool.",
    status: "Coming soon",
  },
];

export default function TruckingPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#171717]">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-black/10">
        <DepartmentMotion type="trucking" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="max-w-3xl">
            <Link
              href="/tools"
              className="mb-6 inline-block text-sm text-black/50 transition hover:text-black"
            >
              ← Back to Tools
            </Link>

            <p className="mb-4 text-sm font-medium uppercase tracking-[0.22em] text-black/45">
              OrgToolTank Department
            </p>

            <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
              Trucking
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-black/60">
              Focused software for drivers, loads, paperwork, routes,
              transportation records, and everyday trucking workflows.
            </p>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="border-b border-black/10">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight">
              Small tools for work that keeps moving.
            </h2>

            <p className="mt-4 leading-7 text-black/60">
              This department focuses on the repetitive jobs around loads,
              routes, paperwork, expenses, stops, and records that drivers and
              small transportation businesses deal with every day.
            </p>
          </div>
        </div>
      </section>

      {/* Tools */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-black/40">
                Trucking Tools
              </p>

              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Built around real road workflows.
              </h2>
            </div>

            <p className="hidden max-w-md text-right text-sm leading-6 text-black/50 md:block">
              More tools will be added here as OrgToolTank expands the Trucking
              department.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {truckingTools.map((tool) => (
              <article
                key={tool.name}
                className="rounded-2xl border border-black/10 bg-white p-7 shadow-sm"
              >
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h3 className="text-xl font-semibold">{tool.name}</h3>

                    <p className="mt-3 max-w-xl leading-7 text-black/55">
                      {tool.description}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full border border-black/10 bg-[#f7f7f4] px-3 py-1 text-xs font-medium text-black/45">
                    {tool.status}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
