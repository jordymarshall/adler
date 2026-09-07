import test from "node:test";
import assert from "node:assert/strict";
import { behaviorProgress } from "../shared/behavior-progress.ts";
import { recordLink, referencedText } from "../shared/record-links.ts";
import { coachingContext } from "../src/coach-context.ts";
import { adaptiveWorkspace } from "./adaptive-fixture.ts";

test("completion averages each goal equally and distinguishes missing reports from failures", () => {
  const data = adaptiveWorkspace();
  data.goals.push({
    ...structuredClone(data.goals[0]),
    id: "second",
    title: "Second goal",
  });
  const action = data.actions[0];
  data.actions = [
    { ...action, id: "done", date: "2026-09-05", outcome: "Done" },
    { ...action, id: "unknown", date: "2026-09-06" },
    {
      ...action,
      id: "partial",
      goalId: "second",
      date: "2026-09-05",
      outcome: "Partly",
    },
    {
      ...action,
      id: "missed",
      goalId: "second",
      date: "2026-09-06",
      outcome: "Didn’t happen",
    },
    { ...action, id: "future", date: "2026-09-08" },
    {
      ...action,
      id: "retired",
      date: "2026-09-06",
      retiredAt: "2026-09-06T12:00:00Z",
    },
  ];
  const result = behaviorProgress(data, "2026-09-06");
  assert.equal(result.rate, 50);
  assert.equal(result.reported, 3);
  assert.equal(result.unknown, 1);
  assert.equal(result.average.at(-1)?.rate, 50);
  assert.equal(result.average[0].rate, null);
  data.actions = [];
  assert.equal(behaviorProgress(data, "2026-09-06").rate, null);
});

test("general and focused coaching both receive behavior evidence from every goal", () => {
  const data = adaptiveWorkspace();
  data.goals.push({
    ...structuredClone(data.goals[0]),
    id: "second",
    title: "Second goal",
  });
  data.actions.push({
    ...data.actions[0],
    id: "second-action",
    goalId: "second",
    outcome: "Partly",
    note: "Work ran late",
  });
  for (const goalId of ["general", "essay"]) {
    const context = coachingContext(
      data,
      goalId,
      "Help me review",
      "2026-09-06",
    );
    assert.equal(context.allGoalContexts.length, 2);
    assert.ok(context.recentActions.some((a) => a.id === "second-action"));
    assert.ok(
      context.checks
        .find((c) => c.id === "observations")
        ?.finding.includes("Work ran late"),
    );
  }
});

test("inline references resolve only account records and survive overlapping or repeated phrases", () => {
  const data = adaptiveWorkspace();
  data.memories.push({
    id: "morning",
    text: "Mornings work for me",
    date: "2026-09-06",
  });
  const parts = referencedText(
    data,
    "Publish an essay after breakfast. Try after breakfast again.",
    [
      { text: "after breakfast", recordId: "morning" },
      { text: "Try", recordId: "foreign-id" },
    ],
  );
  assert.equal(
    parts.map((p) => p.text).join(""),
    "Publish an essay after breakfast. Try after breakfast again.",
  );
  assert.equal(
    parts.filter((p) => p.href?.includes("#record-morning")).length,
    2,
  );
  assert.equal(parts[0].href, "/app/goals/essay");
  assert.equal(recordLink(data, "foreign-id"), undefined);
  assert.ok(
    recordLink(data, data.actions[0].id)?.includes("/progress#record-"),
  );
});
