import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#171717] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-xl font-black">OrgToolTank</div>

            <div className="mt-1 text-sm text-neutral-400">
              Practical tech for everyday problems.
            </div>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-neutral-400">
            <Link href="/privacy" className="transition hover:text-white">
              Privacy
            </Link>

            <Link href="/terms" className="transition hover:text-white">
              Terms
            </Link>

            <Link href="/refunds" className="transition hover:text-white">
              Refunds
            </Link>

            <Link href="/license" className="transition hover:text-white">
              Software License
            </Link>

            <Link href="/contact" className="transition hover:text-white">
              Contact
            </Link>
          </div>

          <div className="flex flex-col items-start">
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">
              Visit OrgToolTank
            </div>

            <div className="rounded-xl bg-white p-2">
              <Image
                src="/orgtooltank-qr.png"
                alt="QR code for OrgToolTank"
                width={110}
                height={110}
              />
            </div>

            <div className="mt-2 text-xs text-neutral-400">
              Scan to visit the store
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-sm text-neutral-500">
          © 2026 OrgToolTank. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
