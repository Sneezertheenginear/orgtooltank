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
              Small tools. Useful tech. One clear job.
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[1.05] tracking-tight md:text-6xl">
              Practical tech built to solve real everyday problems.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-neutral-600">
              OrgToolTank creates focused software, desktop utilities, tech
              products, guides, and other useful tools designed to make everyday
              work simpler.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href="/tools"
                className="rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:bg-neutral-800"
              >
                Explore Tools
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
                  We look for annoying, repetitive, confusing, or expensive
                  problems that can be solved with a simpler tool.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-5">
                <div className="text-lg font-bold">
                  Build one focused solution
                </div>
                <p className="mt-2 text-sm leading-6 text-neutral-300">
                  Each product is built to do a clear job well instead of
                  becoming another oversized all-in-one system.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-5">
                <div className="text-lg font-bold">Keep it practical</div>
                <p className="mt-2 text-sm leading-6 text-neutral-300">
                  Simple setup, clear pricing, useful features, and products
                  people can understand without a manual.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="border-y border-black/10 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-3xl">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
              What You&apos;ll Find Here
            </div>

            <h2 className="mt-3 text-4xl font-black tracking-tight">
              Different kinds of tech. Same simple idea.
            </h2>

            <p className="mt-5 text-lg leading-8 text-neutral-600">
              Build something useful, make it easy to understand, and give it a
              clear purpose.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Software Tools",
                description:
                  "Focused apps built to solve one specific problem.",
              },
              {
                title: "Desktop Utilities",
                description:
                  "Practical tools for files, organization, cleanup, and everyday computer work.",
              },
              {
                title: "Music Tech",
                description:
                  "Tools and products for musicians, DJs, instruments, and audio workflows.",
              },
              {
                title: "Electronics",
                description:
                  "Useful electronics, repair-related products, and hands-on tech.",
              },
              {
                title: "Guides",
                description:
                  "Straightforward information designed to help people get something done.",
              },
              {
                title: "More From The Tank",
                description:
                  "New practical tech products as useful ideas are built and released.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-black/10 bg-[#f7f7f4] p-6"
              >
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="mt-3 leading-7 text-neutral-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="border-t border-black/10 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-3xl">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
              About OrgToolTank
            </div>

            <h2 className="mt-3 text-4xl font-black tracking-tight">
              A growing tank of practical ideas.
            </h2>

            <p className="mt-6 text-lg leading-8 text-neutral-600">
              OrgToolTank is built around creating useful technology one product
              at a time. Some products are software. Some may be physical. What
              connects them is simple: they should solve a real problem and be
              worth using.
            </p>

            <a
              href="/about"
              className="mt-8 inline-flex rounded-xl border border-black/15 bg-[#f7f7f4] px-6 py-3 font-semibold transition hover:bg-neutral-100"
            >
              About OrgToolTank
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
