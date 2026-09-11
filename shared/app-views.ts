// Server-computed view payloads for the native app.
//
// Every value here is derived from the shared coaching logic in shared/*.ts, so the
// web, iOS, SMS and MCP surfaces describe the same records with the same words. These
// builders are pure: they read saved state and re-use existing derivations. They add
// no coaching inference, no research and no state. Derived labels (for example
// "Live experiment" or "Below checkpoint") come from the same helpers the web renders.
import {
  currentLearningVersion,
  learningStanding,
  learningStatus,
  planNeedsReview,
  type LearningRecord,
} from "./learning.ts";
import {
  actionReady,
  actionStep,
  scheduledCommitments,
  stepDates,
  type AdaptivePlan,
  type PlanStep,
} from "./adaptive-plan.ts";
import {
  actionSeries,
  goalStreak,
  inputMeasure,
  planActionRecords,
  planExperiment,
  reportedInput,
} from "./goal-view.ts";
import { goalProjection } from "./goal-projection.ts";
import {
  executionLabels,
  executionStatus,
  executionSummary,
  weekStart,
  type ExecutionStatus,
} from "./goal-execution.ts";
import { goalPlanProgress, todayActivity, todayLearning } from "./today.ts";
import { goalStep, todayStep, type StepPhase } from "./next-step.ts";
import { addDays, dateInZone, reviewBlock, reviewSchedule } from "./journey.ts";
import { calendarWeek, tentativeSchedule } from "./tentative-schedule.ts";
import { resolveRecord } from "./record-links.ts";
import { RESEARCH_CLAIMS, type ResearchClaim } from "./research-claims.ts";
import {
  currentPlan,
  currentProgram,
  formatDate,
  resultLabel,
  type Action,
  type Data,
  type Goal,
  type GoalKind,
  type GoalStatus,
  type Outcome,
  type Plan,
} from "./workspace.ts";
import type { BehavioralReasoning, Recommendation } from "./behavioral-reasoning.ts";
import type { PlanningBasis, ResearchSource } from "./planning.ts";
import type { ProjectionModel } from "./projection-model.ts";
import type { BusyInterval, CoachDecision, ProgramVersion } from "../src/program-types.ts";
import { goalColor } from "../src/goal-colors.ts";
import { METHODS } from "../src/methods.ts";
import type { Proposal } from "../server/service.ts";
import type { Change } from "../server/commands.ts";

/* ------------------------------------------------------------------ shared */

export interface ViewBase {
  revision: number;
  today: string;
}
export interface ViewOptions {
  revision: number;
  now?: Date;
}
export interface GoalRef {
  id: string;
  title: string;
  status: GoalStatus;
  color: string;
}
export interface InputMeasureView {
  metric: "amount" | "hours" | "completion";
  label: string;
  unit: string;
  target: number | null;
}
export interface WorkBlockView {
  id: string;
  goalId: string;
  action: string;
  start: string;
  end: string;
  provider: "local" | "google" | "apple";
  status: "Scheduled" | "Done" | "Partly" | "Didn’t happen";
  eventId: string | null;
  checkInId: string | null;
}
export interface ActionReportView {
  outcome: Outcome | null;
  amount: number | null;
  actualMinutes: number | null;
  note: string | null;
  at: string;
}
export interface ActionView {
  id: string;
  goalId: string;
  goalTitle: string;
  title: string;
  criterion: string;
  timing: string;
  date: string | null;
  planVersion: number;
  stepId: string | null;
  milestoneId: string | null;
  occurrence: string | null;
  outcome: Outcome | null;
  amount: number | null;
  actualMinutes: number | null;
  note: string | null;
  startedAt: string | null;
  retiredAt: string | null;
  unplanned: boolean;
  ready: boolean;
  durationMinutes: number;
  measure: InputMeasureView;
  reported: number | null;
  execution: ExecutionStatus;
  executionLabel: string;
  block: WorkBlockView | null;
  history: ActionReportView[];
}

// Evidence resolved for the app: the same records Insights resolves on the web, with an
// adler:// destination instead of a web route, and the same wording when a record is gone.
export interface SourceView {
  id: string;
  kind: string;
  label: string;
  text: string;
  deepLink: string | null;
}
const sourceKindLabels: Record<string, string> = {
  report: "Your check-in",
  context: "Saved context",
  outcome: "Reported result",
  action: "Action report",
  measurement: "Action report",
};

const ref = (goal: Goal): GoalRef => ({
  id: goal.id,
  title: goal.title,
  status: goal.status,
  color: goalColor(goal.id),
});
const optional = <T>(value: T | undefined): T | null => value ?? null;
const goalTitle = (data: Data, goalId: string) =>
  data.goals.find((goal) => goal.id === goalId)?.title ?? "";
const planOf = (goal: Goal, version: number) =>
  goal.plans.find((plan) => plan.version === version) ?? currentPlan(goal);
const blockView = (data: Data, id: string): WorkBlockView | null => {
  const block = data.workBlocks.find((item) => item.id === id);
  return block
    ? {
        id: block.id,
        goalId: block.goalId,
        action: block.action,
        start: block.start,
        end: block.end,
        provider: block.provider,
        status: block.status,
        eventId: optional(block.eventId),
        checkInId: optional(block.checkInId),
      }
    : null;
};
// The app's own destinations for a saved record. resolveRecord decides whether the record
// still exists and which goal owns it; only the destination differs from the web.
export function recordDeepLink(data: Data, id: string): string | null {
  const target = resolveRecord(data, id);
  if (!target) return null;
  const key = encodeURIComponent(id);
  if (data.learning?.some((record) => record.id === id)) return `adler://insights/${key}`;
  if (data.decisions.some((record) => record.id === id)) return `adler://insights?decision=${key}`;
  if (data.memories.some((memory) => memory.id === id)) return `adler://insights?memory=${key}`;
  const message = data.messages.find((item) => item.id === id);
  if (message)
    return message.conversationId
      ? `adler://coach/${encodeURIComponent(message.conversationId)}?message=${key}`
      : `adler://coach?goal=${encodeURIComponent(message.goalId)}`;
  if (data.workBlocks.some((block) => block.id === id))
    return `adler://calendar?goal=${encodeURIComponent(target.goalId ?? "")}`;
  if (data.programs.some((program) => `program-v${program.version}` === id))
    return "adler://settings/program";
  if (!target.goalId) return null;
  const goal = encodeURIComponent(target.goalId);
  return target.goalId === id ? `adler://goals/${goal}` : `adler://goals/${goal}?record=${key}`;
}
export function sourceView(data: Data, id: string, kind?: string): SourceView {
  const label = (text: string, reportedAt?: string | null) =>
    reportedAt ? `${text} · ${formatDate(reportedAt)}` : text;
  const memory = data.memories.find((item) => item.id === id);
  if (memory)
    return {
      id,
      kind: kind ?? "context",
      label: label(sourceKindLabels[kind ?? "context"] ?? "Saved context", memory.date),
      text: memory.text,
      deepLink: recordDeepLink(data, id),
    };
  const message = data.messages.find((item) => item.id === id);
  if (message)
    return {
      id,
      kind: kind ?? "report",
      label: label(
        kind
          ? (sourceKindLabels[kind] ?? "Your check-in")
          : message.role === "user"
            ? "You said"
            : "Adler replied",
        message.at,
      ),
      text: message.text,
      deepLink: recordDeepLink(data, id),
    };
  const action = data.actions.find((item) => item.id === id);
  if (action)
    return {
      id,
      kind: kind ?? "action",
      label: label(kind ? (sourceKindLabels[kind] ?? "Action report") : "Check-in", action.date || null),
      text: `${action.title}: ${action.outcome ?? "No outcome yet"}.${action.note ? ` ${action.note}` : ""}`,
      deepLink: recordDeepLink(data, id),
    };
  const block = data.workBlocks.find((item) => item.id === id);
  if (block)
    return {
      id,
      kind: kind ?? "action",
      label: "Calendar block",
      text: `${block.action} · ${block.start}`,
      deepLink: recordDeepLink(data, id),
    };
  for (const goal of data.goals) {
    const result = goal.results.find((item) => item.id === id);
    if (result)
      return {
        id,
        kind: kind ?? "outcome",
        label: label(kind ? (sourceKindLabels[kind] ?? "Reported result") : "Result", result.date),
        text: `${result.value} ${goal.measure?.unit ?? goal.unit ?? "milestones verified"}. ${result.source}`,
        deepLink: recordDeepLink(data, id),
      };
    const checkpoint = goal.checkpoints?.find((item) => item.id === id);
    if (checkpoint)
      return {
        id,
        kind: kind ?? "outcome",
        label: "Dated checkpoint",
        text: `${checkpoint.value} due ${formatDate(checkpoint.date)}: ${checkpoint.label}`,
        deepLink: recordDeepLink(data, id),
      };
    const milestone = goal.milestones.find((item) => item.id === id);
    if (milestone)
      return {
        id,
        kind: kind ?? "outcome",
        label: "Milestone",
        text: `${milestone.title} · ${milestone.criterion}`,
        deepLink: recordDeepLink(data, id),
      };
    if (goal.id === id)
      return {
        id,
        kind: kind ?? "context",
        label: "Goal definition",
        text: goal.success,
        deepLink: recordDeepLink(data, id),
      };
  }
  const program = data.programs.find((item) => `program-v${item.version}` === id);
  if (program)
    return {
      id,
      kind: kind ?? "context",
      label: `Program v${program.version}`,
      text: `${program.sprintResult} ${program.weeklyMinutes} minutes per week. ${program.approach}`,
      deepLink: recordDeepLink(data, id),
    };
  return {
    id,
    kind: kind ?? "report",
    label: "Source removed",
    text: "The original record has been deleted. Review this insight before using it again.",
    deepLink: null,
  };
}
// A malformed or oversized saved recurrence must not break a read-only screen.
function occurrenceDates(plan: AdaptivePlan, step: PlanStep) {
  try {
    return stepDates(plan, step);
  } catch {
    return [];
  }
}
function actionDuration(data: Data, action: Action) {
  const goal = data.goals.find((item) => item.id === action.goalId);
  return (
    actionStep(data, action)?.durationMinutes ??
    goal?.plans.find((plan) => plan.version === action.planVersion)?.durationMinutes ??
    currentProgram(data).sessionMinutes
  );
}
export function actionView(data: Data, action: Action, today: string): ActionView {
  const goal = data.goals.find((item) => item.id === action.goalId);
  const measure = goal
    ? inputMeasure(planOf(goal, action.planVersion), action.stepId)
    : { metric: "completion" as const, label: "Actions completed", unit: "actions", target: 1 };
  const status = executionStatus(action, today);
  return {
    id: action.id,
    goalId: action.goalId,
    goalTitle: goal?.title ?? "",
    title: action.title,
    criterion: action.criterion,
    timing: action.timing,
    date: action.date || null,
    planVersion: action.planVersion,
    stepId: optional(action.stepId),
    milestoneId: optional(actionStep(data, action)?.milestoneId),
    occurrence: optional(action.occurrence),
    outcome: optional(action.outcome),
    amount: optional(action.amount),
    actualMinutes: optional(action.actualMinutes),
    note: optional(action.note),
    startedAt: optional(action.startedAt),
    retiredAt: optional(action.retiredAt),
    unplanned: Boolean(action.unplanned),
    ready: actionReady(data, action),
    durationMinutes: actionDuration(data, action),
    measure,
    reported: reportedInput(action, measure.metric),
    execution: status,
    executionLabel: executionLabels[status],
    block: blockView(data, action.id),
    history: action.history.map((entry) => ({
      outcome: optional(entry.outcome),
      amount: optional(entry.amount),
      actualMinutes: optional(entry.actualMinutes),
      note: optional(entry.note),
      at: entry.at,
    })),
  };
}

/* ------------------------------------------------------------ plan records */

export interface PlanStepView {
  id: string;
  type: "task" | "behavior";
  title: string;
  criterion: string;
  reason: string;
  durationMinutes: number;
  cue: string;
  scheduledDate: string;
  recurrence: { everyDays: number; weekdays: number[] | null; until: string } | null;
  dependsOn: string[];
  milestoneId: string | null;
  measure: { id: string; label: string; unit: string; target: number | null } | null;
  fallback: string | null;
  contextIds: string[];
  dates: string[];
}
export interface PlanWindowView {
  start: string;
  end: string;
  label: string;
  rationale: string;
  capacityMinutes: number;
  capacityStatus: "confirmed" | "provisional";
}
export interface PlanAssessmentView {
  at: string;
  question: string;
  adaptation: string;
  feedbackDelayDays: number;
  triggers: string[];
}
export interface PlanExperimentView {
  hypothesis: string;
  inputStepIds: string[];
  outcomeSignal: string;
  comparison: string;
  comparisonStatus: "unknown" | "reported";
  comparisonSourceIds: string[];
  decisionRule: string;
  alternativeExplanations: string[];
}
export interface PlanView {
  version: number;
  date: string;
  current: boolean;
  action: string;
  criterion: string;
  timing: string;
  durationMinutes: number | null;
  approach: string | null;
  window: PlanWindowView | null;
  assessment: PlanAssessmentView | null;
  experiment: PlanExperimentView | null;
  steps: PlanStepView[];
  projection: ProjectionModel | null;
  projectionUnavailableReason: string | null;
  hasBasis: boolean;
  hasReasoning: boolean;
}

function planStepView(plan: AdaptivePlan, step: PlanStep): PlanStepView {
  return {
    id: step.id,
    type: step.type,
    title: step.title,
    criterion: step.criterion,
    reason: step.reason,
    durationMinutes: step.durationMinutes,
    cue: step.cue,
    scheduledDate: step.scheduledDate,
    recurrence: step.recurrence
      ? {
          everyDays: step.recurrence.everyDays,
          weekdays: step.recurrence.weekdays ?? null,
          until: step.recurrence.until,
        }
      : null,
    dependsOn: step.dependsOn,
    milestoneId: optional(step.milestoneId),
    measure: step.measure ?? null,
    fallback: optional(step.fallback),
    contextIds: step.contextIds ?? [],
    dates: occurrenceDates(plan, step),
  };
}
export function planView(goal: Goal, plan: Plan): PlanView {
  const adaptive = plan.adaptive;
  return {
    version: plan.version,
    date: plan.date,
    current: plan.version === currentPlan(goal).version,
    action: plan.action,
    criterion: plan.criterion,
    timing: plan.timing,
    durationMinutes: optional(plan.durationMinutes),
    approach: optional(adaptive?.approach),
    window: adaptive ? { ...adaptive.window } : null,
    assessment: adaptive ? { ...adaptive.assessment, triggers: [...adaptive.assessment.triggers] } : null,
    experiment: adaptive?.experiment ? { ...adaptive.experiment } : null,
    steps: adaptive ? adaptive.steps.map((step) => planStepView(adaptive, step)) : [],
    projection: adaptive?.projection ?? null,
    projectionUnavailableReason: optional(adaptive?.projectionUnavailableReason),
    hasBasis: Boolean(plan.basis),
    hasReasoning: Boolean(adaptive?.reasoning),
  };
}

/* --------------------------------------------------------------- rationale */

export interface ClaimBindingView {
  claimId: string;
  version: string;
  relation: "supports" | "defines" | "motivates" | "limits" | "contradicts";
  application: string;
  claim: ResearchClaim | null;
}
export interface RecommendationView {
  action: string;
  observation: string;
  interpretation: string;
  expectedEffect: string;
  goalIds: string[];
  sourceIds: string[];
  reasoning: BehavioralReasoning;
  grounding: ClaimBindingView[];
  sources: ResearchSource[];
}
export interface RationaleView {
  planVersion: number;
  basis: PlanningBasis | null;
  reasoning: BehavioralReasoning | null;
  grounding: ClaimBindingView[];
  sources: ResearchSource[];
  recommendations: RecommendationView[];
  decisionId: string | null;
  windowRationale: string | null;
  assessmentQuestion: string | null;
  note: string | null;
}

function bindings(
  reasoning: BehavioralReasoning | undefined,
  claims: ResearchClaim[] | undefined,
): ClaimBindingView[] {
  const catalog = claims ?? RESEARCH_CLAIMS;
  return (reasoning?.grounding ?? []).map((binding) => ({
    claimId: binding.claimId,
    version: binding.version,
    relation: binding.relation,
    application: binding.application,
    claim:
      catalog.find((claim) => claim.id === binding.claimId && claim.version === binding.version) ??
      null,
  }));
}
function usedSources(reasoning: BehavioralReasoning | undefined, sources: ResearchSource[] = []) {
  return sources.filter((source) => reasoning?.researchSourceIds.includes(source.id));
}
export function recommendationView(
  recommendation: Recommendation,
  decision?: CoachDecision,
): RecommendationView {
  return {
    action: recommendation.action,
    observation: recommendation.observation,
    interpretation: recommendation.interpretation,
    expectedEffect: recommendation.expectedEffect,
    goalIds: recommendation.goalIds,
    sourceIds: recommendation.sourceIds,
    reasoning: recommendation.reasoning,
    grounding: bindings(recommendation.reasoning, decision?.researchClaims),
    sources: usedSources(recommendation.reasoning, decision?.researchSources),
  };
}
export function planRationale(data: Data, goal: Goal, plan: Plan): RationaleView {
  const decision = data.decisions.find(
    (item) => item.goalId === goal.id && item.planVersion === plan.version,
  );
  const reasoning = plan.adaptive?.reasoning;
  return {
    planVersion: plan.version,
    basis: plan.basis ?? null,
    reasoning: reasoning ?? null,
    grounding: bindings(reasoning, decision?.researchClaims),
    sources: reasoning
      ? usedSources(reasoning, decision?.researchSources ?? plan.basis?.sources)
      : (plan.basis?.sources ?? []),
    recommendations: (decision?.recommendations ?? []).map((item) =>
      recommendationView(item, decision),
    ),
    decisionId: optional(decision?.id),
    windowRationale: optional(plan.adaptive?.window.rationale),
    assessmentQuestion: optional(plan.adaptive?.assessment.question),
    note:
      plan.basis || reasoning
        ? null
        : "This plan records your chosen work. No behavioural interpretation is saved for this version.",
  };
}

/* ------------------------------------------------------------------- today */

export type LineupState = "done" | "partly" | "missed" | "started" | "blocked" | "next" | "open";
export interface TodayLineupItem {
  action: ActionView;
  state: LineupState;
  stateLabel: string;
  selected: boolean;
}
export interface TodayNextStep {
  goal: GoalRef;
  phase: StepPhase;
  phaseLabel: string;
  headline: string;
  planVersion: number;
  planAction: string;
  planCriterion: string;
  planTiming: string;
  criterionLabel: string | null;
  timingLabel: string | null;
  durationMinutes: number;
  needsPlanReview: boolean;
  canStartGoal: boolean;
  canStartAction: boolean;
  canReport: boolean;
  canSchedule: boolean;
  action: ActionView | null;
  step: PlanStepView | null;
  block: WorkBlockView | null;
  successLabel: string;
  decisionNote: string | null;
}
export interface GoalProgressRow {
  goal: GoalRef;
  measured: boolean;
  actual: number | null;
  target: number;
  unit: string;
  observedAt: string | null;
  observations: { date: string; value: number }[];
  checkpoints: { date: string; value: number; label: string }[];
  due: { date: string; value: number; label: string } | null;
  next: { date: string; value: number; label: string } | null;
  delta: number | null;
  comparable: boolean;
  label: string;
  tone: "quiet" | "attention" | "positive";
  openMilestones: { id: string; title: string }[];
  hasOutcome: boolean;
  needsUpdate: boolean;
  evidenceNote: string | null;
  startDate: string;
  prompt: string;
  actionLabel: string;
}
export interface LearningControls {
  agree: boolean;
  decline: boolean;
  pause: boolean;
  resume: boolean;
  close: boolean;
}
export interface LearningAttempt {
  date: string;
  outcome: Outcome | null;
  actionId: string | null;
}
export interface TodayLearningCard {
  recordId: string;
  version: number;
  actionVersion: number;
  controls: LearningControls;
  attempts: LearningAttempt[];
  activeVersion: number | null;
  pendingVersion: number | null;
  state: LearningRecord["state"];
  standing: LearningRecord["standing"];
  statusLabel: string;
  standingLabel: string;
  goalIds: string[];
  goalTitles: string[];
  change: string;
  observation: string;
  hypothesis: string;
  watching: string;
  watchingLabel: "LATEST FEEDBACK" | "WHAT WE’RE WATCHING";
  startDate: string | null;
  reviewDate: string | null;
  needsDecision: boolean;
  reviewCount: number;
  footnote: string;
  prompt: string;
}
export interface TodayView extends ViewBase {
  reviewDue: boolean;
  reviewDate: string;
  next: TodayNextStep | null;
  lineup: TodayLineupItem[];
  doneCount: number;
  plannedCount: number;
  quietDay: boolean;
  nothingScheduled: boolean;
  progress: GoalProgressRow[];
  learning: TodayLearningCard[];
  latestMemory: { id: string; text: string; date: string } | null;
  goals: GoalRef[];
}

const phaseLabels: Record<StepPhase, string> = {
  draft: "YOUR PLAN IS READY",
  schedule: "YOUR NEXT STEP",
  ready: "YOUR NEXT STEP",
  working: "ONE THING TO FOCUS ON",
  checkin: "YOUR NEXT STEP",
  waiting: "YOU’RE SET",
  next: "CHECK-IN SAVED",
  inactive: "",
};
function lineupState(data: Data, action: Action, selected: boolean) {
  if (action.outcome === "Done") return { state: "done" as const, stateLabel: "Done" };
  if (action.outcome === "Partly") return { state: "partly" as const, stateLabel: "Partly" };
  if (action.outcome) return { state: "missed" as const, stateLabel: action.outcome };
  if (!actionReady(data, action))
    return { state: "blocked" as const, stateLabel: "Waiting on earlier work" };
  if (action.startedAt) return { state: "started" as const, stateLabel: "Started" };
  return selected
    ? { state: "next" as const, stateLabel: "Up next" }
    : { state: "open" as const, stateLabel: "View action" };
}
function nextStepView(
  data: Data,
  goal: Goal,
  today: string,
  now: Date,
  actionId?: string,
): TodayNextStep {
  const step = goalStep(data, goal, now, actionId);
  const action = step.action;
  const plan = action ? planOf(goal, action.planVersion) : currentPlan(goal);
  const definition = action ? actionStep(data, action) : plan.adaptive?.steps[0];
  const needsPlanReview = planNeedsReview(data, goal);
  const duration =
    definition?.durationMinutes ?? plan.durationMinutes ?? currentProgram(data).sessionMinutes;
  return {
    goal: ref(goal),
    phase: step.phase,
    phaseLabel: step.phase === "inactive" ? goal.status.toUpperCase() : phaseLabels[step.phase],
    headline:
      step.phase === "next"
        ? "Ready for the next step?"
        : step.phase === "inactive"
          ? "Pick this up when you’re ready."
          : (action?.title ?? plan.action),
    planVersion: plan.version,
    planAction: plan.action,
    planCriterion: plan.criterion,
    planTiming: plan.timing,
    criterionLabel: action
      ? `Finished when ${action.criterion.charAt(0).toLowerCase()}${action.criterion.slice(1)}`
      : null,
    timingLabel: action
      ? step.block
        ? step.block.start
        : action.date && step.phase === "waiting"
          ? formatDate(action.date)
          : `${duration} minutes${plan.adaptive && action.date ? ` · Suggested ${formatDate(action.date)} · ${action.timing}` : ""}`
      : null,
    durationMinutes: duration,
    needsPlanReview,
    canStartGoal: goal.status === "Draft" && Boolean(plan.action.trim()) && !needsPlanReview,
    canStartAction:
      Boolean(action) && goal.status === "Active" && ["ready", "schedule"].includes(step.phase),
    canReport: Boolean(
      action &&
        goal.status === "Active" &&
        (!action.date || action.date <= today) &&
        !action.retiredAt &&
        actionReady(data, action),
    ),
    canSchedule: Boolean(
      action &&
        !step.block &&
        !action.startedAt &&
        !action.outcome &&
        step.phase !== "draft" &&
        step.phase !== "inactive",
    ),
    action: action ? actionView(data, action, today) : null,
    step: definition && plan.adaptive ? planStepView(plan.adaptive, definition) : null,
    block: step.block ? blockView(data, step.block.id) : null,
    successLabel: goal.success,
    decisionNote: optional(plan.basis?.decisionNote ?? plan.basis?.uncertainty),
  };
}
export function goalProgressRow(goal: Goal, today: string): GoalProgressRow {
  const progress = goalPlanProgress(goal, today);
  const hasOutcome = progress.measured || goal.milestones.length > 0;
  const needsUpdate = ["Add a result", "Update needed", "Verify the milestone"].includes(
    progress.label,
  );
  return {
    goal: ref(goal),
    measured: progress.measured,
    actual: progress.actual,
    target: progress.target,
    unit: progress.unit,
    observedAt: progress.observedAt,
    observations: progress.observations,
    checkpoints: progress.checkpoints,
    due: progress.due ?? null,
    next: progress.next ?? null,
    delta: progress.delta,
    comparable: progress.comparable,
    label: progress.label,
    tone: progress.tone as GoalProgressRow["tone"],
    openMilestones: progress.openMilestones.map((milestone) => ({
      id: milestone.id,
      title: milestone.title,
    })),
    hasOutcome,
    needsUpdate,
    evidenceNote: needsUpdate
      ? progress.observedAt
        ? "A newer report will make the comparison useful."
        : "Update the result to compare it with the plan."
      : null,
    startDate: goal.startDate ?? goal.plans[0].date,
    prompt: needsUpdate
      ? `I’d like to update my result for “${goal.title}” and see how it compares with the plan.`
      : `Help me review my progress on “${goal.title}” and choose my next step.`,
    actionLabel: needsUpdate
      ? "Update progress"
      : goal.status === "Draft"
        ? "Shape the plan"
        : "Review plan",
  };
}
// `actionVersion` belongs to agree and decline; `version` belongs to pause, resume and
// close. POST /api/learning rejects the other one, so both are returned.
export function learningDecision(record: LearningRecord) {
  const target =
    record.versions.find((item) => item.version === record.pendingVersion) ??
    currentLearningVersion(record);
  const decidable =
    (record.state === "suggested" || Boolean(record.pendingVersion)) &&
    record.standing !== "reconsider";
  return {
    actionVersion: target.version,
    controls: {
      agree: decidable && !target.proposalId,
      decline: decidable && !target.proposalId,
      pause: ["agreed", "reviewed"].includes(record.state),
      resume: record.state === "paused" && record.standing !== "reconsider",
      close: !["closed", "declined", "suggested"].includes(record.state),
    } satisfies LearningControls,
  };
}
// Dated action reports inside the test, using the same input steps the saved test names.
// A reported attempt is not evidence that the change worked.
export function learningAttempts(data: Data, record: LearningRecord, today: string): LearningAttempt[] {
  const version = currentLearningVersion(record);
  const steps = version.test.inputStepIds ?? [];
  const start = version.test.start ?? version.at.slice(0, 10);
  return data.actions
    .filter(
      (action) =>
        record.goalIds.includes(action.goalId) &&
        action.date &&
        action.date >= start &&
        action.date <= today &&
        (!action.retiredAt || action.outcome) &&
        (!steps.length || (action.stepId !== undefined && steps.includes(action.stepId))),
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30)
    .map((action) => ({ date: action.date, outcome: action.outcome ?? null, actionId: action.id }));
}
export function todayLearningCard(data: Data, record: LearningRecord, today: string): TodayLearningCard {
  const version = currentLearningVersion(record);
  const reviews = record.reviews.filter((review) => review.version === version.version);
  const review = reviews.at(-1);
  const status = learningStatus(record, today);
  const needsDecision = record.state === "suggested" || Boolean(record.pendingVersion);
  const reviewDate = review?.nextReviewAfter ?? version.test.reviewAfter;
  const goals = data.goals.filter((goal) => record.goalIds.includes(goal.id));
  return {
    recordId: record.id,
    version: version.version,
    ...learningDecision(record),
    attempts: learningAttempts(data, record, today),
    activeVersion: optional(record.activeVersion),
    pendingVersion: optional(record.pendingVersion),
    state: record.state,
    standing: record.standing,
    statusLabel: status,
    standingLabel: learningStanding[record.standing],
    goalIds: record.goalIds,
    goalTitles: goals.map((goal) => goal.title),
    change: version.test.change,
    observation: version.observation,
    hypothesis: version.hypothesis,
    watching: review?.summary ?? version.test.behaviorSignal,
    watchingLabel: review ? "LATEST FEEDBACK" : "WHAT WE’RE WATCHING",
    startDate: version.test.start,
    reviewDate: reviewDate ?? null,
    needsDecision,
    reviewCount: reviews.length,
    footnote:
      record.standing === "reconsider"
        ? "The evidence changed. Review this explanation before using it."
        : record.state === "paused"
          ? "Paused. Resume when this fits your life again."
          : needsDecision
            ? record.activeVersion
              ? "A revision is awaiting your choice. The agreed test is shown."
              : "A suggestion to consider. Nothing has started yet."
            : status === "Reviewed" || status === "Finished"
              ? "A saved finding to revisit. Its evidence and limits stay attached."
              : reviewDate
                ? `${status === "Starting soon" ? `Planned from ${formatDate(version.test.start!)} · ` : ""}Review ${formatDate(reviewDate)} · Your experience will inform what comes next.`
                : "Review when there’s useful feedback.",
    prompt: `Let’s discuss learning ${record.id}, test version ${version.version}: “${version.test.change}”. ${
      ["Live experiment", "Ready to review"].includes(status)
        ? "I’d like to report whether I tried it and what happened: "
        : "Help me review where this stands."
    }`,
  };
}
export function todayView(data: Data, options: ViewOptions): TodayView {
  const now = options.now ?? new Date();
  const activity = todayActivity(data, now);
  const today = activity.today;
  const next = todayStep(data, now);
  const selectedId = next.step?.action?.id;
  return {
    revision: options.revision,
    today,
    reviewDue: next.review,
    reviewDate: reviewSchedule(data, now).nextDate,
    next: next.step ? nextStepView(data, next.step.goal, today, now, selectedId) : null,
    lineup: activity.actions.map((action) => ({
      action: actionView(data, action, today),
      selected: action.id === selectedId,
      ...lineupState(data, action, action.id === selectedId),
    })),
    doneCount: activity.actions.filter((action) => action.outcome === "Done").length,
    plannedCount: activity.actions.length,
    quietDay: !next.step,
    nothingScheduled: activity.actions.length === 0,
    progress: data.goals.map((goal) => goalProgressRow(goal, today)),
    learning: todayLearning(data, today).map((record) => todayLearningCard(data, record, today)),
    latestMemory: data.memories.at(-1) ?? null,
    goals: data.goals.map(ref),
  };
}

/* ------------------------------------------------------------------- goals */

export type ActivityState = "done" | "partly" | "missed" | "rest" | "unknown" | "planned";
export interface ActivityCell {
  date: string;
  state: ActivityState;
  done: number;
  partly: number;
  missed: number;
  unknown: number;
  planned: number;
  level: number;
}
export interface InputSeriesPoint {
  date: string;
  amount: number | null;
  planned: number | null;
  retired: boolean;
  future: boolean;
  scheduled: boolean;
  off: boolean;
  actionIds: string[];
}
export interface InputSeriesView {
  measure: InputMeasureView;
  start: string;
  end: string;
  points: InputSeriesPoint[];
  reported: number;
  plannedTotal: number;
  unknown: number;
}
export interface BudgetGoalShare {
  goalId: string;
  title: string;
  status: GoalStatus;
  color: string;
  minutes: number;
  proposed: boolean;
}
export interface WeeklyBudgetView {
  weekStart: string;
  weekEnd: string;
  totalMinutes: number;
  budgetMinutes: number;
  overMinutes: number;
  scaleMinutes: number;
  goals: BudgetGoalShare[];
  sourceNote: string;
  programReason: string;
}
export interface GoalRow {
  goal: GoalRef;
  kind: GoalKind;
  priority: "Focus" | "Maintain" | "Later" | null;
  area: string;
  tags: string[];
  success: string;
  resultLabel: string;
  current: number | null;
  target: number;
  unit: string;
  observedAt: string | null;
  activity: ActivityCell[];
  activitySummary: { reported: number; done: number; completion: number | null; label: string };
  series: InputSeriesView | null;
  stepTitle: string | null;
  nextAction: { id: string; title: string; date: string | null; phase: StepPhase } | null;
  completedActions: number;
  milestone: { id: string; title: string; dueDate: string | null } | null;
  implication: string;
  outlook: string;
  outlookNote: string | null;
  projectionStatus: string;
}
export interface GoalsView extends ViewBase {
  budget: WeeklyBudgetView;
  rows: GoalRow[];
  groups: { status: GoalStatus; goalIds: string[] }[];
  areas: string[];
  tags: string[];
}

const statusOrder: GoalStatus[] = ["Active", "Draft", "Paused", "Completed", "Set aside"];
export const projectionDate = (date: string | null) =>
  date ? formatDate(date, { month: "short", day: "numeric", year: "numeric" }) : "Beyond this horizon";

function activityGrid(data: Data, goal: Goal, today: string, weeks: number): ActivityCell[] {
  const start = weekStart(addDays(today, -7 * (weeks - 1)));
  const end = addDays(weekStart(today), 6);
  const records = data.actions.filter(
    (action) => action.goalId === goal.id && action.date && (!action.retiredAt || action.outcome),
  );
  const cells: ActivityCell[] = [];
  for (let date = start; date <= end; date = addDays(date, 1)) {
    const day = records.filter((action) => action.date === date);
    const counts = {
      done: day.filter((action) => action.outcome === "Done").length,
      partly: day.filter((action) => action.outcome === "Partly").length,
      missed: day.filter((action) => action.outcome === "Didn’t happen").length,
      unknown: day.filter((action) => !action.outcome && date <= today).length,
      planned: day.filter((action) => !action.outcome && date > today).length,
    };
    const state: ActivityState = !day.length
      ? "rest"
      : counts.unknown
        ? "unknown"
        : counts.done
          ? "done"
          : counts.partly
            ? "partly"
            : counts.missed
              ? "missed"
              : "planned";
    cells.push({ date, ...counts, state, level: Math.min(4, counts.done) });
  }
  return cells;
}
function seriesView(series: ReturnType<typeof actionSeries>, start: string, end: string): InputSeriesView {
  return {
    measure: series.measure,
    start,
    end,
    points: series.points.map((point) => ({
      date: point.date,
      amount: point.amount,
      planned: point.planned,
      retired: point.retired,
      future: point.future,
      scheduled: point.scheduled,
      off: point.off,
      actionIds: point.actions.map((action) => action.id),
    })),
    reported: series.reported,
    plannedTotal: series.planned,
    unknown: series.unknown,
  };
}
export function weeklyBudget(data: Data, today: string): WeeklyBudgetView {
  const start = weekStart(today);
  const end = addDays(start, 6);
  const commitments = scheduledCommitments(data, today).filter((item) => item.date <= end);
  const program = currentProgram(data);
  const goals = data.goals
    .map((goal) => ({
      goalId: goal.id,
      title: goal.title,
      status: goal.status,
      color: goalColor(goal.id),
      minutes: commitments
        .filter((item) => item.goalId === goal.id)
        .reduce((sum, item) => sum + item.minutes, 0),
      proposed: goal.status === "Draft",
    }))
    .filter((group) => group.minutes > 0);
  const total = goals.reduce((sum, group) => sum + group.minutes, 0);
  return {
    weekStart: start,
    weekEnd: end,
    totalMinutes: total,
    budgetMinutes: program.weeklyMinutes,
    overMinutes: Math.max(0, total - program.weeklyMinutes),
    scaleMinutes: Math.max(1, total, program.weeklyMinutes),
    goals,
    sourceNote:
      "Saved action durations across active goals and draft plans, using calendar bookings where present. A booking is counted once. Unscheduled actions are not included. This is your saved time budget, not a measurement of free calendar time.",
    programReason: program.reason,
  };
}
export function goalRow(data: Data, goal: Goal, today: string, weeks: number): GoalRow {
  const plan = currentPlan(goal);
  const step =
    plan.adaptive?.steps.find((item) => item.id === plan.adaptive?.projection?.driverStepId) ??
    plan.adaptive?.steps[0];
  const start = addDays(today, -13);
  const projection = goalProjection(data, goal, today);
  const milestone = goal.milestones.find((item) => !item.done);
  const next = goalStep(data, goal);
  const records = data.actions.filter(
    (action) => action.goalId === goal.id && action.date && (!action.retiredAt || action.outcome),
  );
  const reported = records.filter((action) => action.outcome);
  const done = reported.filter((action) => action.outcome === "Done");
  return {
    goal: ref(goal),
    kind: goal.kind,
    priority: optional(goal.priority),
    area: goal.area ?? "Unassigned",
    tags: goal.tags ?? [],
    success: goal.success,
    resultLabel: resultLabel(goal),
    current: projection.current,
    target: projection.target,
    unit: goal.measure?.unit ?? goal.unit ?? "milestones",
    observedAt: projection.observedAt,
    activity: activityGrid(data, goal, today, weeks),
    activitySummary: {
      reported: reported.length,
      done: done.length,
      completion: reported.length ? Math.round((100 * done.length) / reported.length) : null,
      label: reported.length
        ? `${Math.round((100 * done.length) / reported.length)}% completed`
        : "No check-ins yet",
    },
    series:
      step?.type === "behavior"
        ? seriesView(actionSeries(data, goal, plan, step.id, start, today, today), start, today)
        : null,
    stepTitle: step?.title ?? (plan.action || null),
    nextAction: next.action
      ? {
          id: next.action.id,
          title: next.action.title,
          date: next.action.date || null,
          phase: next.phase,
        }
      : null,
    completedActions: data.actions.filter(
      (action) => action.goalId === goal.id && action.outcome === "Done",
    ).length,
    milestone: milestone
      ? { id: milestone.id, title: milestone.title, dueDate: optional(milestone.dueDate) }
      : null,
    implication: milestone?.title ?? goal.success,
    outlook: projection.projection
      ? `Goal estimate · ${projectionDate(projection.projection.expectedDate)}`
      : "Goal finish not yet estimated",
    outlookNote: projection.projection ? "Conditional on input pace" : null,
    projectionStatus: projection.status,
  };
}
export function goalsView(data: Data, options: ViewOptions & { weeks?: number }): GoalsView {
  const today = dateInZone(data.timeZone, options.now ?? new Date());
  const weeks = Math.min(52, Math.max(1, Math.round(options.weeks ?? 12)));
  return {
    revision: options.revision,
    today,
    budget: weeklyBudget(data, today),
    rows: data.goals.map((goal) => goalRow(data, goal, today, weeks)),
    groups: statusOrder
      .map((status) => ({
        status,
        goalIds: data.goals.filter((goal) => goal.status === status).map((goal) => goal.id),
      }))
      .filter((group) => group.goalIds.length > 0),
    areas: [...new Set(data.goals.map((goal) => goal.area ?? "Unassigned"))],
    tags: [...new Set(data.goals.flatMap((goal) => goal.tags ?? []))].sort(),
  };
}

/* ------------------------------------------------------------- goal detail */

export interface MilestoneView {
  id: string;
  title: string;
  criterion: string;
  done: boolean;
  dueDate: string | null;
  completedAt: string | null;
  stepIds: string[];
  actionIds: string[];
  statusLabel: string;
}
export interface StreakView {
  count: number;
  completedCount: number;
  days: { date: string; status: "on" | "off" | "short" | "unknown"; streak: number }[];
}
// "7 days on plan · 4 actions completed": the second number counts the reports inside the
// days the current streak covers, not the whole cycle.
export function streakView(data: Data, goal: Goal, today: string): StreakView {
  const streak = goalStreak(data, goal, today);
  let index = streak.days.length;
  while (index > 0 && streak.days[index - 1].streak > 0) index--;
  const covered = new Set(streak.days.slice(index).map((day) => day.date));
  return {
    count: streak.count,
    completedCount: data.actions.filter(
      (action) =>
        action.goalId === goal.id &&
        action.outcome === "Done" &&
        covered.has(action.date) &&
        (!action.retiredAt || action.outcome),
    ).length,
    days: streak.days,
  };
}
export interface ProjectionPointView {
  date: string;
  low: number;
  expected: number;
  high: number;
}
export interface ProjectionView {
  status: string;
  current: number | null;
  target: number;
  progress: number | null;
  observedAt: string | null;
  observations: { id: string; date: string; value: number; source: string }[];
  unavailableReason: string | null;
  trackingLabel: string;
  inputLabel: string;
  projection: {
    origin: string;
    horizon: string;
    expectedDate: string | null;
    earliestDate: string | null;
    latestDate: string | null;
    points: ProjectionPointView[];
    yieldRange: { low: number; expected: number; high: number };
    assumptions: { label: string; text: string }[];
  } | null;
  evidence: {
    unit: string;
    paceSource: string;
    pace: { low: number; expected: number; high: number };
    plannedDaily: number;
    measured: number;
    due: number;
    daily: { date: string; amount: number | null; status: string; sourceIds: string[] }[];
    pairs: { input: number; outcome: number; start: string; end: string; sourceIds: string[] }[];
    excludedPeriods: {
      input: number | null;
      outcome: number;
      start: string;
      end: string;
      sourceIds: string[];
      reason: string;
    }[];
    sourceIds: string[];
  } | null;
}
export interface JourneyEntry {
  id: string;
  at: string;
  kind: "plan" | "learning-version" | "learning-review" | "decision";
  label: string;
  title: string;
  detail: string | null;
  planVersion: number | null;
  recordId: string | null;
  decisionId: string | null;
}
export interface ConversationRef {
  id: string;
  title: string;
  goalId: string;
  goalTitle: string;
  createdAt: string;
  messageCount: number;
  lastMessageAt: string | null;
  lastMessage: string | null;
}
export interface GoalDetailView extends ViewBase {
  goal: GoalRef;
  kind: GoalKind;
  why: string;
  success: string;
  area: string;
  tags: string[];
  priority: "Focus" | "Maintain" | "Later" | null;
  targetDate: string | null;
  deadline: "firm" | "preferred" | "none";
  startDate: string | null;
  measure: NonNullable<Goal["measure"]> | null;
  target: number | null;
  unit: string | null;
  resultLabel: string;
  results: { id: string; date: string; value: number; source: string }[];
  checkpoints: { id: string; date: string; value: number; label: string }[];
  measurementHistory: NonNullable<Goal["measurementHistory"]>;
  checkpointHistory: NonNullable<Goal["checkpointHistory"]>;
  needsPlanReview: boolean;
  statusOptions: GoalStatus[];
  selectedPlanVersion: number;
  selectedStepId: string | null;
  selectedMilestoneId: string | null;
  plans: PlanView[];
  milestones: MilestoneView[];
  actions: ActionView[];
  planActions: ActionView[];
  series: InputSeriesView;
  streak: StreakView;
  progress: GoalProgressRow;
  execution: ReturnType<typeof executionSummary>;
  projection: ProjectionView;
  rationale: RationaleView;
  experiment: { recordId: string; version: number; statusLabel: string; current: boolean } | null;
  journey: JourneyEntry[];
  conversations: ConversationRef[];
  tentative: { id: string; goalId: string; title: string; start: string; end: string }[];
  pendingProposalIds: string[];
  nextReviewAt: string | null;
}

function conversationRef(data: Data, conversation: Data["conversations"][number]): ConversationRef {
  const messages = data.messages.filter((message) => message.conversationId === conversation.id);
  const last = messages.at(-1);
  return {
    id: conversation.id,
    title: conversation.title,
    goalId: conversation.goalId,
    goalTitle: conversation.goalId === "general" ? "General" : goalTitle(data, conversation.goalId),
    createdAt: conversation.createdAt,
    messageCount: messages.length,
    lastMessageAt: optional(last?.at),
    lastMessage: optional(last?.text),
  };
}
function projectionView(data: Data, goal: Goal, today: string): ProjectionView {
  const model = goalProjection(data, goal, today);
  const plan = currentPlan(goal);
  const projectionModel = plan.adaptive?.projection;
  const input = projectionModel
    ? plan.adaptive?.steps.find((step) => step.id === projectionModel.driverStepId)?.measure
    : (plan.adaptive?.steps.find((step) => step.measure)?.measure ?? plan.basis?.actionMeasure);
  return {
    status: model.status,
    current: model.current,
    target: model.target,
    progress: model.progress,
    observedAt: model.observedAt,
    observations: model.observations,
    unavailableReason:
      plan.adaptive?.projectionUnavailableReason ??
      (model.projection
        ? null
        : goal.measure
          ? "Your results are tracked. Adler can review which input supports an estimate as you report what happens."
          : "Your actions and verified results are tracked separately. Completing an action does not predict when the whole goal will be finished."),
    trackingLabel: goal.measure?.label ?? (goal.milestones.length ? "Verified milestones" : goal.success),
    inputLabel:
      projectionModel?.inputMetric === "hours"
        ? "Reported work time (hours)"
        : input
          ? `${input.label} (${input.unit})`
          : "Action reports",
    projection: model.projection
      ? {
          origin: model.projection.origin,
          horizon: model.projection.horizon,
          expectedDate: model.projection.expectedDate,
          earliestDate: model.projection.earliestDate,
          latestDate: model.projection.latestDate,
          points: model.projection.points,
          yieldRange: model.projection.yieldRange,
          assumptions: model.projection.assumptions,
        }
      : null,
    evidence: model.evidence
      ? {
          unit: model.evidence.unit,
          paceSource: model.evidence.paceSource,
          pace: model.evidence.pace,
          plannedDaily: model.evidence.plannedDaily,
          measured: model.evidence.measured,
          due: model.evidence.due,
          daily: model.evidence.daily,
          pairs: model.evidence.pairs,
          excludedPeriods: model.evidence.excludedPeriods,
          sourceIds: model.evidence.sourceIds,
        }
      : null,
  };
}
export function goalDetailView(
  data: Data,
  options: ViewOptions & {
    goalId: string;
    planVersion?: number;
    stepId?: string;
    milestoneId?: string;
    proposals?: Proposal[];
  },
): GoalDetailView {
  const now = options.now ?? new Date();
  const today = dateInZone(data.timeZone, now);
  const goal = data.goals.find((item) => item.id === options.goalId);
  if (!goal) throw Object.assign(new Error("This goal isn’t here."), { status: 404 });
  const proposals = options.proposals ?? [];
  const current = currentPlan(goal);
  const plan = goal.plans.find((item) => item.version === options.planVersion) ?? current;
  const milestoneId = goal.milestones.some((item) => item.id === options.milestoneId)
    ? options.milestoneId
    : undefined;
  const steps = plan.adaptive?.steps.filter((step) => !milestoneId || step.milestoneId === milestoneId) ?? [];
  const step = steps.find((item) => item.id === options.stepId) ?? steps[0];
  const start = addDays(today, -7);
  const end = addDays(start, 13);
  const binding = planExperiment(data, goal, plan, step?.id, proposals);
  const learning = (data.learning ?? []).filter((record) => record.goalIds.includes(goal.id));
  const journey: JourneyEntry[] = [
    ...goal.plans
      .filter((item) => item.action.trim())
      .map((item, index) => ({
        id: `plan-${item.version}`,
        at: item.date,
        kind: "plan" as const,
        label: index === 0 ? "Starting plan" : "Plan updated",
        title: item.adaptive?.approach ?? item.action,
        detail: item.adaptive?.window.rationale ?? null,
        planVersion: item.version,
        recordId: null,
        decisionId: optional(
          data.decisions.find(
            (decision) => decision.goalId === goal.id && decision.planVersion === item.version,
          )?.id,
        ),
      })),
    ...learning.flatMap((record) =>
      record.versions.map((version) => ({
        id: `learning-${record.id}-v${version.version}`,
        at: dateInZone(data.timeZone, new Date(version.at)),
        kind: "learning-version" as const,
        label: version.version === 1 ? "Test suggested" : "Test revised",
        title: version.test.change,
        detail: version.hypothesis,
        planVersion: null,
        recordId: record.id,
        decisionId: version.decisionId,
      })),
    ),
    ...learning.flatMap((record) =>
      record.reviews.map((review) => ({
        id: review.id,
        at: dateInZone(data.timeZone, new Date(review.at)),
        kind: "learning-review" as const,
        label: "Review saved",
        title: review.implication ?? review.summary,
        detail: review.summary,
        planVersion: null,
        recordId: record.id,
        decisionId: review.decisionId,
      })),
    ),
    ...data.decisions
      .filter(
        (decision) =>
          decision.goalId === goal.id &&
          !learning.some(
            (record) =>
              record.versions.some((version) => version.decisionId === decision.id) ||
              record.reviews.some((review) => review.decisionId === decision.id),
          ),
      )
      .map((decision) => ({
        id: `decision-${decision.id}`,
        at: decision.date.slice(0, 10),
        kind: "decision" as const,
        label: decision.status,
        title: decision.recommendations?.[0]?.action ?? decision.summary,
        detail: decision.summary,
        planVersion: decision.planVersion,
        recordId: null,
        decisionId: decision.id,
      })),
  ].sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
  const week = calendarWeek(today);
  const schedule = tentativeSchedule(data, week, addDays(week, 7), now);
  const series = actionSeries(data, goal, plan, step?.id, start, end, today, milestoneId);
  return {
    revision: options.revision,
    today,
    goal: ref(goal),
    kind: goal.kind,
    why: goal.why,
    success: goal.success,
    area: goal.area ?? "Unassigned",
    tags: goal.tags ?? [],
    priority: optional(goal.priority),
    targetDate: optional(goal.targetDate),
    deadline: goal.deadline ?? "none",
    startDate: optional(goal.startDate),
    measure: goal.measure ?? null,
    target: optional(goal.target),
    unit: optional(goal.unit),
    resultLabel: resultLabel(goal),
    results: goal.results,
    checkpoints: goal.checkpoints ?? [],
    measurementHistory: goal.measurementHistory ?? [],
    checkpointHistory: goal.checkpointHistory ?? [],
    needsPlanReview: planNeedsReview(data, goal),
    statusOptions:
      goal.status === "Active"
        ? ["Paused", "Completed", "Set aside"]
        : goal.status === "Draft"
          ? ["Set aside"]
          : ["Active"],
    selectedPlanVersion: plan.version,
    selectedStepId: optional(step?.id),
    selectedMilestoneId: milestoneId ?? null,
    plans: goal.plans.map((item) => planView(goal, item)),
    milestones: goal.milestones.map((milestone, index) => ({
      id: milestone.id,
      title: milestone.title,
      criterion: milestone.criterion,
      done: milestone.done,
      dueDate: optional(milestone.dueDate),
      completedAt: optional(milestone.completedAt),
      stepIds: goal.plans.flatMap(
        (item) =>
          item.adaptive?.steps
            .filter((definition) => definition.milestoneId === milestone.id)
            .map((definition) => definition.id) ?? [],
      ),
      actionIds: data.actions
        .filter(
          (action) =>
            action.goalId === goal.id && actionStep(data, action)?.milestoneId === milestone.id,
        )
        .map((action) => action.id),
      statusLabel: milestone.done
        ? "Verified"
        : index === goal.milestones.findIndex((item) => !item.done)
          ? "In progress"
          : "Not started",
    })),
    actions: data.actions
      .filter((action) => action.goalId === goal.id)
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) ||
          (b.history.at(-1)?.at ?? "").localeCompare(a.history.at(-1)?.at ?? ""),
      )
      .map((action) => actionView(data, action, today)),
    planActions: planActionRecords(data, goal, plan, step?.id, milestoneId).map((action) =>
      actionView(data, action, today),
    ),
    series: seriesView(series, start, end),
    streak: streakView(data, goal, today),
    progress: goalProgressRow(goal, today),
    execution: executionSummary(data, goal, today),
    projection: projectionView(data, goal, today),
    rationale: planRationale(data, goal, plan),
    experiment: binding
      ? {
          recordId: binding.record.id,
          version: binding.version.version,
          current: binding.version.version === currentLearningVersion(binding.record).version,
          statusLabel:
            binding.version.version === currentLearningVersion(binding.record).version
              ? learningStatus(binding.record, today)
              : "Earlier experiment",
        }
      : null,
    journey,
    conversations: data.conversations
      .filter((conversation) => conversation.goalId === goal.id)
      .map((conversation) => conversationRef(data, conversation)),
    tentative: schedule.blocks
      .filter((block) => block.goalId === goal.id)
      .map((block) => ({
        id: block.id,
        goalId: block.goalId,
        title: block.title,
        start: block.start,
        end: block.end,
      })),
    pendingProposalIds: proposals
      .filter(
        (proposal) =>
          proposal.status === "pending" &&
          proposal.expires > now.getTime() &&
          (proposal.goalId === goal.id ||
            proposal.changes.some(
              (change) =>
                change.parentId === goal.id ||
                (change.entity === "goal" && change.id === goal.id),
            )),
      )
      .map((proposal) => proposal.id),
    nextReviewAt:
      goal.assessment?.nextAt === null
        ? null
        : (goal.assessment?.nextAt ?? current.adaptive?.assessment.at ?? null),
  };
}

/* ------------------------------------------------------------------- coach */

export interface MessageView {
  id: string;
  conversationId: string | null;
  goalId: string;
  goalTitle: string;
  role: "user" | "coach";
  origin: "user" | "connected" | "system";
  channel: string;
  text: string;
  at: string | null;
  decisionId: string | null;
  links: { goalId: string; goalTitle: string; tab: "progress" | "plan" }[];
  references: { text: string; recordId: string }[];
  reactions: { actor: "user" | "coach"; type: string | null; at: string }[];
  authorLabel: string;
  saved: boolean;
  recommendations: RecommendationView[];
  decisionSummary: string | null;
  decisionChecks: { id: string; label: string; finding: string; sources: string[] }[];
  decisionMethods: { id: string; name: string; url: string }[];
}
export interface ProposalBooking {
  provider: string;
  calendarName: string;
  start: string;
  end: string;
  includesCheckIn: boolean;
}
export interface ProposalAffected {
  actions: number;
  milestones: number;
  planVersions: number;
}
export interface ProposalView {
  id: string;
  summary: string;
  headline: string;
  consequences: string[];
  booking: ProposalBooking | null;
  affected: ProposalAffected;
  goalId: string;
  goalTitle: string;
  conversationId: string | null;
  decisionId: string | null;
  status: string;
  channel: string;
  expires: number;
  expired: boolean;
  createdAt: string | null;
  changes: Change[];
  before: (Record<string, unknown> | null)[] | null;
  recommendations: RecommendationView[];
  researchClaims: ResearchClaim[];
  researchSources: ResearchSource[];
}
export interface QuickPrompt {
  id: string;
  label: string;
  prompt: string;
  goalId: string;
}
export interface CoachView extends ViewBase {
  conversations: ConversationRef[];
  selectedConversationId: string | null;
  messages: MessageView[];
  proposals: ProposalView[];
  quickPrompts: QuickPrompt[];
  model: { configured: boolean; provider: string; model: string };
  goals: GoalRef[];
}

function messageView(data: Data, message: Data["messages"][number]): MessageView {
  const decision = data.decisions.find((item) => item.id === message.decisionId);
  return {
    id: message.id,
    conversationId: optional(message.conversationId),
    goalId: message.goalId,
    goalTitle: goalTitle(data, message.goalId),
    role: message.role,
    origin:
      message.origin ?? (message.channel === "job" ? "connected" : message.role === "user" ? "user" : "system"),
    channel: message.channel ?? "web",
    text: message.text,
    at: optional(message.at),
    decisionId: optional(message.decisionId),
    links: (message.links ?? [])
      .filter((link) => data.goals.some((goal) => goal.id === link.goalId))
      .map((link) => ({ ...link, goalTitle: goalTitle(data, link.goalId) })),
    references: message.references ?? [],
    reactions: (["user", "coach"] as const).flatMap((actor) => {
      const reaction = message.reactions?.[actor];
      return reaction ? [{ actor, type: reaction.type, at: reaction.at }] : [];
    }),
    authorLabel:
      message.role === "coach" ? "Adler" : message.origin === "connected" ? "Connected update" : "You",
    saved: decision?.status === "Accepted",
    recommendations: (decision?.recommendations ?? []).map((item) => recommendationView(item, decision)),
    decisionSummary: optional(decision?.summary),
    decisionChecks: decision?.checks ?? [],
    decisionMethods: (decision?.methods ?? []).flatMap((id) => {
      const method = METHODS.find((item) => item.id === id);
      return method ? [{ id: method.id, name: method.name, url: method.url }] : [];
    }),
  };
}
export const changeEntityLabels: Record<Change["entity"], string> = {
  goal: "Goal",
  plan: "Plan",
  milestone: "Milestone",
  checkpoint: "Progress check",
  action: "Action",
  result: "Recorded result",
  memory: "Saved information",
  program: "Weekly plan",
  review: "Review",
  preferences: "Preferences",
  workBlock: "Calendar",
  conversation: "Chat",
};
function changeValues(change: Change): Record<string, unknown> {
  try {
    const parsed = JSON.parse(change.values);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
// What accepting actually does, stated from the saved commands. Approval never books a
// calendar unless the proposal itself carries an external work block.
function proposalConsequences(changes: Change[]): string[] {
  const notes: string[] = [];
  for (const change of changes) {
    const values = changeValues(change);
    if (change.operation === "delete") {
      notes.push(
        change.entity === "goal"
          ? "Accepting removes this goal with its plans, actions and recorded history."
          : `Accepting removes a saved ${changeEntityLabels[change.entity].toLowerCase()} from your workspace.`,
      );
      continue;
    }
    if (change.entity === "workBlock" && change.operation === "create") {
      const provider = String(values.provider ?? "local");
      notes.push(
        provider === "local"
          ? "Accepting reserves this time in Adler only. No calendar event is created."
          : `Accepting creates this event in your connected ${provider} calendar${values.checkIn === true ? ", with a separate check-in event" : ""}.`,
      );
      continue;
    }
    if (change.entity === "plan")
      notes.push("Accepting saves a new plan version. Reported and booked work is preserved.");
    if (change.entity === "goal" && values.measure)
      notes.push("Changing the measurement archives the results recorded under the previous one.");
    if (change.entity === "goal" && values.status === "Active")
      notes.push("Accepting starts this goal’s plan.");
    if (change.entity === "program")
      notes.push("Accepting saves a new version of your coaching program.");
    if (change.entity === "milestone" && values.done === true)
      notes.push("Accepting records this milestone as separately verified.");
  }
  return [...new Set(notes)];
}
export function proposalView(data: Data, proposal: Proposal, now: Date): ProposalView {
  const decision = data.decisions.find((item) => item.id === proposal.decisionId);
  const external = proposal.changes.find(
    (change) =>
      change.entity === "workBlock" &&
      change.operation === "create" &&
      String(changeValues(change).provider ?? "local") !== "local",
  );
  const booking = external ? changeValues(external) : undefined;
  return {
    id: proposal.id,
    summary: proposal.summary,
    headline: decision?.recommendations?.[0]?.action ?? proposal.summary,
    consequences: proposalConsequences(proposal.changes),
    booking: booking
      ? {
          provider: String(booking.provider),
          calendarName: String(booking.calendarId ?? ""),
          start: String(booking.start ?? ""),
          end: String(booking.end ?? ""),
          includesCheckIn: booking.checkIn === true,
        }
      : null,
    affected: {
      actions: proposal.changes.filter(
        (change) => change.entity === "action" || change.entity === "workBlock",
      ).length,
      milestones: proposal.changes.filter((change) => change.entity === "milestone").length,
      planVersions: new Set(
        proposal.changes
          .filter((change) => change.entity === "plan")
          .map((change) => change.parentId ?? ""),
      ).size,
    },
    goalId: proposal.goalId,
    goalTitle: proposal.goalId === "general" ? "General" : goalTitle(data, proposal.goalId),
    conversationId: optional(proposal.conversationId),
    decisionId: optional(proposal.decisionId),
    status: proposal.status,
    channel: proposal.channel,
    expires: proposal.expires,
    expired: proposal.expires <= now.getTime(),
    createdAt: optional(proposal.createdAt),
    changes: proposal.changes,
    before: proposal.before ?? null,
    recommendations: (decision?.recommendations ?? []).map((item) => recommendationView(item, decision)),
    researchClaims: decision?.researchClaims ?? [],
    researchSources: decision?.researchSources ?? [],
  };
}
// The same contextual openings the web offers as prompt links, so a conversation
// started on the phone carries the identical request text.
export function quickPrompts(data: Data, today: string, now: Date): QuickPrompt[] {
  const prompts: QuickPrompt[] = [];
  const next = todayStep(data, now);
  if (next.review)
    prompts.push({
      id: "weekly-review",
      label: "Review this week",
      goalId: "general",
      prompt: "Let’s review what happened this week and what to adjust.",
    });
  const action = next.step?.action;
  if (action && next.step)
    prompts.push({
      id: `action-${action.id}`,
      label: "Check in on today’s action",
      goalId: next.step.goal.id,
      prompt: `I want to check in on ${action.title} (${action.date || "unscheduled"}).`,
    });
  if (next.step && !action)
    prompts.push({
      id: "next-step",
      label: "Plan the next step",
      goalId: next.step.goal.id,
      prompt:
        "Use my latest check-in and goal results to help me choose one next action. Ask only what you need; explain any proposed change briefly.",
    });
  for (const goal of data.goals.filter((item) => item.status === "Active" || item.status === "Draft")) {
    if (!currentPlan(goal).action.trim()) {
      prompts.push({
        id: `plan-${goal.id}`,
        label: `Plan first action · ${goal.title}`,
        goalId: goal.id,
        prompt:
          "Help me choose the first useful work for this saved goal. Keep my outcome and deadline; ask only what changes the next useful action.",
      });
      continue;
    }
    const row = goalProgressRow(goal, today);
    if (row.needsUpdate)
      prompts.push({
        id: `progress-${goal.id}`,
        label: `Update progress · ${goal.title}`,
        goalId: goal.id,
        prompt: row.prompt,
      });
  }
  for (const record of todayLearning(data, today).slice(0, 2)) {
    const card = todayLearningCard(data, record, today);
    prompts.push({
      id: `learning-${record.id}`,
      label:
        card.statusLabel === "Ready to review"
          ? "Review with Adler"
          : card.statusLabel === "Live experiment"
            ? "Share an update"
            : "Discuss with Adler",
      goalId: record.goalIds.length === 1 ? record.goalIds[0] : "general",
      prompt: card.prompt,
    });
  }
  return prompts.slice(0, 6);
}
export function coachView(
  data: Data,
  options: ViewOptions & {
    conversationId?: string;
    proposals?: Proposal[];
    model?: { configured: boolean; provider: string; model: string };
  },
): CoachView {
  const now = options.now ?? new Date();
  const today = dateInZone(data.timeZone, now);
  const conversation = options.conversationId
    ? data.conversations.find((item) => item.id === options.conversationId)
    : undefined;
  if (options.conversationId && !conversation)
    throw Object.assign(new Error("This conversation isn’t here."), { status: 404 });
  const proposals = options.proposals ?? [];
  return {
    revision: options.revision,
    today,
    conversations: data.conversations
      .map((item) => conversationRef(data, item))
      .sort((a, b) => (b.lastMessageAt ?? b.createdAt).localeCompare(a.lastMessageAt ?? a.createdAt)),
    selectedConversationId: conversation?.id ?? null,
    messages: conversation
      ? data.messages
          .filter((message) => message.conversationId === conversation.id)
          .map((message) => messageView(data, message))
      : [],
    proposals: proposals
      .filter((proposal) => proposal.status === "pending")
      .filter((proposal) => !conversation || proposal.conversationId === conversation.id)
      .map((proposal) => proposalView(data, proposal, now)),
    quickPrompts: quickPrompts(data, today, now),
    model: options.model ?? { configured: false, provider: "", model: "" },
    goals: data.goals.map(ref),
  };
}

/* ---------------------------------------------------------------- insights */

export interface LearningRow {
  recordId: string;
  version: number;
  activeVersion: number | null;
  pendingVersion: number | null;
  state: LearningRecord["state"];
  standing: LearningRecord["standing"];
  statusLabel: string;
  standingLabel: string;
  timingLabel: string;
  goals: GoalRef[];
  change: string;
  observation: string;
  hypothesis: string;
  behaviorSignal: string;
  mechanismSignal: string | null;
  outcomeSignal: string | null;
  prediction: string;
  reviewRule: string;
  comparison: string;
  design: "observation" | "prospective" | "comparison";
  alternatives: string[];
  transfer: string | null;
  start: string | null;
  reviewAfter: string | null;
  nextReviewAfter: string | null;
  reports: number;
  latestReview: {
    id: string;
    at: string;
    summary: string;
    implication: string | null;
    nextQuestion: string | null;
    decision: "keep" | "adjust" | "clarify" | "pause" | "close";
    standing: "insufficient" | "consistent" | "mixed" | "inconsistent";
    standingLabel: string;
    exposure: "unknown" | "not-used" | "used";
    exposureLabel: string;
  } | null;
  controls: LearningControls;
  actionVersion: number;
  attempts: LearningAttempt[];
  sources: SourceView[];
  prompt: string;
}
export interface LearningVersionView {
  version: number;
  at: string;
  decisionId: string;
  goalIds: string[];
  observation: string;
  hypothesis: string;
  transfer: string | null;
  proposalId: string | null;
  test: LearningRecord["versions"][number]["test"];
  sources: LearningRecord["versions"][number]["sources"];
  reasoning: BehavioralReasoning;
  grounding: ClaimBindingView[];
  researchSources: ResearchSource[];
}
export interface LearningDetailView extends ViewBase {
  row: LearningRow;
  versions: LearningVersionView[];
  reviews: (LearningRecord["reviews"][number] & { standingLabel: string; exposureLabel: string })[];
  events: LearningRecord["events"];
  invalidations: LearningRecord["invalidations"];
  pending: LearningVersionView | null;
}
export interface MemoryView {
  id: string;
  text: string;
  date: string;
  corrected: boolean;
  corrections: { id: string; reason: string; at: string }[];
}
// A saved observation needs no hypothesis or test scaffolding. These rows come from the
// insights a coach decision recorded, exactly as src/Insights.tsx renders them, and stay
// separate from learning records: a decision already carried by a learning record is omitted.
export interface ObservationLearningView {
  recordId: string | null;
  goalIds: string[];
  hypothesis: string;
  experiment: string;
  insight: string | null;
  nextHypothesis: string | null;
  previousInsightId: string | null;
  transfer: string | null;
  result: { summary: string; sourceIds: string[] } | null;
  reasoning: BehavioralReasoning | null;
  grounding: ClaimBindingView[];
}
export interface ObservationRow {
  id: string;
  decisionId: string;
  proposalId: string | null;
  date: string;
  finding: string;
  status: "Reported" | "To test";
  kindLabel: string;
  headline: string;
  statusLabel: string;
  implication: string;
  implicationLabel: string;
  changeStatus: string;
  changes: Change[];
  goals: GoalRef[];
  goalIds: string[];
  goalTitle: string;
  sources: SourceView[];
  resultSources: SourceView[];
  research: ResearchSource[];
  learning: ObservationLearningView | null;
}
export function observationRows(
  data: Data,
  proposals: Proposal[],
  goalId?: string,
): ObservationRow[] {
  return data.decisions
    .slice()
    .reverse()
    .filter(
      (decision) =>
        !(data.learning ?? []).some(
          (record) =>
            record.versions.some((version) => version.decisionId === decision.id) ||
            record.reviews.some((review) => review.decisionId === decision.id),
        ),
    )
    .flatMap((decision) =>
      (decision.insights ?? []).map((insight, index) => {
        const proposal = proposals.find((item) => item.decisionId === decision.id);
        const changes = insight.changeIndexes.flatMap((position) =>
          proposal?.changes[position] ? [proposal.changes[position]] : [],
        );
        const affected = [
          ...new Set(
            changes
              .map((change) => (change.entity === "goal" ? change.id : change.parentId))
              .filter((id): id is string => Boolean(id)),
          ),
        ];
        const goalIds = affected.length ? affected : [decision.goalId];
        const owner = affected.length === 1 ? affected[0] : decision.goalId;
        const learning = insight.learning;
        return {
          id: `${decision.id}-${index}`,
          decisionId: decision.id,
          proposalId: optional(proposal?.id),
          date: decision.date,
          finding: insight.finding,
          status: insight.status,
          kindLabel: learning?.insight
            ? "Working insight"
            : learning || insight.status === "To test"
              ? "Hypothesis"
              : "Your observation",
          headline: learning?.insight ?? learning?.hypothesis ?? insight.finding,
          statusLabel: learning?.result
            ? "Feedback received"
            : learning
              ? "Earlier hypothesis"
              : insight.status === "To test"
                ? "To test"
                : "Reported by you",
          implication: changes.length
            ? changes.map((change) => change.reason).filter(Boolean).join(" ") ||
              learning?.experiment ||
              "Review the linked plan change."
            : (learning?.experiment ??
              "Keep this context in view when reviewing the next plan. No change is attached yet."),
          implicationLabel: changes.length
            ? proposal?.status === "applied"
              ? "In the saved plan"
              : proposal?.status === "pending"
                ? "Proposed adjustment"
                : "Previously considered adjustment"
            : "What to explore next",
          changeStatus:
            proposal?.status === "applied"
              ? "Saved"
              : proposal?.status === "pending"
                ? "Proposed"
                : proposal?.status === "stale"
                  ? "Needs a fresh review"
                  : proposal?.status === "dismissed"
                    ? "Not applied"
                    : "No plan change",
          changes,
          goals: data.goals.filter((goal) => goalIds.includes(goal.id)).map(ref),
          goalIds,
          goalTitle: data.goals.find((goal) => goal.id === owner)?.title ?? "Across your goals",
          sources: insight.sourceIds.map((id) => sourceView(data, id)),
          resultSources: (learning?.result?.sourceIds ?? []).map((id) => sourceView(data, id)),
          research: (decision.researchSources ?? []).filter((source) =>
            learning?.researchSourceIds.includes(source.id),
          ),
          learning: learning
            ? {
                recordId: optional(learning.recordId),
                goalIds: learning.goalIds ?? [],
                hypothesis: learning.hypothesis,
                experiment: learning.experiment,
                insight: learning.insight,
                nextHypothesis: learning.nextHypothesis,
                previousInsightId: learning.previousInsightId,
                transfer: optional(learning.transfer),
                result: learning.result,
                reasoning: learning.reasoning ?? null,
                grounding: bindings(learning.reasoning, decision.researchClaims),
              }
            : null,
        };
      }),
    )
    .filter((row) => !goalId || row.goalIds.includes(goalId));
}
export interface InsightsView extends ViewBase {
  tryingNow: LearningRow[];
  learned: LearningRow[];
  history: LearningRow[];
  observations: ObservationRow[];
  memories: MemoryView[];
  goals: GoalRef[];
}

const exposureLabels: Record<"unknown" | "not-used" | "used", string> = {
  unknown: "Not established",
  used: "Reported as used",
  "not-used": "Reported as not used",
};
function learningRow(data: Data, record: LearningRecord, today: string): LearningRow {
  const version = currentLearningVersion(record);
  const reviews = record.reviews.filter((review) => review.version === version.version);
  const review = reviews.at(-1);
  const reviewDate = review?.nextReviewAfter ?? version.test.reviewAfter;
  const goals = data.goals.filter((goal) => record.goalIds.includes(goal.id));
  return {
    recordId: record.id,
    version: version.version,
    activeVersion: optional(record.activeVersion),
    pendingVersion: optional(record.pendingVersion),
    state: record.state,
    standing: record.standing,
    statusLabel: learningStatus(record, today),
    standingLabel: learningStanding[record.standing],
    timingLabel: ["agreed", "reviewed"].includes(record.state)
      ? reviewDate
        ? `Review ${formatDate(reviewDate)}`
        : "Review when there’s useful feedback"
      : record.state === "suggested"
        ? "Your choice before we start"
        : `${reviews.length} ${reviews.length === 1 ? "review" : "reviews"} saved`,
    goals: goals.map(ref),
    change: version.test.change,
    observation: version.observation,
    hypothesis: version.hypothesis,
    behaviorSignal: version.test.behaviorSignal,
    mechanismSignal: version.test.mechanismSignal,
    outcomeSignal: version.test.outcomeSignal,
    prediction: version.test.prediction,
    reviewRule: version.test.reviewRule,
    comparison: version.test.comparison,
    design: version.test.design,
    alternatives: version.test.alternatives,
    transfer: version.transfer,
    start: version.test.start,
    reviewAfter: version.test.reviewAfter,
    nextReviewAfter: review?.nextReviewAfter ?? null,
    reports: record.reviews.length,
    latestReview: review
      ? {
          id: review.id,
          at: review.at,
          summary: review.summary,
          implication: review.implication,
          nextQuestion: review.nextQuestion,
          decision: review.decision,
          standing: review.standing,
          standingLabel: learningStanding[review.standing],
          exposure: review.exposure,
          exposureLabel: exposureLabels[review.exposure],
        }
      : null,
    ...learningDecision(record),
    attempts: learningAttempts(data, record, today),
    sources: version.sources
      .filter((source) => source.kind !== "measurement")
      .map((source) => sourceView(data, source.id, source.kind)),
    prompt: `Let's discuss “${version.test.change}” (${record.id}, version ${version.version}) and whether it fits me.`,
  };
}
function learningVersionView(data: Data, version: LearningRecord["versions"][number]): LearningVersionView {
  const decision = data.decisions.find((item) => item.id === version.decisionId);
  return {
    version: version.version,
    at: version.at,
    decisionId: version.decisionId,
    goalIds: version.goalIds ?? [],
    observation: version.observation,
    hypothesis: version.hypothesis,
    transfer: version.transfer,
    proposalId: version.proposalId,
    test: version.test,
    sources: version.sources,
    reasoning: version.reasoning,
    grounding: bindings(version.reasoning, decision?.researchClaims),
    researchSources: usedSources(version.reasoning, decision?.researchSources),
  };
}
export function insightsView(
  data: Data,
  options: ViewOptions & { goalId?: string; proposals?: Proposal[] },
): InsightsView {
  const today = dateInZone(data.timeZone, options.now ?? new Date());
  const records = (data.learning ?? []).filter(
    (record) => !options.goalId || record.goalIds.includes(options.goalId),
  );
  const live = records.filter(
    (record) =>
      Boolean(record.pendingVersion) ||
      ["suggested", "agreed", "paused"].includes(record.state) ||
      record.standing === "reconsider" ||
      (record.state === "reviewed" && record.reviews.at(-1)?.nextReviewAfter),
  );
  const past = records.filter((record) => !live.includes(record)).slice().reverse();
  return {
    revision: options.revision,
    today,
    tryingNow: live.map((record) => learningRow(data, record, today)),
    learned: past
      .filter((record) => record.reviews.length > 0)
      .map((record) => learningRow(data, record, today)),
    history: past
      .filter((record) => record.reviews.length === 0)
      .map((record) => learningRow(data, record, today)),
    observations: observationRows(data, options.proposals ?? [], options.goalId),
    memories: data.memories.map((memory) => {
      const corrections = (data.evidenceCorrections ?? []).filter(
        (correction) => correction.active && correction.source.id === memory.id,
      );
      return {
        id: memory.id,
        text: memory.text,
        date: memory.date,
        corrected: corrections.length > 0,
        corrections: corrections.map((correction) => ({
          id: correction.id,
          reason: correction.reason,
          at: correction.at,
        })),
      };
    }),
    goals: data.goals.map(ref),
  };
}
export function learningDetailView(
  data: Data,
  options: ViewOptions & { recordId: string },
): LearningDetailView {
  const today = dateInZone(data.timeZone, options.now ?? new Date());
  const record = (data.learning ?? []).find((item) => item.id === options.recordId);
  if (!record) throw Object.assign(new Error("This learning record isn’t here."), { status: 404 });
  const pending = record.versions.find((item) => item.version === record.pendingVersion);
  return {
    revision: options.revision,
    today,
    row: learningRow(data, record, today),
    versions: record.versions.map((version) => learningVersionView(data, version)),
    reviews: record.reviews.map((review) => ({
      ...review,
      standingLabel: learningStanding[review.standing],
      exposureLabel: exposureLabels[review.exposure],
    })),
    events: record.events,
    invalidations: record.invalidations,
    pending: pending ? learningVersionView(data, pending) : null,
  };
}

/* ---------------------------------------------------------------- calendar */

export interface CalendarDay {
  date: string;
  isToday: boolean;
  working: boolean;
}
export interface CalendarView extends ViewBase {
  weekStart: string;
  weekEnd: string;
  days: CalendarDay[];
  tentative: { id: string; goalId: string; goalTitle: string; title: string; start: string; end: string }[];
  blocks: (WorkBlockView & { goalTitle: string; actionOutcome: Outcome | null })[];
  busy: BusyInterval[];
  availability: {
    coverage: "checked" | "unknown";
    checkedAt: string | null;
    provider: string | null;
    start: string | null;
    end: string | null;
  };
  unplaced: { actionId: string; goalId: string; goalTitle: string; title: string; reason: string }[];
  overBudget: { week: string; minutes: number }[];
  review: { start: string; end: string } | null;
  workingHours: { start: string; end: string; days: number[]; sessionMinutes: number };
  timeZone: string;
  basis: string;
  calendars: { google: { configured: boolean; connected: boolean }; apple: { connected: boolean } } | null;
}

export function calendarView(
  data: Data,
  options: ViewOptions & {
    start?: string;
    calendars?: { google: { configured: boolean; connected: boolean }; apple: { connected: boolean } };
  },
): CalendarView {
  const now = options.now ?? new Date();
  const today = dateInZone(data.timeZone, now);
  const week = calendarWeek(options.start && /^\d{4}-\d{2}-\d{2}$/.test(options.start) ? options.start : today);
  const end = addDays(week, 7);
  const schedule = tentativeSchedule(data, week, end, now);
  const program = currentProgram(data);
  const snapshot = data.calendarSnapshot;
  return {
    revision: options.revision,
    today,
    weekStart: week,
    weekEnd: addDays(week, 6),
    days: Array.from({ length: 7 }, (_, index) => {
      const date = addDays(week, index);
      return {
        date,
        isToday: date === today,
        working: program.workDays.includes(new Date(`${date}T12:00:00Z`).getUTCDay()),
      };
    }),
    tentative: schedule.blocks.map((block) => ({
      id: block.id,
      goalId: block.goalId,
      goalTitle: goalTitle(data, block.goalId),
      title: block.title,
      start: block.start,
      end: block.end,
    })),
    blocks: data.workBlocks
      .filter(
        (block) =>
          dateInZone(data.timeZone, new Date(block.start)) < end &&
          dateInZone(data.timeZone, new Date(block.end)) >= week,
      )
      .map((block) => ({
        ...blockView(data, block.id)!,
        goalTitle: goalTitle(data, block.goalId),
        actionOutcome: optional(data.actions.find((action) => action.id === block.id)?.outcome),
      })),
    busy: schedule.busy,
    availability: {
      coverage: schedule.externalAvailability,
      checkedAt: optional(snapshot?.checkedAt),
      provider: optional(snapshot?.provider),
      start: optional(snapshot?.start),
      end: optional(snapshot?.end),
    },
    unplaced: schedule.unplaced.map((item) => ({
      actionId: item.actionId,
      goalId: item.goalId,
      goalTitle: goalTitle(data, item.goalId),
      title: data.actions.find((action) => action.id === item.actionId)?.title ?? "",
      reason: item.reason,
    })),
    overBudget: schedule.overBudget,
    review: reviewBlock(data, week, now),
    workingHours: {
      start: program.workStart,
      end: program.workEnd,
      days: program.workDays,
      sessionMinutes: program.sessionMinutes,
    },
    timeZone: data.timeZone,
    basis: schedule.basis,
    calendars: options.calendars ?? null,
  };
}

/* ------------------------------------------------------- session, settings */

export interface CoachStatus {
  configured: boolean;
  provider: string;
  model: string;
}
export interface CalendarStatus {
  google: { configured: boolean; connected: boolean };
  apple: { connected: boolean };
}
export interface PreferencesView {
  timeZone: string;
  theme: "light" | "dark";
  reviewDay: string;
  automation: Data["automation"];
}
export interface SessionView extends ViewBase {
  user: { id: string; username: string };
  preferences: PreferencesView;
  status: { coach: CoachStatus; calendars: CalendarStatus; serverKeysAllowed: boolean };
  counts: { goals: number; activeGoals: number; drafts: number; conversations: number };
  reviewDue: boolean;
  hasGoals: boolean;
}
export interface MethodView {
  id: string;
  name: string;
  question: string;
  action: string;
  example: string;
  evidence: string;
  source: string;
  url: string;
  limit: string;
  enabled: boolean;
}
export interface ProviderStatusView {
  selected: { provider: string; model: string; useServer: boolean };
  providers: {
    provider: string;
    defaultModel: string;
    personalConfigured: boolean;
    serverAvailable: boolean;
    testedAt: string | null;
  }[];
}
export interface ConnectionsView {
  configured: boolean;
  provider: string;
  number: string | null;
  publicUrl: string | null;
  link: { address: string; opted_out: number; last_inbound: number } | null;
  jobs: { id: string; kind: string; status: string; due: number; error: string | null }[];
  deliveries: {
    id: string;
    message_id: string | null;
    status: string;
    sid: string | null;
    at: number;
    error: string | null;
  }[];
}
export interface SettingsView extends ViewBase {
  user: { id: string; username: string };
  preferences: PreferencesView;
  status: { coach: CoachStatus; calendars: CalendarStatus; serverKeysAllowed: boolean };
  provider: ProviderStatusView;
  connections: ConnectionsView;
  tokens: { id: string; name: string; scope: string; expires: number }[];
  publicUrl: string | null;
  program: ProgramVersion;
  programs: { version: number; date: string; reason: string }[];
  methods: MethodView[];
  goals: GoalRef[];
}

export function sessionView(
  data: Data,
  options: ViewOptions & {
    user: { id: string; username: string };
    coach: CoachStatus;
    calendars: CalendarStatus;
    serverKeysAllowed: boolean;
  },
): SessionView {
  const now = options.now ?? new Date();
  return {
    revision: options.revision,
    today: dateInZone(data.timeZone, now),
    user: options.user,
    preferences: {
      timeZone: data.timeZone,
      theme: data.theme,
      reviewDay: data.reviewDay,
      automation: data.automation,
    },
    status: {
      coach: options.coach,
      calendars: options.calendars,
      serverKeysAllowed: options.serverKeysAllowed,
    },
    counts: {
      goals: data.goals.length,
      activeGoals: data.goals.filter((goal) => goal.status === "Active").length,
      drafts: data.goals.filter((goal) => goal.status === "Draft").length,
      conversations: data.conversations.length,
    },
    reviewDue: todayStep(data, now).review,
    hasGoals: data.goals.length > 0,
  };
}
export function settingsView(
  data: Data,
  options: ViewOptions & {
    user: { id: string; username: string };
    coach: CoachStatus;
    calendars: CalendarStatus;
    serverKeysAllowed: boolean;
    provider: ProviderStatusView;
    connections: ConnectionsView;
    tokens: { id: string; name: string; scope: string; expires: number }[];
    publicUrl: string | null;
  },
): SettingsView {
  const program = currentProgram(data);
  return {
    revision: options.revision,
    today: dateInZone(data.timeZone, options.now ?? new Date()),
    user: options.user,
    preferences: {
      timeZone: data.timeZone,
      theme: data.theme,
      reviewDay: data.reviewDay,
      automation: data.automation,
    },
    status: {
      coach: options.coach,
      calendars: options.calendars,
      serverKeysAllowed: options.serverKeysAllowed,
    },
    provider: options.provider,
    connections: options.connections,
    tokens: options.tokens,
    publicUrl: options.publicUrl,
    program,
    programs: data.programs.map((item) => ({
      version: item.version,
      date: item.date,
      reason: item.reason,
    })),
    methods: METHODS.map((method) => ({
      ...method,
      enabled: program.enabledMethods.includes(method.id),
    })),
    goals: data.goals.map(ref),
  };
}
