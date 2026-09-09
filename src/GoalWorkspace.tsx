import { dateInZone, reviewSchedule } from "../shared/journey";
import { GoalPlan } from "./GoalPlan";
import { PlanExplanation } from "./PlanExplanation";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  History,
  Flame,
  Settings2,
} from "lucide-react";
import { EmptyState, GoalIcon, Modal, Tag } from "./components";
import {
  applyPlan,
  currentPlan,
  formatDate,
  useStore,
  type Goal,
  type GoalStatus,
} from "./store";
import { ProgressRecords } from "./ProgressChart";
import { GoalOrganization } from "./GoalOrganization";
import { goalStreak } from "../shared/goal-view";
import { goalProjection } from "../shared/goal-projection";

function EditPlan({ goal, stepId, onClose }: { goal: Goal; stepId?: string; onClose: () => void }) {
  const { commit } = useStore();
  const [plan] = useState(() => currentPlan(goal));
  const step = plan.adaptive?.steps.find(step => step.id === stepId);
  const [action, setAction] = useState(step?.title ?? plan.action);
  const [criterion, setCriterion] = useState(step?.criterion ?? plan.criterion);
  const [timing, setTiming] = useState(step?.cue ?? plan.timing);
  function save(e: FormEvent) {
    e.preventDefault();
    const adaptive = step && plan.adaptive ? structuredClone(plan.adaptive) : undefined;
    if (adaptive) {
      const edited = adaptive.steps.find(item => item.id === stepId)!;
      const meaningChanged = edited.title !== action.trim() || edited.criterion !== criterion.trim();
      const changed = meaningChanged || edited.cue !== timing.trim();
      Object.assign(edited, { title: action.trim(), criterion: criterion.trim(), cue: timing.trim() });
      if (changed) { delete adaptive.reasoning; delete adaptive.experiment; }
      if (meaningChanged) {
        delete edited.measure;
        if (adaptive.projection?.driverStepId === stepId) delete adaptive.projection;
      }
    }
    if (
      commit(
        (d) =>
          applyPlan(d, goal.id, plan.version, {
            action: action.trim(),
            criterion: criterion.trim(),
            timing: timing.trim(),
            ...(adaptive ? { adaptive } : {}),
          }),
        "Plan updated. Reported, started and booked work is preserved.",
      )
    )
      onClose();
  }
  return (
    <Modal title="Make the plan fit." onClose={onClose}>
      <p className="muted">
        This creates a new plan version. Reported, started and booked work stays
        with its saved plan.
      </p>
      <form onSubmit={save}>
        <div className="form-field">
          <label htmlFor="plan-action">Next action</label>
          <textarea
            id="plan-action"
            value={action}
            required
            maxLength={300}
            rows={2}
            onChange={(e) => setAction(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="plan-criterion">Finished when</label>
          <textarea
            id="plan-criterion"
            value={criterion}
            required
            maxLength={500}
            rows={2}
            onChange={(e) => setCriterion(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="plan-timing">Timing or cue</label>
          <input
            id="plan-timing"
            value={timing}
            required
            maxLength={150}
            onChange={(e) => setTiming(e.target.value)}
          />
          <p className="field-hint">
            Choose a cue, or use “Unscheduled”. Choose a calendar time after
            saving.
          </p>
        </div>
        <div className="modal-actions">
          <button className="button secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="button primary"
            type="submit"
            disabled={!action.trim() || !criterion.trim() || !timing.trim()}
          >
            Save plan <Check size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function GoalWorkspace({
  focusedGoalId,
  actionId,
  home = false,
}: {
  focusedGoalId?: string;
  actionId?: string;
  home?: boolean;
}) {
  const params = useParams();
  const goalId = focusedGoalId ?? params.goalId;
  const tab = params.tab;
  const [query] = useSearchParams();

  const { data, commit } = useStore();
  const goal = data.goals.find((g) => g.id === goalId);
  const [editing, setEditing] = useState(false);
  const [editingStep, setEditingStep] = useState<string>();
  const [statusChange, setStatusChange] = useState<GoalStatus | null>(null);
  if (!goal)
    return (
      <EmptyState title="This goal isn’t here.">
        <p>It may have been removed from your local workspace.</p>
        <Link className="button primary" to="/app/goals">
          Back to goals
        </Link>
      </EmptyState>
    );
  if (tab === "learning")
    return (
      <Navigate
        to={`/app/insights?goal=${encodeURIComponent(goal.id)}`}
        replace
      />
    );
  const plan = currentPlan(goal);
  const progress = goalProjection(data, goal, dateInZone(data.timeZone));
  const streak = goalStreak(data, goal, dateInZone(data.timeZone));
  const actions = data.actions
    .filter((a) => a.goalId === goal.id)
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        (b.history.at(-1)?.at ?? "").localeCompare(a.history.at(-1)?.at ?? ""),
    );
  const actionMeasure = plan.basis?.actionMeasure;
  const observationPeriod = reviewSchedule(data);
  const observations = actions.filter(
    (a) =>
      a.planVersion === plan.version &&
      a.outcome &&
      (actionMeasure?.period === "action" ||
        (actionMeasure?.period === "day"
          ? a.date === dateInZone(data.timeZone)
          : a.date >= observationPeriod.periodStart &&
            a.date <= observationPeriod.today)),
  );
  const amounts = (
    actionMeasure?.period === "action" ? observations.slice(0, 1) : observations
  ).filter((a) => a.amount !== undefined);
  const statusOptions: GoalStatus[] =
    goal.status === "Active"
      ? ["Paused", "Completed", "Set aside"]
      : goal.status === "Draft"
        ? ["Set aside"]
        : ["Active"];
  return (
    <>
      {!home && (
        <Link className="back-link" to="/app/goals">
          <ArrowLeft size={15} /> Goals
        </Link>
      )}
      <div className="goal-page-heading journey-goal-heading">
        <GoalIcon kind={goal.kind} />
        <div>
          <div className="goal-title-tags">
            <span className="section-kicker">
              {goal.kind === "project"
                ? "PROJECT GOAL"
                : goal.kind === "learning"
                  ? "LEARNING GOAL"
                  : "PERSONAL GOAL"}
            </span>
            <Tag tone="sage">{goal.status}</Tag>
          </div>
          <h1>{goal.title}{plan.adaptive?.steps.some(step => step.type === "behavior") && <span className="goal-streak" title={`${streak.count} days on plan. Planned rest counts after an on-plan day; unknown past reports interrupt the count.`}><Flame size={23} fill="currentColor" aria-hidden="true" /><span aria-label={`${streak.count} days on plan`}>{streak.count}</span></span>}</h1>
          <span className="goal-target-date">{goal.targetDate ? `Target · ${formatDate(goal.targetDate, { month: "short", day: "numeric", year: "numeric" })}` : "Flexible timeline"}</span>
        </div>
        <div className="goal-heading-result"><strong>{progress.current ?? "—"} <span>/ {progress.target || "—"} {goal.measure?.unit ?? goal.unit ?? "milestones"}</span></strong><small>{progress.observedAt ? `${goal.measure || goal.kind === "learning" ? "Reported outcome" : "Milestone status"} · ${formatDate(progress.observedAt)}` : "Saved starting point"}</small></div>
        <details className="goal-options">
          <summary aria-label="Goal options">
            <Settings2 size={18} />
            <span>Goal settings</span>
            <ChevronDown size={13} />
          </summary>
          <div>
            {statusOptions.map((s) => (
              <button
                key={s}
                onClick={(e) => {
                  setStatusChange(s);
                  e.currentTarget.closest("details")?.removeAttribute("open");
                }}
              >
                {s === "Active"
                  ? "Resume goal"
                  : s === "Paused"
                    ? "Pause goal"
                    : s === "Completed"
                      ? "Complete goal"
                      : "Set goal aside"}
              </button>
            ))}
          </div>
        </details>
      </div>
      <GoalPlan key={`${goal.id}:${actionId ?? query.get("action") ?? ""}`} goal={goal} actionId={actionId ?? query.get("action") ?? undefined} onEdit={stepId => { setEditingStep(stepId); setEditing(true); }} />
      <details id="goal-details" className="goal-records" open={tab === "progress" || tab === "plan" || undefined}>
      <summary>History & settings</summary>
      <details
        className="journey-disclosure"
        open={tab === "plan" || undefined}
      >
        <summary>Why this plan? · Current reasoning & earlier versions</summary>
        <div className="goal-content">
          <p>{goal.success}</p>
          <button
            className="text-link"
            disabled={goal.status !== "Active" && goal.status !== "Draft"}
            onClick={() => { setEditingStep(undefined); setEditing(true); }}
          >
            Edit the next action
          </button>
          {plan.basis && <PlanExplanation basis={plan.basis} reasoning={plan.adaptive?.reasoning} />}
          <details className="quiet-disclosure plan-history">
            <summary>Earlier plans</summary>
            {[...goal.plans].reverse().map((p) => (
              <div key={p.version}>
                <span className="version-dot" />
                <div>
                  <b>
                    Plan {p.version}{" "}
                    {p.version === plan.version && (
                      <Tag tone="sage">Current</Tag>
                    )}
                  </b>
                  <p>{p.action}</p>
                  <span>
                    {p.timing} · {formatDate(p.date)}
                  </span>
                  {p.basis && p.version !== plan.version && (
                    <details className="explanation-details">
                      <summary>Why this version?</summary>
                      <PlanExplanation basis={p.basis} reasoning={p.adaptive?.reasoning} />
                    </details>
                  )}
                </div>
              </div>
            ))}
            <p className="muted small-text">
              Each action retains the plan and finished criterion it started
              with.
            </p>
          </details>
        </div>
      </details>
      <details
        className="journey-disclosure"
        open={tab === "progress" || undefined}
      >
        <summary>
          Reports & measurement settings · {goal.results.at(-1)?.value ?? "—"} /{" "}
          {goal.target ?? goal.milestones.length} {goal.unit ?? "milestones"}
        </summary>
        <div className="goal-progress-layout journey-progress">
          <div>
            <section className="panel">
              <ProgressRecords goal={goal} today={dateInZone(data.timeZone)} />
              {actionMeasure && (
                <div className="action-observations">
                  <b>
                    {actionMeasure.label} ·{" "}
                    {actionMeasure.period === "action"
                      ? "Latest action"
                      : actionMeasure.period === "day"
                        ? "Today"
                        : "This review week"}
                  </b>
                  <p>
                    {amounts.length
                      ? `${amounts.reduce((sum, a) => sum + a.amount!, 0)} ${actionMeasure.unit} recorded`
                      : "No amount recorded yet"}
                    {actionMeasure.target !== null
                      ? ` · Target ${actionMeasure.target} per ${actionMeasure.period}`
                      : ""}
                  </p>
                  <p className="field-hint">
                    From this plan’s actions. Missing amounts are unknown.
                  </p>
                </div>
              )}
              <GoalOrganization goal={goal} />
              {!!goal.measurementHistory?.length && (
                <details className="chart-data">
                  <summary>Previous measurements</summary>
                  {goal.measurementHistory.map((history, i) => (
                    <article key={i}>
                      <b>
                        {history.label} · {history.unit}
                      </b>
                      <p>{history.reason}</p>
                      {history.results.map((record) => (
                        <p key={record.id}>
                          {formatDate(record.date)}: {record.value}{" "}
                          {history.unit} · {record.source}
                        </p>
                      ))}
                    </article>
                  ))}
                </details>
              )}
              {!!goal.checkpointHistory?.length && (
                <details className="chart-data">
                  <summary>Previous checkpoint schedules</summary>
                  {goal.checkpointHistory.map((h, i) => (
                    <div key={i}>
                      <b>
                        {new Date(h.date).toLocaleDateString()} · {h.reason}
                      </b>
                      <p>
                        Previous target: {h.targetDate}.{" "}
                        {h.checkpoints
                          .map((p) => `${p.date}: ${p.value}`)
                          .join("; ")}
                      </p>
                    </div>
                  ))}
                </details>
              )}
              <div className="plan-actions">
                <Link className="text-link" to={`/app/check-in?goal=${goal.id}`}>
                  Review progress with Adler <ArrowRight size={15} />
                </Link>
              </div>
            </section>
            <section className="milestone-section">
              <div className="list-heading">
                <h2>Milestones</h2>
              </div>
              <div className="milestone-list">
                {goal.milestones.map((m, i) => (
                  <article
                    key={m.id}
                    id={`record-${m.id}`}
                    className={`milestone-card ${m.done ? "complete" : ""}`}
                  >
                    <span className="milestone-status">
                      {m.done ? (
                        <Check size={17} />
                      ) : (
                        <span>{String(i + 1).padStart(2, "0")}</span>
                      )}
                    </span>
                    <div>
                      <h3>{m.title}</h3>
                      <Tag tone={m.done ? "sage" : ""}>
                        {m.done
                          ? "Verified"
                          : i === goal.milestones.findIndex((m) => !m.done)
                            ? "In progress"
                            : "Not started"}
                      </Tag>
                      <p>{m.criterion}</p>
                      {m.dueDate && (
                        <p className="field-hint">
                          Due {formatDate(m.dueDate)}
                        </p>
                      )}
                    </div>
                    <Link className="text-link" to={`/app/check-in?goal=${goal.id}&prompt=${encodeURIComponent(`I want to discuss the milestone: ${m.title}`)}`}>Discuss in Check-in <ArrowUpRight size={14} /></Link>
                  </article>
                ))}
              </div>
            </section>
            <section className="panel action-history" id="action-history">
              <div className="list-heading">
                <h2>The work along the way</h2>
                <History size={18} />
              </div>
              <p className="muted small-text">
                Actions recorded separately from the result above.
              </p>
              {actions.map((a) => (
                <div className="action-history-item" key={a.id} id={`record-${a.id}`}>
                  <span className="history-icon">
                    {a.outcome === "Done" ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <Circle size={17} />
                    )}
                  </span>
                  <div>
                    <Link to={`/app/check-in?goal=${goal.id}&prompt=${encodeURIComponent(`I want to check in on ${a.title} (${a.date || "unscheduled"}).`)}`}>{a.title}</Link>
                    <span>
                      {a.unplanned ? "Unplanned · " : ""}
                      {a.date ? formatDate(a.date) : "Unscheduled"} · Plan{" "}
                      {a.planVersion}
                    </span>
                    {a.note && <p>“{a.note}”</p>}
                    {a.history.length > 0 && (
                      <details>
                        <summary>
                          {a.history.length} earlier revision
                          {a.history.length !== 1 ? "s" : ""}
                        </summary>
                        {a.history.map((revision, index) => (
                          <p key={index}>
                            {revision.outcome ?? "Unknown"}
                            {revision.note ? ` — ${revision.note}` : ""} ·{" "}
                            {new Date(revision.at).toLocaleString()}
                          </p>
                        ))}
                      </details>
                    )}
                  </div>
                  <Tag tone={a.outcome === "Done" ? "sage" : ""}>
                    {a.outcome ?? "Unknown"}
                  </Tag>
                </div>
              ))}
            </section>
          </div>
        </div>
      </details>
      </details>
      {editing && <EditPlan goal={goal} stepId={editingStep} onClose={() => setEditing(false)} />}
      {statusChange && (
        <Modal
          title={
            statusChange === "Paused"
              ? "Make a little room."
              : statusChange === "Completed"
                ? "Ready to call this complete?"
                : statusChange === "Active"
                  ? "Welcome back to this goal."
                  : "Set this goal aside?"
          }
          onClose={() => setStatusChange(null)}
        >
          <p>
            {statusChange === "Completed"
              ? `Confirm you’ve met your success criterion: ${goal.success}`
              : statusChange === "Active"
                ? "Resume this goal with its current plan. You can adjust future timing from the Plan tab."
                : "This goal will leave your active list. Its actions, results, and history stay here for you to return to."}
          </p>
          <p className="muted small-text">
            {statusChange !== "Active"
              ? "Future prompts stop. Your history stays intact."
              : "Past unknown updates remain unknown."}
          </p>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setStatusChange(null)}
            >
              Cancel
            </button>
            <button
              className="button primary"
              onClick={() => {
                if (
                  commit((d) => {
                    const g = d.goals.find((g) => g.id === goalId)!;
                    g.status = statusChange;
                    if (g.trial && statusChange !== "Active")
                      g.trial.state = "Set aside";
                  }, `Goal ${statusChange.toLowerCase()}.`)
                )
                  setStatusChange(null);
              }}
            >
              {statusChange === "Completed"
                ? "Confirm goal completed"
                : statusChange === "Active"
                  ? "Resume goal"
                  : statusChange === "Paused"
                    ? "Pause goal"
                    : "Set aside"}
              <Check size={16} />
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
