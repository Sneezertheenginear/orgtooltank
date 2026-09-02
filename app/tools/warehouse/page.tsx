import Header from "../../Header";
import Footer from "../../Footer";
import Link from "next/link";
import DepartmentMotion from "../../DepartmentMotion";

const tools = [
  {
    name: "Inventory Count Helper",
    description:
      "Track item counts, locations, and inventory checks without building a complicated warehouse system.",
  },
  {
    name: "Stock Location Organizer",
    description:
      "Keep track of where products, parts, supplies, and materials are stored inside a warehouse.",
  },
  {
    name: "Receiving Checklist",
    description:
      "Organize incoming shipments, quantities, condition checks, and receiving notes in one simple workflow.",
  },
  {
    name: "Pick & Pack Helper",
    description:
      "Help workers organize picking, packing, and order preparation without unnecessary complexity.",
  },
];

export default function WarehousePage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#171717]">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-black/10">
        <DepartmentMotion type="warehouse" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 md:py-28">
          <Link
            href="/tools"
            className="mb-8 inline-block text-sm text-black/50 transition hover:text-black"
          >
            ← Back to Tools
          </Link>

          <p className="mb-4 text-sm uppercase tracking-[0.28em] text-black/45">
            OrgToolTank Department
          </p>

          <h1 className="text-5xl font-semibold tracking-tight md:text-6xl">
            Warehouse
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-black/60">
            Practical software for inventory, movement, receiving, picking,
            organization, tracking, and everyday warehouse work.
          </p>
        </div>
      </section>

      {/* Department Intro */}
      <section className="border-b border-black/10">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <h2 className="text-2xl font-semibold">
            Small tools for work that keeps products moving.
          </h2>

          <p className="mt-4 max-w-3xl leading-7 text-black/60">
            This department focuses on the repetitive jobs around inventory,
            stock locations, incoming shipments, picking, packing, supplies, and
            warehouse records that workers deal with every day.
          </p>
        </div>
      </section>

      {/* Tools */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-black/40">
              Warehouse Tools
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Built around real warehouse workflows.
            </h2>
          </div>

          <p className="max-w-md text-sm leading-6 text-black/50 md:text-right">
            More tools will be added here as OrgToolTank expands the Warehouse
            department.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {tools.map((tool) => (
            <div
              key={tool.name}
              className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-xl font-semibold">{tool.name}</h3>

                <span className="shrink-0 rounded-full border border-black/10 px-3 py-1 text-xs text-black/45">
                  Coming soon
                </span>
              </div>

              <p className="mt-4 max-w-xl leading-7 text-black/55">
                {tool.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
