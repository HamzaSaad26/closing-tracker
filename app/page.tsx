import Link from "next/link";
import { Header } from "@/components/Header";
import { OwnerBadge } from "@/components/OwnerBadge";
import { listDeals, type Deal } from "@/lib/deals";
import { median } from "@/lib/derive";
import { dueText, plural } from "@/lib/format";
import { PROJECT, STAGES, type Owner } from "@/lib/steps";

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
  const registered = deals.length - open.length;
  const atRisk = open.filter((d) => d.state.atRisk);
  const medianToSpa = median(deals.flatMap((d) => (d.state.daysToSpa === null ? [] : [d.state.daysToSpa])));

  const visible = deals.filter(view.match);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1440px] px-4 pb-10 pt-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              {PROJECT.name} · {PROJECT.location}
            </div>
            <h1 className="display mt-2 text-4xl sm:text-5xl">Reserved deals</h1>
            <p className="mt-2 text-[15px] text-muted">From reservation to registered, and whose turn it is.</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="In progress" value={String(open.length)} hint="reserved, not yet registered" />
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
          <Stat label="Registered" value={String(registered)} hint="with Dubai Land Department" />
        </div>

        <nav
          className="glass mt-6 inline-flex max-w-full gap-1 overflow-x-auto rounded-full p-1"
          aria-label="Filter deals"
        >
          {VIEWS.map((v) => {
            const count = deals.filter(v.match).length;
            const active = v.key === view.key;
            return (
              <Link
                key={v.key}
                href={v.key === "all" ? "/" : `/?view=${v.key}`}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition ${
                  active
                    ? "bg-ink font-medium text-white shadow-[0_6px_14px_-8px_rgba(16,22,36,0.8)]"
                    : "text-muted hover:bg-white/70 hover:text-ink"
                }`}
              >
                {v.key === "risk" && <span className="h-1.5 w-1.5 rounded-full bg-risk-dot" aria-hidden />}
                {v.label}
                <span className={`tabular text-xs ${active ? "text-white/60" : "text-faint"}`}>{count}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-5 overflow-x-auto pb-4">
          <div className="grid min-w-[1240px] grid-cols-6 gap-3">
            {STAGES.map((stage) => {
              const column = visible
                .filter((d) => d.state.stage === stage)
                .sort((a, b) => (a.state.daysToDue ?? 999) - (b.state.daysToDue ?? 999));
              return (
                <section key={stage} className="rounded-[22px] border border-white/60 bg-white/40 p-2 backdrop-blur-md">
                  <h2 className="flex items-center justify-between px-2 pb-2 pt-1 text-[13px] font-semibold">
                    {stage}
                    <span className="tabular rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-medium text-muted ring-1 ring-line">
                      {column.length}
                    </span>
                  </h2>
                  <div className="flex flex-col gap-2">
                    {column.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-line px-3 py-8 text-center text-xs text-faint">
                        No deals
                      </div>
                    ) : (
                      column.map((d) => <DealCard key={d.id} deal={d} />)
                    )}
                  </div>
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
  hint?: string;
  tone?: "default" | "risk";
}) {
  return (
    <div className="glass rounded-2xl px-4 py-3.5">
      <div className="flex items-center gap-1.5 text-[13px] text-muted">
        {tone === "risk" && <span className="h-1.5 w-1.5 rounded-full bg-risk-dot" aria-hidden />}
        {label}
      </div>
      <div
        className={`tabular mt-1 text-[40px] font-semibold leading-none tracking-[-0.04em] ${
          tone === "risk" ? "text-risk" : "text-accent"
        }`}
      >
        {value}
      </div>
      {hint && <div className="mt-1.5 text-xs text-faint">{hint}</div>}
    </div>
  );
}

function DealCard({ deal }: { deal: Deal }) {
  const { state } = deal;
  const next = state.next;

  return (
    <Link
      href={`/deals/${deal.id}`}
      className={`group block rounded-2xl bg-white p-3.5 shadow-[var(--shadow-float)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] ${
        state.atRisk ? "ring-[1.5px] ring-risk-dot/70" : ""
      } ${state.complete ? "opacity-75" : ""}`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[17px] font-semibold tracking-[-0.02em]">{deal.unit}</span>
        <span className="text-xs text-faint">{deal.unitType}</span>
      </div>
      <div className="mt-0.5 truncate text-sm">{deal.buyerName}</div>
      <div className="truncate text-xs text-faint">via {deal.broker.name}</div>

      {next ? (
        <div className="mt-3 rounded-xl bg-mist px-2.5 py-2">
          <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">Next</div>
          <div className="mt-0.5 text-[13px] font-medium leading-snug">{next.def.label}</div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <OwnerBadge owner={next.def.owner} />
            <span className={`text-xs ${state.atRisk ? "font-semibold text-risk" : "text-muted"}`}>
              {dueText(state.daysToDue!)}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-accent-soft px-2.5 py-2 text-xs font-semibold text-accent-deep">
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden>
            <path d="M4 10.5l3.5 3.5L16 5.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Registered
        </div>
      )}
      {next && <div className="mt-2 px-0.5 text-[11px] text-faint">{plural(state.daysInStage, "day")} in this stage</div>}
    </Link>
  );
}
