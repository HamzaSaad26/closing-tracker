import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-5 py-24 text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-muted">This link may have expired or been typed incorrectly.</p>
      <Link href="/" className="mt-6 inline-block text-sm font-medium text-accent">
        Go to the deals board
      </Link>
    </main>
  );
}
