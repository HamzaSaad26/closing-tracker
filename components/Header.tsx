import Link from "next/link";
import { AccountMenu } from "@/components/AccountMenu";
import { PROJECT } from "@/lib/steps";

export function Logo() {
  return (
    <span className="field grid h-8 w-8 place-items-center rounded-[10px] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_14px_-6px_rgba(59,86,144,0.7)]">
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
        <path d="M4 10.5l3.5 3.5L16 5.5" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function Header() {
  return (
    <header className="glass-bar sticky top-0 z-30 border-b border-line/80">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo />
          <span className="text-[17px] font-semibold tracking-[-0.02em]">Closing Tracker</span>
        </Link>
        <AccountMenu name={PROJECT.salesContact.name} role={PROJECT.salesContact.role} project={PROJECT.name} />
      </div>
    </header>
  );
}
