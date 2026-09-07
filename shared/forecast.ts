import { z } from "zod";
import type { Data, Goal } from "./workspace.ts";
import { addDays, dateInZone } from "./journey.ts";
import { actionStep, stepDates } from "./adaptive-plan.ts";

export const forecastSchema = z.object({
  at: z.iso.datetime(), asOf: z.iso.date(), anchorDate: z.iso.date().optional(), planVersion: z.number().int(),
  status: z.enum(["unavailable", "provisional", "reached", "beyond-horizon"]),
  method: z.enum(["none", "observed-rate", "behavior-rate"]),
  reason: z.string().max(3000), inputKey: z.string().max(100000),
  sourceIds: z.array(z.string()).max(10000),
  inputs: z.array(z.object({ label: z.string(), value: z.string() }).strict()).max(20),
  current: z.number().nullable(), probability: z.null(),
  expectedDate: z.iso.date().optional(), earliestDate: z.iso.date().optional(), latestDate: z.iso.date().optional(),
  expectedValue: z.number().optional(), targetDate: z.iso.date().optional(),
  horizonDate: z.iso.date(),
  rates: z.object({ low: z.number(), typical: z.number(), high: z.number() }).strict().optional(),
}).strict();
export type Forecast = z.infer<typeof forecastSchema>;

const days = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / 86400000;
const rounded = (value: number) => Math.round(value * 100) / 100;

export function forecastGoal(data: Data, goal: Goal, now = new Date()): Forecast {
  const today = dateInZone(data.timeZone, now);
  const version = goal.plans.at(-1)!;
  const plan = version.adaptive;
  const settings = plan?.forecast;
  const observations = [...new Map(goal.results.filter(r => r.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date)).map(r => [r.date, r])).values()]
    .filter(r => !settings?.observationStart || r.date >= settings.observationStart)
    .slice(-(settings?.minimumObservations ?? 3));
  const last = observations.at(-1);
  const driver = plan?.steps.find(s => s.id === settings?.driverStepId);
  const actions = driver ? data.actions.filter(a => a.goalId === goal.id && a.stepId === driver.id &&
    !a.retiredAt && a.date <= today && (a.date < today || a.outcome) &&
    (!settings?.observationStart || a.date >= settings.observationStart) &&
    actionStep(data, a)?.measure?.id === driver.measure?.id) : [];
  const forecast: Forecast = {
    at: now.toISOString(), asOf: today, planVersion: version.version,
    status: "unavailable", method: settings?.method ?? "none", reason: "Building the first estimate.",
    inputKey: JSON.stringify({ modelVersion: 2, today, version: version.version, settings, window: plan?.window, driver,
      target: goal.measure, targetDate: goal.targetDate, observations, actions: actions.map(a => [a.id, a.date, a.outcome, a.amount, a.planVersion]) }),
    sourceIds: observations.map(r => r.id), current: last?.value ?? null, anchorDate: last?.date,
    inputs: [
      { label: "Target", value: `${goal.measure?.target ?? goal.target ?? goal.success} ${goal.measure?.unit ?? goal.unit ?? ""}${goal.targetDate ? ` by ${goal.targetDate}` : "; no fixed deadline"}` },
      { label: "Dated outcomes", value: observations.length ? observations.map(r => `${r.date}: ${r.value}`).join("; ") : "None reported" },
      { label: "Approach", value: plan?.approach ?? "No adaptive approach selected" },
    ],
    probability: null, targetDate: goal.targetDate,
    horizonDate: addDays(today, settings?.horizonDays ?? 90),
  };
  function unavailable(reason: string) { forecast.reason = reason; return forecast; }
  if (!plan || !settings || settings.method === "none") return unavailable(settings?.rationale ?? "A forecast method has not been chosen for this goal.");
  if (!goal.measure || goal.measure.aggregation !== "cumulative")
    return unavailable("This rate model requires a cumulative outcome. Period totals, skill scores, and deliverables need a different model.");
  if (last && last.value >= goal.measure.target) {
    forecast.status = "reached";
    forecast.expectedDate = last!.date;
    return unavailable("Your recorded outcome has reached the target.");
  }
  if (observations.length < settings.minimumObservations)
    return unavailable(`Record ${settings.minimumObservations} dated outcome observations to build this estimate; ${observations.length} are available.`);
  if (days(last!.date, today) > settings.freshnessDays)
    return unavailable(`The latest outcome is from ${last!.date}. Update it before relying on a forecast.`);
  forecast.inputs.push({ label: "Outcome evidence", value: `${observations.length} observations, ${observations[0].date}–${last!.date}` });
  let samples: number[] = [];
  for (let i = 1; i < observations.length; i++) {
    const previous = observations[i - 1];
    const current = observations[i];
    const delta = current.value - previous.value;
    if (delta < 0) return unavailable("Cumulative results decreased. Review the measurement or correction before extending its pace.");
    samples.push(delta / days(previous.date, current.date));
  }
  if (settings.method === "behavior-rate") {
    if (!driver?.measure?.target || !driver.recurrence)
      return unavailable("Choose a measured repeating behavior before linking work to a projection.");
    const lag = plan.assessment.feedbackDelayDays;
    const start = addDays(observations[0].date, -lag);
    const relevant = actions.filter(a => a.date >= start);
    forecast.sourceIds.push(...relevant.map(a => a.id));
    if (relevant.length < settings.minimumObservations || relevant.some(a => !a.outcome || (a.outcome !== "Didn’t happen" && a.amount === undefined)))
      return unavailable("More confirmed behavior amounts are needed. Unanswered check-ins and missing amounts remain unknown.");
    const amount = (a: typeof relevant[number]) => a.outcome === "Didn’t happen" ? 0 : a.amount!;
    const expected = relevant.reduce((sum, a) => sum + (actionStep(data, a)?.measure?.target ?? 0), 0);
    if (!expected) return unavailable("The recorded behaviors do not have comparable planned amounts.");
    const delivered = relevant.reduce((sum, a) => sum + amount(a), 0);
    const adherence = delivered / expected;
    const plannedPerDay = stepDates(plan, driver).length * driver.measure.target / (days(plan.window.start, plan.window.end) + 1);
    samples = [];
    for (let i = 1; i < observations.length; i++) {
      const input = relevant.filter(a => a.date > addDays(observations[i - 1].date, -lag) && a.date <= addDays(observations[i].date, -lag))
        .reduce((sum, a) => sum + amount(a), 0);
      if (!input) return unavailable("There is not enough matched behavior and outcome evidence to estimate their relationship.");
      samples.push((observations[i].value - observations[i - 1].value) / input * plannedPerDay * adherence);
    }
    forecast.inputs.push(
      { label: "Confirmed behavior", value: `${rounded(delivered)} / ${rounded(expected)} ${driver.measure.unit} across ${relevant.length} opportunities` },
      { label: "Current commitment", value: `${rounded(plannedPerDay)} ${driver.measure.unit} per day, averaged over ${plan.window.start}–${plan.window.end}` },
      { label: "Feedback delay", value: `${lag} days` },
    );
  }
  samples.sort((a, b) => a - b);
  const middle = Math.floor(samples.length / 2);
  const typical = samples.length % 2 ? samples[middle] : (samples[middle - 1] + samples[middle]) / 2;
  forecast.rates = { low: samples[0], typical, high: samples.at(-1)! };
  const remaining = goal.measure.target - last!.value;
  function finish(rate: number) {
    if (rate <= 0) return undefined;
    const duration = Math.ceil(remaining / rate);
    const date = addDays(last!.date, duration);
    return date <= forecast.horizonDate ? date : undefined;
  }
  forecast.expectedDate = finish(typical);
  forecast.earliestDate = finish(samples.at(-1)!);
  forecast.latestDate = finish(samples[0]);
  if (goal.targetDate && goal.targetDate >= today && goal.targetDate <= forecast.horizonDate)
    forecast.expectedValue = rounded(last!.value + typical * days(last!.date, goal.targetDate));
  forecast.status = forecast.expectedDate ? "provisional" : "beyond-horizon";
  forecast.reason = settings.method === "behavior-rate"
    ? "A conditional scenario using the observed outcome per behavior amount and your recorded follow-through, if the current commitment continues. This relationship may change; it is not a causal guarantee."
    : "A conditional scenario if the recent recorded outcome pace continues. Actions alone do not change this outcome-only model.";
  forecast.inputs.push(
    { label: "Daily pace", value: `${rounded(typical)} ${goal.measure.unit}; observed range ${rounded(samples[0])}–${rounded(samples.at(-1)!)}. Projected from the ${last!.date} observation; later progress is unverified.` },
    { label: "Assumption", value: settings.rationale },
    { label: "Scenario range", value: "Slowest to fastest observed interval; not a statistical confidence interval or success probability." },
  );
  return forecast;
}

export function refreshForecasts(data: Data, now = new Date()) {
  for (const goal of data.goals) {
    if (!goal.plans.at(-1)?.adaptive || (goal.status !== "Active" && goal.status !== "Draft")) continue;
    const forecast = forecastGoal(data, goal, now);
    if (forecast.inputKey === goal.forecasts?.at(-1)?.inputKey) continue;
    goal.forecasts = [...(goal.forecasts ?? []), forecast].slice(-100);
  }
}
