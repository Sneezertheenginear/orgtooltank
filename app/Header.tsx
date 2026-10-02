"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import DonateLink from "./experiment-components/DonateLink";

const links = [["/", "Home"], ["/experiments", "Experiments"], ["/workbench", "Workbench"], ["/shop", "Shop"], ["/categories", "Categories"], ["/about", "About"], ["/request-app", "Request an App"], ["/contact", "Contact"]];
/** A section stays marked on its own pages too (a Workbench note, the outfit builder under Shop). */
const isCurrent = (pathname: string, href: string) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

export default function Header() {
  const pathname = usePathname();
  return (
    <header className="border-b border-black/10 bg-white text-neutral-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="w-fit">
          <div className="text-2xl font-black tracking-tight">ORGTOOLTANK<span aria-hidden="true">.</span></div>
        </Link>
        <nav aria-label="Main navigation" className="flex flex-wrap gap-x-6 gap-y-2 text-base font-semibold">
          {links.map(([href, label]) => { const current = isCurrent(pathname, href); return <Link key={href} href={href} aria-current={current ? "page" : undefined} className={`border-b-2 py-2 transition hover:border-black ${current ? "border-black" : "border-transparent text-neutral-600"}`}>{label}</Link>; })}
          {/* Support: straight to the donation link once DONATION_URL is set (app/data/support.ts); until then, the /support page. */}
          <DonateLink current={pathname === "/support"} className={`border-b-2 py-2 transition hover:border-black ${pathname === "/support" ? "border-black" : "border-transparent text-neutral-600"}`}>Support</DonateLink>
        </nav>
      </div>
    </header>
  );
}
