import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
    <main className="mx-auto min-h-dvh max-w-md bg-surface px-5 pb-10 pt-6 sm:my-6 sm:min-h-0 sm:rounded-2xl sm:border sm:border-line">
      <div className="text-xs font-medium uppercase tracking-wider text-muted">
        {PROJECT.name} · {PROJECT.location}
      </div>

      <h1 className="mt-4 text-2xl font-semibold leading-tight tracking-tight">Hi {firstName(deal.buyerName)},</h1>
      <p className="mt-1 text-muted">
        Here&apos;s where your purchase of <span className="font-medium text-ink">unit {deal.unit}</span> stands.
      </p>

      <div className="mt-5">
        <div className="flex justify-between text-xs text-muted">
          <span>{state.complete ? "Complete" : `${state.doneCount} of ${total} steps done`}</span>
          <span>Reserved {fmtDate(deal.reservedAt)}</span>
        </div>
        <div className="mt-1.5 flex gap-1" aria-hidden>
          {STEPS.map((s, i) => (
            <div key={s.key} className={`h-1.5 flex-1 rounded-full ${i < state.doneCount ? "bg-accent" : "bg-line"}`} />
          ))}
        </div>
      </div>

      <NextStepCard deal={deal} />

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Your timeline</h2>
        <ol className="mt-3">
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

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Questions?</h2>
        <div className="mt-3 space-y-2">
          <Contact
            role="Your broker"
            name={deal.broker.name}
            detail={deal.broker.agency}
            phone={deal.broker.phone}
          />
          <Contact
            role={`${PROJECT.developer} sales team`}
            name={PROJECT.salesContact.name}
            detail={PROJECT.salesContact.role}
            phone={PROJECT.salesContact.phone}
          />
        </div>
      </section>

      <p className="mt-8 text-center text-xs text-muted">
        This page is private to you. Please don&apos;t share the link.
      </p>
    </main>
  );
}

function NextStepCard({ deal }: { deal: Deal }) {
  const { state } = deal;
  const next = state.next;
  if (!next) {
    return (
      <div className="mt-6 rounded-xl bg-accent-soft p-5">
        <div className="text-sm font-semibold text-accent">All done</div>
        <p className="mt-1">
          Your unit is registered with the Dubai Land Department. Your broker will be in touch about the payment plan
          and handover.
        </p>
      </div>
    );
  }

  const late = state.atRisk;
  const owner = next.def.owner;
  const heading =
    owner === "buyer" ? "What we need from you" : owner === "broker" ? "Your broker is on it" : "Nothing needed from you";

  return (
    <div className={`mt-6 rounded-xl p-5 ${owner === "buyer" ? "bg-buyer-soft" : "bg-paper"}`}>
      <div className={`text-sm font-semibold ${owner === "buyer" ? "text-buyer" : "text-muted"}`}>{heading}</div>
      <div className="mt-1 text-lg font-semibold leading-snug">{next.def.buyerLabel}</div>
      <p className="mt-2 text-[15px] leading-relaxed">{next.def.buyerNext}</p>

      {next.def.key === "deposit" && (
        <p className="mt-2 text-[15px]">
          Amount: <span className="tabular font-semibold">{fmtAed(Math.round(deal.priceAed * DEPOSIT_RATE))}</span>{" "}
          <span className="text-muted">({Math.round(DEPOSIT_RATE * 100)}% of the price)</span>
        </p>
      )}

      <div className="mt-4 border-t border-black/5 pt-3 text-sm">
        {owner === "buyer" ? (
          late ? (
            <span>
              This was due on <span className="font-semibold">{fmtLongDate(next.dueAt)}</span>. If something is
              holding you up, message {firstName(deal.broker.name)} so we can help.
            </span>
          ) : (
            <span>
              Please complete by <span className="font-semibold">{fmtLongDate(next.dueAt)}</span>.
            </span>
          )
        ) : late ? (
          <span>This is taking a little longer than planned. {firstName(deal.broker.name)} can give you an update.</span>
        ) : (
          <span>
            Expected by <span className="font-semibold">{fmtLongDate(next.dueAt)}</span>.
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
          className={`absolute left-[9px] top-5 h-[calc(100%-12px)] w-px ${status === "done" ? "bg-accent" : "bg-line"}`}
        />
      )}
      <span
        aria-hidden
        className={`relative mt-0.5 grid h-[19px] w-[19px] shrink-0 place-items-center rounded-full border-2 text-[10px] font-bold ${
          status === "done"
            ? "border-accent bg-accent text-white"
            : status === "current"
              ? "border-accent bg-surface"
              : "border-line bg-surface"
        }`}
      >
        {status === "done" ? "✓" : status === "current" ? <span className="h-2 w-2 rounded-full bg-accent" /> : null}
      </span>
      <div className="flex flex-1 items-baseline justify-between gap-3">
        <span className={status === "upcoming" ? "text-muted" : status === "current" ? "font-semibold" : ""}>
          {title}
        </span>
        <span className="tabular shrink-0 text-xs text-muted">{detail}</span>
      </div>
    </li>
  );
}

function Contact({ role, name, detail, phone }: { role: string; name: string; detail: string; phone: string }) {
  return (
    <a
      href={waLink(phone)}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 hover:border-ink/30"
    >
      <div className="min-w-0">
        <div className="text-xs text-muted">{role}</div>
        <div className="truncate font-medium">{name}</div>
        <div className="truncate text-xs text-muted">{detail}</div>
      </div>
      <span className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white">WhatsApp</span>
    </a>
  );
}
