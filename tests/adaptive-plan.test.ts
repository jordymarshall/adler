import test from "node:test";
import assert from "node:assert/strict";
import { createGoal, validateWorkspace } from "../shared/validation.ts";
import { initialData, recordAction } from "../shared/workspace.ts";
import { goalStep, todayStep } from "../shared/next-step.ts";
import { maintainAdaptivePlans } from "../shared/adaptive-plan.ts";
import { adaptiveFixture, adaptiveWorkspace } from "./adaptive-fixture.ts";
import { applyChanges } from "../server/commands.ts";
import { addDays, dateInZone } from "../shared/journey.ts";

test("an accepted recurring plan exposes the next occurrence after a check-in without another chat", () => {
  const data = initialData();
  data.timeZone = "UTC";
  const goal = createGoal(data, {
    title: "Publish an essay", kind: "project", why: "Share an idea", success: "Essay published",
    area: "Unassigned", tags: [], targetDate: "2026-10-01",
    milestones: [{ title: "Published", criterion: "A public URL" }], assessmentTarget: 8, baseline: null,
    action: "Draft five outline points", criterion: "Five points are written", timing: "After breakfast",
    adaptive: adaptiveFixture(),
  }, "2026-09-06", "essay");
  maintainAdaptivePlans(data, new Date("2026-09-07T09:00:00Z"));
  assert.deepEqual(data.actions.map(a => a.date), ["2026-09-07", "2026-09-09", "2026-09-11"]);
  goal.plans[0].adaptive!.window.capacityMinutes = 20;
  assert.throws(() => validateWorkspace(data), /capacity/i, "The coach must repair an infeasible commitment");
  goal.plans[0].adaptive!.window.capacityMinutes = 90;
  recordAction(data, data.actions[0].id, "Done", "Helped me get started", 5);
  maintainAdaptivePlans(data, new Date("2026-09-07T10:00:00Z"));
  assert.equal(data.actions.length, 3, "Maintenance is idempotent");
  assert.equal(goalStep(data, goal, new Date("2026-09-07T10:00:00Z")).action?.date, "2026-09-09");
  assert.equal(goal.results.at(-1)?.value, 0, "Doing the behavior does not verify publication");
});

test("decomposition supports a short task and rejects missing or circular prerequisites", () => {
  const plan = adaptiveFixture("2026-09-06", "2026-09-06");
  plan.steps[0].type = "task";
  delete plan.steps[0].recurrence;
  delete plan.steps[0].measure;
  const data = adaptiveWorkspace(plan);
  assert.equal(data.actions.length, 1);
  assert.doesNotThrow(() => validateWorkspace(data));
  plan.steps[0].dependsOn = ["missing"];
  data.goals[0].plans[0].adaptive = plan;
  assert.throws(() => validateWorkspace(data), /prerequisite/i);
  plan.steps[0].dependsOn = [plan.steps[0].id];
  assert.throws(() => validateWorkspace(data), /circular/i);
});

test("competing goals cannot silently exceed shared capacity", () => {
  const today = dateInZone("UTC");
  const data = adaptiveWorkspace(adaptiveFixture(today, addDays(today, 4)));
  const other = structuredClone(data.goals[0]);
  other.id = "another-goal";
  data.goals.push(other);
  assert.throws(() => validateWorkspace(data), /shared.*capacity/i);
});

test("completed task identities survive a new window and release their prerequisites", () => {
  const today = dateInZone("UTC");
  const plan = adaptiveFixture(today, today);
  plan.steps[0].type = "task";
  delete plan.steps[0].recurrence;
  const data = adaptiveWorkspace(plan);
  recordAction(data, data.actions[0].id, "Done");
  const next = structuredClone(data.goals[0].plans[0]);
  next.version++;
  next.adaptive!.window.start = addDays(today, 1);
  next.adaptive!.window.end = addDays(today, 1);
  next.adaptive!.steps[0].scheduledDate = addDays(today, 1);
  next.adaptive!.steps.push({ ...next.adaptive!.steps[0], id: "publish", title: "Publish the draft", dependsOn: ["outline"] });
  data.goals[0].plans.push(next);
  maintainAdaptivePlans(data, new Date(`${today}T12:00:00Z`));
  assert.equal(data.actions.filter(a => a.stepId === "outline").length, 1);
  assert.equal(goalStep(data, data.goals[0]).action?.stepId, "publish");
});

test("a reviewed retry preserves partial and missed attempts while making unfinished tasks executable", () => {
  for (const outcome of ["Partly", "Didn’t happen"] as const) {
    const today = dateInZone("UTC");
    const plan = adaptiveFixture(today, today);
    plan.steps[0].type = "task";
    delete plan.steps[0].recurrence;
    const data = adaptiveWorkspace(plan);
    const original = data.actions[0];
    recordAction(data, original.id, outcome, "Needs another attempt");
    maintainAdaptivePlans(data);
    assert.equal(data.actions.length, 1, "No extra commitment before a review");
    const next = structuredClone(data.goals[0].plans[0]);
    next.version++;
    next.adaptive!.window.start = addDays(today, 1);
    next.adaptive!.window.end = addDays(today, 1);
    next.adaptive!.steps[0].scheduledDate = addDays(today, 1);
    data.goals[0].plans.push(next);
    maintainAdaptivePlans(data);
    maintainAdaptivePlans(data);
    assert.equal(data.actions.length, 2);
    assert.equal(original.outcome, outcome);
    assert.equal(goalStep(data, data.goals[0]).action?.id, data.actions[1].id);
    assert.equal(data.actions[1].stepId, original.stepId);
  }
});

test("Today does not impose a weekly review on an adaptive-only account", () => {
  const data = adaptiveWorkspace(adaptiveFixture("2026-09-14", "2026-09-18"));
  data.goals[0].startDate = "2026-08-01";
  data.programs.at(-1)!.reviewDay = "Sunday";
  assert.equal(todayStep(data, new Date("2026-09-13T12:00:00Z")).review, false);
});

test("reduced capacity never prevents reporting what happened, but new work must fit", () => {
  const today = dateInZone("UTC");
  const data = adaptiveWorkspace(adaptiveFixture(today, addDays(today, 2)));
  const reduced = applyChanges(data, [{ entity: "program", operation: "update", id: null, parentId: null,
    values: JSON.stringify({ weeklyMinutes: 15, reason: "I now only have 15 minutes." }), reason: "I now only have 15 minutes." }], today);
  const recorded = applyChanges(reduced, [{ entity: "action", operation: "update", id: reduced.actions[0].id, parentId: null,
    values: JSON.stringify({ outcome: "Partly", actualMinutes: 10 }), reason: "I spent ten minutes." }], today);
  assert.equal(recorded.actions[0].actualMinutes, 10);
  const revision = structuredClone(recorded.goals[0].plans[0]);
  revision.adaptive!.steps[0].durationMinutes = 30;
  assert.throws(() => applyChanges(recorded, [{ entity: "plan", operation: "update", id: null, parentId: "essay",
    values: JSON.stringify({ action: revision.action, criterion: revision.criterion, timing: revision.timing, adaptive: revision.adaptive }), reason: "Add work" }], today), /capacity/);
});

test("retained bookings count toward capacity after their original occurrences leave the plan", () => {
  const today = dateInZone("UTC");
  const date = addDays(today, 1);
  const data = adaptiveWorkspace(adaptiveFixture(date, date));
  data.programs.at(-1)!.weeklyMinutes = 40;
  const booked = data.actions[0];
  data.workBlocks.push({ id: booked.id, goalId: "essay", action: booked.title, start: `${date}T09:00:00Z`, end: `${date}T09:25:00Z`, provider: "local", status: "Scheduled" });
  const revised = structuredClone(data.goals[0].plans[0].adaptive!);
  revised.window.end = addDays(date, 2);
  revised.steps[0].scheduledDate = revised.window.end;
  revised.steps[0].recurrence!.until = revised.window.end;
  assert.throws(() => applyChanges(data, [{ entity: "plan", operation: "update", id: null, parentId: "essay",
    values: JSON.stringify({ action: booked.title, criterion: booked.criterion, timing: booked.timing, adaptive: revised }), reason: "Another session" }], today), /capacity/);
});

test("pausing stops generation and revisions preserve recorded and booked occurrences", () => {
  const data = adaptiveWorkspace();
  const goal = data.goals[0];
  const [recorded, booked] = data.actions;
  recorded.outcome = "Done";
  data.workBlocks.push({ id: booked.id, goalId: goal.id, action: booked.title, start: "2026-09-09T09:00:00Z", end: "2026-09-09T09:25:00Z", provider: "local", status: "Scheduled" });
  goal.status = "Paused";
  goal.plans[0].adaptive!.steps[0].recurrence!.until = "2026-09-13";
  goal.plans[0].adaptive!.window.end = "2026-09-13";
  maintainAdaptivePlans(data, new Date("2026-09-06T12:00:00Z"));
  assert.equal(data.actions.length, 3);
  goal.status = "Active";
  const next = structuredClone(goal.plans[0]);
  next.version = 2;
  next.adaptive!.steps[0].title = "Outline a smaller section";
  goal.plans.push(next);
  maintainAdaptivePlans(data, new Date("2026-09-06T12:00:00Z"));
  assert.equal(data.actions.length, 4);
  assert.equal(recorded.planVersion, 1);
  assert.equal(booked.planVersion, 1);
  assert.equal(data.actions[2].title, "Outline a smaller section");
});

test("an ongoing practice does not need a fabricated finish date or milestones", () => {
  const data = initialData();
  const goal = createGoal(data, {
    title: "Keep reading", kind: "practical", why: "Enjoy books", success: "Read regularly",
    area: "Personal", tags: [], targetDate: "", deadline: "none", milestones: [], assessmentTarget: 8, baseline: null,
    measure: { label: "Reading sessions this week", unit: "sessions", target: 3, baseline: null, aggregation: "period", period: "week" },
    action: "Read a chapter", criterion: "One chapter read", timing: "After dinner", adaptive: adaptiveFixture(),
  }, "2026-09-06");
  assert.equal(goal.targetDate, undefined);
  assert.equal(goal.checkpoints?.length, 0);
  assert.equal(goal.milestones.length, 0);
  const unmeasured = createGoal(initialData(), {
    title: "Read for enjoyment", kind: "practical", why: "Enjoy books", success: "An enjoyable reading practice",
    area: "Personal", tags: [], targetDate: "", deadline: "none", milestones: [], assessmentTarget: 8, baseline: null,
    action: "Read", criterion: "Read for fifteen minutes", timing: "After dinner", adaptive: adaptiveFixture(),
  }, "2026-09-06");
  assert.equal(unmeasured.target, undefined);
  assert.equal(unmeasured.results.length, 0);
});

test("a historical starting observation keeps its date rather than becoming a fresh result", () => {
  const data = adaptiveWorkspace();
  const goal = createGoal(data, {
    title: "Collect revenue", kind: "practical", why: "Build the business", success: "Collect CAD 100,000",
    area: "Career", tags: [], targetDate: "2027-09-06", milestones: [], assessmentTarget: 8, baseline: null,
    measure: { label: "Collected revenue", unit: "CAD", target: 100000, baseline: 20000, aggregation: "cumulative" },
    baselineDate: "2026-08-27", action: "Review invoices", criterion: "Current receipts reconciled", timing: "Tomorrow",
  }, "2026-09-06");
  assert.equal(goal.results[0].date, "2026-08-27");
  assert.equal(goal.outcomeUpdatedAt, "2026-08-27");
});
