import Header from "../../Header";
import Footer from "../../Footer";
import Image from "next/image";
import BackButton from "./BackButton";

export default function DuplicateFinderPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#171717]">
      <Header />

      {/* Hero */}
      <section className="border-b border-black/10">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_380px] lg:items-start">
            <div>
              <div className="flex items-center gap-4">
                <Image
                  src="/duplicate-finder/icon.png"
                  alt="Duplicate Finder app icon"
                  width={88}
                  height={88}
                  className="rounded-2xl"
                />

                <div>
                  <div className="flex flex-wrap gap-3">
                    <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-neutral-500">
                      Desktop Utility
                    </span>

                    <span className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-bold uppercase tracking-wide text-neutral-600">
                      Mac Available
                    </span>
                  </div>

                  <h1 className="mt-4 text-5xl font-black tracking-tight md:text-6xl">
                    Duplicate Finder
                  </h1>
                </div>
              </div>

              <p className="mt-7 max-w-3xl text-xl leading-8 text-neutral-600">
                Find exact duplicate files, review every copy, choose what
                stays, and remove the extras without uploading your files
                anywhere.
              </p>

              <p className="mt-4 max-w-3xl leading-7 text-neutral-500">
                Built for simple local file cleanup. Your files stay on your
                computer.
              </p>

              <div className="mt-8">
                <div className="flex flex-wrap gap-4">
                  <a
                    href="https://buy.stripe.com/test_4gM3cu0wzdQu3XGeB55AQ00"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-black px-7 py-4 font-bold text-white transition hover:bg-neutral-800"
                  >
                    Buy Duplicate Finder
                  </a>

                  <BackButton />
                </div>

                <p className="mt-3 text-sm text-neutral-500">
                  Download available for 60 minutes after purchase. One download
                  per purchase.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-black/10 bg-white p-8">
              <div className="text-sm font-bold uppercase tracking-[0.18em] text-neutral-500">
                One-Time Purchase
              </div>

              <div className="mt-4 text-5xl font-black tracking-tight">
                $9.99
              </div>

              <p className="mt-3 leading-7 text-neutral-600">
                Pay once. No monthly subscription.
              </p>

              <div className="mt-7 space-y-4 border-t border-black/10 pt-6">
                <div>
                  <p className="font-bold">Mac</p>
                  <p className="mt-1 text-sm text-neutral-500">Available now</p>
                </div>

                <div>
                  <p className="font-bold">Windows</p>
                  <p className="mt-1 text-sm text-neutral-500">Coming soon</p>
                </div>

                <div>
                  <p className="font-bold">Linux</p>
                  <p className="mt-1 text-sm text-neutral-500">Coming soon</p>
                </div>
              </div>
            </div>
          </div>

          {/* Product Preview */}
          <div className="mt-14">
            <div className="mb-5">
              <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
                Product Preview
              </div>

              <h2 className="mt-3 text-3xl font-black tracking-tight">
                See Duplicate Finder before you buy it.
              </h2>
            </div>

            <div className="overflow-hidden rounded-3xl border border-black/10 bg-white p-3 shadow-sm">
              <Image
                src="/duplicate-finder/app-preview.png"
                alt="Duplicate Finder desktop app preview"
                width={1600}
                height={1000}
                className="h-auto w-full rounded-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* What It Does */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-3xl">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
            What It Does
          </div>

          <h2 className="mt-3 text-3xl font-black tracking-tight">
            One job. Done clearly.
          </h2>

          <p className="mt-4 leading-7 text-neutral-600">
            Duplicate Finder helps you locate duplicate files across folders and
            drives, compare the copies, and clean up wasted storage.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Scan folders",
              text: "Choose a folder or external drive and scan its contents.",
            },
            {
              title: "Find duplicates",
              text: "Duplicate Finder groups matching files together for review.",
            },
            {
              title: "Preview copies",
              text: "Review file names, locations, sizes, and supported previews.",
            },
            {
              title: "Clean up",
              text: "Choose which copies to keep and move unwanted copies to Trash.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-black/10 bg-white p-7"
            >
              <h3 className="text-xl font-black">{item.title}</h3>
              <p className="mt-4 leading-7 text-neutral-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y border-black/10 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
              How It Works
            </div>

            <h2 className="mt-3 text-3xl font-black tracking-tight">
              Scan. Review. Clean.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-black/10 bg-[#f7f7f4] p-7">
              <div className="text-sm font-bold uppercase tracking-[0.15em] text-neutral-400">
                Step 01
              </div>
              <h3 className="mt-4 text-2xl font-black">
                Choose a folder or drive
              </h3>
              <p className="mt-4 leading-7 text-neutral-600">
                Pick the location you want Duplicate Finder to check.
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-[#f7f7f4] p-7">
              <div className="text-sm font-bold uppercase tracking-[0.15em] text-neutral-400">
                Step 02
              </div>
              <h3 className="mt-4 text-2xl font-black">Run your scan</h3>
              <p className="mt-4 leading-7 text-neutral-600">
                Choose Quick, Exact, or Deep Scan depending on how carefully you
                want the files checked.
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-[#f7f7f4] p-7">
              <div className="text-sm font-bold uppercase tracking-[0.15em] text-neutral-400">
                Step 03
              </div>
              <h3 className="mt-4 text-2xl font-black">Review and clean</h3>
              <p className="mt-4 leading-7 text-neutral-600">
                Review duplicate sets and decide which copies should stay or go.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
              Private & Local
            </div>

            <h2 className="mt-3 text-3xl font-black tracking-tight">
              Your files stay yours.
            </h2>

            <p className="mt-5 max-w-xl leading-7 text-neutral-600">
              Duplicate Finder runs locally on your computer. Your folders and
              files are not uploaded to OrgToolTank for scanning or storage.
            </p>
          </div>

          <div className="rounded-3xl bg-[#1c1c1c] p-8 text-white">
            <div className="space-y-5">
              <div className="border-b border-white/10 pb-5">
                <p className="font-bold">No cloud file storage</p>
                <p className="mt-2 text-sm leading-6 text-neutral-400">
                  Files remain on your device.
                </p>
              </div>

              <div className="border-b border-white/10 pb-5">
                <p className="font-bold">No account required to use the app</p>
                <p className="mt-2 text-sm leading-6 text-neutral-400">
                  Install it and use it locally.
                </p>
              </div>

              <div>
                <p className="font-bold">No AI required</p>
                <p className="mt-2 text-sm leading-6 text-neutral-400">
                  Duplicate detection runs directly on your computer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Availability */}
      <section className="border-y border-black/10 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
              Platforms
            </div>

            <h2 className="mt-3 text-3xl font-black tracking-tight">
              Built for desktop.
            </h2>

            <p className="mt-4 leading-7 text-neutral-600">
              The Mac version is available first. Windows and Linux versions are
              planned so the tool is not limited to one operating system.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-black/10 bg-[#f7f7f4] p-7">
              <div className="text-sm font-bold uppercase tracking-wide text-neutral-500">
                Available
              </div>
              <h3 className="mt-4 text-2xl font-black">macOS</h3>
              <p className="mt-3 leading-7 text-neutral-600">
                Mac installer available with your purchase.
              </p>
            </div>

            <div className="rounded-2xl border border-dashed border-black/20 bg-white p-7">
              <div className="text-sm font-bold uppercase tracking-wide text-neutral-400">
                Coming Soon
              </div>
              <h3 className="mt-4 text-2xl font-black">Windows</h3>
              <p className="mt-3 leading-7 text-neutral-600">
                Windows desktop version is planned.
              </p>
            </div>

            <div className="rounded-2xl border border-dashed border-black/20 bg-white p-7">
              <div className="text-sm font-bold uppercase tracking-wide text-neutral-400">
                Coming Soon
              </div>
              <h3 className="mt-4 text-2xl font-black">Linux</h3>
              <p className="mt-3 leading-7 text-neutral-600">
                Linux desktop version is planned.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* System Requirements */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
              System Requirements
            </div>

            <h2 className="mt-3 text-3xl font-black tracking-tight">
              Mac version
            </h2>

            <div className="mt-7 rounded-2xl border border-black/10 bg-white p-7">
              <div className="space-y-4">
                <div>
                  <p className="font-bold">Operating system</p>
                  <p className="mt-1 text-neutral-600">macOS</p>
                </div>

                <div>
                  <p className="font-bold">Computer</p>
                  <p className="mt-1 text-neutral-600">Intel-based Mac</p>
                </div>

                <div>
                  <p className="font-bold">Storage access</p>
                  <p className="mt-1 text-neutral-600">
                    Local folders and mounted external drives
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-8">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
              Before You Buy
            </div>

            <h2 className="mt-3 text-3xl font-black tracking-tight">
              Know what you are getting.
            </h2>

            <div className="mt-7 space-y-4 text-neutral-600">
              <p>One-time purchase. No monthly subscription.</p>
              <p>Mac version available now.</p>
              <p>Windows and Linux versions are still in development.</p>
              <p>
                The current Mac build may require macOS security approval during
                installation while public signing and notarization are being
                prepared.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Buy */}
      <section
        id="buy"
        className="border-t border-black/10 bg-[#1c1c1c] text-white"
      >
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex max-w-2xl items-center gap-5">
              <Image
                src="/duplicate-finder/icon.png"
                alt="Duplicate Finder app icon"
                width={72}
                height={72}
                className="rounded-2xl"
              />

              <div>
                <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-400">
                  Duplicate Finder
                </div>

                <h2 className="mt-3 text-4xl font-black tracking-tight">
                  $9.99 one time.
                </h2>

                <p className="mt-5 text-lg leading-8 text-neutral-300">
                  Buy once and use Duplicate Finder on your Mac without a
                  monthly subscription.
                </p>
              </div>
            </div>

            <div className="min-w-[280px] rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm text-neutral-400">Mac version</div>

              <div className="mt-2 text-3xl font-black">$9.99</div>

              <button
                disabled
                className="mt-6 w-full cursor-not-allowed rounded-xl bg-white/15 px-6 py-4 font-bold text-neutral-400"
              >
                Checkout Setup Next
              </button>

              <p className="mt-4 text-center text-xs leading-5 text-neutral-500">
                Secure checkout will be connected next.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
