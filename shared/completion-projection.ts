import type { Data, Goal } from "./workspace.ts";
import { addDays } from "./journey.ts";
import { weekStart } from "./goal-execution.ts";

// A conditional baseline for behavior, never an extrapolation of a goal outcome.
export function completionProjection(data: Data, goal: Goal, today: string) {
  const plan = goal.plans.at(-1)!;
  const window = plan.adaptive?.window;
  if (goal.status !== "Active" || !window || window.end <= today) return null;
  const actions = data.actions.filter(a =>
    a.goalId === goal.id && a.planVersion === plan.version && !a.retiredAt,
  );
  const due = actions.filter(a => a.date >= addDays(today, -27) && a.date <= today);
  const reported = due.filter(a => a.outcome);
  // This display threshold avoids projecting a single day's experience.
  if (reported.length < 5 || new Set(reported.map(a => weekStart(a.date))).size < 2) return null;
  const weeks = [...new Set(actions.filter(a =>
    !a.outcome && a.date >= window.start && a.date <= window.end &&
    a.date <= addDays(today, 28) && weekStart(a.date) > weekStart(today),
  ).map(a => weekStart(a.date)))].sort();
  if (!weeks.length) return null;

  const n = reported.length;
  const rate = reported.filter(a => a.outcome === "Done").length / n;
  // Wilson 95% interval for the underlying completion rate, not a weekly
  // prediction interval. Assumes comparable, independent reported actions.
  // https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm
  const z = 1.96;
  const denominator = 1 + z * z / n;
  const center = (rate + z * z / (2 * n)) / denominator;
  const margin = z * Math.sqrt(rate * (1 - rate) / n + z * z / (4 * n * n)) / denominator;
  return {
    estimate: rate * 100,
    lower: Math.max(0, center - margin) * 100,
    upper: Math.min(1, center + margin) * 100,
    reported: n,
    due: due.length,
    weeks,
  };
}
