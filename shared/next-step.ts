import { dateInZone, reviewSchedule } from "./journey.ts";
import { actionReady, actionStep } from "./adaptive-plan.ts";
import {
  currentPlan,
  currentProgram,
  type Action,
  type Data,
  type Goal,
} from "./workspace.ts";

export type StepPhase =
  | "draft"
  | "schedule"
  | "ready"
  | "working"
  | "checkin"
  | "waiting"
  | "next"
  | "inactive";

export function goalStep(
  data: Data,
  goal: Goal,
  now = new Date(),
  actionId?: string,
) {
  const today = dateInZone(data.timeZone, now);
  function phase(action: Action): StepPhase {
    const block = data.workBlocks.find((b) => b.id === action.id);
    const plan =
      goal.plans.find((p) => p.version === action.planVersion) ??
      currentPlan(goal);
    if (action.startedAt) {
      const end =
        Date.parse(action.startedAt) +
        (actionStep(data, action)?.durationMinutes ?? plan.durationMinutes ?? currentProgram(data).sessionMinutes) * 60000;
      return now.getTime() >= end ? "checkin" : "working";
    }
    if (block) {
      if (Date.parse(block.end) <= now.getTime()) return "checkin";
      return Date.parse(block.start) <= now.getTime() ? "ready" : "waiting";
    }
    if (action.date && action.date < today) return "checkin";
    if (action.date === today) return "ready";
    return "schedule";
  }
  const rank: Record<StepPhase, number> = {
    working: 0,
    ready: 1,
    checkin: 2,
    schedule: 3,
    waiting: 4,
    draft: 5,
    next: 6,
    inactive: 7,
  };
  const actions = data.actions
    .filter((a) => a.goalId === goal.id && !a.outcome && actionReady(data, a))
    .sort((a, b) => {
      const order = rank[phase(a)] - rank[phase(b)];
      if (order) return order;
      if (phase(a) === "checkin") return b.date.localeCompare(a.date);
      const aTime =
        data.workBlocks.find((block) => block.id === a.id)?.start ?? a.date;
      const bTime =
        data.workBlocks.find((block) => block.id === b.id)?.start ?? b.date;
      return aTime.localeCompare(bTime);
    });
  const action = actions.find((a) => a.id === actionId) ?? actions[0];
  return {
    goal,
    action,
    block: data.workBlocks.find((b) => b.id === action?.id),
    phase:
      goal.status === "Draft"
        ? ("draft" as const)
        : goal.status !== "Active"
          ? ("inactive" as const)
          : action
            ? phase(action)
            : ("next" as const),
  };
}

export function todayStep(data: Data, now = new Date()) {
  const steps = data.goals
    .filter((g) => g.status === "Active")
    .map((goal) => goalStep(data, goal, now));
  const focus = currentProgram(data).focusGoalId;
  const order: Record<StepPhase, number> = {
    working: 0,
    ready: 1,
    checkin: 2,
    schedule: 4,
    next: 5,
    waiting: 6,
    draft: 7,
    inactive: 8,
  };
  steps.sort(
    (a, b) =>
      order[a.phase] - order[b.phase] ||
      Number(b.goal.id === focus) - Number(a.goal.id === focus),
  );
  const next = steps[0];
  const review = Boolean(
    steps.some(step => !currentPlan(step.goal).adaptive) &&
    reviewSchedule(data, now).due &&
    (!next || order[next.phase] > 2),
  );
  const draft = data.goals.find((g) => g.status === "Draft");
  return {
    review,
    step: next ?? (draft ? goalStep(data, draft, now) : undefined),
  };
}

export function beginAction(data: Data, id: string, now = new Date()) {
  const action = data.actions.find((a) => a.id === id);
  const goal = data.goals.find((g) => g.id === action?.goalId);
  if (
    !action ||
    !goal ||
    goal.status !== "Active" ||
    action.outcome ||
    action.startedAt
  )
    return;
  const step = goalStep(data, goal, now, id);
  if (step.phase !== "ready" && step.phase !== "schedule") return;
  action.startedAt = now.toISOString();
  action.date = dateInZone(data.timeZone, now);
  action.timing = "Started now";
}
