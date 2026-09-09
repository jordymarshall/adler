import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ChevronLeft, ChevronRight, Flame, Play } from "lucide-react";
import { currentPlan, formatDate, startGoal, useStore, type Goal, type Outcome } from "./store";
import { addDays, dateInZone } from "../shared/journey";
import { actionReady } from "../shared/adaptive-plan";
import { actionSeries, goalStreak, inputMeasure, reportedInput, planExperiment, planActionRecords } from "../shared/goal-view";
import { goalProjection } from "../shared/goal-projection";
import { currentLearningVersion, learningActionVersion, learningStatus, planNeedsReview, type LearningRecord } from "../shared/learning";
import { api } from "./api";
import type { Proposal } from "../server/service";
import { LearningDashboard, type LearningControl } from "./LearningDashboard";
import { ProposalChanges } from "./ProposalChanges";
import { GoalProjection, projectionDate } from "./GoalProjection";
import { GoalInputChart } from "./GoalInputChart";
import { GoalActionTimeline } from "./GoalActionTimeline";
import type { PlanEditScope } from "./PlanEditor";
import { GoalActionReport } from "./GoalActionReport";
import { PlanExplanation } from "./PlanExplanation";
import { BehavioralRationale } from "./BehavioralRationale";
import { Calendar, savedPending } from "./Calendar";
import { Modal } from "./components";
import "./goal-structure.css";
import "./coaching-learning.css";
import "./goal-views.css";

export function GoalPlan({ goal, actionId, onEdit, editRevision = 0 }: { goal: Goal; actionId?: string; onEdit: (scope: PlanEditScope) => void; editRevision?: number }) {
  const { data, commit, flush, refresh } = useStore();
  const current = currentPlan(goal);
  const pendingBooking = savedPending();
  const requested = data.actions.find(action => action.id === (actionId ?? (pendingBooking?.goalId === goal.id ? pendingBooking.id : undefined)) && action.goalId === goal.id);
  const today = dateInZone(data.timeZone);
  const [version, setVersion] = useState<number | null>(requested?.planVersion ?? null);
  const plan = goal.plans.find(plan => plan.version === version) ?? current;
  const historical = plan.version !== current.version;
  const [stepId, setStepId] = useState<string | undefined>(requested?.stepId ?? plan.adaptive?.projection?.driverStepId ?? plan.adaptive?.steps[0]?.id);
  const [milestoneId, setMilestoneId] = useState<string | undefined>(plan.adaptive?.steps.find(step => step.id === stepId)?.milestoneId);
  const steps = plan.adaptive?.steps.filter(step => !milestoneId || step.milestoneId === milestoneId) ?? [];
  const step = steps.find(step => step.id === stepId) ?? steps[0];
  const records = planActionRecords(data, goal, plan, step?.id, milestoneId);
  const hasWork = steps.length > 0 || !plan.adaptive && !!plan.action && !milestoneId;
  const [selection, setSelection] = useState(requested?.id);
  const action = records.find(action => action.id === selection) ?? records.find(action => action.date === today) ?? records.find(action => action.date > today) ?? records.at(-1);
  const [start, setStart] = useState(requested?.date ? addDays(requested.date, -7) : records.some(action => action.outcome) ? addDays(today, -7) : current.adaptive?.window.start ?? today);
  const end = addDays(start, 13);
  const series = actionSeries(data, goal, plan, step?.id, start, end, today, milestoneId);
  const measured = series.measure.metric !== "completion" && step?.type !== "task";
  const streak = goalStreak(data, goal, today);
  const [reporting, setReporting] = useState<Outcome | null>(null);
  const [schedule, setSchedule] = useState(pendingBooking?.goalId === goal.id);
  const [reasoning, setReasoning] = useState(false);
  const [learningId, setLearningId] = useState<string | null>(null);
  const [showProposal, setShowProposal] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const learning = (data.learning ?? []).filter(record => record.goalIds.includes(goal.id));
  const binding = planExperiment(data, goal, plan, step?.id, proposals);
  const related = binding?.record;
  const experiment = binding?.version;
  const experimentLabel = related && experiment?.version !== currentLearningVersion(related).version ? "Earlier experiment" : related ? learningStatus(related, today) : "";
  const chronology = [
    ...goal.plans.filter(item => item.action.trim()).map((item, index) => ({ id: `plan-${item.version}`, at: item.date, label: index === 0 ? "Starting plan" : "Plan updated", title: item.adaptive?.approach ?? item.action, plan: item, recordId: undefined as string | undefined })),
    ...learning.flatMap(record => record.reviews.map(review => ({ id: review.id, at: dateInZone(data.timeZone, new Date(review.at)), label: "Review saved", title: review.implication ?? review.summary, plan: undefined, recordId: record.id }))),
  ].sort((a, b) => a.at.localeCompare(b.at));
  const selectedLearning = learning.find(record => record.id === learningId);
  const reviewAt = related && ["paused", "closed", "declined"].includes(related.state) ? null : related ? related.reviews.filter(review => review.version === experiment?.version).at(-1)?.nextReviewAfter ?? experiment?.test.reviewAfter
    : goal.assessment?.nextAt === null ? null : goal.assessment?.nextAt ?? current.adaptive?.assessment.at;
  const milestone = goal.milestones.find(milestone => milestone.id === milestoneId);
  const outlook = goalProjection(data, goal, today);
  const delta = goal.targetDate && outlook.projection?.expectedDate ? Math.round((Date.parse(outlook.projection.expectedDate) - Date.parse(goal.targetDate)) / 86400000) : null;
  const coach = `/app/check-in?${new URLSearchParams({ goal: goal.id, ...(action ? { action: action.id } : {}) })}`;
  const pending = proposals.filter(proposal => proposal.status === "pending" && proposal.expires > Date.now() &&
    (proposal.goalId === goal.id || proposal.changes.some(change => change.parentId === goal.id || (change.entity === "goal" && change.id === goal.id))));
  useEffect(() => {
    if (!editRevision) return;
    setVersion(null); setSelection(undefined);
    if (!goal.milestones.some(milestone => milestone.id === milestoneId)) setMilestoneId(undefined);
    setStart(current.adaptive?.window.start ?? today);
  }, [editRevision]);
  useEffect(() => {
    let live = true;
    api<Proposal[]>("proposals").then(result => { if (live) setProposals(result); }).catch(e => { if (live) setError(e.message); });
    return () => { live = false; };
  }, [data]);
  async function decide(proposal: Proposal, choice: "approve" | "dismiss") {
    setBusy(true); setError("");
    try { await flush(); await api(`proposals/${proposal.id}/${choice}`, {}); await refresh(); setShowProposal(false); setVersion(null); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not update this plan."); }
    finally { setBusy(false); }
  }
  async function control(record: LearningRecord, action: LearningControl) {
    setBusy(true); setError("");
    try { await flush(); await api("learning", { id: record.id, version: learningActionVersion(record, action), action, requestId: crypto.randomUUID() }); await refresh(); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not update the experiment."); }
    finally { setBusy(false); }
  }
  function choosePlan(selected: typeof plan) {
    setVersion(selected.version === current.version ? null : selected.version);
    setStepId(selected.adaptive?.projection?.driverStepId ?? selected.adaptive?.steps[0]?.id);
    setMilestoneId(undefined);
    setSelection(undefined);
    setStart(selected.version === current.version ? addDays(today, -7) : selected.adaptive?.window.start ?? selected.date);
  }
  function selectAction(id: string) {
    const selected = data.actions.find(action => action.id === id)!;
    setSelection(id);
    if (selected.date < start || selected.date > end) setStart(addDays(selected.date, -7));
  }
  function chooseStep(id?: string, occurrenceId?: string) {
    setStepId(id);
    const occurrences = planActionRecords(data, goal, plan, id, milestoneId);
    const occurrence = occurrences.find(action => action.id === occurrenceId) ?? occurrences.find(action => action.date === today) ?? occurrences.find(action => action.date > today) ?? occurrences.at(-1);
    setSelection(occurrence?.id);
    if (occurrence?.date && (occurrence.date < start || occurrence.date > end)) setStart(occurrence.date);
  }
  function chooseMilestone(id?: string) {
    setMilestoneId(id);
    const selected = !id ? current : [...goal.plans].reverse().find(item => item.adaptive?.steps.some(step => step.milestoneId === id)) ?? current;
    const first = selected.adaptive?.steps.find(step => !id || step.milestoneId === id);
    setVersion(selected.version === current.version ? null : selected.version);
    setStepId(first?.id);
    setSelection(undefined);
    setStart(selected.adaptive?.window.start ?? selected.date);
  }
  const reportable = action && (!action.date || action.date <= today) && !action.retiredAt && goal.status === "Active" && actionReady(data, action);
  const actionPlan = action ? goal.plans.find(plan => plan.version === action.planVersion)! : plan;
  const block = data.workBlocks.find(block => block.id === action?.id);
  const amount = action && inputMeasure(actionPlan, action.stepId).metric !== "completion" ? reportedInput(action, inputMeasure(actionPlan, action.stepId).metric) : null;
  return <div className="goal-workspace-view">
    <aside className="goal-learning-rail" id="plan-learning" aria-label="Plan learning journey">
      <h2>Learning history</h2>
      {!chronology.length && <p className="small-text">Learning begins with your first actions.</p>}
      <ol className="goal-plan-journey">
        {chronology.map(item => <li key={item.id} className={item.plan?.version === plan.version ? "selected" : ""}>
          <button onClick={() => item.plan ? choosePlan(item.plan) : setLearningId(item.recordId!)} aria-pressed={item.plan?.version === plan.version}><small>{formatDate(item.at)} · {item.label}</small><strong title={item.title}>{item.title}</strong><span className={item.plan?.version === current.version && related ? "experiment-status" : ""}>{!item.plan ? "Inspect the evidence ↗" : item.plan.version === current.version && !historical && related ? experimentLabel : item.plan.version === current.version ? "Current plan" : "Earlier plan"}</span></button>
        </li>)}

        {reviewAt && <li><Link to={`${coach}&prompt=${encodeURIComponent(`Review the evidence for my current approach${related ? ` and experiment ${related.id}` : ""}. Keep unknowns separate from results.`)}`}><small>{formatDate(reviewAt)} · {historical ? "Planned review" : "Next review"}</small><strong>Review what’s working</strong></Link></li>}
      </ol>
      <Link className="text-link" to={`/app/insights?goal=${goal.id}`}>All insights for this goal ↗</Link>
      <GoalProjection data={data} goal={goal} today={today} compact />
    </aside>
    <section className="goal-action-canvas" id="goal-plan" aria-label="Goal and current cycle">
      <header className="action-canvas-heading">
        <div><small>{historical ? "EARLIER PLAN" : "YOUR PLAN"}</small><h2>{plan.adaptive ? "Milestones & actions" : plan.action ? "Your first action" : "Choose your first action"}</h2>
          {plan.adaptive && <span className="cycle-dates">{historical ? "Earlier cycle" : "Current cycle"} · {formatDate(plan.adaptive.window.start)}–{formatDate(plan.adaptive.window.end)}</span>}
        </div>
        <div className="plan-heading-controls">{!historical && <button className="button secondary" onClick={() => onEdit({ kind: "plan" })}>Edit plan</button>}{(plan.basis || plan.adaptive?.reasoning) && <button className="text-link" onClick={() => setReasoning(true)}>Inspect reasoning ↗</button>}</div>
      </header>
      {goal.milestones.length > 0 && <nav className="goal-milestone-nav" aria-label="Milestones">
        <div className="milestone-nav-label"><span>Plan milestones</span><button className="text-link" aria-pressed={!milestoneId} onClick={() => chooseMilestone()}>All actions</button></div>
        <ol>{goal.milestones.map((item, index) => <li key={item.id} className={`${item.done ? "complete" : ""} ${milestoneId === item.id ? "selected" : ""}`}>
          <button aria-pressed={milestoneId === item.id} onClick={() => chooseMilestone(item.id)}><span className="milestone-node">{item.done ? "✓" : index + 1}</span><small>Milestone {index + 1}{item.done ? " · Complete" : milestoneId === item.id ? " · Selected" : ""}</small><strong>{item.title}</strong><span>{item.dueDate ? `Target ${formatDate(item.dueDate)}` : "Date not set"}</span></button>
        </li>)}</ol>
      </nav>}
      {milestone && <div className="milestone-finish"><small>Milestone · Result to reach</small><span>{milestone.criterion}</span>{!historical && <button className="text-link" onClick={() => onEdit({ kind: "milestone", id: milestone.id })}>Edit milestone</button>}</div>}
      {pending.length > 0 && <div className="goal-pending-change"><span>{pending[0].summary}</span><button className="text-link" onClick={() => setShowProposal(true)}>Review suggested change ↗</button></div>}
      {!plan.action ? <div className="unplanned-goal"><strong>Goal saved</strong><p>Your outcome and target are saved. Choose the first useful work with your coach.</p><Link className="button primary" to={`${coach}&prompt=${encodeURIComponent("Help me choose the first useful work for this saved goal. Keep my outcome and deadline; ask only what changes the next useful action.")}`}>Plan first action ↗</Link></div> : <>
        {hasWork ? <section className="selected-action" aria-label="Selected action">
          <div><small>Action · Input to do · {action?.date === today ? "Today" : action?.date ? formatDate(action.date) : "Not scheduled"}</small><strong>{action?.title ?? step?.title ?? plan.action}</strong></div>
          <p>{action?.retiredAt && !action.outcome ? "Retired" : action?.outcome ?? (goal.status === "Draft" ? "Proposed" : block ? "Scheduled" : action?.date && action.date > today ? "Planned" : "No report yet")}{amount !== null ? ` · ${amount.toLocaleString()} ${inputMeasure(actionPlan, action?.stepId).unit}` : ""}{block ? ` · ${new Date(block.start).toLocaleString(undefined, { timeZone: data.timeZone, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}` : action?.timing ? ` · ${action.timing}` : ""}</p>
          <details className="action-finish"><summary>What counts as done</summary><p>{action?.criterion ?? step?.criterion ?? plan.criterion}</p></details>
          <div className="action-control-row">
            {reportable && <><button className="button primary" onClick={() => setReporting(action.outcome ?? "Done")}><Check size={15} />{action.outcome ? "Edit report" : measured ? "Report amount" : "Done"}</button>{!action.outcome && <button className="button secondary" onClick={() => setReporting("Didn’t happen")}>× Didn’t happen</button>}</>}
            {!historical && goal.status === "Draft" && (planNeedsReview(data, goal) ? <Link className="button primary" to={`${coach}&prompt=${encodeURIComponent("Update this draft using my corrected context before I start.")}`}>Review corrected plan ↗</Link> : <button className="button primary" onClick={() => commit(d => startGoal(d, goal.id), "Plan started.")}><Play size={15} />Start plan</button>)}
            {!historical && ["Draft", "Active"].includes(goal.status) && <button className="button secondary" onClick={() => onEdit({ kind: "action", id: step?.id })}>Edit action</button>}
            {!historical && goal.status === "Active" && action && !action.outcome && !action.retiredAt && !action.startedAt && !data.workBlocks.some(block => block.id === action.id) && actionReady(data, action) && <button className="button secondary" onClick={() => setSchedule(true)}>Add to calendar</button>}
            <Link className="text-link" to={`${coach}&prompt=${encodeURIComponent(`I want to discuss ${action?.title ?? step?.title ?? plan.action}.`)}`}>Discuss with Coach ↗</Link>
          </div>
        </section> : <div className="unplanned-goal"><p>No actions are linked to this milestone yet.</p><Link className="text-link" to={`${coach}&prompt=${encodeURIComponent(`Help me plan the actions contributing to milestone ${milestone?.title}. Keep the goal unchanged.`)}`}>Plan its actions ↗</Link></div>}
      </>}
      {hasWork && <div className="goal-window-controls"><button aria-label="Previous two weeks" onClick={() => setStart(addDays(start, -14))}><ChevronLeft size={16} /></button><strong>{formatDate(start)}–{formatDate(end)}</strong><button aria-label="Next two weeks" onClick={() => setStart(addDays(start, 14))}><ChevronRight size={16} /></button><button onClick={() => { choosePlan(current); setStart(addDays(today, -7)); }}>Today</button></div>}
      {hasWork && (steps.length > 1 || step?.type === "task" || !plan.adaptive) && <GoalActionTimeline data={data} goal={goal} plan={plan} steps={steps} start={start} end={end} today={today} selectedStepId={step?.id} milestoneId={milestoneId} onSelect={chooseStep} />}
      {step?.type === "behavior" && <div id="goal-progress"><GoalInputChart series={series} onSelect={selectAction} /></div>}
      {related && !historical && <div className="experiment-strip"><span className="experiment-status">{experimentLabel}</span><span>{related.standing === "reconsider" ? "The evidence behind this explanation changed." : records.some(action => action.outcome) ? "Reports saved for the next review" : "Waiting for your first report"}</span><button className="text-link" onClick={() => setLearningId(related.id)}>Review ↗</button></div>}
      {step?.type === "behavior" && <><div className="action-days-scroll">
        <div className="action-days" role="group" aria-label="Dated action reports">
          <div className="action-days-label"><small>Action · {step?.type === "behavior" ? "Ongoing" : "One time"}</small><strong>Daily reports</strong></div>
          {series.points.map(point => <div className="action-day" key={point.date}><time dateTime={point.date}>{formatDate(point.date)}</time>{point.actions.length ? point.actions.map(item => {
            const savedMeasure = inputMeasure(goal.plans.find(plan => plan.version === item.planVersion)!, item.stepId);
            const quantity = item.date <= today ? reportedInput(item, savedMeasure.metric) : null;
            return <button key={item.id} className={`action-cell ${item.retiredAt && !item.outcome ? "retired" : item.outcome === "Done" ? "done" : item.outcome === "Partly" ? "partial" : item.outcome ? "missed" : "unknown"} ${action?.id === item.id ? "selected" : ""}`} onClick={() => selectAction(item.id)} aria-pressed={action?.id === item.id} aria-label={`${formatDate(item.date)}: ${item.title}, ${item.retiredAt && !item.outcome ? "retired" : item.outcome ?? (item.date > today ? "planned" : "no report")}${quantity !== null ? `, ${quantity} ${savedMeasure.unit}` : ""}`}><strong>{quantity !== null && savedMeasure.metric !== "completion" ? quantity.toLocaleString() : item.retiredAt && !item.outcome ? "—" : item.outcome === "Done" ? "✓" : item.outcome === "Partly" ? "◐" : item.outcome ? "×" : item.date > today ? "·" : "?"}</strong>{quantity !== null && savedMeasure.metric !== "completion" && <small>{savedMeasure.unit}</small>}</button>;
          }) : <span className="action-day-empty" title={point.off ? "Day off" : point.scheduled ? "Expected action record is missing" : "Outside the saved plan"}>{point.off ? "○" : point.scheduled ? "?" : "—"}</span>}</div>)}
        </div>
        {step?.type === "behavior" && <div className="goal-streak-row"><div><span className="goal-streak"><Flame aria-hidden="true" size={24} fill="currentColor" />{streak.count}</span><small>{streak.count === 1 ? "day" : "days"} on plan</small></div>{series.points.map(point => { const day = streak.days.find(day => day.date === point.date); return <span key={point.date} className={`streak-day ${day?.streak && ["on", "off"].includes(day.status) ? "on" : ""}`} title={day ? { on: "On plan", off: "Planned day off", short: "Below the planned work", unknown: "Report not yet known" }[day.status] : "Future day"} />; })}</div>}
      </div>
      <div className="action-day-legend"><span>✓ Done</span><span>◐ Partial</span><span>× Didn’t happen</span><span>? No report</span><span>· Planned</span><span>○ Day off</span>{historical && <span>— Retired</span>}</div></>}
      {outlook.projection && <section className="milestone-implication" aria-label="Milestone and goal outlook">
        <div className="goal-date-implication"><div><small>Goal target</small><strong>{goal.targetDate ? formatDate(goal.targetDate, { month: "short", day: "numeric", year: "numeric" }) : "Flexible"}</strong></div><span className="date-impact">{delta !== null && <span>{delta === 0 ? "Same date" : `${Math.abs(delta)} days ${delta > 0 ? "later" : "earlier"}`}</span>}<ArrowRight size={22} /></span><div><small>{outlook.evidence?.paceSource === "Observed input pace" ? "If your reported pace continues" : "Conditional goal outlook"}</small><strong>{outlook.projection ? projectionDate(outlook.projection.expectedDate) : "Finish not yet estimated"}</strong></div></div>
        <div className="implication-footer"><span>{outlook.projection ? `Scenario range · ${projectionDate(outlook.projection.earliestDate)}–${projectionDate(outlook.projection.latestDate)}` : "More action and outcome context may help establish an estimate."}</span><Link className="button secondary" to={`${coach}&prompt=${encodeURIComponent("Review my reported work, next milestone and the goal outlook. Explain what is supported and what remains unknown before suggesting an adjustment.")}`}>Review with Coach ↗</Link></div>
      </section>}
    </section>
    {error && <p className="goal-view-error" role="alert">{error}</p>}
    {reporting && action && <GoalActionReport key={action.id} action={action} outcome={reporting} onClose={() => setReporting(null)} />}
    {schedule && action && <Modal title="Schedule action" wide onClose={() => setSchedule(false)}><p><strong>{action.title}</strong></p><Calendar embedded goalId={goal.id} actionId={action.id} onDone={() => setSchedule(false)} /></Modal>}
    {reasoning && <Modal title={historical ? "Reasoning for this earlier plan" : "Why this plan?"} onClose={() => setReasoning(false)}>{plan.basis ? <PlanExplanation basis={plan.basis} reasoning={plan.adaptive?.reasoning} /> : plan.adaptive?.reasoning ? <BehavioralRationale reasoning={plan.adaptive.reasoning} sources={data.decisions.find(decision => decision.goalId === goal.id && decision.planVersion === plan.version)?.researchSources} /> : <p>This plan records your chosen work. No behavioural interpretation is saved for this version.</p>}{plan.adaptive && <><h3>Planning window</h3><p>{plan.adaptive.window.rationale}</p><h3>Next review</h3><p>{plan.adaptive.assessment.question}</p></>}{related && <button className="text-link" onClick={() => { setReasoning(false); setLearningId(related.id); }}>Inspect the saved experiment ↗</button>}</Modal>}
    {selectedLearning && <Modal title="Experiment & evidence" onClose={() => setLearningId(null)}>{error && <p role="alert">{error}</p>}<LearningDashboard data={data} goalId={goal.id} recordId={selectedLearning.id} onControl={(record, action) => void control(record, action)} busy={busy} /></Modal>}
    {showProposal && <Modal title="Suggested plan change" onClose={() => setShowProposal(false)}>{error && <p role="alert">{error}</p>}{pending.map(proposal => <article className="plan-adaptation" key={proposal.id}><h3>{proposal.summary}</h3><ProposalChanges changes={proposal.changes} data={data} beforeRecords={proposal.before} /><div className="plan-actions"><button className="button primary" disabled={busy} onClick={() => void decide(proposal, "approve")}>Accept updated plan <Check size={15} /></button><Link className="button secondary" to={`${coach}&prompt=${encodeURIComponent(`Discuss the suggested change: ${proposal.summary}`)}`}>Discuss changes</Link><button className="text-link" disabled={busy} onClick={() => void decide(proposal, "dismiss")}>Keep current plan</button></div></article>)}</Modal>}
  </div>;
}
