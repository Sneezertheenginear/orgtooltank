import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-black/10 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/">
          <div>
            <div className="text-2xl font-black tracking-tight">
              OrgToolTank
            </div>
            <div className="text-xs text-neutral-500">
              Practical tools for real organizations
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-8 text-sm font-medium">
          <Link href="/" className="hover:text-neutral-500">
            Home
          </Link>

          <Link href="/tools" className="hover:text-neutral-500">
            Tools
          </Link>

          <Link href="/who-we-build-for" className="hover:text-neutral-500">
            Who We Build For
          </Link>

          <Link href="/about" className="hover:text-neutral-500">
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
