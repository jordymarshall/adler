import { useId, useState } from "react";
import type { Goal } from "./store";
import { formatDate, localDate } from "./store";
import { progressStatus } from "./progress";
import type { Forecast } from "../shared/forecast";

export function ProgressChart({
  goal,
  today = localDate(),
  compact = false,
  graphOnly = false,
  proposedCheckpoints = [],
  forecast,
  alternativeForecast,
}: {
  goal: Goal;
  today?: string;
  compact?: boolean;
  graphOnly?: boolean;
  proposedCheckpoints?: { date: string; value: number }[];
  forecast?: Forecast;
  alternativeForecast?: Forecast;
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
    .concat(today, ...(goal.targetDate ? [goal.targetDate] : []))
    .concat([forecast, alternativeForecast].flatMap(f => f?.rates ? [f.expectedDate, f.earliestDate, f.latestDate ?? f.horizonDate].filter((d): d is string => Boolean(d)) : []))
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
  function projected(f: Forecast, rate: number, date: string) {
    return Math.min(max, (f.current ?? 0) + rate * Math.max(0, (Date.parse(date) - Date.parse(f.anchorDate ?? f.asOf)) / 86400000));
  }
  function forecastPoints(f: Forecast, rate: number) {
    const endDate = [f.horizonDate, dates.at(-1)!].sort()[0];
    const duration = rate > 0 ? Math.max(0, max - (f.current ?? 0)) / rate : Infinity;
    const finish = duration < (Date.parse(endDate) - Date.parse(f.anchorDate ?? f.asOf)) / 86400000
      ? new Date(Date.parse(f.anchorDate ?? f.asOf) + duration * 86400000).toISOString() : endDate;
    return [[x(f.anchorDate ?? f.asOf), y(f.current ?? 0)], [x(finish), y(projected(f, rate, finish))], [x(endDate), y(projected(f, rate, endDate))]];
  }
  const pointPath = (points: number[][]) => points.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  return (
    <div
      className={`progress-viz ${compact ? "compact" : ""} ${graphOnly ? "graph-only" : ""}`}
      onPointerLeave={(event) => {
        if (graphOnly && !event.currentTarget.matches(":focus-within"))
          setHover(null);
      }}
      onBlur={(event) => {
        if (
          graphOnly &&
          !event.currentTarget.contains(event.relatedTarget) &&
          !event.currentTarget.matches(":hover")
        )
          setHover(null);
      }}
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
          {forecast?.rates ? " The blue line and shaded range show conditional scenarios, not a success probability." : ""}
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
              {Number(value.toFixed(1)).toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 1 })}
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
        {forecast?.rates && <g data-testid="forecast-line">
          <path className="chart-forecast-range" d={`${pointPath([...forecastPoints(forecast, forecast.rates.high), ...forecastPoints(forecast, forecast.rates.low).reverse()])} Z`} />
          <path className="chart-forecast" d={pointPath(forecastPoints(forecast, forecast.rates.typical))} />
        </g>}
        {alternativeForecast?.rates && <path className="chart-alternative" d={pointPath(forecastPoints(alternativeForecast, alternativeForecast.rates.typical))} />}
        {forecast && goal.targetDate && <line x1={x(goal.targetDate)} x2={x(goal.targetDate)} y1="20" y2="176" className="chart-deadline"><title>Your target date: {formatDate(goal.targetDate)}</title></line>}
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
                {forecast?.rates && selected >= forecast.asOf && selected <= forecast.horizonDate && ` · Conditional forecast: ${projected(forecast, forecast.rates.typical, selected).toFixed(1)}`}
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
        {forecast?.rates && <span className="chart-forecast-key"><i /> Conditional forecast and pace range</span>}
        {alternativeForecast?.rates && <span className="chart-alternative-key"><i /> Proposed plan scenario</span>}
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
        <ProgressRecords goal={goal} today={today} />
      )}
    </div>
  );
}

export function ProgressRecords({ goal, today = localDate() }: { goal: Goal; today?: string }) {
  const planned = goal.checkpoints ?? [];
  const actual = goal.results.filter(r => r.date <= today);
  return (
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
  );
}
