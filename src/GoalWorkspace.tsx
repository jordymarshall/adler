import { useState, type FormEvent } from "react";
import { Link, NavLink, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Asterisk,
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

export function ProposalCard({ goal }: { goal: Goal }) {
  const { data, commit } = useStore();
  const [edit, setEdit] = useState(false);
  const [text, setText] = useState(
    "Write rough bullets for the problem statement before editing",
  );
  const [review, setReview] = useState(false);
  const [assessment, setAssessment] = useState("");
  const plan = currentPlan(goal);
  const trial = goal.trial;
  const source = data.actions.find((a) => a.id === trial?.sourceId);
  if (!trial)
    return (
      <div className="learning-empty">
        <Asterisk size={29} />
        <h3>No plan changes recorded yet.</h3>
        <p>
          Ask Adler to review your results and action notes. Approved changes
          and their reviews appear in your coaching program.
        </p>
        <Link className="button secondary" to={`/app/coach?goal=${goal.id}`}>
          Talk through this goal <ArrowUpRight size={16} />
        </Link>
      </div>
    );
  function accept() {
    const expectedVersion = trial!.version;
    commit((d) => {
      const current = d.goals.find((g) => g.id === goal.id)!;
      if (
        current.trial?.state !== "Suggested" ||
        current.trial.version !== expectedVersion
      )
        throw new Error(
          "This suggestion has changed. Review the latest version before accepting.",
        );
      applyPlan(d, goal.id, expectedVersion, {
        action: text.trim(),
        timing: plan.timing,
        criterion:
          "A set of rough bullets explains the problem. Editing can wait.",
      });
      current.trial = { ...current.trial!, state: "Trying" };
    }, "Change accepted for future actions. Earlier records are preserved.");
  }
  return (
    <article className="proposal-card">
      <div className="proposal-header">
        <span className="coach-mark">
          <Asterisk size={22} />
        </span>
        <div>
          <span className="section-kicker">EXAMPLE ADJUSTMENT</span>
          <h3>
            {trial.state === "Trying"
              ? "Draft rough bullets before editing."
              : trial.state === "Set aside"
                ? "A suggestion you set aside."
                : trial.state === "Reviewed"
                  ? "Drafting approach reviewed."
                  : "Separate drafting from editing."}
          </h3>
        </div>
        <Tag tone="sage">{trial.state}</Tag>
      </div>
      <div className="proposal-observation">
        <span>THE OBSERVATION</span>
        <p>
          {source?.note
            ? `You reported: “${source.note}”`
            : "The original context is no longer available. This suggestion needs to be reconsidered."}
        </p>
        {source && (
          <Link
            to={`/app/goals/${goal.id}/progress#action-history`}
            className="small-text text-link"
          >
            Action update · {formatDate(source.date)} <ArrowUpRight size={12} />
          </Link>
        )}
      </div>
      <div className="proposal-body">
        <span className="section-kicker">POSSIBLE EXPLANATION</span>
        <p>
          Editing while drafting may make it harder to get a first version
          finished. Try separating the two tasks, then check whether a complete
          draft is ready for feedback.
        </p>
        <div className="plan-diff">
          <div>
            <span>BEFORE · PLAN {trial.version}</span>
            <p>{goal.plans.find((p) => p.version === trial.version)?.action}</p>
          </div>
          <ArrowRight size={18} />
          <div>
            <span>CHANGE TO TRY</span>
            {edit ? (
              <input
                aria-label="Proposed action"
                value={text}
                maxLength={300}
                onChange={(e) => setText(e.target.value)}
              />
            ) : (
              <p>
                {trial.state === "Trying" || trial.state === "Reviewed"
                  ? plan.action
                  : text}
              </p>
            )}
          </div>
        </div>
        <div className="trial-details">
          <span>
            <Clock3 size={16} />
            <b>Review after</b> the next two opportunities
          </span>
          <span>
            <CheckCircle2 size={16} />
            <b>Notice</b> whether you get rough ideas down before editing
          </span>
        </div>
        <details className="suggestion-rationale">
          <summary>
            Why this suggestion? <ChevronDown size={15} />
          </summary>
          <p>
            Your saved note says editing the opening displaced the rest of the
            draft. This example gives the first pass one job: put the rough
            ideas on the page. After two attempts, check whether a complete
            draft is ready for feedback.
          </p>
          <Link className="text-link" to="/method">
            About the method <ArrowUpRight size={13} />
          </Link>
        </details>
        {trial.state === "Suggested" && (
          <div className="proposal-actions">
            <button
              className="button primary small-button"
              disabled={!text.trim()}
              onClick={accept}
            >
              Try this change <ArrowRight size={15} />
            </button>
            <button
              className="button text-button small-button"
              onClick={() => setEdit(!edit)}
            >
              {edit ? "Done editing" : "Edit proposal"}
            </button>
            <button
              className="button text-button small-button"
              onClick={() =>
                commit((d) => {
                  d.goals.find((g) => g.id === goal.id)!.trial!.state =
                    "Set aside";
                }, "Suggestion set aside. Your plan is unchanged.")
              }
            >
              Keep current plan
            </button>
          </div>
        )}
        {trial.state === "Trying" && (
          <>
            <p className="form-notice">
              Your accepted plan applies to future actions. Today’s original
              action keeps its original wording and criterion.
            </p>
            <button
              className="button secondary small-button"
              onClick={() => setReview(true)}
            >
              Review this change <ArrowRight size={15} />
            </button>
          </>
        )}
        {trial.state === "Set aside" && (
          <p className="muted small-text">
            This suggestion will not make any changes. You can edit the plan
            directly whenever it’s useful.
          </p>
        )}
      </div>
      {review && (
        <Modal
          title="How did this approach feel?"
          onClose={() => setReview(false)}
        >
          <p className="muted">
            Your experience is useful information. It doesn’t have to be a firm
            conclusion.
          </p>
          <fieldset className="choice-fieldset">
            <legend>Your assessment</legend>
            {[
              "It helped",
              "No clear difference",
              "It was harder",
              "Need more attempts",
            ].map((value) => (
              <label key={value}>
                <input
                  type="radio"
                  name="assessment"
                  value={value}
                  checked={assessment === value}
                  onChange={() => setAssessment(value)}
                />
                {value}
              </label>
            ))}
          </fieldset>
          <p className="field-label">Choose what happens to the plan</p>
          <div className="stack-actions">
            <button
              className="button primary"
              disabled={!assessment}
              onClick={() => {
                if (
                  commit((d) => {
                    const g = d.goals.find((g) => g.id === goal.id)!;
                    g.trial!.state = "Reviewed";
                    d.messages.push({
                      id: crypto.randomUUID(),
                      goalId: goal.id,
                      role: "user",
                      text: `Trial review: ${assessment}. My decision: keep the current approach.`,
                    });
                  }, "Assessment saved. You chose to keep the current approach.")
                )
                  setReview(false);
              }}
            >
              Save assessment & keep this approach
            </button>
            <button
              className="button secondary"
              disabled={!assessment}
              onClick={() => {
                if (
                  commit((d) => {
                    const g = d.goals.find((g) => g.id === goal.id)!;
                    const before = g.plans.find(
                      (p) => p.version === trial.version,
                    )!;
                    applyPlan(d, g.id, plan.version, before);
                    g.trial!.state = "Reviewed";
                    d.messages.push({
                      id: crypto.randomUUID(),
                      goalId: goal.id,
                      role: "user",
                      text: `Trial review: ${assessment}. My decision: restore the previous approach for future actions.`,
                    });
                  }, "Assessment saved. Previous approach restored for future actions.")
                )
                  setReview(false);
              }}
            >
              Save assessment & restore previous approach
            </button>
          </div>
        </Modal>
      )}
    </article>
  );
}

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
            The next occurrence starts tomorrow, or use “Unscheduled” to leave
            it open.
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
  const { goalId, tab = "progress" } = useParams();
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
      : ["Active"];
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
      <nav className="goal-tabs" aria-label="Goal views">
        <NavLink to={`/app/goals/${goal.id}/progress`}>Progress</NavLink>
        <NavLink to={`/app/goals/${goal.id}/plan`}>Plan</NavLink>
        <NavLink to={`/app/goals/${goal.id}/learning`}>
          What we’re learning
        </NavLink>
      </nav>
      {tab === "plan" ? (
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
                disabled={goal.status !== "Active"}
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
        <div className="goal-content">
          <div className="subview-heading">
            <h2>Changes you’re testing.</h2>
            <p>
              Review the obstacle, the proposed action, and what you’ll check
              after trying it.
            </p>
          </div>
          <ProposalCard goal={goal} />
        </div>
      ) : (
        <div className="goal-progress-layout">
          <div>
            <section className="panel">
              <ProgressChart goal={goal} />
              <GoalOrganization goal={goal} />
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
              <Link className="text-link" to={`/app/coach?goal=${goal.id}`}>
                Review progress with Adler <ArrowRight size={15} />
              </Link>
            </section>
            <section className="panel outcome-panel">
              <span className="section-kicker">THE RESULT THAT MATTERS</span>
              <h2>
                {goal.measure ? (
                  <>
                    {goal.results.at(-1)?.value ?? "—"}
                    <span> {goal.measure.unit}</span>
                  </>
                ) : goal.kind === "learning" ? (
                  <>
                    {goal.results.at(-1)?.value ?? "—"}
                    <span> / 10</span>
                  </>
                ) : (
                  <>
                    {goal.milestones.filter((m) => m.done).length}
                    <span> of {goal.milestones.length}</span>
                  </>
                )}
              </h2>
              <p>
                {goal.measure
                  ? goal.measure.label
                  : goal.kind === "learning"
                    ? "Problems solved correctly, out of 10"
                    : goal.kind === "project" && goal.id === "portfolio"
                      ? "Case studies published"
                      : "Steps verified against their criteria"}
              </p>
              <span className="result-source">
                {goal.kind === "learning"
                  ? "Target: 8/10 · Comparable course assessments"
                  : "Confirmed results, separate from action updates"}
              </span>
              {goal.measure && (
                <button
                  className="button secondary small-button"
                  onClick={() => {
                    setResult("assessment");
                    setConfirmed(false);
                  }}
                >
                  Record a result <Plus size={15} />
                </button>
              )}
              {!goal.measure && goal.kind === "learning" && (
                <>
                  <div
                    className="assessment-chart"
                    role="img"
                    aria-label={
                      goal.results
                        .map(
                          (r) => `${formatDate(r.date)}: ${r.value} out of 10`,
                        )
                        .join("; ") + ". Target: 8 out of 10."
                    }
                  >
                    <span className="chart-target">Target 8/10</span>
                    <div className="chart-grid" />
                    {goal.results.map((r, i) => (
                      <div className="assessment-column" key={r.id}>
                        <div
                          className="assessment-bar"
                          style={{ height: `${r.value * 10}%` }}
                        >
                          <b>{r.value}/10</b>
                        </div>
                        <span>{formatDate(r.date)}</span>
                        <small>
                          {i < 2 && goal.id === "statistics"
                            ? "Example data"
                            : "Entered by you"}
                        </small>
                      </div>
                    ))}
                  </div>
                  <details className="result-table">
                    <summary>
                      Assessment records <ChevronDown size={15} />
                    </summary>
                    <table>
                      <caption>
                        Comparable course problems solved correctly, out of 10
                      </caption>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Result</th>
                          <th>Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {goal.results.map((r) => (
                          <tr key={r.id}>
                            <td>{formatDate(r.date)}</td>
                            <td>{r.value}/10</td>
                            <td>{r.source}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                  <button
                    className="button secondary small-button"
                    onClick={() => {
                      setResult("assessment");
                      setConfirmed(false);
                    }}
                  >
                    <Plus size={15} />
                    Record an assessment
                  </button>
                </>
              )}
            </section>
            <section className="milestone-section">
              <div className="list-heading">
                <h2>
                  {goal.kind === "project"
                    ? "Your path to published."
                    : "One meaningful milestone at a time."}
                </h2>
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
                          ? goal.kind === "project" && goal.id === "portfolio"
                            ? "Published"
                            : "Verified"
                          : i === goal.milestones.findIndex((m) => !m.done)
                            ? "In progress"
                            : "Not started"}
                      </Tag>
                      <p>{m.criterion}</p>
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
            <Link
              className="learning-link"
              to={`/app/goals/${goal.id}/learning`}
            >
              <Asterisk size={23} />
              <div>
                <h3>
                  {goal.trial?.state === "Suggested"
                    ? "A change worth considering."
                    : "What are you learning?"}
                </h3>
                <p>
                  {goal.trial?.state === "Trying"
                    ? "You’re trying a different way to begin."
                    : "Make a little room for a new perspective."}
                </p>
              </div>
              <ArrowUpRight size={18} />
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
