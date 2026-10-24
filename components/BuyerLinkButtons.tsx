"use client";

import { useState } from "react";

export function BuyerLinkButtons({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const path = `/b/${token}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (e.g. insecure context); the open button still works.
    }
  }

  return (
    <div className="flex gap-2">
      <a
        href={path}
        target="_blank"
        rel="noreferrer"
        className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white shadow-[0_8px_18px_-10px_rgba(16,22,36,0.9)] transition hover:bg-ink/85"
      >
        Open buyer link ↗
      </a>
      <button
        type="button"
        onClick={copy}
        className="rounded-full border border-line bg-white/80 px-4 py-2 text-sm font-medium shadow-[0_1px_2px_rgba(16,22,36,0.05)] backdrop-blur transition hover:bg-white"
      >
        {copied ? "Copied ✓" : "Copy link"}
      </button>
    </div>
  );
}
