import Header from "../../Header";
import Footer from "../../Footer";

const leftGroups = [
  {
    title: "Repair Tools",
    description:
      "Essential tools and utilities for electronics repair and testing.",
    delay: "0s",
  },
  {
    title: "Magnifier Tools",
    description:
      "Magnification utilities for detailed inspection and precision work.",
    delay: "2s",
  },
  {
    title: "Diagnostic Tools",
    description: "Testing, measurement, and diagnostic software.",
    delay: "4s",
  },
];

const rightGroups = [
  {
    title: "Parts Reference",
    description: "Look up parts, cross references, and compatibility guides.",
    delay: "1s",
  },
  {
    title: "Bench Utilities",
    description: "Helpful utilities for your electronics workbench.",
    delay: "3s",
  },
  {
    title: "More Coming Soon",
    description: "New apps, tools, and resources are on the way.",
    delay: "5s",
  },
];

/*
  ADD NEW ELECTRONICS APPS HERE.

  You do NOT need to add more cards around the chip.

  This grid can keep growing without crowding the circuit section.
*/
const featuredTools = [
  {
    name: "BoardVision Pro",
    category: "PCB Inspection",
    description: "High clarity inspection tools for detailed electronics work.",
  },
  {
    name: "BenchMeter",
    category: "Measurement",
    description: "Utilities designed around bench testing and diagnostics.",
  },
  {
    name: "Chip ID Helper",
    category: "Parts Reference",
    description: "A faster way to identify unknown chips and components.",
  },
];

export default function ElectronicsPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#171717]">
      <Header />

      {/* Electronics Hero */}
      <section className="border-b border-white/10 bg-[#202428] text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center md:py-20">
          <div className="text-xs font-bold uppercase tracking-[0.28em] text-white/55">
            OrgToolTank Department
          </div>

          <h1 className="mt-4 text-5xl font-black tracking-tight md:text-6xl">
            Electronics
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/70">
            Tools, references, repair utilities, and practical resources for
            builders, repair techs, and creators.
          </p>
        </div>
      </section>

      {/* Animated Circuit Hub */}
      <section className="relative overflow-hidden bg-[#202428]">
        {/* Background circuit decoration */}
        <div className="pointer-events-none absolute inset-0 hidden lg:block">
          <svg
            viewBox="0 0 1600 700"
            preserveAspectRatio="none"
            className="h-full w-full opacity-20"
          >
            <g fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.4">
              <path d="M0 120 H180 L230 170 H360" />
              <path d="M0 220 H130 L190 280 H320" />
              <path d="M0 560 H170 L240 490 H360" />

              <path d="M1600 120 H1420 L1370 170 H1240" />
              <path d="M1600 220 H1470 L1410 280 H1280" />
              <path d="M1600 560 H1430 L1360 490 H1240" />

              <path d="M180 0 V60 L250 130" />
              <path d="M1420 0 V60 L1350 130" />

              <path d="M180 700 V640 L250 570" />
              <path d="M1420 700 V640 L1350 570" />
            </g>

            <g fill="rgba(255,255,255,0.35)">
              <circle cx="360" cy="170" r="4" />
              <circle cx="320" cy="280" r="4" />
              <circle cx="360" cy="490" r="4" />
              <circle cx="1240" cy="170" r="4" />
              <circle cx="1280" cy="280" r="4" />
              <circle cx="1240" cy="490" r="4" />
            </g>
          </svg>
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-14 md:py-16">
          <div className="relative hidden min-h-[560px] lg:block">
            {/* Circuit line layer */}
            <svg
              viewBox="0 0 1200 560"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 h-full w-full"
            >
              <defs>
                <filter id="signalGlow">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* LEFT TOP */}
              <path
                id="leftTop"
                d="M520 215 H455 L410 155 H335"
                fill="none"
                stroke="rgba(255,255,255,0.32)"
                strokeWidth="2"
              />

              {/* LEFT MIDDLE */}
              <path
                id="leftMiddle"
                d="M520 280 H425 H335"
                fill="none"
                stroke="rgba(255,255,255,0.32)"
                strokeWidth="2"
              />

              {/* LEFT BOTTOM */}
              <path
                id="leftBottom"
                d="M520 345 H455 L410 405 H335"
                fill="none"
                stroke="rgba(255,255,255,0.32)"
                strokeWidth="2"
              />

              {/* RIGHT TOP */}
              <path
                id="rightTop"
                d="M680 215 H745 L790 155 H865"
                fill="none"
                stroke="rgba(255,255,255,0.32)"
                strokeWidth="2"
              />

              {/* RIGHT MIDDLE */}
              <path
                id="rightMiddle"
                d="M680 280 H775 H865"
                fill="none"
                stroke="rgba(255,255,255,0.32)"
                strokeWidth="2"
              />

              {/* RIGHT BOTTOM */}
              <path
                id="rightBottom"
                d="M680 345 H745 L790 405 H865"
                fill="none"
                stroke="rgba(255,255,255,0.32)"
                strokeWidth="2"
              />

              {/* connection points */}
              <g fill="#202428" stroke="rgba(255,255,255,0.6)" strokeWidth="2">
                <circle cx="335" cy="155" r="5" />
                <circle cx="335" cy="280" r="5" />
                <circle cx="335" cy="405" r="5" />

                <circle cx="865" cy="155" r="5" />
                <circle cx="865" cy="280" r="5" />
                <circle cx="865" cy="405" r="5" />
              </g>

              {/* moving signal - cyan */}
              <circle r="6" fill="#51e5ff" filter="url(#signalGlow)">
                <animateMotion
                  dur="6s"
                  begin="0s"
                  repeatCount="indefinite"
                  path="M520 215 H455 L410 155 H335"
                />
              </circle>

              {/* moving signal - orange */}
              <circle r="6" fill="#ff9b42" filter="url(#signalGlow)">
                <animateMotion
                  dur="6s"
                  begin="1s"
                  repeatCount="indefinite"
                  path="M680 215 H745 L790 155 H865"
                />
              </circle>

              {/* moving signal - blue */}
              <circle r="6" fill="#5da9ff" filter="url(#signalGlow)">
                <animateMotion
                  dur="6s"
                  begin="2s"
                  repeatCount="indefinite"
                  path="M520 280 H425 H335"
                />
              </circle>

              {/* moving signal - red */}
              <circle r="6" fill="#ff6262" filter="url(#signalGlow)">
                <animateMotion
                  dur="6s"
                  begin="3s"
                  repeatCount="indefinite"
                  path="M680 280 H775 H865"
                />
              </circle>

              {/* moving signal - teal */}
              <circle r="6" fill="#67f0d3" filter="url(#signalGlow)">
                <animateMotion
                  dur="6s"
                  begin="4s"
                  repeatCount="indefinite"
                  path="M520 345 H455 L410 405 H335"
                />
              </circle>

              {/* moving signal - amber */}
              <circle r="6" fill="#ffc857" filter="url(#signalGlow)">
                <animateMotion
                  dur="6s"
                  begin="5s"
                  repeatCount="indefinite"
                  path="M680 345 H745 L790 405 H865"
                />
              </circle>
            </svg>

            {/* LEFT CARDS */}
            <div className="absolute left-0 top-[45px] w-[310px] space-y-5">
              {leftGroups.map((tool) => (
                <CircuitCard
                  key={tool.title}
                  title={tool.title}
                  description={tool.description}
                  delay={tool.delay}
                />
              ))}
            </div>

            {/* CENTER CHIP */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <Chip />
            </div>

            {/* RIGHT CARDS */}
            <div className="absolute right-0 top-[45px] w-[310px] space-y-5">
              {rightGroups.map((tool) => (
                <CircuitCard
                  key={tool.title}
                  title={tool.title}
                  description={tool.description}
                  delay={tool.delay}
                />
              ))}
            </div>
          </div>

          {/* Mobile / Tablet layout */}
          <div className="grid gap-6 lg:hidden">
            <div className="flex justify-center py-6">
              <Chip />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {[...leftGroups, ...rightGroups].map((tool) => (
                <CircuitCard
                  key={tool.title}
                  title={tool.title}
                  description={tool.description}
                  delay={tool.delay}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* App Catalog */}
      <section className="bg-[#f4f4f1]">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex flex-col gap-5 border-b border-black/10 pb-7 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">
                Electronics Tools
              </div>

              <h2 className="mt-2 text-3xl font-black tracking-tight">
                Featured tools
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-neutral-600">
                Electronics apps and utilities will continue to be added here as
                the department grows.
              </p>
            </div>

            <button className="w-fit rounded-lg border border-black/15 bg-white px-5 py-3 text-sm font-bold transition hover:bg-black hover:text-white">
              View All Electronics Tools →
            </button>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredTools.map((tool) => (
              <article
                key={tool.name}
                className="group flex min-h-[220px] flex-col rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">
                  {tool.category}
                </div>

                <h3 className="mt-3 text-xl font-black">{tool.name}</h3>

                <p className="mt-3 flex-1 leading-7 text-neutral-600">
                  {tool.description}
                </p>

                <button className="mt-6 w-fit rounded-lg border border-black/15 bg-[#f7f7f4] px-4 py-2 text-sm font-bold transition group-hover:bg-black group-hover:text-white">
                  View Tool →
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      {/* Animation CSS only for this page */}
      <style>{`
        @keyframes electronicsCardPulse {
          0%, 72%, 100% {
            box-shadow: 0 8px 25px rgba(0,0,0,0.16);
            border-color: rgba(255,255,255,0.10);
          }

          78% {
            box-shadow:
              0 8px 25px rgba(0,0,0,0.16),
              0 0 0 1px rgba(81,229,255,0.30),
              0 0 26px rgba(81,229,255,0.20);
            border-color: rgba(81,229,255,0.55);
          }

          84% {
            box-shadow: 0 8px 25px rgba(0,0,0,0.16);
            border-color: rgba(255,255,255,0.10);
          }
        }

        @keyframes electronicsChipPulse {
          0%, 82%, 100% {
            box-shadow: 0 25px 60px rgba(0,0,0,0.40);
          }

          88% {
            box-shadow:
              0 25px 60px rgba(0,0,0,0.40),
              0 0 36px rgba(81,229,255,0.25);
          }
        }

        .electronics-card-signal {
          animation: electronicsCardPulse 6s ease-in-out infinite;
        }

        .electronics-chip {
          animation: electronicsChipPulse 3s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .electronics-card-signal,
          .electronics-chip {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}

function CircuitCard({
  title,
  description,
  delay,
}: {
  title: string;
  description: string;
  delay: string;
}) {
  return (
    <div
      className="electronics-card-signal rounded-2xl border border-white/10 bg-[#f7f7f4] p-6"
      style={{
        animationDelay: delay,
      }}
    >
      <h2 className="text-xl font-black text-[#171717]">{title}</h2>

      <p className="mt-2 leading-6 text-neutral-600">{description}</p>

      <button className="mt-5 rounded-lg border border-black/15 bg-white px-4 py-2 text-sm font-bold transition hover:bg-black hover:text-white">
        Explore →
      </button>
    </div>
  );
}

function Chip() {
  return (
    <div className="relative">
      {/* left pins */}
      <div className="absolute -left-5 top-8 flex h-[220px] flex-col justify-between">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={`left-${index}`}
            className="h-2 w-5 rounded-l-sm bg-[#aeb2b5]"
          />
        ))}
      </div>

      {/* right pins */}
      <div className="absolute -right-5 top-8 flex h-[220px] flex-col justify-between">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={`right-${index}`}
            className="h-2 w-5 rounded-r-sm bg-[#aeb2b5]"
          />
        ))}
      </div>

      {/* top pins */}
      <div className="absolute -top-5 left-8 flex w-[220px] justify-between">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={`top-${index}`}
            className="h-5 w-2 rounded-t-sm bg-[#aeb2b5]"
          />
        ))}
      </div>

      {/* bottom pins */}
      <div className="absolute -bottom-5 left-8 flex w-[220px] justify-between">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={`bottom-${index}`}
            className="h-5 w-2 rounded-b-sm bg-[#aeb2b5]"
          />
        ))}
      </div>

      <div className="electronics-chip relative flex h-[285px] w-[285px] items-center justify-center rounded-[28px] border border-white/20 bg-[#d8d8d4]">
        <div className="text-center">
          <div className="text-[11px] font-black tracking-[0.2em] text-neutral-600">
            ORGTOOLTANK
          </div>

          <div className="mt-4 text-3xl font-black text-[#171717]">
            ELECTRONICS
          </div>

          <div className="mt-3 text-sm font-semibold text-neutral-500">
            TOOLS CONNECTED
          </div>

          <div className="mx-auto mt-6 h-3 w-3 rounded-full bg-[#171717]" />
        </div>
      </div>
    </div>
  );
}
