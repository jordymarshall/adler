import { planningBasisSchema, researchSearchSchema } from "./planning.ts";
import { z } from "zod";
import type { Data, Goal, Action } from "./workspace.ts";
import { reactionTypes } from "./workspace.ts";
import { METHODS } from "../src/methods.ts";
import { adaptivePlanSchema, assessmentStateSchema, materializePlan, validateAdaptiveWork } from "./adaptive-plan.ts";
import { forecastSchema } from "./forecast.ts";
const id = z.string().min(1).max(100);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
    "Use a valid date.",
  );
const text = z.string().max(5000);
export const milestoneSchema = z
  .object({
    id,
    title: text,
    criterion: text,
    done: z.boolean(),
    dueDate: date.optional(),
    completedAt: date.optional(),
  })
  .strict();
export const checkpointSchema = z
  .object({ id, date, value: z.number().min(0).max(1000000), label: text })
  .strict();
export const resultSchema = z
  .object({ id, date, value: z.number().min(0).max(1000000), source: text })
  .strict();
export const planSchema = z
  .object({
    adaptive: adaptivePlanSchema.optional(),
    version: z.number().int().positive(),
    basis: planningBasisSchema.optional(),
    durationMinutes: z.number().int().min(1).max(1440).optional(),
    action: text,
    timing: text,
    criterion: text,
    date,
  })
  .strict();
export const measureSchema = z
  .object({
    label: z.string().trim().min(1).max(150),
    unit: z.string().trim().min(1).max(50),
    target: z.number().positive().max(1000000),
    baseline: z.number().min(0).max(1000000).nullable(),
    aggregation: z.enum(["cumulative", "level", "period"]).optional(),
    period: z.string().trim().min(1).max(150).optional(),
  })
  .strict();
export const conversationSchema = z
  .object({
    id,
    title: z.string().trim().min(1).max(200),
    goalId: id,
    createdAt: z.iso.datetime({ offset: true }),
  })
  .strict();
export const goalSchema = z
  .object({
    forecasts: z.array(forecastSchema).max(100).optional(),
    assessment: assessmentStateSchema.optional(),
    id,
    title: z.string().trim().min(1).max(300),
    kind: z.enum(["project", "learning", "practical"]),
    why: text,
    success: text,
    status: z.enum(["Draft", "Active", "Paused", "Completed", "Set aside"]),
    area: z.enum(["Unassigned", "Career", "Learning", "Personal"]).optional(),
    organizationVersion: z.number().int().optional(),
    tags: z.array(z.string().max(50)).max(8).optional(),
    priority: z.enum(["Focus", "Maintain", "Later"]).optional(),
    targetDate: date.optional(),
    deadline: z.enum(["firm", "preferred", "none"]).optional(),
    startDate: date.optional(),
    target: z.number().min(1).max(1000000).optional(),
    unit: z.string().max(150).optional(),
    measure: measureSchema.optional(),
    measurementHistory: z.array(z.object({ date, label: text, unit: text, results: z.array(resultSchema).max(5000), reason: text }).strict()).max(100).optional(),
    checkpoints: z.array(checkpointSchema).max(100).optional(),
    outcomeUpdatedAt: date.optional(),
    checkpointHistory: z
      .array(
        z.object({
          date: text,
          checkpoints: z.array(checkpointSchema),
          targetDate: text,
          reason: text,
        }),
      )
      .optional(),
    milestones: z.array(milestoneSchema).max(100),
    plans: z.array(planSchema).min(1).max(1000),
    results: z.array(resultSchema).max(5000),
    trial: z
      .object({
        state: z.enum(["Suggested", "Trying", "Set aside", "Reviewed"]),
        version: z.number(),
        sourceId: id,
      })
      .optional(),
  })
  .strict();
export const actionSchema = z
  .object({
    id,
    goalId: id,
    title: text,
    criterion: text,
    timing: text,
    date: z.union([date, z.literal("")]),
    planVersion: z.number().int().positive(),
    stepId: z.string().max(80).optional(),
    occurrence: z.string().max(100).optional(),
    retiredAt: date.optional(),
    startedAt: z.iso.datetime().optional(),
    outcome: z.enum(["Done", "Partly", "Didn’t happen"]).optional(),
    amount: z.number().min(0).max(1000000).optional(),
    actualMinutes: z.number().min(0).max(1440).optional(),
    note: text.optional(),
    unplanned: z.boolean().optional(),
    history: z
      .array(
        z.object({
          outcome: z.enum(["Done", "Partly", "Didn’t happen"]).optional(),
    amount: z.number().min(0).max(1000000).optional(),
          actualMinutes: z.number().min(0).max(1440).optional(),
          note: text.optional(),
          at: text,
        }),
      )
      .max(1000),
  })
  .strict();
export const programSchema = z
  .object({
    version: z.number().int().positive(),
    date,
    focusGoalId: z.string().max(100),
    sprintStart: date,
    sprintEnd: date,
    sprintResult: text,
    weeklyMinutes: z.number().int().min(15).max(2400),
    workStart: z.string().regex(/^\d\d:\d\d$/),
    workEnd: z.string().regex(/^\d\d:\d\d$/),
    workDays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
    sessionMinutes: z.number().int().min(5).max(240),
    reviewDay: z.enum([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ]),
    enabledMethods: z.array(z.enum(METHODS.map((m) => m.id))).max(7),
    approach: text,
    reason: text,
  })
  .strict();
export const reviewSchema = z
  .object({
    periodStart: date.optional(),
    periodEnd: date.optional(),
    step: z.number().int().min(0).max(5),
    note: text,
    decision: text,
    completedAt: text.optional(),
  })
  .strict();
export const insightSchema = z
  .object({
    finding: z.string().trim().min(1).max(1000),
    status: z.enum(["Reported", "To test"]),
    sourceIds: z.array(id).min(1).max(10),
    changeIndexes: z.array(z.number().int().min(0)).max(20),
  })
  .strict();
const decisionSchema = z
  .object({
    id,
    date: text,
    goalId: z.string(),
    insights: z.array(insightSchema).max(6).optional(),
    research: z.array(researchSearchSchema.omit({ sources: true }).extend({ sourceCount: z.number().int().min(0).max(18) })).max(2).optional(),
    programVersion: z.number(),
    planVersion: z.number(),
    mode: z.enum(["live", "guided"]),
    checks: z.array(
      z.object({
        id,
        label: text,
        finding: text,
        sources: z.array(z.string()),
      }),
    ),
    methods: z.array(z.string()),
    summary: text,
    proposal: z
      .object({
        title: text,
        action: text,
        criterion: text,
        timing: text,
        reason: text,
        reviewAfter: text,
      })
      .optional(),
    status: z.enum([
      "Suggested",
      "Accepted",
      "Kept plan",
      "No change",
      "Reviewed",
    ]),
    review: z
      .object({ date: text, note: text, choice: z.enum(["Keep", "Revisit"]) })
      .optional(),
  })
  .strict();
export const workBlockSchema = z
  .object({
    id,
    goalId: id,
    action: text,
    start: z.iso.datetime({ offset: true }),
    end: z.iso.datetime({ offset: true }),
    provider: z.enum(["local", "google", "apple"]),
    eventId: text.optional(),
    checkInId: text.optional(),
    status: z.enum(["Scheduled", "Done", "Partly", "Didn’t happen"]),
  })
  .strict();
const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
export const automationSchema = z
  .object({
    enabled: z.boolean(),
    reviewTime: time,
    quietStart: time,
    quietEnd: time,
  })
  .strict();
const workspaceSchema = z
  .object({
    schema: z.literal(1),
    goals: z.array(goalSchema).max(100),
    actions: z.array(actionSchema).max(10000),
    messages: z
      .array(
        z
          .object({
            id,
            goalId: text,
            role: z.enum(["user", "coach"]),
            text,
            decisionId: id.optional(),
            conversationId: id.optional(),
            references: z.array(z.object({ text: z.string().min(1).max(500), recordId: z.string().max(100) }).strict()).max(30).optional(),
            links: z
              .array(
                z.object({ goalId: id, tab: z.enum(["progress", "plan"]) }),
              )
              .max(20)
              .optional(),
            channel: z
              .enum(["web", "sms", "imessage", "rcs", "whatsapp", "mcp", "job"])
              .optional(),
            reactions: z
              .object({
                user: z
                  .object({
                    type: z.enum(reactionTypes).nullable(),
                    at: z.iso.datetime({ offset: true }),
                  })
                  .optional(),
                coach: z
                  .object({
                    type: z.enum(reactionTypes).nullable(),
                    at: z.iso.datetime({ offset: true }),
                  })
                  .optional(),
              })
              .strict()
              .optional(),
            at: text.optional(),
          })
          .strict(),
      )
      .max(10000),
    conversations: z.array(conversationSchema).max(500).default([]),
    memories: z.array(z.object({ id, text, date })).max(300),
    review: reviewSchema,
    reviews: z.array(reviewSchema).max(1000),
    reviewDay: programSchema.shape.reviewDay,
    theme: z.enum(["light", "dark"]),
    timeZone: z.string().max(100),
    goalDraft: z.record(z.string().max(100), z.string().max(5000)),
    programs: z.array(programSchema).min(1).max(1000),
    workBlocks: z.array(workBlockSchema).max(5000),
    decisions: z.array(decisionSchema).max(3000),
    automation: automationSchema,
    calendarSnapshot: z
      .object({
        busy: z.array(z.object({ start: text, end: text })).max(10000),
        checkedAt: text,
        provider: text,
        start: text,
        end: text,
      })
      .optional(),
  })
  .strict();
export function validateWorkspace(input: unknown, previous?: Data): Data {
  const data = workspaceSchema.parse(input) as Data;
  new Intl.DateTimeFormat("en", { timeZone: data.timeZone });
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: data.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const ids = new Set(data.goals.map((g) => g.id));
  if (data.actions.some((a) => a.outcome && a.date > today))
    throw new Error("Future actions cannot have an outcome yet.");
  for (const block of data.workBlocks)
    if (Date.parse(block.end) <= Date.parse(block.start))
      throw new Error("A work block must end after it starts.");
  for (const list of [
    data.goals,
    data.actions,
    data.memories,
    data.workBlocks,
    data.messages,
    data.conversations,
  ])
    if (new Set(list.map((x) => x.id)).size !== list.length)
      throw new Error("Duplicate record IDs are not allowed.");
  for (const action of [...data.actions, ...data.workBlocks])
    if (!ids.has(action.goalId))
      throw new Error("An action must belong to an existing goal.");
  for (const program of data.programs)
    if (
      program.sprintEnd < program.sprintStart ||
      program.workEnd <= program.workStart
    )
      throw new Error("Check the sprint dates and work hours.");
  for (const goal of data.goals) {
    for (const list of [goal.milestones, goal.results, goal.checkpoints ?? []])
      if (new Set(list.map((m) => m.id)).size !== list.length)
        throw new Error("Goal records need unique IDs.");
    if (goal.results.some((r) => r.date > today))
      throw new Error("Future results cannot be recorded yet.");
    if (
      !goal.measure &&
      goal.kind === "learning" &&
      goal.results.some((r) => r.value > 10)
    )
      throw new Error("Learning assessments use a scale of 0–10.");
  }
  validateAdaptiveWork(data, previous);
  return data;
}
export const createGoalSchema = z
  .object({
    adaptive: adaptivePlanSchema.optional(),
    status: z.enum(["Draft", "Active"]).optional(),
    basis: planningBasisSchema.optional(),
    durationMinutes: z.number().int().min(1).max(1440).optional(),
    title: z.string().trim().min(1).max(300),
    kind: z.enum(["project", "learning", "practical"]),
    why: text,
    success: z.string().trim().min(1).max(1500),
    area: z.enum(["Unassigned", "Career", "Learning", "Personal"]),
    tags: z.array(z.string().max(50)).max(8),
    targetDate: z.union([date, z.literal("")]),
    deadline: z.enum(["firm", "preferred", "none"]).optional(),
    milestones: z
      .array(z.object({ id: id.optional(), title: text, criterion: text, dueDate: date.optional() }))
      .max(30),
    measure: measureSchema.optional(),
    assessmentTarget: z.number().int().min(1).max(10),
    baseline: z.number().min(0).max(10).nullable(),
    baselineDate: date.optional(),
    actionDate: date.optional(),
    action: text,
    criterion: text,
    timing: text,
  })
  .strict();
export type GoalInput = z.infer<typeof createGoalSchema>;
export function createGoal(
  data: Data,
  input: GoalInput,
  today: string,
  recordId: string = crypto.randomUUID(),
) {
  input = createGoalSchema.parse(input);
  if (input.targetDate && input.targetDate < today)
    throw new Error("Choose today or a future target date for a new goal.");
  if (input.baselineDate && input.baselineDate > today)
    throw new Error("The starting observation cannot be in the future.");
  const practice = !input.targetDate && input.adaptive?.steps.some(s => s.type === "behavior") && !input.milestones.length && !input.measure;
  if (!practice && !input.measure && input.kind !== "learning" && !input.milestones.length)
    throw new Error("Choose an outcome measure or a verifiable deliverable.");
  if (input.deadline === "none" && input.targetDate)
    throw new Error("Use an empty targetDate when the goal has no deadline.");
  const goal: Goal = {
    ...(input.measure ? { measure: input.measure } : {}),
    id: recordId,
    title: input.title,
    kind: input.kind,
    why: input.why,
    success: input.success,
    area: input.area,
    tags: input.tags,
    status: input.status ?? "Active",
    priority: data.goals.length ? "Maintain" : "Focus",
    startDate: today,
    ...(input.targetDate ? { targetDate: input.targetDate } : {}),
    deadline: input.deadline ?? (input.targetDate ? "preferred" : "none"),
    target: practice ? undefined : input.measure
      ? input.measure.target
      : input.kind === "learning"
        ? input.assessmentTarget
        : input.milestones.length,
    unit: practice ? undefined : input.measure
      ? input.measure.unit
      : input.kind === "learning"
        ? "correct answers / 10"
        : "milestones verified",
    milestones: input.milestones.map((m) => ({
      ...m,
      id: m.id ?? crypto.randomUUID(),
      done: false,
    })),
    plans: [
      {
        version: 1,
        date: today,
        action: input.adaptive?.steps[0].title ?? input.action,
        criterion: input.adaptive?.steps[0].criterion ?? input.criterion,
        timing: input.adaptive?.steps[0].cue ?? input.timing,
        ...(input.basis ? { basis: input.basis } : {}),
        ...(input.adaptive ? { adaptive: input.adaptive } : {}),
        ...(input.adaptive ? { durationMinutes: input.adaptive.steps[0].durationMinutes } : input.durationMinutes ? { durationMinutes: input.durationMinutes } : {}),
      },
    ],
    results: [],
  };
  goal.checkpoints = input.targetDate ? [
    {
      id: crypto.randomUUID(),
      date: input.targetDate,
      value: goal.target!,
      label: "Target result",
    },
  ] : [];
  const baseline = practice ? null : input.measure
    ? input.measure.baseline
    : input.kind === "learning"
      ? input.baseline
      : 0;
  if (baseline !== null) {
    const baselineDate = input.baselineDate ?? today;
    goal.results.push({
      id: crypto.randomUUID(),
      date: baselineDate,
      value: baseline,
      source: input.measure
        ? "Starting result reported by you"
        : input.kind === "learning"
          ? "Starting assessment reported by you"
          : "Starting baseline: no milestones verified yet",
    });
    goal.outcomeUpdatedAt = baselineDate;
    goal.checkpoints.unshift({
      id: crypto.randomUUID(),
      date: baselineDate,
      value: goal.results[0].value,
      label: "Starting point",
    });
  }
  data.goals.push(goal);
  const action: Action = {
    id: crypto.randomUUID(),
    goalId: goal.id,
    title: input.action,
    criterion: input.criterion,
    timing: input.timing,
    date: input.actionDate ?? "",
    planVersion: 1,
    history: [],
  };
  if (input.adaptive) materializePlan(data, goal, today);
  else data.actions.push(action);
  if (!data.programs.at(-1)!.focusGoalId)
    data.programs.push({
      ...data.programs.at(-1)!,
      version: data.programs.at(-1)!.version + 1,
      date: today,
      focusGoalId: goal.id,
      sprintResult: input.action,
      reason: "Set the first goal as the program focus.",
    });
  return goal;
}
