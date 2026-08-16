import Header from "./Header";
import Footer from "./Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#171717]">
      <Header />

      {/* Hero */}
      <section className="border-b border-black/10">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold">
              Small software. One clear job.
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[1.05] tracking-tight md:text-6xl">
              Useful tools for organizations that expensive software overlooks.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-neutral-600">
              OrgToolTank builds focused software for nonprofits, churches,
              shelters, community organizations, small agencies, schools, and
              other organizations that need practical tools without giant
              systems or giant prices.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href="/tools"
                className="rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:bg-neutral-800"
              >
                Explore Tools
              </a>

              <a
                href="/who-we-build-for"
                className="rounded-xl border border-black/15 bg-white px-6 py-3 font-semibold transition hover:bg-neutral-100"
              >
                Who We Build For
              </a>
            </div>
          </div>

          <div className="rounded-3xl bg-[#1c1c1c] p-8 text-white shadow-xl">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-400">
              The OrgToolTank Approach
            </div>

            <div className="mt-8 space-y-5">
              <div className="rounded-2xl bg-white/10 p-5">
                <div className="text-lg font-bold">Find a real problem</div>
                <p className="mt-2 text-sm leading-6 text-neutral-300">
                  We look for repetitive jobs, messy spreadsheets, weak
                  workflows, and software that costs too much.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-5">
                <div className="text-lg font-bold">Build one focused tool</div>
                <p className="mt-2 text-sm leading-6 text-neutral-300">
                  Each product should solve one important job clearly instead of
                  becoming another oversized all-in-one platform.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-5">
                <div className="text-lg font-bold">Keep it practical</div>
                <p className="mt-2 text-sm leading-6 text-neutral-300">
                  Simple setup, understandable pricing, and software people can
                  actually use.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Preview */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
            Tool Tank
          </div>

          <h2 className="mt-3 text-4xl font-black tracking-tight">
            Focused tools are coming.
          </h2>

          <p className="mt-5 text-lg leading-8 text-neutral-600">
            OrgToolTank is being built around small, useful products that solve
            specific operational problems inside organizations.
          </p>

          <a
            href="/tools"
            className="mt-8 inline-flex rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:bg-neutral-800"
          >
            View All Tools
          </a>
        </div>
      </section>

      {/* Who We Build For Preview */}
      <section className="border-y border-black/10 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-3xl">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
              Who We Build For
            </div>

            <h2 className="mt-3 text-4xl font-black tracking-tight">
              Organizations doing real work with limited resources.
            </h2>

            <p className="mt-5 text-lg leading-8 text-neutral-600">
              We build for nonprofits, churches, shelters, community programs,
              small agencies, schools, associations, and other organizations
              that need practical software.
            </p>

            <a
              href="/who-we-build-for"
              className="mt-8 inline-flex rounded-xl border border-black/15 bg-[#f7f7f4] px-6 py-3 font-semibold transition hover:bg-neutral-100"
            >
              See Who We Build For
            </a>
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-3xl">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
            About OrgToolTank
          </div>

          <h2 className="mt-3 text-4xl font-black tracking-tight">
            Not another giant software company.
          </h2>

          <p className="mt-6 text-lg leading-8 text-neutral-600">
            OrgToolTank exists to find practical problems inside organizations
            and turn them into focused digital tools.
          </p>

          <a
            href="/about"
            className="mt-8 inline-flex rounded-xl border border-black/15 bg-white px-6 py-3 font-semibold transition hover:bg-neutral-100"
          >
            About OrgToolTank
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
