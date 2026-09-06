import { useId } from "react";
import type { Goal } from "./store";
import { formatDate, localDate } from "./store";
import { progressStatus } from "./progress";

export function ProgressChart({
  goal,
  today = localDate(),
  compact = false,
}: {
  goal: Goal;
  today?: string;
  compact?: boolean;
}) {
  const id = useId();
  const planned = [...(goal.checkpoints ?? [])].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const actual = [...goal.results].sort((a, b) => a.date.localeCompare(b.date));
  const status = progressStatus(goal, today);
  const dates = [...planned, ...actual]
    .map((p) => p.date)
    .concat(today)
    .sort();
  const start = Date.parse(dates[0]);
  const end = Math.max(Date.parse(dates.at(-1)!), start + 86400000);
  const max = Math.max(
    goal.target ?? 1,
    ...planned.map((p) => p.value),
    ...actual.map((p) => p.value),
    1,
  );
  const x = (date: string) =>
    40 + ((Date.parse(date) - start) / (end - start)) * 480;
  const y = (value: number) => 170 - (value / max) * 140;
  const path = planned
    .map((p, i) => `${i ? `H${x(p.date)} V` : `M${x(p.date)},`}${y(p.value)}`)
    .join(" ");
  return (
    <div className={`progress-viz ${compact ? "compact" : ""}`}>
      <div className="viz-heading">
        <div>
          <span className="section-kicker">RESULTS OVER TIME</span>
          <h3>{goal.unit ?? "Verified milestones"}</h3>
        </div>
        <span className={`pace-badge ${status.tone}`}>{status.label}</span>
      </div>
      <div className="viz-numbers">
        <strong>
          {status.actual ?? "—"} <small>recorded</small>
        </strong>
        <span>/</span>
        <strong>
          {status.planned ?? "—"} <small>planned by now</small>
        </strong>
        <span className="viz-target">
          Target: {goal.target ?? max}
          {goal.targetDate ? ` by ${formatDate(goal.targetDate)}` : ""}
        </span>
      </div>
      <svg viewBox="0 0 560 212" role="img" aria-labelledby={id}>
        <title id={id}>
          {status.detail} Solid points show recorded results; the dashed step
          line shows your dated plan.
        </title>
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line
              x1="40"
              x2="520"
              y1={y(max * t)}
              y2={y(max * t)}
              className="chart-grid"
            />
            <text x="27" y={y(max * t) + 4} textAnchor="end">
              {Number((max * t).toFixed(1))}
            </text>
          </g>
        ))}
        <line
          x1={x(today)}
          x2={x(today)}
          y1="20"
          y2="176"
          className="chart-today"
        />
        {planned.length > 0 && <path d={path} className="chart-plan" />}
        {actual.length > 1 && (
          <polyline
            points={actual.map((p) => `${x(p.date)},${y(p.value)}`).join(" ")}
            className="chart-actual"
          />
        )}
        {actual.map((p) => (
          <circle
            key={p.id}
            cx={x(p.date)}
            cy={y(p.value)}
            r="5"
            className="chart-dot"
          >
            <title>
              {formatDate(p.date)}: {p.value} — {p.source}
            </title>
          </circle>
        ))}
        <text x="40" y="202">
          {formatDate(dates[0])}
        </text>
        <text x="520" y="202" textAnchor="end">
          {formatDate(dates.at(-1)!)}
        </text>
        <text x={x(today)} y="12" textAnchor="middle">
          Today
        </text>
      </svg>
      <div className="chart-legend">
        <span>
          <i /> Recorded result
        </span>
        <span>
          <i /> Dated plan
        </span>
      </div>
      <p className="chart-explanation">{status.detail}</p>
      {!compact && (
        <details className="chart-data">
          <summary>View checkpoints and evidence</summary>
          <p className="field-hint">
            Steps reflect your agreed dates. Lines between results connect
            observations; they do not estimate unrecorded progress. Results
            older than 7 days need an update.
          </p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Value</th>
                <th>Record</th>
              </tr>
            </thead>
            <tbody>
              {[
                ...planned.map((p) => ({
                  ...p,
                  type: "Planned",
                  source: p.label,
                })),
                ...actual.map((p) => ({ ...p, type: "Recorded" })),
              ]
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((p) => (
                  <tr key={p.id}>
                    <td>{formatDate(p.date)}</td>
                    <td>{p.type}</td>
                    <td>{p.value}</td>
                    <td>{p.source}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}
