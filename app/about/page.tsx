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
              Practical tech built one useful idea at a time.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
              OrgToolTank creates focused products designed to solve real
              problems without unnecessary complexity.
            </p>
          </div>
        </div>
      </section>

      {/* What We Build */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
              What We Build
            </div>

            <h2 className="mt-3 text-4xl font-black tracking-tight">
              Different products. Same basic rule.
            </h2>

            <p className="mt-6 text-lg leading-8 text-neutral-600">
              Some OrgToolTank products are software. Others may be electronics,
              guides, apparel, music-related products, or other useful tech.
            </p>

            <p className="mt-4 text-lg leading-8 text-neutral-600">
              The category can change. The goal does not: make something useful,
              keep it understandable, and give it a clear purpose.
            </p>
          </div>

          <div className="rounded-3xl bg-[#1c1c1c] p-8 text-white">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-400">
              The OrgToolTank Rule
            </div>

            <div className="mt-8 space-y-5">
              <div className="rounded-2xl bg-white/10 p-5">
                <div className="text-lg font-bold">Find a real problem</div>
                <p className="mt-2 text-sm leading-6 text-neutral-300">
                  Start with something annoying, repetitive, confusing, or
                  harder than it needs to be.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-5">
                <div className="text-lg font-bold">
                  Build a focused solution
                </div>
                <p className="mt-2 text-sm leading-6 text-neutral-300">
                  Keep the product centered around the job it is supposed to do.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-5">
                <div className="text-lg font-bold">Keep it practical</div>
                <p className="mt-2 text-sm leading-6 text-neutral-300">
                  Make it understandable, useful, and worth paying for.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why OrgToolTank */}
      <section className="border-t border-black/10 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
              Why OrgToolTank
            </div>

            <h2 className="mt-3 text-4xl font-black tracking-tight">
              Useful does not have to mean complicated.
            </h2>

            <p className="mt-6 text-lg leading-8 text-neutral-600">
              OrgToolTank is built around creating practical products that solve
              clear problems without turning every idea into a giant platform.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
