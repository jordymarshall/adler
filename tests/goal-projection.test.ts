import test from "node:test";
import assert from "node:assert/strict";
import { goalProjection } from "../shared/goal-projection.ts";
import { addDays } from "../shared/journey.ts";
import { validateAdaptiveWork } from "../shared/adaptive-plan.ts";
import { coachingContext } from "../src/coach-context.ts";
import { adaptiveFixture, adaptiveWorkspace } from "./adaptive-fixture.ts";

const today = "2026-09-20";
function reading() {
  const adaptive = adaptiveFixture("2026-09-01", "2026-09-28");
  adaptive.window.capacityMinutes = 140;
  adaptive.steps[0].durationMinutes = 5;
  adaptive.steps[0].recurrence = { everyDays: 1, until: "2026-09-28" };
  adaptive.steps[0].measure = { id: "pages", label: "Pages read", unit: "pages", target: 5 };
  adaptive.projection = { kind: "direct", driverStepId: "outline", inputMetric: "amount", outcomeUnit: "books", observationStart: "2026-09-01", horizonDays: 3660, feedbackDelayDays: 0, inputPerOutcome: { low: 250, expected: 300, high: 400 }, rationale: "Assume 300 pages per book, with book lengths from 250 to 400 pages." };
  const data = adaptiveWorkspace(adaptive);
  const goal = data.goals[0];
  goal.measure = { label: "Books read", unit: "books", target: 30, baseline: 0, aggregation: "cumulative" };
  goal.target = 30;
  goal.results = [{ id: "baseline", date: "2026-09-01", value: 0, source: "Starting report" }];
  data.actions = Array.from({ length: 20 }, (_, index) => ({
    id: `pages-${index}`, goalId: goal.id, stepId: "outline", planVersion: 1,
    title: "Read five pages", criterion: "Five pages read", timing: "After lunch",
    date: addDays("2026-09-01", index), outcome: "Done", amount: 5, history: [],
  }));
  return data;
}

test("five pages a day toward thirty 300-page books projects 1,800 days, with goal attainment bounds", () => {
  const data = reading(), before = structuredClone(data);
  const result = goalProjection(data, data.goals[0], today);
  assert.equal(result.current, 0, "Input arithmetic must not fabricate a completed book report");
  assert.equal(result.evidence!.pace.expected, 5);
  assert.equal(result.projection!.expectedDate, addDays(today, 1800));
  assert.equal(result.projection!.earliestDate, addDays(today, 1000));
  assert.equal(result.projection!.latestDate, null);
  assert.equal(result.projection!.points[0].high, 0);
  const midpoint = result.projection!.points[10];
  assert.ok(midpoint.high > midpoint.expected && midpoint.expected > midpoint.low);
  assert.ok(result.projection!.points.at(-1)!.low < 30, "The slower scenario has not attained the goal within this horizon");
  assert.deepEqual(data, before);
});

test("outcome updates re-anchor the projection and plan revisions preserve comparable input history", () => {
  const data = reading(), goal = data.goals[0];
  goal.results.push({ id: "finished", date: today, value: 2, source: "Two books completed" });
  goal.plans.push({ ...structuredClone(goal.plans[0]), version: 2 });
  const result = goalProjection(data, goal, today);
  assert.equal(result.current, 2);
  assert.equal(result.projection!.origin, today);
  assert.equal(result.projection!.expectedDate, addDays(today, 1680));
  goal.plans[1].adaptive!.steps[0].measure!.id = "different-measure";
  assert.equal(goalProjection(data, goal, today).evidence!.measured, 0);
});

test("missing quantity is unknown even when an action was done, and a budget is labeled provisional", () => {
  const data = reading();
  data.actions.forEach(action => { delete action.amount; });
  const result = goalProjection(data, data.goals[0], today);
  assert.equal(result.evidence!.measured, 0);
  assert.ok(result.evidence!.daily.every(day => day.amount === null));
  assert.equal(result.evidence!.paceSource, "Provisional input pace");
  assert.ok(result.projection!.assumptions.some(note => note.text.includes("half to one-and-a-half")));
});

test("revenue has no invented hours-to-money factor; paired reports create a tentative observed return", () => {
  const data = reading(), goal = data.goals[0], model = goal.plans[0].adaptive!.projection!;
  goal.measure = { label: "Collected revenue", unit: "CAD", target: 100000, baseline: 0, aggregation: "cumulative" };
  model.kind = "learned"; model.inputMetric = "hours"; model.outcomeUnit = "CAD"; delete model.inputPerOutcome;
  data.actions.forEach(action => { action.actualMinutes = 60; });
  assert.equal(goalProjection(data, goal, today).projection, null);
  goal.results.push({ id: "first-money", date: "2026-09-08", value: 100, source: "First collected revenue" });
  const early = goalProjection(data, goal, today);
  assert.equal(early.evidence!.pairs.length, 1);
  assert.equal(early.projection!.yieldRange.expected, 100 / 7);
  assert.equal(early.projection!.yieldRange.low, 0);
  assert.equal(early.projection!.latestDate, null);
  goal.results.push({ id: "second-money", date: "2026-09-15", value: 200, source: "Updated total" }, { id: "third-money", date: today, value: 250, source: "Updated total" });
  const result = goalProjection(data, goal, today);
  assert.equal(result.evidence!.pairs.length, 3);
  assert.equal(result.projection!.yieldRange.expected, 250 / 19);
  assert.ok(result.evidence!.pairs.every(pair => pair.sourceIds.length > 2));
  assert.ok(result.projection!.assumptions.some(note => note.text.includes("association does not establish cause")));
  const context = coachingContext(data, goal.id, "Review the relationship", today);
  assert.equal(context.goalProjection!.projection!.yieldRange.expected, 250 / 19);
});

test("feedback lag aligns exposure periods, excludes missing measurements and outcome resets", () => {
  const data = reading(), goal = data.goals[0], model = goal.plans[0].adaptive!.projection!;
  model.kind = "learned"; model.inputMetric = "hours"; model.feedbackDelayDays = 3; delete model.inputPerOutcome;
  data.actions.forEach(action => { action.actualMinutes = 60; });
  goal.results = [{ id: "a", date: "2026-09-04", value: 0, source: "Report" }, { id: "b", date: "2026-09-11", value: 1, source: "Report" }];
  let result = goalProjection(data, goal, today);
  assert.equal(result.evidence!.pairs[0].input, 7);
  assert.ok(result.evidence!.pairs[0].sourceIds.includes("pages-7"));
  assert.ok(!result.evidence!.pairs[0].sourceIds.includes("pages-8"));
  delete data.actions[5].actualMinutes;
  assert.equal(goalProjection(data, goal, today).projection, null);
  data.actions[5].actualMinutes = 60;
  goal.results[1].value = -1;
  assert.equal(goalProjection(data, goal, today).projection, null);
});

test("projection model validates units, range ordering and supported outcome aggregation", () => {
  const data = reading(), goal = data.goals[0], model = goal.plans[0].adaptive!.projection!;
  assert.doesNotThrow(() => validateAdaptiveWork(data));
  model.inputPerOutcome!.low = 500;
  assert.throws(() => validateAdaptiveWork(data), /ordered/);
  model.inputPerOutcome!.low = 250;
  goal.measure!.aggregation = "period";
  assert.throws(() => validateAdaptiveWork(data), /cumulative/);
  goal.measure!.aggregation = "cumulative";
  goal.measure!.unit = "different unit";
  assert.equal(goalProjection(data, goal, today).projection, null);
});

test("unknown baselines, paused goals and unreachable horizons do not invent attainment dates", () => {
  const data = reading(), goal = data.goals[0];
  goal.plans[0].adaptive!.projection!.horizonDays = 90;
  assert.equal(goalProjection(data, goal, today).projection!.expectedDate, null);
  goal.status = "Paused";
  assert.equal(goalProjection(data, goal, today).projection, null);
  goal.status = "Active"; goal.results = []; goal.measure!.baseline = null;
  assert.equal(goalProjection(data, goal, today).projection, null);
});

test("a missing scheduled record is unknown and a stale outcome never projects an already-past finish", () => {
  const data = reading(), goal = data.goals[0];
  data.actions = data.actions.filter(action => action.date !== "2026-09-10");
  const result = goalProjection(data, goal, today);
  assert.equal(result.evidence!.daily.find(day => day.date === "2026-09-10")!.amount, null);
  assert.equal(result.evidence!.paceSource, "Provisional input pace");
  goal.measure!.target = 0.1;
  assert.ok(goalProjection(data, goal, today).projection!.expectedDate! >= today);
});

test("identical input-return pairs remain uncertain and gaps cannot create a complete pair", () => {
  const data = reading(), goal = data.goals[0], model = goal.plans[0].adaptive!.projection!;
  model.kind = "learned"; model.inputMetric = "hours"; delete model.inputPerOutcome;
  data.actions.forEach(action => { action.actualMinutes = 60; });
  goal.results = [0, 1, 2, 3].map(index => ({ id: `outcome-${index}`, date: addDays("2026-09-01", index * 6), value: index * 60, source: "Reported total" }));
  const result = goalProjection(data, goal, today);
  assert.equal(result.evidence!.pairs.length, 3);
  assert.ok(result.projection!.yieldRange.high > result.projection!.yieldRange.low);
  data.actions = data.actions.filter(action => action.date !== "2026-09-03");
  assert.equal(goalProjection(data, goal, today).evidence!.pairs.length, 2);
});
