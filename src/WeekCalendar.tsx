import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useStore, formatDate, type Action } from "./store";
import {
  addDays,
  dateInZone,
  reviewBlock,
  timeInZone,
} from "../shared/journey";
import type { BusyInterval } from "./program-types";

export function weekOf(date: string) {
  return addDays(date, -((new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7));
}
export function WeekCalendar({
  week,
  onWeek,
  busy,
  checked,
  onChoose,
  onRecord,
  onCalendars,
  working,
}: {
  week: string;
  onWeek: (date: string) => void;
  busy: BusyInterval[];
  checked: boolean;
  onChoose: (date: string) => void;
  onRecord: (action: Action) => void;
  onCalendars: () => void;
  working: boolean;
}) {
  const { data } = useStore();
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = 7 * 48;
  }, [week]);
  const today = dateInZone(data.timeZone);
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  const review = reviewBlock(data, week);
  const entries = [
    ...data.workBlocks.map((block) => ({
      ...block,
      title: block.action,
      kind: "work" as const,
    })),
    ...busy
      .filter(
        (interval) =>
          !data.workBlocks.some(
            (block) =>
              block.provider !== "local" &&
              block.start === interval.start &&
              block.end === interval.end,
          ),
      )
      .map((interval, i) => ({
        ...interval,
        id: `busy-${i}`,
        title: "Busy",
        kind: "busy" as const,
        goalId: "",
      })),
    ...(review
      ? [
          {
            id: "weekly-review",
            title: "Review & plan your week",
            kind: "review" as const,
            goalId: "",
            ...review,
          },
        ]
      : []),
  ];
  function dayEntries(date: string) {
    return entries
      .filter(
        (entry) =>
          dateInZone(data.timeZone, new Date(entry.start)) <= date &&
          dateInZone(data.timeZone, new Date(Date.parse(entry.end) - 1)) >=
            date,
      )
      .sort((a, b) => a.start.localeCompare(b.start));
  }
  function content(entry: (typeof entries)[number]) {
    const action = data.actions.find((a) => a.id === entry.id);
    const time = `${timeInZone(data.timeZone, new Date(entry.start))}–${timeInZone(data.timeZone, new Date(entry.end))}`;
    const body = (
      <>
        <b>{entry.title}</b>
        <span>{time}</span>
        {entry.kind === "work" && (
          <small>
            {data.goals.find((g) => g.id === entry.goalId)?.title} ·{" "}
            {action?.outcome ?? "Scheduled"} ·{" "}
            {entry.provider === "local"
              ? "Adler only"
              : entry.provider === "google"
                ? "Google Calendar"
                : "iCloud Calendar"}
          </small>
        )}
      </>
    );
    if (entry.kind === "busy") return <div>{body}</div>;
    if (entry.kind === "review")
      return <Link to="/app/reviews/current">{body}</Link>;
    if (action && Date.parse(entry.end) <= Date.now())
      return (
        <button onClick={() => onRecord(action)}>
          {body}
          <small>Record what happened</small>
        </button>
      );
    return (
      <Link
        to={`/app/goals/${entry.goalId}?action=${encodeURIComponent(entry.id)}`}
      >
        {body}
      </Link>
    );
  }
  return (
    <section className="panel week-calendar" aria-label="Your week">
      <div className="week-toolbar">
        <div>
          <span className="section-kicker">YOUR COMMITMENTS, TOGETHER</span>
          <h2>
            {formatDate(week)} –{" "}
            {formatDate(addDays(week, 6), {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </h2>
          <p className="field-hint">
            {data.timeZone} · Review reserves 15 minutes in Adler; edit its time
            from the review.
          </p>
        </div>
        <div className="button-row">
          <button
            className="icon-button"
            aria-label="Previous week"
            disabled={working}
            onClick={() => onWeek(addDays(week, -7))}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            className="button secondary small-button"
            disabled={working}
            onClick={() => onWeek(weekOf(today))}
          >
            This week
          </button>
          <button
            className="icon-button"
            aria-label="Next week"
            disabled={working}
            onClick={() => onWeek(addDays(week, 7))}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div className="calendar-legend">
        <span>
          <i className="legend-work" /> Goal work
        </span>
        <span>
          <i className="legend-busy" /> External busy time
        </span>
        <span>
          <i className="legend-review" /> Weekly review
        </span>
      </div>
      <p className="field-hint">
        {checked
          ? "External busy periods were checked for this week."
          : "External availability has not been checked for this week. Empty space may contain other commitments."}{" "}
        <button className="text-link" disabled={working} onClick={onCalendars}>
          Choose calendars & check availability ↓
        </button>
      </p>
      <div className="week-desktop">
        <div className="week-day-headings">
          <span />
          {days.map((day) => (
            <div key={day} className={day === today ? "is-today" : ""}>
              <b>{formatDate(day, { weekday: "short" })}</b>
              <span>{formatDate(day, { day: "numeric" })}</span>
              <button
                className="icon-button"
                aria-label={`Schedule on ${day}`}
                disabled={working || day < today}
                onClick={() => onChoose(day)}
              >
                <Plus size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="week-scroll" ref={scroll}>
          <div className="week-grid">
            <div className="week-hour-labels">
              {Array.from({ length: 24 }, (_, hour) => (
                <span key={hour}>{String(hour).padStart(2, "0")}:00</span>
              ))}
            </div>
            {days.map((day) => {
              const events = dayEntries(day);
              const ends: number[] = [];
              const arranged = events.map((entry) => {
                const from =
                  dateInZone(data.timeZone, new Date(entry.start)) < day
                    ? "00:00"
                    : timeInZone(data.timeZone, new Date(entry.start));
                const to =
                  dateInZone(data.timeZone, new Date(entry.end)) > day
                    ? "24:00"
                    : timeInZone(data.timeZone, new Date(entry.end));
                const minutes = (time: string) =>
                  Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
                const start = minutes(from),
                  end = Math.max(start + 15, minutes(to));
                let lane = ends.findIndex((lastEnd) => lastEnd <= start);
                if (lane === -1) lane = ends.length;
                ends[lane] = end;
                return { entry, start, end, lane };
              });
              return (
                <div
                  className={`week-day ${day === today ? "is-today" : ""}`}
                  key={day}
                >
                  {arranged.map(({ entry, start, end, lane }) => (
                    <div
                      className={`calendar-entry entry-${entry.kind}`}
                      key={entry.id}
                      style={{
                        top: start * 0.8,
                        minHeight: 24,
                        height: Math.max(24, (end - start) * 0.8),
                        left: `${(lane / ends.length) * 100}%`,
                        width: `${100 / ends.length}%`,
                      }}
                      title={`${entry.title} · ${timeInZone(data.timeZone, new Date(entry.start))}`}
                    >
                      {content(entry)}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="week-agenda">
        {days.map((day) => (
          <section key={day}>
            <div className="list-heading">
              <h3>
                {formatDate(day, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </h3>
              <button
                className="icon-button"
                aria-label={`Choose time on ${day}`}
                disabled={working || day < today}
                onClick={() => onChoose(day)}
              >
                <Plus size={16} />
              </button>
            </div>
            {dayEntries(day).length ? (
              dayEntries(day).map((entry) => (
                <div
                  className={`agenda-entry entry-${entry.kind}`}
                  key={entry.id}
                >
                  {content(entry)}
                </div>
              ))
            ) : (
              <p className="field-hint">
                No Adler work planned.
                {!checked && " External availability unknown."}
              </p>
            )}
          </section>
        ))}
      </div>
    </section>
  );
}
