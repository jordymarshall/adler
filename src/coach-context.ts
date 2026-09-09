import { currentLearningVersion } from "../shared/learning.ts";
import { checkInContext } from "../shared/check-in-context.ts";
import { reviewSchedule } from "../shared/journey.ts";
import type { Data } from "../shared/workspace.ts";
import type { DecisionCheck } from "./program-types.ts";
import { METHODS } from "./methods.ts";
import { planProgress } from "../shared/adaptive-plan.ts";
import { executionSummary, cycleEvidence } from "../shared/goal-execution.ts";
import { goalProjection } from "../shared/goal-projection.ts";
import { calendarWeek, tentativeSchedule } from "../shared/tentative-schedule.ts";
import { addDays } from "../shared/journey.ts";

export function coachingGoal(goal: Data["goals"][number]) {
  const { forecasts: _forecasts, ...rest } = goal;
  return { ...rest, plans: goal.plans.map(p => {
    if (!p.adaptive) return p;
    const { forecast: _forecast, ...adaptive } = p.adaptive;
    return { ...p, adaptive };
  }) };
}

export function coachingContext(
  data: Data,
  goalId: string,
  message: string,
  today: string,
  conversationId?: string,
) {
  data = { ...data, goals: data.goals.map(coachingGoal) };
  const program = data.programs.at(-1)!;
  const goal = data.goals.find((g) => g.id === goalId);
  const goals = data.goals.filter((g) => g.status === "Active");
  const actions = data.actions.slice(-60);
  const messages = data.messages.filter(message => conversationId ? message.conversationId === conversationId : goalId === "general" || message.goalId === goalId);
  const recentMessages = messages.slice(-12);
  const earlierReports = messages.slice(0, -12).filter(message =>
    message.role === "user" && message.channel !== "job" && (!message.origin || message.origin === "user"));
  // Keep the latest contiguous set of personal reports within a separate budget.
  // Never pin an opening request while omitting a later correction to it.
  let historyBudget = 24000, first = earlierReports.length;
  while (first > 0 && earlierReports.length - first < 60 && earlierReports[first - 1].text.length <= historyBudget) {
    historyBudget -= earlierReports[--first].text.length;
  }
  const conversation = [...earlierReports.slice(first), ...recentMessages];
  const confirmedContext = data.memories.filter(memory => !(data.evidenceCorrections ?? []).some(correction => correction.active && correction.source.id === memory.id));
  const blocks = data.workBlocks.filter(
    (b) =>
      b.start.slice(0, 10) >= program.sprintStart &&
      b.start.slice(0, 10) <= program.sprintEnd,
  );
  const minutes = blocks.reduce(
    (sum, b) => sum + (Date.parse(b.end) - Date.parse(b.start)) / 60000,
    0,
  );
  const related = goals.filter(
    (g) =>
      g.id !== goalId &&
      (g.area === goal?.area || g.tags?.some((t) => goal?.tags?.includes(t))),
  );
  const calendar =
    data.calendarSnapshot &&
    Date.now() - Date.parse(data.calendarSnapshot.checkedAt) < 5 * 60000
      ? data.calendarSnapshot
      : null;
  const eligibleMethods = METHODS.filter(
    (method) =>
      program.enabledMethods.includes(method.id) &&
      (goal?.kind === "learning" ||
        !["retrieval", "spacing"].includes(method.id)),
  );
  const checks: DecisionCheck[] = [
    {
      id: "outcome",
      label: "Outcome & checkpoint",
      finding: goal
        ? `${goal.success} Use the saved input–outcome model to distinguish observed progress, conditional projections and unknown relationships.`
        : `${goals.length} active goals. No single goal selected.`,
      sources: goal
        ? [goal.id, ...goal.results.slice(-2).map((r) => r.id)]
        : [],
    },
    {
      id: "observations",
      label: "What actually happened",
      finding: actions.some((a) => a.outcome)
        ? actions
            .filter((a) => a.outcome)
            .slice(-3)
            .map(
              (a) => `${a.date}: ${a.outcome}${a.note ? ` — ${a.note}` : ""}`,
            )
            .join("\n")
        : "No action outcomes reported yet.",
      sources: actions
        .filter((a) => a.outcome)
        .slice(-3)
        .map((a) => a.id),
    },
    {
      id: "focus",
      label: "Sprint & other goals",
      finding: `Sprint: ${program.sprintResult} Focus: ${goals.find((g) => g.id === program.focusGoalId)?.title ?? "Not selected"}. ${related.length ? `Shared area or tags: ${related.map((g) => g.title).join("; ")}.` : "No related active goals share this area or tags."} All ${goals.length} active goals are included to assess competing demands.`,
      sources: [`program-v${program.version}`, ...goals.map((g) => g.id)],
    },
    {
      id: "capacity",
      label: "Schedule & capacity",
      finding: `${program.weeklyMinutes} minutes budgeted per week; ${minutes} minutes scheduled across the sprint. Work window ${program.workStart}–${program.workEnd}. ${calendar ? `Fresh busy intervals from ${calendar.provider} are available, checked ${calendar.checkedAt}.` : "No calendar availability checked within the last five minutes."} Saved blocks describe planned work. Calendar rechecks conflicts before booking.`,
      sources: [`program-v${program.version}`, ...blocks.map((b) => b.id)],
    },
    {
      id: "memory",
      label: "Confirmed context",
      finding: confirmedContext.length
        ? confirmedContext.map((m) => m.text).join("\n")
        : "No personal context saved. Adler should ask before assuming a preference.",
      sources: confirmedContext.map((m) => m.id),
    },
    {
      id: "methods",
      label: "Methods available for this turn",
      finding:
        eligibleMethods.map((m) => m.name).join(" · ") ||
        "No optional methods enabled. Ask about the result and preferences before suggesting a method.",
      sources: eligibleMethods.map((method) => method.id),
    },
  ];
  return {
    today,
    weeklyReview: reviewSchedule(data),
    planningBasis: goal?.plans.at(-1)?.basis ?? null,
    adaptivePlan: goal?.plans.at(-1)?.adaptive ?? null,
    behaviorEvidence: goal ? planProgress(data, goal).map(({ actions, ...summary }) => ({ ...summary, records: actions.map(a => ({ id: a.id, date: a.date, outcome: a.outcome, amount: a.amount, note: a.note })) })) : [],
    execution: goal ? executionSummary(data, goal, today) : null,
    learningEvidence: goal ? cycleEvidence(data, goal, today) : null,
    goalProjection: goal ? goalProjection(data, goal, today) : null,
    timeZone: data.timeZone,
    tentativeSchedule: tentativeSchedule(data, calendarWeek(today), addDays(calendarWeek(today), 7)),
    message,
    selectedGoalId: goalId,
    goal: goal ?? null,
    program,
    activeGoals: goals,
    allGoalContexts: data.goals.map(g => ({ id: g.id, title: g.title, status: g.status, plan: g.plans.at(-1),
      behavior: planProgress(data, g).map(({ actions, ...summary }) => ({ ...summary, records: actions.map(a => ({ id: a.id, date: a.date, outcome: a.outcome, amount: a.amount, note: a.note })) })),
      execution: executionSummary(data, g, today), learningEvidence: cycleEvidence(data, g, today), projection: goalProjection(data, g, today) })),
    recentActions: actions,
    confirmedContext,
    correctedContext: (data.evidenceCorrections ?? []).filter(correction => correction.active).map(correction => ({ ...correction, followUp: correction.replacements.map(source => data.messages.find(message => message.id === source.id)?.text ?? data.memories.find(memory => memory.id === source.id)?.text ?? "Open the correcting source record") })),
    currentLearning: (data.learning ?? []).map(record => ({
      id: record.id, goalIds: record.goalIds, pendingTest: record.versions.find(version => version.version === record.pendingVersion), state: record.state, standing: record.standing,
      current: currentLearningVersion(record), reviews: record.reviews.slice(-3), invalidations: record.invalidations.filter(i => i.version === currentLearningVersion(record)?.version),
    })),
    checkInPrompts: actions.filter(a => !a.outcome && !a.retiredAt && a.date && a.date <= today).slice(-5)
      .map(a => ({ actionId: a.id, goalId: a.goalId, context: checkInContext(data, a), instruction: "Ask what happened; this context does not confirm an outcome or its cause." })),
    workBlocks: blocks,
    freshCalendarAvailability: calendar,
    previousDecisions: data.decisions
      .filter((d) => goalId === "general" || d.goalId === goalId)
      .slice(-5),
    conversation: conversation
      .map((m) => ({ id: m.id, goalId: m.goalId, role: m.role, origin: m.origin ?? (m.channel === "job" ? "connected" : m.role === "user" ? "user" : "system"), channel: m.channel, text: m.text, at: m.at })),
    conversationHistory: { omittedUserMessages: first, instruction: "Saved goal definitions and later explicit corrections take precedence over historical requests. If older reports are omitted, do not reconstruct or replace missing goal intent; use the saved goal or ask a focused clarification when necessary." },
    checks,
  };
}
