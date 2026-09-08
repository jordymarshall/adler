import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, RefreshCw } from "lucide-react";
import { currentPlan, formatDate, useStore, type Goal } from "./store";
import { dateInZone } from "../shared/journey";
import { goalExecution } from "../shared/goal-execution";
import { CycleTimeline, WeeklyActions } from "./ExecutionTimeline";
import { api, type ServiceStatus } from "./api";
import type { Proposal } from "../server/service";
import { LearningDashboard } from "./LearningDashboard";
import { recordLink } from "../shared/record-links";
import "./goal-structure.css";
import "./coaching-learning.css";
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
  const reviewAt = goal.assessment?.nextAt === null ? null : goal.assessment?.nextAt ?? adaptive?.assessment.at;
  const reviewLabel = reviewAt ? `Review ${formatDate(reviewAt)}` : "Review after useful feedback";
  const execution = goalExecution(data, goal, today);
  const summary = execution.summary;
  const hasLearning = data.learning?.some(record => record.goalIds.includes(goal.id));
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
    return () => { live = false; };
  }, [data]);
  const pending = proposals.filter(proposal => proposal.status === "pending" && proposal.expires > Date.now() &&
    (proposal.goalId === goal.id || proposal.changes.some(change => change.parentId === goal.id || (change.entity === "goal" && change.id === goal.id))));
  const job = jobs.find(item => item.goalId === goal.id && ["pending", "running", "failed"].includes(item.status));
  async function review(proposal: Proposal, choice: "approve" | "dismiss") {
    setBusy(true);
    setError("");
    try {
      await flush();
      await api(`proposals/${proposal.id}/${choice}`, {});
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the plan.");
    } finally { setBusy(false); }
  }
  return (
    <div className="goal-plan">
      <section id="goal-overview" className="goal-section" aria-label="Goal overview" tabIndex={-1}>
        <div className="execution-status" role="region" aria-label="Goal and current cycle">
          <div><span>What you’re working toward</span><strong>{goal.success}</strong><small>{goal.targetDate ? `${goal.deadline === "firm" ? "Firm deadline" : "Flexible target"} · ${formatDate(goal.targetDate)}` : "No fixed deadline"}</small></div>
          <div><span>Current plan</span><strong>{adaptive?.window.label ?? "First action"}</strong><small>{adaptive ? `${formatDate(adaptive.window.start)}–${formatDate(adaptive.window.end)} · ${goal.status === "Draft" ? "Ready to start" : goal.status !== "Active" ? goal.status : today > adaptive.window.end ? "Ready for review" : today < adaptive.window.start ? "Starts soon" : "In progress"}` : "Review after your first action report"}</small></div>
          <div><span>Reported so far</span><strong>{summary.done} / {summary.planned} actions done</strong><small>{summary.partial} partly · {summary.missed} didn’t happen<br />{summary.unknown} awaiting check-in · {summary.upcoming} upcoming</small></div>
        </div>
        <div className="execution-next">{children}</div>
      </section>
      <section id="goal-plan" className="goal-section" aria-label="Plan and timeline" tabIndex={-1}>
        <div className="goal-section-heading"><div><span className="section-kicker">THE WORK BETWEEN HERE AND THE GOAL</span><h2>Plan & timeline</h2></div><Link className="text-link" to={`/app/check-in?${new URLSearchParams({ goal: goal.id, prompt: "Review my current planning window, actions and milestones. Suggest any useful changes and explain what follows this step." })}`}>Adjust with Adler ↗</Link></div>
        <p className="goal-section-intro">{adaptive?.approach ?? plan.action}</p>
        {adaptive && <details className="quiet-disclosure plan-approach"><summary>Why this planning period?</summary><p>{adaptive.window.rationale}</p><p>{adaptive.window.capacityMinutes} minutes {adaptive.window.capacityStatus === "provisional" ? "proposed" : "available"} · {reviewLabel}</p></details>}
        {adaptive && <ol className="plan-step-sequence" aria-label="Actions in the current plan">{adaptive.steps.map((step, index) => <li key={step.id}><span className="plan-step-order">{index + 1}</span><div><strong>{step.title}</strong><p>{step.cue} · {step.durationMinutes} min{step.measure?.target ? ` · ${step.measure.target} ${step.measure.unit}` : ""}</p><details><summary>When it happens & what counts</summary><p>{formatDate(step.scheduledDate)}{step.recurrence ? ` to ${formatDate(step.recurrence.until)} · ${step.recurrence.weekdays ? step.recurrence.weekdays.map(day => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day]).join(", ") : `every ${step.recurrence.everyDays} ${step.recurrence.everyDays === 1 ? "day" : "days"}`}` : ""}</p><p>Finished when: {step.criterion}</p>{step.dependsOn.length > 0 && <p>After: {step.dependsOn.map(id => adaptive.steps.find(item => item.id === id)?.title).filter(Boolean).join("; ")}</p>}{step.milestoneId && <p>Contributes to: {goal.milestones.find(item => item.id === step.milestoneId)?.title}</p>}{step.fallback && <p>If the plan does not fit: {step.fallback}</p>}</details></div></li>)}</ol>}
        <CycleTimeline data={data} goal={goal} today={today} />
        <div className="plan-next-decision"><span>AFTER THIS STEP</span><p>{adaptive?.assessment.adaptation ?? "Tell Adler what happened with the first action. Use that experience to choose the next useful step."}</p><small>Later work can change with your feedback. A milestone is a verified result; a planning cycle is the work we choose before reviewing.</small></div>
      </section>
      <section id="goal-progress" className="goal-section" aria-label="Goal progress" tabIndex={-1}>
        <GoalProjection data={data} goal={goal} today={today} />
        <details className="quiet-disclosure action-history-chart"><summary>Explore action reports by week</summary><WeeklyActions key={goal.id} data={data} goal={goal} today={today} /></details>
      </section>
      <section className="plan-learning goal-section" id="plan-learning" aria-label="Learning and adaptations" tabIndex={-1}>
        <div className="goal-section-heading"><div><span className="section-kicker">WHAT CHANGES WITH EXPERIENCE</span><h2>Your learning journey</h2></div><RefreshCw size={18} /></div>
        {hasLearning ? <LearningDashboard data={data} goalId={goal.id} /> : <div className="plan-learning-start"><p>{adaptive?.experiment?.hypothesis ?? adaptive?.assessment.question ?? "Your first action is the starting point. Tell Adler what helped or got in the way."}</p><small>{adaptive ? `${reviewLabel} · ${adaptive.experiment?.comparison ?? "Your first reports will establish a useful comparison."}` : "No personal explanation has been tested yet."}</small>{adaptive?.experiment && <details className="quiet-disclosure learning-method"><summary>How we’ll test this</summary><dl className="reasoning-details"><div><dt>Starting comparison · {adaptive.experiment.comparisonStatus === "reported" ? "reported" : "not yet known"}</dt><dd>{adaptive.experiment.comparison}</dd><div className="evidence-links">{adaptive.experiment.comparisonSourceIds.map((id, index) => <Link key={id} to={recordLink(data, id) ?? `/app/check-in?goal=${goal.id}`}>Starting report {index + 1} ↗</Link>)}</div></div><div><dt>Signal to watch</dt><dd>{adaptive.experiment.outcomeSignal}</dd></div><div><dt>How we’ll decide</dt><dd>{adaptive.experiment.decisionRule}</dd></div>{adaptive.experiment.alternativeExplanations.length > 0 && <div><dt>Other possible explanations</dt><dd><ul>{adaptive.experiment.alternativeExplanations.map(explanation => <li key={explanation}>{explanation}</li>)}</ul></dd></div>}</dl></details>}</div>}
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

        <Link className="text-link" to={`/app/check-in?${new URLSearchParams({ goal: goal.id, prompt: adaptive ? `Let’s check in on this plan. You wanted to know: ${adaptive.assessment.question} Here is what happened: ` : "Help me review my first action and develop the next planning period. Choose useful tracking and keep my history and bookings." })}`}>{adaptive ? "Continue in Check-in" : "Discuss an updated plan"} <ArrowRight size={15} /></Link>
        <Link className="text-link goal-all-insights" to={`/app/insights?goal=${goal.id}`}>All insights for this goal ↗</Link>
      </section>
    </div>
  );
}
