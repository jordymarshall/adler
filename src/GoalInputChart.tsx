import type { actionSeries } from "../shared/goal-view";
import { formatDate } from "./store";
import { useEffect, useState } from "react";

export function GoalInputChart({ series, compact = false, onSelect }: {
  series: ReturnType<typeof actionSeries>;
  compact?: boolean;
  onSelect?: (actionId: string) => void;
}) {
  const [narrow, setNarrow] = useState(() => matchMedia("(max-width: 650px)").matches);
  useEffect(() => {
    const query = matchMedia("(max-width: 650px)");
    const resize = () => setNarrow(query.matches);
    query.addEventListener("change", resize);
    return () => query.removeEventListener("change", resize);
  }, []);
  const { points, measure } = series;
  const width = compact ? 320 : narrow ? 400 : 800, height = compact ? 115 : 265;
  const left = compact ? 26 : 45, right = width - 16, bottom = height - 30;
  const max = Math.max(1, ...points.flatMap(point => [point.amount ?? 0, point.planned ?? 0]));
  const x = (index: number) => left + index / Math.max(1, points.length - 1) * (right - left);
  const y = (amount: number) => bottom - amount / max * (bottom - 24);
  const segments: number[][] = [];
  let segment: number[] = [];
  for (let index = 0; index < points.length; index++) {
    if (points[index].amount !== null) segment.push(index);
    else if (!points[index].off) { if (segment.length) segments.push(segment); segment = []; }
  }
  if (segment.length) segments.push(segment);
  const planned = points.flatMap((point, index) => point.planned === null ? [] : [index]);
  const path = (indices: number[], value: (index: number) => number) => indices.map((index, i) => `${i ? "L" : "M"}${x(index)},${y(value(index))}`).join(" ");
  return <figure className={`goal-input-chart ${compact ? "compact" : ""}`}>
    <figcaption><strong>{measure.label} <span>({measure.unit})</span></strong>{!compact && <span>{points.some(point => point.amount !== null) ? <>{series.reported.toLocaleString()} reported / {series.planned.toLocaleString()} planned{series.unknown ? ` · ${series.unknown} unknown` : ""}<small>Before today · visible period</small></> : <>No reports yet<small>{points.reduce((sum, point) => sum + (point.planned ?? 0), 0).toLocaleString()} {measure.unit} planned in this period</small></>}</span>}</figcaption>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${measure.label} over time. Solid line: reported ${measure.unit}. Dashed line: planned work. Missing quantities leave gaps.`}>
      {[0, max].map(value => <g key={value}><line x1={left} x2={right} y1={y(value)} y2={y(value)} className="input-grid" /><text x={left - 8} y={y(value) + 4} textAnchor="end">{value.toLocaleString(undefined, { maximumFractionDigits: 1 })}</text></g>)}
      {segments.map((indices, i) => <g key={i}>
        {!compact && indices.length > 1 && indices.every(index => points[index].planned !== null) && <path className="input-gap" d={`${path(indices, index => points[index].planned!)} ${indices.slice().reverse().map(index => `L${x(index)},${y(Math.min(points[index].amount!, points[index].planned!))}`).join(" ")} Z`} />}
        <path className="input-reported" d={path(indices, index => points[index].amount!)} />
      </g>)}
      <path className="input-planned" d={path(planned, index => points[index].planned!)} />
      {points.map((point, index) => <g key={point.date}>
        {point.planned !== null && point.amount === null && <circle className="input-planned-point" cx={x(index)} cy={y(point.planned)} r={compact ? 2 : 3}><title>{formatDate(point.date)}: {point.planned} {measure.unit} planned</title></circle>}
        {point.amount !== null && <circle className="input-point" cx={x(index)} cy={y(point.amount)} r={compact ? 2.5 : 4} onClick={() => point.actions[0] && onSelect?.(point.actions[0].id)}><title>{formatDate(point.date)}: {point.amount} {measure.unit} reported{point.planned !== null ? ` / ${point.planned} planned` : ""}</title></circle>}
        {point.scheduled && !point.future && point.amount === null && <text className="input-unknown" x={x(index)} y={bottom - 4} textAnchor="middle">?</text>}
        {(index === 0 || index === points.length - 1 || (!compact && index % 3 === 0 && index < points.length - 2)) && <text x={x(index)} y={height - 8} textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}>{formatDate(point.date)}</text>}
      </g>)}
    </svg>
    {!compact && <div className="input-legend"><span><i className="reported" />Reported</span><span><i className="planned" />Planned</span><span><i className="gap" />Below plan</span><span>? Not reported</span></div>}
  </figure>;
}
