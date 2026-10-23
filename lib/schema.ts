import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// All timestamps are stored as epoch milliseconds.

export const brokers = sqliteTable("brokers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  agency: text("agency").notNull(),
  phone: text("phone").notNull(),
});

export const deals = sqliteTable("deals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  unit: text("unit").notNull(),
  unitType: text("unit_type").notNull(),
  priceAed: integer("price_aed").notNull(),
  buyerName: text("buyer_name").notNull(),
  buyerPhone: text("buyer_phone").notNull(),
  // Unguessable token for the buyer's no-login status page.
  buyerToken: text("buyer_token").notNull().unique(),
  brokerId: integer("broker_id")
    .notNull()
    .references(() => brokers.id),
  reservedAt: integer("reserved_at").notNull(),
});

// One row per checklist step per deal. A step is done when doneAt is set.
// There is deliberately no "status" column on deals: the stage is derived
// from these rows so it can never disagree with the checklist.
export const steps = sqliteTable(
  "steps",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    dealId: integer("deal_id")
      .notNull()
      .references(() => deals.id),
    key: text("key").notNull(),
    doneAt: integer("done_at"),
    doneBy: text("done_by"),
  },
  (t) => [uniqueIndex("steps_deal_key").on(t.dealId, t.key)],
);

export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  dealId: integer("deal_id")
    .notNull()
    .references(() => deals.id),
  at: integer("at").notNull(),
  actor: text("actor").notNull(),
  message: text("message").notNull(),
});
