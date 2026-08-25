import Header from "../Header";
import Footer from "../Footer";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#171717]">
      <Header />

      <section className="border-b border-black/10">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
            Legal
          </div>

          <h1 className="mt-4 text-5xl font-black tracking-tight md:text-6xl">
            Privacy Policy
          </h1>

          <p className="mt-6 text-neutral-500">Effective August 24, 2026</p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="max-w-3xl space-y-12 text-lg leading-8 text-neutral-700">
            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Our approach to privacy
              </h2>

              <p className="mt-4">
                OrgToolTank builds practical products with privacy and
                simplicity in mind. We aim to collect only the information
                reasonably necessary to operate our website, process purchases,
                provide products, and support customers.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Information you provide
              </h2>

              <p className="mt-4">
                When you make a purchase, contact us, or otherwise interact with
                OrgToolTank, you may provide information such as your name,
                email address, billing information, or other information needed
                to complete your request.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">Payments</h2>

              <p className="mt-4">
                Payments may be processed by third-party payment providers such
                as Stripe. Payment providers process payment information under
                their own privacy policies and security practices.
              </p>

              <p className="mt-4">
                OrgToolTank does not need to store your full credit or debit
                card number on its own website in order to process a purchase.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Desktop software and your files
              </h2>

              <p className="mt-4">
                Some OrgToolTank desktop products are designed to work directly
                on your computer.
              </p>

              <p className="mt-4">
                For example, Duplicate Finder scans files locally on your
                device. Your files are not uploaded to OrgToolTank for the
                purpose of finding duplicates.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Information collected automatically
              </h2>

              <p className="mt-4">
                Like most websites, basic technical information may be processed
                automatically when you visit OrgToolTank. This may include
                information such as browser type, device type, IP address, pages
                visited, and general website activity.
              </p>

              <p className="mt-4">
                This information may be handled by website hosting, security,
                payment, or other service providers used to operate the site.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                How information may be used
              </h2>

              <p className="mt-4">
                Information may be used to process purchases, deliver products,
                provide customer support, operate and protect the website,
                improve OrgToolTank products, prevent fraud, and meet legal or
                financial obligations.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Sharing information
              </h2>

              <p className="mt-4">
                OrgToolTank does not sell personal information to advertisers.
              </p>

              <p className="mt-4">
                Information may be shared with service providers when necessary
                to operate the website, process payments, deliver products,
                provide support, comply with the law, or protect OrgToolTank and
                its customers.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Data retention
              </h2>

              <p className="mt-4">
                Information may be kept for as long as reasonably necessary to
                complete transactions, provide support, maintain business and
                tax records, prevent fraud, resolve disputes, and comply with
                legal obligations.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Third-party services
              </h2>

              <p className="mt-4">
                OrgToolTank may use third-party services for functions such as
                website hosting and payment processing. Those services operate
                under their own terms and privacy policies.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Changes to this policy
              </h2>

              <p className="mt-4">
                This Privacy Policy may be updated as OrgToolTank adds products,
                services, or features. The effective date at the top of this
                page will be updated when material changes are made.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">Contact</h2>

              <p className="mt-4">
                Questions about this Privacy Policy or OrgToolTank privacy
                practices can be submitted through the contact information
                provided on the OrgToolTank website.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
