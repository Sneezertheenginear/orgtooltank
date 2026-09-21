import Link from "next/link";
import Header from "./Header";
import Footer from "./Footer";

const systems = [
  { title: "Engine & Air", detail: "Air intake, PCV valves, belts & mounts", icon: "engine" },
  { title: "Fuel", detail: "Fuel delivery, pumps & injectors", icon: "fuel" },
  { title: "Cooling", detail: "Radiators, thermostats & hoses", icon: "cooling" },
  { title: "Electrical", detail: "Batteries, charging, wiring & sensors", icon: "electrical" },
  { title: "Brakes", detail: "Pads, rotors, calipers & brake fluid", icon: "brakes" },
  { title: "Suspension & Steering", detail: "Struts, control arms & steering parts", icon: "suspension" },
  { title: "Clutch & Transmission", detail: "Shifting, clutch operation & drivetrain", icon: "transmission" },
  { title: "Tires & Wheels", detail: "Pressure, wear, fitment & wheel care", icon: "wheel" },
];

const lessons = [
  { label: "UNDERSTAND THE PART", title: "What does a PCV valve do?", text: "A small valve with a role in how your engine breathes.", icon: "engine" },
  { label: "LEARN THE TEST", title: "How do I test a battery with a multimeter?", text: "Get familiar with the tool before interpreting a reading.", icon: "electrical" },
  { label: "KNOW THE DIFFERENCE", title: "Why is tire pressure on the door different from the tire?", text: "Two markings. Two different purposes.", icon: "wheel" },
  { label: "RECOGNIZE THE SYMPTOM", title: "What does a bad motor mount feel like?", text: "An introduction to mounts, movement, and vibration.", icon: "suspension" },
];

function PartIcon({ kind, className = "h-10 w-10" }: { kind: string; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    engine: <><path d="M10 18h8l5-5h15l5 7h7v23H17l-7-8V18Zm-5 5v12m0-6h5m17-16V7m-7 0h14m16 18h7v13h-7" /><path d="m33 21-7 11h10l-7 11" /></>,
    fuel: <><path d="M12 53V12a4 4 0 0 1 4-4h20a4 4 0 0 1 4 4v41M8 53h36M18 15h16v14H18zM40 27h4a5 5 0 0 1 5 5v11a4 4 0 0 0 8 0V24l-9-10m3 3v9h6" /></>,
    cooling: <><rect x="10" y="14" width="39" height="37" rx="3" /><path d="M18 21v23m8-23v23m8-23v23m8-23v23M24 14V8h11v6M49 23h7v9h-7M10 37H4v9h6" /></>,
    electrical: <><rect x="7" y="17" width="50" height="34" rx="4" /><path d="M15 17V10h10v7m14 0v-7h10v7M14 28h10m-5-5v10m22-5h10m-18 3-7 10h10l-5 7" /></>,
    brakes: <><circle cx="29" cy="32" r="23" /><circle cx="29" cy="32" r="8" /><path d="M43 15h12v34H43zM29 15v3m-17 14h3m14 14v3m-12-29 2 2m-2 22 2-2" /></>,
    suspension: <><path d="M20 8h24M32 8v9m-11 0h22l-22 8 22 8-22 8h22M32 41v15M20 56h24M21 17v24m22-24v24" /></>,
    transmission: <><circle cx="17" cy="12" r="5" /><circle cx="47" cy="12" r="5" /><circle cx="17" cy="51" r="5" /><circle cx="47" cy="51" r="5" /><circle cx="32" cy="12" r="5" /><path d="M17 17v29m30-29v29M32 17v15M17 32h30" /></>,
    wheel: <><circle cx="32" cy="32" r="25" /><circle cx="32" cy="32" r="16" /><circle cx="32" cy="32" r="5" /><path d="M32 16v11m15 10-10-3m4 12-6-10m-13 9 7-10m-13-9 12 4" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{paths[kind]}</svg>;
}

function CarIllustration() {
  return (
    <svg aria-hidden="true" viewBox="0 0 600 220" className="w-full" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 180h536M72 147l5-43 32-14 79-9 55-43h115l69 46 87 20 17 36-4 19h-39m-73 0H194m-74 0H77Z" fill="#e5e5e5" />
      <path d="m206 80 42-33h44v33zm99-33h48l50 33h-98z" fill="white" />
      <path d="M295 89v58m114-54 9 40m-191-41-13 44m105-38h17m-91 0h17M82 106h37l-12 15H79m422-13h-31l11 16h27" />
      <circle cx="158" cy="149" r="34" fill="#fafafa" /><circle cx="158" cy="149" r="20" /><circle cx="451" cy="149" r="34" fill="#fafafa" /><circle cx="451" cy="149" r="20" />
      <path d="M158 133v32m-16-16h32m277-16v32m-16-16h32" stroke="#737373" />
      <path d="M158 196h293m-293-5v10m293-10v10M52 72V39h52m428 96v40h-26" stroke="#a3a3a3" strokeDasharray="4 5" />
    </svg>
  );
}

const cardMotion = "motion-safe:transition motion-safe:duration-200 motion-safe:hover:-translate-y-1 hover:border-neutral-400 hover:shadow-sm";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Header />
      <main id="main-content">
        <section className="border-b border-neutral-200 bg-neutral-50">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:py-20 lg:grid-cols-[1.5fr_1fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Your car. Your tools. Your next repair.</p>
              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl xl:text-6xl">Fix your car.<br />Understand what you’re working on.</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600 md:text-xl">Clear repair guides, real part locations, tool instructions, testing steps, and plain-English explanations for people who work on their own cars.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#choose-your-car" className="rounded-lg bg-neutral-900 px-6 py-4 font-bold text-white transition-colors hover:bg-neutral-700">Choose Your Car <span aria-hidden="true">↓</span></a>
                <Link href="/tools-testing" className="rounded-lg border border-neutral-300 bg-white px-6 py-4 font-bold transition-colors hover:bg-neutral-100">Explore Tools & Testing</Link>
              </div>
              <p className="mt-5 text-sm leading-6 text-neutral-500">The repair library is taking shape. Vehicle guides and detailed lessons are coming soon.</p>
            </div>
            <aside aria-label="Our repair approach" className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 text-xs font-bold uppercase tracking-widest"><span>The DIY approach</span><span className="text-neutral-500">01 — 03</span></div>
              <div className="px-6 pt-7 text-neutral-700"><CarIllustration /></div>
              <ol className="divide-y divide-neutral-200 px-6 pb-3">
                {[
                  ["Find it", "Know the part and where it belongs."],
                  ["Understand it", "Learn what it does before you remove it."],
                  ["Test it", "Use evidence to plan the next step."],
                ].map(([title, text], index) => <li key={title} className="flex gap-4 py-4"><span className="pt-1 font-mono text-xs text-neutral-500">0{index + 1}</span><div><p className="text-lg font-bold">{title}</p><p className="mt-1 text-sm leading-6 text-neutral-600">{text}</p></div></li>)}
              </ol>
            </aside>
          </div>
        </section>

        <section id="choose-your-car" aria-labelledby="choose-heading" className="scroll-mt-6 border-b border-neutral-200">
          <div className="mx-auto max-w-7xl px-6 py-14 md:py-16">
            <div className="mb-7 flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">01 / Start with your vehicle</p><h2 id="choose-heading" className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Choose Your Car</h2></div>
              <p className="max-w-md text-base leading-7 text-neutral-600">The right model. The right engine. A clearer path to the job.</p>
            </div>
            <Link href="/cars" aria-label="Explore the planned Mazda 3 vehicle section: 2007, 2.3L" className={`group block rounded-2xl border border-neutral-300 bg-neutral-50 p-6 md:p-8 ${cardMotion}`}>
              <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-widest text-neutral-500">First vehicle in the garage</span><span className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-semibold">Repair guides coming soon</span></div>
              <ol className="mt-7 grid grid-cols-2 gap-x-6 gap-y-7 lg:grid-cols-4">
                {[["Make", "Mazda"], ["Model", "Mazda 3"], ["Year", "2007"], ["Engine", "2.3L"]].map(([label, value], index) => <li key={label} className="border-l-2 border-neutral-300 pl-4"><p className="text-sm text-neutral-500">{label}</p><p className="mt-2 flex items-center justify-between gap-2 text-2xl font-black tracking-tight sm:text-3xl">{value}{index < 3 && <span aria-hidden="true" className="text-lg font-normal text-neutral-400">→</span>}</p></li>)}
              </ol>
              <div className="mt-8 flex flex-col justify-between gap-3 border-t border-neutral-200 pt-5 sm:flex-row"><p className="text-sm leading-6 text-neutral-600">Browse the planned vehicle and repair-system structure.</p><span className="shrink-0 font-bold">Explore Mazda 3 <span aria-hidden="true">↗</span></span></div>
            </Link>
          </div>
        </section>

        <section aria-labelledby="systems-heading" className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">02 / Find the system</p>
          <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-end"><h2 id="systems-heading" className="text-3xl font-black tracking-tight md:text-4xl">What are you working on?</h2><Link href="/cars" className="font-semibold underline underline-offset-4">View the vehicle library →</Link></div>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-neutral-600">From a rough idle to a worn tire, start with the system involved. These repair categories are planned for the library.</p>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {systems.map(system => <article key={system.title} className={`flex flex-col rounded-xl border border-neutral-200 bg-white p-6 ${cardMotion}`}>
              <div className="mb-7 flex items-center justify-between"><PartIcon kind={system.icon} /><span className="text-xs font-medium text-neutral-500">Coming soon</span></div>
              <h3 className="text-xl font-bold tracking-tight">{system.title}</h3>
              <p className="mt-3 text-base leading-7 text-neutral-600">{system.detail}</p>
            </article>)}
          </div>
        </section>

        <section aria-labelledby="learn-heading" className="border-t border-neutral-200 bg-neutral-50">
          <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">03 / Build your know-how</p>
            <h2 id="learn-heading" className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Learn before you replace</h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-neutral-600">Know what a part does, what a symptom might mean, and what a test can tell you. Here is a preview of the lessons to come.</p>
            <div className="mt-9 grid gap-5 md:grid-cols-2">
              {lessons.map(lesson => <article key={lesson.title} className={`rounded-2xl border border-neutral-200 bg-white p-6 md:p-8 ${cardMotion}`}>
                <div className="flex items-center gap-4"><div className="rounded-xl bg-neutral-100 p-3"><PartIcon kind={lesson.icon} className="h-8 w-8" /></div><p className="text-xs font-bold tracking-widest text-neutral-500">{lesson.label}</p></div>
                <h3 className="mt-6 max-w-lg text-2xl font-bold leading-tight tracking-tight">{lesson.title}</h3>
                <p className="mt-3 text-base leading-7 text-neutral-600">{lesson.text}</p>
                <p className="mt-6 border-t border-neutral-100 pt-4 text-sm font-semibold text-neutral-500">Planned explainer · Coming soon</p>
              </article>)}
            </div>
            <div className="mt-9 flex flex-wrap gap-x-8 gap-y-4"><Link href="/how-cars-work" className="font-bold underline underline-offset-4">Explore How Cars Work →</Link><Link href="/tools-testing" className="font-bold underline underline-offset-4">Get to know Tools & Testing →</Link></div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
