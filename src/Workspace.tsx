import { addDays, dateInZone } from "../shared/journey";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Download,
  Leaf,
  Moon,
  Sun,
  Trash2,
} from "lucide-react";
import { createGoal } from "../shared/validation";
import { GoalIcon, Modal } from "./components";
import {
  currentProgram,
  reviseProgram,
  initialData,
  localDate,
  useStore,
  type Goal,
  type GoalKind,
} from "./store";


const draftDefaults = {
  title: "",
  success: "",
  milestone: "",
  action: "",
  criterion: "",
  timing: "Unscheduled",
  kind: "project",
  why: "",
  area: "Unassigned",
  tags: "",
  targetDate: "",
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
            status: "Draft",
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
            ...(draft.timing === "Today"
              ? { actionDate: dateInZone(d.timeZone) }
              : draft.timing === "Tomorrow"
                ? { actionDate: addDays(dateInZone(d.timeZone), 1) }
                : {}),
          },
          localDate(),
          id,
        );
        d.goalDraft = {};
      }, "Your goal and first plan are saved.")
    )
      navigate(`/app/goals/${id}`);
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
            <Link className="button secondary" to="/app/check-in?goal=general">
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
                <label htmlFor="goal-area">
                  Area <span>optional</span>
                </label>
                <p className="field-hint">
                  A broad grouping for your goals. You can change it later.
                </p>
                <select
                  id="goal-area"
                  value={draft.area}
                  onChange={(e) => field("area", e.target.value)}
                >
                  {["Unassigned", "Career", "Learning", "Personal"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="goal-deadline">Target date (optional)</label>
                <input
                  id="goal-deadline"
                  type="date"
                  min={localDate()}
                  value={draft.targetDate}
                  onChange={(e) => field("targetDate", e.target.value)}
                />
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="goal-tags">
                Tags, separated by commas <span>optional</span>
              </label>
              <p className="field-hint">
                Create your own labels by typing them here.
              </p>
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
              {draft.targetDate || "No fixed deadline"} · {draft.area}
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
              Save plan <Check size={17} />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export { WeeklyReview } from "./WeeklyReview";

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
        <div className="settings-row"><div><h3>Time & coaching</h3><p>Your available time, preferred hours, review rhythm, and coaching methods.</p></div><Link className="text-link" to="/app/settings/coaching">Manage →</Link></div>
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
            <p>Choose when to review progress and plan the next week.</p>
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
      </section>
      <section className="panel settings-section">
        <h2>Your information</h2>
        <div className="settings-row">
          <div>
            <h3>Integrations</h3>
            <p>Connect your calendar, phone, and AI provider.</p>
          </div>
          <Link
            className="button secondary small-button"
            to="/app/integrations"
          >
            Manage integrations →
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
            <h3>What Adler remembers</h3>
            <p>Inspect, edit, and remove the context you’ve confirmed.</p>
          </div>
          <Link
            className="button secondary small-button"
            to="/app/insights"
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
