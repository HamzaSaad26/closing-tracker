import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyerLinkButtons } from "@/components/BuyerLinkButtons";
import { Header } from "@/components/Header";
import { OwnerBadge } from "@/components/OwnerBadge";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getDeal, listEvents } from "@/lib/deals";
import { dueText, fmtAed, fmtDate, fmtDateTime, plural, waLink } from "@/lib/format";
import { completeStep, undoStep } from "./actions";

export const dynamic = "force-dynamic";

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dealId = Number(id);
  if (!Number.isInteger(dealId)) notFound();

  const deal = await getDeal(dealId);
  if (!deal) notFound();
  const eventRows = await listEvents(dealId);
  const { state } = deal;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-12 pt-6 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm text-muted transition hover:bg-white/70 hover:text-ink"
        >
          ← All deals
        </Link>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="display text-4xl">
                {deal.unit} <span className="font-normal text-faint">· {deal.unitType}</span>
              </h1>
              <StageBadge stage={state.stage} atRisk={state.atRisk} />
            </div>
            <p className="mt-2 text-[15px] text-muted">
              {deal.buyerName} · <span className="tabular">{fmtAed(deal.priceAed)}</span> · reserved{" "}
              {fmtDate(deal.reservedAt)}
            </p>
          </div>
          <BuyerLinkButtons token={deal.buyerToken} />
        </div>

        {state.next && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink px-5 py-3.5 text-sm text-white shadow-[0_18px_40px_-20px_rgba(16,22,36,0.8)]">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-white/60">Whose turn</span>
              <OwnerBadge owner={state.next.def.owner} tone="dark" />
              <span className="font-medium">{state.next.def.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {state.atRisk && <span className="h-2 w-2 rounded-full bg-risk-dot" aria-hidden />}
              <span className={`tabular font-semibold ${state.atRisk ? "text-[#ff8a98]" : ""}`}>
                {dueText(state.daysToDue!)}
              </span>
              <span className="text-white/50">
                · {fmtDate(state.next.dueAt)} · {plural(state.daysInStage, "day")} in stage
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_330px]">
          <section className="glass rounded-[24px] p-2">
            <h2 className="px-3 pb-2 pt-2 text-[13px] font-semibold">Checklist</h2>
            <ol className="flex flex-col gap-1">
              {state.steps.map((step, i) => {
                const done = step.doneAt !== null && i < state.doneCount;
                const isNext = i === state.doneCount;
                const isLastDone = i === state.doneCount - 1;
                const overdue = isNext && state.atRisk;

                return (
                  <li
                    key={step.def.key}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 ${
                      isNext ? "bg-white shadow-[var(--shadow-float)]" : ""
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                        done
                          ? "field text-white shadow-[0_4px_10px_-4px_rgba(59,86,144,0.8)]"
                          : overdue
                            ? "bg-risk-soft text-risk ring-1 ring-risk-dot/50"
                            : isNext
                              ? "bg-accent-soft text-accent-deep ring-1 ring-accent/30"
                              : "bg-white/70 text-faint ring-1 ring-line"
                      }`}
                    >
                      {done ? (
                        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none">
                          <path d="M4 10.5l3.5 3.5L16 5.5" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[15px] font-medium ${done || isNext ? "" : "text-muted"}`}>
                          {step.def.label}
                        </span>
                        <OwnerBadge owner={step.def.owner} />
                      </div>
                      <div className="tabular mt-0.5 text-xs text-faint">
                        {done ? (
                          <>
                            Done {fmtDateTime(step.doneAt!)}
                            {step.doneBy ? ` · ${step.doneBy}` : ""}
                            {step.doneAt! > step.dueAt && (
                              <span className="text-risk">
                                {" "}
                                · {plural(Math.ceil((step.doneAt! - step.dueAt) / 86_400_000), "day")} late
                              </span>
                            )}
                          </>
                        ) : (
                          <span className={overdue ? "font-semibold text-risk" : ""}>
                            Due {fmtDate(step.dueAt)} · day {step.def.dueDay}
                          </span>
                        )}
                      </div>
                    </div>

                    {isNext && (
                      <form action={completeStep.bind(null, deal.id, step.def.key)}>
                        <button className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white shadow-[0_8px_18px_-10px_rgba(16,22,36,0.9)] transition hover:bg-ink/85">
                          Mark done
                        </button>
                      </form>
                    )}
                    {isLastDone && (
                      <form action={undoStep.bind(null, deal.id, step.def.key)}>
                        <button className="rounded-full px-3 py-1.5 text-xs font-medium text-muted transition hover:bg-white hover:text-ink">
                          Undo
                        </button>
                      </form>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>

          <aside className="flex flex-col gap-5">
            <section className="glass rounded-[24px] p-2">
              <h2 className="px-3 pb-2 pt-2 text-[13px] font-semibold">People</h2>
              <div className="flex flex-col gap-1">
                <Person role="Buyer" name={deal.buyerName} href={waLink(deal.buyerPhone)} />
                <Person role={`Broker · ${deal.broker.agency}`} name={deal.broker.name} href={waLink(deal.broker.phone)} />
              </div>
            </section>

            <section className="glass rounded-[24px] p-2">
              <h2 className="px-3 pb-2 pt-2 text-[13px] font-semibold">Activity</h2>
              <ol className="flex flex-col gap-3 px-3 pb-3 text-sm">
                {eventRows.map((e) => (
                  <li key={e.id} className="relative pl-4">
                    <span className="absolute left-0 top-[7px] h-1.5 w-1.5 rounded-full bg-accent-2" aria-hidden />
                    <div className="leading-snug">{e.message}</div>
                    <div className="tabular mt-0.5 text-xs text-faint">
                      {fmtDateTime(e.at)} · {e.actor}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}

function StageBadge({ stage, atRisk }: { stage: string; atRisk: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        atRisk ? "bg-risk-soft text-risk" : "bg-accent-soft text-accent-deep"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${atRisk ? "bg-risk-dot" : "bg-accent"}`} aria-hidden />
      {stage}
      {atRisk ? " · at risk" : ""}
    </span>
  );
}

function Person({ role, name, href }: { role: string; name: string; href: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 px-3 py-2.5">
      <div className="min-w-0">
        <div className="text-xs text-faint">{role}</div>
        <div className="truncate font-medium">{name}</div>
      </div>
      <WhatsAppButton href={href} />
    </div>
  );
}
