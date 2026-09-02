import Header from "../../Header";
import Footer from "../../Footer";
import Link from "next/link";
import DepartmentMotion from "../../DepartmentMotion";

const tools = [
  {
    name: "File Inspection Helper",
    description:
      "Review suspicious files, extensions, metadata, and basic file details without digging through multiple utilities.",
  },
  {
    name: "System Change Monitor",
    description:
      "Track important changes to files, folders, and system locations so unusual activity is easier to notice.",
  },
  {
    name: "Security Check Organizer",
    description:
      "Keep recurring security checks, findings, notes, and follow-up work organized in one simple workflow.",
  },
  {
    name: "Evidence Collection Helper",
    description:
      "Organize files, notes, timestamps, and investigation details without relying on scattered folders and spreadsheets.",
  },
];

export default function CybersecurityPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#171717]">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-black/10">
        <DepartmentMotion type="cybersecurity" />

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
            Cybersecurity
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-black/60">
            Practical tools for security checks, file inspection, system
            monitoring, investigation, and defensive workflows.
          </p>
        </div>
      </section>

      {/* Department Intro */}
      <section className="border-b border-black/10">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <h2 className="text-2xl font-semibold">
            Small tools for finding problems before they become bigger ones.
          </h2>

          <p className="mt-4 max-w-3xl leading-7 text-black/60">
            This department focuses on repetitive defensive work around file
            inspection, system changes, security checks, investigations,
            evidence, and keeping technical findings organized.
          </p>
        </div>
      </section>

      {/* Tools */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-black/40">
              Cybersecurity Tools
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Built around real defensive workflows.
            </h2>
          </div>

          <p className="max-w-md text-sm leading-6 text-black/50 md:text-right">
            More tools will be added here as OrgToolTank expands the
            Cybersecurity department.
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
