import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WhatsAppIcon } from "@/components/WhatsAppButton";
import { getDealByToken, type Deal } from "@/lib/deals";
import { firstName, fmtAed, fmtDate, fmtLongDate, waLink } from "@/lib/format";
import { DEPOSIT_RATE, PROJECT, STEPS } from "@/lib/steps";

// The buyer's private status page. No login: the token in the URL is the key.
// It only ever shows what the buyer needs: progress, the next step, who to
// contact. No internal notes, risk flags or other deals.

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Your purchase · ${PROJECT.name}`,
  robots: { index: false, follow: false },
};

export default async function BuyerPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const deal = await getDealByToken(token);
  if (!deal) notFound();

  const { state } = deal;
  const total = STEPS.length;

  return (
    <main className="mx-auto min-h-dvh max-w-md px-3 pb-10 pt-3 sm:pt-8">
      {/* Hero */}
      <section className="field-deep relative overflow-hidden rounded-[28px] px-6 pb-14 pt-6 text-white shadow-[0_30px_60px_-30px_rgba(34,52,90,0.9)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
        />
        <div className="relative">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
            {PROJECT.name} · {PROJECT.location}
          </div>
          <h1 className="display mt-6 text-[44px]">Hi {firstName(deal.buyerName)},</h1>
          <p className="mt-2 text-[17px] leading-snug text-white/80">
            here&apos;s where your purchase of <span className="font-semibold text-white">unit {deal.unit}</span>{" "}
            stands.
          </p>

          <div className="mt-7">
            <div className="flex justify-between text-xs text-white/70">
              <span className="font-medium text-white">
                {state.complete ? "Complete" : `${state.doneCount} of ${total} steps done`}
              </span>
              <span>Reserved {fmtDate(deal.reservedAt)}</span>
            </div>
            <div className="mt-2 flex gap-1.5" aria-hidden>
              {STEPS.map((s, i) => (
                <div
                  key={s.key}
                  className={`h-1.5 flex-1 rounded-full ${
                    i < state.doneCount ? "bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]" : "bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="relative -mt-9 px-1">
        <NextStepCard deal={deal} />
      </div>

      <section className="glass mt-4 rounded-[24px] px-5 py-5">
        <h2 className="text-[13px] font-semibold">Your timeline</h2>
        <ol className="mt-4">
          <TimelineItem title="Unit reserved" detail={fmtDate(deal.reservedAt)} status="done" />
          {state.steps.map((s, i) => (
            <TimelineItem
              key={s.def.key}
              title={s.def.buyerLabel}
              detail={i < state.doneCount ? fmtDate(s.doneAt!) : `by ${fmtDate(s.dueAt)}`}
              status={i < state.doneCount ? "done" : i === state.doneCount ? "current" : "upcoming"}
              last={i === state.steps.length - 1}
            />
          ))}
        </ol>
      </section>

      <section className="mt-4">
        <h2 className="px-2 text-[13px] font-semibold">Questions?</h2>
        <div className="mt-2 flex flex-col gap-2">
          <Contact role="Your broker" name={deal.broker.name} detail={deal.broker.agency} href={waLink(deal.broker.phone)} />
          <Contact
            role={`${PROJECT.developer} sales team`}
            name={PROJECT.salesContact.name}
            detail={PROJECT.salesContact.role}
            href={waLink(PROJECT.salesContact.phone)}
          />
        </div>
      </section>

      <p className="mt-8 text-center text-xs text-faint">This page is private to you. Please don&apos;t share the link.</p>
    </main>
  );
}

function NextStepCard({ deal }: { deal: Deal }) {
  const { state } = deal;
  const next = state.next;

  if (!next) {
    return (
      <div className="glass rounded-[24px] bg-white/85 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-accent-deep">
          <span className="field grid h-6 w-6 place-items-center rounded-full">
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden>
              <path d="M4 10.5l3.5 3.5L16 5.5" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          All done
        </div>
        <p className="mt-2 text-[15px] leading-relaxed">
          Your unit is registered with the Dubai Land Department. Your broker will be in touch about the payment plan and
          handover.
        </p>
      </div>
    );
  }

  const late = state.atRisk;
  const owner = next.def.owner;
  const heading =
    owner === "buyer" ? "What we need from you" : owner === "broker" ? "Your broker is on it" : "Nothing needed from you";

  return (
    <div className="glass rounded-[24px] bg-white/85 p-5">
      <div
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
          owner === "buyer" ? "bg-buyer-soft text-buyer" : "bg-accent-soft text-accent-deep"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${owner === "buyer" ? "bg-buyer-dot" : "bg-accent-2"}`} aria-hidden />
        {heading}
      </div>
      <div className="mt-3 text-[22px] font-semibold leading-tight tracking-[-0.02em]">{next.def.buyerLabel}</div>
      <p className="mt-2 text-[15px] leading-relaxed text-ink/85">{next.def.buyerNext}</p>

      {next.def.key === "deposit" && (
        <div className="mt-4 flex items-baseline justify-between rounded-2xl bg-mist px-4 py-3">
          <span className="text-sm text-muted">Amount</span>
          <span className="text-right">
            <span className="tabular text-xl font-semibold tracking-[-0.02em] text-accent-deep">
              {fmtAed(Math.round(deal.priceAed * DEPOSIT_RATE))}
            </span>
            <span className="block text-xs text-faint">{Math.round(DEPOSIT_RATE * 100)}% of the price</span>
          </span>
        </div>
      )}

      <div className="mt-4 border-t border-line pt-3 text-sm text-muted">
        {owner === "buyer" ? (
          late ? (
            <span>
              This was due on <span className="font-semibold text-ink">{fmtLongDate(next.dueAt)}</span>. If something is
              holding you up, message {firstName(deal.broker.name)} so we can help.
            </span>
          ) : (
            <span>
              Please complete by <span className="font-semibold text-ink">{fmtLongDate(next.dueAt)}</span>.
            </span>
          )
        ) : late ? (
          <span>This is taking a little longer than planned. {firstName(deal.broker.name)} can give you an update.</span>
        ) : (
          <span>
            Expected by <span className="font-semibold text-ink">{fmtLongDate(next.dueAt)}</span>.
          </span>
        )}
      </div>
    </div>
  );
}

function TimelineItem({
  title,
  detail,
  status,
  last = false,
}: {
  title: string;
  detail: string;
  status: "done" | "current" | "upcoming";
  last?: boolean;
}) {
  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!last && (
        <span
          aria-hidden
          className={`absolute left-[10px] top-6 h-[calc(100%-16px)] w-[2px] rounded-full ${
            status === "done" ? "bg-accent-2/70" : "bg-line"
          }`}
        />
      )}
      <span
        aria-hidden
        className={`relative mt-0.5 grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full ${
          status === "done"
            ? "field shadow-[0_4px_10px_-4px_rgba(59,86,144,0.8)]"
            : status === "current"
              ? "bg-white ring-2 ring-accent"
              : "bg-white ring-1 ring-line"
        }`}
      >
        {status === "done" ? (
          <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none">
            <path d="M4 10.5l3.5 3.5L16 5.5" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : status === "current" ? (
          <span className="h-2 w-2 rounded-full bg-accent" />
        ) : null}
      </span>
      <div className="flex flex-1 items-baseline justify-between gap-3">
        <span
          className={`text-[15px] ${
            status === "upcoming" ? "text-faint" : status === "current" ? "font-semibold" : "text-ink"
          }`}
        >
          {title}
        </span>
        <span className="tabular shrink-0 text-xs text-faint">{detail}</span>
      </div>
    </li>
  );
}

function Contact({ role, name, detail, href }: { role: string; name: string; detail: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="glass flex items-center justify-between gap-3 rounded-[20px] px-4 py-3.5 transition hover:bg-white/90"
    >
      <div className="min-w-0">
        <div className="text-xs text-faint">{role}</div>
        <div className="truncate font-semibold tracking-[-0.01em]">{name}</div>
        <div className="truncate text-xs text-muted">{detail}</div>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-xs font-semibold text-white">
        <span className="text-wa">
          <WhatsAppIcon />
        </span>
        WhatsApp
      </span>
    </a>
  );
}
