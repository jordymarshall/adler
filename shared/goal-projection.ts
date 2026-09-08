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
  const base = { current, target, progress, observations, observedAt: latest?.date ?? null };
  if (!model || !plan || !measure) return { ...base, status: "Choose what to track", projection: null, evidence: null };
  const step = plan.steps.find(s => s.id === model.driverStepId);
  if (!step || (model.inputMetric === "amount" && !step.measure) || model.outcomeUnit !== measure.unit || measure.aggregation !== "cumulative")
    return { ...base, status: "Review what you’re measuring", projection: null, evidence: null };
  const unit = model.inputMetric === "hours" ? "hours" : step.measure!.unit;
  const quantity = (a: Action) => {
    if (!a.outcome) return null;
    if (a.outcome === "Didn’t happen") return 0;
    return model.inputMetric === "hours" ? (a.actualMinutes === undefined ? null : a.actualMinutes / 60) : a.amount ?? null;
  };
  const comparable = (prior: typeof step | undefined) => !!prior && (model.inputMetric === "hours" ? prior.title === step.title && prior.criterion === step.criterion : prior.measure?.id === step.measure?.id && prior.measure?.unit === step.measure?.unit);
  const records = data.actions.filter(a => a.goalId === goal.id && a.stepId === step.id &&
    a.date >= model.observationStart && a.date <= today && (!a.retiredAt || a.outcome) &&
    comparable(actionStep(data, a)),
  ).sort((a, b) => a.date.localeCompare(b.date));
  const comparablePlans = goal.plans.flatMap(p => {
    const driver = p.adaptive?.steps.find(s => s.id === step.id);
    return p.adaptive && driver && comparable(driver)
      ? [{ plan: p.adaptive, dates: new Set(stepDates(p.adaptive, driver)) }] : [];
  });
  const inputDay = (date: string) => {
    const entries = records.filter(a => a.date === date);
    const schedule = comparablePlans.filter(p => date >= p.plan.window.start && date <= p.plan.window.end).at(-1);
    const amount = !entries.length || entries.some(a => quantity(a) === null) ? null : entries.reduce((sum, a) => sum + quantity(a)!, 0);
    return { date, amount, status: amount !== null ? "reported" : !entries.length && schedule && !schedule.dates.has(date) ? "not scheduled" : "unknown", sourceIds: entries.map(a => a.id) };
  };
  const start = [model.observationStart, addDays(today, -55)].sort().at(-1)!;
  const daily = Array.from({ length: Math.max(0, daysBetween(start, today) + 1) }, (_, index) => inputDay(addDays(start, index)));
  // Estimate recorded scheduled work per calendar day. Rest days remain labelled
  // not scheduled; absent expected records never become observed zero activity.
  const weeklyRates: number[] = [];
  for (let end = daily.length; end >= 7; end -= 7) {
    const block = daily.slice(end - 7, end);
    if (block.some(d => d.amount !== null) && block.every(d => d.status !== "unknown")) weeklyRates.push(block.reduce((sum, d) => sum + (d.amount ?? 0), 0) / 7);
  }
  const plannedDaily = stepDates(plan, step).length *
    (model.inputMetric === "hours" ? step.durationMinutes / 60 : step.measure?.target ?? 0) /
    (daysBetween(plan.window.start, plan.window.end) + 1);
  const pace = weeklyRates.length >= 2 ? range(weeklyRates) :
    { low: plannedDaily * .5, expected: plannedDaily, high: plannedDaily * 1.5 };
  if (pace.low === pace.high && pace.expected > 0) { pace.low = pace.expected * .5; pace.high = pace.expected * 1.5; }
  const paceSource = weeklyRates.length >= 2 ? "Observed input pace" : "Provisional input pace";
  const pairs: { input: number; outcome: number; start: string; end: string; sourceIds: string[] }[] = [];
  const excludedPeriods: { input: number | null; outcome: number; start: string; end: string; sourceIds: string[]; reason: string }[] = [];
  let unresolvedOutcome = false;
  if (model.kind === "learned") {
    for (let index = 1; index < observations.length; index++) {
      const before = observations[index - 1], after = observations[index];
      const from = addDays(before.date, -model.feedbackDelayDays), to = addDays(after.date, -model.feedbackDelayDays);
      const inputs = records.filter(a => a.date > from && a.date <= to);
      const period = Array.from({ length: Math.max(0, daysBetween(from, to)) }, (_, day) => inputDay(addDays(from, day + 1)));
      const input = !inputs.length || inputs.some(a => quantity(a) === null) || period.some(day => day.status === "unknown")
        ? null : inputs.reduce((sum, a) => sum + quantity(a)!, 0);
      const interval = { input, outcome: after.value - before.value, start: before.date, end: after.date, sourceIds: [before.id, after.id, ...inputs.map(a => a.id)] };
      let reason = "";
      if (from < model.observationStart || to <= from) reason = "Outside the comparable observation window or without a distinct reporting interval.";
      else if (interval.outcome < 0) {
        reason = "The outcome decreased. Clarify refunds, corrections or a reset before estimating a return from this history.";
        unresolvedOutcome = true;
      } else if (input === null) reason = "Input reports are missing or their quantities are unknown.";
      else if (input === 0) {
        reason = interval.outcome > 0 ? "The outcome increased without recorded input. Check earlier work, other causes and feedback delay before estimating a return." : "No recorded input or outcome change; this does not define an input-to-outcome return.";
        if (interval.outcome > 0) unresolvedOutcome = true;
      }
      if (reason) excludedPeriods.push({ ...interval, reason });
      else pairs.push({ ...interval, input: input! });
    }
  }
  const evidence = { model, unit, daily, pace, paceSource, pairs, excludedPeriods,
    measured: records.filter(a => quantity(a) !== null).length, due: records.length,
    plannedDaily, sourceIds: records.filter(a => quantity(a) !== null).map(a => a.id) };
  if (current === null) return { ...base, status: "Record a starting outcome", projection: null, evidence };
  if (goal.status !== "Active" && goal.status !== "Draft") return { ...base, status: goal.status, projection: null, evidence };
  if (unresolvedOutcome) return { ...base, status: "Review the outcome changes", projection: null, evidence };
  if (model.kind === "learned" && !pairs.length)
    return { ...base, status: "Learning the input–outcome link", projection: null, evidence };
  const conversion = model.inputPerOutcome;
  const observedYield = pairs.length ? pairs.reduce((sum, p) => sum + p.outcome, 0) / pairs.reduce((sum, p) => sum + p.input, 0) : 0;
  const yieldRange = model.kind === "direct" && conversion
    ? { low: 1 / conversion.high, expected: 1 / conversion.expected, high: 1 / conversion.low }
    : { low: 0, expected: observedYield, high: Math.max(observedYield * 2, ...pairs.map(p => p.outcome / p.input)) };
  if (model.kind === "learned" && observedYield <= 0) return { ...base, status: "No outcome response observed yet", projection: null, evidence };
  const origin = current >= target ? latest?.date ?? today : today;
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
        { label: "How this estimate works", text: model.rationale },
        { label: "Starting from your last report", text: `The scenario starts today. Last reported ${measure.label.toLowerCase()}: ${current}${latest ? ` (${latest.date})` : " (saved baseline)"}. Changes since that report are unknown; update it to revise this estimate.` },
        { label: "Future work", text: paceSource === "Provisional input pace" ? "Until two complete weeks are measured, the saved input budget is a scenario, with half to one-and-a-half times that pace. This is a provisional sensitivity range." : "The scenario uses complete weeks of recorded scheduled work. Identical weeks use a provisional half-to-one-and-a-half range instead of implying certainty. Unscheduled work is not estimated." },
        { label: "Gaps in the record", text: "Missing expected records and unanswered quantities are unknown and exclude a week or matched period. Days without planned work are labelled separately, not recorded as failed or zero-activity days." },
        { label: "How work relates to the result", text: model.kind === "direct" ? "The saved input-to-outcome conversion continues to apply." : "Future return is explored from zero to twice the observed average, or the largest observed return if higher. This is a provisional sensitivity range; association does not establish cause." },
        { label: "Feedback delay", text: model.kind === "learned" ? "The scenario continues the observed input pipeline. Feedback delay aligns past inputs with outcomes; it does not restart at each outcome report." : model.feedbackDelayDays === 0 ? "No additional delay between input and outcome is assumed." : `New input is assumed to affect outcomes after ${model.feedbackDelayDays} days.` },
        { label: "What the range means", text: "The shaded fan is a conditional scenario range, not a confidence interval or a guarantee. Future cycles are not bookings." },
      ] } };
}
