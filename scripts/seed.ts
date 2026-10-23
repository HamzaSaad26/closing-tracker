// Resets the database and fills it with ~25 made-up reserved deals at
// different stages. Dates are relative to "now", so the board always looks
// realistic right after seeding: some deals fresh, some on track, some overdue.
//
//   npm run db:seed

import { randomBytes } from "node:crypto";
import { client, db } from "../lib/db";
import { DAY_MS } from "../lib/derive";
import { brokers, deals, events, steps } from "../lib/schema";
import { ADMIN_ACTOR, STEPS } from "../lib/steps";

const DDL = `
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS steps;
DROP TABLE IF EXISTS deals;
DROP TABLE IF EXISTS brokers;

CREATE TABLE brokers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  agency TEXT NOT NULL,
  phone TEXT NOT NULL
);

CREATE TABLE deals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unit TEXT NOT NULL,
  unit_type TEXT NOT NULL,
  price_aed INTEGER NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  buyer_token TEXT NOT NULL UNIQUE,
  broker_id INTEGER NOT NULL REFERENCES brokers(id),
  reserved_at INTEGER NOT NULL
);

CREATE TABLE steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL REFERENCES deals(id),
  key TEXT NOT NULL,
  done_at INTEGER,
  done_by TEXT
);
CREATE UNIQUE INDEX steps_deal_key ON steps(deal_id, key);

CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL REFERENCES deals(id),
  at INTEGER NOT NULL,
  actor TEXT NOT NULL,
  message TEXT NOT NULL
);
CREATE INDEX events_deal_at ON events(deal_id, at);
`;

// Small deterministic PRNG so the seed produces the same mix every time.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261023);
const between = (min: number, max: number) => min + rand() * (max - min);
const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];

const BROKERS = [
  { name: "Karim Haddad", agency: "Bluewater Realty", phone: "+971 50 214 7781" },
  { name: "Priya Nair", agency: "Bluewater Realty", phone: "+971 55 309 1124" },
  { name: "Daniel Okafor", agency: "Skyline Homes", phone: "+971 52 760 4419" },
  { name: "Layla Rahman", agency: "Skyline Homes", phone: "+971 50 881 3052" },
  { name: "Marco Bianchi", agency: "Independent", phone: "+971 56 412 9937" },
  { name: "Fatima Zahra Idrissi", agency: "Crestview Properties", phone: "+971 54 190 6628" },
];

const BUYERS = [
  "Sara Khalil", "James Whitfield", "Ananya Iyer", "Mohammed Al Suwaidi", "Elena Petrova",
  "Chen Wei", "Youssef Benali", "Hannah Schmidt", "Rahul Mehta", "Aisha Kamara",
  "Oliver Grant", "Noura Al Hashimi", "Dmitri Volkov", "Grace Mensah", "Tariq Hussain",
  "Sofia Martins", "Kenji Tanaka", "Leila Farouk", "Arjun Kapoor", "Isabelle Laurent",
  "Ahmed Saeed", "Maria Gonzalez", "Viktor Novak", "Zainab Okoye", "Thomas Byrne",
];

const UNIT_TYPES = [
  { type: "Studio", base: 950_000, weight: 2 },
  { type: "1BR", base: 1_450_000, weight: 4 },
  { type: "2BR", base: 2_300_000, weight: 4 },
  { type: "3BR", base: 3_600_000, weight: 2 },
];
const typePool = UNIT_TYPES.flatMap((t) => Array(t.weight).fill(t));

// Typical days between steps for a deal that's moving normally.
const GAP_DAYS: Record<string, [number, number]> = {
  deposit: [1, 6],
  kyc: [1, 4],
  spa_issued: [2, 5],
  spa_signed: [5, 15],
  oqood: [4, 12],
};

type Profile = "on_track" | "slow" | "stuck";

async function main() {
  const now = Date.now();

  await client.executeMultiple(DDL);

  const brokerIds = (await db.insert(brokers).values(BROKERS).returning({ id: brokers.id })).map((b) => b.id);

  const usedUnits = new Set<string>();
  let stepCount = 0;

  for (let i = 0; i < BUYERS.length; i++) {
    // Spread reservations over the last ~2 months, with a few very recent.
    const daysAgo = i < 3 ? between(0.3, 3) : between(3, 60);
    const reservedAt = Math.round(now - daysAgo * DAY_MS);

    const roll = rand();
    const profile: Profile = roll < 0.6 ? "on_track" : roll < 0.85 ? "slow" : "stuck";
    const stuckAt = Math.floor(between(0, 4)); // stuck deals never get past this step

    const unitType = pick(typePool);
    let unit: string;
    let floor: number;
    do {
      floor = Math.floor(between(4, 39));
      unit = `${pick(["A", "B"])}-${floor}${String(Math.floor(between(1, 9))).padStart(2, "0")}`;
    } while (usedUnits.has(unit));
    usedUnits.add(unit);
    const priceAed = Math.round((unitType.base * (1 + floor * 0.006)) / 1000) * 1000;

    const brokerIndex = Math.floor(rand() * brokerIds.length);
    const buyerName = BUYERS[i];

    const [deal] = await db
      .insert(deals)
      .values({
        unit,
        unitType: unitType.type,
        priceAed,
        buyerName,
        buyerPhone: `+971 5${Math.floor(between(0, 6))} ${Math.floor(between(100, 999))} ${Math.floor(between(1000, 9999))}`,
        buyerToken: randomBytes(12).toString("base64url"),
        brokerId: brokerIds[brokerIndex],
        reservedAt,
      })
      .returning({ id: deals.id });

    const b = BROKERS[brokerIndex];
    const eventRows = [
      { dealId: deal.id, at: reservedAt, actor: "System", message: `Unit reserved via ${b.name} (${b.agency})` },
    ];

    let t = reservedAt;
    let stopped = false;
    for (let s = 0; s < STEPS.length; s++) {
      const def = STEPS[s];
      let doneAt: number | null = null;

      if (!stopped && !(profile === "stuck" && s === stuckAt)) {
        const [min, max] = GAP_DAYS[def.key];
        let gap = between(min, max);
        if (profile === "slow") gap = gap * 1.7 + 2;
        const candidate = Math.round(t + gap * DAY_MS);
        if (candidate < now - 2 * 60 * 60 * 1000) {
          doneAt = candidate;
          t = candidate;
        }
      }
      if (doneAt === null) stopped = true;

      await db.insert(steps).values({
        dealId: deal.id,
        key: def.key,
        doneAt,
        doneBy: doneAt ? ADMIN_ACTOR : null,
      });
      stepCount++;
      if (doneAt) eventRows.push({ dealId: deal.id, at: doneAt, actor: ADMIN_ACTOR, message: `Marked "${def.label}" done` });
    }

    await db.insert(events).values(eventRows);
  }

  console.log(`Seeded ${BROKERS.length} brokers, ${BUYERS.length} deals, ${stepCount} checklist steps.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
