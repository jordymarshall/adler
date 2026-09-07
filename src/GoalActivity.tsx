import { addDays, dateInZone } from "../shared/journey";
import { formatDate, type Data, type Goal } from "./store";

export function GoalActivity({ data, goal }: { data: Data; goal: Goal }) {
  const today = dateInZone(data.timeZone);
  const dates = Array.from({ length: 84 }, (_, index) => addDays(today, index - 83));
  const records = data.actions.filter(a => a.goalId === goal.id && a.date >= dates[0] && a.date <= today && (!a.retiredAt || a.outcome));
  const reported = records.filter(a => a.outcome), done = reported.filter(a => a.outcome === "Done");
  return <div className="goal-activity">
    <div className="activity-cells" role="img" aria-label={`Last 12 weeks: ${done.length} completed actions, ${reported.length} reported, ${records.length - reported.length} awaiting check-in. Darker green means more completed actions.`}>
      {dates.map(date => { const day = records.filter(a => a.date === date); const count = day.filter(a => a.outcome === "Done").length; return <span key={date} className={`activity-day level-${Math.min(4, count)} ${day.some(a => !a.outcome) ? "unknown" : ""}`} title={`${formatDate(date)}: ${count} done, ${day.filter(a => a.outcome === "Partly").length} partly, ${day.filter(a => a.outcome === "Didn’t happen").length} missed, ${day.filter(a => !a.outcome).length} unknown`} />; })}
    </div>
    <small>{reported.length ? `${Math.round(100 * done.length / reported.length)}% completed` : "No check-ins yet"} · {reported.length} reported</small>
  </div>;
}
