import test from "node:test";
import assert from "node:assert/strict";
import { tentativeSchedule } from "../shared/tentative-schedule.ts";
import { adaptiveFixture, adaptiveWorkspace } from "./adaptive-fixture.ts";
import { overlaps } from "../src/scheduling.ts";
import { applyChanges } from "../server/commands.ts";

const start = "2026-09-07", end = "2026-09-14", now = new Date(`${start}T08:00:00Z`);
function workspace() {
  const data = adaptiveWorkspace(adaptiveFixture(start, start));
  const program = data.programs.at(-1)!;
  Object.assign(program, { weeklyMinutes: 120, workStart: "09:00", workEnd: "12:00", workDays: [1, 2, 3, 4, 5], focusGoalId: "other" });
  const other = structuredClone(data.goals[0]); other.id = "other"; data.goals.push(other);
  data.actions.push({ ...structuredClone(data.actions[0]), goalId: other.id, id: "other-action" });
  return data;
}

test("tentative placement balances goals around known commitments without booking or reporting them", () => {
  const data = workspace(), before = structuredClone(data);
  data.workBlocks.push({ id: "booked", goalId: "essay", action: "Previously confirmed work", start: `${start}T09:00:00Z`, end: `${start}T09:30:00Z`, status: "Scheduled", provider: "local" });
  const busy = [{ start: `${start}T09:30:00Z`, end: `${start}T10:00:00Z` }];
  const scheduled = tentativeSchedule(data, start, end, now, busy);
  assert.equal(scheduled.externalAvailability, "checked");
  assert.deepEqual(scheduled.blocks.map(block => block.goalId), ["other", "essay"]);
  for (const block of scheduled.blocks) {
    assert.equal((Date.parse(block.end) - Date.parse(block.start)) / 60000, 25);
    assert.equal([...busy, ...data.workBlocks, ...scheduled.blocks.filter(other => other !== block)].some(other => overlaps(block, other)), false);
  }
  assert.deepEqual(data.actions, before.actions);
  assert.deepEqual(data.learning, before.learning);
  assert.equal(data.workBlocks.length, 1);
});

test("moving a preview rearranges tentative work while keeping bookings fixed and respecting the weekly budget", () => {
  const data = workspace();
  const first = tentativeSchedule(data, start, end, now);
  const holding = { ...first.blocks[1], start: first.blocks[0].start, end: first.blocks[0].end };
  const moved = tentativeSchedule(data, start, end, now, undefined, holding);
  assert.equal(moved.blocks.length, 1);
  assert.equal(moved.blocks[0].goalId, "other");
  assert.equal(overlaps(holding, moved.blocks[0]), false);
  assert.notEqual(moved.blocks[0].start, first.blocks[0].start);
  data.programs.at(-1)!.weeklyMinutes = 25;
  const limited = tentativeSchedule(data, start, end, now, undefined, holding);
  assert.deepEqual(limited.blocks, []);
  assert.match(limited.unplaced[0].reason, /budget/);
});

test("tentative work excludes reported, retired, blocked and paused work and accounts for time already used", () => {
  const data = workspace(), action = data.actions[0];
  data.actions.push({ ...structuredClone(action), id: "retired", date: "2026-09-08", retiredAt: now.toISOString() });
  action.outcome = "Done"; action.actualMinutes = 100;
  data.programs.at(-1)!.weeklyMinutes = 120;
  const full = tentativeSchedule(data, start, end, now);
  assert.deepEqual(full.blocks, []);
  assert.deepEqual(full.unplaced.map(item => item.actionId), ["other-action"]);
  action.actualMinutes = 10;
  assert.equal(tentativeSchedule(data, start, end, now).blocks.length, 1);
  data.goals[1].plans[0].adaptive!.steps[0].dependsOn = ["not-completed"];
  assert.match(tentativeSchedule(data, start, end, now).unplaced[0].reason, /prerequisite/);
  data.goals[1].status = "Paused";
  assert.deepEqual(tentativeSchedule(data, start, end, now).unplaced, []);
});

test("saved action dates stay on the specified day and calendar freshness uses timezone-correct coverage", () => {
  const data = workspace();
  data.timeZone = "America/Toronto";
  const busy = [{ start: `${start}T13:00:00Z`, end: `${start}T16:00:00Z` }];
  data.calendarSnapshot = { provider: "google", checkedAt: now.toISOString(), start: `${start}T04:00:00Z`, end: `${end}T04:00:00Z`, busy };
  let result = tentativeSchedule(data, start, end, now);
  assert.equal(result.externalAvailability, "checked");
  assert.deepEqual(result.blocks, [], "No silent move to a different planned day");
  data.calendarSnapshot.end = `${end}T00:00:00Z`;
  result = tentativeSchedule(data, start, end, now);
  assert.equal(result.externalAvailability, "unknown", "Midnight UTC does not cover the whole local week");
  data.calendarSnapshot.end = `${end}T04:00:00Z`;
  assert.equal(tentativeSchedule(data, start, end, new Date(now.getTime() + 300001)).externalAvailability, "unknown");
});

test("the next week's actions and canceled earlier commitments do not consume this week's tentative capacity", () => {
  const data = workspace();
  data.actions[0].retiredAt = now.toISOString();
  data.actions[0].date = "2026-09-06";
  data.actions.push({ ...structuredClone(data.actions[1]), id: "next-week", date: end });
  data.programs.at(-1)!.weeklyMinutes = 25;
  const result = tentativeSchedule(data, start, end, now);
  assert.deepEqual(result.blocks.map(block => block.id), ["other-action"]);
  assert.deepEqual(result.unplaced, []);
});

test("editing a milestone's wording or date does not create an outcome report; confirmation does", () => {
  const data = workspace(), goal = data.goals[0], milestone = goal.milestones[0];
  milestone.dueDate = "2026-10-01";
  const changed = applyChanges(data, [{ entity: "milestone", operation: "update", id: milestone.id, parentId: goal.id, values: JSON.stringify({ title: "First essay published", criterion: "A public URL", dueDate: null }) }], start);
  assert.equal(changed.goals[0].milestones[0].dueDate, undefined);
  assert.deepEqual(changed.goals[0].results, goal.results);
  assert.equal(changed.goals[0].outcomeUpdatedAt, goal.outcomeUpdatedAt);
  const confirmed = applyChanges(changed, [{ entity: "milestone", operation: "update", id: milestone.id, parentId: goal.id, values: JSON.stringify({ done: true }) }], start);
  assert.equal(confirmed.goals[0].results.at(-1)!.value, 1);
  assert.deepEqual(confirmed.actions, data.actions);
});

test("actual time on booked work replaces the reservation in the weekly budget", () => {
  const data = workspace(), action = data.actions[0];
  data.workBlocks.push({ id: action.id, goalId: action.goalId, action: action.title, start: `${start}T09:00:00Z`, end: `${start}T09:25:00Z`, status: "Done", provider: "local" });
  action.outcome = "Done"; action.actualMinutes = 120;
  let result = tentativeSchedule(data, start, end, now);
  assert.deepEqual(result.blocks, []);
  assert.match(result.unplaced[0].reason, /budget/);
  action.outcome = "Didn’t happen"; delete action.actualMinutes;
  result = tentativeSchedule(data, start, end, now);
  assert.equal(result.blocks.length, 1);
  assert.equal(overlaps(result.blocks[0], data.workBlocks[0]), false, "The recorded calendar interval is preserved as history");
});

test("draft work uses remaining time without displacing accepted active work", () => {
  const data = workspace();
  data.goals[0].status = "Active";
  data.goals[1].status = "Draft";
  data.actions[1].date = "";
  data.programs.at(-1)!.weeklyMinutes = 25;
  const result = tentativeSchedule(data, start, end, now);
  assert.deepEqual(result.blocks.map(block => block.goalId), ["essay"]);
  assert.deepEqual(result.unplaced.map(item => item.goalId), ["other"]);
});
