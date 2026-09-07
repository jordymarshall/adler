import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { goalProjection } from "../shared/goal-projection";
import { addDays, dateInZone } from "../shared/journey";
import { recordLink } from "../shared/record-links";
import { formatDate, type Data, type Goal } from "./store";
import "./goal-progress.css";

const number = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 1 });
export const projectionDate = (date: string | null) => date ? formatDate(date, { month: "short", day: "numeric", year: "numeric" }) : "Beyond this horizon";

export function GoalProjection({ data, goal, today = dateInZone(data.timeZone) }: { data: Data; goal: Goal; today?: string }) {
  const [compact, setCompact] = useState(() => matchMedia("(max-width: 650px)").matches);
  useEffect(() => {
    const query = matchMedia("(max-width: 650px)");
    const resize = () => setCompact(query.matches);
    query.addEventListener("change", resize);
    return () => query.removeEventListener("change", resize);
  }, []);
  const model = goalProjection(data, goal, today);
  const { projection, evidence } = model;
  if (model.target <= 0) return <section className="goal-projection"><h2>Progress toward what matters to you</h2><p>This goal has no numerical finish line. Use check-ins to review what is changing and choose a useful outcome signal.</p><Link className="text-link" to={`/app/check-in?goal=${goal.id}`}>Review progress in Check-in ↗</Link></section>;
  const end = [today, projection?.points.at(-1)!.date ?? goal.targetDate ?? addDays(today, 90)].sort().at(-1)!;
  const start = [model.observations[0]?.date ?? today, projection?.origin ?? today, today].sort()[0];
  const span = Math.max(86400000, Date.parse(end) - Date.parse(start));
  const chartWidth = compact ? 400 : 800;
  const right = chartWidth - (compact ? 16 : 52);
  const x = (date: string) => 48 + (right - 48) * (Date.parse(date) - Date.parse(start)) / span;
  const y = (value: number) => 250 - Math.min(1, value / model.target) * 220;
  const path = (points: { date: string; value: number }[]) => points.map((p, i) => `${i ? "L" : "M"}${x(p.date)},${y(p.value)}`).join(" ");
  const fan = projection ? path(projection.points.map(p => ({ date: p.date, value: p.high }))) + " " +
    projection.points.slice().reverse().map(p => `L${x(p.date)},${y(p.low)}`).join(" ") + " Z" : "";
  const inputUnit = evidence?.unit ?? "input units";
  return <section className="goal-projection" aria-label={`Goal timeline for ${goal.title}`}>
    <div className="projection-heading"><div><span className="section-kicker">YOUR PATH TO THE GOAL</span><h2>{goal.title}</h2><strong className="projection-current">{model.current === null ? "Starting point needed" : `${number(model.current)} / ${number(model.target)} ${goal.measure?.unit ?? goal.unit ?? "milestones"}`}</strong><small>{model.observations.length ? `Last reported ${formatDate(model.observations.at(-1)!.date)}` : "Starting baseline"}</small></div><div><span>Projected finish</span><strong>{projection ? projectionDate(projection.expectedDate) : model.status}</strong><small>{projection && `Scenario range: ${projectionDate(projection.earliestDate)} – ${projectionDate(projection.latestDate)}`}</small></div></div>
    <figure className="outcome-timeline">
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
        {(compact ? [0, .5, 1] : [0, .25, .5, .75, 1]).map(f => { const date = addDays(start, Math.round(span / 86400000 * f)); return <text key={f} x={x(date)} y="277" textAnchor={f === 0 ? "start" : f === 1 ? "end" : "middle"}>{formatDate(date, { month: "short", year: "numeric" })}</text>; })}
      </svg>
      <figcaption><span><i className="outcome-key actual" />Reported outcome</span><span><i className="outcome-key projected" />Projected outcome</span><span><i className="outcome-key range" />Conditional scenario range</span><span>Time →</span></figcaption>
    </figure>
    {projection && <p className="small-text muted">Conditional on your input pace and the relationship holding. The range shows scenarios, not a success probability.</p>}
    {evidence && <div className="input-outcome-link">
      <div><span>{evidence.paceSource}</span><strong>{number(evidence.pace.expected)} {inputUnit} / day</strong><small>{evidence.measured} / {evidence.due} action quantities known</small></div><span className="relation-arrow" aria-hidden="true">→</span>
      <div><span>{evidence.model.kind === "direct" ? "Conversion assumption" : "Relationship being learned"}</span><strong>{evidence.model.kind === "direct" ? `${number(evidence.model.inputPerOutcome!.expected * model.target)} ${inputUnit} for ${number(model.target)} ${goal.measure!.unit}` : projection ? `${number(projection.yieldRange.expected)} ${goal.measure!.unit} / ${inputUnit}` : "Waiting for paired observations"}</strong><small>{evidence.model.kind === "learned" ? `${evidence.pairs.length} matched intervals · ${evidence.model.feedbackDelayDays}-day feedback delay` : evidence.model.rationale}</small></div>
    </div>}
    {evidence && <details className="projection-evidence"><summary>Explore the input and the evidence <span>+</span></summary>
      <p>{evidence.model.rationale}</p>
      <div className="input-evidence-plot"><h3>{inputUnit} per day</h3><svg viewBox="0 0 760 130" role="img" aria-label={`Measured ${inputUnit} per day. Missing quantities leave gaps.`}>
        {(() => { const max = Math.max(1, ...evidence.daily.map(d => d.amount ?? 0)); const cx = (i: number) => 40 + i / Math.max(1, evidence.daily.length - 1) * 680; const cy = (v: number) => 95 - v / max * 75; return <><text x="5" y="24">{number(max)}</text><text x="5" y="98">0</text><line x1="40" x2="720" y1="95" y2="95" className="outcome-grid"/><path className="outcome-recorded" d={evidence.daily.map((d, i) => d.amount === null ? "" : `${i && evidence.daily[i - 1].amount !== null ? "L" : "M"}${cx(i)},${cy(d.amount)}`).join(" ")} /><text x="40" y="122">{formatDate(evidence.daily[0]?.date ?? today)}</text><text x="720" y="122" textAnchor="end">{formatDate(today)}</text></>; })()}
      </svg></div>
      {evidence.model.kind === "learned" && evidence.pairs.length > 0 && <div className="input-evidence-plot"><h3>Observed input → outcome</h3><svg viewBox="0 0 760 180" role="img" aria-label={`Association between ${inputUnit} and ${goal.measure!.unit} in matched intervals. Not proof of causation.`}>
        {(() => { const maxX = Math.max(1, ...evidence.pairs.map(p => p.input)), maxY = Math.max(1, ...evidence.pairs.map(p => p.outcome)); return <><text x="40" y="18">{goal.measure!.unit}</text><text x="30" y="39" textAnchor="end">{number(maxY)}</text><text x="30" y="143" textAnchor="end">0</text><line x1="40" x2="720" y1="140" y2="140" className="outcome-grid"/><text x="40" y="158">0</text><text x="690" y="158" textAnchor="middle">{number(maxX)}</text><text x="720" y="170" textAnchor="end">{inputUnit} →</text>{evidence.pairs.map(p => <circle className="outcome-point" key={p.end} cx={40 + 650 * p.input / maxX} cy={140 - 105 * p.outcome / maxY} r="5"><title>{p.start}–{p.end}: {number(p.input)} {inputUnit} → {number(p.outcome)} {goal.measure!.unit}</title></circle>)}</>; })()}
      </svg><p>These intervals can differ in duration and circumstances. Their observed return guides a scenario; it does not isolate the effect of your work.</p></div>}
      {projection?.assumptions.map(note => <p key={note}>{note}</p>)}
      <div className="projection-source-links">{evidence.sourceIds.slice(-6).map(id => <Link key={id} to={recordLink(data, id)!}>Input · {formatDate(data.actions.find(a => a.id === id)!.date)}</Link>)}{model.observations.slice(-3).map(r => <Link key={r.id} to={recordLink(data, r.id)!}>Outcome · {formatDate(r.date)}</Link>)}</div>
    </details>}
    <Link className="text-link" to={`/app/check-in?goal=${goal.id}&prompt=${encodeURIComponent("Let’s review the input I can control, its relationship to this goal, and the projection assumptions.")}`}>Review this model in Check-in ↗</Link>
  </section>;
}
