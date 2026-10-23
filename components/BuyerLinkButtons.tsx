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
        className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90"
      >
        Open buyer link ↗
      </a>
      <button
        type="button"
        onClick={copy}
        className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-medium hover:border-ink/30"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
