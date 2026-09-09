import type { Data, Goal, Plan } from "./store";
import type { PlanStep } from "../shared/adaptive-plan";
import { formatDate } from "./store";
import { addDays } from "../shared/journey";
import { planActionRecords } from "../shared/goal-view";

export function GoalActionTimeline({ data, goal, plan, steps, start, end, today, selectedStepId, milestoneId, onSelect }: {
  data: Data; goal: Goal; plan: Plan; steps: PlanStep[];
  start: string; end: string; today: string; selectedStepId?: string; milestoneId?: string;
  onSelect: (stepId?: string, actionId?: string) => void;
}) {
  const span = Math.max(1, (Date.parse(end) - Date.parse(start)) / 86400000);
  const position = (date: string) => `${Math.max(0, Math.min(100, (Date.parse(date) - Date.parse(start)) / 86400000 / span * 100))}%`;
  const historical = plan.version !== goal.plans.at(-1)!.version;
  const rows = plan.adaptive ? steps : [{ id: undefined, title: plan.action, type: "task", scheduledDate: undefined }];
  return <div className="plan-timeline-scroll">
    <section className="plan-action-timeline" aria-label="Actions on the timeline">
      <div className="plan-timeline-axis"><span>Actions</span><div>{[0, .25, .5, .75, 1].map(fraction => <time key={fraction} style={{ left: `${fraction * 100}%` }}>{formatDate(addDays(start, Math.round(span * fraction)))}</time>)}</div></div>
      {rows.map(step => {
        const records = planActionRecords(data, goal, plan, step.id, milestoneId);
        const visible = records.filter(action => action.date >= start && action.date <= end);
        const selected = step.id === selectedStepId;
        return <div className={`plan-timeline-row ${selected ? "selected" : ""}`} key={step.id ?? "saved-action"}>
          <button className="plan-timeline-action" aria-pressed={selected} onClick={() => onSelect(step.id)}><small>{step.type === "task" ? "One-time action" : "Repeating action"}</small><strong>{step.title}</strong></button>
          <div className="plan-timeline-track">
            {today >= start && today <= end && <span className="plan-timeline-today" style={{ left: position(today) }} />}
            {visible.map(action => <button key={action.id} className={`plan-timeline-mark ${action.retiredAt && !action.outcome ? "retired" : action.outcome === "Done" ? "done" : action.outcome === "Partly" ? "partial" : action.outcome ? "missed" : "planned"}`} style={{ left: position(action.date) }} onClick={() => onSelect(step.id, action.id)} aria-label={`${action.title}, ${formatDate(action.date)}, ${action.retiredAt && !action.outcome ? "retired" : action.outcome ?? (goal.status === "Draft" ? "proposed" : action.date > today ? "planned" : "no report yet")}`}>
              {action.retiredAt && !action.outcome ? "—" : action.outcome === "Done" ? "✓" : action.outcome === "Partly" ? "◐" : action.outcome ? "×" : action.date > today || goal.status === "Draft" ? "·" : "?"}
            </button>)}
            {!visible.length && <button className="timeline-outside" onClick={() => onSelect(step.id)}>{records.some(action => action.date) ? `View ${formatDate(records.find(action => action.date)!.date)} →` : step.scheduledDate ? `Planned ${formatDate(step.scheduledDate)}` : "Not scheduled"}</button>}
          </div>
        </div>;
      })}
      <div className="plan-timeline-key"><span>✓ Done</span><span>◐ Partial</span><span>× Didn’t happen</span><span>· {goal.status === "Draft" ? "Proposed" : "Planned"}</span><span>? Not reported</span>{historical && <span>— Retired</span>}{today >= start && today <= end && <span>│ Today</span>}</div>
    </section>
  </div>;
}
