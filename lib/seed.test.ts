import assert from "node:assert/strict";
import { test } from "node:test";
import { DAY_MS } from "./derive";
import { buildSeedStatements } from "./seed";

const dealRows = (now: number) =>
  buildSeedStatements(now)
    .statements.filter((s) => typeof s !== "string" && s.sql.startsWith("INSERT INTO deals"))
    .map((s) => (s as { args: unknown[] }).args);

test("a reset keeps deal ids, units and buyer links the same", () => {
  const a = dealRows(Date.UTC(2026, 9, 1));
  const b = dealRows(Date.UTC(2026, 10, 15));
  assert.equal(a.length, 25);
  // id, unit, type, price, buyer, phone, token, broker: everything but the date
  assert.deepEqual(
    a.map((r) => r.slice(0, 8)),
    b.map((r) => r.slice(0, 8)),
  );
  assert.equal(new Set(a.map((r) => r[6])).size, 25, "buyer tokens are unique");
});

test("dates move with 'now' so the board always looks current", () => {
  const now = Date.UTC(2026, 9, 24);
  const reservedAt = dealRows(now).map((r) => r[8] as number);
  for (const t of reservedAt) {
    assert.ok(t <= now && t > now - 61 * DAY_MS);
  }
});

test("five checklist rows per deal", () => {
  const { summary } = buildSeedStatements(Date.now());
  assert.deepEqual(summary, { brokers: 6, deals: 25, steps: 125 });
});
