import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, RefreshCw } from "lucide-react";
import { currentPlan, formatDate, useStore, type Goal } from "./store";
import { dateInZone } from "../shared/journey";
import { goalExecution, cycleEvidence } from "../shared/goal-execution";
import { CycleTimeline, WeeklyActions } from "./ExecutionTimeline";
import { api, type ServiceStatus } from "./api";
import type { Proposal } from "../server/service";
import { recordLink } from "../shared/record-links";
import { ProposalChanges } from "./ProposalChanges";
import { GoalProjection } from "./GoalProjection";

export function GoalPlan({
  goal,
  children,
}: {
  goal: Goal;
  children: ReactNode;
}) {
  const { data, flush, refresh } = useStore();
  const plan = currentPlan(goal);
  const adaptive = plan.adaptive;
  const today = dateInZone(data.timeZone);
  const execution = goalExecution(data, goal, today);
  const summary = execution.summary;
  const learning = cycleEvidence(data, goal, today);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [service, setService] = useState<ServiceStatus | null>(null);
  const [jobs, setJobs] = useState<
    { goalId: string; status: string; error?: string }[]
  >([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    Promise.all([
      api<Proposal[]>("proposals"),
      api<ServiceStatus>("status"),
      api<typeof jobs>("planning/status"),
    ])
      .then(([proposals, service, jobs]) => {
        if (live) {
          setProposals(proposals);
          setService(service);
          setJobs(jobs);
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [data]);
  const pending = proposals.filter(
    (p) =>
      p.status === "pending" &&
      p.expires > Date.now() &&
      (p.goalId === goal.id ||
        p.changes.some(
          (c) =>
            c.parentId === goal.id || (c.entity === "goal" && c.id === goal.id),
        )),
  );
  const job = jobs.find(
    (j) =>
      j.goalId === goal.id &&
      ["pending", "running", "failed"].includes(j.status),
  );
  const decisions = data.decisions
    .filter((d) => d.goalId === goal.id)
    .slice(-3)
    .reverse();
  async function review(proposal: Proposal, choice: "approve" | "dismiss") {
    setBusy(true);
    setError("");
    try {
      await flush();
      await api(`proposals/${proposal.id}/${choice}`, {});
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the plan.");
    } finally {
      setBusy(false);
    }
  }
  function sourceText(id: string) {
    const action = data.actions.find((a) => a.id === id);
    if (action)
      return `${action.date || "Unscheduled"}: ${action.title} · ${action.outcome ?? "Unknown"}${action.amount === undefined ? "" : ` · ${action.amount} recorded`}${action.note ? ` — ${action.note}` : ""}`;
    return (
      data.memories.find((m) => m.id === id)?.text ??
      data.messages.find((m) => m.id === id)?.text ??
      goal.results
        .filter((r) => r.id === id)
        .map(
          (r) =>
            `${r.date}: ${r.value} ${goal.measure?.unit ?? goal.unit ?? ""} — ${r.source}`,
        )[0] ??
      goal.milestones.find((m) => m.id === id)?.criterion ??
      (id === goal.id
        ? goal.success
        : "This source record is no longer available.")
    );
  }
  return (
    <div className="goal-plan">
      <section className="execution-status" aria-label="Goal and current cycle">
        <div>
          <span>What you’re working toward</span>
          <strong>{goal.success}</strong>
          <small>
            {goal.targetDate
              ? `${goal.deadline === "firm" ? "Firm deadline" : "Flexible target"} · ${formatDate(goal.targetDate)}`
              : "No fixed deadline"}
          </small>
        </div>
        <div>
          <span>{adaptive ? "Current planning cycle" : "Planning cycle"}</span>
          <strong>{adaptive?.window.label ?? "Choose the first cycle"}</strong>
          <small>
            {adaptive
              ? `${formatDate(adaptive.window.start)}–${formatDate(adaptive.window.end)} · ${goal.status !== "Active" ? (goal.status === "Draft" ? "Ready to start" : goal.status) : today > adaptive.window.end ? "Ready for review" : today < adaptive.window.start ? "Starts soon" : "In progress"}`
              : "Define it together in Check-in"}
          </small>
        </div>
        <div>
          <span>{adaptive ? "Actions in this cycle" : "Saved actions"}</span>
          <strong>
            {summary.done} / {summary.planned} done
          </strong>
          <small>
            {summary.partial} partly · {summary.missed} didn’t happen
            <br />
            {summary.unknown} awaiting check-in · {summary.upcoming} upcoming
          </small>
        </div>
      </section>
      <GoalProjection data={data} goal={goal} today={today} />
      <CycleTimeline data={data} goal={goal} today={today} />
      <section className="plan-approach" aria-label="Behavioral approach">
        <h2>How you’ll make room for the work</h2>
        <p>
          {adaptive?.approach ??
            plan.basis?.strategy ??
            "Choose a manageable action, a cue to start, and what you’ll learn from trying it."}
        </p>
        {adaptive && (
          <p className="muted small-text">
            {adaptive.window.rationale} · {adaptive.window.capacityMinutes}{" "}
            minutes available this cycle
            {adaptive.window.capacityStatus === "provisional"
              ? " (provisional)"
              : ""}
          </p>
        )}
      </section>
      <WeeklyActions key={goal.id} data={data} goal={goal} today={today} />
      <div className="execution-next">{children}</div>
      <section
        className="panel plan-learning"
        id="plan-learning"
        aria-label="Learning and adaptations"
      >
        <div className="list-heading">
          <h2>What we’re learning</h2>
          <RefreshCw size={18} />
        </div>
        {adaptive && (
          <>
            <p>
              {adaptive.experiment?.hypothesis ?? adaptive.assessment.question}
            </p>
            <p className="small-text muted">
              {goal.assessment?.nextAt === null
                ? "Waiting for your input or new evidence"
                : `Next assessment: ${new Date(goal.assessment?.nextAt ?? adaptive.assessment.at).toLocaleString(undefined, { timeZone: data.timeZone })}`}
            </p>
            <p className="small-text">
              What we’ll reconsider: {adaptive.assessment.adaptation}
            </p>
          </>
        )}
        {adaptive?.experiment && (
          <details className="learning-method quiet-disclosure">
            <summary>How we’ll test this</summary>
            <p>
              <b>Signal to watch:</b> {adaptive.experiment.outcomeSignal}
            </p>
            <p>
              <b>
                Starting comparison
                {adaptive.experiment.comparisonStatus === "unknown"
                  ? " · not yet known"
                  : " · reported"}
                :
              </b>{" "}
              {adaptive.experiment.comparison}
            </p>
            {adaptive.experiment.comparisonSourceIds.map((id) => (
              <p key={id}>
                <Link
                  to={recordLink(data, id) ?? `/app/check-in?goal=${goal.id}`}
                >
                  {sourceText(id)}
                </Link>
              </p>
            ))}
            <p>
              <b>How we’ll decide:</b> {adaptive.experiment.decisionRule}
            </p>
            {!!adaptive.experiment.alternativeExplanations.length && (
              <p>
                <b>Other possible explanations:</b>{" "}
                {adaptive.experiment.alternativeExplanations.join("; ")}
              </p>
            )}
          </details>
        )}
        {learning && (
          <>
            <p className="small-text">
              <b>{learning.status}</b> · {learning.feedbackDelayDays} days
              allowed for feedback
              {learning.firstFeedbackDate
                ? ` · First feedback expected from ${formatDate(learning.firstFeedbackDate)}`
                : ""}
            </p>
            <div className="cycle-evidence">
              <div>
                <h3>What you did</h3>
                <p>
                  {learning.counts.done} done · {learning.counts.partial} partly
                  · {learning.counts.missed} didn’t happen ·{" "}
                  {learning.counts.unknown} awaiting check-in
                </p>
                <details className="quiet-disclosure">
                  <summary>Action evidence</summary>
                  {learning.records.map((a) => (
                    <p key={a.id}>
                      <Link to={recordLink(data, a.id)!}>
                        {formatDate(a.date)} · {a.title}
                      </Link>{" "}
                      · {a.outcome ?? "Awaiting check-in"}
                      {a.note ? ` — ${a.note}` : ""}
                    </p>
                  ))}
                </details>
              </div>
              <div>
                <h3>What changed in the outcome</h3>
                <p>
                  {learning.baseline ? (
                    <>
                      Starting observation:{" "}
                      <Link to={recordLink(data, learning.baseline.id)!}>
                        {learning.baseline.value}{" "}
                        {goal.measure?.unit ?? goal.unit} ·{" "}
                        {formatDate(learning.baseline.date)}
                      </Link>
                    </>
                  ) : (
                    "No outcome recorded before this cycle."
                  )}
                </p>
                {learning.results.length ? (
                  learning.results.slice(-3).map((r) => (
                    <p key={r.id}>
                      <Link to={recordLink(data, r.id)!}>
                        {formatDate(r.date)} · {r.value}{" "}
                        {goal.measure?.unit ?? goal.unit}
                      </Link>{" "}
                      — {r.source}
                    </p>
                  ))
                ) : (
                  <p>
                    No new numerical outcome observations. Review qualitative
                    feedback in Check-in too.
                  </p>
                )}
                {learning.notes.length > 0 && (
                  <details className="quiet-disclosure">
                    <summary>What you shared</summary>
                    {learning.notes.map((m) => (
                      <p key={m.id}>
                        <Link to={recordLink(data, m.id)!}>{m.text}</Link>
                      </p>
                    ))}
                  </details>
                )}
              </div>
            </div>
            <p className="small-text muted">
              Review these together. A pattern can guide the next experiment; it
              does not establish what caused the result.
            </p>
          </>
        )}
        {goal.assessment?.summary && <p>{goal.assessment.summary}</p>}
        {!adaptive && (
          <>
            <h3>Review updated plan</h3>
            <p>
              Adler can connect this goal to executable work, a suitable
              planning window, and regular feedback. Your results and booked
              work stay with the goal.
            </p>
          </>
        )}
        {!service?.coach.configured && service && (
          <p className="small-text">
            <Link to="/app/settings/provider">Connect your coach</Link> to
            prepare and assess plans.
          </p>
        )}
        {job && !pending.length && (
          <p className="small-text" role="status">
            {job.status === "failed"
              ? "The automatic assessment could not finish. Your records are saved; you can review with Adler below."
              : "Adler has an assessment queued. Your current plan remains available."}
          </p>
        )}
        {error && <p role="alert">{error}</p>}
        {pending.map((p) => (
          <article className="plan-adaptation" key={p.id}>
            <h3>{p.summary}</h3>
            <ProposalChanges
              changes={p.changes}
              data={data}
              beforeRecords={p.before}
            />
            <div className="plan-actions">
              <button
                className="button primary"
                disabled={busy}
                onClick={() => void review(p, "approve")}
              >
                Accept updated plan <Check size={15} />
              </button>
              <Link
                className="button secondary"
                to={`/app/check-in?goal=${goal.id}&prompt=${encodeURIComponent(`I want to discuss the proposed change: ${p.summary}`)}`}
              >
                Discuss changes
              </Link>
              <button
                className="text-link"
                disabled={busy}
                onClick={() => void review(p, "dismiss")}
              >
                Keep current plan
              </button>
            </div>
          </article>
        ))}
        {decisions
          .filter((d) => d.insights?.length)
          .map((d) => (
            <article className="plan-insight" key={d.id}>
              <small>
                {formatDate(d.date)} · {d.status}
              </small>
              {d.insights?.map((insight, i) => (
                <div key={i}>
                  <p>
                    <b>
                      {insight.status === "To test"
                        ? "Explanation to test"
                        : "Reported"}
                      :
                    </b>{" "}
                    {insight.finding}
                  </p>
                  <details className="quiet-disclosure">
                    <summary>Evidence behind this observation</summary>
                    {insight.sourceIds.map((id) => (
                      <p key={id}>{sourceText(id)}</p>
                    ))}
                  </details>
                </div>
              ))}
            </article>
          ))}
        {!pending.length && (
          <Link
            className="text-link"
            to={`/app/check-in?goal=${goal.id}&prompt=${encodeURIComponent(adaptive ? "Help me review my behavior and what we should adjust in this plan." : "Help me update this plan around my behavior and what you know about me. Preserve my history and bookings.")}`}
          >
            {adaptive ? "Continue in Check-in" : "Discuss an updated plan"}{" "}
            <ArrowRight size={15} />
          </Link>
        )}
      </section>
    </div>
  );
}
