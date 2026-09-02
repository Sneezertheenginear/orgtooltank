import Header from "../Header";
import Footer from "../Footer";
import Link from "next/link";
import DepartmentMotion from "../DepartmentMotion";

const categories = [
  {
    name: "Desktop Utilities",
    description:
      "Practical tools for files, cleanup, organization, storage, and everyday computer work.",
    href: "/tools/desktop-utilities",
    status: "1 Tool",
  },
  {
    name: "Organizations",
    description:
      "Practical tools for nonprofits, churches, schools, shelters, associations, community groups, and small organizations.",
    href: "/tools/organizations",
    status: "Coming Soon",
  },
  {
    name: "Trucking",
    description:
      "Focused tools for drivers, loads, paperwork, tracking, and transportation workflows.",
    href: "/tools/trucking",
    status: "Coming Soon",
  },
  {
    name: "Music",
    description:
      "Tools for musicians, DJs, instruments, audio files, repair work, and music workflows.",
    href: "/tools/music",
    status: "Coming Soon",
  },
  {
    name: "Warehouse",
    description:
      "Practical tools for inventory, movement, organization, tracking, and warehouse work.",
    href: "/tools/warehouse",
    status: "Coming Soon",
  },
  {
    name: "Researcher",
    description:
      "Tools that help collect, organize, compare, and work through useful information.",
    href: "/tools/researcher",
    status: "Coming Soon",
  },
  {
    name: "Apparel",
    description:
      "Original OrgToolTank clothing and designs inspired by software, electronics, music, and tech culture.",
    href: "/tools/apparel",
    status: "Coming Soon",
  },
  {
    name: "Electronics",
    description:
      "Useful electronics, repair-related products, accessories, and hands-on tech.",
    href: "/tools/electronics",
    status: "Coming Soon",
  },
  {
    name: "Cybersecurity",
    description:
      "Practical tools for security checks, file inspection, system monitoring, investigation, and defensive workflows.",
    href: "/tools/cybersecurity",
    status: "Coming Soon",
  },
];

export default function ToolsPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#171717]">
      <Header />

      {/* Page Intro */}
      <section className="relative overflow-hidden border-b border-black/10">
        <DepartmentMotion type="researcher" />

        <div className="relative mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
              The Tool Tank
            </div>

            <h1 className="mt-4 text-5xl font-black tracking-tight md:text-6xl">
              Pick a department.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
              OrgToolTank is built around different kinds of practical tech.
              Choose a section and see what is inside.
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const available =
                category.name === "Desktop Utilities" ||
                category.name === "Electronics" ||
                category.name === "Music" ||
                category.name === "Organizations" ||
                category.name === "Trucking" ||
                category.name === "Warehouse" ||
                category.name === "Researcher" ||
                category.name === "Apparel" ||
                category.name === "Cybersecurity";

              if (!available) {
                return (
                  <div
                    key={category.name}
                    className="flex min-h-[280px] flex-col rounded-2xl border border-black/10 bg-[#f7f7f4] p-7"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-neutral-500">
                        Department
                      </span>

                      <span className="text-xs font-semibold text-neutral-400">
                        {category.status}
                      </span>
                    </div>

                    <h2 className="mt-7 text-2xl font-black">
                      {category.name}
                    </h2>

                    <p className="mt-4 flex-1 leading-7 text-neutral-600">
                      {category.description}
                    </p>

                    <div className="mt-7 text-sm font-semibold text-neutral-400">
                      Products coming soon
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={category.name}
                  href={category.href}
                  className="group flex min-h-[280px] flex-col rounded-2xl border border-black/10 bg-[#f7f7f4] p-7 transition hover:-translate-y-1 hover:border-black/25 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-neutral-500">
                      Department
                    </span>

                    <span className="text-xs font-semibold text-neutral-500">
                      {category.status}
                    </span>
                  </div>

                  <h2 className="mt-7 text-2xl font-black">{category.name}</h2>

                  <p className="mt-4 flex-1 leading-7 text-neutral-600">
                    {category.description}
                  </p>

                  <div className="mt-7 font-bold">Browse Department →</div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
