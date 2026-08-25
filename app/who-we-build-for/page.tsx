import Header from "../Header";
import Footer from "../Footer";

export default function WhoWeBuildForPage() {
  const groups = [
    {
      title: "Everyday Computer Users",
      text: "People who want simple tools for files, cleanup, organization, and everyday computer tasks.",
    },
    {
      title: "Small Businesses",
      text: "Small teams and independent businesses that need practical tools without oversized software.",
    },
    {
      title: "Office Workers",
      text: "People handling documents, records, organization, repetitive tasks, and everyday office work.",
    },
    {
      title: "Truck Drivers",
      text: "Drivers and transportation workers who need simpler ways to handle loads, paperwork, tracking, and daily work.",
    },
    {
      title: "Musicians & DJs",
      text: "People working with music, audio files, instruments, libraries, repair, and performance workflows.",
    },
    {
      title: "Warehouse Workers",
      text: "People dealing with inventory, movement, organization, tracking, and everyday warehouse operations.",
    },
    {
      title: "Makers & Repair People",
      text: "People who build, solder, repair, modify, and work hands-on with electronics and equipment.",
    },
    {
      title: "People Who Like Simple Tools",
      text: "Anyone who would rather use one focused tool that does the job than fight with a giant complicated system.",
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
              People who want useful technology without the extra complexity.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
              OrgToolTank builds practical products for people doing real work,
              solving everyday problems, and looking for simpler tools.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {groups.map((group) => (
              <div
                key={group.title}
                className="rounded-2xl border border-black/10 bg-[#f7f7f4] p-7"
              >
                <h2 className="text-xl font-black">{group.title}</h2>

                <p className="mt-4 leading-7 text-neutral-600">{group.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
