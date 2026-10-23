import Link from "next/link";
import { Header } from "@/components/Header";
import { OwnerBadge } from "@/components/OwnerBadge";
import { listDeals, type Deal } from "@/lib/deals";
import { median } from "@/lib/derive";
import { dueText, plural } from "@/lib/format";
import { STAGES, type Owner } from "@/lib/steps";

export const dynamic = "force-dynamic";

type View = "all" | "risk" | Owner;

const VIEWS: { key: View; label: string; match: (d: Deal) => boolean }[] = [
  { key: "all", label: "All deals", match: () => true },
  { key: "risk", label: "At risk", match: (d) => d.state.atRisk },
  { key: "buyer", label: "Waiting on buyer", match: (d) => d.state.next?.def.owner === "buyer" },
  { key: "broker", label: "Waiting on broker", match: (d) => d.state.next?.def.owner === "broker" },
  { key: "developer", label: "Waiting on developer", match: (d) => d.state.next?.def.owner === "developer" },
];

export default async function BoardPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view: viewParam } = await searchParams;
  const view = VIEWS.find((v) => v.key === viewParam) ?? VIEWS[0];

  const deals = await listDeals();
  const open = deals.filter((d) => !d.state.complete);
  const atRisk = open.filter((d) => d.state.atRisk);
  const medianToSpa = median(deals.flatMap((d) => (d.state.daysToSpa === null ? [] : [d.state.daysToSpa])));

  const visible = deals.filter(view.match);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Reserved deals</h1>
            <p className="mt-1 text-sm text-muted">
              From reservation to registered. {plural(open.length, "deal")} still in progress.
            </p>
          </div>
          <div className="flex gap-3">
            <Stat
              label="At risk"
              value={String(atRisk.length)}
              hint="next step past its deadline"
              tone={atRisk.length > 0 ? "risk" : "default"}
            />
            <Stat
              label="Median days to SPA"
              value={medianToSpa === null ? "—" : String(Math.round(medianToSpa))}
              hint="reservation → SPA signed"
            />
          </div>
        </div>

        <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-line" aria-label="Filter deals">
          {VIEWS.map((v) => {
            const count = deals.filter(v.match).length;
            const active = v.key === view.key;
            return (
              <Link
                key={v.key}
                href={v.key === "all" ? "/" : `/?view=${v.key}`}
                className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm ${
                  active ? "border-accent font-semibold text-ink" : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {v.label}
                <span className="tabular ml-1.5 text-muted">{count}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-5 overflow-x-auto pb-4">
          <div className="grid min-w-[1180px] grid-cols-6 gap-3">
            {STAGES.map((stage) => {
              const column = visible.filter((d) => d.state.stage === stage);
              return (
                <section key={stage} className="flex flex-col gap-2">
                  <h2 className="flex items-baseline justify-between px-1 text-xs font-semibold uppercase tracking-wider text-muted">
                    {stage}
                    <span className="tabular">{column.length}</span>
                  </h2>
                  {column.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-xs text-muted">
                      No deals
                    </div>
                  ) : (
                    column
                      .sort((a, b) => (a.state.daysToDue ?? 999) - (b.state.daysToDue ?? 999))
                      .map((d) => <DealCard key={d.id} deal={d} />)
                  )}
                </section>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}

function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "risk";
}) {
  return (
    <div
      className={`min-w-40 rounded-lg border px-4 py-3 ${
        tone === "risk" ? "border-risk/30 bg-risk-soft" : "border-line bg-surface"
      }`}
    >
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className={`tabular mt-0.5 text-3xl font-semibold ${tone === "risk" ? "text-risk" : ""}`}>{value}</div>
      <div className="text-[11px] text-muted">{hint}</div>
    </div>
  );
}

function DealCard({ deal }: { deal: Deal }) {
  const { state } = deal;
  const next = state.next;

  return (
    <Link
      href={`/deals/${deal.id}`}
      className={`block rounded-lg border bg-surface p-3 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition hover:border-ink/30 ${
        state.atRisk ? "border-risk/50 ring-1 ring-risk/20" : "border-line"
      } ${state.complete ? "opacity-70" : ""}`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold">{deal.unit}</span>
        <span className="text-xs text-muted">{deal.unitType}</span>
      </div>
      <div className="mt-0.5 truncate text-sm">{deal.buyerName}</div>
      <div className="truncate text-xs text-muted">via {deal.broker.name}</div>

      {next ? (
        <div className="mt-3 border-t border-line pt-2.5">
          <div className="text-xs text-muted">Next</div>
          <div className="text-sm font-medium leading-snug">{next.def.label}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <OwnerBadge owner={next.def.owner} />
            <span className={`text-xs ${state.atRisk ? "font-semibold text-risk" : "text-muted"}`}>
              {dueText(state.daysToDue!)}
            </span>
          </div>
          <div className="mt-1.5 text-[11px] text-muted">{plural(state.daysInStage, "day")} in this stage</div>
        </div>
      ) : (
        <div className="mt-3 border-t border-line pt-2.5 text-xs font-medium text-accent">Registered ✓</div>
      )}
    </Link>
  );
}
