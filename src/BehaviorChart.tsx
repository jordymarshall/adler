import { useId } from "react";
import { Link } from "react-router-dom";
import { behaviorProgress } from "../shared/behavior-progress";
import { formatDate, type Data } from "./store";
const colors = [
  "#627b46",
  "#528baf",
  "#ba7756",
  "#937aa9",
  "#b79b40",
  "#539487",
];
export function BehaviorChart({ data }: { data: Data }) {
  const id = useId();
  const progress = behaviorProgress(data);
  const x = (i: number) => 42 + (i / 27) * 996;
  const y = (rate: number) => 170 - rate * 1.4;
  const path = (points: { rate: number | null }[]) =>
    points
      .map((p, i) =>
        p.rate === null
          ? ""
          : `${i && points[i - 1].rate !== null ? "L" : "M"}${x(i)},${y(p.rate)}`,
      )
      .join(" ");
  return (
    <section className="behavior-overview" aria-labelledby={id}>
      <div className="behavior-chart-heading">
        <div>
          <span className="section-kicker">FOLLOW-THROUGH · LAST 28 DAYS</span>
          <h2 id={id}>
            Action completion{" "}
            <strong>
              {progress.rate === null ? "—" : `${Math.round(progress.rate)}%`}
            </strong>
          </h2>
        </div>
        <p>
          {progress.reported} reported · {progress.unknown} awaiting a check-in
        </p>
      </div>
      <svg
        viewBox="0 0 1060 208"
        role="img"
        aria-label={`Action completion trend. ${progress.rate === null ? "No reported actions yet." : `${Math.round(progress.rate)} percent average across goals with reports.`} Lines show rolling seven-day completion; gaps have no reports.`}
      >
        {[0, 50, 100].map((rate) => (
          <g key={rate}>
            <line
              x1="42"
              x2="1038"
              y1={y(rate)}
              y2={y(rate)}
              className="chart-grid"
            />
            <text x="30" y={y(rate) + 4} textAnchor="end">
              {rate}%
            </text>
          </g>
        ))}
        {progress.series.map((series, i) => (
          <g key={series.goalId} style={{ color: colors[i % colors.length] }}>
            <path
              d={path(series.points)}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            {series.points
              .filter((p) => p.rate !== null)
              .map((p) => (
                <circle
                  key={p.date}
                  cx={x(progress.dates.indexOf(p.date))}
                  cy={y(p.rate!)}
                  r="2.5"
                  fill="currentColor"
                >
                  <title>
                    {series.title} · {formatDate(p.date)}: {Math.round(p.rate!)}
                    % · {p.reported} reports
                  </title>
                </circle>
              ))}
          </g>
        ))}
        <path
          d={path(progress.average)}
          fill="none"
          stroke="var(--ink)"
          strokeWidth="3"
          strokeDasharray="6 5"
        />
        <text x="42" y="202">
          {formatDate(progress.dates[0])}
        </text>
        <text x="1038" y="202" textAnchor="end">
          Today
        </text>
        {progress.rate === null && (
          <text x="540" y="105" textAnchor="middle">
            Your first check-in starts the trend.
          </text>
        )}
      </svg>
      <div className="behavior-legend">
        <span>
          <i style={{ background: "var(--ink)" }} />
          Average
        </span>
        {progress.series.map((s, i) => (
          <Link key={s.goalId} to={`/app/goals/${s.goalId}`}>
            <i style={{ background: colors[i % colors.length] }} />
            {s.title}
          </Link>
        ))}
      </div>
      <p className="field-hint">
        Completed ÷ reported actions, averaged equally across goals with
        reports. Lines show the last seven days at each date. Partial and missed
        actions count as reported; unanswered check-ins stay unknown.
      </p>
    </section>
  );
}
