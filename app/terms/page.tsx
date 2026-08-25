import Header from "../Header";
import Footer from "../Footer";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#171717]">
      <Header />

      <section className="border-b border-black/10">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
            Legal
          </div>

          <h1 className="mt-4 text-5xl font-black tracking-tight md:text-6xl">
            Terms & Conditions
          </h1>

          <p className="mt-6 text-neutral-500">Effective August 24, 2026</p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="max-w-3xl space-y-12 text-lg leading-8 text-neutral-700">
            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Agreement to these terms
              </h2>

              <p className="mt-4">
                By using the OrgToolTank website or purchasing an OrgToolTank
                product, you agree to these Terms & Conditions.
              </p>

              <p className="mt-4">
                If you do not agree with these terms, do not use the website or
                purchase or use OrgToolTank products.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                OrgToolTank products
              </h2>

              <p className="mt-4">
                OrgToolTank may offer software, desktop utilities, digital
                products, guides, apparel, electronics, and other products.
              </p>

              <p className="mt-4">
                Product descriptions, availability, pricing, features, and
                supported platforms may change over time.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Purchases and payment
              </h2>

              <p className="mt-4">
                Prices are shown before purchase. Payment may be processed by a
                third-party payment provider such as Stripe.
              </p>

              <p className="mt-4">
                You are responsible for providing accurate billing and contact
                information when making a purchase.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Digital products and software
              </h2>

              <p className="mt-4">
                Purchasing software or another digital product does not transfer
                ownership of the underlying software, source code, design, or
                intellectual property.
              </p>

              <p className="mt-4">
                Software is licensed for use under the applicable OrgToolTank
                software license or end-user license agreement.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Acceptable use
              </h2>

              <p className="mt-4">
                You may not use OrgToolTank products or services for unlawful
                purposes or in a way that interferes with, damages, abuses, or
                attempts to gain unauthorized access to OrgToolTank systems,
                products, or services.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Intellectual property
              </h2>

              <p className="mt-4">
                Unless otherwise stated, OrgToolTank owns or controls the
                branding, website content, software, product designs, graphics,
                documentation, and other original materials it creates.
              </p>

              <p className="mt-4">
                You may not copy, resell, redistribute, reproduce, or claim
                ownership of OrgToolTank materials except where permission is
                clearly provided.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Product availability
              </h2>

              <p className="mt-4">
                OrgToolTank may add, update, discontinue, or change products,
                features, pricing, or supported platforms at any time.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Software and device responsibility
              </h2>

              <p className="mt-4">
                You are responsible for maintaining appropriate backups of
                important files and information before using software that may
                organize, move, rename, modify, or remove files.
              </p>

              <p className="mt-4">
                You are also responsible for confirming that your device meets
                the requirements listed for the product you purchase.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                No guarantee of uninterrupted operation
              </h2>

              <p className="mt-4">
                OrgToolTank aims to provide useful and reliable products, but
                software and websites may occasionally contain errors, become
                unavailable, or behave differently across devices and operating
                systems.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">Disclaimer</h2>

              <p className="mt-4">
                OrgToolTank products and services are provided on an &quot;as
                available&quot; basis to the extent permitted by law. We do not
                promise that every product will meet every user&apos;s
                particular needs or operate without interruption or error.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Limitation of liability
              </h2>

              <p className="mt-4">
                To the extent permitted by law, OrgToolTank will not be liable
                for indirect, incidental, special, consequential, or similar
                losses arising from use of the website or products.
              </p>

              <p className="mt-4">
                Nothing in these terms limits rights or remedies that cannot be
                limited under applicable law.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">Refunds</h2>

              <p className="mt-4">
                Refund eligibility is governed by the OrgToolTank Refund Policy
                in effect at the time of purchase.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Changes to these terms
              </h2>

              <p className="mt-4">
                OrgToolTank may update these Terms & Conditions as products,
                services, or business practices change. The effective date at
                the top of this page will be updated when material changes are
                made.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">Contact</h2>

              <p className="mt-4">
                Questions about these Terms & Conditions can be submitted
                through the contact information provided on the OrgToolTank
                website.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
