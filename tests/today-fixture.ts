import { adaptiveFixture, adaptiveWorkspace } from "./adaptive-fixture";
import { addDays } from "../shared/journey";
import { evidenceRevision } from "../server/learning";
import { createGoal } from "../shared/validation";
import { RESEARCH_CLAIMS } from "../shared/research-claims";

// Fictional reports for the daily story; no app-side demo or generated personal claims.
export function todayFixture(today: string) {
  const data = adaptiveWorkspace(adaptiveFixture(addDays(today, -4), addDays(today, 4)));
  data.programs.at(-1)!.weeklyMinutes = 180;
  const goal = data.goals[0];
  goal.plans[0].adaptive!.window.capacityMinutes = 150;
  const action = data.actions[0];
  goal.plans[0].adaptive!.steps.push({ id: "feedback", type: "task", title: "Ask for feedback on the draft", criterion: "Send the draft and one question", cue: "After drafting", reason: "My chosen next step", durationMinutes: 10, scheduledDate: today, dependsOn: [] });
  data.actions = [
    { ...action, id: "monday", date: addDays(today, -2), outcome: "Done" as const, amount: 5 },
    { ...action, id: "tuesday", date: addDays(today, -1), outcome: "Partly" as const, amount: 2 },
    { ...action, id: "today-outline", date: today },
    { ...action, id: "today-feedback", stepId: "feedback", title: "Ask for feedback on the draft", date: today },
    { ...action, id: "tomorrow", date: addDays(today, 1) },
    { ...action, id: "retired", title: "Retired action", date: today, retiredAt: today },
  ];
  data.actions.forEach(action => { action.occurrence = `${action.stepId}:${action.date}`; });
  const reasoning = structuredClone(goal.plans[0].adaptive!.reasoning!);
  data.memories.push({ id: "writing-window", date: addDays(today, -3), text: "I have a quiet window after breakfast. Evening meetings got in the way twice." });
  reasoning.barrier = { domain: "opportunity", status: "reported", explanation: data.memories[0].text, sourceIds: ["writing-window"] };
  const sources = [evidenceRevision(data, "writing-window")!];
  data.decisions.push({ id: "writing-decision", date: addDays(today, -2), goalId: goal.id, programVersion: 1, planVersion: 1, mode: "live", checks: [], methods: [reasoning.methodId], summary: "Try the available writing window", status: "Accepted", researchClaims: RESEARCH_CLAIMS.filter(claim => claim.id === "claim:implementation-if-then"), researchSources: RESEARCH_CLAIMS.filter(claim => claim.id === "claim:implementation-if-then").map(claim => claim.source) });
  data.learning = [{
    id: "writing-window-test", goalIds: [goal.id], state: "agreed", standing: "untested", activeVersion: 1,
    versions: [{ version: 1, decisionId: "writing-decision", at: `${addDays(today, -2)}T12:00:00.000Z`, observation: data.memories[0].text, hypothesis: "An after-breakfast cue may make the outline easier to start.", reasoning, sources,
      test: { change: "Try your outline after breakfast.", design: "prospective", prediction: "You report whether the cue helped you start.", comparison: "Compare with your reported evening experience.", start: addDays(today, -2), reviewAfter: today, reviewRule: reasoning.reviewRule, mechanismSignal: "Whether you noticed and used the cue.", behaviorSignal: "Whether you began writing, and how many points you drafted.", inputStepIds: ["outline"], outcomeSignal: "Whether an essay is published, reported separately.", alternatives: ["Available time or the writing task may differ."] }, transfer: null, proposalId: null }],
    reviews: [], events: [{ at: `${addDays(today, -2)}T12:00:00.000Z`, state: "agreed", reason: "You agreed to try the cue." }], invalidations: [],
  }];
  return data;
}

export function todayProgressFixture(today: string) {
  const data = todayFixture(today);
  const essay = data.goals[0];
  essay.startDate = addDays(today, -21);
  essay.targetDate = addDays(today, 14);
  essay.outcomeUpdatedAt = today;
  essay.checkpoints = [];
  essay.results = [
    { id: "essay-start", date: addDays(today, -21), value: 0, source: "Starting baseline: no milestones verified yet" },
    { id: "essay-draft", date: addDays(today, -8), value: 1, source: "First draft verified" },
  ];
  essay.milestones = [
    { ...essay.milestones[0], dueDate: essay.targetDate },
    { id: "draft", title: "First draft", criterion: "A complete draft exists", done: true, dueDate: addDays(today, -7), completedAt: addDays(today, -8) },
    { id: "review", title: "Peer review", criterion: "Feedback received", done: false, dueDate: today },
  ];
  for (const entry of [
    { id: "reading", title: "Read twelve books", unit: "books", target: 12, actual: 5, planned: 5, daysAgo: 0 },
    { id: "spanish", title: "Learn conversational Spanish", unit: "lessons", target: 24, actual: 8, planned: 10, daysAgo: 5 },
  ]) {
    createGoal(data, { title: entry.title, kind: "learning", why: "Make time for something meaningful", success: "Reach my chosen target", area: "Unassigned", tags: [], targetDate: addDays(today, 42), measure: { label: entry.unit, unit: entry.unit, target: entry.target, baseline: 0, aggregation: "cumulative" }, milestones: [], assessmentTarget: 8, baseline: null, action: "Spend twenty minutes on practice", criterion: "A practice session completed", timing: "After lunch" }, addDays(today, -21), entry.id);
    const goal = data.goals.at(-1)!;
    goal.status = "Active";
    goal.results = [
      { id: `${entry.id}-first`, date: addDays(today, -14), value: 2, source: "User report" },
      { id: `${entry.id}-second`, date: addDays(today, -8), value: entry.actual - 1, source: "User report" },
      { id: `${entry.id}-latest`, date: addDays(today, -entry.daysAgo), value: entry.actual, source: "User report" },
    ];
    goal.checkpoints = [
      { id: `${entry.id}-checkpoint-1`, date: addDays(today, -14), value: 2, label: "First checkpoint" },
      { id: `${entry.id}-checkpoint-2`, date: today, value: entry.planned, label: "This checkpoint" },
      { id: `${entry.id}-checkpoint-3`, date: addDays(today, 21), value: entry.target - 4, label: "Next checkpoint" },
    ];
  }
  return data;
}
