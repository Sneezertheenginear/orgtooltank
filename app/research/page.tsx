import Link from "next/link";

const stages = [
  {
    number: "01",
    title: "Industry Research",
    description:
      "Research an organization market, understand workflows, uncover problems, rank opportunities, and select a product winner.",
    href: "/research/industry-research",
    status: "Start Here",
  },
  {
    number: "02",
    title: "Develop Idea",
    description:
      "Take the winning opportunity and turn it into a clear product concept, Version 1, offer, pricing direction, and visual plan.",
    href: "/research/develop-idea",
    status: "Develop",
  },
  {
    number: "03",
    title: "Build Product",
    description:
      "Move an approved idea into development, track the build, test Version 1, fix problems, and prepare the product for release.",
    href: "/research/build-product",
    status: "Build",
  },
];

export default function ResearchPage() {
  return (
    <main className="min-h-screen bg-[#f5efe1] text-[#1a1a1a]">
      {/* HERO */}
      <section className="bg-[#333333] px-6 py-16 text-white sm:px-10">
        <div className="mx-auto max-w-6xl">
            
          <Link
            href="/"
            className="text-sm font-bold text-[#d8d4cb] transition hover:text-white"
          >
            ← OrgToolTank
          </Link>

          <p className="mt-10 text-sm font-bold uppercase tracking-[0.2em] text-[#d8d4cb]">
            Internal Research System
          </p>

          <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">
            Find the right problem before building the tool.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[#d8d4cb]">
            This is OrgToolTank&apos;s internal product discovery system.
            Research real organization problems, develop the strongest
            opportunity, then move only the winner into development.
          </p>
        </div>
      </section>

      {/* FLOW */}
      <section className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
        <div className="rounded-3xl border border-black/10 bg-white p-7 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#7a1d1d]">
            Product Flow
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            Research → Develop → Build
          </h2>

          <p className="mt-3 max-w-3xl leading-relaxed text-black/60">
            Each stage has one job. Do not rush forward until the previous stage
            gives you enough evidence to continue.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Find the Problem",
                text: "Research organizations, workflows, spending, complaints, manual work, and weak software.",
              },
              {
                step: "2",
                title: "Shape the Product",
                text: "Define the buyer, one main job, Version 1, offer, price, and visual direction.",
              },
              {
                step: "3",
                title: "Build Version 1",
                text: "Build the smallest useful product, test it, fix it, and prepare it for release.",
              },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl bg-[#f5efe1] p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7a1d1d] font-bold text-white">
                  {item.step}
                </div>

                <h3 className="mt-4 text-xl font-bold">{item.title}</h3>

                <p className="mt-2 text-sm leading-relaxed text-black/60">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* STAGES */}
        <div className="mt-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#7a1d1d]">
              Research System
            </p>

            <h2 className="mt-2 text-3xl font-bold">Choose a stage.</h2>
          </div>

          <div className="mt-6 space-y-5">
            {stages.map((stage) => (
              <Link
                key={stage.number}
                href={stage.href}
                className="group block rounded-3xl border border-black/10 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#333333] font-bold text-white">
                      {stage.number}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-2xl font-bold">{stage.title}</h3>

                        <span className="rounded-full bg-[#f5efe1] px-3 py-1 text-xs font-bold text-[#7a1d1d]">
                          {stage.status}
                        </span>
                      </div>

                      <p className="mt-3 max-w-3xl leading-relaxed text-black/60">
                        {stage.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-lg font-bold text-[#7a1d1d] transition group-hover:translate-x-1">
                    Open →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* INTERNAL NOTICE */}
        <div className="mt-8 rounded-3xl bg-[#333333] p-7 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d8d4cb]">
            Internal Only
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            This is the engine behind the Tool Tank.
          </h2>

          <p className="mt-3 max-w-3xl leading-relaxed text-[#d8d4cb]">
            Customers see finished OrgToolTank products under the public Tools
            section. This Research System is where you decide what deserves to
            become one of those products.
          </p>

          <Link
            href="/tools"
            className="mt-6 inline-block rounded-xl bg-white px-6 py-3 font-bold text-[#1a1a1a]"
          >
            View Public Tools →
          </Link>
        </div>
      </section>
    </main>
  );
}
