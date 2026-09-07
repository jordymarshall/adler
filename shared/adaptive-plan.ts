import { z } from "zod";
import type { Action, Data, Goal } from "./workspace.ts";
import { addDays, dateInZone } from "./journey.ts";

const description = z.string().trim().min(1).max(1800);
const identifier = z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/);
export const behaviorMeasureSchema = z.object({
  id: identifier,
  label: z.string().trim().min(1).max(150),
  unit: z.string().trim().min(1).max(50),
  target: z.number().positive().max(1000000).nullable(),
}).strict();
export const adaptivePlanSchema = z.object({
  approach: description,
  window: z.object({
    start: z.iso.date(), end: z.iso.date(), label: description, rationale: description,
    capacityMinutes: z.number().int().positive().max(1000000),
    capacityStatus: z.enum(["confirmed", "provisional"]),
  }).strict(),
  steps: z.array(z.object({
    id: identifier,
    type: z.enum(["task", "behavior"]),
    title: z.string().trim().min(1).max(300),
    criterion: description,
    reason: description,
    durationMinutes: z.number().int().min(1).max(1440),
    cue: z.string().trim().min(1).max(300),
    scheduledDate: z.iso.date(),
    recurrence: z.object({
      everyDays: z.number().int().min(1).max(366),
      weekdays: z.array(z.number().int().min(0).max(6)).min(1).max(7).optional(),
      until: z.iso.date(),
    }).strict().optional(),
    dependsOn: z.array(identifier).max(30),
    milestoneId: z.string().max(100).optional(),
    measure: behaviorMeasureSchema.optional(),
    fallback: description.optional(),
    contextIds: z.array(z.string().max(100)).max(3).optional(),
  }).strict()).min(1).max(30),
  assessment: z.object({
    at: z.iso.datetime({ offset: true }),
    question: description,
    adaptation: description,
    feedbackDelayDays: z.number().int().min(0).max(3660),
    triggers: z.array(z.enum(["check-in", "result", "blocker", "milestone", "window-end"])).max(5),
  }).strict(),
  experiment: z.object({
    hypothesis: description,
    inputStepIds: z.array(identifier).min(1).max(30),
    outcomeSignal: description,
    comparison: description,
    comparisonStatus: z.enum(["unknown", "reported"]),
    comparisonSourceIds: z.array(z.string().min(1).max(100)).max(6),
    decisionRule: description,
    alternativeExplanations: z.array(description).max(5),
  }).strict().optional(),
  forecast: z.object({
    method: z.enum(["none", "observed-rate", "behavior-rate"]),
    rationale: description,
    driverStepId: identifier.optional(),
    observationStart: z.iso.date().optional(),
    initialDailyRate: z.number().positive().max(1000000).optional(),
    minimumObservations: z.number().int().min(3).max(100),
    horizonDays: z.number().int().min(1).max(3660),
    freshnessDays: z.number().int().min(1).max(366),
  }).strict().optional(),
}).strict();
export type AdaptivePlan = z.infer<typeof adaptivePlanSchema>;
export type PlanStep = AdaptivePlan["steps"][number];
export const assessmentStateSchema = z.object({
  planVersion: z.number().int(), evidenceKey: z.string().max(120000), nextAt: z.iso.datetime({ offset: true }).nullable(),
  checkedAt: z.iso.datetime().optional(), summary: z.string().max(5000).optional(), decisionId: z.string().optional(),
}).strict();
export type AssessmentState = z.infer<typeof assessmentStateSchema>;

export function assessmentEvidence(data: Data, goal: Goal) {
  const plan = goal.plans.at(-1)!.adaptive;
  const triggers = plan?.assessment.triggers;
  const watches = (event: NonNullable<typeof triggers>[number]) => !triggers || triggers.includes(event);
  return JSON.stringify({
    methodology: "controllable-experiments-v1",
    version: goal.plans.at(-1)!.version,
    outcome: [goal.title, goal.success, goal.targetDate, goal.deadline, goal.measure],
    commitments: data.goals.map(g => [g.id, g.status, g.plans.at(-1)!.version]),
    program: data.programs.at(-1)!.version,
    memories: data.memories.map(m => [m.id, m.text]),
    messages: data.messages.filter(m => m.role === "user" && m.goalId === goal.id && m.channel !== "job").slice(-12).map(m => m.id),
    actions: data.actions.filter(a => a.goalId === goal.id && a.outcome && (watches("check-in") || (watches("blocker") && a.note)))
      .slice(-100).map(a => [a.id, a.date, a.outcome, a.amount, a.actualMinutes, a.note]),
    results: watches("result") ? goal.results.slice(-100) : [],
    milestones: watches("milestone") ? goal.milestones.map(m => [m.id, m.done]) : [],
  });
}

export function assessmentDue(data: Data, goalId: string, now = new Date()) {
  const goal = data.goals.find(g => g.id === goalId);
  if (!goal || goal.status !== "Active") return null;
  const version = goal.plans.at(-1)!;
  const state = goal.assessment;
  const evidence = assessmentEvidence(data, goal);
  const nextAt = state?.planVersion === version.version ? state.nextAt : version.adaptive?.assessment.at;
  const timed = Boolean(nextAt && Date.parse(nextAt) <= now.getTime());
  const changed = !state || evidence !== state.evidenceKey;
  const expired = version.adaptive?.assessment.triggers.includes("window-end") &&
    version.adaptive.window.end < dateInZone(data.timeZone, now) &&
    (!state?.checkedAt || dateInZone(data.timeZone, new Date(state.checkedAt)) <= version.adaptive.window.end);
  if (!changed && !timed && !expired) return null;
  return {
    key: JSON.stringify({ evidence, due: timed ? nextAt : null, windowEnded: Boolean(expired) }),
    reason: !version.adaptive ? "Prepare an adaptive-plan upgrade for this existing goal using its saved context. Keep it reviewable; ask only for essential missing information."
      : changed ? "Review saved evidence and constraints using the current behavioral coaching method. Establish a sourced learning experiment if this plan does not yet have one; preserve the user’s chosen work and keep revisions reviewable."
        : expired ? "The concrete planning window ended. Assess the evidence and prepare the next useful window."
          : "The plan's chosen assessment time has arrived. Check its question against actual observations.",
  };
}

export function stepDates(plan: AdaptivePlan, step: PlanStep) {
  const dates: string[] = [];
  const last = step.recurrence
    ? [step.recurrence.until, plan.window.end].sort()[0]
    : step.scheduledDate;
  for (let date = step.scheduledDate; date <= last; date = addDays(date, step.recurrence?.everyDays ?? 1)) {
    if (date >= plan.window.start && (!step.recurrence?.weekdays ||
      step.recurrence.weekdays.includes(new Date(`${date}T12:00:00Z`).getUTCDay()))) dates.push(date);
    if (!step.recurrence) break;
    if (dates.length > 1000 || Date.parse(date) - Date.parse(step.scheduledDate) > 3660 * 86400000)
      throw new Error("Make a smaller concrete planning window before generating more work.");
  }
  return dates;
}

export function actionStep(data: Data, action: Action) {
  return data.goals.find(g => g.id === action.goalId)?.plans
    .find(p => p.version === action.planVersion)?.adaptive?.steps.find(s => s.id === action.stepId);
}

function stepAction(data: Data, goalId: string, step: PlanStep, date: string) {
  if (step.type === "behavior") return data.actions.find(a => a.goalId === goalId && a.occurrence === `${step.id}:${date}`);
  const attempts = data.actions.filter(a => a.goalId === goalId && a.stepId === step.id && actionStep(data, a)?.type === "task");
  const version = data.goals.find(g => g.id === goalId)!.plans.at(-1)!.version;
  return attempts.find(a => a.outcome === "Done") ?? attempts.find(a => !a.outcome) ??
    attempts.find(a => a.planVersion === version);
}

export function actionReady(data: Data, action: Action) {
  if (action.retiredAt) return false;
  const step = actionStep(data, action);
  return !step || step.dependsOn.every(id => data.actions.some(a =>
    a.goalId === action.goalId && a.stepId === id && a.outcome === "Done"));
}

export function planProgress(data: Data, goal: Goal, now = new Date()) {
  const plan = goal.plans.at(-1)?.adaptive;
  if (!plan) return [];
  const today = dateInZone(data.timeZone, now);
  return plan.steps.map(step => {
    const actions = data.actions.filter(a => a.goalId === goal.id && a.stepId === step.id && !a.retiredAt &&
      (step.type === "task" || (a.date >= plan.window.start && a.date <= plan.window.end)));
    const known = actions.filter(a => a.outcome);
    const measured = known.filter(a => a.amount !== undefined && actionStep(data, a)?.measure?.id === step.measure?.id);
    return {
      step, actions, planned: step.type === "task" ? 1 : stepDates(plan, step).length,
      done: known.filter(a => a.outcome === "Done").length,
      partial: known.filter(a => a.outcome === "Partly").length,
      missed: known.filter(a => a.outcome === "Didn’t happen").length,
      unknown: actions.filter(a => !a.outcome && a.date < today).length,
      measured: measured.length, amount: measured.reduce((sum, a) => sum + a.amount!, 0),
    };
  });
}

function weeklyCommitments(data: Data) {
  const loads = new Map<string, number>();
  const counted = new Set<string>();
  const today = dateInZone(data.timeZone);
  const weekStart = addDays(today, -((new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7));
  function add(date: string, minutes: number) {
    if (!date || date < weekStart) return;
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    const week = addDays(date, -((weekday + 6) % 7));
    loads.set(week, (loads.get(week) ?? 0) + minutes);
  }
  function addAction(action: Action, minutes: number) {
    counted.add(action.id);
    const block = data.workBlocks.find(b => b.id === action.id);
    add(block ? dateInZone(data.timeZone, new Date(block.start)) : action.date,
      block ? (Date.parse(block.end) - Date.parse(block.start)) / 60000 : minutes);
  }
  for (const goal of data.goals.filter(g => g.status === "Active" || g.status === "Draft")) {
    const plan = goal.plans.at(-1)?.adaptive;
    for (const step of plan?.steps ?? []) for (const date of stepDates(plan!, step)) {
      const action = stepAction(data, goal.id, step, date);
      if (action) addAction(action, actionStep(data, action)?.durationMinutes ?? step.durationMinutes);
      else add(date, step.durationMinutes);
    }
    for (const action of data.actions.filter(a => a.goalId === goal.id && !a.retiredAt && !counted.has(a.id))) {
      // Revisions preserve booked, started and historical work outside the new outline.
      if (plan && !action.outcome && !action.startedAt && !data.workBlocks.some(b => b.id === action.id)) continue;
      addAction(action, actionStep(data, action)?.durationMinutes ??
        goal.plans.find(p => p.version === action.planVersion)?.durationMinutes ?? data.programs.at(-1)!.sessionMinutes);
    }
  }
  return loads;
}

export function validateAdaptiveWork(data: Data, previous?: Data) {
  for (const goal of data.goals) {
    const plan = goal.plans.at(-1)?.adaptive;
    if (!plan) continue;
    if (plan.window.end < plan.window.start) throw new Error("The planning window must end after it starts.");
    if (new Set(plan.steps.map(s => s.id)).size !== plan.steps.length) throw new Error("Plan steps need unique IDs.");
    const visited = new Set<string>();
    function visit(id: string, path: string[] = []) {
      if (visited.has(id)) return;
      if (path.includes(id)) throw new Error("Plan prerequisites cannot be circular.");
      const step = plan!.steps.find(s => s.id === id);
      if (!step) throw new Error("Every prerequisite must identify a step in this plan.");
      step.dependsOn.forEach(dependency => visit(dependency, [...path, id]));
      visited.add(id);
    }
    for (const step of plan.steps) {
      visit(step.id);
      if (step.milestoneId && !goal.milestones.some(m => m.id === step.milestoneId)) throw new Error("Link work to an existing milestone.");
      if ((step.type === "behavior") !== Boolean(step.recurrence)) throw new Error("Repeating behaviors need recurrence; one-time tasks do not.");
      const completed = step.type === "task" && stepAction(data, goal.id, step, step.scheduledDate)?.outcome === "Done";
      if (!completed && (step.scheduledDate < plan.window.start || step.scheduledDate > plan.window.end ||
        (step.recurrence && step.recurrence.until < step.scheduledDate) || !stepDates(plan, step).length))
        throw new Error("Each step needs an occurrence inside its planning window.");
      if (step.dependsOn.some(id => plan.steps.find(s => s.id === id)?.type === "behavior"))
        throw new Error("A prerequisite must be a verifiable task, not an ongoing behavior.");
    }
    const minutes = plan.steps.reduce((sum, step) => {
      const action = step.type === "task" ? stepAction(data, goal.id, step, step.scheduledDate) : undefined;
      return sum + (action?.outcome === "Done" && action.date < plan.window.start ? 0 : stepDates(plan, step).length * step.durationMinutes);
    }, 0);
    if (minutes > plan.window.capacityMinutes)
      throw new Error(`${goal.title}: ${minutes} minutes of work exceeds the ${plan.window.capacityMinutes}-minute capacity. Reduce the commitment or ask to change capacity.`);
    if (plan.experiment?.comparisonStatus === "reported" && !plan.experiment.comparisonSourceIds.length)
      throw new Error("A reported starting comparison needs source records. Otherwise keep the comparison unknown.");
    if (plan.experiment?.inputStepIds.some(id => !plan.steps.some(step => step.id === id)))
      throw new Error("The learning experiment must reference steps in this plan.");
    if (plan.forecast?.method === "behavior-rate" && !plan.steps.some(s =>
      s.id === plan.forecast?.driverStepId && s.type === "behavior" && s.measure?.target))
      throw new Error("A behavior forecast needs a repeating step with a measured target.");
  }
  if (!data.goals.some(g => g.plans.at(-1)?.adaptive && (g.status === "Active" || g.status === "Draft"))) return;
  const previousLoads = previous ? weeklyCommitments(previous) : new Map<string, number>();
  for (const [week, minutes] of weeklyCommitments(data)) {
    // A capacity reduction or check-in must remain saveable. Reject increases in overloaded weeks.
    if (minutes > data.programs.at(-1)!.weeklyMinutes && minutes > (previousLoads.get(week) ?? 0))
      throw new Error(`Shared weekly capacity is ${data.programs.at(-1)!.weeklyMinutes} minutes; ${minutes} are committed in the week of ${week}. Reprioritize work or ask to change the time budget.`);
  }
}

export function materializePlan(data: Data, goal: Goal, today: string) {
  if (goal.status !== "Active" && goal.status !== "Draft") return;
  const version = goal.plans.at(-1)!;
  const plan = version.adaptive;
  if (!plan) return;
  const planned = new Set<string>();
  for (const step of plan.steps) {
    for (const date of stepDates(plan, step)) {
      const occurrence = `${step.id}:${date}`;
      planned.add(occurrence);
      let existing = stepAction(data, goal.id, step, date);
      if (date < today) continue;
      // Upgrading a goal can reuse its unbooked first action without duplicating work.
      existing ??= data.actions.find(a => a.goalId === goal.id && !a.stepId && !a.outcome &&
        !a.startedAt && !a.retiredAt && a.title === step.title && a.criterion === step.criterion &&
        (!a.date || a.date === date) && !data.workBlocks.some(b => b.id === a.id));
      if (existing && (existing.outcome || existing.startedAt || data.workBlocks.some(b => b.id === existing.id))) continue;
      if (existing?.planVersion === version.version && !existing.retiredAt) continue;
      const fields = {
        title: step.title, criterion: step.criterion, timing: step.cue,
        date,
        planVersion: version.version, stepId: step.id, occurrence,
      };
      if (existing) {
        Object.assign(existing, fields);
        delete existing.retiredAt;
      } else data.actions.push({ id: crypto.randomUUID(), goalId: goal.id, ...fields, history: [] });
    }
  }
  for (const action of data.actions.filter(a => a.goalId === goal.id && !a.outcome && !a.startedAt && (!a.date || a.date >= today))) {
    if (data.workBlocks.some(b => b.id === action.id)) continue;
    if (!action.occurrence || !planned.has(action.occurrence)) action.retiredAt ??= today;
  }
}

export function maintainAdaptivePlans(data: Data, now = new Date()) {
  const today = dateInZone(data.timeZone, now);
  for (const goal of data.goals) {
    materializePlan(data, goal, today);
    const version = goal.plans.at(-1)!;
    if (version.adaptive && goal.assessment?.planVersion !== version.version) goal.assessment = {
      planVersion: version.version, evidenceKey: assessmentEvidence(data, goal), nextAt: version.adaptive.assessment.at,
    };
  }
}
