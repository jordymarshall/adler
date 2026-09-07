import test from "node:test";
import assert from "node:assert/strict";
import { checkInContext } from "../shared/check-in-context.ts";
import { adaptiveWorkspace } from "./adaptive-fixture.ts";

test("connected context can assist a check-in without asserting an outcome or cause", () => {
  const data = adaptiveWorkspace();
  const action = data.actions[0];
  data.workBlocks.push({ id: action.id, goalId: action.goalId, action: action.title, start: "2026-09-07T09:00:00Z", end: "2026-09-07T09:25:00Z", provider: "local", status: "Scheduled" });
  data.calendarSnapshot = { start: "2026-09-07T00:00:00Z", end: "2026-09-08T00:00:00Z", checkedAt: "2026-09-07T09:30:00Z", provider: "Google Calendar", busy: [{ start: "2026-09-07T08:30:00Z", end: "2026-09-07T09:15:00Z" }] };
  const before = structuredClone(data);
  const context = checkInContext(data, action, new Date("2026-09-07T09:40:00Z"));
  assert.equal(context.length, 1);
  assert.match(context[0].text, /busy.*overlap/i);
  assert.equal(context[0].source, "Google Calendar");
  assert.deepEqual(data, before);
  assert.equal(checkInContext(data, action, new Date("2026-09-10T09:40:00Z")).length, 0);
});
