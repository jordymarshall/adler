import { useId, useState } from "react";
import type { Goal } from "./store";
import { formatDate, localDate } from "./store";
import { progressStatus } from "./progress";

export function ProgressChart({
  goal,
  today = localDate(),
  compact = false,
  graphOnly = false,
  proposedCheckpoints = [],
}: {
  goal: Goal;
  today?: string;
  compact?: boolean;
  graphOnly?: boolean;
  proposedCheckpoints?: { date: string; value: number }[];
}) {
  const id = useId();
  const Heading = compact ? "h3" : "h2";
  const [hover, setHover] = useState<number | null>(null);
  const planned = [...(goal.checkpoints ?? [])].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const actual = goal.results
    .filter((r) => r.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const status = progressStatus(goal, today);
  const proposed = [...proposedCheckpoints].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const dates = [...planned, ...actual, ...proposed]
    .map((p) => p.date)
    .concat(today)
    .sort();
  const points = [...new Set(dates)].sort();
  const selected =
    hover === null ? null : points[Math.min(hover, points.length - 1)];
  const selectedActual = selected
    ? actual.filter((p) => p.date <= selected).at(-1)
    : undefined;
  const selectedPlan = selected
    ? planned.filter((p) => p.date <= selected).at(-1)
    : undefined;
  const start = Date.parse(dates[0]);
  const end = Math.max(Date.parse(dates.at(-1)!), start + 86400000);
  const max = Math.max(
    goal.target ?? 1,
    ...planned.map((p) => p.value),
    ...actual.map((p) => p.value),
    ...proposed.map((p) => p.value),
    1,
  );
  const x = (date: string) =>
    40 + ((Date.parse(date) - start) / (end - start)) * 480;
  const y = (value: number) => 170 - (value / max) * 140;
  const recordedNow = actual.filter((p) => p.date <= today).at(-1);
  const plannedNow = planned.filter((p) => p.date <= today).at(-1);
  const ticks =
    Number.isInteger(max) && max <= 5
      ? Array.from({ length: max + 1 }, (_, i) => i)
      : [0, max / 2, max];
  const path = planned
    .map((p, i) => `${i ? `H${x(p.date)} V` : `M${x(p.date)},`}${y(p.value)}`)
    .join(" ");
  return (
    <div
      className={`progress-viz ${compact ? "compact" : ""} ${graphOnly ? "graph-only" : ""}`}
    >
      {!graphOnly && (
        <>
          <div className="viz-heading">
            <div>
              <span className="section-kicker">HOW WE MEASURE PROGRESS</span>
              <Heading>
                {goal.measure?.label ?? goal.unit ?? "Verified milestones"}
              </Heading>
            </div>
            <span className={`pace-badge ${status.tone}`}>{status.label}</span>
          </div>
          <div className="viz-numbers">
            <strong>
              {status.actual ?? "—"}{" "}
              <small>
                {goal.measure?.unit ?? goal.unit ?? "milestones verified"}{" "}
                recorded
              </small>
            </strong>
            <span>/</span>
            <strong>
              {status.planned ?? "—"}{" "}
              <small>
                {goal.measure?.unit ?? ""}{" "}
                {plannedNow
                  ? `due ${formatDate(plannedNow.date)}`
                  : "no checkpoint due"}
              </small>
            </strong>
            <span className="viz-target">
              Target: {goal.target ?? max} {goal.measure?.unit ?? ""}
              {goal.targetDate ? ` by ${formatDate(goal.targetDate)}` : ""}
            </span>
          </div>
        </>
      )}
      <svg
        viewBox="0 0 560 212"
        role="group"
        aria-labelledby={id}
        tabIndex={0}
        aria-describedby={`${id}-help`}
        onPointerMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          const position = ((event.clientX - bounds.left) / bounds.width) * 560;
          setHover(
            points.reduce(
              (best, date, i) =>
                Math.abs(x(date) - position) <
                Math.abs(x(points[best]) - position)
                  ? i
                  : best,
              0,
            ),
          );
        }}
        onFocus={() => setHover(points.indexOf(today))}
        onPointerLeave={() => {
          if (graphOnly) setHover(null);
        }}
        onBlur={() => {
          if (graphOnly) setHover(null);
        }}
        onKeyDown={(event) => {
          if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            setHover((index) =>
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? points.length - 1
                  : Math.max(
                      0,
                      Math.min(
                        points.length - 1,
                        (index ?? 0) + (event.key === "ArrowRight" ? 1 : -1),
                      ),
                    ),
            );
          }
        }}
      >
        <title id={id}>
          {status.detail} Solid points show recorded results; the dashed step
          line shows your dated plan. Future checkpoints are planned outcomes.
        </title>
        <rect
          x={x(today)}
          y="20"
          width={520 - x(today)}
          height="156"
          className="chart-future"
        />
        {ticks.map((value) => (
          <g key={value}>
            <line
              x1="40"
              x2="520"
              y1={y(value)}
              y2={y(value)}
              className="chart-grid"
            />
            <text x="27" y={y(value) + 4} textAnchor="end">
              {Number(value.toFixed(1))}
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
        {planned.map((p) => (
          <circle
            key={p.id}
            cx={x(p.date)}
            cy={y(p.value)}
            r="4"
            className="chart-checkpoint"
          >
            <title>
              {p.value} {goal.measure?.unit ?? goal.unit} due{" "}
              {formatDate(p.date)} · {p.label}
            </title>
          </circle>
        ))}
        {proposed.length > 0 && (
          <path
            className="chart-proposed"
            d={proposed
              .map(
                (p, i) =>
                  `${i ? `H${x(p.date)} V` : `M${x(p.date)},`}${y(p.value)}`,
              )
              .join(" ")}
          />
        )}
        <g data-testid="recorded-line">
          {actual.length > 0 && (
            <path
              className="chart-actual"
              pathLength="1"
              d={
                actual
                  .map(
                    (p, i) =>
                      `${i ? "H" + x(p.date) + " V" : "M" + x(p.date) + ","}${y(p.value)}`,
                  )
                  .join(" ") +
                ` H${x(actual.at(-1)!.date > today ? actual.at(-1)!.date : today)}`
              }
            />
          )}
          {selected && (
            <line
              x1={x(selected)}
              x2={x(selected)}
              y1="20"
              y2="176"
              className="chart-cursor"
            />
          )}
          {actual
            .filter((p, i) => i === 0 || p.value !== actual[i - 1].value)
            .map((p) => (
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
        </g>
        {recordedNow && (
          <text
            className="chart-recorded-label"
            x={Math.min(x(today) + 9, 512)}
            y={y(recordedNow.value) + 17}
            textAnchor={x(today) > 430 ? "end" : "start"}
          >
            Recorded: {recordedNow.value} {goal.measure?.unit ?? ""}
          </text>
        )}
        {plannedNow && (
          <text
            className="chart-planned-label"
            x={Math.min(x(today) + 9, 512)}
            y={y(plannedNow.value) - 9}
            textAnchor={x(today) > 430 ? "end" : "start"}
          >
            Due {formatDate(plannedNow.date)}: {plannedNow.value}{" "}
            {goal.measure?.unit ?? ""}
          </text>
        )}
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
      <span className="chart-screen-reader" id={`${id}-help`}>
        Use arrow keys to inspect each recorded date and checkpoint.
      </span>
      {(!graphOnly || selected) && (
        <div className="chart-tooltip" aria-live="polite">
          {selected ? (
            <>
              <b>{formatDate(selected)}</b>
              <span>
                Last recorded:{" "}
                {selectedActual
                  ? `${selectedActual.value} ${goal.measure?.unit ?? goal.unit ?? ""}`
                  : "No result yet"}{" "}
                ·{" "}
                {selectedPlan
                  ? `${selectedPlan.value} ${goal.measure?.unit ?? ""} due ${formatDate(selectedPlan.date)}`
                  : "No checkpoint due"}
                {proposed.length > 0 &&
                  selected >= today &&
                  ` · Proposed: ${proposed.filter((p) => p.date <= selected).at(-1)?.value ?? "—"}`}
              </span>
              <small>
                {selectedActual
                  ? `${selectedActual.source} · recorded ${formatDate(selectedActual.date)}`
                  : "Add a result to begin your recorded line."}
              </small>
            </>
          ) : (
            <span>
              Hover, tap, or use the arrow keys to inspect dates and results.
            </span>
          )}
        </div>
      )}
      {!compact && !graphOnly && (
        <p className="chart-date-explanation">
          Each hollow point is a result due on that date. The dashed line holds
          that target until the next checkpoint.
        </p>
      )}
      <div className="chart-legend">
        <span>
          <i /> Recorded result
        </span>
        <span>
          <i /> Dated plan
        </span>
        {proposed.length > 0 && (
          <span className="chart-proposed-key">
            <i /> Proposed plan
          </span>
        )}
      </div>
      {proposed.length > 0 && (
        <p className="chart-scenario-note">
          Proposed finish: {formatDate(proposed.at(-1)!.date)} · Future line
          shows the proposed checkpoints.
        </p>
      )}
      {!compact && !graphOnly && (
        <p className="chart-explanation">{status.detail}</p>
      )}
      {!compact && !graphOnly && (
        <details className="chart-data">
          <summary>View checkpoints and evidence</summary>
          <p className="field-hint">
            Steps reflect your agreed dates. The solid step line holds the last
            recorded value until the next update; it does not estimate
            unrecorded progress.
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
