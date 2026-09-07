import test from "node:test";
import assert from "node:assert/strict";
import { completionProjection } from "../shared/completion-projection.ts";
import { addDays } from "../shared/journey.ts";
import type { Outcome } from "../shared/workspace.ts";
import { adaptiveFixture, adaptiveWorkspace } from "./adaptive-fixture.ts";

const today = "2026-09-20";
function fixture(count = 10, outcome?: Outcome) {
  const data = adaptiveWorkspace(adaptiveFixture("2026-09-01", "2026-11-01"));
  data.actions = Array.from({ length: count }, (_, index) => ({
    id: `report-${index}`, goalId: "essay", title: "Write for 25 minutes",
    criterion: "Complete the session", timing: "After breakfast", planVersion: 1,
    date: addDays(today, -index), outcome: outcome ?? (index % 2 ? "Didn’t happen" : "Done"), history: [],
  }));
  for (const offset of [1, 8, 36]) data.actions.push({
    ...data.actions[0], id: `future-${offset}`, date: addDays(today, offset), outcome: undefined,
  });
  return data;
}

test("behavior projection uses reports, with a bounded Wilson rate interval and visible coverage", () => {
  const data = fixture();
  data.actions[1].outcome = "Partly";
  data.actions.push({ ...data.actions[0], id: "unknown", outcome: undefined });
  const result = completionProjection(data, data.goals[0], today)!;
  assert.equal(result.estimate, 50);
  assert.equal(result.reported, 10);
  assert.equal(result.due, 11);
  assert.ok(Math.abs(result.lower - 23.659) < 0.01);
  assert.ok(Math.abs(result.upper - 76.341) < 0.01);
  assert.deepEqual(result.weeks, ["2026-09-21", "2026-09-28"]);
  data.goals[0].results.push({ id: "revenue", date: today, value: 100000, source: "User" });
  assert.deepEqual(completionProjection(data, data.goals[0], today), result);
  data.actions[1].outcome = "Done";
  assert.equal(completionProjection(data, data.goals[0], today)!.estimate, 60);
});

test("all successes or misses still have uncertainty, which narrows with more reports", () => {
  for (const outcome of ["Done", "Didn’t happen"] as const) {
    const small = fixture(10, outcome);
    const large = fixture(20, outcome);
    const a = completionProjection(small, small.goals[0], today)!;
    const b = completionProjection(large, large.goals[0], today)!;
    assert.equal(a.estimate, outcome === "Done" ? 100 : 0);
    assert.ok(a.lower >= 0 && a.upper <= 100 && a.upper > a.lower);
    assert.ok(b.upper - b.lower < a.upper - a.lower);
  }
});

test("sparse, stale and replaced plans do not manufacture projections", () => {
  const sparse = fixture(4);
  assert.equal(completionProjection(sparse, sparse.goals[0], today), null);
  const singleDay = fixture();
  singleDay.actions.filter(a => a.outcome).forEach(a => { a.date = today; });
  assert.equal(completionProjection(singleDay, singleDay.goals[0], today), null);
  const stale = fixture();
  stale.actions.filter(a => a.outcome).forEach(a => { a.date = addDays(a.date, -28); });
  assert.equal(completionProjection(stale, stale.goals[0], today), null);
  const revised = fixture();
  revised.goals[0].plans.push({ ...structuredClone(revised.goals[0].plans[0]), version: 2 });
  assert.equal(completionProjection(revised, revised.goals[0], today), null);
  const retired = fixture();
  retired.actions.forEach(a => { a.retiredAt = today; });
  assert.equal(completionProjection(retired, retired.goals[0], today), null);
});

test("projection stops at planned weeks, the cycle boundary and paused goals", () => {
  const data = fixture();
  const goal = data.goals[0];
  goal.plans[0].adaptive!.window.end = "2026-09-27";
  assert.deepEqual(completionProjection(data, goal, today)!.weeks, ["2026-09-21"]);
  goal.status = "Paused";
  assert.equal(completionProjection(data, goal, today), null);
  goal.status = "Active";
  goal.plans[0].adaptive!.window.end = today;
  assert.equal(completionProjection(data, goal, today), null);
});
