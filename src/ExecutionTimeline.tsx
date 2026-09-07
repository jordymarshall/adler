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
  type ExecutionStatus,
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
  const max = Math.max(1, ...weeks.map((w) => w.planned));
  const statuses = Object.keys(executionLabels) as ExecutionStatus[];
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
      <div
        className="execution-weeks"
        role="group"
        aria-label="Weekly action commitments"
      >
        {weeks.map((w) => (
          <button
            key={w.start}
            className={`execution-week ${w.start === selected.start ? "selected" : ""}`}
            aria-pressed={w.start === selected.start}
            aria-label={`Week of ${formatDate(w.start)}: ${w.planned} planned, ${w.done} done, ${w.partial} partly, ${w.missed} didn’t happen, ${w.unknown} awaiting check-in, ${w.upcoming} upcoming`}
            onClick={() => setChosen(w.start)}
          >
            <span className="execution-total">{w.planned || "—"}</span>
            <span className="execution-bar-area">
              <span
                className="execution-bar"
                style={{ height: `${(100 * w.planned) / max}%` }}
              >
                {statuses.map(
                  (status) =>
                    w[status] > 0 && (
                      <span
                        key={status}
                        className={`execution-segment ${status}`}
                        style={{ flex: w[status] }}
                      />
                    ),
                )}
              </span>
            </span>
            <span>
              {formatDate(w.start, { month: "short", day: "numeric" })}
            </span>
          </button>
        ))}
      </div>
      <p className="execution-chart-note">
        Saved commitments only · — means no actions planned
      </p>
      <div className="execution-legend">
        {statuses.map((status) => (
          <span key={status}>
            <i className={status} />
            {executionLabels[status]}
          </span>
        ))}
      </div>
      <p className="execution-week-summary">
        <b>
          {selected.done} / {selected.planned} actions done
        </b>{" "}
        · Week of {formatDate(selected.start)}
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
