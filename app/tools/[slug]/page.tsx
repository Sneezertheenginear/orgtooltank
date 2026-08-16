import Header from "../../Header";
import Footer from "../../Footer";
import Link from "next/link";

type ToolPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const tools = {
  "sample-tool": {
    name: "Sample Tool",
    category: "Operations",
    status: "Coming Soon",
    tagline: "A focused tool built to solve one clear organization problem.",
    description:
      "This is the reusable product-page structure for future OrgToolTank tools. When a real product is selected, we can replace this sample information with the actual product details.",
    problem:
      "Organizations often end up using spreadsheets, email chains, paper records, or oversized software for simple operational jobs.",
    job: "Give the organization one focused place to handle a specific workflow clearly.",
  },
};

export default async function ToolProductPage({ params }: ToolPageProps) {
  const { slug } = await params;

  const tool = tools[slug as keyof typeof tools];

  if (!tool) {
    return (
      <main className="min-h-screen bg-[#f7f7f4] text-[#171717]">
        <Header />

        <section className="mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-2xl">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
              OrgToolTank
            </div>

            <h1 className="mt-4 text-5xl font-black tracking-tight">
              Tool not found.
            </h1>

            <p className="mt-6 text-lg leading-8 text-neutral-600">
              This OrgToolTank product page does not exist yet.
            </p>

            <Link
              href="/tools"
              className="mt-8 inline-flex rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:bg-neutral-800"
            >
              Back to Tools
            </Link>
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#171717]">
      <Header />

      {/* Product Hero */}
      <section className="border-b border-black/10">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <Link
            href="/tools"
            className="text-sm font-semibold text-neutral-500 hover:text-black"
          >
            ← Back to Tools
          </Link>

          <div className="mt-10 max-w-4xl">
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-neutral-500">
                {tool.category}
              </span>

              <span className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-bold text-neutral-600">
                {tool.status}
              </span>
            </div>

            <h1 className="mt-6 text-5xl font-black tracking-tight md:text-6xl">
              {tool.name}
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-neutral-600">
              {tool.tagline}
            </p>
          </div>
        </div>
      </section>

      {/* Product Overview */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
              About This Tool
            </div>

            <h2 className="mt-3 text-4xl font-black tracking-tight">
              Built around one clear job.
            </h2>

            <p className="mt-6 text-lg leading-8 text-neutral-600">
              {tool.description}
            </p>
          </div>

          <div className="rounded-3xl bg-[#1c1c1c] p-8 text-white">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-400">
              Product Status
            </div>

            <div className="mt-6 text-3xl font-black">{tool.status}</div>

            <p className="mt-4 leading-7 text-neutral-300">
              This page is ready to hold screenshots, features, pricing,
              downloads, purchases, or access information when the product is
              released.
            </p>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-y border-black/10 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
                The Problem
              </div>

              <h2 className="mt-3 text-3xl font-black tracking-tight">
                What this tool is meant to fix.
              </h2>

              <p className="mt-5 text-lg leading-8 text-neutral-600">
                {tool.problem}
              </p>
            </div>

            <div>
              <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
                One Main Job
              </div>

              <h2 className="mt-3 text-3xl font-black tracking-tight">
                Keep the product focused.
              </h2>

              <p className="mt-5 text-lg leading-8 text-neutral-600">
                {tool.job}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Future Product Area */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-3xl border border-black/10 bg-white p-8 md:p-10">
          <div className="max-w-3xl">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
              Product Details
            </div>

            <h2 className="mt-3 text-3xl font-black tracking-tight">
              This area grows when the tool becomes real.
            </h2>

            <p className="mt-5 text-lg leading-8 text-neutral-600">
              Future product pages can include screenshots, features, system
              requirements, pricing, FAQs, release notes, downloads, purchase
              buttons, and support information.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
