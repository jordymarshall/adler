import { dateInZone } from "./journey.ts";
import type { PlanningBasis } from "./planning.ts";
import { materializePlan, type AdaptivePlan, type AssessmentState } from "./adaptive-plan.ts";
import type { Forecast } from "./forecast.ts";
import type {
  Checkpoint,
  CoachDecision,
  GoalArea,
  ProgramVersion,
  WorkBlock,
} from "../src/program-types.ts";
import { DEFAULT_METHODS } from "../src/methods.ts";

export type Outcome = "Done" | "Partly" | "Didn’t happen";
export type GoalStatus = "Draft" | "Active" | "Paused" | "Completed" | "Set aside";
export type GoalKind = "project" | "learning" | "practical";
export interface Plan {
  adaptive?: AdaptivePlan;
  basis?: PlanningBasis;
  durationMinutes?: number;
  version: number;
  action: string;
  timing: string;
  criterion: string;
  date: string;
}
export interface Milestone {
  id: string;
  title: string;
  criterion: string;
  done: boolean;
  dueDate?: string;
  completedAt?: string;
}
export interface Goal {
  forecasts?: Forecast[];
  assessment?: AssessmentState;
  id: string;
  title: string;
  kind: GoalKind;
  why: string;
  success: string;
  status: GoalStatus;
  area?: GoalArea;
  organizationVersion?: number;
  tags?: string[];
  priority?: "Focus" | "Maintain" | "Later";
  targetDate?: string;
  deadline?: "firm" | "preferred" | "none";
  startDate?: string;
  target?: number;
  unit?: string;
  measure?: {
    label: string;
    unit: string;
    target: number;
    baseline: number | null;
    aggregation?: "cumulative" | "level" | "period";
    period?: string;
  };
  measurementHistory?: { date: string; label: string; unit: string; results: Goal["results"]; reason: string }[];
  checkpoints?: Checkpoint[];
  outcomeUpdatedAt?: string;
  checkpointHistory?: {
    date: string;
    checkpoints: Checkpoint[];
    targetDate: string;
    reason: string;
  }[];
  milestones: Milestone[];
  plans: Plan[];
  results: { id: string; value: number; date: string; source: string }[];
  trial?: {
    state: "Suggested" | "Trying" | "Set aside" | "Reviewed";
    version: number;
    sourceId: string;
  };
}
export interface Action {
  id: string;
  goalId: string;
  title: string;
  criterion: string;
  timing: string;
  date: string;
  planVersion: number;
  stepId?: string;
  occurrence?: string;
  retiredAt?: string;
  startedAt?: string;
  outcome?: Outcome;
  amount?: number;
  actualMinutes?: number;
  note?: string;
  unplanned?: boolean;
  history: { outcome?: Outcome; amount?: number; actualMinutes?: number; note?: string; at: string }[];
}
export const reactionTypes = [
  "love",
  "like",
  "dislike",
  "laugh",
  "emphasize",
  "question",
] as const;
export type Reaction = (typeof reactionTypes)[number];
export const reactionEmoji: Record<Reaction, string> = {
  love: "♥",
  like: "👍",
  dislike: "👎",
  laugh: "😄",
  emphasize: "‼",
  question: "?",
};
export interface Conversation {
  id: string;
  title: string;
  goalId: string;
  createdAt: string;
}
export interface Message {
  id: string;
  goalId: string;
  role: "user" | "coach";
  text: string;
  decisionId?: string;
  conversationId?: string;
  links?: { goalId: string; tab: "progress" | "plan" }[];
  channel?: "web" | "sms" | "imessage" | "rcs" | "whatsapp" | "mcp" | "job";
  reactions?: Partial<
    Record<"user" | "coach", { type: Reaction | null; at: string }>
  >;
  at?: string;
}
export interface Review {
  periodStart?: string;
  periodEnd?: string;
  step: number;
  note: string;
  decision: string;
  completedAt?: string;
}
export interface Data {
  schema: 1;
  goals: Goal[];
  actions: Action[];
  messages: Message[];
  conversations: Conversation[];
  memories: { id: string; text: string; date: string }[];
  review: Review;
  reviews: Review[];
  timeZone: string;
  automation: {
    enabled: boolean;
    reviewTime: string;
    quietStart: string;
    quietEnd: string;
  };
  reviewDay: string;
  theme: "light" | "dark";
  goalDraft: Record<string, string>;
  programs: ProgramVersion[];
  workBlocks: WorkBlock[];
  decisions: CoachDecision[];
  calendarSnapshot?: {
    busy: { start: string; end: string }[];
    checkedAt: string;
    provider: string;
    start: string;
    end: string;
  };
}
export function localDate(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function formatDate(date: string, options?: Intl.DateTimeFormatOptions) {
  return new Date(
    date.includes("T") ? date : `${date}T12:00:00`,
  ).toLocaleDateString("en-US", options ?? { month: "short", day: "numeric" });
}
export const currentPlan = (goal: Goal) => goal.plans[goal.plans.length - 1];
export function resultLabel(goal: Goal) {
  if (goal.measure)
    return goal.results.length
      ? `${goal.results.at(-1)!.value} ${goal.measure.unit} · ${goal.measure.label}`
      : "No result recorded yet";
  if (goal.kind === "learning")
    return goal.results.length
      ? `${goal.results.at(-1)!.value} of 10 problems solved correctly`
      : "No assessment recorded yet";
  const done = goal.milestones.filter((m) => m.done).length;
  return goal.kind === "project"
    ? `${done} of ${goal.milestones.length} ${goal.id === "portfolio" ? "case studies published" : "milestones complete"}`
    : `${done} of ${goal.milestones.length} ${goal.milestones[0]?.id.startsWith("document-") ? "documents retrieved in under a minute" : "steps verified"}`;
}
export function initialData(): Data {
  return {
    schema: 1,
    goals: [],
    actions: [],
    messages: [],
    conversations: [],
    memories: [],
    review: { step: 0, note: "", decision: "" },
    reviews: [],
    reviewDay: "Sunday",
    theme: "light",
    goalDraft: {},
    timeZone: "UTC",
    workBlocks: [],
    decisions: [],
    programs: [
      {
        version: 1,
        date: localDate(),
        focusGoalId: "",
        sprintStart: localDate(),
        sprintEnd: localDate(7),
        sprintResult: "Choose your first goal and define this week’s result.",
        weeklyMinutes: 120,
        workStart: "09:00",
        workEnd: "17:00",
        workDays: [1, 2, 3, 4, 5],
        sessionMinutes: 25,
        reviewDay: "Sunday",
        enabledMethods: [...DEFAULT_METHODS],
        approach:
          "Define the result, plan a realistic next action, and review what happened.",
        reason: "Initial program. Edit it to fit your goal and schedule.",
      },
    ],
    automation: {
      enabled: false,
      reviewTime: "17:00",
      quietStart: "21:00",
      quietEnd: "08:00",
    },
  };
}
export function enrichData(data: Data): Data {
  delete (data as unknown as Record<string, unknown>).modelConsent;
  delete (data as unknown as Record<string, unknown>).avatar;
  data.conversations ??= [];
  for (const message of data.messages) {
    if (message.conversationId) continue;
    const goalId = data.goals.some((g) => g.id === message.goalId)
      ? message.goalId
      : "general";
    const id = `legacy-${goalId}`;
    if (!data.conversations.some((c) => c.id === id))
      data.conversations.push({
        id,
        goalId,
        title:
          goalId === "general"
            ? "General conversation"
            : data.goals.find((g) => g.id === goalId)!.title,
        createdAt: message.at ?? new Date(0).toISOString(),
      });
    message.conversationId = id;
  }
  data.reviews ??= [];
  data.timeZone ??= "UTC";
  data.automation ??= {
    enabled: false,
    reviewTime: "17:00",
    quietStart: "21:00",
    quietEnd: "08:00",
  };
  return data;
}
export function currentProgram(data: Data) {
  return data.programs[data.programs.length - 1];
}
export function startGoal(data: Data, goalId: string) {
  const goal = data.goals.find((g) => g.id === goalId);
  if (!goal || goal.status !== "Draft") return;
  goal.status = "Active";
  goal.startDate = dateInZone(data.timeZone);
  const program = currentProgram(data);
  if (!data.goals.some((g) => g.id === program.focusGoalId && g.status === "Active"))
    reviseProgram(data, program.version, { focusGoalId: goalId, reason: "Started the goal’s plan." });
}
export function reviseProgram(
  data: Data,
  expectedVersion: number,
  changes: Partial<Omit<ProgramVersion, "version" | "date">>,
) {
  const current = currentProgram(data);
  if (current.version !== expectedVersion)
    throw new Error(
      "This program changed in another view. Reload the form to use the latest version.",
    );
  const next = {
    ...current,
    ...changes,
    version: current.version + 1,
    date: localDate(),
  };
  data.programs.push(next);
  data.reviewDay = next.reviewDay;
}
export function recordAction(
  data: Data,
  id: string,
  outcome?: Outcome,
  note?: string,
  amount?: number,
  actualMinutes?: number,
) {
  const action = data.actions.find((a) => a.id === id)!;
  if (!action.date && outcome) {
    action.date = dateInZone(data.timeZone);
    action.unplanned = true;
  }
  action.history.push({
    outcome: action.outcome,
    amount: action.amount,
    actualMinutes: action.actualMinutes,
    note: action.note,
    at: new Date().toISOString(),
  });
  action.outcome = outcome;
  action.amount = outcome ? amount : undefined;
  action.actualMinutes = outcome ? actualMinutes : undefined;
  const block = data.workBlocks.find((b) => b.id === id);
  if (block) block.status = outcome ?? "Scheduled";
  if (note !== undefined) action.note = note;
  if (!outcome) action.note = undefined;
  const goal = data.goals.find((g) => g.id === action.goalId)!;
  if (goal.trial?.sourceId === id) goal.trial.state = "Set aside";
}
export function applyPlan(
  data: Data,
  goalId: string,
  expectedVersion: number,
  changes: Pick<Plan, "action" | "timing" | "criterion" | "basis" | "durationMinutes" | "adaptive">,
) {
  const goal = data.goals.find((g) => g.id === goalId)!;
  if (currentPlan(goal).version !== expectedVersion)
    throw new Error(
      "This plan changed in another view. Close this form and review the latest plan.",
    );
  if (goal.status !== "Active" && goal.status !== "Draft")
    throw new Error(
      "This goal is no longer active. Resume it before changing the plan.",
    );
  const previous = currentPlan(goal);
  const plan: Plan = {
    ...changes,
    adaptive: changes.adaptive ?? previous.adaptive,
    durationMinutes: changes.durationMinutes ?? previous.durationMinutes,
    basis: changes.basis ?? (changes.action === previous.action && changes.criterion === previous.criterion ? previous.basis : undefined),
    version: expectedVersion + 1,
    date: dateInZone(data.timeZone),
  };
  if (plan.adaptive) {
    plan.adaptive = structuredClone(plan.adaptive);
    if (!changes.adaptive) Object.assign(plan.adaptive.steps[0], { title: changes.action, criterion: changes.criterion, cue: changes.timing });
    const first = plan.adaptive.steps[0];
    Object.assign(plan, { action: first.title, criterion: first.criterion, timing: first.cue, durationMinutes: first.durationMinutes });
  }
  goal.plans.push(plan);
  if (goal.trial?.state === "Suggested") goal.trial.state = "Set aside";
  if (plan.adaptive) {
    materializePlan(data, goal, dateInZone(data.timeZone));
    return;
  }
  const future = data.actions.filter(
    (a) => a.goalId === goalId && (!a.date || a.date > dateInZone(data.timeZone)) && !a.outcome && !data.workBlocks.some((b) => b.id === a.id),
  );
  if (future.length)
    future.forEach((a) => {
      a.title = plan.action;
      a.criterion = plan.criterion;
      a.timing = plan.timing;
      a.planVersion = plan.version;
    });
  else
    data.actions.push({
      id: crypto.randomUUID(),
      goalId,
      title: plan.action,
      criterion: plan.criterion,
      timing: plan.timing,
      date: "",
      planVersion: plan.version,
      history: [],
    });
}
