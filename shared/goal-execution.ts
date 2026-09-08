import type { Action, Data, Goal } from "./workspace.ts";
import { addDays, dateInZone } from "./journey.ts";

export const executionLabels = {
  done: "Done",
  partial: "Partly",
  missed: "Didn’t happen",
  unknown: "Awaiting check-in",
  upcoming: "Upcoming",
};
export type ExecutionStatus = keyof typeof executionLabels;
export function executionStatus(
  action: Action,
  today: string,
): ExecutionStatus {
  if (action.outcome === "Done") return "done";
  if (action.outcome === "Partly") return "partial";
  if (action.outcome === "Didn’t happen") return "missed";
  return action.date && action.date <= today ? "unknown" : "upcoming";
}
export function weekStart(date: string) {
  return addDays(date, -((new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7));
}
export function executionCounts(actions: Action[], today: string) {
  const counts = { done: 0, partial: 0, missed: 0, unknown: 0, upcoming: 0 };
  for (const action of actions) counts[executionStatus(action, today)]++;
  const reported = counts.done + counts.partial + counts.missed;
  return {
    ...counts,
    planned: actions.length,
    reported,
    completion: reported ? Math.round((100 * counts.done) / reported) : null,
  };
}
export function goalExecution(
  data: Data,
  goal: Goal,
  today = dateInZone(data.timeZone),
) {
  const plan = goal.plans.at(-1)!;
  // Revisions replace the cycle commitment; reported action records remain in history.
  const cycles = [
    ...new Map(
      goal.plans
        .filter((p) => p.adaptive)
        .map((p) => [
          p.adaptive!.window.start,
          {
            ...p.adaptive!.window,
            version: p.version,
            current: p.version === plan.version,
          },
        ]),
    ).values(),
  ].sort((a, b) => a.start.localeCompare(b.start));
  const actions = data.actions
    .filter((a) => a.goalId === goal.id && (!a.retiredAt || a.outcome))
    .sort((a, b) => a.date.localeCompare(b.date));
  const dated = actions.filter((a) => a.date);
  const current = plan.adaptive?.window;
  const currentActions = current
    ? dated.filter((a) => a.date >= current.start && a.date <= current.end)
    : actions;
  const byWeek = new Map<string, Action[]>();
  for (const action of dated) {
    const start = weekStart(action.date);
    byWeek.set(start, [...(byWeek.get(start) ?? []), action]);
  }
  const weekDates = [
    ...dated.map((a) => a.date),
    ...(current ? [current.start, current.end] : []),
    addDays(today, -21),
    addDays(today, 28),
  ].sort();
  const weeks = [];
  for (
    let start = weekStart(weekDates[0]);
    start <= weekDates.at(-1)!;
    start = addDays(start, 7)
  ) {
    const records = byWeek.get(start) ?? [];
    weeks.push({
      start,
      end: addDays(start, 6),
      actions: records,
      ...executionCounts(records, today),
    });
  }
  const markers = [
    ...(plan.adaptive && goal.assessment?.nextAt !== null ? [{
      id: `review-${plan.version}`,
      label: "Review this plan",
      date: dateInZone(data.timeZone, new Date(goal.assessment?.nextAt ?? plan.adaptive.assessment.at)),
      detail: plan.adaptive.assessment.question,
      done: false,
      kind: "Review",
    }] : []),
    ...goal.milestones.map((m) => ({
      id: m.id,
      label: m.title,
      date: m.dueDate,
      detail: m.criterion,
      done: m.done,
      kind: "Milestone",
    })),
    ...(goal.checkpoints ?? [])
      .filter(
        (p) =>
          !(p.date === goal.targetDate && p.value === goal.target) &&
          !goal.milestones.some(
            (m) => m.dueDate === p.date && m.title === p.label,
          ),
      )
      .map((p) => ({
        id: p.id,
        label: p.label,
        date: p.date,
        detail: `${p.value} ${goal.measure?.unit ?? goal.unit ?? ""}`,
        done: false,
        kind: "Checkpoint",
      })),
  ].sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"));
  const dates = [
    ...cycles.flatMap((c) => [c.start, c.end]),
    ...dated.map((a) => a.date),
    ...markers.flatMap((m) => (m.date ? [m.date] : [])),
    today,
    ...(goal.targetDate ? [goal.targetDate] : []),
  ].sort();
  return {
    today,
    cycles,
    current,
    actions,
    unscheduled: actions.filter((a) => !a.date),
    weeks,
    markers,
    summary: executionCounts(currentActions, today),
    start: dates[0],
    end: dates.at(-1)!,
  };
}

// Assemble dated evidence for a review without inferring an input-to-outcome effect.
export function cycleEvidence(
  data: Data,
  goal: Goal,
  today = dateInZone(data.timeZone),
) {
  const plan = goal.plans.at(-1)!.adaptive;
  if (!plan) return null;
  const records = data.actions.filter(
    (a) =>
      a.goalId === goal.id &&
      a.date >= plan.window.start &&
      a.date <= plan.window.end &&
      a.date <= today &&
      (!a.retiredAt || a.outcome) &&
      (!plan.experiment ||
        (a.stepId && plan.experiment.inputStepIds.includes(a.stepId))),
  );
  const attempted = records.filter(
    (a) => a.outcome === "Done" || a.outcome === "Partly",
  );
  const feedbackDates = attempted
    .map((a) => ({
      id: a.id,
      date: addDays(a.date, plan.assessment.feedbackDelayDays),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const observations = goal.results
    .filter((r) => r.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const baseline =
    observations.filter((r) => r.date < plan.window.start).at(-1) ?? null;
  const results = observations.filter(
    (r) => r.date >= plan.window.start && r.id !== baseline?.id,
  );
  const firstFeedbackDate = feedbackDates[0]?.date ?? null;
  const notes = data.messages
    .filter(
      (m) =>
        m.role === "user" &&
        m.goalId === goal.id &&
        m.at &&
        Number.isFinite(Date.parse(m.at)) &&
        dateInZone(data.timeZone, new Date(m.at)) >= plan.window.start &&
        dateInZone(data.timeZone, new Date(m.at)) <= today,
    )
    .slice(-8);

  return {
    records,
    notes,
    counts: executionCounts(records, today),
    baseline,
    results,
    feedbackDelayDays: plan.assessment.feedbackDelayDays,
    firstFeedbackDate,
    pendingFeedbackIds: feedbackDates
      .filter((f) => f.date > today)
      .map((f) => f.id),
    status: !attempted.length
      ? "Collecting action reports"
      : firstFeedbackDate! > today
        ? "Waiting for outcome feedback"
        : results.some((r) => r.date >= firstFeedbackDate!)
          ? "Observations available to review"
          : notes.length || records.some((a) => a.note)
            ? "Check-in notes available to review"
            : "Outcome observations still needed",
  };
}

// Model calls need counts and references; full action histories already live in workspace.
export function executionSummary(
  data: Data,
  goal: Goal,
  today = dateInZone(data.timeZone),
) {
  const { actions, unscheduled, weeks, ...summary } = goalExecution(
    data,
    goal,
    today,
  );
  return {
    ...summary,
    actionIds: actions.map((a) => a.id),
    unscheduledIds: unscheduled.map((a) => a.id),
    weeks: weeks.map(({ actions, ...week }) => ({
      ...week,
      actionIds: actions.map((a) => a.id),
    })),
  };
}
