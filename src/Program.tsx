import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Pencil } from "lucide-react";
import { Modal } from "./components";
import { currentProgram, localDate, reviseProgram, useStore } from "./store";
import { METHODS } from "./methods";
import {
  ProgramContext,
  ProgramDecisions,
  ProgramOverview,
  ProgramVersions,
} from "./ProgramViews";

export function Program() {
  const { data, commit } = useStore();
  const program = currentProgram(data);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(program);
  const [tab, setTab] = useState("Program");
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewChoice, setReviewChoice] = useState<"Keep" | "Revisit">("Keep");
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
            Set your sprint, make time for the work, and see how Adler uses your
            records to guide the next step.
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
      <div className="program-status-strip">
        <span>
          <i /> Program v{program.version}
        </span>
        <span>
          {data.goals.filter((g) => g.status === "Active").length} active{" "}
          {data.goals.filter((g) => g.status === "Active").length === 1
            ? "goal"
            : "goals"}
        </span>
        <span>{program.enabledMethods.length} methods available</span>
        <button onClick={() => setTab("Versions")}>
          View revision history
        </button>
      </div>
      <nav className="program-navigation" aria-label="Coaching program views">
        {["Program", "Context & checks", "Decisions", "Versions"].map((v) => (
          <button key={v} aria-pressed={tab === v} onClick={() => setTab(v)}>
            {v}
            {v === "Decisions" && <span>{data.decisions.length}</span>}
          </button>
        ))}
      </nav>
      {tab === "Program" && (
        <ProgramOverview
          data={data}
          onEdit={() => {
            setDraft(structuredClone(program));
            setEditing(true);
          }}
        />
      )}
      {tab === "Context & checks" && <ProgramContext data={data} />}
      {tab === "Decisions" && (
        <ProgramDecisions
          data={data}
          onReview={(id) => {
            setReviewing(id);
            setReviewNote("");
            setReviewChoice("Keep");
          }}
        />
      )}
      {tab === "Versions" && <ProgramVersions data={data} />}
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
                <option value="">Choose a focus goal</option>
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
