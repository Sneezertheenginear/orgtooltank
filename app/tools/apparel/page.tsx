import Header from "../../Header";
import Footer from "../../Footer";
import Link from "next/link";
import DepartmentMotion from "../../DepartmentMotion";

const tools = [
  {
    name: "Design Size Helper",
    description:
      "Quickly work out print sizes, placement, and simple measurements for shirts and apparel designs.",
  },
  {
    name: "Apparel Order Organizer",
    description:
      "Keep customer names, sizes, colors, quantities, and order notes organized without a complicated system.",
  },
  {
    name: "Print Job Checklist",
    description:
      "Track the important steps before, during, and after a print job so small details do not get missed.",
  },
  {
    name: "Size & Color Count",
    description:
      "Count shirt sizes and colors for group orders, events, teams, organizations, and custom apparel jobs.",
  },
];

export default function ApparelPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#171717]">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-black/10">
        <DepartmentMotion type="apparel" />

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
            Apparel
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-black/60">
            Practical tools for clothing design, custom orders, print work,
            sizing, organization, and everyday apparel workflows.
          </p>
        </div>
      </section>

      {/* Department Intro */}
      <section className="border-b border-black/10">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <h2 className="text-2xl font-semibold">
            Small tools for turning designs into finished products.
          </h2>

          <p className="mt-4 max-w-3xl leading-7 text-black/60">
            This department focuses on the repetitive work around shirt sizes,
            colors, customer orders, design placement, printing, quantities, and
            keeping apparel jobs organized from start to finish.
          </p>
        </div>
      </section>

      {/* Tools */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-black/40">
              Apparel Tools
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Built around real apparel workflows.
            </h2>
          </div>

          <p className="max-w-md text-sm leading-6 text-black/50 md:text-right">
            More tools will be added here as OrgToolTank expands the Apparel
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
