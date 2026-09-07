import "./execution.css";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate, type Data, type Goal } from "./store";
import { dateInZone } from "../shared/journey";
import { actionStep } from "../shared/adaptive-plan";
import { completionProjection } from "../shared/completion-projection";
import {
  executionLabels,
  executionStatus,
  goalExecution,
  weekStart,
} from "../shared/goal-execution";

export function CycleTimeline({
  data,
  goal,
  today = dateInZone(data.timeZone),
}: {
  data: Data;
  goal: Goal;
  today?: string;
}) {
  const execution = goalExecution(data, goal, today);
  const span = Math.max(
    86400000,
    Date.parse(execution.end) - Date.parse(execution.start),
  );
  const x = (date: string) =>
    2 + (96 * (Date.parse(date) - Date.parse(execution.start))) / span;
  const date = (value: string) =>
    formatDate(value, { month: "short", day: "numeric", year: "numeric" });
  return (
    <section className="execution-horizon" aria-label="Cycles and milestones">
      <div className="list-heading">
        <h2>Cycles & milestones</h2>
        <span className="small-text muted">Agreed dates</span>
      </div>
      <div className="execution-axis">
        <span>{date(execution.start)}</span>
        <span>{date(execution.end)}</span>
      </div>
      <div className="execution-date-grid">
        <div className="execution-today" style={{ left: `${x(today)}%` }}>
          <span>Today</span>
        </div>
        {execution.cycles.map((c) => (
          <div className="execution-cycle" key={c.start}>
            <div
              className={`execution-cycle-span ${c.current ? "current" : ""}`}
              style={{
                left: `${x(c.start)}%`,
                width: `${Math.max(0.7, x(c.end) - x(c.start))}%`,
              }}
            />
            <p>
              <b>{c.label}</b>{" "}
              <span>
                {date(c.start)}–{date(c.end)} ·{" "}
                {c.current
                  ? goal.status !== "Active"
                    ? goal.status === "Draft"
                      ? "Ready to start"
                      : goal.status
                    : today > c.end
                      ? "Ready for review"
                      : today < c.start
                        ? "Next cycle"
                        : "Current cycle"
                  : "Earlier cycle"}
              </span>
            </p>
          </div>
        ))}
        {execution.markers
          .filter((m) => m.date)
          .map((m) => (
            <div className="execution-marker" key={m.id}>
              <span
                className={`execution-diamond ${m.done ? "verified" : ""}`}
                style={{ left: `${x(m.date!)}%` }}
              />
              <details>
                <summary>
                  {m.label}{" "}
                  <span>
                    {date(m.date!)} · {m.done ? "Verified" : m.kind}
                  </span>
                </summary>
                <p>{m.detail}</p>
              </details>
            </div>
          ))}
        {goal.targetDate && (
          <div className="execution-marker execution-target">
            <span
              className="execution-diamond"
              style={{ left: `${x(goal.targetDate)}%` }}
            />
            <p>
              <b>Goal target</b>{" "}
              <span>
                {date(goal.targetDate)} ·{" "}
                {goal.deadline === "firm" ? "Firm deadline" : "Flexible"}
              </span>
            </p>
          </div>
        )}
      </div>
      {execution.markers
        .filter((m) => !m.date)
        .map((m) => (
          <details className="execution-undated" key={m.id}>
            <summary>
              {m.label}{" "}
              <span>
                {m.done ? "Verified · no date set" : "Milestone · no date set"}
              </span>
            </summary>
            <p>{m.detail}</p>
          </details>
        ))}
      <p className="small-text muted">
        {execution.current
          ? `Work is committed through ${date(execution.current.end)}. Review what happened before defining the next cycle.`
          : "Define the first cycle in Check-in. Existing actions and milestone dates stay visible."}
      </p>
    </section>
  );
}

export function WeeklyActions({
  data,
  goal,
  today = dateInZone(data.timeZone),
  compact = false,
}: {
  data: Data;
  goal: Goal;
  today?: string;
  compact?: boolean;
}) {
  const execution = goalExecution(data, goal, today);
  const defaultWeek = weekStart(
    execution.current && today < execution.current.start
      ? execution.current.start
      : today,
  );
  const [chosen, setChosen] = useState(defaultWeek);
  const [page, setPage] = useState<string | null>(null);
  const selected =
    execution.weeks.find((w) => w.start === chosen) ?? execution.weeks.at(-1)!;
  const activeIndex = execution.weeks.findIndex(
    (w) => w.start === (page ?? selected.start),
  );
  const first = Math.max(
    0,
    Math.min(activeIndex - 3, execution.weeks.length - 8),
  );
  const weeks = execution.weeks.slice(first, first + 8);
  const projection = completionProjection(data, goal, today);
  const projectionVisible = projection && weeks.some(week => projection.weeks.includes(week.start));
  const x = (index: number) => 36 + (index / Math.max(1, weeks.length - 1)) * 624;
  const y = (completion: number) => 156 - completion * 1.32;
  const trend = weeks.map((week, index) => week.completion === null ? "" :
    `${index && weeks[index - 1].completion !== null ? "L" : "M"}${x(index)},${y(week.completion)}`,
  ).join(" ");
  return (
    <section
      className={`weekly-actions ${compact ? "compact" : ""}`}
      aria-label={`Weekly actions for ${goal.title}`}
    >
      <div className="list-heading">
        <h2>{compact ? "Weekly actions" : "Your actions, week by week"}</h2>
        <div className="execution-pagination">
          <button
            aria-label="Earlier weeks"
            disabled={!first}
            onClick={() =>
              setPage(execution.weeks[Math.max(0, first - 5)].start)
            }
          >
            <ChevronLeft size={16} />
          </button>
          <button
            aria-label="Later weeks"
            disabled={first + 8 >= execution.weeks.length}
            onClick={() =>
              setPage(
                execution.weeks[
                  Math.min(execution.weeks.length - 1, first + 11)
                ].start,
              )
            }
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="execution-trend">
        <span className="execution-metric">Action completion (%)</span>
        <svg viewBox="0 0 684 180" role="img" aria-label={`Weekly action completion for ${goal.title}. Y-axis: completed actions divided by reported actions, from 0 to 100 percent. X-axis: week starting ${formatDate(weeks[0].start)} to ${formatDate(weeks.at(-1)!.start)}. Weeks without reports are gaps.${projectionVisible ? ` Dashed lines project ${Math.round(projection.estimate)}% if the current pattern continues. Shading and error bars show approximate 95% uncertainty in that rate, ${Math.round(projection.lower)} to ${Math.round(projection.upper)}%.` : ""}`}>
          {[0, 50, 100].map(value => <g key={value}>
            <line x1="36" x2="660" y1={y(value)} y2={y(value)} className="execution-trend-grid" />
            <text x="27" y={y(value) + 4} textAnchor="end">{value}</text>
          </g>)}
          {projection && weeks.map((week, index) => projection.weeks.includes(week.start) && <g key={`projection-${week.start}`} className="execution-projection">
            <title>{formatDate(week.start)}: projected rate {Math.round(projection.estimate)}% · approximate 95% rate interval {Math.round(projection.lower)}–{Math.round(projection.upper)}%</title>
            <rect className="execution-projection-band" x={Math.max(36, x(index - 0.5))} y={y(projection.upper)} width={Math.min(660, x(index + 0.5)) - Math.max(36, x(index - 0.5))} height={y(projection.lower) - y(projection.upper)} />
            {index > 0 && weeks[index - 1].completion !== null && <path className="execution-projection-line" d={`M${x(index - 1)},${y(weeks[index - 1].completion!)} L${x(index - 0.5)},${y(projection.estimate)}`} />}
            <path className="execution-projection-line" d={`M${Math.max(36, x(index - 0.5))},${y(projection.estimate)} H${Math.min(660, x(index + 0.5))}`} />
            <path className="execution-projection-error" d={`M${x(index)},${y(projection.upper)} V${y(projection.lower)} M${x(index) - 5},${y(projection.upper)} h10 M${x(index) - 5},${y(projection.lower)} h10`} />
          </g>)}
          <path d={trend} className="execution-trend-line" />
          {weeks.map((week, index) => week.completion !== null && <circle key={week.start} cx={x(index)} cy={y(week.completion)} r={week.start === selected.start ? 5 : 3.5} className={`execution-trend-point ${week.start === selected.start ? "selected" : ""}`}>
            <title>{formatDate(week.start)}: {week.completion}% · {week.done} of {week.reported} reported actions completed</title>
          </circle>)}
          {!projectionVisible && weeks.every(week => week.completion === null) && <text x="348" y="92" textAnchor="middle">{execution.weeks.some(week => week.completion !== null) ? "No reports in these weeks." : "Your first check-in starts the line."}</text>}
        </svg>
        <div className="execution-weeks" role="group" aria-label="Weekly action commitments">
          {weeks.map((week, index) => <button key={week.start} style={{ left: `${100 * index / Math.max(1, weeks.length - 1)}%` }} className={`execution-week ${week.start === selected.start ? "selected" : ""}`} aria-pressed={week.start === selected.start} aria-label={`Week of ${formatDate(week.start)}: ${week.completion === null ? "No reports" : `${week.completion}% completion`}, ${week.planned} planned, ${week.done} done, ${week.partial} partly, ${week.missed} didn’t happen, ${week.unknown} awaiting check-in, ${week.upcoming} upcoming`} onClick={() => setChosen(week.start)}>
            {formatDate(week.start, { month: "short", day: "numeric" })}
          </button>)}
        </div>
        <span className="execution-time-label">Week starting</span>
      </div>
      {projectionVisible && <div className="execution-chart-legend" aria-label="Chart legend">
        <span><i className="legend-actual" />Reported</span>
        <span><i className="legend-projected" />Projected rate</span>
        <span><i className="legend-uncertainty" />Rate uncertainty</span>
      </div>}
      <p className="execution-chart-note">
        Completed ÷ reported actions. Weeks without check-ins stay unknown.
      </p>
      {projection ? <details className="execution-projection-note">
        <summary>{Math.round(projection.estimate)}% projected · {Math.round(projection.lower)}–{Math.round(projection.upper)}% rate uncertainty</summary>
        <p>If your current pattern continues. Based on {projection.reported} of {projection.due} due actions reported in the last 28 days on this plan. Partly completed actions count as reported, but not completed.</p>
        <p>The shading and error bars show an approximate 95% Wilson interval for the completion rate, assuming comparable, independent actions. Individual weeks can fall outside it; missing check-ins and changes in your circumstances add uncertainty it cannot measure. It does not predict the goal’s outcome.</p>
        <p>Updates with your check-ins and resets when your plan changes. Shown only for upcoming planned weeks in this cycle, up to four weeks ahead.</p>
      </details> : !compact && <p className="execution-chart-note">Projection needs 5 reports across 2 weeks on this plan and actions planned for an upcoming week.</p>}
      <p className="execution-week-summary">
        <b>
          {selected.done} / {selected.planned} actions done
        </b>{" "}
        · Week of {formatDate(selected.start)}
        {selected.partial ? ` · ${selected.partial} partly` : ""}
        {selected.missed ? ` · ${selected.missed} didn’t happen` : ""}
        {selected.unknown ? ` · ${selected.unknown} awaiting check-in` : ""}
        {selected.upcoming ? ` · ${selected.upcoming} upcoming` : ""}
      </p>
      {!compact && (
        <>
          <div className="execution-action-list">
            {selected.actions.map((action) => {
              const step = actionStep(data, action);
              const duration =
                step?.durationMinutes ??
                goal.plans.find((p) => p.version === action.planVersion)
                  ?.durationMinutes;
              return (
                <details className="execution-action" key={action.id}>
                  <summary>
                    <time dateTime={action.date}>
                      {formatDate(action.date, {
                        weekday: "short",
                        day: "numeric",
                      })}
                    </time>
                    <b>{action.title}</b>
                    <span
                      className={`execution-outcome ${executionStatus(action, today)}`}
                    >
                      {executionLabels[executionStatus(action, today)]}
                    </span>
                  </summary>
                  <div>
                    <p>
                      {duration ? `${duration} minutes · ` : ""}
                      {step?.cue ?? action.timing}
                    </p>
                    <p>Finished when: {action.criterion}</p>
                    {step?.fallback && <p>Smaller option: {step.fallback}</p>}
                    {action.amount !== undefined && step?.measure && (
                      <p>
                        {action.amount} {step.measure.unit} recorded
                      </p>
                    )}
                    {action.actualMinutes !== undefined && (
                      <p>{action.actualMinutes} minutes reported</p>
                    )}
                    {action.note && <p>You reported: {action.note}</p>}
                    <Link
                      className="text-link"
                      to={`/app/check-in?goal=${goal.id}&prompt=${encodeURIComponent(`Let’s check in on “${action.title}” from ${action.date}.`)}`}
                    >
                      Discuss in Check-in
                    </Link>
                  </div>
                </details>
              );
            })}
          </div>
          {!selected.planned && (
            <p className="small-text muted">
              No actions committed for {formatDate(selected.start)}–
              {formatDate(selected.end)}. Define the next useful work in
              Check-in.
            </p>
          )}
          {!!execution.unscheduled.length && (
            <details className="quiet-disclosure">
              <summary>
                {execution.unscheduled.length} actions without a date
              </summary>
              {execution.unscheduled.map((a) => (
                <p key={a.id}>
                  {a.title} · {a.outcome ?? "Unscheduled"}
                </p>
              ))}
            </details>
          )}
        </>
      )}
    </section>
  );
}
