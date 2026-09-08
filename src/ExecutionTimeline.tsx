import "./execution.css";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate, type Data, type Goal } from "./store";
import { dateInZone } from "../shared/journey";
import { actionStep } from "../shared/adaptive-plan";
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
  if (!execution.cycles.length) {
    const first = execution.actions.find(action => !action.outcome) ?? execution.actions.at(-1);
    return <section className="execution-horizon" aria-label="Cycles and milestones">
      <div className="list-heading"><h2>Starting timeline</h2><span className="small-text muted">Dates stay flexible</span></div>
      <ol className="starting-timeline">
        <li><time>{formatDate(goal.startDate ?? goal.plans[0].date)}</time><div><strong>Starting point</strong><p>{goal.results[0] ? `${goal.results[0].value} ${goal.measure?.unit ?? goal.unit}` : "First outcome report still needed"}</p></div></li>
        {first && <li><time>{first.date ? formatDate(first.date) : "First action"}</time><div><strong>{first.title}</strong><p>{first.criterion}</p></div></li>}
        <li><time>Then review</time><div><strong>What helped or got in the way?</strong><p>Use your first report to choose what comes next.</p></div></li>
        {goal.milestones.map(milestone => <li key={milestone.id}><time>{milestone.dueDate ? formatDate(milestone.dueDate) : "Milestone"}</time><div><strong>{milestone.title}</strong><p>{milestone.criterion} · {milestone.done ? "Verified" : "Not yet verified"}</p></div></li>)}
        {goal.targetDate && <li><time>{formatDate(goal.targetDate)}</time><div><strong>Goal target</strong><p>{goal.deadline === "firm" ? "Firm deadline" : "Flexible target"}</p></div></li>}
      </ol>
      <p className="small-text muted">This is the sequence for your saved starting plan. Adler can propose dates and a suitable review period in Check-in.</p>
    </section>;
  }
  return (
    <section className="execution-horizon" aria-label="Cycles and milestones">
      <div className="list-heading">
        <h2>Cycles & milestones</h2>
        <span className="small-text muted">{goal.status === "Draft" ? "Proposed dates" : "Saved dates"}</span>
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
                {goal.plans.at(-1)?.adaptive?.steps.filter(step => step.milestoneId === m.id).map(step => <p key={step.id}>Contributing action: {step.title}</p>)}
                {m.kind === "Review" && <Link className="text-link" to={`/app/check-in?${new URLSearchParams({ goal: goal.id, prompt: `Let’s review this plan. The question was: ${m.detail} Here is what happened: ` })}`}>Review in Check-in ↗</Link>}
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
          : "Your saved actions and milestone dates remain visible."}
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
        <svg viewBox="0 0 684 180" role="img" aria-label={`Weekly action completion for ${goal.title}. Y-axis: completed actions divided by reported actions, from 0 to 100 percent. X-axis: week starting ${formatDate(weeks[0].start)} to ${formatDate(weeks.at(-1)!.start)}. Weeks without reports are gaps.`}>
          {[0, 50, 100].map(value => <g key={value}>
            <line x1="36" x2="660" y1={y(value)} y2={y(value)} className="execution-trend-grid" />
            <text x="27" y={y(value) + 4} textAnchor="end">{value}</text>
          </g>)}
          <path d={trend} className="execution-trend-line" />
          {weeks.map((week, index) => week.completion !== null && <circle key={week.start} cx={x(index)} cy={y(week.completion)} r={week.start === selected.start ? 5 : 3.5} className={`execution-trend-point ${week.start === selected.start ? "selected" : ""}`}>
            <title>{formatDate(week.start)}: {week.completion}% · {week.done} of {week.reported} reported actions completed</title>
          </circle>)}
          {weeks.every(week => week.completion === null) && <text x="348" y="92" textAnchor="middle">{execution.weeks.some(week => week.completion !== null) ? "No reports in these weeks." : "Your first check-in starts the line."}</text>}
        </svg>
        <div className="execution-weeks" role="group" aria-label="Weekly action commitments">
          {weeks.map((week, index) => <button key={week.start} style={{ left: `${100 * index / Math.max(1, weeks.length - 1)}%` }} className={`execution-week ${week.start === selected.start ? "selected" : ""}`} aria-pressed={week.start === selected.start} aria-label={`Week of ${formatDate(week.start)}: ${week.completion === null ? "No reports" : `${week.completion}% completion`}, ${week.planned} planned, ${week.done} done, ${week.partial} partly, ${week.missed} didn’t happen, ${week.unknown} awaiting check-in, ${week.upcoming} upcoming`} onClick={() => setChosen(week.start)}>
            {formatDate(week.start, { month: "short", day: "numeric" })}
          </button>)}
        </div>
        <span className="execution-time-label">Week starting</span>
      </div>
      <p className="execution-chart-note">
        Completed ÷ reported actions. Weeks without check-ins stay unknown.
      </p>
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
