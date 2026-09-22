"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [["/", "Home"], ["/experiments", "Experiments"], ["/categories", "Categories"], ["/about", "About"], ["/request-app", "Request an App"], ["/contact", "Contact"]];

export default function Header() {
  const pathname = usePathname();
  return (
    <header className="border-b border-black/10 bg-white text-neutral-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="w-fit">
          <div className="text-2xl font-black tracking-tight">ORGTOOLTANK<span aria-hidden="true">.</span></div>
        </Link>
        <nav aria-label="Main navigation" className="flex flex-wrap gap-x-6 gap-y-2 text-base font-semibold">
          {links.map(([href, label]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={`border-b-2 py-2 transition hover:border-black ${pathname === href ? "border-black" : "border-transparent text-neutral-600"}`}>{label}</Link>)}
        </nav>
      </div>
    </header>
  );
}
