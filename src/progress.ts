import { formatDate, type Goal } from "../shared/workspace.ts";

export function goalValue(goal: Goal) {
  if (goal.measure || goal.kind === "learning")
    return goal.results.at(-1)?.value ?? null;
  return goal.milestones.filter((m) => m.done).length;
}
export function progressStatus(goal: Goal, date: string) {
  const actual = goalValue(goal);
  const checkpoints = [...(goal.checkpoints ?? [])].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const due = checkpoints.filter((point) => point.date <= date).at(-1);
  const latestDate =
    goal.measure || goal.kind === "learning"
      ? goal.results.at(-1)?.date
      : goal.outcomeUpdatedAt;
  if (goal.status === "Completed")
    return {
      label: "Completed",
      tone: "positive",
      actual,
      planned: due?.value ?? null,
      detail: "You confirmed the goal is complete.",
    };
  if (goal.status !== "Active")
    return {
      label: goal.status,
      tone: "neutral",
      actual,
      planned: due?.value ?? null,
      detail: "Future work is paused. Historical results are retained.",
    };
  if (actual === null)
    return {
      label: "Update needed",
      tone: "neutral",
      actual,
      planned: due?.value ?? null,
      detail: "Record a result to compare it with the plan.",
    };
  if (!due)
    return {
      label: "No checkpoint due",
      tone: "neutral",
      actual,
      planned: null,
      detail: checkpoints[0]
        ? `Your first checkpoint is ${formatDate(checkpoints[0].date)}.`
        : "Add dated checkpoints to compare actual progress with your plan.",
    };
  const delta = actual - due.value;
  return {
    label: delta < 0 ? "Behind plan" : delta > 0 ? "Ahead of plan" : "On plan",
    tone: delta < 0 ? "attention" : "positive",
    actual,
    planned: due.value,
    detail: `${actual} ${goal.measure?.unit ?? goal.unit ?? "milestones verified"} recorded${latestDate ? ` ${formatDate(latestDate)}` : ""}; ${due.value} planned by ${formatDate(due.date)}. ${delta < 0 ? "Inspect the obstacle before changing the workload." : "Compared with your agreed checkpoint."}`,
  };
}
