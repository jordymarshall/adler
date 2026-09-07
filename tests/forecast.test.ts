import test from "node:test";
import assert from "node:assert/strict";
import { forecastGoal } from "../shared/forecast.ts";
import { adaptiveWorkspace } from "./adaptive-fixture.ts";

function fixture(method: "observed-rate" | "behavior-rate" = "observed-rate") {
  const data = adaptiveWorkspace();
  const goal = data.goals[0];
  goal.measure = { label: "Collected revenue", unit: "CAD", target: 100, baseline: 20, aggregation: "cumulative" };
  goal.target = 100;
  goal.targetDate = "2026-09-30";
  goal.results = [
    { id: "r1", date: "2026-09-02", value: 20, source: "User report" },
    { id: "r2", date: "2026-09-04", value: 24, source: "User report" },
    { id: "r3", date: "2026-09-06", value: 28, source: "User report" },
  ];
  goal.plans[0].adaptive!.forecast.method = method;
  goal.plans[0].adaptive!.forecast.driverStepId = "outline";
  return { data, goal };
}

test("a supported rate forecast distinguishes the target date from an evidence-based scenario", () => {
  const { data, goal } = fixture();
  const forecast = forecastGoal(data, goal, new Date("2026-09-06T12:00:00Z"));
  assert.equal(forecast.status, "provisional");
  assert.equal(forecast.expectedDate, "2026-10-12");
  assert.equal(forecast.expectedValue, 76);
  assert.equal(forecast.probability, null);
  assert.deepEqual(forecast.sourceIds, ["r1", "r2", "r3"]);
  assert.equal(goal.targetDate, "2026-09-30");
  goal.results[1].value = 26;
  const corrected = forecastGoal(data, goal, new Date("2026-09-06T12:00:00Z"));
  assert.notEqual(corrected.inputKey, forecast.inputKey);
  assert.equal(corrected.rates?.low, 1);
  assert.equal(corrected.rates?.high, 3);
});

test("unchanged observations do not imply zero progress on a later day", () => {
  const { data, goal } = fixture();
  const first = forecastGoal(data, goal, new Date("2026-09-06T12:00:00Z"));
  const later = forecastGoal(data, goal, new Date("2026-09-08T12:00:00Z"));
  assert.equal(later.expectedDate, first.expectedDate);
  assert.equal(later.expectedValue, first.expectedValue);
  assert.equal(later.current, 28, "Inferred progress never overwrites the recorded result");
});

test("sparse, stale, and unsupported outcome records do not produce invented dates", () => {
  const { data, goal } = fixture();
  assert.equal(forecastGoal(data, goal, new Date("2026-10-06T12:00:00Z")).status, "unavailable");
  goal.results.pop();
  assert.equal(forecastGoal(data, goal, new Date("2026-09-06T12:00:00Z")).expectedDate, undefined);
  goal.measure!.aggregation = "period";
  assert.equal(forecastGoal(data, goal, new Date("2026-09-06T12:00:00Z")).status, "unavailable");
});

test("behavior evidence changes a conditional projection while unknown check-ins remain unknown", () => {
  const { data, goal } = fixture("behavior-rate");
  for (const date of ["2026-09-02", "2026-09-04", "2026-09-06"]) data.actions.push({
    id: `a-${date}`, goalId: goal.id, title: "Outreach", criterion: "Five messages", timing: "Morning", date,
    planVersion: 1, stepId: "outline", outcome: "Done", amount: 5, history: [],
  });
  const now = new Date("2026-09-06T12:00:00Z");
  const before = forecastGoal(data, goal, now);
  data.actions.push({ id: "missed", goalId: goal.id, title: "Outreach", criterion: "Five messages", timing: "Morning", date: "2026-09-03", planVersion: 1, stepId: "outline", outcome: "Didn’t happen", amount: 0, history: [] });
  const after = forecastGoal(data, goal, now);
  assert.equal(before.status, "provisional");
  assert.ok(after.expectedDate! > before.expectedDate!);
  delete data.actions.at(-1)!.outcome;
  assert.equal(forecastGoal(data, goal, now).status, "unavailable");
});

test("recent behavior updates the projection before the next outcome report", () => {
  const { data, goal } = fixture("behavior-rate");
  for (const date of ["2026-09-02", "2026-09-04", "2026-09-06"]) data.actions.push({
    id: `a-${date}`, goalId: goal.id, title: "Outreach", criterion: "Five messages", timing: "Morning", date,
    planVersion: 1, stepId: "outline", outcome: "Done", amount: 5, history: [],
  });
  const now = new Date("2026-09-07T12:00:00Z");
  const before = forecastGoal(data, goal, now);
  data.actions.find(a => a.date === "2026-09-07")!.outcome = "Didn’t happen";
  const after = forecastGoal(data, goal, now);
  assert.ok(after.expectedDate! > before.expectedDate!);
  assert.equal(goal.results.length, 3);
});

test("a reached cumulative target needs no minimum sample count, and flat pace has no finish date", () => {
  const { data, goal } = fixture();
  goal.results = [{ ...goal.results[2], value: 100 }];
  assert.equal(forecastGoal(data, goal, new Date("2026-09-06T12:00:00Z")).status, "reached");
  goal.results = ["2026-09-02", "2026-09-04", "2026-09-06"].map(date => ({ id: date, date, value: 20, source: "Reported" }));
  const stalled = forecastGoal(data, goal, new Date("2026-09-06T12:00:00Z"));
  assert.equal(stalled.status, "beyond-horizon");
  assert.equal(stalled.expectedDate, undefined);
  assert.equal(stalled.rates!.typical, 0);
});
