"use server";

import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getDeal } from "@/lib/deals";
import { events, steps } from "@/lib/schema";
import { ADMIN_ACTOR, type StepKey } from "@/lib/steps";

// Steps are sequential: only the next open step can be completed, and only
// the most recently completed step can be undone. Anything else is ignored,
// which also makes a double-click harmless.

export async function completeStep(dealId: number, key: StepKey) {
  const deal = await getDeal(dealId);
  if (!deal || deal.state.next?.def.key !== key) return;

  const now = Date.now();
  const updated = await db
    .update(steps)
    .set({ doneAt: now, doneBy: ADMIN_ACTOR })
    .where(and(eq(steps.dealId, dealId), eq(steps.key, key), isNull(steps.doneAt)))
    .returning({ id: steps.id });

  if (updated.length > 0) {
    await db.insert(events).values({
      dealId,
      at: now,
      actor: ADMIN_ACTOR,
      message: `Marked "${deal.state.next.def.label}" done`,
    });
  }
  refresh(dealId);
}

export async function undoStep(dealId: number, key: StepKey) {
  const deal = await getDeal(dealId);
  if (!deal || deal.state.doneCount === 0) return;
  const last = deal.state.steps[deal.state.doneCount - 1];
  if (last.def.key !== key) return;

  const updated = await db
    .update(steps)
    .set({ doneAt: null, doneBy: null })
    .where(and(eq(steps.dealId, dealId), eq(steps.key, key), isNotNull(steps.doneAt)))
    .returning({ id: steps.id });

  if (updated.length > 0) {
    await db.insert(events).values({
      dealId,
      at: Date.now(),
      actor: ADMIN_ACTOR,
      message: `Reopened "${last.def.label}"`,
    });
  }
  refresh(dealId);
}

function refresh(dealId: number) {
  revalidatePath("/");
  revalidatePath(`/deals/${dealId}`);
}
