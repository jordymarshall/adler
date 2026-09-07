import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, RefreshCw } from "lucide-react";
import { currentPlan, formatDate, useStore, type Goal } from "./store";
import { dateInZone } from "../shared/journey";
import { actionReady, planProgress } from "../shared/adaptive-plan";
import { forecastGoal, type Forecast } from "../shared/forecast";
import { progressStatus } from "./progress";
import { ProgressChart } from "./ProgressChart";
import { api, type ServiceStatus } from "./api";
import type { Proposal } from "../server/service";
import { ProposalChanges } from "./ProposalChanges";

export function GoalPlan({ goal, children }: {
  goal: Goal; children: ReactNode;
}) {
  const { data, flush, refresh } = useStore();
  const plan = currentPlan(goal);
  const adaptive = plan.adaptive;
  const today = dateInZone(data.timeZone);
  const forecast = goal.forecasts?.at(-1) ?? forecastGoal(data, goal);
  const previous = goal.forecasts?.slice(0, -1).reverse().find(f => f.expectedDate !== forecast.expectedDate || f.status !== forecast.status || JSON.stringify(f.inputs) !== JSON.stringify(forecast.inputs));
  const status = progressStatus(goal, today);
  const latest = [...goal.results].filter(r => r.date <= today).sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  const actual = goal.measure || goal.kind === "learning" ? latest?.value ?? null : status.actual;
  const outlook = goal.status !== "Active" ? status.label
    : forecast.status === "reached" ? "Target recorded"
      : forecast.expectedDate && goal.targetDate ? forecast.expectedDate > goal.targetDate ? "Projected after target" : "Projected by target"
        : forecast.status === "beyond-horizon" ? "Beyond forecast horizon"
          : forecast.expectedDate ? "Conditional estimate" : "Estimate unavailable";
  const changedInputs = previous ? [...new Set([...previous.inputs, ...forecast.inputs].map(input => input.label))]
    .map(label => ({ label, before: previous.inputs.find(i => i.label === label)?.value ?? "Not available", after: forecast.inputs.find(i => i.label === label)?.value ?? "Not available" }))
    .filter(input => input.before !== input.after) : [];
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [milestone, setMilestone] = useState("");
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [service, setService] = useState<ServiceStatus | null>(null);
  const [jobs, setJobs] = useState<{ goalId: string; status: string; error?: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [scenario, setScenario] = useState<Forecast | undefined>();
  useEffect(() => {
    let live = true;
    Promise.all([api<Proposal[]>("proposals"), api<ServiceStatus>("status"), api<typeof jobs>("planning/status")])
      .then(([proposals, service, jobs]) => { if (live) { setProposals(proposals); setService(service); setJobs(jobs); } })
      .catch(e => { if (live) setError(e.message); });
    return () => { live = false; };
  }, [data]);
  const pending = proposals.filter(p => p.status === "pending" && p.expires > Date.now() &&
    (p.goalId === goal.id || p.changes.some(c => c.parentId === goal.id || (c.entity === "goal" && c.id === goal.id))));
  const job = jobs.find(j => j.goalId === goal.id && ["pending", "running", "failed"].includes(j.status));
  const decisions = data.decisions.filter(d => d.goalId === goal.id).slice(-3).reverse();
  async function review(proposal: Proposal, choice: "approve" | "dismiss") {
    setBusy(true); setError("");
    try { await flush(); await api(`proposals/${proposal.id}/${choice}`, {}); setScenario(undefined); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not update the plan."); }
    finally { setBusy(false); }
  }
  async function preview(proposal: Proposal) {
    setBusy(true); setError("");
    try { await flush(); const result = await api<{ forecasts: { goalId: string; forecast: Forecast }[] }>(`proposals/${proposal.id}/preview`, {});
      setScenario(result.forecasts.find(f => f.goalId === goal.id)?.forecast);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not preview this plan."); }
    finally { setBusy(false); }
  }
  function sourceText(id: string) {
    const action = data.actions.find(a => a.id === id);
    if (action) return `${action.date || "Unscheduled"}: ${action.title} · ${action.outcome ?? "Unknown"}${action.amount === undefined ? "" : ` · ${action.amount} recorded`}${action.note ? ` — ${action.note}` : ""}`;
    return data.memories.find(m => m.id === id)?.text ?? data.messages.find(m => m.id === id)?.text ??
      goal.results.filter(r => r.id === id).map(r => `${r.date}: ${r.value} ${goal.measure?.unit ?? goal.unit ?? ""} — ${r.source}`)[0] ??
      goal.milestones.find(m => m.id === id)?.criterion ?? (id === goal.id ? goal.success : "This source record is no longer available.");
  }
  const work = planProgress(data, goal);
  const estimatedMinutes = work.reduce((sum, row) => sum + row.planned * row.step.durationMinutes, 0);
  return <div className="goal-plan">
    <section className="plan-status" aria-label="Goal status">
      <div><span>Your target</span><strong>{goal.measure ? `${goal.measure.target.toLocaleString()} ${goal.measure.unit}` : goal.success}</strong>
        <small>{goal.targetDate ? `${goal.deadline === "firm" ? "Firm deadline" : "Target date"} · ${formatDate(goal.targetDate, { month: "short", day: "numeric", year: "numeric" })}` : "No fixed deadline"}</small></div>
      <div><span>Actual result</span><strong>{actual === null ? "No result yet" : `${actual.toLocaleString()} ${goal.measure?.unit ?? goal.unit ?? "verified"}`}</strong>
        <small>{latest ? `Recorded ${formatDate(latest.date)} · ${latest.source}` : "Awaiting your first observation"}</small>
</div>
      <div><span>Expected achievement</span><strong>{forecast.expectedDate ? formatDate(forecast.expectedDate, { month: "short", day: "numeric", year: "numeric" }) : forecast.status === "beyond-horizon" ? "Beyond this forecast" : "Building the first estimate"}</strong>
        <small>{forecast.expectedDate ? forecast.method === "assumed-rate" ? "Initial scenario from your stated pace; not measured progress" : "Conditional on the observed pace and stated assumptions" : forecast.reason}</small>
        {previous && <small>{previous.expectedDate ? `Previously ${formatDate(previous.expectedDate)}` : "Previously unavailable"} · <a href="#forecast-evidence" onClick={() => setEvidenceOpen(true)}>See what changed</a></small>}</div>
    </section>
    <section className="panel plan-timeline" aria-label="Outcome timeline">
      <div className="list-heading"><h2>Progress and outlook</h2><span className="pace-badge neutral">{outlook}</span></div>
      <ProgressChart goal={goal} today={today} graphOnly forecast={forecast} alternativeForecast={scenario} />
      {forecast.expectedValue !== undefined && <p className="small-text">At this pace: {forecast.expectedValue.toLocaleString()} {goal.measure?.unit} by {formatDate(goal.targetDate!)}.</p>}
      <details id="forecast-evidence" className="quiet-disclosure" open={evidenceOpen} onToggle={event => setEvidenceOpen(event.currentTarget.open)}><summary>What informs the forecast?</summary>
        <p>{forecast.reason}</p>
        {previous && <div className="forecast-changes"><h3>What changed since the previous estimate</h3>
          {changedInputs.map(input => <p key={input.label}><b>{input.label}</b><br />Before: {input.before}<br />Now: {input.after}</p>)}
          {!changedInputs.length && <p>Before: {previous.reason}<br />Now: {forecast.reason}</p>}
        </div>}
        {forecast.earliestDate && <p>Observed-pace scenarios: {formatDate(forecast.earliestDate)}–{forecast.latestDate ? formatDate(forecast.latestDate) : "beyond the forecast horizon"}. This range is not a success probability.</p>}
        {forecast.inputs.map(input => <p key={input.label}><b>{input.label}:</b> {input.value}</p>)}
        {forecast.sourceIds.length > 0 && <details><summary>Source observations</summary>{forecast.sourceIds.map(id => <p key={id}>{sourceText(id)}</p>)}</details>}
        {!!goal.forecasts?.length && <details><summary>Earlier estimates</summary>{goal.forecasts.slice(-5).reverse().map((f, i) => <p key={i}>{formatDate(f.asOf)} · {f.expectedDate ? `Expected ${formatDate(f.expectedDate)}` : f.reason}</p>)}</details>}
      </details>
      {scenario && <div className="plan-scenario" role="status"><b>Proposed plan scenario</b><p>{scenario.expectedDate ? `Conditional finish: ${formatDate(scenario.expectedDate)}. ${scenario.reason}` : scenario.reason}</p><button className="text-link" onClick={() => setScenario(undefined)}>Close comparison</button></div>}
    </section>
    <section className="plan-approach" aria-label="Plan approach"><h2>The approach</h2><p>{adaptive?.approach ?? plan.basis?.strategy ?? goal.success}</p>
      {adaptive && <p className="muted small-text">{adaptive.window.rationale}</p>}
      {goal.milestones.length > 0 && <div className="plan-milestones" aria-label="Milestone path">
        {goal.milestones.map(m => <button key={m.id} className={milestone === m.id ? "selected" : ""} aria-pressed={milestone === m.id} onClick={() => setMilestone(milestone === m.id ? "" : m.id)}>
          <span>{m.done ? <Check size={15} /> : null}{m.title}</span><small>{m.done ? "Verified" : m.dueDate ? `Target ${formatDate(m.dueDate)}` : "Date to be established"}</small>
        </button>)}
      </div>}
      {milestone && <div className="plan-milestone-detail"><p>{goal.milestones.find(m => m.id === milestone)?.criterion}</p><Link className="text-link" to={`/app/coach?goal=${goal.id}`}>Discuss in Coach</Link></div>}
    </section>
    <div className={`plan-work-layout ${adaptive ? "" : "legacy-plan-work"}`}>
      {adaptive && <section className="panel plan-work" aria-label="Work in this plan">
        <h2>{adaptive.window.label}</h2><p className="small-text muted">{formatDate(adaptive.window.start)}–{formatDate(adaptive.window.end)} · {estimatedMinutes} / {adaptive.window.capacityMinutes} minutes{adaptive.window.capacityStatus === "provisional" ? " · Provisional capacity" : ""}</p>
        {work.filter(row => !milestone || row.step.milestoneId === milestone).map(row => <article className="plan-work-item" key={row.step.id}>
          <span className="small-text muted">{row.step.type === "behavior" ? "Repeating behavior" : "One-time task"}</span><h3>{row.step.title}</h3><p>{row.step.reason}</p>
          <p className="small-text">{row.step.durationMinutes} minutes · {row.step.cue}</p>
          <p className="plan-work-count">{row.done} / {row.planned} done{row.partial ? ` · ${row.partial} partial` : ""}{row.missed ? ` · ${row.missed} didn’t happen` : ""}{row.unknown ? ` · ${row.unknown} unknown` : ""}</p>
          {row.step.measure && <p className="small-text">{row.measured ? `${row.amount} ${row.step.measure.unit} recorded` : "No amount recorded yet"}{row.step.measure.target !== null ? ` · ${row.step.measure.target} per occurrence` : ""}</p>}
          {row.step.fallback && <p className="small-text muted">Smaller option: {row.step.fallback}</p>}
          <details className="quiet-disclosure"><summary>Dates and completion criteria</summary><p>Finished when: {row.step.criterion}</p>
            {row.actions.map(a => <div className="plan-occurrence" key={a.id}><span>{formatDate(a.date)} · {a.outcome ?? (actionReady(data, a) ? a.date < today ? "Unknown" : "Planned" : "Waiting for prerequisite")}</span>
              {!a.outcome && actionReady(data, a) && <Link to={`/app/goals/${goal.id}?action=${encodeURIComponent(a.id)}`}>Open action <ArrowRight size={13} /></Link>}
            </div>)}
          </details>
        </article>)}
        {milestone && !work.some(row => row.step.milestoneId === milestone) && <p>No work is committed to this milestone in the current window.</p>}
        {milestone && <button className="text-link" onClick={() => setMilestone("")}>Show all planned work</button>}
      </section>}
      <div className="plan-next-action">{children}</div>
    </div>
    <section className="panel plan-learning" id="plan-learning" aria-label="Learning and adaptations">
      <div className="list-heading"><h2>What we’re learning</h2><RefreshCw size={18} /></div>
      {adaptive && <><p>{adaptive.assessment.question}</p><p className="small-text muted">{goal.assessment?.nextAt === null ? "Waiting for your input or new evidence" : `Next assessment: ${new Date(goal.assessment?.nextAt ?? adaptive.assessment.at).toLocaleString(undefined, { timeZone: data.timeZone })}`}</p><p className="small-text">What we’ll reconsider: {adaptive.assessment.adaptation}</p></>}
      {goal.assessment?.summary && <p>{goal.assessment.summary}</p>}
      {!adaptive && <><h3>Review updated plan</h3><p>Adler can connect this goal to executable work, a suitable planning window, and regular feedback. Your results and booked work stay with the goal.</p></>}
      {!service?.coach.configured && service && <p className="small-text"><Link to="/app/settings/provider">Connect your coach</Link> to prepare and assess plans.</p>}
      {job && !pending.length && <p className="small-text" role="status">{job.status === "failed" ? "The automatic assessment could not finish. Your records are saved; you can review with Adler below." : "Adler has an assessment queued. Your current plan remains available."}</p>}
      {error && <p role="alert">{error}</p>}
      {pending.map(p => <article className="plan-adaptation" key={p.id}>
        <h3>{p.summary}</h3><ProposalChanges changes={p.changes} data={data} beforeRecords={p.before} />
        <div className="plan-actions"><button className="button primary" disabled={busy} onClick={() => void review(p, "approve")}>Accept updated plan <Check size={15} /></button>
          <Link className="button secondary" to={`/app/coach?goal=${goal.id}&prompt=${encodeURIComponent(`I want to discuss the proposed change: ${p.summary}`)}`}>Discuss changes</Link>
          <button className="text-link" disabled={busy} onClick={() => void review(p, "dismiss")}>Keep current plan</button>
          <button className="text-link" disabled={busy} onClick={() => void preview(p)}>Compare forecast</button></div>
      </article>)}
      {decisions.filter(d => d.insights?.length).map(d => <article className="plan-insight" key={d.id}>
        <small>{formatDate(d.date)} · {d.status}</small>
        {d.insights?.map((insight, i) => <div key={i}><p><b>{insight.status === "To test" ? "Explanation to test" : "Reported"}:</b> {insight.finding}</p>
          <details className="quiet-disclosure"><summary>Evidence behind this observation</summary>{insight.sourceIds.map(id => <p key={id}>{sourceText(id)}</p>)}</details></div>)}
      </article>)}
      {!pending.length && <Link className="text-link" to={`/app/coach?goal=${goal.id}&prompt=${encodeURIComponent(adaptive ? "Help me review my behavior and what we should adjust in this plan." : "Help me update this plan around my behavior and what you know about me. Preserve my history and bookings.")}`}>{adaptive ? "Continue in Coach" : "Discuss an updated plan"} <ArrowRight size={15} /></Link>}
    </section>
  </div>;
}
