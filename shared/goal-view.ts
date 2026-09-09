import type { Action, Data, Goal, Plan } from "./workspace.ts";
import { stepDates } from "./adaptive-plan.ts";
import { addDays } from "./journey.ts";
import { behavioralReasoningSchema } from "./behavioral-reasoning.ts";
import type { Proposal } from "../server/service.ts";

// A proposal decision names the plan before acceptance. Use its saved before-state
// to bind the applied change, and never infer acceptance from version ordering.
export function planExperiment(data: Data, goal: Goal, plan: Plan, stepId: string | undefined, proposals: Proposal[]) {
  if (!plan.adaptive?.reasoning) return undefined;
  const rationale = JSON.stringify(behavioralReasoningSchema.parse(plan.adaptive.reasoning));
  return (data.learning ?? []).flatMap(record => record.versions.map(version => ({ record, version }))).filter(({ record, version }) => {
    if (!(version.goalIds ?? record.goalIds).includes(goal.id) ||
      (version.test.inputStepIds?.length && !version.test.inputStepIds.includes(stepId ?? "")) ||
      JSON.stringify(behavioralReasoningSchema.parse(version.reasoning)) !== rationale) return false;
    if (version.proposalId) {
      const proposal = proposals.find(proposal => proposal.id === version.proposalId && proposal.status === "applied");
      return proposal?.changes.some((change, index) =>
        change.entity === "goal" && change.operation === "create" && change.id === goal.id && plan.version === 1 ||
        change.entity === "plan" && change.parentId === goal.id && Number(proposal.before?.[index]?.version) + 1 === plan.version);
    }
    const agreed = record.activeVersion === version.version || record.reviews.some(review => review.version === version.version);
    const decision = data.decisions.find(decision => decision.id === version.decisionId);
    return agreed && decision?.goalId === goal.id && decision.planVersion === plan.version;
  }).at(-1);
}

export function inputMeasure(plan: Plan, stepId?: string) {
  const step = plan.adaptive?.steps.find(step => step.id === stepId);
  const hours = !!plan.adaptive?.projection && plan.adaptive.projection.driverStepId === stepId && plan.adaptive.projection.inputMetric === "hours";
  const measure = step?.measure ?? (!stepId ? plan.basis?.actionMeasure : undefined);
  return hours
    ? { metric: "hours" as const, label: "Focused work", unit: "hours", target: (step?.durationMinutes ?? 0) / 60 }
    : measure
      ? { metric: "amount" as const, label: measure.label, unit: measure.unit, target: measure.target }
      : { metric: "completion" as const, label: "Actions completed", unit: "actions", target: 1 };
}

export function reportedInput(action: Action, metric: ReturnType<typeof inputMeasure>["metric"]) {
  if (!action.outcome) return null;
  if (action.outcome === "Didn’t happen") return 0;
  if (metric === "hours") return action.actualMinutes === undefined ? null : action.actualMinutes / 60;
  if (metric === "amount") return action.amount ?? null;
  return action.outcome === "Done" ? 1 : null;
}

// Quantities remain tied to the action's saved measurement, including after edits.
export function actionSeries(data: Data, goal: Goal, plan: Plan, stepId: string | undefined, start: string, end: string, today: string) {
  const measure = inputMeasure(plan, stepId);
  const step = plan.adaptive?.steps.find(step => step.id === stepId);
  const historical = plan.version !== goal.plans.at(-1)!.version;
  const records = data.actions.filter(action => action.goalId === goal.id && action.stepId === stepId && action.planVersion <= plan.version && (historical || !action.retiredAt || action.outcome));
  const comparable = (version: Plan) => {
    const prior = version.adaptive?.steps.find(item => item.id === stepId);
    if (measure.metric === "completion") return version.version === plan.version;
    if (measure.metric === "hours") return prior?.title === step?.title && prior?.criterion === step?.criterion;
    return step ? prior?.measure?.id === step.measure?.id && prior?.measure?.unit === step.measure?.unit
      : version.version === plan.version;
  };
  const dates = new Map(goal.plans.filter(comparable).flatMap(version => {
    const definition = version.adaptive?.steps.find(item => item.id === stepId);
    return definition && version.adaptive ? [[version.version, new Set(stepDates(version.adaptive, definition))] as const] : [];
  }));
  const points = [];
  for (let date = start; date <= end; date = addDays(date, 1)) {
    const entries = records.filter(action => action.date === date);
    const effective = goal.plans.filter(version => version.version <= plan.version && version.date <= date).at(-1);
    const applicable = effective?.adaptive && date >= effective.adaptive.window.start && date <= effective.adaptive.window.end && comparable(effective) ? effective : undefined;
    const scheduled = Boolean(applicable && dates.get(applicable.version)?.has(date));
    const eligible = entries.filter(action => {
      const version = goal.plans.find(version => version.version === action.planVersion)!;
      return comparable(version);
    });
    const amount = date > today || !eligible.length || eligible.length !== entries.length || eligible.some(action => reportedInput(action, measure.metric) === null)
      ? null : eligible.reduce((sum, action) => sum + reportedInput(action, measure.metric)!, 0);
    const targets = eligible.map(action => inputMeasure(goal.plans.find(version => version.version === action.planVersion)!, stepId).target);
    const retired = entries.length > 0 && entries.every(action => action.retiredAt && !action.outcome);
    const planned = retired ? null : entries.length ? targets.length === entries.length && targets.every(target => target !== null) ? targets.reduce<number>((sum, target) => sum + target!, 0) : null
      : scheduled ? inputMeasure(applicable!, stepId).target : null;
    points.push({ date, actions: entries, amount, planned, retired, future: date > today, scheduled: !retired && (entries.length > 0 || scheduled),
      off: !entries.length && !scheduled && !!applicable });
  }
  const elapsed = points.filter(point => point.date < today && point.scheduled);
  return { measure, points, reported: elapsed.reduce((sum, point) => sum + (point.amount ?? 0), 0),
    planned: elapsed.reduce((sum, point) => sum + (point.planned ?? 0), 0),
    unknown: elapsed.filter(point => point.amount === null).length };
}

export function goalStreak(data: Data, goal: Goal, today: string) {
  const actions = data.actions.filter(action => action.goalId === goal.id && action.date && (!action.retiredAt || action.outcome));
  const start = [...goal.plans.flatMap(plan => plan.adaptive ? [plan.adaptive.window.start] : []), ...actions.map(action => action.date)].sort()[0];
  const days: { date: string; status: "on" | "off" | "short" | "unknown"; streak: number }[] = [];
  if (!start || !["Active", "Draft"].includes(goal.status)) return { count: 0, days };
  const scheduled = new Map(goal.plans.map(plan => [plan.version, plan.adaptive?.steps.map(step => ({ step, dates: new Set(stepDates(plan.adaptive!, step)) })) ?? []]));
  let count = 0;
  // A bounded display history, not a habit-strength score or difficulty rule.
  for (let date = [start, addDays(today, -3659)].sort().at(-1)!; date <= today; date = addDays(date, 1)) {
    const effective = goal.plans.filter(plan => plan.date <= date).at(-1);
    const plan = effective?.adaptive && date >= effective.adaptive.window.start && date <= effective.adaptive.window.end ? effective : undefined;
    const entries = actions.filter(action => action.date === date);
    const expected = plan ? scheduled.get(plan.version)!.filter(item => item.dates.has(date)).map(item => item.step) : [];
    const missing = expected.some(step => !entries.some(action => action.stepId === step.id));
    const status = entries.length ? entries.some(action => action.outcome === "Didn’t happen" || action.outcome === "Partly") ? "short"
      : missing || entries.some(action => !action.outcome || (() => {
        const saved = goal.plans.find(plan => plan.version === action.planVersion)!;
        const measure = inputMeasure(saved, action.stepId);
        return measure.target !== null && reportedInput(action, measure.metric) === null;
      })()) ? "unknown"
        : entries.every(action => {
          const measure = inputMeasure(goal.plans.find(plan => plan.version === action.planVersion)!, action.stepId);
          return measure.target === null || reportedInput(action, measure.metric)! >= measure.target;
        }) ? "on" : "short"
      : expected.length || !plan ? "unknown" : "off";
    if (status === "on") count++;
    else if (status === "off" && count) count++;
    else if (!(date === today && status === "unknown")) count = 0;
    days.push({ date, status, streak: count });
  }
  return { count, days };
}
