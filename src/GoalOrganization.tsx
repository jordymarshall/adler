import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Plus,
  Search,
  SlidersHorizontal,
  Target,
} from "lucide-react";
import { GoalIcon, Modal } from "./components";
import {
  currentPlan,
  formatDate,
  localDate,
  useStore,
  type Goal,
} from "./store";
import { progressStatus } from "./progress";
import { ProgressChart } from "./ProgressChart";
import type { GoalArea } from "./program-types";

export function OrganizedGoals() {
  const { data } = useStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Active");
  const [area, setArea] = useState("All areas");
  const [tag, setTag] = useState("All tags");
  const [groupBy, setGroupBy] = useState("Area");
  const tags = [...new Set(data.goals.flatMap((g) => g.tags ?? []))].sort();
  const goals = data.goals.filter(
    (g) =>
      (status === "All" || g.status === status) &&
      (area === "All areas" || g.area === area) &&
      (tag === "All tags" || g.tags?.includes(tag)) &&
      `${g.title} ${g.success} ${g.tags?.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const groups =
    groupBy === "Area"
      ? ["Career", "Learning", "Personal"]
      : ["Focus", "Maintain", "Later"];
  return (
    <div className="organized-goals">
      <div className="page-heading">
        <div>
          <span className="section-kicker">OUTCOMES, NOT JUST TO-DOS</span>
          <h1>Your goals, in view.</h1>
          <p>
            See what’s due, what’s moving, and where your plan needs attention.
          </p>
        </div>
        <Link className="button primary" to="/app/goals/new">
          <Plus size={17} /> New goal
        </Link>
      </div>
      <div className="goal-toolbar">
        <label className="goal-search">
          <Search size={17} />
          <input
            aria-label="Search goals"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search goals or tags"
          />
        </label>
        <select
          aria-label="Filter by area"
          value={area}
          onChange={(e) => setArea(e.target.value)}
        >
          {["All areas", "Career", "Learning", "Personal"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <select
          aria-label="Filter by tag"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
        >
          {["All tags", ...tags].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <label className="group-select">
          Group by{" "}
          <select
            aria-label="Group goals by"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
          >
            <option>Area</option>
            <option>Priority</option>
          </select>
        </label>
      </div>
      <div className="filter-tabs" aria-label="Filter goals">
        {["Active", "Paused", "Completed", "Set aside", "All"].map((v) => (
          <button
            key={v}
            className={status === v ? "active" : ""}
            aria-pressed={status === v}
            onClick={() => setStatus(v)}
          >
            {v}
            <span>
              {data.goals.filter((g) => v === "All" || g.status === v).length}
            </span>
          </button>
        ))}
      </div>
      <div className="goal-groups">
        {groups.map((group) => {
          const items = goals.filter(
            (g) => (groupBy === "Area" ? g.area : g.priority) === group,
          );
          return items.length ? (
            <section className="goal-group" key={group}>
              <h2>
                {group}
                <span>{items.length}</span>
              </h2>
              <div className="organized-grid">
                {items.map((goal) => {
                  const pace = progressStatus(goal, localDate());
                  return (
                    <Link
                      className="organized-card"
                      to={`/app/goals/${goal.id}/progress`}
                      key={goal.id}
                    >
                      <div className="goal-card-top">
                        <GoalIcon kind={goal.kind} />
                        <span className={`pace-badge ${pace.tone}`}>
                          {pace.label}
                        </span>
                        <ArrowUpRight size={18} />
                      </div>
                      <div className="goal-tags">
                        {goal.tags?.map((t) => (
                          <span key={t}>#{t}</span>
                        ))}
                        <b>{goal.priority}</b>
                      </div>
                      <h3>{goal.title}</h3>
                      <p className="goal-deadline">
                        {goal.targetDate
                          ? `Target ${formatDate(goal.targetDate, { month: "short", day: "numeric", year: "numeric" })}`
                          : "Target date not set"}
                      </p>
                      <p className="goal-measure">{goal.unit}</p>
                      <ProgressChart goal={goal} compact />
                      <div className="organized-next">
                        <span>NEXT ACTION</span>
                        <p>{currentPlan(goal).action}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ) : null;
        })}
      </div>
      {!goals.length && (
        <div className="empty-state">
          <Target size={30} />
          <h2>No goals match these filters.</h2>
          <p>Try another tag or clear your search.</p>
        </div>
      )}
    </div>
  );
}

export function GoalOrganization({ goal }: { goal: Goal }) {
  const { commit } = useStore();
  const [editing, setEditing] = useState(false);
  const [area, setArea] = useState(goal.area ?? "Personal");
  const [tags, setTags] = useState(goal.tags?.join(", ") ?? "");
  const [priority, setPriority] = useState(goal.priority ?? "Maintain");
  const [date, setDate] = useState(goal.targetDate ?? "");
  const [checkpoints, setCheckpoints] = useState(goal.checkpoints ?? []);
  const [reason, setReason] = useState("");
  const [expectedVersion, setExpectedVersion] = useState(
    goal.organizationVersion ?? 0,
  );
  const [error, setError] = useState("");
  function save(e: FormEvent) {
    e.preventDefault();
    const sorted = [...checkpoints].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    if (
      !sorted.length ||
      sorted.at(-1)!.date !== date ||
      sorted.at(-1)!.value !== goal.target
    ) {
      setError(
        `The final checkpoint must match your target: ${goal.target} by ${date}.`,
      );
      return;
    }
    if (
      sorted.some(
        (p, i) =>
          i > 0 &&
          (p.value < sorted[i - 1].value || p.date === sorted[i - 1].date),
      )
    ) {
      setError(
        "Use one checkpoint per date, with cumulative values that stay the same or increase.",
      );
      return;
    }
    if (
      commit((d) => {
        const current = d.goals.find((g) => g.id === goal.id)!;
        if ((current.organizationVersion ?? 0) !== expectedVersion)
          throw new Error(
            "This goal changed in another view. Reopen the form before saving.",
          );
        current.organizationVersion = expectedVersion + 1;
        current.area = area as GoalArea;
        current.tags = [
          ...new Set(
            tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
          ),
        ].slice(0, 8);
        current.priority = priority;
        const changed =
          JSON.stringify(current.checkpoints) !== JSON.stringify(checkpoints) ||
          current.targetDate !== date;
        if (changed) {
          current.checkpointHistory = [
            ...(current.checkpointHistory ?? []),
            {
              date: new Date().toISOString(),
              checkpoints: current.checkpoints ?? [],
              targetDate: current.targetDate ?? "",
              reason,
            },
          ];
          current.checkpoints = [...checkpoints].sort((a, b) =>
            a.date.localeCompare(b.date),
          );
          current.targetDate = date;
        }
      }, "Goal organization and checkpoints saved.")
    )
      setEditing(false);
  }
  return (
    <>
      <div className="goal-meta-row">
        <span>{goal.area}</span>
        {goal.tags?.map((t) => (
          <span key={t}>#{t}</span>
        ))}
        <span>{goal.priority}</span>
        {goal.targetDate && <b>Target {formatDate(goal.targetDate)}</b>}
        <button
          className="text-link"
          onClick={() => {
            setArea(goal.area ?? "Personal");
            setTags(goal.tags?.join(", ") ?? "");
            setPriority(goal.priority ?? "Maintain");
            setDate(goal.targetDate ?? "");
            setCheckpoints(structuredClone(goal.checkpoints ?? []));
            setExpectedVersion(goal.organizationVersion ?? 0);
            setError("");
            setReason("");
            setEditing(true);
          }}
        >
          <SlidersHorizontal size={14} /> Organize & edit checkpoints
        </button>
      </div>
      {editing && (
        <Modal title="Organize this goal" onClose={() => setEditing(false)}>
          <form className="program-form" onSubmit={save}>
            {error && (
              <p role="alert" className="inline-error">
                {error}
              </p>
            )}
            <div className="form-row">
              <label>
                Area
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value as GoalArea)}
                >
                  {["Career", "Learning", "Personal"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label>
                Priority
                <select
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value as typeof priority)
                  }
                >
                  {["Focus", "Maintain", "Later"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Tags, separated by commas
              <input
                value={tags}
                maxLength={160}
                onChange={(e) => setTags(e.target.value)}
              />
            </label>
            <label>
              Target date
              <input
                type="date"
                value={date}
                required
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <h3>Dated checkpoints</h3>
            <p className="field-hint">
              Set the cumulative result expected by each date, in {goal.unit}.
              These checkpoints determine the pace label. Changing them
              preserves the previous schedule below.
            </p>
            {checkpoints.map((p, i) => (
              <div className="checkpoint-row" key={p.id}>
                <label>
                  Date
                  <input
                    aria-label={`Checkpoint ${i + 1} date`}
                    type="date"
                    required
                    max={date || undefined}
                    value={p.date}
                    onChange={(e) =>
                      setCheckpoints(
                        checkpoints.map((c) =>
                          c.id === p.id ? { ...c, date: e.target.value } : c,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  Result
                  <input
                    aria-label={`Checkpoint ${i + 1} value`}
                    type="number"
                    min="0"
                    max={goal.kind === "learning" ? 10 : goal.milestones.length}
                    step="1"
                    required
                    value={p.value}
                    onChange={(e) =>
                      setCheckpoints(
                        checkpoints.map((c) =>
                          c.id === p.id
                            ? { ...c, value: Number(e.target.value) }
                            : c,
                        ),
                      )
                    }
                  />
                </label>
                <button
                  type="button"
                  className="text-link"
                  onClick={() =>
                    setCheckpoints(checkpoints.filter((c) => c.id !== p.id))
                  }
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="button secondary"
              onClick={() =>
                setCheckpoints([
                  ...checkpoints,
                  {
                    id: crypto.randomUUID(),
                    date: date || localDate(7),
                    value: goal.target ?? goal.milestones.length,
                    label: "Agreed checkpoint",
                  },
                ])
              }
            >
              <Plus size={15} /> Add checkpoint
            </button>
            <label>
              Reason for a schedule change
              <input
                value={reason}
                maxLength={300}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Added a feedback round before publishing"
                required={
                  JSON.stringify(goal.checkpoints) !==
                    JSON.stringify(checkpoints) || goal.targetDate !== date
                }
              />
            </label>
            <div className="modal-actions">
              <button className="button primary">Save changes</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
