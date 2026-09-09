import { Link } from "react-router-dom";
import { ArrowUpRight, Flag } from "lucide-react";
import { formatDate, useStore } from "./store";
import { goalPlanProgress } from "../shared/today";

const number = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 1 });

function GoalPlanChart({ progress, today }: { progress: ReturnType<typeof goalPlanProgress>; today: string }) {
  const { goal, observations, checkpoints, target } = progress;
  const dates = [today, ...observations.map(point => point.date), ...checkpoints.map(point => point.date), goal.startDate ?? goal.plans[0].date].sort();
  const start = Date.parse(dates[0]), end = Date.parse(dates.at(-1)!);
  const values = [...observations, ...checkpoints].map(point => point.value);
  const low = Math.min(0, ...values), high = Math.max(1, target, ...values);
  const x = (date: string) => 16 + (Date.parse(date) - start) / Math.max(86400000, end - start) * 268;
  const y = (value: number) => 84 - (value - low) / (high - low) * 66;
  const actualPath = observations.map((point, index) => `${index ? "L" : "M"}${x(point.date)},${y(point.value)}`).join(" ");
  // Steps mean a result is committed by its checkpoint date, not linearly each day.
  const plannedPath = checkpoints.map((point, index) => index ? `H${x(point.date)}V${y(point.value)}` : `M${x(point.date)},${y(point.value)}`).join(" ");
  return <svg viewBox="0 0 300 116" role="img" aria-label={`${goal.title}: reported results and saved plan checkpoints over time. ${progress.actual === null ? "No result reported." : `${number(progress.actual)} ${progress.unit} recorded.`} ${progress.due ? `${number(progress.due.value)} planned by ${formatDate(progress.due.date)}.` : "No checkpoint due yet."}`}>
    {[low, high].map(value => <g key={value}><line x1="16" x2="284" y1={y(value)} y2={y(value)} className="today-trend-grid" /><text x="16" y={y(value) - 5}>{number(value)}</text></g>)}
    <line x1={x(today)} x2={x(today)} y1="12" y2="87" className="today-trend-now" />
    <text x={x(today)} y="9" textAnchor={x(today) < 45 ? "start" : x(today) > 255 ? "end" : "middle"}>Today</text>
    <path d={plannedPath} className="today-trend-plan" />
    {checkpoints.map((point, index) => <path key={`${point.date}-${index}`} d={`M${x(point.date)} ${y(point.value) - 4}l4 4-4 4-4-4Z`} className="today-trend-checkpoint"><title>{point.label} · {formatDate(point.date)}: {number(point.value)} {progress.unit} planned</title></path>)}
    <path d={actualPath} className="today-trend-reported" />
    {observations.map((point, index) => <circle key={`${point.date}-${index}`} cx={x(point.date)} cy={y(point.value)} r="3.5" className="today-trend-point"><title>{formatDate(point.date)}: {number(point.value)} {progress.unit} recorded</title></circle>)}
    {!observations.length && <text className="today-trend-empty" x="145" y="58" textAnchor="middle">{progress.actual === null ? "No result reported" : "Result date not recorded"}</text>}
    <text x="16" y="109">{formatDate(dates[0])}</text><text x="284" y="109" textAnchor="end">{formatDate(dates.at(-1)!, { month: "short", day: "numeric", year: "numeric" })}</text>
  </svg>;
}

export function TodayProgress({ today }: { today: string }) {
  const { data } = useStore();
  const goals = data.goals.map(goal => goalPlanProgress(goal, today));
  return <section className="today-card today-progress" id="today-progress" aria-labelledby="today-progress-title">
    <header className="today-card-heading"><h2 id="today-progress-title"><span>02</span> Your progress</h2><span className="today-progress-meta">{goals.length} {goals.length === 1 ? "GOAL" : "GOALS"} · {formatDate(today)}</span></header>
    <div className="today-progress-intro"><h3>The whole<span className="today-wide-break"> picture.</span></h3><div><p>Where each goal stands.<br /> Next to the plan you chose.</p><div className="today-trend-legend"><span><i />Recorded results</span><span><i />Plan checkpoints</span></div></div></div>
    <ul className="today-goals-progress" role="list" aria-label="All goals and progress relative to plan">
      {goals.map(progress => {
        const { goal, actual, target, due, next, observedAt, label, measured } = progress;
        const hasOutcome = measured || goal.milestones.length > 0;
        const needsUpdate = ["Add a result", "Update needed", "Verify the milestone"].includes(label);
        const prompt = needsUpdate ? `I’d like to update my result for “${goal.title}” and see how it compares with the plan.` : `Help me review my progress on “${goal.title}” and choose my next step.`;
        return <li key={goal.id} className="today-goal-progress" data-tone={progress.tone}>
          <div className="today-goal-result"><Link to={`/app/goals/${goal.id}`}>{goal.title}<ArrowUpRight size={14} /></Link><p><strong>{actual === null ? "—" : number(actual)}</strong>{target > 0 && <span> / {number(target)}</span>}<span className="today-result-unit">{hasOutcome ? `${progress.unit}${!measured ? " verified" : ""}` : "No outcome measure saved"}</span></p><small>{observedAt ? `Reported ${formatDate(observedAt)}` : measured && actual !== null ? "Saved starting point" : goal.status === "Draft" ? "Goal saved · plan not started" : "Current saved record"}</small></div>
          <Link className="today-goal-trend" to={`/app/goals/${goal.id}`} aria-label={`Inspect progress and plan for ${goal.title}`}><GoalPlanChart progress={progress} today={today} /></Link>
          <div className="today-goal-comparison"><strong className="today-comparison-status">{label}</strong><p>{due ? <>{number(due.value)} {progress.unit} planned by {formatDate(due.date)}{progress.openMilestones.length > 0 ? <span className="today-comparison-gap">Still open: {progress.openMilestones.map(milestone => milestone.title).join(", ")}</span> : progress.delta !== null && <span className="today-comparison-gap">{progress.delta === 0 ? "Matches the saved checkpoint" : `${progress.delta > 0 ? "+" : "−"}${number(Math.abs(progress.delta))} vs checkpoint`}</span>}{needsUpdate && <span className="today-comparison-gap">{observedAt ? "A newer report will make the comparison useful." : "Update the result to compare it with the plan."}</span>}{next && <span className="today-comparison-gap">Next: {number(next.value)} {progress.unit} · {formatDate(next.date)}</span>}</> : next ? <>Next checkpoint · {formatDate(next.date)}<span className="today-comparison-gap">{number(next.value)} {progress.unit} planned</span></> : hasOutcome ? "Add a dated checkpoint to compare your result with the plan." : "Your actions stay separate from an outcome comparison."}</p><Link to={`/app/check-in?${new URLSearchParams({ goal: goal.id, prompt })}`}>{needsUpdate ? "Update progress" : goal.status === "Draft" ? "Shape the plan" : "Review plan"}<ArrowUpRight size={13} /></Link></div>
        </li>;
      })}
    </ul>
    <p className="today-progress-note"><Flag size={15} aria-hidden="true" /> Checkpoints are commitments, not forecasts. Lines join saved reports; changes between reports are unknown.</p>
  </section>;
}
