import assert from "node:assert/strict";
import { test } from "node:test";
import { DAY_MS, deriveDeal, median } from "./derive";

const reservedAt = Date.UTC(2026, 9, 1);
const day = (n: number) => reservedAt + n * DAY_MS;

test("a fresh reservation waits on the buyer's deposit", () => {
  const d = deriveDeal(reservedAt, [], day(2));
  assert.equal(d.stage, "Reserved");
  assert.equal(d.next?.def.key, "deposit");
  assert.equal(d.next?.def.owner, "buyer");
  assert.equal(d.daysToDue, 5);
  assert.equal(d.atRisk, false);
});

test("a missed deadline puts the deal at risk", () => {
  const d = deriveDeal(reservedAt, [], day(9));
  assert.equal(d.atRisk, true);
  assert.equal(d.daysToDue, -2);
});

test("stage follows the run of done steps, and days in stage reset", () => {
  const d = deriveDeal(
    reservedAt,
    [
      { key: "deposit", doneAt: day(3), doneBy: "x" },
      { key: "kyc", doneAt: day(6), doneBy: "x" },
    ],
    day(8),
  );
  assert.equal(d.stage, "KYC complete");
  assert.equal(d.next?.def.key, "spa_issued");
  assert.equal(d.next?.def.owner, "developer");
  assert.equal(d.daysInStage, 2);
});

test("a step done out of order doesn't advance the stage", () => {
  const d = deriveDeal(reservedAt, [{ key: "kyc", doneAt: day(2), doneBy: "x" }], day(3));
  assert.equal(d.stage, "Reserved");
  assert.equal(d.next?.def.key, "deposit");
});

test("days to SPA is measured from reservation to signing", () => {
  const rows = ["deposit", "kyc", "spa_issued", "spa_signed"].map((key, i) => ({
    key,
    doneAt: day((i + 1) * 5),
    doneBy: "x",
  }));
  const d = deriveDeal(reservedAt, rows, day(25));
  assert.equal(d.stage, "SPA signed");
  assert.equal(d.daysToSpa, 20);
});

test("a fully registered deal is complete and never at risk", () => {
  const rows = ["deposit", "kyc", "spa_issued", "spa_signed", "oqood"].map((key, i) => ({
    key,
    doneAt: day(i + 1),
    doneBy: "x",
  }));
  const d = deriveDeal(reservedAt, rows, day(200));
  assert.equal(d.complete, true);
  assert.equal(d.atRisk, false);
  assert.equal(d.next, null);
});

test("median", () => {
  assert.equal(median([]), null);
  assert.equal(median([5, 1, 3]), 3);
  assert.equal(median([4, 1, 3, 2]), 2.5);
});
