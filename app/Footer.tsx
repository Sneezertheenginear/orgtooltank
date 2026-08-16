export default function Footer() {
  return (
    <footer className="bg-[#171717] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xl font-black">OrgToolTank</div>

          <div className="mt-1 text-sm text-neutral-400">
            Practical tools for real organizations.
          </div>
        </div>

        <div className="text-sm text-neutral-400">© 2026 OrgToolTank</div>
      </div>
    </footer>
  );
}
