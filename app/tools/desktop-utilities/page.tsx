import Header from "../../Header";
import Footer from "../../Footer";
import Link from "next/link";

const tools = [
  {
    name: "Duplicate Finder",
    description:
      "Find exact duplicate files on your computer, review every copy, choose what to keep, and remove the extras without uploading your files anywhere.",
    href: "/tools/duplicate-finder",
    status: "Available",
  },
];

export default function DesktopUtilitiesPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#171717]">
      <Header />

      <section className="border-b border-black/10">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
              Desktop Utilities
            </div>

            <h1 className="mt-4 text-5xl font-black tracking-tight md:text-6xl">
              Simple tools for everyday computer work.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
              File tools, cleanup utilities, organization tools, and other
              practical desktop software.
            </p>

            <Link
              href="/tools"
              className="mt-8 inline-flex rounded-xl border border-black/15 bg-white px-5 py-3 font-semibold transition hover:bg-neutral-100"
            >
              ← Back to Departments
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <Link
                key={tool.name}
                href={tool.href}
                className="group flex min-h-[300px] flex-col rounded-2xl border border-black/10 bg-[#f7f7f4] p-7 transition hover:-translate-y-1 hover:border-black/25 hover:shadow-lg"
              >
                <div>
                  <span className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-bold text-neutral-600">
                    {tool.status}
                  </span>
                </div>

                <h2 className="mt-7 text-2xl font-black">{tool.name}</h2>

                <p className="mt-4 flex-1 leading-7 text-neutral-600">
                  {tool.description}
                </p>

                <div className="mt-7 font-bold">View Tool →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
