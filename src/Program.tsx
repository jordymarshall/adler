import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Pencil,
  Target,
} from "lucide-react";
import { Modal } from "./components";
import { AdlerAvatar } from "./persona";
import { currentProgram, localDate, reviseProgram, useStore } from "./store";
import { METHODS } from "./methods";
import { coachingContext } from "./coach-context";

export function Program() {
  const { data, commit } = useStore();
  const program = currentProgram(data);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(program);
  const [tab, setTab] = useState("Program");
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewChoice, setReviewChoice] = useState<"Keep" | "Revisit">("Keep");
  const [selected, setSelected] = useState(program.focusGoalId);
  const context = coachingContext(data, selected, "", localDate());
  function save(e: FormEvent) {
    e.preventDefault();
    if (
      !draft.workDays.length ||
      draft.workEnd <= draft.workStart ||
      draft.sprintEnd < draft.sprintStart
    )
      return;
    if (
      commit(
        (d) => reviseProgram(d, draft.version, draft),
        "Coaching program updated. Adler will use this version on the next turn.",
      )
    )
      setEditing(false);
  }
  return (
    <div className="program-page">
      <Link className="back-link" to="/app/coach">
        <ArrowLeft size={15} /> Back to Adler
      </Link>
      <div className="page-heading">
        <div>
          <span className="section-kicker">
            THE PLAN BEHIND THE CONVERSATION
          </span>
          <h1>Your coaching program.</h1>
          <p>
            Edit what Adler works toward, what it uses, and how it reviews
            progress.
          </p>
        </div>
        <button
          className="button primary"
          onClick={() => {
            setDraft(structuredClone(program));
            setEditing(true);
          }}
        >
          <Pencil size={16} /> Edit program
        </button>
      </div>
      <div className="program-banner">
        <AdlerAvatar />
        <div>
          <b>Adler · Program v{program.version}</b>
          <p>
            Direct, curious, and practical. I’ll use your records, ask about
            gaps, and help you choose one change at a time.
          </p>
        </div>
        <span className="pace-badge positive">You approve changes</span>
      </div>
      <div className="filter-tabs">
        {["Program", "Context & checks", "Decisions & versions"].map((v) => (
          <button
            key={v}
            aria-pressed={tab === v}
            className={tab === v ? "active" : ""}
            onClick={() => setTab(v)}
          >
            {v}
          </button>
        ))}
      </div>
      {tab === "Program" && (
        <>
          <div className="program-grid">
            <section className="panel program-focus">
              <span className="section-kicker">
                <Target size={15} /> 01 · DIRECTION
              </span>
              <h2>
                {data.goals.find((g) => g.id === program.focusGoalId)?.title ??
                  "Choose a focus goal"}
              </h2>
              <p>
                Current focus across{" "}
                {data.goals.filter((g) => g.status === "Active").length} active
                goals.
              </p>
              <Link className="text-link" to="/app/goals">
                See the bigger picture <ArrowRight size={14} />
              </Link>
            </section>
            <section className="panel">
              <span className="section-kicker">02 · THIS SPRINT</span>
              <h3>{program.sprintResult}</h3>
              <p>
                {program.sprintStart} → {program.sprintEnd}
              </p>
              <p className="small-text">Approach: {program.approach}</p>
            </section>
            <section className="panel">
              <span className="section-kicker">
                <Clock3 size={15} /> 03 · CAPACITY
              </span>
              <h2>
                {program.weeklyMinutes} <small>minutes / week</small>
              </h2>
              <p>
                {program.sessionMinutes}-minute sessions · {program.workStart}–
                {program.workEnd}
              </p>
              <Link className="text-link" to="/app/calendar">
                Find time in Calendar <ArrowRight size={14} />
              </Link>
            </section>
            <section className="panel">
              <span className="section-kicker">
                <CalendarDays size={15} /> 04 · REVIEW
              </span>
              <h2>Every {program.reviewDay}</h2>
              <p>
                Compare results with checkpoints. Keep, change, pause, or finish
                the plan.
              </p>
              <Link className="text-link" to="/app/reviews/current">
                Open your review <ArrowRight size={14} />
              </Link>
            </section>
          </div>
          <div className="method-heading">
            <div>
              <span className="section-kicker">05 · THE COACHING METHODS</span>
              <h2>A specific job for each method.</h2>
              <p>
                Adler checks which enabled methods fit your goal and the
                obstacle you reported.
              </p>
            </div>
          </div>
          <div className="method-grid">
            {METHODS.map((m, i) => (
              <article
                className={`panel method-card ${program.enabledMethods.includes(m.id) ? "" : "method-disabled"}`}
                key={m.id}
              >
                <div className="method-card-top">
                  <span>0{i + 1}</span>
                  <span className="pace-badge neutral">
                    {program.enabledMethods.includes(m.id)
                      ? "Enabled"
                      : "Disabled"}
                  </span>
                </div>
                <h3>{m.name}</h3>
                <p>{m.question}</p>
                <div className="method-action">{m.action}</div>
                <details>
                  <summary>
                    Example & research <ChevronRight size={14} />
                  </summary>
                  <p>{m.example}</p>
                  <a href={m.url} target="_blank" rel="noreferrer">
                    {m.evidence} · {m.source}
                  </a>
                  <p className="field-hint">{m.limit}</p>
                </details>
              </article>
            ))}
          </div>
        </>
      )}
      {tab === "Context & checks" && (
        <>
          <div className="panel program-context-heading">
            <div>
              <h2>What Adler will use next</h2>
              <p>
                This is the current input snapshot. Each response saves the
                snapshot’s checks with its program and plan version.
              </p>
            </div>
            <select
              aria-label="Inspect context for goal"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {data.goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>
          <div className="check-pipeline">
            {context.checks.map((check, i) => (
              <article className="panel" key={check.id}>
                <span className="pipeline-number">{i + 1}</span>
                <div>
                  <h3>{check.label}</h3>
                  <p>{check.finding}</p>
                  <small>{check.sources.length} source records</small>
                </div>
              </article>
            ))}
          </div>
          <Link className="button secondary" to="/app/coach/about-you">
            Edit confirmed personal context <ArrowRight size={15} />
          </Link>
          <details className="panel architecture-note">
            <summary>How the agent is implemented</summary>
            <p>
              Adler uses the Anthropic API through a small application-owned
              harness. Each turn assembles your current program, goals, action
              and result records, confirmed context, and recent conversation. It
              applies a structured coaching instruction and requires a validated
              response.
            </p>
            <p>
              Accepted proposals create a new plan and program version. Calendar
              reads and approved bookings run through separate server tools.
              Program changes update saved instructions and context; they do not
              retrain the underlying model. This version does not use ADK and
              does not run background coaching when the app is closed.
            </p>
            <p>
              The checks and explanations are an inspectable decision record.
              They are not the model’s private reasoning transcript.
            </p>
          </details>
        </>
      )}
      {tab === "Decisions & versions" && (
        <div className="program-history">
          <h2>Proposals and what you chose</h2>
          {data.decisions.length ? (
            [...data.decisions].reverse().map((d) => (
              <article className="panel" key={d.id}>
                <span className="pace-badge neutral">
                  {d.status} · Program v{d.programVersion}
                </span>
                <h3>{d.proposal?.title ?? "Coaching review"}</h3>
                <p>{d.summary}</p>
                {d.proposal && (
                  <p>
                    <b>Review after:</b> {d.proposal.reviewAfter}
                  </p>
                )}
                <details>
                  <summary>Inputs checked & methods used</summary>
                  {d.checks.map((c) => (
                    <p key={c.id}>
                      <b>{c.label}:</b> {c.finding}
                    </p>
                  ))}
                  <p>
                    {d.methods
                      .map((id) => METHODS.find((m) => m.id === id)?.name)
                      .join(" · ")}
                  </p>
                </details>
                {d.status === "Accepted" && (
                  <button
                    className="button secondary"
                    onClick={() => {
                      setReviewing(d.id);
                      setReviewNote("");
                      setReviewChoice("Keep");
                    }}
                  >
                    Review this change
                  </button>
                )}
                {d.review && (
                  <div className="method-action">
                    <b>
                      {d.review.choice === "Keep"
                        ? "Keep the approach"
                        : "Revisit with Adler"}{" "}
                      · {d.review.date}
                    </b>
                    <p>{d.review.note}</p>
                  </div>
                )}
                <Link className="text-link" to={`/app/coach?goal=${d.goalId}`}>
                  Open conversation <ArrowRight size={14} />
                </Link>
              </article>
            ))
          ) : (
            <div className="panel">
              <h3>No decisions saved yet.</h3>
              <p>
                Ask Adler to review a goal. Its explanation and any proposed
                change will appear here.
              </p>
            </div>
          )}
          <h2>Program versions</h2>
          {[...data.programs].reverse().map((p) => (
            <article className="panel version-record" key={p.version}>
              <span>v{p.version}</span>
              <div>
                <b>
                  {p.date} · {p.reason}
                </b>
                <p>{p.sprintResult}</p>
                <details>
                  <summary>Saved settings</summary>
                  <p>
                    {p.weeklyMinutes} minutes/week · {p.sessionMinutes}-minute
                    blocks · {p.workStart}–{p.workEnd}
                  </p>
                  <p>{p.approach}</p>
                  <p>{p.enabledMethods.join(", ")}</p>
                </details>
              </div>
            </article>
          ))}
        </div>
      )}
      {reviewing && (
        <Modal
          title="What happened when you tried it?"
          onClose={() => setReviewing(null)}
        >
          <form
            className="program-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (
                commit((d) => {
                  const decision = d.decisions.find((c) => c.id === reviewing)!;
                  if (decision.status !== "Accepted")
                    throw new Error("This change has already been reviewed.");
                  decision.review = {
                    date: localDate(),
                    note: reviewNote.trim(),
                    choice: reviewChoice,
                  };
                  decision.status = "Reviewed";
                }, "Review saved. Adler will use this feedback in the next conversation.")
              )
                setReviewing(null);
            }}
          >
            <p>
              {
                data.decisions.find((d) => d.id === reviewing)?.proposal
                  ?.reviewAfter
              }
            </p>
            <label>
              What did you observe?
              <textarea
                required
                maxLength={1000}
                rows={4}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="e.g. Both sessions produced a complete rough draft. The second draft is ready for feedback."
              />
            </label>
            <label>
              What do you want to do next?
              <select
                value={reviewChoice}
                onChange={(e) =>
                  setReviewChoice(e.target.value as "Keep" | "Revisit")
                }
              >
                <option value="Keep">Keep the current approach</option>
                <option value="Revisit">Revisit the approach with Adler</option>
              </select>
            </label>
            <p className="field-hint">
              This saves your evaluation. Open the conversation to propose
              another plan change.
            </p>
            <button className="button primary" disabled={!reviewNote.trim()}>
              Save review <Check size={15} />
            </button>
          </form>
        </Modal>
      )}
      {editing && (
        <Modal
          title="Edit your coaching program"
          onClose={() => setEditing(false)}
        >
          <form className="program-form" onSubmit={save}>
            <label>
              Focus goal
              <select
                value={draft.focusGoalId}
                onChange={(e) =>
                  setDraft({ ...draft, focusGoalId: e.target.value })
                }
              >
                {data.goals
                  .filter((g) => g.status === "Active")
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Sprint result
              <input
                required
                maxLength={300}
                value={draft.sprintResult}
                onChange={(e) =>
                  setDraft({ ...draft, sprintResult: e.target.value })
                }
              />
            </label>
            <div className="form-row">
              <label>
                Sprint start
                <input
                  type="date"
                  required
                  value={draft.sprintStart}
                  onChange={(e) =>
                    setDraft({ ...draft, sprintStart: e.target.value })
                  }
                />
              </label>
              <label>
                Sprint end
                <input
                  type="date"
                  required
                  min={draft.sprintStart}
                  value={draft.sprintEnd}
                  onChange={(e) =>
                    setDraft({ ...draft, sprintEnd: e.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                Minutes per week
                <input
                  type="number"
                  min="15"
                  max="2400"
                  step="5"
                  required
                  value={draft.weeklyMinutes}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      weeklyMinutes: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                Session length
                <select
                  value={draft.sessionMinutes}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      sessionMinutes: Number(e.target.value),
                    })
                  }
                >
                  {[15, 25, 30, 45, 60, 90].map((v) => (
                    <option key={v} value={v}>
                      {v} minutes
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-row">
              <label>
                Work window starts
                <input
                  type="time"
                  required
                  value={draft.workStart}
                  onChange={(e) =>
                    setDraft({ ...draft, workStart: e.target.value })
                  }
                />
              </label>
              <label>
                Work window ends
                <input
                  type="time"
                  required
                  min={draft.workStart}
                  value={draft.workEnd}
                  onChange={(e) =>
                    setDraft({ ...draft, workEnd: e.target.value })
                  }
                />
              </label>
            </div>
            <fieldset className="day-picker">
              <legend>Days available</legend>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((v, i) => (
                <label key={v}>
                  <input
                    type="checkbox"
                    checked={draft.workDays.includes(i)}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        workDays: e.target.checked
                          ? [...draft.workDays, i]
                          : draft.workDays.filter((d) => d !== i),
                      })
                    }
                  />
                  {v}
                </label>
              ))}
            </fieldset>
            <label>
              Weekly review day
              <select
                value={draft.reviewDay}
                onChange={(e) =>
                  setDraft({ ...draft, reviewDay: e.target.value })
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
                ].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label>
              Current approach
              <textarea
                required
                maxLength={800}
                rows={3}
                value={draft.approach}
                onChange={(e) =>
                  setDraft({ ...draft, approach: e.target.value })
                }
              />
            </label>
            <fieldset className="method-toggles">
              <legend>Methods Adler may use</legend>
              {METHODS.map((m) => (
                <label key={m.id}>
                  <input
                    type="checkbox"
                    checked={draft.enabledMethods.includes(m.id)}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        enabledMethods: e.target.checked
                          ? [...draft.enabledMethods, m.id]
                          : draft.enabledMethods.filter((id) => id !== m.id),
                      })
                    }
                  />
                  {m.name}
                </label>
              ))}
            </fieldset>
            <label>
              Reason for this revision
              <input
                required
                maxLength={300}
                value={draft.reason === program.reason ? "" : draft.reason}
                onChange={(e) => setDraft({ ...draft, reason: e.target.value })}
              />
            </label>
            <div className="modal-actions">
              <button
                className="button primary"
                disabled={
                  !draft.workDays.length || draft.workEnd <= draft.workStart
                }
              >
                <Check size={15} /> Save program v{draft.version + 1}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
