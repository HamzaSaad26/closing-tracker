import Link from "next/link";
import { PROJECT } from "@/lib/steps";

export function Header() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-sm font-bold text-white">C</span>
          <span className="font-semibold">Closing Tracker</span>
        </Link>
        <div className="text-right text-sm leading-tight">
          <div className="font-medium">{PROJECT.name}</div>
          <div className="text-muted">Sales admin view</div>
        </div>
      </div>
    </header>
  );
}
