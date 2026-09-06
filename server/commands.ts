import { reviewSchedule } from "../shared/journey.ts";
import { planningBasisSchema } from "../shared/planning.ts";
import { z } from "zod";
import { createHash, randomUUID } from "node:crypto";
import {
  currentPlan,
  startGoal,
  currentProgram,
  reviseProgram,
  recordAction,
  applyPlan,
  type Data,
} from "../shared/workspace.ts";
import {
  validateWorkspace,
  createGoalSchema,
  createGoal,
  milestoneSchema,
  checkpointSchema,
  resultSchema,
  actionSchema,
  programSchema,
  automationSchema,
  conversationSchema,
  measureSchema,
} from "../shared/validation.ts";
export const changeSchema = z
  .object({
    entity: z.enum([
      "goal",
      "plan",
      "milestone",
      "checkpoint",
      "action",
      "result",
      "memory",
      "program",
      "review",
      "preferences",
      "workBlock",
      "conversation",
    ]),
    operation: z.enum(["create", "update", "delete"]),
    id: z.string().max(100).nullable(),
    parentId: z.string().max(100).nullable(),
    reason: z
      .string()
      .trim()
      .min(1)
      .max(1200)
      .describe(
        "A brief, user-facing reason for this specific change, grounded in the user's request or records.",
      )
      .optional(),
    values: z
      .string()
      .max(120000)
      .describe(
        "JSON object containing only the fields to set, according to the command catalog. Use {} for deletion.",
      ),
  })
  .strict();
export type Change = z.infer<typeof changeSchema>;
const str = z.string().max(5000);
export const commandCatalog = {
  conversation:
    "create: {title,goalId}, goalId=general for cross-goal chats. update: title or goalId. delete removes this conversation and its messages, keeping goals and saved records.",
  goal:
    "create: " +
    JSON.stringify(z.toJSONSchema(createGoalSchema)) +
    "; update: title,why,success,area,tags,priority,targetDate,status,target (measured goals only),measure (label,unit,target,baseline; changing measurement archives prior results); delete removes the goal and its actions/results. id identifies goal.",
  plan: "update only: parentId=goal ID; values={action,criterion,timing,durationMinutes?,basis?}; basis uses the same schema as goal creation. Creates a new plan version and preserves recorded work.",
  milestone:
    "parentId=goal ID. create/update: {title,criterion,done,dueDate?}. id for existing milestone. Toggling done records the verified outcome. delete removes milestone and revises future target.",
  checkpoint:
    "parentId=goal ID. create/update: {date,value,label}. id identifies checkpoint. Values are cumulative expected results.",
  action:
    "parentId=goal ID for create. values={title,criterion,timing,date,outcome?,note?,amount?}. Use an empty date for unscheduled. outcome is Done, Partly, or Didn’t happen. update/delete use id.",
  result:
    "parentId=goal ID with measure or learning assessment. create/update: {value,date,source}; use the goal’s measurement and only user-reported values. Legacy assessments use 0–10. For milestone-count goals, change milestone.done instead. delete uses id.",
  memory:
    "create/update: {text}. delete uses id. Save only user-confirmed context.",
  program:
    "update: any current program field except version/date; include reason. Fields: focusGoalId,sprintStart,sprintEnd,sprintResult,weeklyMinutes,workStart,workEnd,workDays (0=Sunday),sessionMinutes,reviewDay,enabledMethods,approach,reason.",
  review:
    "update: {note,decision,complete:boolean}. A completed review is archived and visible across channels.",
  preferences:
    "update: theme (light/dark), timeZone (IANA), automation ({enabled,reviewTime,quietStart,quietEnd}). Provider credentials and phone/token administration require authenticated settings.",
  workBlock:
    "create: parentId=goal ID; {action,start,end}, ISO timestamps with timezone. Creates an Adler-only work block and check-in action. update/delete may change/remove local blocks. For an external booking, also include provider (google/apple), calendarId, conflictIds (all calendars to check), and checkIn (boolean). Read connected calendar availability first. A confirmed proposal creates the events; credentials stay in Settings.",
};
export const changesHash = (changes: Change[]) =>
  createHash("sha256").update(JSON.stringify(changes)).digest("hex");
export function applyChanges(
  input: Data,
  changes: Change[],
  today: string,
): Data {
  const data = structuredClone(input);
  for (const raw of changes) {
    const change = changeSchema.parse(raw);
    const values = JSON.parse(change.values);
    if (!values || Array.isArray(values) || typeof values !== "object")
      throw new Error("Change values must be a JSON object.");
    const id = change.id ?? crypto.randomUUID();
    const goal = data.goals.find(
      (g) => g.id === (change.parentId ?? change.id),
    );
    if (change.entity === "conversation") {
      const existing = data.conversations.find((c) => c.id === id);
      if (change.operation === "delete") {
        if (!existing) throw new Error("Conversation not found.");
        data.conversations = data.conversations.filter((c) => c.id !== id);
        data.messages = data.messages.filter((m) => m.conversationId !== id);
      } else {
        if (change.operation === "update" && !existing)
          throw new Error("Conversation not found.");
        const fields = conversationSchema
          .pick({ title: true, goalId: true })
          .partial()
          .strict()
          .parse(values);
        const record = conversationSchema.parse({
          ...existing,
          ...fields,
          id,
          createdAt: existing?.createdAt ?? new Date().toISOString(),
        });
        if (
          record.goalId !== "general" &&
          !data.goals.some((g) => g.id === record.goalId)
        )
          throw new Error("Choose an existing goal for this conversation.");
        if (existing) Object.assign(existing, record);
        else data.conversations.push(record);
      }
    } else if (change.entity === "goal") {
      if (change.operation === "create") {
        if (data.goals.some((g) => g.id === id))
          throw new Error("This goal ID already exists.");
        createGoal(data, createGoalSchema.parse(values), today, id);
      } else {
        if (!goal) throw new Error("Goal not found.");
        if (change.operation === "delete") {
          data.goals = data.goals.filter((g) => g.id !== goal.id);
          data.conversations
            .filter((c) => c.goalId === goal.id)
            .forEach((c) => {
              c.goalId = "general";
            });
          data.actions = data.actions.filter((a) => a.goalId !== goal.id);
          data.workBlocks = data.workBlocks.filter((b) => b.goalId !== goal.id);
          if (currentProgram(data).focusGoalId === goal.id)
            reviseProgram(data, currentProgram(data).version, {
              focusGoalId: "",
              reason: "Removed the previous focus goal.",
            });
        } else {
          const patch = z
            .object({
              title: str,
              why: str,
              success: str,
              area: z.enum(["Unassigned", "Career", "Learning", "Personal"]),
              tags: z.array(z.string().max(50)).max(8),
              priority: z.enum(["Focus", "Maintain", "Later"]),
              targetDate: str,
              target: z.number().positive().max(1000000),
              measure: measureSchema,
              status: z.enum(["Draft", "Active", "Paused", "Completed", "Set aside"]),
            })
            .partial()
            .strict()
            .parse(values);
          if (patch.measure && JSON.stringify(patch.measure) !== JSON.stringify(goal.measure)) {
            if (patch.target !== undefined && patch.target !== patch.measure.target) throw new Error("Use one consistent measurement target.");
            goal.measurementHistory ??= [];
            goal.measurementHistory.push({ date: today, label: goal.measure?.label ?? goal.success, unit: goal.unit ?? "milestones", results: structuredClone(goal.results), reason: change.reason ?? "Measurement revised." });
            goal.results = patch.measure.baseline === null ? [] : [{ id: randomUUID(), date: today, value: patch.measure.baseline, source: "Starting result reported for the new measurement" }];
            goal.outcomeUpdatedAt = goal.results.at(-1)?.date;
            goal.target = patch.measure.target;
            goal.unit = patch.measure.unit;
            goal.checkpointHistory ??= [];
            goal.checkpointHistory.push({ date: new Date().toISOString(), checkpoints: structuredClone(goal.checkpoints ?? []), targetDate: goal.targetDate ?? "", reason: change.reason ?? "Measurement revised." });
            goal.checkpoints = [{ id: randomUUID(), date: patch.targetDate ?? goal.targetDate ?? today, value: patch.measure.target, label: "Target result" }];
            if (patch.measure.baseline !== null) goal.checkpoints.unshift({ id: randomUUID(), date: today, value: patch.measure.baseline, label: "Starting point" });
            goal.measure = patch.measure;
            if (!changes.some((change) => change.entity === "plan" && change.parentId === goal.id)) {
              const previous = currentPlan(goal);
              goal.plans.push({ action: previous.action, timing: previous.timing, criterion: previous.criterion, ...(previous.durationMinutes ? { durationMinutes: previous.durationMinutes } : {}), version: previous.version + 1, date: today });
            }
          }
          if (patch.target !== undefined) {
            if (!goal.measure)
              throw new Error(
                "Change milestones to revise a milestone-count target.",
              );
            goal.measure.target = patch.target;
            const final = goal.checkpoints?.find(
              (p) => p.date === goal.targetDate,
            );
            if (final) final.value = patch.target;
          }
          if (patch.status === "Active") startGoal(data, goal.id);
          Object.assign(goal, patch);
          goal.organizationVersion = (goal.organizationVersion ?? 0) + 1;
        }
      }
    } else if (change.entity === "plan") {
      if (!goal || change.operation !== "update")
        throw new Error("Select an existing goal to revise its plan.");
      applyPlan(
        data,
        goal.id,
        currentPlan(goal).version,
        z
          .object({ action: str, criterion: str, timing: str, basis: planningBasisSchema.optional(), durationMinutes: z.number().int().min(5).max(240).optional() })
          .strict()
          .parse(values),
      );
    } else if (["milestone", "checkpoint", "result"].includes(change.entity)) {
      if (!goal) throw new Error("Select the goal that owns this record.");
      if (
        change.entity === "result" &&
        !goal.measure &&
        goal.kind !== "learning"
      )
        throw new Error("Verify a milestone to update this goal’s result.");
      const key =
        change.entity === "milestone"
          ? "milestones"
          : change.entity === "checkpoint"
            ? "checkpoints"
            : "results";
      const list = (goal[key] ??= []) as { id: string }[];
      const existing = list.find((x) => x.id === id);
      if (change.operation !== "create" && !existing)
        throw new Error("Record not found.");
      if (change.entity === "checkpoint")
        goal.checkpointHistory = [
          ...(goal.checkpointHistory ?? []),
          {
            date: new Date().toISOString(),
            checkpoints: structuredClone(goal.checkpoints ?? []),
            targetDate: goal.targetDate ?? "",
            reason: "Checkpoint revision approved through chat or MCP.",
          },
        ];
      if (change.operation === "delete")
        list.splice(
          list.findIndex((x) => x.id === id),
          1,
        );
      else {
        const schema =
          change.entity === "milestone"
            ? milestoneSchema
            : change.entity === "checkpoint"
              ? checkpointSchema
              : resultSchema;
        const record = schema.parse({
          ...existing,
          ...(change.entity === "milestone" ? { done: false } : {}),
          ...existing,
          ...values,
          id,
        });
        if (existing) Object.assign(existing, record);
        else list.push(record);
      }
      if (
        change.entity === "milestone" &&
        !goal.measure &&
        goal.kind !== "learning"
      ) {
        goal.results.push({
          id: crypto.randomUUID(),
          date: today,
          value: goal.milestones.filter((m) => m.done).length,
          source: `${change.operation} milestone: ${String(values.title ?? id)}`,
        });
        goal.outcomeUpdatedAt = today;
        goal.target = goal.milestones.length;
        const final = goal.checkpoints?.find((p) => p.date === goal.targetDate);
        if (final) final.value = goal.target;
      }
      if (change.entity === "result") {
        goal.results.sort((a, b) => a.date.localeCompare(b.date));
        goal.outcomeUpdatedAt = goal.results.at(-1)?.date;
      }
      goal.organizationVersion = (goal.organizationVersion ?? 0) + 1;
    } else if (change.entity === "action") {
      const existing = data.actions.find((a) => a.id === id);
      if (change.operation === "delete") {
        if (!existing) throw new Error("Action not found.");
        data.actions = data.actions.filter((a) => a.id !== id);
      } else if (change.operation === "create") {
        if (!goal) throw new Error("Select a goal for the action.");
        const fields = actionSchema
          .omit({ id: true, goalId: true, planVersion: true, history: true })
          .parse({ date: "", timing: "Unscheduled", ...values });
        data.actions.push({
          id,
          goalId: goal.id,
          planVersion: currentPlan(goal).version,
          history: [],
          ...fields,
        });
      } else {
        if (!existing) throw new Error("Action not found.");
        const patch = actionSchema
          .omit({ id: true, goalId: true, planVersion: true, history: true })
          .partial()
          .strict()
          .parse(values);
        if (patch.outcome !== undefined || patch.note !== undefined)
          recordAction(data, id, patch.outcome ?? existing.outcome, patch.note, patch.amount ?? existing.amount);
        Object.assign(existing, patch);
      }
    } else if (change.entity === "memory") {
      const existing = data.memories.find((m) => m.id === id);
      if (change.operation === "delete") {
        if (!existing) throw new Error("Context record not found.");
        data.memories = data.memories.filter((m) => m.id !== id);
      } else {
        const value = z
          .object({ text: z.string().trim().min(1).max(500) })
          .strict()
          .parse(values);
        if (existing) Object.assign(existing, value, { date: today });
        else if (change.operation === "create")
          data.memories.push({ id, date: today, ...value });
        else throw new Error("Context record not found.");
      }
    } else if (change.entity === "program") {
      if (change.operation !== "update")
        throw new Error(
          "Revise the current program instead of replacing its history.",
        );
      const patch = programSchema
        .omit({ version: true, date: true })
        .partial()
        .strict()
        .parse(values);
      if (!patch.reason) throw new Error("A program revision needs a reason.");
      reviseProgram(data, currentProgram(data).version, patch);
    } else if (change.entity === "review") {
      if (change.operation !== "update")
        throw new Error("Reviews support updates only.");
      const value = z
        .object({ note: str, decision: str, complete: z.boolean() })
        .strict()
        .parse(values);
      const period = reviewSchedule(data);
      const review = {
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        note: value.note,
        decision: value.decision,
        step: value.complete ? 3 : 1,
        ...(value.complete ? { completedAt: new Date().toISOString() } : {}),
      };
      data.review = review;
      if (value.complete) data.reviews.push(review);
    } else if (change.entity === "preferences") {
      if (change.operation !== "update")
        throw new Error("Preferences support updates only.");
      const patch = z
        .object({
          theme: z.enum(["light", "dark"]),
          timeZone: str,
          automation: automationSchema,
        })
        .partial()
        .strict()
        .parse(values);
      Object.assign(data, patch);
    } else if (change.entity === "workBlock") {
      const existing = data.workBlocks.find((b) => b.id === id);
      if (existing && existing.provider !== "local")
        throw new Error("Manage this external event in Calendar.");
      if (change.operation === "delete") {
        data.workBlocks = data.workBlocks.filter((b) => b.id !== id);
        data.actions = data.actions.filter((a) => a.id !== id);
      } else {
        const fields = z.object({
          action: str,
          start: z.iso.datetime({ offset: true }),
          end: z.iso.datetime({ offset: true }),
          provider: z.enum(["local", "google", "apple"]).optional(),
          calendarId: z.string().max(2000).optional(),
          conflictIds: z.array(z.string().max(2000)).min(1).max(30).optional(),
          checkIn: z.boolean().optional(),
        });
        const patch = fields.partial().strict().parse(values);
        const value = fields.parse({ ...existing, ...patch });
        const owner = data.goals.find(
          (g) => g.id === (change.parentId ?? existing?.goalId),
        );
        if (!owner) throw new Error("Select a goal for this time block.");
        if (
          Date.parse(value.end) <= Date.parse(value.start) ||
          Date.parse(value.start) <= Date.now()
        )
          throw new Error("Choose a future work block with a valid end time.");
        if (existing)
          Object.assign(existing, {
            action: value.action,
            start: value.start,
            end: value.end,
          });
        else {
          if (
            value.provider &&
            value.provider !== "local" &&
            (!value.calendarId ||
              !value.conflictIds ||
              value.checkIn === undefined)
          )
            throw new Error(
              "An external booking needs its calendar, conflict calendars, and check-in choice.",
            );
          data.workBlocks.push({
            id,
            goalId: owner.id,
            provider: value.provider ?? "local",
            status: "Scheduled",
            action: value.action,
            start: value.start,
            end: value.end,
          });
        }
        const action = data.actions.find((a) => a.id === id);
        if (!action)
          data.actions = data.actions.filter(
            (a) =>
              a.goalId !== owner.id ||
              a.date ||
              a.outcome ||
              a.title !== value.action,
          );
        const actionValues = {
          title: value.action,
          date: new Intl.DateTimeFormat("en-CA", {
            timeZone: data.timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date(value.start)),
          timing: value.start,
        };
        if (action) Object.assign(action, actionValues);
        else
          data.actions.push({
            id,
            goalId: owner.id,
            criterion: currentPlan(owner).criterion,
            planVersion: currentPlan(owner).version,
            history: [],
            ...actionValues,
          });
      }
    }
  }
  return validateWorkspace(data);
}
