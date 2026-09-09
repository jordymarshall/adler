import test from "node:test";
import assert from "node:assert/strict";
import { actionSeries, goalStreak, planExperiment } from "../shared/goal-view.ts";
import { scheduledCommitments } from "../shared/adaptive-plan.ts";
import { adaptiveFixture, adaptiveWorkspace } from "./adaptive-fixture.ts";
import { applyPlan, recordAction } from "../shared/workspace.ts";
import { basis } from "./planning-fixture.ts";
import { landingWorkspace } from "../scripts/landing-workspace.ts";

test("a completed action without a measured amount stays unknown on the input graph", () => {
  const data = adaptiveWorkspace(), goal = data.goals[0], plan = goal.plans[0];
  recordAction(data, data.actions[0].id, "Done");
  recordAction(data, data.actions[1].id, "Didn’t happen");
  const series = actionSeries(data, goal, plan, "outline", "2026-09-07", "2026-09-12", "2026-09-12");
  assert.equal(series.points[0].amount, null);
  assert.equal(series.points[1].off, true);
  assert.equal(series.points[2].amount, 0);
  assert.equal(series.unknown, 2);
  recordAction(data, data.actions[0].id, "Partly", "Correction", 2);
  assert.equal(actionSeries(data, goal, plan, "outline", "2026-09-07", "2026-09-12", "2026-09-12").reported, 2);
});

test("measurement changes cannot relabel old amounts and missing scheduled records are not days off", () => {
  const data = adaptiveWorkspace(), goal = data.goals[0];
  recordAction(data, data.actions[0].id, "Done", "", 5);
  const next = structuredClone(goal.plans[0]);
  next.version = 2;
  next.adaptive!.steps[0].measure = { id: "words", label: "Words", unit: "words", target: 100 };
  goal.plans.push(next);
  const series = actionSeries(data, goal, next, "outline", "2026-09-07", "2026-09-11", "2026-09-12");
  assert.equal(series.points[0].amount, null);
  assert.equal(series.points[0].planned, null);
  data.actions = [];
  const missing = actionSeries(data, goal, next, "outline", "2026-09-07", "2026-09-11", "2026-09-12");
  assert.equal(missing.points[0].scheduled, true);
  assert.equal(missing.points[0].off, false);
  assert.equal(missing.unknown, 3);
});

test("on-plan streak includes planned rest, preserves today pending, and never starts from days off", () => {
  const data = adaptiveWorkspace(), goal = data.goals[0];
  assert.equal(goalStreak(data, goal, "2026-09-08").count, 0);
  recordAction(data, data.actions[0].id, "Done", "", 5);
  assert.equal(goalStreak(data, goal, "2026-09-08").count, 2);
  assert.equal(goalStreak(data, goal, "2026-09-09").count, 2);
  assert.equal(goalStreak(data, goal, "2026-09-10").count, 0);
  recordAction(data, data.actions[1].id, "Done", "", 2);
  assert.equal(goalStreak(data, goal, "2026-09-09").count, 0, "Below-target input cannot be an on-plan day just because it says Done");
  recordAction(data, data.actions[1].id, "Done", "Correction", 5);
  assert.equal(goalStreak(data, goal, "2026-09-10").count, 4);
  assert.equal(goalStreak(data, goal, "2026-09-12").count, 0, "Streaks do not silently grow beyond the concrete plan");
});

test("capacity uses booked date and duration once, preserves other goals and includes draft commitments", () => {
  const data = adaptiveWorkspace(), action = data.actions[0];
  data.workBlocks.push({ id: action.id, goalId: action.goalId, action: action.title, start: "2026-09-08T10:00:00Z", end: "2026-09-08T10:40:00Z", provider: "local", status: "Scheduled" });
  const work = scheduledCommitments(data, "2026-09-08");
  assert.equal(work.filter(item => item.actionId === action.id).length, 1);
  assert.equal(work.find(item => item.actionId === action.id)!.date, "2026-09-08");
  assert.equal(work.reduce((sum, item) => sum + item.minutes, 0), 90);
  data.goals[0].status = "Paused";
  assert.equal(scheduledCommitments(data, "2026-09-08").length, 0);
});

test("one-time work has completion evidence without manufacturing a measured input", () => {
  const plan = adaptiveFixture("2026-09-07", "2026-09-07");
  plan.steps[0].type = "task";
  delete plan.steps[0].recurrence;
  delete plan.steps[0].measure;
  const data = adaptiveWorkspace(plan), goal = data.goals[0];
  recordAction(data, data.actions[0].id, "Done");
  const series = actionSeries(data, goal, goal.plans[0], "outline", "2026-09-07", "2026-09-07", "2026-09-07");
  assert.equal(series.measure.metric, "completion");
  assert.equal(series.points[0].amount, 1);
  assert.equal(goal.results[0].value, 0, "Completing work does not confirm the goal outcome");
});

test("an explicit selected-step edit removes the old scientific basis without rewriting history", () => {
  const data = adaptiveWorkspace(), goal = data.goals[0], original = goal.plans[0];
  original.basis = structuredClone(basis);
  const adaptive = structuredClone(original.adaptive!);
  adaptive.steps[0].cue = "At the time I choose";
  delete adaptive.reasoning;
  delete adaptive.experiment;
  applyPlan(data, goal.id, original.version, { action: original.action, criterion: original.criterion, timing: adaptive.steps[0].cue, adaptive });
  assert.equal(goal.plans[1].basis, undefined);
  assert.equal(goal.plans[1].adaptive!.reasoning, undefined);
  assert.deepEqual(goal.plans[0].basis, basis);
  assert.ok(goal.plans[0].adaptive!.reasoning);
});

test("a revised schedule does not turn earlier days off into missing commitments", () => {
  const data = adaptiveWorkspace(), goal = data.goals[0];
  recordAction(data, data.actions[0].id, "Done", "", 5);
  recordAction(data, data.actions[1].id, "Done", "", 5);
  const next = structuredClone(goal.plans[0]);
  next.version = 2;
  next.date = "2026-09-09";
  next.adaptive!.steps[0].recurrence!.everyDays = 1;
  goal.plans.push(next);
  const series = actionSeries(data, goal, next, "outline", "2026-09-07", "2026-09-11", "2026-09-11");
  assert.equal(series.points[1].off, true);
  assert.equal(series.points[1].planned, null);
  assert.equal(series.points[3].scheduled, true);
  assert.equal(goalStreak(data, goal, "2026-09-09").count, 3);
  next.adaptive!.window.end = "2026-09-09";
  data.actions[2].retiredAt = "2026-09-09";
  const ended = actionSeries(data, goal, next, "outline", "2026-09-10", "2026-09-11", "2026-09-12");
  assert.equal(ended.points[1].scheduled, false, "The expired earlier plan cannot silently resume when the current window ends");
  assert.equal(goalStreak(data, goal, "2026-09-10").count, 3, "An unknown today keeps the previous count without extending it");
  assert.equal(goalStreak(data, goal, "2026-09-11").count, 0);
});

test("retired work is inspectable as retired in its earlier plan, not a missing report", () => {
  const data = adaptiveWorkspace(), goal = data.goals[0], original = goal.plans[0];
  data.actions[2].retiredAt = "2026-09-10";
  const next = structuredClone(original);
  next.version = 2;
  next.date = "2026-09-10";
  next.adaptive!.steps[0].recurrence!.until = "2026-09-09";
  goal.plans.push(next);
  const prior = actionSeries(data, goal, original, "outline", "2026-09-07", "2026-09-11", "2026-09-12");
  assert.equal(prior.points[4].retired, true);
  assert.equal(prior.points[4].scheduled, false);
  assert.equal(prior.points[4].planned, null);
  assert.equal(prior.unknown, 2);
});

test("a declined intermediate learning revision does not become an earlier plan's experiment", () => {
  const data = landingWorkspace(), goal = data.goals.find(goal => goal.id === "reading")!;
  const record = data.learning![0], declined = structuredClone(record.versions[0]);
  declined.version = 2;
  declined.test.change = "A suggestion I declined";
  record.versions[1].version = 3;
  record.activeVersion = 3;
  record.versions.splice(1, 0, declined);
  assert.equal(planExperiment(data, goal, goal.plans[0], "reading-session", [])?.version.version, 1);
  assert.equal(planExperiment(data, goal, goal.plans[1], "reading-session", [])?.version.version, 3);
});
