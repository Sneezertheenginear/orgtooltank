import Header from "../Header";
import Footer from "../Footer";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#171717]">
      <Header />

      <section className="border-b border-black/10">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
            Contact
          </div>

          <h1 className="mt-4 text-5xl font-black tracking-tight md:text-6xl">
            Need help with an OrgToolTank product?
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
            Questions about purchases, downloads, software, refunds, or other
            OrgToolTank products can be sent by email.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="max-w-2xl rounded-3xl border border-black/10 bg-[#f7f7f4] p-8">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
              Email
            </div>

            <h2 className="mt-3 text-3xl font-black">OrgToolTank Support</h2>

            <p className="mt-5 leading-7 text-neutral-600">
              Include your order email and a short description of what you need
              help with.
            </p>

            <p className="mt-4 font-semibold text-[#171717]">
              orgtooltank@gmail.com
            </p>
            <a
              href="mailto:orgtooltank@gmail.com"
              className="mt-8 inline-flex rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:bg-neutral-800"
            >
              Email OrgToolTank
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
