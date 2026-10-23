import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import { deriveDeal, type DealState } from "./derive";
import { brokers, deals, events, steps } from "./schema";

export type Deal = typeof deals.$inferSelect & {
  broker: typeof brokers.$inferSelect;
  state: DealState;
};

async function hydrate(rows: (typeof deals.$inferSelect)[], now: number): Promise<Deal[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [stepRows, brokerRows] = await Promise.all([
    db.select().from(steps).where(inArray(steps.dealId, ids)),
    db.select().from(brokers),
  ]);
  const brokerById = new Map(brokerRows.map((b) => [b.id, b]));

  return rows.map((row) => ({
    ...row,
    broker: brokerById.get(row.brokerId)!,
    state: deriveDeal(
      row.reservedAt,
      stepRows.filter((s) => s.dealId === row.id),
      now,
    ),
  }));
}

export async function listDeals(now = Date.now()): Promise<Deal[]> {
  const rows = await db.select().from(deals).orderBy(asc(deals.reservedAt));
  return hydrate(rows, now);
}

export async function getDeal(id: number, now = Date.now()): Promise<Deal | null> {
  const rows = await db.select().from(deals).where(eq(deals.id, id));
  return (await hydrate(rows, now))[0] ?? null;
}

export async function getDealByToken(token: string, now = Date.now()): Promise<Deal | null> {
  const rows = await db.select().from(deals).where(eq(deals.buyerToken, token));
  return (await hydrate(rows, now))[0] ?? null;
}

export async function listEvents(dealId: number) {
  return db.select().from(events).where(eq(events.dealId, dealId)).orderBy(desc(events.at), desc(events.id));
}
