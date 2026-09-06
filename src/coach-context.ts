import type { Data } from "./store";
import type { DecisionCheck } from "./program-types";
import { progressStatus } from "./progress";
import { METHODS } from "./methods";
export function coachingContext(
  data: Data,
  goalId: string,
  message: string,
  today: string,
) {
  const program = data.programs.at(-1)!;
  const goal = data.goals.find((g) => g.id === goalId);
  const goals = data.goals.filter((g) => g.status === "Active");
  const actions = data.actions.filter((a) => a.goalId === goalId).slice(-20);
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
  const pace = goal ? progressStatus(goal, today) : null;
  const checks: DecisionCheck[] = [
    {
      id: "outcome",
      label: "Outcome & checkpoint",
      finding: goal
        ? `${goal.success} ${pace!.detail}`
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
        : "No action outcomes recorded for this goal yet.",
      sources: actions
        .filter((a) => a.outcome)
        .slice(-3)
        .map((a) => a.id),
    },
    {
      id: "focus",
      label: "Sprint & other goals",
      finding: `Sprint: ${program.sprintResult} Focus: ${goals.find((g) => g.id === program.focusGoalId)?.title ?? "Not selected"}. ${related.length ? `Shared area or tags: ${related.map((g) => g.title).join("; ")}.` : "No related active goals share this area or tags."} All ${goals.length} active goals are included to assess competing demands.`,
      sources: [`program-v${program.version}`, ...related.map((g) => g.id)],
    },
    {
      id: "capacity",
      label: "Schedule & capacity",
      finding: `${program.weeklyMinutes} minutes budgeted per week; ${minutes} minutes scheduled across the sprint. Work window ${program.workStart}–${program.workEnd}. ${calendar ? `Fresh busy intervals from ${calendar.provider} are available, checked ${calendar.checkedAt}.` : "No calendar availability checked within the last five minutes."} Saved blocks describe planned work. Calendar rechecks conflicts before booking.`,
      sources: blocks.map((b) => b.id),
    },
    {
      id: "memory",
      label: "Confirmed context",
      finding: data.memories.length
        ? data.memories.map((m) => m.text).join("\n")
        : "No personal context saved. Adler should ask before assuming a preference.",
      sources: data.memories.map((m) => m.id),
    },
    {
      id: "methods",
      label: "Methods available for this turn",
      finding:
        METHODS.filter(
          (m) =>
            program.enabledMethods.includes(m.id) &&
            (goal?.kind === "learning" ||
              !["retrieval", "spacing"].includes(m.id)),
        )
          .map((m) => m.name)
          .join(" · ") ||
        "No optional methods enabled. Ask about the result and preferences before suggesting a method.",
      sources: program.enabledMethods,
    },
  ];
  return {
    today,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    message,
    selectedGoalId: goalId,
    goal: goal ?? null,
    program,
    activeGoals: goals,
    recentActions: actions,
    confirmedContext: data.memories,
    workBlocks: blocks,
    freshCalendarAvailability: calendar,
    previousDecisions: data.decisions
      .filter((d) => d.goalId === goalId)
      .slice(-5),
    conversation: data.messages
      .filter((m) => m.goalId === goalId)
      .slice(-12)
      .map((m) => ({ role: m.role, text: m.text })),
    checks,
  };
}
