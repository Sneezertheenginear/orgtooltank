import Header from "../Header";
import Footer from "../Footer";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#171717]">
      <Header />

      {/* Hero */}
      <section className="border-b border-black/10">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
              About OrgToolTank
            </div>

            <h1 className="mt-4 text-5xl font-black tracking-tight md:text-6xl">
              We build smaller software for organizations that do not need giant
              systems.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
              OrgToolTank is a for-profit software company focused on finding
              real operational problems inside organizations and turning those
              problems into practical, focused digital tools.
            </p>
          </div>
        </div>
      </section>

      {/* What We Believe */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
              What We Believe
            </div>

            <h2 className="mt-3 text-4xl font-black tracking-tight">
              Good software does not have to be huge.
            </h2>

            <p className="mt-6 text-lg leading-8 text-neutral-600">
              Many organizations are forced to choose between spreadsheets,
              manual workarounds, or expensive platforms filled with features
              they may never use.
            </p>

            <p className="mt-4 text-lg leading-8 text-neutral-600">
              OrgToolTank takes a different approach: identify one clear
              problem, build one useful tool, and keep the product focused.
            </p>
          </div>

          <div className="rounded-3xl bg-[#1c1c1c] p-8 text-white">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-400">
              Our Product Rule
            </div>

            <div className="mt-8 space-y-5">
              <div className="rounded-2xl bg-white/10 p-5">
                <div className="text-lg font-bold">One real problem</div>
                <p className="mt-2 text-sm leading-6 text-neutral-300">
                  Start with a problem organizations are already dealing with.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-5">
                <div className="text-lg font-bold">One clear job</div>
                <p className="mt-2 text-sm leading-6 text-neutral-300">
                  Build the product around the main job instead of adding
                  unnecessary features.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-5">
                <div className="text-lg font-bold">One practical solution</div>
                <p className="mt-2 text-sm leading-6 text-neutral-300">
                  Make the tool understandable, useful, and easier to adopt.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How We Work */}
      <section className="border-y border-black/10 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
              How We Work
            </div>

            <h2 className="mt-3 text-4xl font-black tracking-tight">
              Research before development.
            </h2>

            <p className="mt-6 text-lg leading-8 text-neutral-600">
              OrgToolTank researches industries, organization types, workflows,
              existing software, repetitive tasks, weak systems, expensive
              workarounds, and places where better tools may be needed.
            </p>

            <p className="mt-4 text-lg leading-8 text-neutral-600">
              Only after the problem makes sense do we move toward designing and
              building a product.
            </p>
          </div>
        </div>
      </section>

      {/* Who We Serve */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-3xl">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
            Our Market
          </div>

          <h2 className="mt-3 text-4xl font-black tracking-tight">
            Built for organizations often overlooked by expensive software.
          </h2>

          <p className="mt-6 text-lg leading-8 text-neutral-600">
            That includes nonprofits, churches, shelters, community
            organizations, workforce and reentry programs, associations, small
            agencies, foundations, schools, and other organizations with real
            operational needs.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
