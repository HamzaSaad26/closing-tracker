"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { resetDemo } from "@/app/actions";

interface Props {
  name: string;
  role: string;
  project: string;
}

/** Account pill in the header. Holds the demo reset, out of the way of the main flow. */
export function AccountMenu({ name, role, project }: Props) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function close() {
    setOpen(false);
    setConfirming(false);
  }

  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-line bg-white/70 py-1 pl-1 pr-3 text-sm shadow-[0_1px_2px_rgba(16,22,36,0.05)] transition hover:bg-white"
      >
        <Avatar initials={initials} />
        <span className="hidden font-medium sm:inline">{project}</span>
        <svg
          viewBox="0 0 20 20"
          className={`h-3.5 w-3.5 text-faint transition ${open ? "rotate-180" : ""}`}
          fill="none"
          aria-hidden
        >
          <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          // Solid white rather than the `glass` utility: a backdrop blur nested inside the
          // header's own blur can't see the page, so text behind would show through.
          className="absolute right-0 top-[calc(100%+8px)] z-40 w-[300px] max-w-[calc(100vw-32px)] rounded-[22px] bg-white p-2 shadow-[0_0_0_1px_rgba(16,22,36,0.06),var(--shadow-soft)]"
        >
          <div className="flex items-center gap-3 px-3 py-3">
            <Avatar initials={initials} size="lg" />
            <div className="min-w-0">
              <div className="truncate font-semibold tracking-[-0.01em]">{name}</div>
              <div className="truncate text-xs text-muted">
                {role} · {project}
              </div>
            </div>
          </div>

          <div className="mx-1 rounded-2xl bg-mist p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-accent-deep">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-2" aria-hidden />
              Demo data
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Everyone with the link shares this board. Reset puts back the original 25 deals with today&apos;s dates.
              Deal pages and buyer links stay the same.
            </p>

            {confirming ? (
              <form action={resetDemo} className="mt-3 flex gap-2">
                <ConfirmButton />
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="rounded-full px-3 py-2 text-sm font-medium text-muted transition hover:bg-white hover:text-ink"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                type="button"
                role="menuitem"
                onClick={() => setConfirming(true)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-sm font-medium shadow-[0_1px_2px_rgba(16,22,36,0.05)] transition hover:border-ink/20"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
                  <path
                    d="M4 10a6 6 0 1 0 1.8-4.3M4 4v3.5h3.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Reset demo data
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex-1 rounded-full bg-ink px-3 py-2 text-sm font-medium text-white shadow-[0_8px_18px_-10px_rgba(16,22,36,0.9)] transition hover:bg-ink/85 disabled:opacity-60"
    >
      {pending ? "Resetting…" : "Yes, reset all deals"}
    </button>
  );
}

function Avatar({ initials, size = "sm" }: { initials: string; size?: "sm" | "lg" }) {
  const dim = size === "lg" ? "h-10 w-10 text-sm" : "h-7 w-7 text-[11px]";
  return (
    <span className={`field relative grid shrink-0 place-items-center rounded-full font-semibold text-white ${dim}`}>
      {initials}
      <span
        className={`absolute -bottom-0.5 -right-0.5 rounded-full bg-live ring-2 ring-white ${
          size === "lg" ? "h-3 w-3" : "h-2.5 w-2.5"
        }`}
        aria-hidden
      />
    </span>
  );
}
