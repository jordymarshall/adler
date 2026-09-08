import { useState, type FormEvent } from "react";
import { Check, Pencil } from "lucide-react";
import { Modal } from "./components";
import { currentProgram, reviseProgram, useStore } from "./store";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(program);
  const [tab, setTab] = useState("Program");
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
        (d) => reviseProgram(d, draft.version, { ...draft, reason: draft.reason.trim() || "You updated your coaching preferences." }),
        "Coaching program updated. Adler will use this version on the next turn.",
      )
    )
      setEditing(false);
  }
  return (
    <div className="program-page">
      <div className="page-heading">
        <div>
          <span className="section-kicker">
            YOUR TIME AND PREFERENCES
          </span>
          <h1>Time & coaching</h1>
          <p>
            Set when you have time and how often you want to look back.
            Each goal’s planning cycle adapts to your input.
          </p>
        </div>
        <button
          className="button primary"
          onClick={() => {
            setDraft(structuredClone(program));
            setEditing(true);
          }}
        >
          <Pencil size={16} /> Edit preferences
        </button>
      </div>
      <section className="panel coaching-preferences"><h2>Your available time</h2><dl className="reasoning-details"><div><dt>Across all goals</dt><dd>{program.weeklyMinutes} minutes per week</dd></div><div><dt>Preferred days and hours</dt><dd>{program.workDays.map(day => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day]).join(" · ")} · {program.workStart}–{program.workEnd}</dd></div><div><dt>Look back together</dt><dd>{program.reviewDay}. Each goal can have a different review rhythm.</dd></div></dl><p>These are planning preferences. Adler still checks your capacity and asks before booking time.</p></section>
      <details className="journey-disclosure"><summary>Methods, decisions & history</summary>
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
          onReview={(id) => navigate(`/app/check-in?prompt=${encodeURIComponent(`Let’s review this plan change (${id}). Here is what happened: `)}`)}
        />
      )}
      {tab === "Versions" && <ProgramVersions data={data} />}
      </details>
      {editing && (
        <Modal
          title="Edit time & coaching preferences"
          onClose={() => setEditing(false)}
        >
          <form className="program-form" onSubmit={save}>
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
            <details className="quiet-disclosure"><summary>Advanced coaching preferences</summary>
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
            </details>
            <label>
              Reason for this revision
              <input
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
                <Check size={15} /> Save preferences
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
