import { RESERVED_STAGE, STEPS, type StepDef } from "./steps";

// Pure functions that turn stored rows into what the screens show.
// Nothing here is stored: stage, deadlines and "at risk" are all computed from
// the checklist and the current time whenever a page is read, so no background
// job is needed and nothing can drift out of sync.

export const DAY_MS = 24 * 60 * 60 * 1000;

export interface StepRow {
  key: string;
  doneAt: number | null;
  doneBy: string | null;
}

export interface StepState {
  def: StepDef;
  dueAt: number;
  doneAt: number | null;
  doneBy: string | null;
}

export interface DealState {
  steps: StepState[];
  /** Number of steps done, counted in order from the first. */
  doneCount: number;
  stage: string;
  /** The first step that isn't done yet; null once the deal is fully registered. */
  next: StepState | null;
  complete: boolean;
  /** When the deal entered its current stage. */
  stageSince: number;
  daysInStage: number;
  /** Whole days until the next step's deadline; negative when overdue. */
  daysToDue: number | null;
  atRisk: boolean;
  /** Days from reservation to a signed SPA, once signed. */
  daysToSpa: number | null;
}

export function wholeDays(ms: number): number {
  return Math.floor(ms / DAY_MS);
}

export function deriveDeal(reservedAt: number, rows: StepRow[], now: number): DealState {
  const byKey = new Map(rows.map((r) => [r.key, r]));

  const steps: StepState[] = STEPS.map((def) => {
    const row = byKey.get(def.key);
    return {
      def,
      dueAt: reservedAt + def.dueDay * DAY_MS,
      doneAt: row?.doneAt ?? null,
      doneBy: row?.doneBy ?? null,
    };
  });

  // Steps are sequential: the deal's progress is the run of done steps from the start.
  let doneCount = 0;
  while (doneCount < steps.length && steps[doneCount].doneAt !== null) doneCount++;

  const next = doneCount < steps.length ? steps[doneCount] : null;
  const last = doneCount > 0 ? steps[doneCount - 1] : null;
  const stage = last ? last.def.stage : RESERVED_STAGE;
  const stageSince = last?.doneAt ?? reservedAt;

  const signed = steps.find((s) => s.def.key === "spa_signed");
  const daysToSpa =
    signed && signed.doneAt !== null && doneCount >= 4 ? wholeDays(signed.doneAt - reservedAt) : null;

  const daysToDue = next ? Math.ceil((next.dueAt - now) / DAY_MS) : null;

  return {
    steps,
    doneCount,
    stage,
    next,
    complete: next === null,
    stageSince,
    daysInStage: wholeDays(now - stageSince),
    daysToDue,
    atRisk: next !== null && now > next.dueAt,
    daysToSpa,
  };
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
