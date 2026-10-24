import Link from "next/link";
import { Logo } from "@/components/Header";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center px-4">
      <div className="glass w-full rounded-[28px] px-6 py-10 text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="display mt-5 text-2xl">Page not found</h1>
        <p className="mt-2 text-muted">This link may have expired or been typed incorrectly.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink/85"
        >
          Go to the deals board
        </Link>
      </div>
    </main>
  );
}
