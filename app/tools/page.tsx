import Header from "../Header";
import Footer from "../Footer";
import Link from "next/link";

const tools = [
  {
    name: "Sample Tool",
    category: "Operations",
    status: "Coming Soon",
    description:
      "A focused tool built to solve one clear organization problem.",
    href: "/tools/sample-tool",
  },
];

export default function ToolsPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#171717]">
      <Header />

      {/* Page Intro */}
      <section className="border-b border-black/10">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
              OrgToolTank Tools
            </div>

            <h1 className="mt-4 text-5xl font-black tracking-tight md:text-6xl">
              Focused tools built for real organization problems.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
              Each OrgToolTank product is designed around one clear job instead
              of becoming another oversized all-in-one software platform.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Tool */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
            Featured Tool
          </div>

          <h2 className="mt-3 text-3xl font-black tracking-tight">
            What we are building next.
          </h2>
        </div>

        <div className="rounded-3xl bg-[#1c1c1c] p-8 text-white md:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap gap-3">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-neutral-300">
                  Coming Soon
                </span>

                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-neutral-300">
                  First Product
                </span>
              </div>

              <h3 className="mt-6 text-3xl font-black tracking-tight md:text-4xl">
                The first OrgToolTank product is being researched.
              </h3>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-300">
                We are using real organization workflows and problems to decide
                what belongs in the tank first.
              </p>
            </div>

            <div>
              <div className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-neutral-300">
                Research → Validate → Build → Release
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Tools */}
      <section className="border-y border-black/10 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
              All Tools
            </div>

            <h2 className="mt-3 text-3xl font-black tracking-tight">
              The Tool Tank
            </h2>

            <p className="mt-4 max-w-2xl leading-7 text-neutral-600">
              New tools will be added here as they move from research into
              development and release.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <div
                key={tool.name}
                className="flex min-h-[310px] flex-col rounded-2xl border border-black/10 bg-[#f7f7f4] p-7"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-neutral-500">
                    {tool.category}
                  </span>

                  <span className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-bold text-neutral-600">
                    {tool.status}
                  </span>
                </div>

                <h3 className="mt-6 text-2xl font-black">{tool.name}</h3>

                <p className="mt-4 flex-1 leading-7 text-neutral-600">
                  {tool.description}
                </p>

                {tool.href === "#" ? (
                  <button
                    disabled
                    className="mt-7 w-full cursor-not-allowed rounded-xl bg-neutral-200 px-5 py-3 font-semibold text-neutral-500"
                  >
                    Coming Soon
                  </button>
                ) : (
                  <Link
                    href={tool.href}
                    className="mt-7 block rounded-xl bg-black px-5 py-3 text-center font-semibold text-white transition hover:bg-neutral-800"
                  >
                    View Tool
                  </Link>
                )}
              </div>
            ))}

            <div className="flex min-h-[310px] flex-col justify-center rounded-2xl border border-dashed border-black/20 bg-white p-7">
              <div className="text-sm font-bold uppercase tracking-[0.18em] text-neutral-400">
                Future Tool
              </div>

              <h3 className="mt-3 text-2xl font-black">
                More tools will enter the tank.
              </h3>

              <p className="mt-4 leading-7 text-neutral-600">
                Each new product will be added here with its category, status,
                description, and product page.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tool Status Guide */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 max-w-3xl">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
            Product Status
          </div>

          <h2 className="mt-3 text-3xl font-black tracking-tight">
            Know exactly where each tool stands.
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Researching",
              text: "The problem and customer are still being investigated.",
            },
            {
              title: "In Development",
              text: "The tool has been selected and is actively being built.",
            },
            {
              title: "Testing",
              text: "The tool is being tested before public release.",
            },
            {
              title: "Available",
              text: "The product is released and ready to use or purchase.",
            },
          ].map((status) => (
            <div
              key={status.title}
              className="rounded-2xl border border-black/10 bg-white p-6"
            >
              <h3 className="text-lg font-black">{status.title}</h3>

              <p className="mt-3 leading-7 text-neutral-600">{status.text}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
