import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  Clock3,
  Pencil,
} from "lucide-react";
import {
  currentPlan,
  currentProgram,
  formatDate,
  localDate,
  type Data,
} from "./store";
import type { ProgramVersion } from "./program-types";
import { coachingContext } from "./coach-context";
import { METHODS } from "./methods";
import { PlanTimeline, programTimeline } from "./PlanTimeline";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function MethodSource({ id }: { id: string }) {
  const method = METHODS.find((m) => m.id === id);
  return method ? (
    <a
      className="program-source"
      href={method.url}
      target="_blank"
      rel="noreferrer"
    >
      {method.name} · {method.source} <ArrowUpRight size={12} />
    </a>
  ) : null;
}
function Sources({ data, ids }: { data: Data; ids: string[] }) {
  return (
    <ul className="context-sources">
      {ids.map((id) => {
        const method = METHODS.find((m) => m.id === id);
        if (method)
          return (
            <li key={id}>
              <MethodSource id={id} />
            </li>
          );
        const goal = data.goals.find(
          (g) => g.id === id || g.results.some((r) => r.id === id),
        );
        const result = goal?.results.find((r) => r.id === id);
        const action = data.actions.find((a) => a.id === id);
        const memory = data.memories.find((m) => m.id === id);
        const block = data.workBlocks.find((b) => b.id === id);
        const version = data.programs.find(
          (p) => `program-v${p.version}` === id,
        );
        const label = result
          ? `${formatDate(result.date)} · ${result.value} recorded · ${result.source}`
          : (goal?.title ??
            action?.title ??
            memory?.text ??
            block?.action ??
            (version
              ? `Program v${version.version} · ${version.sprintResult}`
              : "Archived reference"));
        const route = goal
          ? `/app/goals/${goal.id}/progress`
          : action
            ? `/app/goals/${action.goalId}/progress`
            : memory
              ? "/app/coach/about-you"
              : block
                ? "/app/calendar"
                : null;
        return (
          <li key={id}>
            {route ? (
              <Link to={route}>
                {label}
                <ArrowUpRight size={12} />
              </Link>
            ) : (
              <span>{label}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function ProgramOverview({
  data,
  onEdit,
}: {
  data: Data;
  onEdit: () => void;
}) {
  const program = currentProgram(data);
  const timelineToday = new Intl.DateTimeFormat("en-CA", {
    timeZone: data.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const goal = data.goals.find((g) => g.id === program.focusGoalId);
  const plan = goal ? currentPlan(goal) : null;
  return (
    <>
      <div className="program-overview">
        <section className="program-roadmap">
          <div className="program-section-heading">
            <h2>From your goal to the next action</h2>
            <span>This sprint</span>
          </div>
          <ol>
            <li>
              <span className="roadmap-marker">01</span>
              <div>
                <span className="section-kicker">FOCUS GOAL</span>
                <h3>
                  {goal?.title ?? "Choose the result you want to work toward."}
                </h3>
                <p>
                  {goal?.success ??
                    "Create a goal so your program has a result to plan around."}
                </p>
                <Link
                  className="text-link"
                  to={
                    goal ? `/app/goals/${goal.id}/progress` : "/app/goals/new"
                  }
                >
                  {goal ? "View goal & progress" : "Create your first goal"}
                  <ArrowRight size={14} />
                </Link>
              </div>
            </li>
            <li>
              <span className="roadmap-marker">02</span>
              <div>
                <span className="section-kicker">
                  SPRINT RESULT · {formatDate(program.sprintStart)}–
                  {formatDate(program.sprintEnd)}
                </span>
                <h3>{program.sprintResult}</h3>
                <p>{program.approach}</p>
                <button className="text-link" onClick={onEdit}>
                  Adjust this sprint <Pencil size={12} />
                </button>
              </div>
            </li>
            <li>
              <span className="roadmap-marker">03</span>
              <div>
                <span className="section-kicker">NEXT ACTION</span>
                <h3>{plan?.action ?? "Define one action you can begin."}</h3>
                <p>
                  {plan
                    ? `Finished when: ${plan.criterion}`
                    : "Adler can help turn the goal into a concrete first step."}
                </p>
                <span className="program-timing">
                  <Clock3 size={13} />
                  {plan?.timing ?? "Choose a time after setting your goal"}
                </span>
              </div>
            </li>
          </ol>
        </section>
        <aside className="program-week">
          <section className="program-budget">
            <span className="section-kicker">YOUR WEEKLY CAPACITY</span>
            <h2>
              {program.weeklyMinutes}
              <span>min / week</span>
            </h2>
            <p>A shared budget for all your active goals.</p>
            <dl>
              <div>
                <dt>Work days</dt>
                <dd>
                  {[...program.workDays]
                    .sort()
                    .map((d) => days[d])
                    .join(" · ")}
                </dd>
              </div>
              <div>
                <dt>Available hours</dt>
                <dd>
                  {program.workStart}–{program.workEnd}
                </dd>
              </div>
              <div>
                <dt>Session length</dt>
                <dd>{program.sessionMinutes} minutes</dd>
              </div>
            </dl>
            <Link className="button secondary" to="/app/calendar">
              <CalendarDays size={15} /> Plan your work blocks
            </Link>
          </section>
          <Link className="program-review-link" to="/app/reviews/current">
            <CalendarDays size={19} />
            <div>
              <span>YOUR WEEKLY REVIEW</span>
              <b>Every {program.reviewDay}</b>
              <p>Review results. Choose the next change.</p>
            </div>
            <ArrowRight size={16} />
          </Link>
        </aside>
      </div>
      <section className="program-visual-plan">
        <PlanTimeline
          events={programTimeline(data, timelineToday)}
          today={timelineToday}
        />
        <Link
          className="text-link"
          to={
            goal
              ? `/app/calendar?goal=${encodeURIComponent(goal.id)}`
              : "/app/goals/new"
          }
        >
          {goal ? "Add work to this timeline" : "Create your first goal"}{" "}
          <ArrowRight size={14} />
        </Link>
      </section>
      <section className="program-method-library">
        <div className="program-section-heading">
          <div>
            <h2>How Adler helps you adjust</h2>
            <p>
              Methods available to your coach, with the evidence behind each
              one.
            </p>
          </div>
          <button className="text-link" onClick={onEdit}>
            Edit methods <Pencil size={13} />
          </button>
        </div>
        <div className="program-method-list">
          {METHODS.map((method, i) => (
            <details key={method.id}>
              <summary>
                <span className="method-index">0{i + 1}</span>
                <div>
                  <b>{method.name}</b>
                  <p>{method.question}</p>
                </div>
                <span
                  className={`method-state ${program.enabledMethods.includes(method.id) ? "available" : ""}`}
                >
                  {program.enabledMethods.includes(method.id) ? "On" : "Off"}
                </span>
                <ChevronDown size={15} />
              </summary>
              <div className="program-method-detail">
                <p>{method.action}</p>
                <p className="program-method-example">{method.example}</p>
                <MethodSource id={method.id} />
                <p>{method.limit}</p>
              </div>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

export function ProgramContext({ data }: { data: Data }) {
  const [selected, setSelected] = useState(
    currentProgram(data).focusGoalId || "general",
  );
  const [checkId, setCheckId] = useState("outcome");
  const context = coachingContext(
    data,
    data.goals.some((g) => g.id === selected) ? selected : "general",
    "",
    localDate(),
  );
  const check = context.checks.find((c) => c.id === checkId)!;
  return (
    <>
      <div className="program-section-heading context-heading">
        <div>
          <h2>What Adler considers</h2>
          <p>Inspect the current records before your next conversation.</p>
        </div>
        <label>
          Goal context
          <select
            value={context.selectedGoalId}
            aria-label="Inspect context for goal"
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="general">All goals</option>
            {data.goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="program-context-browser">
        <nav aria-label="Context checks">
          {context.checks.map((c, i) => (
            <button
              key={c.id}
              aria-pressed={checkId === c.id}
              aria-controls="program-check-detail"
              onClick={() => setCheckId(c.id)}
            >
              <span>0{i + 1}</span>
              <div>
                <b>{c.label}</b>
                <small>
                  {c.sources.length
                    ? `${c.sources.length} ${c.sources.length === 1 ? "reference" : "references"}`
                    : "No supporting records yet"}
                </small>
              </div>
              <ArrowRight size={14} />
            </button>
          ))}
        </nav>
        <section
          id="program-check-detail"
          className="program-check-detail"
          aria-live="polite"
        >
          <span className="section-kicker">
            CURRENT CONTEXT · PROGRAM v{context.program.version}
          </span>
          <h3>{check.label}</h3>
          <p className="context-finding">{check.finding}</p>
          <div className="context-reference-heading">
            Supporting records & sources
          </div>
          {check.sources.length ? (
            <Sources data={data} ids={check.sources} />
          ) : (
            <p className="context-missing">
              This information is still missing. Adler can ask about it in your
              conversation.
            </p>
          )}
          <Link
            className="text-link"
            to={
              check.id === "memory"
                ? "/app/coach/about-you"
                : check.id === "capacity"
                  ? "/app/calendar"
                  : `/app/coach?goal=${context.selectedGoalId}`
            }
          >
            {check.id === "memory"
              ? "Edit your saved context"
              : check.id === "capacity"
                ? "Open your calendar"
                : "Discuss this with Adler"}
            <ArrowRight size={14} />
          </Link>
        </section>
      </div>
      <details className="program-engine-note">
        <summary>
          How this context reaches Adler <ChevronDown size={15} />
        </summary>
        <p>
          Each conversation uses your saved program, goals, action and result
          records, confirmed context, and recent messages. The shared coaching
          service assembles these inputs for your selected AI provider,
          validates proposed changes, and saves a decision record. App,
          iMessage, SMS, and MCP use this same service.
        </p>
        <p>
          Approving a program revision changes the context used in future
          conversations. It does not retrain the model. Scheduled check-ins run
          through the same service when you enable them in Connections.
        </p>
      </details>
    </>
  );
}

export function ProgramDecisions({
  data,
  onReview,
}: {
  data: Data;
  onReview: (id: string) => void;
}) {
  return (
    <div className="program-decisions">
      <div className="program-section-heading">
        <div>
          <h2>Advice, decisions, and follow-through</h2>
          <p>
            See what Adler proposed, what you chose, and what happened
            afterward.
          </p>
        </div>
        <Link className="text-link" to="/app/coach">
          Talk to Adler <ArrowRight size={14} />
        </Link>
      </div>
      {data.decisions.length ? (
        [...data.decisions].reverse().map((decision) => (
          <article className="program-decision-record" key={decision.id}>
            <div className="decision-record-meta">
              <span>
                {formatDate(decision.date)} · Program v{decision.programVersion}
              </span>
              <span className="pace-badge neutral">{decision.status}</span>
            </div>
            <h3>{decision.proposal?.title ?? "Coaching review"}</h3>
            <p>{decision.summary}</p>
            {decision.proposal && (
              <div className="decision-review-point">
                <CalendarDays size={15} />
                <span>
                  <b>Review point</b>
                  {decision.proposal.reviewAfter}
                </span>
              </div>
            )}
            <details>
              <summary>
                Context & evidence behind the decision <ChevronDown size={14} />
              </summary>
              {decision.checks.map((check) => (
                <div className="saved-decision-check" key={check.id}>
                  <b>{check.label}</b>
                  <p>{check.finding}</p>
                  <Sources data={data} ids={check.sources} />
                </div>
              ))}
              <div className="decision-method-references">
                {decision.methods.map((id) => (
                  <MethodSource key={id} id={id} />
                ))}
              </div>
            </details>
            {decision.review && (
              <div className="program-reviewed">
                <b>
                  {decision.review.choice === "Keep"
                    ? "Keep the approach"
                    : "Revisit with Adler"}{" "}
                  · {formatDate(decision.review.date)}
                </b>
                <p>{decision.review.note}</p>
              </div>
            )}
            <div className="decision-record-actions">
              <Link
                className="text-link"
                to={`/app/coach?goal=${decision.goalId}`}
              >
                Open conversation <ArrowRight size={14} />
              </Link>
              {decision.status === "Accepted" && (
                <button
                  className="button secondary"
                  onClick={() => onReview(decision.id)}
                >
                  Review this change
                </button>
              )}
            </div>
          </article>
        ))
      ) : (
        <div className="program-empty">
          <span className="program-empty-mark">
            <ArrowRight size={24} />
          </span>
          <h3>Your first coaching decision starts here.</h3>
          <p>
            Bring a goal or an obstacle to Adler. The recommendation, its
            evidence, and your choice will be saved together.
          </p>
          <Link className="button primary" to="/app/coach">
            Review a goal with Adler <ArrowRight size={15} />
          </Link>
        </div>
      )}
    </div>
  );
}

function versionSettings(program: ProgramVersion, data: Data) {
  return [
    [
      "Focus goal",
      data.goals.find((g) => g.id === program.focusGoalId)?.title ??
        "No current goal",
    ],
    ["Sprint result", program.sprintResult],
    ["Sprint dates", `${program.sprintStart} → ${program.sprintEnd}`],
    ["Weekly capacity", `${program.weeklyMinutes} minutes`],
    ["Session length", `${program.sessionMinutes} minutes`],
    ["Work window", `${program.workStart}–${program.workEnd}`],
    [
      "Work days",
      [...program.workDays]
        .sort()
        .map((d) => days[d])
        .join(" · "),
    ],
    ["Review day", program.reviewDay],
    ["Approach", program.approach],
    [
      "Methods",
      METHODS.filter((m) => program.enabledMethods.includes(m.id))
        .map((m) => m.name)
        .join(" · ") || "None selected",
    ],
  ];
}
export function ProgramVersions({ data }: { data: Data }) {
  return (
    <div className="program-versions">
      <div className="program-section-heading">
        <div>
          <h2>How your program has changed</h2>
          <p>
            Every saved revision keeps its settings and the reason for the
            change.
          </p>
        </div>
        <span className="program-current-label">
          Current · v{currentProgram(data).version}
        </span>
      </div>
      <div className="program-version-timeline">
        {[...data.programs].reverse().map((program) => {
          const previous = data.programs.find(
            (p) => p.version === program.version - 1,
          );
          const before = previous ? versionSettings(previous, data) : [];
          const settings = versionSettings(program, data);
          const changes = settings.filter(
            ([name, value]) =>
              before.find(([key]) => key === name)?.[1] !== value,
          );
          return (
            <article key={program.version} className="program-version-entry">
              <span className="version-marker">v{program.version}</span>
              <div>
                <div className="version-entry-meta">
                  <time>{formatDate(program.date)}</time>
                  {program.version === currentProgram(data).version && (
                    <span>Current program</span>
                  )}
                </div>
                <h3>{program.reason}</h3>
                <p>{program.sprintResult}</p>
                <details
                  open={program.version === currentProgram(data).version}
                >
                  <summary>
                    {previous
                      ? `${changes.length} settings changed`
                      : "Starting program settings"}
                    <ChevronDown size={14} />
                  </summary>
                  {changes.length ? (
                    <dl className="version-changes">
                      {changes.map(([name, value]) => (
                        <div key={name}>
                          <dt>{name}</dt>
                          <dd>
                            {previous && (
                              <span className="version-before">
                                {before.find(([key]) => key === name)?.[1]}
                              </span>
                            )}
                            <span>{value}</span>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p>
                      The settings were kept; the reason for this revision was
                      updated.
                    </p>
                  )}
                </details>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
