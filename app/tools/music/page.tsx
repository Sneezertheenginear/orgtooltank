import Header from "../../Header";
import Footer from "../../Footer";
import DepartmentMotion from "../../DepartmentMotion";

export default function MusicPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#171717]">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-black/10">
        <DepartmentMotion type="music" />

        <div className="relative mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
              Music Department
            </div>

            <h1 className="mt-4 text-5xl font-black tracking-tight md:text-6xl">
              Tools for music work.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
              Practical tools for musicians, DJs, audio files, instruments,
              repair work, and everyday music workflows.
            </p>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
              Available Tools
            </div>

            <h2 className="mt-3 text-3xl font-black">
              Music tools are coming.
            </h2>

            <p className="mt-4 max-w-2xl leading-7 text-neutral-600">
              This department will hold focused music utilities as they are
              built and released.
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-[#f7f7f4] p-8">
            <div className="text-sm font-bold uppercase tracking-[0.15em] text-neutral-400">
              Coming Soon
            </div>

            <h3 className="mt-4 text-2xl font-black">
              First music tools are in development.
            </h3>

            <p className="mt-3 max-w-2xl leading-7 text-neutral-600">
              Audio organization, DJ utilities, file tools, repair helpers, and
              other focused music software will appear here.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
