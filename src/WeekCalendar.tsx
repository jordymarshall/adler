import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useStore, formatDate, type Action } from "./store";
import { addDays, dateInZone, reviewBlock, timeInZone } from "../shared/journey";
import type { BusyInterval } from "./program-types";
import { goalColor } from "./goal-colors";
import { Modal } from "./components";
import "./calendar-view.css";

export function weekOf(date: string) {
  return addDays(date, -((new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7));
}
export function monthRange(month: string) {
  const start = weekOf(`${month.slice(0, 7)}-01`);
  return { start, end: addDays(start, 42) };
}
export function WeekCalendar({ week, onWeek, month, onMonth, view, onView, busy, checked, onChoose, onRecord, onCalendars, working }: {
  week: string; onWeek: (date: string) => void;
  month: string; onMonth: (date: string) => void;
  view: "month" | "week"; onView: (view: "month" | "week") => void;
  busy: BusyInterval[]; checked: boolean; onChoose: (date: string) => void;
  onRecord: (action: Action) => void; onCalendars: () => void; working: boolean;
}) {
  const { data } = useStore();
  const scroll = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => { if (scroll.current) scroll.current.scrollTop = 7 * 72; }, [week, view]);
  const today = dateInZone(data.timeZone);
  const days = Array.from({ length: view === "month" ? 42 : 7 }, (_, i) => addDays(view === "month" ? monthRange(month).start : week, i));
  const reviews = days.filter((_, index) => index % 7 === 0).flatMap(date => {
    const review = reviewBlock(data, date);
    return review ? [{ ...review, id: `review-${date}`, title: "Weekly check-in", kind: "review" as const, goalId: "" }] : [];
  });
  const entries = [
    ...data.workBlocks.map(block => ({ ...block, title: block.action, kind: "work" as const })),
    ...busy.filter(interval => !data.workBlocks.some(block => block.provider !== "local" && block.start === interval.start && block.end === interval.end))
      .map((interval, index) => ({ ...interval, id: `busy-${index}`, title: "Other commitment", kind: "busy" as const, goalId: "" })),
    ...reviews,
  ];
  const active = entries.find(entry => entry.id === selected);
  const activeAction = data.actions.find(action => action.id === selected);
  function dayEntries(date: string) {
    return entries.filter(entry => dateInZone(data.timeZone, new Date(entry.start)) <= date && dateInZone(data.timeZone, new Date(Date.parse(entry.end) - 1)) >= date).sort((a, b) => a.start.localeCompare(b.start));
  }
  function entryStyle(entry: typeof entries[number]): CSSProperties {
    return entry.kind === "work" ? { "--goal-color": goalColor(entry.goalId) } as CSSProperties : {};
  }
  function content(entry: typeof entries[number]) {
    return <button onClick={() => setSelected(entry.id)} aria-label={`${entry.title}, ${timeInZone(data.timeZone, new Date(entry.start))}${entry.kind === "work" ? ", Adler plan" : ""}`}>
      <span className="calendar-entry-time">{timeInZone(data.timeZone, new Date(entry.start))}{entry.kind === "work" && <i>Adler</i>}</span>
      <b>{entry.title}</b>
    </button>;
  }
  function moveMonth(offset: number) {
    const date = new Date(`${month.slice(0, 7)}-15T12:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() + offset);
    onMonth(date.toISOString().slice(0, 10));
  }
  return <section className="panel week-calendar full-calendar" aria-label="Your calendar">
    <div className="week-toolbar"><div><span className="section-kicker">MAKE ROOM FOR WHAT MATTERS</span><h2>{view === "month" ? formatDate(month, { month: "long", year: "numeric" }) : `${formatDate(week)} – ${formatDate(addDays(week, 6), { month: "short", day: "numeric", year: "numeric" })}`}</h2><p className="field-hint">{data.timeZone}</p></div>
      <div className="calendar-controls"><div className="calendar-view-switch" aria-label="Calendar view">{["month", "week"].map(mode => <button key={mode} disabled={working} aria-pressed={view === mode} onClick={() => onView(mode as typeof view)}>{mode === "month" ? "Month" : "Week"}</button>)}</div><div className="button-row">
        <button className="icon-button" aria-label={`Previous ${view}`} disabled={working} onClick={() => view === "month" ? moveMonth(-1) : onWeek(addDays(week, -7))}><ChevronLeft size={18}/></button>
        <button className="button secondary small-button" disabled={working} onClick={() => view === "month" ? onMonth(today) : onWeek(weekOf(today))}>Today</button>
        <button className="icon-button" aria-label={`Next ${view}`} disabled={working} onClick={() => view === "month" ? moveMonth(1) : onWeek(addDays(week, 7))}><ChevronRight size={18}/></button>
      </div></div>
    </div>
    <div className="calendar-legend">{data.goals.filter(goal => data.workBlocks.some(block => block.goalId === goal.id)).map(goal => <span key={goal.id}><i style={{ background: goalColor(goal.id) }}/>{goal.title}</span>)}<span><i className="legend-busy"/>Other commitments</span><span><i className="legend-review"/>Check-in</span></div>
    <p className="field-hint">{checked ? "Connected calendars checked for this view. External events show busy time." : "Connect or refresh your calendars to see external busy time."} <button className="text-link" disabled={working} onClick={onCalendars}>Manage calendars ↗</button></p>
    {view === "month" ? <div className="month-calendar-scroll"><div className="month-calendar" role="grid" aria-label={formatDate(month, { month: "long", year: "numeric" })}>
      <div className="month-weekdays" role="row">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => <span key={day} role="columnheader">{day}</span>)}</div>
      {Array.from({ length: 6 }, (_, row) => <div className="month-week" role="row" key={row}>{days.slice(row * 7, row * 7 + 7).map(day => <div role="gridcell" aria-label={formatDate(day, { weekday: "long", month: "long", day: "numeric" })} className={`month-day ${day.slice(0, 7) !== month.slice(0, 7) ? "outside-month" : ""} ${day === today ? "is-today" : ""}`} key={day}>
        <div className="month-date"><span>{Number(day.slice(-2))}</span><button className="icon-button" aria-label={`Schedule on ${day}`} disabled={working || day < today} onClick={() => onChoose(day)}><Plus size={12}/></button></div>
        {dayEntries(day).map(entry => <div key={entry.id} className={`month-entry entry-${entry.kind}`} style={entryStyle(entry)}>{content(entry)}</div>)}
      </div>)}</div>)}
    </div></div> : <>
      <div className="week-desktop"><div className="week-day-headings"><span/>{days.map(day => <div key={day} className={day === today ? "is-today" : ""}><b>{formatDate(day, { weekday: "short" })}</b><span>{formatDate(day, { day: "numeric" })}</span><button className="icon-button" aria-label={`Schedule on ${day}`} disabled={working || day < today} onClick={() => onChoose(day)}><Plus size={14}/></button></div>)}</div>
        <div className="week-scroll" ref={scroll}><div className="week-grid"><div className="week-hour-labels">{Array.from({ length: 24 }, (_, hour) => <span key={hour}>{String(hour).padStart(2, "0")}:00</span>)}</div>
          {days.map(day => { const ends: number[] = []; const arranged = dayEntries(day).map(entry => {
            const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
            const start = dateInZone(data.timeZone, new Date(entry.start)) < day ? 0 : minutes(timeInZone(data.timeZone, new Date(entry.start)));
            const end = Math.max(start + 40, dateInZone(data.timeZone, new Date(entry.end)) > day ? 1440 : minutes(timeInZone(data.timeZone, new Date(entry.end))));
            let lane = ends.findIndex(lastEnd => lastEnd <= start); if (lane === -1) lane = ends.length; ends[lane] = end;
            return { entry, start, end, lane };
          }); return <div className={`week-day ${day === today ? "is-today" : ""}`} key={day}>{arranged.map(({ entry, start, end, lane }) => <div className={`calendar-entry entry-${entry.kind}`} key={entry.id} style={{ ...entryStyle(entry), top: start * 1.2, height: (end - start) * 1.2, left: `${lane / ends.length * 100}%`, width: `${100 / ends.length}%` }} title={entry.title}>{content(entry)}</div>)}</div>; })}
        </div></div>
      </div>
      <div className="week-agenda">{days.map(day => <section key={day}><div className="list-heading"><h3>{formatDate(day, { weekday: "long", month: "short", day: "numeric" })}</h3><button className="icon-button" aria-label={`Choose time on ${day}`} disabled={working || day < today} onClick={() => onChoose(day)}><Plus size={16}/></button></div>{dayEntries(day).map(entry => <div key={entry.id} className={`agenda-entry entry-${entry.kind}`} style={entryStyle(entry)}>{content(entry)}</div>)}</section>)}</div>
    </>}
    {active && <Modal title={active.title} onClose={() => setSelected(null)}>
      <p>{formatDate(active.start, { weekday: "long", month: "long", day: "numeric" })} · {timeInZone(data.timeZone, new Date(active.start))}–{timeInZone(data.timeZone, new Date(active.end))}</p>
      {active.goalId && <p><Link to={`/app/goals/${active.goalId}?action=${active.id}`}>{data.goals.find(goal => goal.id === active.goalId)?.title} ↗</Link></p>}
      <p>{active.kind === "work" ? `Adler plan · ${activeAction?.outcome ?? "Scheduled"}` : active.kind === "busy" ? "Busy time from a connected calendar." : "Time reserved for your check-in."}</p>
      {activeAction && <button className="button primary" onClick={() => onRecord(activeAction)}>Continue in Check-in ↗</button>}
      {active.kind === "review" && <Link className="button primary" to="/app/check-in?prompt=Let%E2%80%99s%20review%20my%20week">Start check-in ↗</Link>}
    </Modal>}
  </section>;
}
