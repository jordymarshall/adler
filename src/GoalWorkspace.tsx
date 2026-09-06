import { GoalOverview } from "./GoalOverview";
import { PlanExplanation } from "./PlanExplanation";
import { useState, type FormEvent } from "react";
import { Link, Navigate, NavLink, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock3,
  History,
  Pencil,
  Plus,
  Settings2,
} from "lucide-react";
import { EmptyState, GoalIcon, Modal, Tag } from "./components";
import {
  applyPlan,
  currentPlan,
  formatDate,
  localDate,
  useStore,
  type Action,
  type Goal,
  type GoalStatus,
  type Milestone,
} from "./store";
import { ProgressChart } from "./ProgressChart";
import { GoalOrganization } from "./GoalOrganization";
import { RecordAction } from "./Workspace";

function EditPlan({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const { commit } = useStore();
  const [plan] = useState(() => currentPlan(goal));
  const [action, setAction] = useState(plan.action);
  const [criterion, setCriterion] = useState(plan.criterion);
  const [timing, setTiming] = useState(plan.timing);
  function save(e: FormEvent) {
    e.preventDefault();
    if (
      commit(
        (d) =>
          applyPlan(d, goal.id, plan.version, {
            action: action.trim(),
            criterion: criterion.trim(),
            timing: timing.trim(),
          }),
        "Future plan updated. Past and already scheduled records are preserved.",
      )
    )
      onClose();
  }
  return (
    <Modal title="Make the plan fit." onClose={onClose}>
      <p className="muted">
        This creates a new plan version for future actions. Earlier and today’s
        action records stay as they are.
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
            Choose a cue, or use “Unscheduled”. Choose a calendar time after saving.
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

export function GoalWorkspace() {
  const { goalId, tab = "overview" } = useParams();
  const { data, commit } = useStore();
  const goal = data.goals.find((g) => g.id === goalId);
  const [editing, setEditing] = useState(false);
  const [result, setResult] = useState<Milestone | "assessment" | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [score, setScore] = useState("");
  const [source, setSource] = useState("");
  const [resultDate, setResultDate] = useState(localDate());
  const [recording, setRecording] = useState<Action | null>(null);
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
  const plan = currentPlan(goal);
  const actions = data.actions
    .filter((a) => a.goalId === goal.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  function saveResult(e: FormEvent) {
    e.preventDefault();
    if (!confirmed) return;
    if (
      commit((d) => {
        const g = d.goals.find((g) => g.id === goalId)!;
        if (result === "assessment") {
          g.results.push({
            id: crypto.randomUUID(),
            value: Number(score),
            source: source.trim(),
            date: resultDate,
          });
          g.results.sort((a, b) => a.date.localeCompare(b.date));
        } else if (result) {
          const milestone = g.milestones.find((m) => m.id === result.id)!;
          milestone.done = !result.done;
          milestone.completedAt = milestone.done ? localDate() : undefined;
          if (!g.measure && g.kind !== "learning")
            g.results.push({
              id: crypto.randomUUID(),
              date: localDate(),
              value: g.milestones.filter((m) => m.done).length,
              source: `${milestone.done ? "Verified" : "Reopened"}: ${milestone.title}`,
            });
        }
        g.outcomeUpdatedAt = g.results.at(-1)?.date;
      }, "Result saved. Goal progress is updated everywhere.")
    ) {
      setResult(null);
      setConfirmed(false);
      setScore("");
      setSource("");
    }
  }
  const statusOptions: GoalStatus[] =
    goal.status === "Active"
      ? ["Paused", "Completed", "Set aside"]
      : goal.status === "Draft" ? ["Set aside"] : ["Active"];
  return (
    <>
      <Link className="back-link" to="/app/goals">
        <ArrowLeft size={15} />
        All goals
      </Link>
      <div className="goal-page-heading">
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
          <h1>{goal.title}</h1>
          <p>{goal.why || goal.success}</p>
        </div>
        <details className="goal-options">
          <summary aria-label="Goal options">
            <Settings2 size={18} />
            <span>Manage goal</span>
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
      {goal.status === "Draft" && tab !== "overview" && <Link className="button primary" to={`/app/goals/${goal.id}`}>Review & start plan <ArrowRight size={16} /></Link>}
      <nav className="goal-tabs" aria-label="Goal views">
        <NavLink to={`/app/goals/${goal.id}`} end>Overview</NavLink>
        <NavLink to={`/app/goals/${goal.id}/progress`}>Progress</NavLink>
        <NavLink to={`/app/goals/${goal.id}/plan`}>Plan</NavLink>
        <Link to={`/app/coach?goal=${goal.id}`}>Chats</Link>
        <Link to={`/app/insights?goal=${goal.id}`}>Insights</Link>
      </nav>
      {tab === "overview" ? <GoalOverview goal={goal} onRecord={setRecording} /> : tab === "plan" ? (
        <div className="goal-content">
          <section className="panel current-plan">
            <div className="list-heading">
              <h2>A workable next step.</h2>
              <Tag>
                Plan {plan.version} · {formatDate(plan.date)}
              </Tag>
            </div>
            <div className="plan-detail">
              <span>NEXT ACTION</span>
              <h3>{plan.action}</h3>
            </div>
            <div className="plan-two-columns">
              <div className="plan-detail">
                <span>WHEN IT FITS</span>
                <p>
                  <Clock3 size={17} />
                  {plan.timing}
                </p>
              </div>
              <div className="plan-detail">
                <span>FINISHED WHEN</span>
                <p>
                  <CheckCircle2 size={17} />
                  {plan.criterion}
                </p>
              </div>
            </div>
            <div className="plan-actions">
              <button
                className="button primary small-button"
                disabled={goal.status !== "Active" && goal.status !== "Draft"}
                onClick={() => setEditing(true)}
              >
                <Pencil size={15} />
                Edit future plan
              </button>
              <Link
                className="button text-button small-button"
                to={`/app/coach?goal=${goal.id}`}
              >
                Discuss this plan <ArrowUpRight size={15} />
              </Link>
            </div>
          </section>
          {plan.basis && <PlanExplanation basis={plan.basis} />}
          <section className="panel plan-history">
            <h2>
              <History size={20} /> How the plan has changed
            </h2>
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
                  {p.basis && p.version !== plan.version && <details className="explanation-details"><summary>Why this version?</summary><PlanExplanation basis={p.basis} /></details>}
                </div>
              </div>
            ))}
            <p className="muted small-text">
              Each action retains the plan and finished criterion it started
              with.
            </p>
          </section>
        </div>
      ) : tab === "learning" ? (
        <Navigate to={`/app/insights?goal=${goal.id}`} replace />
      ) : (
        <div className="goal-progress-layout">
          <div>
            <section className="panel">
              <ProgressChart goal={goal} />
              <GoalOrganization goal={goal} />
              {!!goal.measurementHistory?.length && <details className="chart-data"><summary>Previous measurements</summary>{goal.measurementHistory.map((history, i) => <article key={i}><b>{history.label} · {history.unit}</b><p>{history.reason}</p>{history.results.map((record) => <p key={record.id}>{formatDate(record.date)}: {record.value} {history.unit} · {record.source}</p>)}</article>)}</details>}
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
                {(goal.measure || goal.kind === "learning") && (
                  <button
                    className="button primary small-button"
                    onClick={() => {
                      setResult("assessment");
                      setConfirmed(false);
                    }}
                  >
                    <Plus size={15} />
                    {goal.measure ? "Record a result" : "Record an assessment"}
                  </button>
                )}
                <Link className="text-link" to={`/app/coach?goal=${goal.id}`}>
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
                      {m.dueDate && <p className="field-hint">Due {formatDate(m.dueDate)}</p>}
                    </div>
                    <button
                      className="button text-button small-button"
                      onClick={() => {
                        setResult(m);
                        setConfirmed(false);
                      }}
                    >
                      {m.done ? "Correct result" : "Update result"}
                      <ArrowUpRight size={14} />
                    </button>
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
                <div className="action-history-item" key={a.id}>
                  <span className="history-icon">
                    {a.outcome === "Done" ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <Circle size={17} />
                    )}
                  </span>
                  <div>
                    <button onClick={() => setRecording(a)}>{a.title}</button>
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
          <aside className="goal-progress-aside">
            <div className="panel success-note">
              <GoalIcon kind={goal.kind} />
              <span className="section-kicker">WHAT SUCCESS LOOKS LIKE</span>
              <p>{goal.success}</p>
            </div>
            <Link
              className="next-step-link panel"
              to={`/app/goals/${goal.id}/plan`}
            >
              <span className="section-kicker">YOUR CURRENT NEXT STEP</span>
              <h3>{plan.action}</h3>
              <span>
                <Clock3 size={15} />
                {plan.timing}
              </span>
              <b>
                Open your plan <ArrowUpRight size={16} />
              </b>
            </Link>
          </aside>
        </div>
      )}
      {editing && <EditPlan goal={goal} onClose={() => setEditing(false)} />}
      {recording && (
        <RecordAction action={recording} onClose={() => setRecording(null)} />
      )}
      {result && (
        <Modal
          title={
            result === "assessment"
              ? goal.measure
                ? "Record your result"
                : "Record what you can solve."
              : result.done
                ? "Correct this result."
                : "A result worth recording."
          }
          onClose={() => setResult(null)}
        >
          <form onSubmit={saveResult}>
            {result === "assessment" ? (
              <>
                <p className="muted">
                  {goal.measure
                    ? `Measure ${goal.measure.label.toLowerCase()} in ${goal.measure.unit}, using the same method each time.`
                    : "Use the same kind of course assessment so the results mean the same thing."}
                </p>
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="score">
                      {goal.measure?.label ?? "Problems solved correctly"}
                    </label>
                    <input
                      id="score"
                      type="number"
                      min="0"
                      max={goal.measure ? 1000000 : 10}
                      step={goal.measure ? "any" : "1"}
                      required
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                    />
                    <p className="field-hint">
                      {goal.measure?.unit ?? "Out of 10 problems"}
                    </p>
                  </div>
                  <div className="form-field">
                    <label htmlFor="score-date">Observation date</label>
                    <input
                      id="score-date"
                      type="date"
                      required
                      max={localDate()}
                      value={resultDate}
                      onChange={(e) => setResultDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor="score-source">
                    {goal.measure
                      ? "How you measured it"
                      : "Assessment / source"}
                  </label>
                  <input
                    id="score-source"
                    required
                    maxLength={300}
                    value={source}
                    placeholder="e.g. Course practice set C"
                    onChange={(e) => setSource(e.target.value)}
                  />
                </div>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    required
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                  />
                  {goal.measure
                    ? "I measured this result using the goal’s agreed definition."
                    : "This assessment has comparable content, difficulty, and scoring to this goal’s other results."}
                </label>
                <p className="field-hint">
                  {goal.measure
                    ? "Completing a session or milestone does not change this measurement automatically."
                    : "Incompatible assessments can’t be entered in this series. Create a separate goal with a suitable measure instead."}
                </p>
              </>
            ) : (
              <>
                <h3>{result.title}</h3>
                <p className="criterion">{result.criterion}</p>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    required
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                  />
                  {result.done
                    ? "This result is not currently met. Return it to in progress."
                    : "I confirm this result meets the criterion above."}
                </label>
                <p className="field-hint">
                  This records the result. Completing the whole goal is a
                  separate choice.
                </p>
              </>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setResult(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button primary"
                disabled={!confirmed}
              >
                Save result <Check size={16} />
              </button>
            </div>
          </form>
        </Modal>
      )}
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
