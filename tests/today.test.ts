import test from "node:test";
import assert from "node:assert/strict";
import { todayActivity, todayLearning, goalPlanProgress } from "../shared/today";
import { todayFixture, todayProgressFixture } from "./today-fixture";

const now = new Date("2026-09-09T16:00:00Z");
test("Today shows due work and keeps reported history when a plan is retired or paused", () => {
  const data = todayFixture("2026-09-09");
  assert.deepEqual(todayActivity(data, now).actions.map(action => action.id), ["today-outline", "today-feedback"]);
  const done = data.actions.find(action => action.id === "today-outline")!;
  done.outcome = "Done";
  done.retiredAt = "2026-09-09";
  assert.equal(todayActivity(data, now).actions.length, 2, "Reported work survives retirement");
  data.goals[0].status = "Paused";
  assert.deepEqual(todayActivity(data, now).actions.map(action => action.id), [done.id], "Pausing removes demands, not reports");
});

test("Today uses the account date to select work", () => {
  const data = todayFixture("2026-09-09");
  data.timeZone = "Asia/Tokyo";
  const view = todayActivity(data, now);
  assert.equal(view.today, "2026-09-10");
  assert.deepEqual(view.actions.map(action => action.id), ["tomorrow"]);
});

test("every goal is compared in its own units against dated commitments", () => {
  const data = todayProgressFixture("2026-09-09");
  const [essay, reading, spanish] = data.goals.map(goal => goalPlanProgress(goal, "2026-09-09"));
  assert.equal(essay.actual, 1);
  assert.equal(essay.target, 3);
  assert.equal(essay.due?.value, 2);
  assert.equal(essay.delta, -1);
  assert.equal(essay.label, "Milestone still open");
  assert.deepEqual(essay.openMilestones.map(milestone => milestone.title), ["Peer review"]);
  assert.equal(reading.actual, 5);
  assert.equal(reading.unit, "books");
  assert.equal(reading.delta, 0);
  assert.equal(reading.label, "At checkpoint");
  assert.equal(spanish.actual, 8);
  assert.equal(spanish.label, "Update needed");
  assert.equal(spanish.delta, null, "Old results do not establish a current gap");
});

test("a deadline alone does not invent a daily pace or a claim of being on track", () => {
  const goal = todayProgressFixture("2026-09-09").goals[1];
  goal.checkpoints = [];
  const view = goalPlanProgress(goal, "2026-09-09");
  assert.equal(view.checkpoints.length, 1);
  assert.equal(view.next?.date, goal.targetDate);
  assert.equal(view.due, undefined);
  assert.equal(view.delta, null);
  assert.equal(view.label, "First checkpoint ahead");
  delete goal.targetDate;
  assert.equal(goalPlanProgress(goal, "2026-09-09").label, "No dated checkpoint");
});

test("future results are excluded and a saved baseline never becomes a fresh report", () => {
  const goal = todayProgressFixture("2026-09-09").goals[1];
  goal.results.push({ id: "future", date: "2026-09-10", value: 12, source: "User report" });
  assert.equal(goalPlanProgress(goal, "2026-09-09").actual, 5);
  goal.results = [];
  const baseline = goalPlanProgress(goal, "2026-09-09");
  assert.equal(baseline.actual, 0);
  assert.equal(baseline.observedAt, null);
  assert.equal(baseline.label, "Update needed");
  goal.measure!.baseline = null;
  const unknown = goalPlanProgress(goal, "2026-09-09");
  assert.equal(unknown.actual, null);
  assert.equal(unknown.observations.length, 0);
  assert.equal(unknown.label, "Add a result");
});

test("finishing a different milestone cannot satisfy the one that is due", () => {
  const goal = todayProgressFixture("2026-09-09").goals[0];
  goal.milestones[0].done = true;
  goal.milestones[0].completedAt = "2026-09-09";
  const view = goalPlanProgress(goal, "2026-09-09");
  assert.equal(view.actual, view.due!.value);
  assert.equal(view.label, "Milestone still open");
  assert.equal(view.tone, "attention");
  assert.equal(view.openMilestones[0].title, "Peer review");
  delete goal.outcomeUpdatedAt;
  assert.equal(goalPlanProgress(goal, "2026-09-09").label, "Verify the milestone");
});

test("milestone history uses known dates without moving future completions into today", () => {
  const goal = todayProgressFixture("2026-09-09").goals[0];
  goal.milestones[0].done = true;
  goal.milestones[0].completedAt = "2026-09-10";
  const view = goalPlanProgress(goal, "2026-09-09");
  assert.equal(view.actual, 1);
  assert.ok(view.observations.every(point => point.date <= "2026-09-09"));
  delete goal.milestones[1].completedAt;
  delete goal.outcomeUpdatedAt;
  goal.results = [];
  assert.deepEqual(goalPlanProgress(goal, "2026-09-09").observations, [], "Undated verification does not invent a completion date");
});

test("milestone timelines preserve saved reports and corrections", () => {
  const goal = todayProgressFixture("2026-09-09").goals[0];
  goal.results.push({ id: "earlier-report", date: "2026-09-05", value: 2, source: "Earlier milestone report" });
  goal.results.push({ id: "correction", date: "2026-09-09", value: 1, source: "One milestone was not complete" });
  const view = goalPlanProgress(goal, "2026-09-09");
  assert.equal(view.observations.length, goal.results.length);
  assert.deepEqual(view.observations.slice(-2), [{ date: "2026-09-05", value: 2 }, { date: "2026-09-09", value: 1 }]);
  assert.equal(view.actual, 1);
});

test("inactive goals retain their real status and saved progress", () => {
  const goal = todayProgressFixture("2026-09-09").goals[1];
  for (const status of ["Draft", "Paused", "Completed", "Set aside"] as const) {
    goal.status = status;
    const view = goalPlanProgress(goal, "2026-09-09");
    assert.equal(view.label, status);
    assert.equal(view.actual, 5);
    assert.equal(view.tone, "quiet");
  }
});

test("review timing and corrected evidence prioritize attention without promoting a conclusion", () => {
  const data = todayFixture("2026-09-09");
  const record = data.learning![0];
  const corrected = { ...structuredClone(record), id: "corrected", standing: "reconsider" as const };
  const suggested = { ...structuredClone(record), id: "suggested", state: "suggested" as const };
  const closed = { ...structuredClone(record), id: "closed", state: "closed" as const };
  const declined = { ...structuredClone(record), id: "declined", state: "declined" as const };
  data.learning!.push(suggested, corrected, closed, declined);
  assert.deepEqual(todayLearning(data, "2026-09-09").map(record => record.id), ["corrected", record.id, "suggested"]);
  assert.equal(record.standing, "untested");
  assert.equal(record.reviews.length, 0);
  assert.equal(record.activeVersion, 1);
});

test("goals without an outcome measure do not receive a fabricated target", () => {
  const goal = todayProgressFixture("2026-09-09").goals[1];
  delete goal.measure;
  delete goal.target;
  delete goal.unit;
  goal.results = [];
  goal.checkpoints = [];
  const view = goalPlanProgress(goal, "2026-09-09");
  assert.equal(view.label, "No outcome measure");
  assert.equal(view.target, 0);
  assert.equal(view.actual, null);
  assert.equal(view.checkpoints.length, 0);
  goal.status = "Draft";
  assert.equal(goalPlanProgress(goal, "2026-09-09").label, "Draft");
});

test("comparison color respects a saved target to reduce a measured value", () => {
  const goal = todayProgressFixture("2026-09-09").goals[1];
  goal.measure = { label: "Inbox items", unit: "items", baseline: 100, target: 20, aggregation: "level" };
  goal.checkpoints = [{ id: "inbox-checkpoint", date: "2026-09-09", value: 50, label: "First checkpoint" }];
  goal.results = [{ id: "inbox-report", date: "2026-09-09", value: 40, source: "User report" }];
  const view = goalPlanProgress(goal, "2026-09-09");
  assert.equal(view.label, "Below checkpoint");
  assert.equal(view.delta, -10);
  assert.equal(view.tone, "positive");
});
