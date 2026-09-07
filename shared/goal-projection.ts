import type { Action, Data, Goal } from "./workspace.ts";
import { addDays } from "./journey.ts";
import { actionStep, stepDates } from "./adaptive-plan.ts";

const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
const mean = (values: number[]) => values.reduce((sum, n) => sum + n, 0) / values.length;
const range = (values: number[]) => ({ low: Math.min(...values), expected: mean(values), high: Math.max(...values) });

export function goalProjection(data: Data, goal: Goal, today: string) {
  const plan = goal.plans.at(-1)!.adaptive;
  const model = plan?.projection;
  const measure = goal.measure;
  const observations = goal.results.filter(r => r.date <= today).sort((a, b) => a.date.localeCompare(b.date));
  const latest = observations.at(-1);
  const current = latest?.value ?? measure?.baseline ?? (!measure && goal.milestones.length ? goal.milestones.filter(m => m.done).length : null);
  const target = measure?.target ?? goal.target ?? goal.milestones.length;
  const progress = current === null || target <= 0 ? null : Math.min(100, 100 * current / target);
  const base = { current, target, progress, observations };
  if (!model || !plan || !measure) return { ...base, status: "Choose an input to model", projection: null, evidence: null };
  const step = plan.steps.find(s => s.id === model.driverStepId);
  if (!step || model.outcomeUnit !== measure.unit || measure.aggregation !== "cumulative")
    return { ...base, status: "Review the measurement model", projection: null, evidence: null };
  const unit = model.inputMetric === "hours" ? "hours" : step.measure!.unit;
  const quantity = (a: Action) => {
    if (!a.outcome) return null;
    if (a.outcome === "Didn’t happen") return 0;
    return model.inputMetric === "hours" ? (a.actualMinutes === undefined ? null : a.actualMinutes / 60) : a.amount ?? null;
  };
  const records = data.actions.filter(a => a.goalId === goal.id && a.stepId === step.id &&
    a.date >= model.observationStart && a.date <= today && (!a.retiredAt || a.outcome) &&
    (model.inputMetric === "hours" || (actionStep(data, a)?.measure?.id === step.measure?.id && actionStep(data, a)?.measure?.unit === step.measure?.unit)),
  ).sort((a, b) => a.date.localeCompare(b.date));
  const start = [model.observationStart, addDays(today, -55), records[0]?.date ?? today].sort().at(-1)!;
  const daily = Array.from({ length: Math.max(0, daysBetween(start, today) + 1) }, (_, index) => {
    const date = addDays(start, index);
    const entries = records.filter(a => a.date === date);
    return { date, amount: entries.some(a => quantity(a) === null) ? null : entries.reduce((sum, a) => sum + quantity(a)!, 0), sourceIds: entries.map(a => a.id) };
  });
  // Compare complete seven-day blocks, including scheduled rest days. Unknown
  // measurements exclude a block; they never become zero amounts.
  const weeklyRates: number[] = [];
  for (let end = daily.length; end >= 7; end -= 7) {
    const block = daily.slice(end - 7, end);
    if (block.every(d => d.amount !== null)) weeklyRates.push(mean(block.map(d => d.amount!)));
  }
  const plannedDaily = stepDates(plan, step).length *
    (model.inputMetric === "hours" ? step.durationMinutes / 60 : step.measure?.target ?? 0) /
    (daysBetween(plan.window.start, plan.window.end) + 1);
  const pace = weeklyRates.length >= 2 ? range(weeklyRates) :
    { low: plannedDaily * .5, expected: plannedDaily, high: plannedDaily * 1.5 };
  const paceSource = weeklyRates.length >= 2 ? "Observed input pace" : "Provisional input pace";
  const pairs: { input: number; outcome: number; start: string; end: string; sourceIds: string[] }[] = [];
  if (model.kind === "learned") {
    for (let index = 1; index < observations.length; index++) {
      const before = observations[index - 1], after = observations[index];
      const from = addDays(before.date, -model.feedbackDelayDays), to = addDays(after.date, -model.feedbackDelayDays);
      if (from < model.observationStart || to <= from || after.value < before.value) continue;
      const inputs = records.filter(a => a.date > from && a.date <= to);
      if (!inputs.length || inputs.some(a => quantity(a) === null)) continue;
      const input = inputs.reduce((sum, a) => sum + quantity(a)!, 0);
      if (input > 0) pairs.push({ input, outcome: after.value - before.value, start: before.date, end: after.date, sourceIds: [before.id, after.id, ...inputs.map(a => a.id)] });
    }
  }
  const evidence = { model, unit, daily, pace, paceSource, pairs,
    measured: records.filter(a => quantity(a) !== null).length, due: records.length,
    plannedDaily, sourceIds: records.filter(a => quantity(a) !== null).map(a => a.id) };
  if (current === null) return { ...base, status: "Record a starting outcome", projection: null, evidence };
  if (goal.status !== "Active" && goal.status !== "Draft") return { ...base, status: goal.status, projection: null, evidence };
  if (model.kind === "learned" && !pairs.length)
    return { ...base, status: "Learning the input–outcome link", projection: null, evidence };
  const conversion = model.inputPerOutcome;
  const observedYield = pairs.length ? pairs.reduce((sum, p) => sum + p.outcome, 0) / pairs.reduce((sum, p) => sum + p.input, 0) : 0;
  const yieldRange = model.kind === "direct" && conversion
    ? { low: 1 / conversion.high, expected: 1 / conversion.expected, high: 1 / conversion.low }
    : { low: pairs.length < 3 ? 0 : Math.min(...pairs.map(p => p.outcome / p.input)), expected: observedYield,
      high: pairs.length < 3 ? observedYield * 2 : Math.max(...pairs.map(p => p.outcome / p.input)) };
  const origin = latest?.date ?? model.observationStart;
  const horizon = addDays(today, model.horizonDays);
  const velocity = { low: pace.low * yieldRange.low, expected: pace.expected * yieldRange.expected, high: pace.high * yieldRange.high };
  // Learned intervals already align input and outcome by the saved delay.
  // Continuing that observed relationship assumes an ongoing input pipeline.
  const initialDelay = model.kind === "direct" ? model.feedbackDelayDays : 0;
  const finish = (rate: number) => {
    if (current >= target) return origin;
    const days = rate > 0 ? Math.ceil((target - current) / rate) + initialDelay : Infinity;
    return days <= daysBetween(origin, horizon) ? addDays(origin, days) : null;
  };
  const expectedDate = finish(velocity.expected), earliestDate = finish(velocity.high), latestDate = finish(velocity.low);
  const end = latestDate && latestDate > today ? [latestDate, goal.targetDate ?? today].sort().at(-1)! : horizon;
  const graphEnd = end > horizon ? horizon : end;
  const points = Array.from({ length: 41 }, (_, index) => {
    const days = Math.round(daysBetween(origin, graphEnd) * index / 40);
    const elapsed = Math.max(0, days - initialDelay);
    return { date: addDays(origin, days), low: Math.min(target, current + velocity.low * elapsed),
      expected: Math.min(target, current + velocity.expected * elapsed), high: Math.min(target, current + velocity.high * elapsed) };
  });
  return { ...base, status: model.kind === "direct" ? "Input-based projection" : pairs.length < 3 ? "Early observed association" : "Observed association", evidence,
    projection: { origin, horizon, points, expectedDate, earliestDate, latestDate, yieldRange,
      assumptions: [
        { label: "Model choice", text: model.rationale },
        { label: "Future input pace", text: paceSource === "Provisional input pace" ? "Until two complete weeks are measured, the saved input budget is a scenario, with half to one-and-a-half times that pace." : "Future input pace stays within the range of complete weeks measured in the last eight weeks." },
        { label: "Missing reports", text: "No unlogged work is assumed on days without scheduled records. Unanswered or unmeasured actions exclude a week from the pace estimate." },
        { label: "Input → outcome", text: model.kind === "direct" ? "The saved input-to-outcome conversion continues to apply." : pairs.length < 3 ? "With fewer than three matched intervals, the return scenario runs from zero to twice the observed return. This is a sensitivity range, not a calibrated probability." : "Future return stays within the observed range across matched intervals; association does not establish cause." },
        { label: "Feedback delay", text: model.kind === "learned" ? "The scenario continues the observed input pipeline. Feedback delay aligns past inputs with outcomes; it does not restart at each outcome report." : model.feedbackDelayDays === 0 ? "No additional delay between input and outcome is assumed." : `New input is assumed to affect outcomes after ${model.feedbackDelayDays} days.` },
        { label: "What the range means", text: "The shaded fan is a conditional scenario range, not a confidence interval or a guarantee. Future cycles are not bookings." },
      ] } };
}
