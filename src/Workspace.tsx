import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Asterisk,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  Leaf,
  Moon,
  Plus,
  Settings2,
  Sun,
  Trash2,
  Target,
} from "lucide-react";
import { createGoal } from "../shared/validation";
import { progressStatus } from "./progress";
import { EmptyState, GoalIcon, Modal, Tag } from "./components";
import {
  currentProgram,
  reviseProgram,
  formatDate,
  initialData,
  localDate,
  recordAction,
  resultLabel,
  useStore,
  type Action,
  type Goal,
  type GoalKind,
  type Outcome,
} from "./store";

export function RecordAction({
  action,
  onClose,
}: {
  action: Action;
  onClose: () => void;
}) {
  const { data, commit } = useStore();
  const [followup, setFollowup] = useState(false);
  const [note, setNote] = useState(action.note ?? "");
  const current = data.actions.find((a) => a.id === action.id)!;
  function select(outcome: Outcome) {
    if (
      commit(
        (d) => recordAction(d, action.id, outcome),
        `${outcome} saved. Your goal result is unchanged.`,
      )
    ) {
      if (outcome === "Done") onClose();
      else setFollowup(true);
    }
  }
  return (
    <Modal
      title={followup ? "Anything worth noting?" : "How did this action go?"}
      onClose={onClose}
    >
      <span className="section-kicker">
        {action.date
          ? formatDate(action.date, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })
          : "UNPLANNED ACTION"}{" "}
        · PLAN {action.planVersion}
      </span>
      <h3 className="modal-action-title">{action.title}</h3>
      <p className="criterion">
        <CheckCircle2 size={17} />
        <span>
          <b>Finished when</b>
          {action.criterion}
        </span>
      </p>
      {!followup ? (
        <>
          {action.date > localDate() && (
            <p className="form-notice">
              This action is scheduled for a future day. You can record it when
              that day arrives.
            </p>
          )}
          <p className="muted small-text">
            A check-in is a short update about this action. Your goal’s result
            is recorded separately.
          </p>
          <div className="outcome-buttons">
            {(["Done", "Partly", "Didn’t happen"] as Outcome[]).map((o, i) => (
              <button
                key={o}
                className={`outcome-option ${current.outcome === o ? "selected" : ""}`}
                disabled={action.date > localDate()}
                onClick={() => select(o)}
              >
                <span>
                  {i === 0 ? (
                    <Check size={22} />
                  ) : i === 1 ? (
                    <span className="half-circle" />
                  ) : (
                    "—"
                  )}
                </span>
                {o}
              </button>
            ))}
          </div>
          {action.outcome && (
            <>
              <button
                className="button text-button"
                onClick={() => setFollowup(true)}
              >
                Edit optional context
              </button>
              <button
                className="button text-button muted"
                onClick={() => {
                  if (
                    commit(
                      (d) => recordAction(d, action.id),
                      "Update cleared. This action is now unknown.",
                    )
                  )
                    onClose();
                }}
              >
                Clear this update
              </button>
            </>
          )}
        </>
      ) : (
        <>
          <Tag tone="sage">
            <Check size={13} /> {current.outcome} is already saved
          </Tag>
          <p className="muted">
            Add a little context if it’s useful. You can also skip this.
          </p>
          <div className="context-options">
            {[
              "Time got taken",
              "Unclear next step",
              "Too difficult",
              "Needed a resource or help",
              "Didn’t want to",
              "Something else",
            ].map((reason) => (
              <button
                key={reason}
                className={note === reason ? "selected" : ""}
                onClick={() => setNote(reason)}
              >
                {reason}
              </button>
            ))}
          </div>
          <label className="field-label" htmlFor="action-note">
            Your note <span>optional</span>
          </label>
          <textarea
            id="action-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What happened?"
            maxLength={2000}
            rows={3}
          />
          <div className="modal-actions">
            <button className="button text-button" onClick={onClose}>
              Skip
            </button>
            <button
              className="button primary"
              onClick={() => {
                if (
                  commit(
                    (d) => recordAction(d, action.id, current.outcome, note),
                    "Context saved.",
                  )
                )
                  onClose();
              }}
            >
              Save note <Check size={16} />
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

function ActionCard({
  action,
  goal,
  onRecord,
}: {
  action: Action;
  goal: Goal;
  onRecord: () => void;
}) {
  return (
    <article
      className={`action-card ${action.outcome ? "action-recorded" : ""}`}
    >
      <div className="action-card-header">
        <Link to={`/app/goals/${goal.id}/progress`}>
          <GoalIcon kind={goal.kind} small />
          {goal.title}
        </Link>
        {action.outcome ? (
          <Tag tone="sage">
            {action.outcome === "Done" && <Check size={12} />}
            {action.outcome}
          </Tag>
        ) : (
          <span className="action-menu-label">YOUR NEXT STEP</span>
        )}
      </div>
      <h3>{action.title}</h3>
      <div className="action-timing">
        <Clock3 size={15} />
        {action.timing}
      </div>
      <p className="action-criterion">
        <span>Finished when</span>
        {action.criterion}
      </p>
      <div className="action-card-actions">
        <button
          className={`button ${action.outcome ? "secondary" : "primary"} small-button`}
          onClick={onRecord}
        >
          {action.outcome ? "Edit update" : "Record what happened"}
          {!action.outcome && <ArrowRight size={15} />}
        </button>
        <Link to={`/app/coach?goal=${goal.id}`} className="help-start">
          <Asterisk size={17} /> Help me get started
        </Link>
      </div>
    </article>
  );
}
export function Today() {
  const { data } = useStore();
  const [recording, setRecording] = useState<Action | null>(null);
  const [earlier, setEarlier] = useState(false);
  const active = data.goals.filter((g) => g.status === "Active");
  const actions = data.actions.filter((a) =>
    active.some((g) => g.id === a.goalId),
  );
  const today = actions.filter((a) => a.date === localDate() && !a.outcome);
  const completed = data.actions.filter(
    (a) => a.date === localDate() && a.outcome,
  );
  const secondary = actions.filter(
    (a) => (!a.date || a.date > localDate()) && !a.outcome,
  );
  const previous = data.actions.filter((a) => a.date && a.date < localDate());
  const renderAction = (a: Action) => (
    <ActionCard
      key={a.id}
      action={a}
      goal={data.goals.find((g) => g.id === a.goalId)!}
      onRecord={() => setRecording(a)}
    />
  );
  const hour = new Date().getHours();
  return (
    <>
      <div className="page-heading today-heading">
        <div>
          <span className="section-kicker">
            {new Date()
              .toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })
              .toUpperCase()}
          </span>
          <h1>Your next actions, today.</h1>
          <p>
            Good {hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"}.
            Record today’s work, then check which goal results need attention.
          </p>
        </div>
        <Link className="button secondary" to="/app/goals/new">
          <Plus size={17} />
          New goal
        </Link>
      </div>
      <Link className="today-pace-banner" to="/app/goals">
        <Target size={18} />
        <div>
          <b>
            {
              data.goals.filter(
                (g) => progressStatus(g, localDate()).label === "Behind plan",
              ).length
            }{" "}
            goals behind their checkpoint
          </b>
          <span>
            {
              data.goals.filter(
                (g) => progressStatus(g, localDate()).label === "Update needed",
              ).length
            }{" "}
            need a result update · Compare actual results with the dated plan
          </span>
        </div>
        <ArrowRight size={17} />
      </Link>
      <div className="today-layout">
        <div className="today-main">
          <div className="list-heading">
            <h2>
              Your next steps <span>{today.length}</span>
            </h2>
            <span>Scheduled for today</span>
          </div>
          {today.length ? (
            today.map(renderAction)
          ) : (
            <EmptyState title="No actions scheduled today.">
              <p>
                You have no more unrecorded actions for today. Your goals are
                here whenever you’re ready.
              </p>
              <Link to="/app/goals" className="button secondary">
                See your goals <ArrowRight size={16} />
              </Link>
            </EmptyState>
          )}
          {completed.length > 0 && (
            <details className="completed-section">
              <summary>
                <CheckCircle2 size={17} />
                Recorded today <span>{completed.length}</span>
                <ChevronDown size={16} />
              </summary>
              <div>{completed.map(renderAction)}</div>
            </details>
          )}
          {!data.review.completedAt && (
            <Link className="review-banner" to="/app/reviews/weekly">
              <span className="review-icon">
                <CalendarDays size={24} />
              </span>
              <div>
                <span>A MOMENT TO LOOK BACK</span>
                <h3>Review this week’s results.</h3>
                <p>
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                  }) === data.reviewDay
                    ? "Your weekly review is ready."
                    : `Your review day is ${data.reviewDay}. You can start early.`}
                </p>
              </div>
              <ArrowUpRight size={23} />
            </Link>
          )}
          {secondary.length > 0 && (
            <section className="secondary-actions">
              <div className="list-heading">
                <h2>On the horizon</h2>
                <span>Upcoming & unscheduled</span>
              </div>
              {secondary.map((a) => (
                <div className="compact-action" key={a.id}>
                  <GoalIcon
                    kind={data.goals.find((g) => g.id === a.goalId)!.kind}
                    small
                  />
                  <div>
                    {a.date > localDate() ? (
                      <Link to={`/app/goals/${a.goalId}/plan`}>{a.title}</Link>
                    ) : (
                      <button onClick={() => setRecording(a)}>{a.title}</button>
                    )}
                    <span>
                      {a.date
                        ? formatDate(a.date, {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                          })
                        : "Unscheduled"}{" "}
                      · {data.goals.find((g) => g.id === a.goalId)!.title}
                    </span>
                  </div>
                  <ArrowUpRight size={17} />
                </div>
              ))}
            </section>
          )}
          {previous.length > 0 && (
            <div className="earlier-updates">
              <button
                onClick={() => setEarlier(!earlier)}
                aria-expanded={earlier}
              >
                <Clock3 size={15} />
                Earlier updates
                <ChevronDown size={15} />
              </button>
              {earlier &&
                previous.map((a) => (
                  <div key={a.id} className="history-row">
                    <span>{formatDate(a.date)}</span>
                    <button onClick={() => setRecording(a)}>{a.title}</button>
                    <Tag>{a.outcome ?? "Unknown"}</Tag>
                  </div>
                ))}
            </div>
          )}
        </div>
        <aside className="today-aside">
          <div className="goals-snapshot">
            <div className="list-heading">
              <h2>The bigger picture</h2>
              <Link to="/app/goals" aria-label="See all goals">
                <ArrowUpRight size={18} />
              </Link>
            </div>
            {active.map((goal) => (
              <Link
                className="snapshot-goal"
                key={goal.id}
                to={`/app/goals/${goal.id}/progress`}
              >
                <GoalIcon kind={goal.kind} small />
                <div>
                  <b>{goal.title}</b>
                  <span>{resultLabel(goal)}</span>
                  <div className="segmented-progress">
                    {goal.kind === "learning"
                      ? Array.from({ length: 10 }, (_, i) => (
                          <i
                            key={i}
                            className={
                              i < (goal.results.at(-1)?.value ?? 0)
                                ? "filled"
                                : ""
                            }
                          />
                        ))
                      : goal.milestones.map((m) => (
                          <i key={m.id} className={m.done ? "filled" : ""} />
                        ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <p className="sample-note">
            <Leaf size={14} />
            Your goals and records, saved together.
            <br />
            Changes sync across your connected channels.
          </p>
        </aside>
      </div>
      {recording && (
        <RecordAction action={recording} onClose={() => setRecording(null)} />
      )}
    </>
  );
}

const draftDefaults = {
  title: "",
  success: "",
  milestone: "",
  action: "",
  criterion: "",
  timing: "Unscheduled",
  kind: "project",
  why: "",
  area: "Career",
  tags: "",
  targetDate: localDate(28),
  assessmentTarget: "8",
  tracking: "milestones",
  measureLabel: "",
  measureUnit: "",
  measureTarget: "",
  measureBaseline: "",
};
export function NewGoal() {
  const { data, commit } = useStore();
  const navigate = useNavigate();
  const [draft, setDraft] = useState({ ...draftDefaults, ...data.goalDraft });
  const [review, setReview] = useState(false);
  function field(key: keyof typeof draft, value: string) {
    const next = { ...draft, [key]: value };
    setDraft(next);
    commit((d) => {
      d.goalDraft = next;
    });
  }
  function save(e: FormEvent) {
    e.preventDefault();
    const id = crypto.randomUUID();
    if (
      commit((d) => {
        createGoal(
          d,
          {
            title: draft.title.trim(),
            kind: draft.kind as GoalKind,
            why: draft.why.trim(),
            success: draft.success.trim(),
            area: draft.area as NonNullable<Goal["area"]>,
            tags: [
              ...new Set(
                draft.tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              ),
            ].slice(0, 8),
            targetDate: draft.targetDate,
            milestones: draft.milestone
              .split("\n")
              .filter((t) => t.trim())
              .map((title) => ({
                title: title.trim(),
                criterion: title.trim(),
              })),
            ...(draft.tracking === "measure"
              ? {
                  measure: {
                    label: draft.measureLabel.trim(),
                    unit: draft.measureUnit.trim(),
                    target: Number(draft.measureTarget),
                    baseline:
                      draft.measureBaseline === ""
                        ? null
                        : Number(draft.measureBaseline),
                  },
                }
              : {}),
            assessmentTarget: Number(draft.assessmentTarget),
            baseline: null,
            action: draft.action.trim(),
            criterion: draft.criterion.trim(),
            timing: draft.timing,
          },
          localDate(),
          id,
        );
        d.goalDraft = {};
      }, "Your goal and first plan are saved.")
    )
      navigate("/app/today");
  }
  const fields: {
    key: keyof typeof draft;
    label: string;
    placeholder: string;
    optional?: boolean;
    multiline?: boolean;
  }[] = [
    {
      key: "title",
      label: "What would you like to work toward?",
      placeholder: "e.g. Publish 3 portfolio case studies",
    },
    {
      key: "success",
      label: "What would a good result look like?",
      placeholder:
        "e.g. Three published case studies I can share in applications",
      multiline: true,
    },
    {
      key: "why",
      label: "Why does this matter to you?",
      placeholder: "e.g. Include these projects in design applications",
      optional: true,
    },
    {
      key: "milestone",
      label: "Your next milestone",
      placeholder:
        "e.g. First case study published\nSecond case study published\nThird case study published",
      multiline: true,
    },
    {
      key: "action",
      label: "One useful next action",
      placeholder: "e.g. Draft the problem statement",
    },
    {
      key: "criterion",
      label: "This action is finished when…",
      placeholder: "e.g. A rough explanation of the problem is on the page",
    },
  ];
  return (
    <div className="form-page">
      <Link to="/app/goals" className="back-link">
        <ArrowLeft size={15} />
        Your goals
      </Link>
      <div className="page-heading">
        <div>
          <span className="section-kicker">DEFINE A RESULT YOU CAN VERIFY</span>
          <h1>
            {review
              ? "Review the result and plan."
              : "Make your goal measurable."}
          </h1>
          <p>
            {review
              ? "Check the target, deadline, and first action before saving."
              : "Name the outcome, set a target date, and define what counts as finished."}
          </p>
        </div>
      </div>
      {!review ? (
        <>
          <div className="setup-choice">
            <div>
              <b>Prefer to work it out together?</b>
              <p>
                Adler asks about your result, timing, and constraints, then
                proposes a goal for you to review.
              </p>
            </div>
            <Link className="button secondary" to="/app/coach?goal=general">
              Plan my goal with Adler →
            </Link>
          </div>
          <form
            className="panel goal-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (fields.every((f) => f.optional || draft[f.key].trim()))
                setReview(true);
            }}
          >
            <span className="draft-saved">
              <Check size={13} /> Draft synced to your workspace
            </span>
            {fields.map((f) => (
              <div className="form-field" key={f.key}>
                <label htmlFor={f.key}>
                  {f.label}
                  {f.optional && <span> optional</span>}
                </label>
                {f.multiline ? (
                  <textarea
                    id={f.key}
                    placeholder={f.placeholder}
                    value={draft[f.key]}
                    required={!f.optional}
                    maxLength={1000}
                    rows={3}
                    onChange={(e) => field(f.key, e.target.value)}
                  />
                ) : (
                  <input
                    id={f.key}
                    placeholder={f.placeholder}
                    value={draft[f.key]}
                    required={!f.optional}
                    pattern={f.optional ? undefined : ".*\\S.*"}
                    maxLength={300}
                    onChange={(e) => field(f.key, e.target.value)}
                  />
                )}
              </div>
            ))}
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="goal-area">Area</label>
                <select
                  id="goal-area"
                  value={draft.area}
                  onChange={(e) => field("area", e.target.value)}
                >
                  {["Career", "Learning", "Personal"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="goal-deadline">Target date</label>
                <input
                  id="goal-deadline"
                  type="date"
                  min={localDate()}
                  required
                  value={draft.targetDate}
                  onChange={(e) => field("targetDate", e.target.value)}
                />
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="goal-tags">Tags, separated by commas</label>
              <input
                id="goal-tags"
                maxLength={160}
                value={draft.tags}
                placeholder="Portfolio, Writing"
                onChange={(e) => field("tags", e.target.value)}
              />
            </div>
            <p className="field-hint">
              Add one milestone per line above. Each should describe a result
              you can verify. You can add intermediate checkpoint dates from the
              progress screen.
            </p>
            <div className="form-field">
              <label htmlFor="goal-tracking">
                How will you measure progress?
              </label>
              <select
                id="goal-tracking"
                value={draft.tracking}
                onChange={(e) => field("tracking", e.target.value)}
              >
                <option value="milestones">
                  Verified milestones
                  {draft.kind === "learning" ? " / assessment score" : ""}
                </option>
                <option value="measure">
                  A measured result, such as distance or savings
                </option>
              </select>
            </div>
            {draft.tracking === "measure" && (
              <div className="goal-measure-fields">
                <div className="form-row">
                  <label className="form-field">
                    What you’re measuring
                    <input
                      required
                      maxLength={150}
                      value={draft.measureLabel}
                      placeholder="Longest run without stopping"
                      onChange={(e) => field("measureLabel", e.target.value)}
                    />
                  </label>
                  <label className="form-field">
                    Unit
                    <input
                      required
                      maxLength={50}
                      value={draft.measureUnit}
                      placeholder="km"
                      onChange={(e) => field("measureUnit", e.target.value)}
                    />
                  </label>
                </div>
                <div className="form-row">
                  <label className="form-field">
                    Target result
                    <input
                      type="number"
                      required
                      min="0.01"
                      max="1000000"
                      step="any"
                      value={draft.measureTarget}
                      onChange={(e) => field("measureTarget", e.target.value)}
                    />
                  </label>
                  <label className="form-field">
                    Current result, if known
                    <input
                      type="number"
                      min="0"
                      max="1000000"
                      step="any"
                      value={draft.measureBaseline}
                      onChange={(e) => field("measureBaseline", e.target.value)}
                    />
                  </label>
                </div>
                <p className="field-hint">
                  Use a result that increases toward your target, such as
                  distance run or money saved. Completing an action won’t change
                  this number automatically.
                </p>
              </div>
            )}
            {draft.kind === "learning" && draft.tracking !== "measure" && (
              <div className="form-field">
                <label htmlFor="assessment-target">
                  Target correct answers out of 10
                </label>
                <input
                  id="assessment-target"
                  type="number"
                  required
                  min="1"
                  max="10"
                  step="1"
                  value={draft.assessmentTarget}
                  onChange={(e) => field("assessmentTarget", e.target.value)}
                />
              </div>
            )}
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="goal-kind">Kind of goal</label>
                <select
                  id="goal-kind"
                  value={draft.kind}
                  onChange={(e) => field("kind", e.target.value)}
                >
                  <option value="project">A creative or career project</option>
                  <option value="learning">Learning something</option>
                  <option value="practical">A practical life change</option>
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="goal-timing">When does the action fit?</label>
                <select
                  id="goal-timing"
                  value={draft.timing}
                  onChange={(e) => field("timing", e.target.value)}
                >
                  <option>Unscheduled</option>
                  <option>Today</option>
                  <option>Tomorrow</option>
                </select>
              </div>
            </div>
            {draft.kind === "learning" && draft.tracking !== "measure" && (
              <p className="form-notice">
                Learning results use comparable course problems solved
                correctly, out of 10. Choose a measured result above if another
                measure fits your goal better.
              </p>
            )}
            <div className="modal-actions">
              <Link className="button text-button" to="/app/goals">
                Save draft for later
              </Link>
              <button className="button primary" type="submit">
                Review my plan <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </>
      ) : (
        <form className="panel plan-summary" onSubmit={save}>
          <GoalIcon kind={draft.kind as GoalKind} />
          {fields
            .filter((f) => !f.optional || draft[f.key])
            .map((f) => (
              <div key={f.key}>
                <span>{f.label}</span>
                <p>{draft[f.key]}</p>
              </div>
            ))}
          <div>
            <span>Target date & organization</span>
            <p>
              {draft.targetDate} · {draft.area}
              {draft.tags ? ` · ${draft.tags}` : ""}
            </p>
          </div>
          <div>
            <span>When</span>
            <p>{draft.timing}</p>
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => setReview(false)}
            >
              Edit
            </button>
            <button type="submit" className="button primary">
              Use this plan <Check size={17} />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export function WeeklyReview() {
  const { data, commit } = useStore();
  const review = data.review;
  const [note, setNote] = useState(review.note);
  const navigate = useNavigate();
  const actions = data.actions.filter(
    (a) => !a.unplanned && a.date >= localDate(-6) && a.date <= localDate(),
  );
  function advance(step: number) {
    commit((d) => {
      d.review.step = step;
      d.review.note = note;
    });
  }
  return (
    <div className="form-page">
      <Link to="/app/today" className="back-link">
        <ArrowLeft size={15} />
        Back to Today
      </Link>
      <div className="page-heading">
        <div>
          <span className="section-kicker">
            {formatDate(localDate(-6))} — {formatDate(localDate())}
          </span>
          <h1>Your weekly review</h1>
          <p>
            Compare results with your plan, identify what helped or blocked
            progress, and choose next week’s change.
          </p>
        </div>
      </div>
      {review.completedAt ? (
        <div className="panel review-complete">
          <CheckCircle2 size={35} />
          <h2>Your review is saved.</h2>
          <p>{review.note || "You took a moment to review your week."}</p>
          <Tag tone="sage">{review.decision}</Tag>
          <p className="muted small-text">
            Saved {new Date(review.completedAt).toLocaleDateString()}
          </p>
          <Link className="button primary" to="/app/today">
            Back to Today <ArrowRight size={17} />
          </Link>
          <button
            className="button text-button"
            onClick={() =>
              commit((d) => {
                d.review = { step: 0, note: "", decision: "" };
              })
            }
          >
            Start another review
          </button>
        </div>
      ) : (
        <>
          <div className="review-steps">
            {["See the record", "Understand it", "Choose the next plan"].map(
              (s, i) => (
                <span className={review.step === i ? "active" : ""} key={s}>
                  <b>{i + 1}</b>
                  {s}
                </span>
              ),
            )}
          </div>
          <div className="panel review-panel">
            {review.step === 0 ? (
              <>
                <h2>Here’s what you recorded.</h2>
                {data.goals
                  .filter((g) => g.status === "Active")
                  .map((g) => (
                    <div className="review-goal" key={g.id}>
                      <GoalIcon kind={g.kind} small />
                      <div>
                        <b>{g.title}</b>
                        <p>{resultLabel(g)}</p>
                      </div>
                    </div>
                  ))}
                <div className="review-counts">
                  {(
                    ["Done", "Partly", "Didn’t happen", "Unknown"] as const
                  ).map((o) => (
                    <div key={o}>
                      <strong>
                        {
                          actions.filter((a) => (a.outcome ?? "Unknown") === o)
                            .length
                        }
                      </strong>
                      <span>{o}</span>
                    </div>
                  ))}
                </div>
                <p className="muted small-text">
                  {actions.filter((a) => a.outcome).length} of {actions.length}{" "}
                  scheduled actions have updates. Unknown actions have no
                  recorded outcome.
                </p>
                <button className="button primary" onClick={() => advance(1)}>
                  Take a closer look <ArrowRight size={16} />
                </button>
              </>
            ) : review.step === 1 ? (
              <>
                <h2>What feels worth paying attention to?</h2>
                <p className="muted">
                  A small success, a roadblock, or something that changed. You
                  don’t need to find a lesson in everything.
                </p>
                <label className="field-label" htmlFor="review-note">
                  Your perspective <span>optional</span>
                </label>
                <textarea
                  id="review-note"
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value);
                    commit((d) => {
                      d.review.note = e.target.value;
                    });
                  }}
                  rows={5}
                  maxLength={2000}
                  placeholder="This week, I noticed…"
                />
                <div className="modal-actions">
                  <button
                    className="button text-button"
                    onClick={() => advance(0)}
                  >
                    Back
                  </button>
                  <button className="button primary" onClick={() => advance(2)}>
                    Choose what’s next <ArrowRight size={16} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>What would you like to do next?</h2>
                <p className="muted">
                  Reflecting doesn’t change a plan by itself. Choose the next
                  move that fits.
                </p>
                <button
                  className="review-choice"
                  onClick={() =>
                    commit((d) => {
                      d.review = {
                        ...d.review,
                        note,
                        decision: "Keep the current plans",
                        completedAt: new Date().toISOString(),
                      };
                      d.reviews.push({ ...d.review });
                    }, "Review saved. Your plans stay as they are.")
                  }
                >
                  <CheckCircle2 size={22} />
                  <span>
                    <b>Keep my current plans</b>
                    <small>The approach still feels workable.</small>
                  </span>
                  <ArrowRight size={18} />
                </button>
                <Link className="review-choice" to="/app/goals">
                  <Settings2 size={22} />
                  <span>
                    <b>Make a specific adjustment</b>
                    <small>
                      Open a goal to edit, pause, or finish it. Your review
                      draft stays saved.
                    </small>
                  </span>
                  <ArrowRight size={18} />
                </Link>
                <Link className="review-choice" to="/app/coach">
                  <Asterisk size={22} />
                  <span>
                    <b>Think it through with the coach</b>
                    <small>Explore what might make the next step easier.</small>
                  </span>
                  <ArrowRight size={18} />
                </Link>
                <button
                  className="button text-button"
                  onClick={() => advance(1)}
                >
                  Back
                </button>
              </>
            )}
          </div>
          <button
            className="button text-button muted"
            onClick={() => {
              if (
                commit((d) => {
                  d.review = {
                    ...d.review,
                    decision: "Skipped — plans unchanged",
                    completedAt: new Date().toISOString(),
                  };
                  d.reviews.push({ ...d.review });
                }, "Review skipped. Your plans are unchanged.")
              )
                navigate("/app/today");
            }}
          >
            Skip this review
          </button>
        </>
      )}
      {data.reviews.length > 0 && (
        <details className="panel review-history">
          <summary>Previous reviews · {data.reviews.length}</summary>
          {[...data.reviews].reverse().map((r, i) => (
            <article key={`${r.completedAt}-${i}`}>
              <b>
                {r.completedAt
                  ? new Date(r.completedAt).toLocaleDateString()
                  : "Review"}
              </b>
              <p>{r.note || "No note recorded."}</p>
              <span className="field-hint">{r.decision}</span>
            </article>
          ))}
        </details>
      )}
    </div>
  );
}

export function SettingsPage() {
  const { data, commit, logout } = useStore();
  const [reset, setReset] = useState(false);
  function exportData() {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            {
              exportedAt: new Date().toISOString(),
              description:
                "Adler workspace. Goal results, action records, plan versions, conversations, confirmed memory, review, and preferences.",
              ...data,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `adler-workspace-${localDate()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="settings-page">
      <div className="page-heading">
        <div>
          <span className="section-kicker">MAKE YOURSELF AT HOME</span>
          <h1>Your space, your way.</h1>
          <p>A few preferences to help Adler fit your life.</p>
        </div>
      </div>
      <section className="panel settings-section">
        <h2>Your preferences</h2>
        <div className="settings-row">
          <div>
            <h3>Appearance</h3>
            <p>A comfortable place to think.</p>
          </div>
          <div className="theme-switch">
            <button
              className={data.theme === "light" ? "active" : ""}
              onClick={() =>
                commit((d) => {
                  d.theme = "light";
                })
              }
              aria-pressed={data.theme === "light"}
            >
              <Sun size={16} />
              Light
            </button>
            <button
              className={data.theme === "dark" ? "active" : ""}
              onClick={() =>
                commit((d) => {
                  d.theme = "dark";
                })
              }
              aria-pressed={data.theme === "dark"}
            >
              <Moon size={16} />
              Dark
            </button>
          </div>
        </div>
        <div className="settings-row">
          <div>
            <label htmlFor="review-day">Weekly review day</label>
            <p>An invitation to pause and take stock.</p>
          </div>
          <select
            id="review-day"
            value={data.reviewDay}
            onChange={(e) =>
              commit((d) => {
                reviseProgram(d, currentProgram(d).version, {
                  reviewDay: e.target.value,
                  reason: "Changed weekly review day in Settings.",
                });
              }, "Review day updated.")
            }
          >
            {[
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ].map((day) => (
              <option key={day}>{day}</option>
            ))}
          </select>
        </div>
        <div className="settings-row">
          <div>
            <h3>Timezone</h3>
            <p>Scheduled check-ins follow your saved timezone.</p>
          </div>
          <span className="small-text">{data.timeZone}</span>
        </div>
        <div className="settings-row">
          <div>
            <h3>Email reminders</h3>
            <p>Email delivery is not connected in this preview.</p>
          </div>
          <Tag>Not enabled</Tag>
        </div>
      </section>
      <section className="panel settings-section">
        <h2>Your information</h2>
        <div className="settings-row">
          <div>
            <h3>AI provider</h3>
            <p>Choose Gemini, GPT, or Claude and connect your API account.</p>
          </div>
          <Link
            className="button secondary small-button"
            to="/app/settings/provider"
          >
            AI provider →
          </Link>
        </div>
        <div className="settings-row">
          <div>
            <h3>Phone, MCP & automations</h3>
            <p>Text Adler, connect a chat client, and schedule check-ins.</p>
          </div>
          <Link className="button secondary small-button" to="/app/connections">
            Connections →
          </Link>
        </div>
        <div className="settings-row">
          <div>
            <h3>Your account</h3>
            <p>Use this account to sign in on another device.</p>
          </div>
          <button
            className="button secondary small-button"
            onClick={() => void logout()}
          >
            Sign out
          </button>
        </div>
        <div className="settings-row">
          <div>
            <h3>AI coaching</h3>
            <p>Automatically available with your connected AI provider.</p>
          </div>
          <Link
            className="button secondary small-button"
            to="/app/settings/provider"
          >
            AI provider <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="settings-row">
          <div>
            <h3>Calendar connections</h3>
            <p>
              Connect accounts, check availability, and approve time blocks.
            </p>
          </div>
          <Link className="button secondary small-button" to="/app/calendar">
            Manage calendars <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="settings-row">
          <div>
            <h3>What Adler remembers</h3>
            <p>Inspect, edit, and remove the context you’ve confirmed.</p>
          </div>
          <Link
            className="button secondary small-button"
            to="/app/coach/about-you"
          >
            About you <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="settings-row">
          <div>
            <h3>Export your workspace</h3>
            <p>
              Download goals, plans, results, history, and conversations as
              JSON.
            </p>
          </div>
          <button
            className="button secondary small-button"
            onClick={exportData}
          >
            <Download size={16} />
            Export data
          </button>
        </div>
        <div className="settings-row">
          <div>
            <h3>Clear goals and conversation</h3>
            <p>Start with an empty workspace. Export a copy first.</p>
          </div>
          <button
            className="button danger-text small-button"
            onClick={() => setReset(true)}
          >
            <Trash2 size={16} />
            Delete data
          </button>
        </div>
      </section>
      <p className="settings-disclosure">
        <Leaf size={17} />
        Your records are saved on this Adler server and synced across connected
        channels. Coaching uses your chosen AI provider.{" "}
        <Link to="/privacy">
          Privacy details <ArrowUpRight size={12} />
        </Link>
      </p>
      {reset && (
        <Modal title="Start with a clean page?" onClose={() => setReset(false)}>
          <p>
            This deletes the goals, action history, conversations, memory,
            drafts, and preferences in your workspace. Export first if you’d
            like to keep a copy. Calendar connections, existing events, and the
            server booking journal are separate and will remain.
          </p>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setReset(false)}
            >
              Keep my data
            </button>
            <button
              className="button danger"
              onClick={() => {
                if (
                  commit((d) => {
                    Object.assign(d, initialData());
                  }, "Workspace cleared. You can start with a new goal.")
                ) {
                  Object.keys(sessionStorage)
                    .filter((key) => key.startsWith("adler-coach-draft-"))
                    .forEach((key) => sessionStorage.removeItem(key));
                  setReset(false);
                }
              }}
            >
              Delete and reset
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
