import { dateInZone } from "./journey.ts";
import { learningStatus } from "./learning.ts";
import type { Data, Goal } from "./workspace.ts";

export function todayActivity(data: Data, now = new Date()) {
  const today = dateInZone(data.timeZone, now);
  const actions = data.actions.filter(action => {
    const goal = data.goals.find(goal => goal.id === action.goalId);
    return action.date === today && goal && (!action.retiredAt || action.outcome) &&
      (goal.status === "Active" || action.outcome);
  });
  return { today, actions };
}

// Compare saved results with dated commitments, without inventing a daily pace.
export function goalPlanProgress(goal: Goal, today: string) {
  const measured = !!goal.measure || (goal.kind === "learning" && goal.target !== undefined);
  const results = goal.results.filter(result => result.date <= today).sort((a, b) => a.date.localeCompare(b.date));
  const latest = results.at(-1);
  const milestones = goal.milestones.filter(milestone => milestone.done && (!milestone.completedAt || milestone.completedAt.slice(0, 10) <= today));
  const target = measured ? goal.measure?.target ?? goal.target ?? 0 : goal.milestones.length;
  const unit = measured ? goal.measure?.unit ?? goal.unit ?? "correct answers / 10" : "milestones";
  const actual = measured ? latest?.value ?? goal.measure?.baseline ?? null : goal.milestones.length ? milestones.length : null;
  const outcomeDate = goal.outcomeUpdatedAt?.slice(0, 10);
  const observedAt = measured ? latest?.date ?? null : outcomeDate && outcomeDate <= today ? outcomeDate : null;
  const start = goal.startDate ?? goal.plans[0].date;
  const datedMilestones = milestones.filter(milestone => milestone.completedAt && milestone.completedAt.slice(0, 10) <= today)
    .sort((a, b) => a.completedAt!.localeCompare(b.completedAt!));
  const observations = measured || results.length ? results.map(result => ({ date: result.date, value: result.value }))
    : milestones.length === datedMilestones.length ? datedMilestones.map((milestone, index) => ({ date: milestone.completedAt!.slice(0, 10), value: index + 1 })) : [];
  if (measured && !observations.length && goal.measure?.baseline !== null && goal.measure?.baseline !== undefined && start <= today) {
    observations.push({ date: start, value: goal.measure.baseline });
  }
  if (!measured && observedAt && actual !== null && observedAt >= (datedMilestones.at(-1)?.completedAt ?? "") &&
    !observations.some(point => point.date === observedAt && point.value === actual)) observations.push({ date: observedAt, value: actual });
  observations.sort((a, b) => a.date.localeCompare(b.date));
  const checkpoints = [...(goal.checkpoints ?? [])].map(point => ({ date: point.date, value: point.value, label: point.label }));
  if (!checkpoints.length && !measured) {
    const dated = goal.milestones.filter(milestone => milestone.dueDate).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
    for (const [index, milestone] of dated.entries()) checkpoints.push({ date: milestone.dueDate!, value: index + 1, label: milestone.title });
  }
  if (target > 0 && goal.targetDate && !checkpoints.some(point => point.date === goal.targetDate)) {
    checkpoints.push({ date: goal.targetDate, value: target, label: "Goal target" });
  }
  checkpoints.sort((a, b) => a.date.localeCompare(b.date) || a.value - b.value);
  const due = checkpoints.filter(point => point.date <= today).at(-1);
  const next = checkpoints.find(point => point.date > today);
  const openMilestones = measured ? [] : goal.milestones.filter(milestone =>
    (milestone.dueDate ? milestone.dueDate <= today : goal.targetDate && goal.targetDate <= today) && !milestones.includes(milestone));
  const currentEvidence = observedAt !== null && observedAt >= (due?.date ?? today) && observedAt <= today;
  const verifiedMilestones = !measured && due && actual !== null && actual >= due.value && !openMilestones.length;
  const comparable = actual !== null && !!due && (currentEvidence || !!verifiedMilestones);
  const delta = comparable ? actual! - due!.value : null;
  const label = goal.status !== "Active" ? goal.status : !measured && !goal.milestones.length ? "No outcome measure" : actual === null ? "Add a result"
    : !due ? next ? "First checkpoint ahead" : "No dated checkpoint"
      : !comparable ? measured ? "Update needed" : "Verify the milestone"
        : openMilestones.length ? "Milestone still open" : delta! < 0 ? "Below checkpoint" : delta! > 0 ? "Above checkpoint" : "At checkpoint";
  const direction = goal.measure?.baseline !== null && goal.measure?.baseline !== undefined && target < goal.measure.baseline ? -1 : 1;
  return { goal, actual, target, unit, observedAt, observations, checkpoints, due, next, delta, label, openMilestones,
    measured, comparable, tone: goal.status !== "Active" ? "quiet" : comparable ? delta! * direction < 0 || openMilestones.length ? "attention" : "positive" : "quiet" };
}

export function todayLearning(data: Data, today: string) {
  const priority = (record: NonNullable<Data["learning"]>[number]) =>
    record.standing === "reconsider" ? 0 :
      learningStatus(record, today) === "Ready to review" ? 1 :
        record.pendingVersion || record.state === "suggested" ? 2 :
          ["agreed", "reviewed"].includes(record.state) ? 3 : 4;
  return (data.learning ?? []).filter(record => record.state !== "declined" &&
    (record.state !== "closed" || record.reviews.length > 0 || record.standing === "reconsider"))
    .sort((a, b) => priority(a) - priority(b));
}
