import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { goalProjection } from "../shared/goal-projection";
import { addDays, dateInZone } from "../shared/journey";
import { recordLink } from "../shared/record-links";
import { formatDate, type Data, type Goal } from "./store";
import "./goal-progress.css";
import { Modal } from "./components";

const number = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 1 });
export const projectionDate = (date: string | null) => date ? formatDate(date, { month: "short", day: "numeric", year: "numeric" }) : "Beyond this horizon";

export function GoalProjection({ data, goal, today = dateInZone(data.timeZone), compact = false }: { data: Data; goal: Goal; today?: string; compact?: boolean }) {
  const [narrow, setCompact] = useState(() => matchMedia("(max-width: 650px)").matches);
  useEffect(() => {
    const query = matchMedia("(max-width: 650px)");
    const resize = () => setCompact(query.matches);
    query.addEventListener("change", resize);
    return () => query.removeEventListener("change", resize);
  }, []);
  const [inspecting, setInspecting] = useState(false);
  const model = goalProjection(data, goal, today);
  const { projection, evidence } = model;
  const plan = goal.plans.at(-1)!;
  const projectionModel = plan.adaptive?.projection;
  const input = projectionModel
    ? plan.adaptive?.steps.find(step => step.id === projectionModel.driverStepId)?.measure
    : plan.adaptive?.steps.find(step => step.measure)?.measure ?? plan.basis?.actionMeasure;
  const inputLabel = projectionModel?.inputMetric === "hours" ? "Reported work time (hours)" : input ? `${input.label} (${input.unit})` : "Action reports";
  const tracking = goal.measure?.label ?? (goal.milestones.length ? "Verified milestones" : goal.success);
  const noEstimate = plan.adaptive?.projectionUnavailableReason ?? (goal.measure
    ? "Your results are tracked. Adler can review which input supports an estimate as you report what happens."
    : "Your actions and verified results are tracked separately. Completing an action does not predict when the whole goal will be finished.");
  const editTracking = `/app/check-in?${new URLSearchParams({ goal: goal.id, prompt: "Review the tracking you chose for this goal. Suggest the most useful controllable input and outcome, explain your choice, and let me edit it." })}`;
  const trackingSummary = <div className="projection-tracking"><div><small>WHAT WE’RE TRACKING</small><p>{inputLabel} <span aria-hidden="true">·</span> {tracking}</p></div><Link className="text-link" to={editTracking}>Edit tracking ↗</Link></div>;
  if (model.target <= 0 && compact) return <section className="goal-outlook-compact" aria-label={`Goal outlook for ${goal.title}`}><small>GOAL OUTLOOK</small><strong>Progress without a finish estimate</strong><span>{inputLabel}</span><button className="text-link" onClick={() => setInspecting(true)}>What we’re tracking ↗</button>{inspecting && <Modal title="Your goal outlook" onClose={() => setInspecting(false)}><GoalProjection data={data} goal={goal} today={today} /></Modal>}</section>;
  if (model.target <= 0) return <section className="goal-projection" aria-label={`Goal timeline for ${goal.title}`}><h2>Progress toward what matters to you</h2>{trackingSummary}<p>{noEstimate}</p><Link className="text-link" to={`/app/check-in?goal=${goal.id}`}>Review progress in Check-in ↗</Link></section>;
  const end = [today, projection?.points.at(-1)!.date ?? goal.targetDate ?? today].sort().at(-1)!;
  const start = [model.observations[0]?.date ?? goal.startDate ?? today, projection?.origin ?? today, today].sort()[0];
  const span = Math.max(86400000, Date.parse(end) - Date.parse(start));
  const chartWidth = compact || narrow ? 400 : 800;
  const right = chartWidth - (compact || narrow ? 16 : 52);
  const x = (date: string) => 48 + (right - 48) * (Date.parse(date) - Date.parse(start)) / span;
  const y = (value: number) => 250 - Math.min(1, value / model.target) * 220;
  const path = (points: { date: string; value: number }[]) => points.map((p, i) => `${i ? "L" : "M"}${x(p.date)},${y(p.value)}`).join(" ");
  const fan = projection ? path(projection.points.map(p => ({ date: p.date, value: p.high }))) + " " +
    projection.points.slice().reverse().map(p => `L${x(p.date)},${y(p.low)}`).join(" ") + " Z" : "";
  const inputUnit = evidence?.unit ?? "input units";
  const figure = (<figure className="outcome-timeline">
      <span className="projection-axis-label">Goal attained (%)</span>
      <svg viewBox={`0 0 ${chartWidth} 295`} role="img" aria-label={`${goal.title}. Goal attainment from 0 to 100 percent over time. ${projection ? `Projected finish ${projectionDate(projection.expectedDate)}. Shaded area and error bars show conditional goal attainment scenarios, not action completion uncertainty.` : model.status}`}>
        {[0, 50, 100].map(value => <g key={value}><line x1="48" x2={right} y1={y(model.target * value / 100)} y2={y(model.target * value / 100)} className={value === 100 ? "outcome-target" : "outcome-grid"} /><text x="37" y={y(model.target * value / 100) + 4} textAnchor="end">{value}%</text></g>)}
        <text x={right - 2} y="19" textAnchor="end">{number(model.target)} {goal.measure?.unit ?? goal.unit ?? "milestones"} · Your goal</text>
        {projection && <>
          <path className="outcome-fan" d={fan} />
          <line className="outcome-boundary" x1={x(today)} x2={x(today)} y1="30" y2="250" />
          <text x={Math.min(x(today) + 7, right - 42)} y="52">Today</text>
          <path className="outcome-projected" d={path(projection.points.map(p => ({ date: p.date, value: p.expected })))} />
          {projection.points.filter((_, index) => index > 0 && index % 8 === 0).map(p => <path key={p.date} className="outcome-error" d={`M${x(p.date)},${y(p.high)} V${y(p.low)} M${x(p.date) - 4},${y(p.high)} h8 M${x(p.date) - 4},${y(p.low)} h8`}><title>{formatDate(p.date)}: {number(100 * p.low / model.target)}–{number(100 * p.high / model.target)}% of goal</title></path>)}
        </>}
        <path className="outcome-recorded" d={path(model.observations)} />
        {model.observations.map(p => <circle className="outcome-point" key={p.id} cx={x(p.date)} cy={y(p.value)} r="4"><title>{formatDate(p.date)}: {number(p.value)} {goal.measure?.unit ?? goal.unit}</title></circle>)}
        {!projection && <text x={chartWidth / 2} y="147" textAnchor="middle">{model.status}</text>}
        {(Date.parse(end) - Date.parse(start) < 86400000 ? [0] : compact || narrow ? [0, .5, 1] : [0, .25, .5, .75, 1]).map(f => { const date = addDays(start, Math.round(span / 86400000 * f)); return <text key={f} x={x(date)} y="277" textAnchor={f === 0 ? "start" : f === 1 ? "end" : "middle"}>{formatDate(date, { month: "short", ...(span < 90 * 86400000 ? { day: "numeric" } : { year: "numeric" }) })}</text>; })}
      </svg>
      <figcaption><span><i className="outcome-key actual" />Reported outcome</span>{projection && <><span><i className="outcome-key projected" />Projected outcome</span><span><i className="outcome-key range" />Conditional scenario range</span></>}<span>Time →</span></figcaption>
    </figure>);
  if (compact) return <section className="goal-outlook-compact" aria-label={`Goal outlook for ${goal.title}`}><small>GOAL OUTLOOK</small><strong>{projection ? projectionDate(projection.expectedDate) : model.status}</strong>{projection && <><span>At {evidence?.paceSource === "Observed input pace" ? "the reported" : "the planned"} input pace</span>{figure}<small>Conditional range · not a success probability</small></>}<button className="text-link" onClick={() => setInspecting(true)}>How this is estimated ↗</button>{inspecting && <Modal title="Your goal outlook" onClose={() => setInspecting(false)}><GoalProjection data={data} goal={goal} today={today} /></Modal>}</section>;
  return <section className="goal-projection" aria-label={`Goal timeline for ${goal.title}`}>
    <div className="projection-heading"><div><span className="section-kicker">YOUR PATH TO THE GOAL</span><h2>{goal.title}</h2><strong className="projection-current">{model.current === null ? "Starting point needed" : `${number(model.current)} / ${number(model.target)} ${goal.measure?.unit ?? goal.unit ?? "milestones"}`}</strong><small>{model.observations.length ? `Last reported ${formatDate(model.observations.at(-1)!.date)}` : "Starting baseline"}</small></div><div><span>Projected finish</span><strong>{projection ? projectionDate(projection.expectedDate) : model.status}</strong><small>{projection && `Scenario range: ${projectionDate(projection.earliestDate)} – ${projectionDate(projection.latestDate)}`}</small></div></div>
    {figure}
    {trackingSummary}
    {!projection && <p className="small-text muted">{noEstimate}</p>}
    {projection && <p className="small-text muted">Conditional on your input pace and the relationship holding. The range shows scenarios, not a success probability.</p>}
    {evidence && <details className="projection-evidence"><summary>Explore the input and the evidence <span>+</span></summary>
      <div className="input-outcome-link">
      <div><span>{evidence.paceSource}</span><strong>{number(evidence.pace.expected)} {inputUnit} / day</strong><small>{evidence.measured} / {evidence.due} action quantities known</small></div><span className="relation-arrow" aria-hidden="true">→</span>
      <div><span>{evidence.model.kind === "direct" ? "How the input adds up" : "What we’re learning about the link"}</span><strong>{evidence.model.kind === "direct" ? `${number(evidence.model.inputPerOutcome!.expected * model.target)} ${inputUnit} for ${number(model.target)} ${goal.measure!.unit}` : projection ? `${number(projection.yieldRange.expected)} ${goal.measure!.unit} / ${inputUnit}` : "We need input and result reports"}</strong><small>{evidence.model.kind === "learned" ? `${evidence.pairs.length} matched intervals · ${evidence.model.feedbackDelayDays}-day feedback delay` : evidence.model.rationale}</small></div>
    </div>

      {!projection && <p>{evidence.model.rationale}</p>}
      {evidence.excludedPeriods.length > 0 && <section className="reasoning-details"><h3>Periods that need context</h3><p>These reports remain part of your history. They are not silently treated as successful input–outcome evidence.</p>{evidence.excludedPeriods.map((period, index) => <div key={index}><strong>{formatDate(period.start)}–{formatDate(period.end)}</strong><span>{period.input === null ? "Unknown input" : `${number(period.input)} ${inputUnit}`} · Outcome change: {number(period.outcome)} {goal.measure!.unit}</span><p>{period.reason}</p><div className="projection-source-links">{period.sourceIds.slice(0, 2).map(id => <Link key={id} to={recordLink(data, id)!}>Outcome report ↗</Link>)}</div></div>)}</section>}
      <div className="input-evidence-plot"><h3>{inputUnit} per day</h3><svg viewBox="0 0 760 130" role="img" aria-label={`Measured ${inputUnit} per day. Missing quantities leave gaps.`}>
        {(() => { const max = Math.max(1, ...evidence.daily.map(d => d.amount ?? 0)); const cx = (i: number) => 40 + i / Math.max(1, evidence.daily.length - 1) * 680; const cy = (v: number) => 95 - v / max * 75; return <><text x="5" y="24">{number(max)}</text><text x="5" y="98">0</text><line x1="40" x2="720" y1="95" y2="95" className="outcome-grid"/><path className="outcome-recorded" d={evidence.daily.map((d, i) => d.amount === null ? "" : `${i && evidence.daily[i - 1].amount !== null ? "L" : "M"}${cx(i)},${cy(d.amount)}`).join(" ")} /><text x="40" y="122">{formatDate(evidence.daily[0]?.date ?? today)}</text><text x="720" y="122" textAnchor="end">{formatDate(today)}</text></>; })()}
      </svg></div>
      {evidence.model.kind === "learned" && evidence.pairs.length > 0 && <div className="input-evidence-plot"><h3>Observed input → outcome</h3><svg viewBox="0 0 760 180" role="img" aria-label={`Association between ${inputUnit} and ${goal.measure!.unit} in matched intervals. Not proof of causation.`}>
        {(() => { const maxX = Math.max(1, ...evidence.pairs.map(p => p.input)), maxY = Math.max(1, ...evidence.pairs.map(p => p.outcome)); return <><text x="40" y="18">{goal.measure!.unit}</text><text x="30" y="39" textAnchor="end">{number(maxY)}</text><text x="30" y="143" textAnchor="end">0</text><line x1="40" x2="720" y1="140" y2="140" className="outcome-grid"/><text x="40" y="158">0</text><text x="690" y="158" textAnchor="middle">{number(maxX)}</text><text x="720" y="170" textAnchor="end">{inputUnit} →</text>{evidence.pairs.map(p => <circle className="outcome-point" key={p.end} cx={40 + 650 * p.input / maxX} cy={140 - 105 * p.outcome / maxY} r="5"><title>{p.start}–{p.end}: {number(p.input)} {inputUnit} → {number(p.outcome)} {goal.measure!.unit}</title></circle>)}</>; })()}
      </svg><p>These intervals can differ in duration and circumstances. Their observed return guides a scenario; it does not isolate the effect of your work.</p></div>}
      {projection && <section className="projection-assumptions" aria-label="Projection assumptions">
        <h3>What this projection assumes</h3>
        <dl>{projection.assumptions.map(note => <div key={note.label}><dt>{note.label}</dt><dd>{note.text}</dd></div>)}</dl>
      </section>}
      <div className="projection-sources"><h3>Reports behind the estimate</h3>
        <div className="projection-source-links">{evidence.sourceIds.slice(-6).map(id => <Link key={id} to={recordLink(data, id)!}>Input · {formatDate(data.actions.find(a => a.id === id)!.date)}</Link>)}{model.observations.slice(-3).map(r => <Link key={r.id} to={recordLink(data, r.id)!}>Outcome · {formatDate(r.date)}</Link>)}</div>
      </div>
    </details>}
    <Link className="text-link" to={`/app/check-in?goal=${goal.id}&prompt=${encodeURIComponent("Let’s review the input I can control, its relationship to this goal, and the projection assumptions.")}`}>Discuss this estimate in Check-in ↗</Link>
  </section>;
}
