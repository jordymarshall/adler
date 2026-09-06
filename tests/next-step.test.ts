import test from "node:test";
import assert from "node:assert/strict";
import { beginAction, goalStep, todayStep } from "../shared/next-step.ts";
import { initialData, startGoal } from "../shared/workspace.ts";
import { createGoal } from "../shared/validation.ts";
import { dateInZone } from "../shared/journey.ts";
function fixture() {
  const data = initialData();
  data.timeZone = "America/Toronto";
  createGoal(
    data,
    {
      title: "Publish an essay",
      kind: "project",
      why: "Share an idea",
      success: "One published essay",
      area: "Unassigned",
      tags: [],
      targetDate: "2027-12-31",
      milestones: [{ title: "Published", criterion: "A public URL" }],
      assessmentTarget: 8,
      baseline: null,
      action: "Draft five points",
      criterion: "Five points are on paper",
      timing: "Unscheduled",
      durationMinutes: 25,
      status: "Draft",
    },
    "2026-09-01",
    "essay",
  );
  return data;
}
test("a draft becomes one schedulable step, then work and a due check-in without recording success", () => {
  const data = fixture();
  const goal = data.goals[0];
  const action = data.actions[0];
  const now = new Date("2026-09-07T13:00:00Z");
  assert.equal(goalStep(data, goal, now).phase, "draft");
  beginAction(data, action.id, now);
  assert.equal(action.startedAt, undefined);
  startGoal(data, goal.id);
  assert.equal(goalStep(data, goal, now).phase, "schedule");
  action.date = "2026-09-08";
  assert.equal(
    goalStep(data, goal, now).phase,
    "schedule",
    "A proposed date is not a confirmed calendar time",
  );
  beginAction(data, action.id, now);
  assert.equal(action.date, "2026-09-07");
  assert.equal(goalStep(data, goal, now).phase, "working");
  assert.equal(
    goalStep(data, goal, new Date("2026-09-07T13:25:00Z")).phase,
    "checkin",
  );
  beginAction(data, action.id, new Date("2026-09-07T14:00:00Z"));
  assert.equal(action.startedAt, now.toISOString());
  assert.equal(action.outcome, undefined);
  assert.equal(goal.results.at(-1)?.value, 0);
});
test("scheduled work has a stopping point and gets priority over older unanswered check-ins and reviews", () => {
  const data = fixture();
  const goal = data.goals[0];
  goal.status = "Active";
  const action = data.actions[0];
  const now = new Date("2026-09-06T13:00:00Z");
  data.workBlocks.push({
    id: action.id,
    goalId: goal.id,
    action: action.title,
    start: "2026-09-06T13:00:00Z",
    end: "2026-09-06T13:25:00Z",
    provider: "local",
    status: "Scheduled",
  });
  action.date = dateInZone(data.timeZone, now);
  data.actions.push({ ...action, id: "old", date: "2026-09-01" });
  assert.equal(todayStep(data, now).review, false);
  assert.equal(todayStep(data, now).step?.action?.id, action.id);
  assert.equal(
    goalStep(data, goal, new Date("2026-09-06T12:00:00Z"), action.id).phase,
    "waiting",
  );
  assert.equal(goalStep(data, goal, now).phase, "ready");
});
test("Today selects the chosen focus among unscheduled goals and brings due reviews forward without blocking work", () => {
  const data = fixture();
  data.goals[0].status = "Active";
  const goal = structuredClone(data.goals[0]);
  goal.id = "second";
  data.goals.push(goal);
  data.actions.push({
    ...data.actions[0],
    id: "second-action",
    goalId: goal.id,
  });
  data.programs.at(-1)!.focusGoalId = goal.id;
  assert.equal(
    todayStep(data, new Date("2026-09-07T13:00:00Z")).step?.goal.id,
    goal.id,
  );
  assert.equal(todayStep(data, new Date("2026-09-06T13:00:00Z")).review, true);
});
