import type { AdaptivePlan } from "../shared/adaptive-plan.ts";
import { createGoal } from "../shared/validation.ts";
import { initialData } from "../shared/workspace.ts";

export function adaptiveFixture(start = "2026-09-07", end = "2026-09-11"): AdaptivePlan {
  return {
    approach: "Test whether a short outline makes drafting easier.",
    window: { start, end, label: "Outline experiment", rationale: "Three attempts will inform the next drafting decision.", capacityMinutes: 90, capacityStatus: "confirmed" },
    steps: [{
      id: "outline", type: "behavior", title: "Draft five outline points",
      criterion: "Five points are written", reason: "An outline makes the next draft executable.",
      durationMinutes: 25, cue: "After breakfast", scheduledDate: start,
      recurrence: { everyDays: 2, until: end }, dependsOn: [],
      measure: { id: "outline-points", label: "Outline points", unit: "points", target: 5 },
      fallback: "Write one point if time is short.",
    }],
    assessment: { at: `${end}T20:00:00.000Z`, question: "Did outlining help the draft?", adaptation: "Inspect the obstacle before changing the approach.", feedbackDelayDays: 0, triggers: ["check-in", "window-end"] },
    forecast: { method: "none", rationale: "Outline points alone do not predict publication.", minimumObservations: 3, horizonDays: 90, freshnessDays: 14 },
  };
}

export function adaptiveWorkspace(plan = adaptiveFixture()) {
  const data = initialData();
  data.timeZone = "UTC";
  createGoal(data, {
    title: "Publish an essay", kind: "project", why: "Share an idea", success: "Essay published",
    area: "Unassigned", tags: [], targetDate: "2027-10-01",
    milestones: [{ title: "Published", criterion: "A public URL" }], assessmentTarget: 8, baseline: null,
    action: plan.steps[0].title, criterion: plan.steps[0].criterion, timing: plan.steps[0].cue,
    adaptive: plan,
  }, "2026-09-06", "essay");
  return data;
}
