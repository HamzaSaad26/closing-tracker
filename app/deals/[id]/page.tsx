import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyerLinkButtons } from "@/components/BuyerLinkButtons";
import { Header } from "@/components/Header";
import { OwnerBadge } from "@/components/OwnerBadge";
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
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <Link href="/" className="text-sm text-muted hover:text-ink">
          ← All deals
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight">
                {deal.unit} <span className="font-normal text-muted">· {deal.unitType}</span>
              </h1>
              <StageBadge stage={state.stage} atRisk={state.atRisk} />
            </div>
            <p className="mt-1 text-sm text-muted">
              {deal.buyerName} · {fmtAed(deal.priceAed)} · reserved {fmtDate(deal.reservedAt)}
            </p>
          </div>
          <BuyerLinkButtons token={deal.buyerToken} />
        </div>

        {state.next && (
          <div
            className={`mt-5 rounded-lg border px-4 py-3 text-sm ${
              state.atRisk ? "border-risk/30 bg-risk-soft" : "border-line bg-surface"
            }`}
          >
            <span className="font-semibold">Whose turn: </span>
            <OwnerBadge owner={state.next.def.owner} /> <span className="ml-1">{state.next.def.label}</span>
            <span className={state.atRisk ? "font-semibold text-risk" : "text-muted"}>
              {" "}
              — {dueText(state.daysToDue!)} ({fmtDate(state.next.dueAt)})
            </span>
            <span className="text-muted"> · {plural(state.daysInStage, "day")} in this stage</span>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Checklist</h2>
            <ol className="overflow-hidden rounded-lg border border-line bg-surface">
              {state.steps.map((step, i) => {
                const done = step.doneAt !== null && i < state.doneCount;
                const isNext = i === state.doneCount;
                const isLastDone = i === state.doneCount - 1;
                const overdue = isNext && state.atRisk;

                return (
                  <li
                    key={step.def.key}
                    className={`flex items-start gap-3 border-b border-line px-4 py-3.5 last:border-b-0 ${
                      isNext ? "bg-accent-soft/50" : ""
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px] font-bold ${
                        done
                          ? "border-accent bg-accent text-white"
                          : overdue
                            ? "border-risk text-risk"
                            : "border-line text-muted"
                      }`}
                    >
                      {done ? "✓" : i + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`font-medium ${done ? "" : isNext ? "" : "text-muted"}`}>{step.def.label}</span>
                        <OwnerBadge owner={step.def.owner} />
                      </div>
                      <div className="tabular mt-0.5 text-xs text-muted">
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
                            Due {fmtDate(step.dueAt)} (day {step.def.dueDay})
                          </span>
                        )}
                      </div>
                    </div>

                    {isNext && (
                      <form action={completeStep.bind(null, deal.id, step.def.key)}>
                        <button className="rounded-md bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-ink/85">
                          Mark done
                        </button>
                      </form>
                    )}
                    {isLastDone && (
                      <form action={undoStep.bind(null, deal.id, step.def.key)}>
                        <button className="rounded-md px-2 py-1.5 text-xs text-muted hover:bg-paper hover:text-ink">
                          Undo
                        </button>
                      </form>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>

          <aside className="space-y-6">
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">People</h2>
              <div className="divide-y divide-line rounded-lg border border-line bg-surface text-sm">
                <Person role="Buyer" name={deal.buyerName} phone={deal.buyerPhone} />
                <Person role={`Broker · ${deal.broker.agency}`} name={deal.broker.name} phone={deal.broker.phone} />
              </div>
            </section>

            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Activity</h2>
              <ol className="space-y-3 rounded-lg border border-line bg-surface px-4 py-3 text-sm">
                {eventRows.map((e) => (
                  <li key={e.id}>
                    <div>{e.message}</div>
                    <div className="tabular text-xs text-muted">
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
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        atRisk ? "bg-risk-soft text-risk" : "bg-accent-soft text-accent"
      }`}
    >
      {stage}
      {atRisk ? " · at risk" : ""}
    </span>
  );
}

function Person({ role, name, phone }: { role: string; name: string; phone: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <div className="text-xs text-muted">{role}</div>
        <div className="truncate font-medium">{name}</div>
      </div>
      <a
        href={waLink(phone)}
        target="_blank"
        rel="noreferrer"
        className="shrink-0 rounded-md border border-line px-2.5 py-1 text-xs font-medium hover:border-ink/30"
      >
        WhatsApp
      </a>
    </div>
  );
}
