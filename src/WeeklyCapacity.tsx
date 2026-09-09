import { Link } from "react-router-dom";
import { scheduledCommitments } from "../shared/adaptive-plan";
import { weekStart } from "../shared/goal-execution";
import { addDays, dateInZone } from "../shared/journey";
import { formatDate, type Data } from "./store";
import { goalColor } from "./goal-colors";

export const workTime = (minutes: number) => `${Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)}h ` : ""}${Math.round(minutes % 60) ? `${Math.round(minutes % 60)}m` : minutes === 0 ? "0m" : ""}`.trim();

export function WeeklyCapacity({ data }: { data: Data }) {
  const today = dateInZone(data.timeZone), start = weekStart(today), end = addDays(start, 6);
  const commitments = scheduledCommitments(data, today).filter(item => item.date <= end);
  const groups = data.goals.map(goal => ({ goal, minutes: commitments.filter(item => item.goalId === goal.id).reduce((sum, item) => sum + item.minutes, 0) })).filter(group => group.minutes > 0);
  const total = groups.reduce((sum, group) => sum + group.minutes, 0);
  const program = data.programs.at(-1)!;
  const budget = program.weeklyMinutes, scale = Math.max(1, total, budget);
  return <section className="weekly-capacity" aria-label="Weekly time budget">
    <div className="capacity-heading"><strong>This week · {formatDate(start)}–{formatDate(end)}</strong><span>{workTime(total)} planned / {workTime(budget)} time budget</span><Link className="text-link" to="/app/settings/coaching">Edit time budget ↗</Link></div>
    <div className="capacity-track" role="img" aria-label={`${workTime(total)} planned against a ${workTime(budget)} weekly time budget${total > budget ? `. ${workTime(total - budget)} over budget` : ""}`}>
      {groups.map(({ goal, minutes }) => <span key={goal.id} style={{ width: `${minutes / scale * 100}%`, background: goalColor(goal.id) }} />)}
      {total > budget && <i className="capacity-overflow" style={{ left: `${budget / scale * 100}%` }} />}
      <i className="capacity-limit" style={{ left: `${Math.min(99.8, budget / scale * 100)}%` }} />
    </div>
    <div className="capacity-scale"><span>0h</span><span>Black marker · {workTime(budget)} budget</span><span>{workTime(scale)}</span></div>
    <div className="capacity-legend">{groups.map(({ goal, minutes }) => <Link key={goal.id} to={`/app/goals/${goal.id}`}><i style={{ background: goalColor(goal.id) }} />{goal.title} · {workTime(minutes)}{goal.status === "Draft" ? " proposed" : ""}</Link>)}{total > budget && <Link className="text-link capacity-review" to={`/app/check-in?${new URLSearchParams({ prompt: "Review my planned work across goals against my weekly time budget. Help me make it fit without changing past reports or booked work without discussion." })}`}>{workTime(total - budget)} over budget · Review with Coach ↗</Link>}</div>
    <details className="capacity-source"><summary>Where these hours come from</summary><p>Saved action durations across active goals and draft plans, using calendar bookings where present. A booking is counted once. Unscheduled actions are not included. This is your saved time budget, not a measurement of free calendar time.</p><p>{program.reason}</p></details>
  </section>;
}
