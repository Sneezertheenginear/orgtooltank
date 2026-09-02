import Header from "../../Header";
import Footer from "../../Footer";
import DepartmentMotion from "../../DepartmentMotion";
import Link from "next/link";

const organizationTools = [
  {
    name: "Document Organizer",
    description:
      "Keep organization files, forms, policies, and internal documents easier to find and manage.",
    status: "Coming soon",
  },
  {
    name: "Volunteer Tracker",
    description:
      "Keep track of volunteers, assignments, contact information, and participation without a complicated system.",
    status: "Coming soon",
  },
  {
    name: "Program Tracker",
    description:
      "Simple tracking for programs, participants, tasks, and everyday operational work.",
    status: "Coming soon",
  },
  {
    name: "Form & Record Helper",
    description:
      "Practical tools for handling repetitive forms, records, checklists, and administrative work.",
    status: "Coming soon",
  },
];

export default function OrganizationsPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#171717]">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-black/10">
        <DepartmentMotion type="organizations" />

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
              Organizations
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-black/60">
              Practical software for nonprofits, community organizations,
              programs, associations, churches, schools, and small teams doing
              real operational work.
            </p>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="border-b border-black/10">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight">
              Small tools for everyday organization work.
            </h2>

            <p className="mt-4 leading-7 text-black/60">
              This department focuses on repetitive administrative work,
              document organization, volunteer coordination, program tracking,
              records, and the small jobs that often end up scattered across
              spreadsheets, email, paper, and shared drives.
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
                Organization Tools
              </p>

              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Built around real workflows.
              </h2>
            </div>

            <p className="hidden max-w-md text-right text-sm leading-6 text-black/50 md:block">
              More tools will be added here as OrgToolTank expands the
              Organizations department.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {organizationTools.map((tool) => (
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
