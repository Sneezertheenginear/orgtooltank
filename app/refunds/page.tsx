import Header from "../Header";
import Footer from "../Footer";

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#171717]">
      <Header />

      <section className="border-b border-black/10">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
            Legal
          </div>

          <h1 className="mt-4 text-5xl font-black tracking-tight md:text-6xl">
            Refund Policy
          </h1>

          <p className="mt-6 text-neutral-500">Effective August 24, 2026</p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="max-w-3xl space-y-12 text-lg leading-8 text-neutral-700">
            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Digital products and software
              </h2>

              <p className="mt-4">
                Because downloadable software and other digital products can be
                delivered and accessed immediately after purchase, sales of
                digital products are generally considered final once the product
                has been delivered or made available for download.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Please review before purchasing
              </h2>

              <p className="mt-4">
                Before purchasing, please review the product description,
                supported operating systems, features, requirements, pricing,
                and any available screenshots or demonstrations.
              </p>

              <p className="mt-4">
                Customers are responsible for confirming that a product is
                appropriate for their device and intended use before purchase.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                When a refund may be considered
              </h2>

              <p className="mt-4">
                OrgToolTank may review a refund request when there is a
                legitimate problem with a purchase, including situations such
                as:
              </p>

              <ul className="mt-4 list-disc space-y-3 pl-6">
                <li>
                  You were charged more than once for the same transaction.
                </li>

                <li>
                  You paid successfully but were unable to receive the product.
                </li>

                <li>
                  The product materially differs from the description provided
                  at the time of purchase.
                </li>

                <li>
                  A serious technical problem prevents the product from working
                  on a supported system and the problem cannot reasonably be
                  resolved.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Change of mind
              </h2>

              <p className="mt-4">
                Refunds are generally not provided for change-of-mind purchases,
                accidental purchases, purchasing the wrong operating-system
                version, or deciding that you no longer want a digital product
                after it has been delivered.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Technical issues
              </h2>

              <p className="mt-4">
                If you experience a technical issue, contact OrgToolTank with a
                description of the problem and relevant information about your
                device or operating system.
              </p>

              <p className="mt-4">
                When reasonable, OrgToolTank may first attempt to help resolve
                the issue before determining whether a refund is appropriate.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Physical products
              </h2>

              <p className="mt-4">
                Physical products, including apparel or electronics, may be
                subject to separate return and refund terms based on the type of
                product, its condition, and how it was fulfilled.
              </p>

              <p className="mt-4">
                Any product-specific return terms will be displayed on the
                applicable product page or provided during the purchase process.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Legal rights
              </h2>

              <p className="mt-4">
                Nothing in this Refund Policy is intended to limit any refund,
                cancellation, warranty, or consumer rights that cannot legally
                be excluded under applicable law.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">Contact</h2>

              <p className="mt-4">
                Refund requests and purchase-related questions can be submitted
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
