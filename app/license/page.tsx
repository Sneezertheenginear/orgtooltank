import Header from "../Header";
import Footer from "../Footer";

export default function LicensePage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#171717]">
      <Header />

      <section className="border-b border-black/10">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
            Legal
          </div>

          <h1 className="mt-4 text-5xl font-black tracking-tight md:text-6xl">
            Software License Agreement
          </h1>

          <p className="mt-6 text-neutral-500">Effective August 24, 2026</p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="max-w-3xl space-y-12 text-lg leading-8 text-neutral-700">
            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                License grant
              </h2>

              <p className="mt-4">
                When you purchase or legally receive OrgToolTank software, you
                receive a limited, non-exclusive, non-transferable license to
                use that software for your own lawful purposes, subject to this
                agreement.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                You are buying a license, not the software itself
              </h2>

              <p className="mt-4">
                Purchasing an OrgToolTank software product gives you permission
                to use the software. It does not transfer ownership of the
                software, source code, design, branding, documentation, or other
                intellectual property.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Permitted use
              </h2>

              <p className="mt-4">
                You may install and use the software according to the device,
                user, or license limits stated on the product page or during
                purchase.
              </p>

              <p className="mt-4">
                If a product is sold as a single-user license, the license is
                intended for use by one purchaser and may not be freely shared
                with other people.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Restrictions
              </h2>

              <p className="mt-4">
                Unless applicable law gives you a right that cannot be
                restricted, you may not:
              </p>

              <ul className="mt-4 list-disc space-y-3 pl-6">
                <li>Resell or redistribute the software without permission.</li>
                <li>
                  Share a paid license, activation key, download, or account in
                  a way that avoids purchasing additional required licenses.
                </li>
                <li>
                  Claim the software or OrgToolTank intellectual property as
                  your own.
                </li>
                <li>
                  Remove or intentionally bypass licensing, ownership, or
                  security measures.
                </li>
                <li>
                  Copy or modify the software for the purpose of distributing a
                  competing or unauthorized version.
                </li>
                <li>
                  Use the software for unlawful, abusive, or fraudulent
                  purposes.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Updates and versions
              </h2>

              <p className="mt-4">
                OrgToolTank may release updates, fixes, improvements, or new
                versions of its software.
              </p>

              <p className="mt-4">
                Unless a product page or purchase offer states otherwise, the
                purchase of one software product does not automatically
                guarantee every future major version or future product.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Device and operating-system requirements
              </h2>

              <p className="mt-4">
                You are responsible for checking the supported operating system
                and other requirements before purchasing or installing the
                software.
              </p>

              <p className="mt-4">
                Different versions may be provided for macOS, Windows, Linux, or
                other platforms.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Your files and backups
              </h2>

              <p className="mt-4">
                You are responsible for maintaining appropriate backups of
                important files before using software that can organize, move,
                rename, modify, or remove files.
              </p>

              <p className="mt-4">
                Always review files carefully before approving actions that
                could change or remove data.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Local processing
              </h2>

              <p className="mt-4">
                Some OrgToolTank products are designed to process information
                locally on your device.
              </p>

              <p className="mt-4">
                For example, Duplicate Finder is designed to scan files on your
                computer without uploading those files to OrgToolTank for
                duplicate detection.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                No guarantee of error-free operation
              </h2>

              <p className="mt-4">
                Software is provided subject to the limitations described in the
                OrgToolTank Terms & Conditions. OrgToolTank does not guarantee
                that software will operate without interruption or error on
                every possible device, configuration, or operating system.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Termination
              </h2>

              <p className="mt-4">
                Your license may terminate if you materially violate this
                agreement, including unauthorized redistribution, license
                sharing, or misuse of the software.
              </p>

              <p className="mt-4">
                If the license terminates, you must stop using copies of the
                software that are no longer legally licensed.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">Refunds</h2>

              <p className="mt-4">
                Refunds for software purchases are governed by the OrgToolTank
                Refund Policy and applicable law.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">
                Changes to this agreement
              </h2>

              <p className="mt-4">
                OrgToolTank may update this Software License Agreement as its
                software, licensing methods, or business practices change.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#171717]">Contact</h2>

              <p className="mt-4">
                Questions about this Software License Agreement can be submitted
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
