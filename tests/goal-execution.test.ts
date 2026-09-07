import test from "node:test";
import assert from "node:assert/strict";
import { goalExecution, cycleEvidence } from "../shared/goal-execution.ts";
import { maintainAdaptivePlans } from "../shared/adaptive-plan.ts";
import { recordAction } from "../shared/workspace.ts";
import { validateWorkspace } from "../shared/validation.ts";
import { coachingContext } from "../src/coach-context.ts";
import { adaptiveFixture, adaptiveWorkspace } from "./adaptive-fixture.ts";

test("weekly evidence separates reports, unanswered commitments and future work", () => {
  const plan = adaptiveFixture("2026-09-07", "2026-09-15");
  plan.window.capacityMinutes = 200;
  const data = adaptiveWorkspace(plan);
  recordAction(data, data.actions[0].id, "Done", "Breakfast cue helped", 5);
  recordAction(data, data.actions[1].id, "Partly", "Interrupted", 2);
  recordAction(data, data.actions[2].id, "Didn’t happen", "Meeting ran over");
  const result = goalExecution(data, data.goals[0], "2026-09-13");
  assert.deepEqual(result.summary, {
    done: 1,
    partial: 1,
    missed: 1,
    unknown: 1,
    upcoming: 1,
    planned: 5,
    reported: 3,
    completion: 33,
  });
  assert.deepEqual(
    result.weeks.filter((w) => w.planned).map((w) => [w.start, w.planned]),
    [
      ["2026-09-07", 4],
      ["2026-09-14", 1],
    ],
  );
  assert.equal(result.weeks.find((w) => w.start === "2026-09-14")!.unknown, 0);
  assert.equal(
    result.weeks.find((w) => w.start === "2026-09-14")!.completion,
    null,
  );
  assert.equal(data.goals[0].results.at(-1)?.value, 0);
});
test("revisions preserve reports, exclude retired unreported work, and do not invent later cycles", () => {
  const data = adaptiveWorkspace();
  const goal = data.goals[0];
  recordAction(data, data.actions[0].id, "Done");
  data.actions[0].retiredAt = "2026-09-08T12:00:00Z";
  data.actions[1].retiredAt = "2026-09-08T12:00:00Z";
  goal.plans.push({ ...structuredClone(goal.plans[0]), version: 2 });
  goal.plans[1].adaptive!.window.label = "Smaller work window";
  const result = goalExecution(data, goal, "2026-09-20");
  assert.equal(result.cycles.length, 1);
  assert.equal(result.cycles[0].label, "Smaller work window");
  assert.equal(result.cycles[0].current, true);
  assert.equal(result.summary.done, 1);
  assert.equal(result.actions.length, 2);
  assert.equal(result.weeks.at(-1)!.planned, 0);
  assert.equal(
    result.markers.find((m) => m.kind === "Milestone")!.date,
    undefined,
  );
  assert.equal(result.end, goal.targetDate);
});
test("one-day work and year-long goals keep their saved cycle without an outcome projection", () => {
  const plan = adaptiveFixture("2026-09-07", "2026-09-07");
  plan.steps[0].type = "task";
  delete plan.steps[0].recurrence;
  const data = adaptiveWorkspace(plan);
  const goal = data.goals[0];
  goal.measure = {
    label: "Revenue",
    unit: "CAD",
    target: 100000,
    baseline: null,
    aggregation: "cumulative",
  };
  goal.milestones[0].dueDate = "2027-06-01";
  goal.results = [10000, 20000, 30000].map((value, i) => ({
    id: `result-${i}`,
    value,
    date: `2026-09-0${i + 1}`,
    source: "User report",
  }));
  const before = goalExecution(data, goal, "2026-09-07");
  maintainAdaptivePlans(data, new Date("2026-09-07T12:00:00Z"));
  assert.equal(goal.forecasts, undefined);
  assert.equal(before.cycles[0].start, before.cycles[0].end);
  assert.equal(before.summary.planned, 1);
  assert.equal(
    before.markers.find((m) => m.kind === "Milestone")!.date,
    "2027-06-01",
  );
  goal.results[2].value = 80000;
  assert.deepEqual(goalExecution(data, goal, "2026-09-07"), before);
});
test("historical forecast settings remain readable but leave all coaching goal contexts", () => {
  const data = adaptiveWorkspace();
  data.goals[0].plans[0].adaptive!.forecast = {
    method: "observed-rate",
    rationale: "Historical",
    minimumObservations: 3,
    horizonDays: 90,
    freshnessDays: 14,
  };
  assert.doesNotThrow(() => validateWorkspace(data));
  const context = coachingContext(data, "essay", "Check in", "2026-09-07");
  assert.equal(context.goal?.plans[0].adaptive?.forecast, undefined);
  assert.equal(context.activeGoals[0].plans[0].adaptive?.forecast, undefined);
  assert.equal(context.allGoalContexts[0].plan?.adaptive?.forecast, undefined);
  assert.equal(context.execution?.summary.planned, 3);
  assert.ok(data.goals[0].plans[0].adaptive?.forecast);
});
test("review evidence respects delayed feedback and keeps observations distinct from causal conclusions", () => {
  const plan = adaptiveFixture();
  plan.assessment.feedbackDelayDays = 14;
  const data = adaptiveWorkspace(plan);
  const goal = data.goals[0];
  goal.results = [
    { id: "baseline", date: "2026-09-01", value: 20000, source: "User report" },
  ];
  assert.equal(
    cycleEvidence(data, goal, "2026-09-11")!.status,
    "Collecting action reports",
  );
  recordAction(data, data.actions[0].id, "Done");
  const early = cycleEvidence(data, goal, "2026-09-11")!;
  assert.equal(early.status, "Waiting for outcome feedback");
  assert.equal(early.firstFeedbackDate, "2026-09-21");
  assert.equal(early.baseline?.value, 20000);
  assert.equal(early.counts.unknown, 2);
  goal.results.push({
    id: "response",
    date: "2026-09-22",
    value: 22000,
    source: "User report",
  });
  const later = cycleEvidence(data, goal, "2026-09-23")!;
  assert.equal(later.status, "Observations available to review");
  assert.deepEqual(
    later.results.map((r) => r.id),
    ["response"],
  );
  assert.equal("effect" in later, false);
  goal.results = [];
  goal.plans[0].adaptive!.experiment!.inputStepIds = ["not-a-step"];
  assert.throws(
    () => validateWorkspace(data),
    /experiment must reference steps/,
  );
});

test("multiple weekly weekdays cannot silently collapse to one, and reported comparisons need sources", () => {
  const data = adaptiveWorkspace();
  const plan = data.goals[0].plans[0].adaptive!;
  plan.steps[0].recurrence = {
    everyDays: 7,
    weekdays: [1, 3],
    until: plan.window.end,
  };
  assert.throws(() => validateWorkspace(data), /visits only one weekday/);
  plan.steps[0].recurrence = {
    everyDays: 1,
    weekdays: [1, 3],
    until: plan.window.end,
  };
  plan.experiment!.comparisonStatus = "reported";
  assert.throws(
    () => validateWorkspace(data),
    /starting comparison needs source records/,
  );
});

test("qualitative check-in notes remain reviewable without manufacturing numerical results", () => {
  const data = adaptiveWorkspace();
  const goal = data.goals[0];
  recordAction(data, data.actions[0].id, "Done");
  data.messages.push({
    id: "felt-easier",
    goalId: goal.id,
    role: "user",
    at: "2026-09-07T12:00:00Z",
    text: "I started more easily and enjoyed writing today.",
  });
  const evidence = cycleEvidence(data, goal, "2026-09-08")!;
  assert.equal(evidence.status, "Check-in notes available to review");
  assert.deepEqual(
    evidence.notes.map((m) => m.id),
    ["felt-easier"],
  );
  assert.equal(evidence.results.length, 0);
  assert.equal(data.goals[0].results.at(-1)?.value, 0);
});
