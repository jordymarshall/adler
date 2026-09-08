import type { AdaptivePlan } from "../shared/adaptive-plan.ts";
import { createGoal } from "../shared/validation.ts";
import { initialData } from "../shared/workspace.ts";

export function adaptiveFixture(start = "2026-09-07", end = "2026-09-11"): AdaptivePlan {
  return {
    projectionUnavailableReason: "Outline attempts and a published essay are tracked separately. There is no established conversion from outline points to a publication date.",
    reasoning: {
      grounding: [{ claimId: "claim:implementation-if-then", version: "2026-09-07.1", relation: "motivates", application: "The specified cue can connect the chosen outline task to a feasible start; its usefulness for this person remains untested." }],
      principleIds: ["P2"], goalRoute: "session", ruleExceptions: ["Use a short drafting trial rather than a daily habit or automaticity target."],
      barrier: { domain: "uncertain", status: "unknown", explanation: "The person's starting obstacle is not established yet.", sourceIds: [] },
      methodId: "implementation", researchSourceIds: ["method:implementation", "adler:P2", "curated:implementation-if-then"],
      mechanism: "An agreed cue can connect an intention to a concrete start.",
      fit: "The outline trial has a concrete first step and an after-breakfast cue; its usefulness is provisional.",
      prediction: "The person reports whether the cue made starting easier.",
      reviewRule: "Keep the cue if it helps; otherwise ask what prevented starting before increasing work.",
      limitation: "Available time and the writing task may differ between attempts; a cue cannot remove a time conflict.",
    },
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
    experiment: { hypothesis: "A short outline may make starting the draft easier.", inputStepIds: ["outline"], outcomeSignal: "User reports whether a draft exists and whether starting feels easier.", comparison: "Compare with the user's reported starting experience; unknown until the first check-in.", comparisonStatus: "unknown", comparisonSourceIds: [], decisionRule: "If outlining happens but drafting remains blocked, inspect the obstacle before changing the commitment.", alternativeExplanations: ["Available time or the writing task may differ between attempts."] },
    assessment: { at: `${end}T20:00:00.000Z`, question: "Did outlining help the draft?", adaptation: "Inspect the obstacle before changing the approach.", feedbackDelayDays: 0, triggers: ["check-in", "window-end"] },
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
