import Header from "../Header";
import Footer from "../Footer";

export default function WhoWeBuildForPage() {
  const organizations = [
    {
      title: "Nonprofits",
      text: "Mission-driven organizations that need practical systems without enterprise software costs.",
    },
    {
      title: "Churches",
      text: "Churches and ministries managing programs, people, records, outreach, and everyday operations.",
    },
    {
      title: "Shelters",
      text: "Shelters and transitional programs that need clearer tracking, documentation, and workflow tools.",
    },
    {
      title: "Community Organizations",
      text: "Local organizations coordinating services, events, residents, volunteers, and community support.",
    },
    {
      title: "Workforce Programs",
      text: "Programs helping people with employment, training, reentry, placement, and ongoing support.",
    },
    {
      title: "Small Agencies",
      text: "Smaller service agencies that need useful software but cannot justify expensive enterprise platforms.",
    },
    {
      title: "Schools & Programs",
      text: "Schools, youth programs, after-school programs, and education-focused organizations.",
    },
    {
      title: "Associations",
      text: "Membership organizations and associations that need simpler tools for tracking and operations.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#171717]">
      <Header />

      <section className="border-b border-black/10">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
              Who We Build For
            </div>

            <h1 className="mt-4 text-5xl font-black tracking-tight md:text-6xl">
              Organizations doing important work without giant software budgets.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
              OrgToolTank builds focused software for organizations that need
              practical tools, clear workflows, and reasonable complexity.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {organizations.map((organization) => (
            <div
              key={organization.title}
              className="rounded-2xl border border-black/10 bg-white p-7"
            >
              <h2 className="text-xl font-black">{organization.title}</h2>

              <p className="mt-4 leading-7 text-neutral-600">
                {organization.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-black/10 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
              The Common Problem
            </div>

            <h2 className="mt-3 text-4xl font-black tracking-tight">
              Too much software is either too big, too expensive, or too
              complicated.
            </h2>

            <p className="mt-6 text-lg leading-8 text-neutral-600">
              Many organizations still rely on spreadsheets, shared documents,
              email chains, paper records, and workarounds because the software
              built for larger companies does not fit the job.
            </p>

            <p className="mt-4 text-lg leading-8 text-neutral-600">
              OrgToolTank focuses on smaller, clearer tools built around the
              actual work organizations need to get done.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
