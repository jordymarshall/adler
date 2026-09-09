import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { currentPlan, formatDate, useStore, type Goal, type Outcome } from "./store";
import { addDays, dateInZone } from "../shared/journey";
import { actionReady } from "../shared/adaptive-plan";
import { actionSeries, goalStreak, inputMeasure, reportedInput, planExperiment } from "../shared/goal-view";
import { goalProjection } from "../shared/goal-projection";
import { currentLearningVersion, learningActionVersion, learningStatus, type LearningRecord } from "../shared/learning";
import { api } from "./api";
import type { Proposal } from "../server/service";
import { LearningDashboard, type LearningControl } from "./LearningDashboard";
import { ProposalChanges } from "./ProposalChanges";
import { GoalProjection, projectionDate } from "./GoalProjection";
import { GoalInputChart } from "./GoalInputChart";
import { GoalActionReport } from "./GoalActionReport";
import { GoalOverview } from "./GoalOverview";
import { PlanExplanation } from "./PlanExplanation";
import { BehavioralRationale } from "./BehavioralRationale";
import { Calendar } from "./Calendar";
import { Modal } from "./components";
import "./goal-structure.css";
import "./coaching-learning.css";
import "./goal-views.css";

export function GoalPlan({ goal, actionId, onEdit }: { goal: Goal; actionId?: string; onEdit: (stepId?: string) => void }) {
  const { data, flush, refresh } = useStore();
  const current = currentPlan(goal);
  const requested = data.actions.find(action => action.id === actionId && action.goalId === goal.id);
  const today = dateInZone(data.timeZone);
  const [version, setVersion] = useState<number | null>(requested?.planVersion ?? null);
  const plan = goal.plans.find(plan => plan.version === version) ?? current;
  const historical = plan.version !== current.version;
  const [stepId, setStepId] = useState<string | undefined>(requested?.stepId ?? current.adaptive?.projection?.driverStepId ?? current.adaptive?.steps[0]?.id);
  const step = plan.adaptive?.steps.find(step => step.id === stepId) ?? plan.adaptive?.steps[0];
  const records = data.actions.filter(action => action.goalId === goal.id && action.stepId === step?.id && (!action.retiredAt || action.outcome))
    .sort((a, b) => a.date.localeCompare(b.date));
  const [selection, setSelection] = useState(actionId);
  const visibleRecords = historical ? data.actions.filter(action => action.goalId === goal.id && action.stepId === step?.id && action.planVersion <= plan.version).sort((a, b) => a.date.localeCompare(b.date)) : records;
  const action = visibleRecords.find(action => action.id === selection) ?? visibleRecords.find(action => action.date === today) ?? visibleRecords.find(action => action.date > today) ?? visibleRecords.at(-1);
  const [start, setStart] = useState(addDays(requested?.date || today, -7));
  const end = addDays(start, 13);
  const series = actionSeries(data, goal, plan, step?.id, start, end, today);
  const measured = series.measure.metric !== "completion" && step?.type !== "task";
  const streak = goalStreak(data, goal, today);
  const [reporting, setReporting] = useState<Outcome | null>(null);
  const [schedule, setSchedule] = useState(false);
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
    ...goal.plans.map((item, index) => ({ id: `plan-${item.version}`, at: item.date, label: index === 0 ? "Starting plan" : "Plan updated", title: item.adaptive?.approach ?? item.action, plan: item, recordId: undefined as string | undefined })),
    ...learning.flatMap(record => record.reviews.map(review => ({ id: review.id, at: dateInZone(data.timeZone, new Date(review.at)), label: "Review saved", title: review.implication ?? review.summary, plan: undefined, recordId: record.id }))),
  ].sort((a, b) => a.at.localeCompare(b.at));
  const selectedLearning = learning.find(record => record.id === learningId);
  const reviewAt = related && ["paused", "closed", "declined"].includes(related.state) ? null : related ? related.reviews.filter(review => review.version === experiment?.version).at(-1)?.nextReviewAfter ?? experiment?.test.reviewAfter
    : goal.assessment?.nextAt === null ? null : goal.assessment?.nextAt ?? current.adaptive?.assessment.at;
  const milestone = goal.milestones.find(milestone => milestone.id === step?.milestoneId) ?? goal.milestones.find(milestone => !milestone.done);
  const outlook = goalProjection(data, goal, today);
  const delta = goal.targetDate && outlook.projection?.expectedDate ? Math.round((Date.parse(outlook.projection.expectedDate) - Date.parse(goal.targetDate)) / 86400000) : null;
  const coach = `/app/check-in?${new URLSearchParams({ goal: goal.id, ...(action ? { action: action.id } : {}) })}`;
  const pending = proposals.filter(proposal => proposal.status === "pending" && proposal.expires > Date.now() &&
    (proposal.goalId === goal.id || proposal.changes.some(change => change.parentId === goal.id || (change.entity === "goal" && change.id === goal.id))));
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
    setSelection(undefined);
    setStart(selected.version === current.version ? addDays(today, -7) : selected.adaptive?.window.start ?? selected.date);
  }
  function selectAction(id: string) {
    const selected = data.actions.find(action => action.id === id)!;
    setSelection(id);
    if (selected.date < start || selected.date > end) setStart(addDays(selected.date, -7));
  }
  const reportable = action && (!action.date || action.date <= today) && !action.retiredAt && goal.status === "Active" && actionReady(data, action);
  const actionPlan = action ? goal.plans.find(plan => plan.version === action.planVersion)! : plan;
  const amount = action ? reportedInput(action, inputMeasure(actionPlan, action.stepId).metric) : null;
  return <div className="goal-workspace-view">
    <aside className="goal-learning-rail" id="plan-learning" aria-label="Plan learning journey">
      <h2>How the plan is evolving</h2>
      <ol className="goal-plan-journey">
        {chronology.map(item => <li key={item.id} className={item.plan?.version === plan.version ? "selected" : ""}>
          <button onClick={() => item.plan ? choosePlan(item.plan) : setLearningId(item.recordId!)} aria-pressed={item.plan?.version === plan.version}><small>{formatDate(item.at)} · {item.label}</small><strong title={item.title}>{item.title}</strong><span className={item.plan?.version === current.version && related ? "experiment-status" : ""}>{!item.plan ? "Inspect the evidence ↗" : item.plan.version === current.version && !historical && related ? experimentLabel : item.plan.version === current.version ? "Current approach" : "Earlier approach"}</span></button>
        </li>)}

        {reviewAt && <li><Link to={`${coach}&prompt=${encodeURIComponent(`Review the evidence for my current approach${related ? ` and experiment ${related.id}` : ""}. Keep unknowns separate from results.`)}`}><small>{formatDate(reviewAt)} · {historical ? "Planned review" : "Next review"}</small><strong>Keep, adjust or ask</strong><span>Based on what you report</span></Link></li>}
      </ol>
      <Link className="text-link" to={`/app/insights?goal=${goal.id}`}>All insights for this goal ↗</Link>
      <GoalProjection data={data} goal={goal} today={today} compact />
    </aside>
    <section className="goal-action-canvas" id="goal-plan" aria-label="Goal and current cycle">
      <header className="action-canvas-heading">
        <div><small>{historical ? "EARLIER APPROACH" : "CURRENT APPROACH"}{plan.adaptive ? ` · ${plan.adaptive.window.label}` : " · FIRST ACTION"}</small><h2>{experiment?.test.change ?? plan.adaptive?.approach ?? plan.action}</h2>
          {plan.adaptive && <span className="cycle-dates">{formatDate(plan.adaptive.window.start)}–{formatDate(plan.adaptive.window.end)}</span>}
          <div className="action-context"><label>Action {plan.adaptive ? <select aria-label="Action in this plan" value={step?.id} onChange={event => { setStepId(event.target.value); setSelection(undefined); }}>{plan.adaptive.steps.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select> : <strong>{plan.action}</strong>}</label>{milestone && <span>Milestone · {milestone.title}</span>}</div>
        </div>
        <button className="button secondary" onClick={() => setReasoning(true)}>Inspect reasoning ↗</button>
      </header>
      {pending.length > 0 && <div className="goal-pending-change"><span>{pending[0].summary}</span><button className="text-link" onClick={() => setShowProposal(true)}>Review suggested change ↗</button></div>}
      {goal.status === "Draft" || !plan.adaptive ? <GoalOverview goal={goal} actionId={actionId} /> : <section className="selected-action" aria-label="Selected action">
        {action ? <><div><small>{action.date === today ? "Today" : action.date ? formatDate(action.date) : "Unscheduled"} · Action</small><strong>{action.title}</strong></div><p>{action.outcome ?? (action.date > today ? "Planned" : "No report yet")}{amount !== null ? ` · ${amount.toLocaleString()} ${inputMeasure(actionPlan, action.stepId).unit}` : ""} · {action.timing}</p>
          <div className="action-control-row">
            {reportable && <><button className="button primary" onClick={() => setReporting(action.outcome ?? "Done")}><Check size={15} />{action.outcome ? "Edit report" : measured ? "Report amount" : "Done"}</button>{!action.outcome && <button className="button secondary" onClick={() => setReporting("Didn’t happen")}>× Didn’t happen</button>}</>}
            {!historical && goal.status === "Active" && <><button className="button secondary" onClick={() => onEdit(step?.id)}>Edit plan</button>{!action.outcome && !action.retiredAt && !action.startedAt && !data.workBlocks.some(block => block.id === action.id) && actionReady(data, action) && <button className="button secondary" onClick={() => setSchedule(true)}>Add to calendar</button>}</>}
            <Link className="text-link" to={`${coach}&prompt=${encodeURIComponent(`I want to discuss ${action.title}${action.date ? ` on ${action.date}` : ""}.`)}`}>Discuss with Coach ↗</Link>
          </div></> : <div><strong>{step?.title ?? plan.action}</strong><p>No action record in this period.</p><Link className="text-link" to={coach}>Plan the next step ↗</Link></div>}
      </section>}
      <div className="goal-window-controls"><button aria-label="Previous two weeks" onClick={() => setStart(addDays(start, -14))}><ChevronLeft size={16} /></button><strong>{formatDate(start)}–{formatDate(end)}</strong><button aria-label="Next two weeks" onClick={() => setStart(addDays(start, 14))}><ChevronRight size={16} /></button><button onClick={() => { setVersion(null); setStart(addDays(today, -7)); setSelection(undefined); }}>Today</button></div>
      {step?.type === "behavior" && <div id="goal-progress"><GoalInputChart series={series} onSelect={selectAction} /></div>}
      {related && !historical && <div className="experiment-strip"><span className="experiment-status">{experimentLabel}</span><span>{related.standing === "reconsider" ? "The evidence behind this explanation changed." : "Your reports inform the next review; agreement alone is not a result."}</span><button className="text-link" onClick={() => setLearningId(related.id)}>Review ↗</button></div>}
      <div className="action-days-scroll">
        <div className="action-days" role="group" aria-label="Dated action reports">
          <div className="action-days-label"><small>Action · {step?.type === "behavior" ? "Ongoing" : "One time"}</small><strong>{step?.title ?? plan.action}</strong></div>
          {series.points.map(point => <div className="action-day" key={point.date}><time dateTime={point.date}>{formatDate(point.date)}</time>{point.actions.length ? point.actions.map(item => {
            const savedMeasure = inputMeasure(goal.plans.find(plan => plan.version === item.planVersion)!, item.stepId);
            const quantity = item.date <= today ? reportedInput(item, savedMeasure.metric) : null;
            return <button key={item.id} className={`action-cell ${item.retiredAt && !item.outcome ? "retired" : item.outcome === "Done" ? "done" : item.outcome === "Partly" ? "partial" : item.outcome ? "missed" : "unknown"} ${action?.id === item.id ? "selected" : ""}`} onClick={() => selectAction(item.id)} aria-pressed={action?.id === item.id} aria-label={`${formatDate(item.date)}: ${item.title}, ${item.retiredAt && !item.outcome ? "retired" : item.outcome ?? (item.date > today ? "planned" : "no report")}${quantity !== null ? `, ${quantity} ${savedMeasure.unit}` : ""}`}><strong>{quantity !== null && savedMeasure.metric !== "completion" ? quantity.toLocaleString() : item.retiredAt && !item.outcome ? "—" : item.outcome === "Done" ? "✓" : item.outcome === "Partly" ? "◐" : item.outcome ? "×" : item.date > today ? "·" : "?"}</strong>{quantity !== null && savedMeasure.metric !== "completion" && <small>{savedMeasure.unit}</small>}</button>;
          }) : <span className="action-day-empty" title={point.off ? "Day off" : point.scheduled ? "Expected action record is missing" : "Outside the saved plan"}>{point.off ? "○" : point.scheduled ? "?" : "—"}</span>}</div>)}
        </div>
        {step?.type === "behavior" && <div className="goal-streak-row"><div><span className="goal-streak"><Flame aria-hidden="true" size={24} fill="currentColor" />{streak.count}</span><small>{streak.count === 1 ? "day" : "days"} on plan</small></div>{series.points.map(point => { const day = streak.days.find(day => day.date === point.date); return <span key={point.date} className={`streak-day ${day?.streak && ["on", "off"].includes(day.status) ? "on" : ""}`} title={day ? { on: "On plan", off: "Planned day off", short: "Below the planned work", unknown: "Report not yet known" }[day.status] : "Future day"} />; })}</div>}
      </div>
      <div className="action-day-legend"><span>✓ Done</span><span>◐ Partial</span><span>× Didn’t happen</span><span>? No report</span><span>· Planned</span><span>○ Day off</span>{historical && <span>— Retired</span>}</div>
      <section className="milestone-implication" aria-label="Milestone and goal outlook">
        {milestone && <div className="next-milestone"><small>{milestone.done ? "Verified milestone" : "Next milestone"}</small><strong>{milestone.title}</strong>{milestone.dueDate && <span>Target · {formatDate(milestone.dueDate)}</span>}<details><summary>What counts & what follows</summary><p>{milestone.criterion}</p><p>Action reports do not confirm this milestone. Its finish is not separately estimated from the goal outlook below.</p>{goal.milestones.filter(item => item.id !== milestone.id).map(item => <p key={item.id}>{item.done ? "✓" : "→"} {item.title}{item.dueDate ? ` · ${formatDate(item.dueDate)}` : ""}</p>)}</details></div>}
        <div className="goal-date-implication"><div><small>Goal target</small><strong>{goal.targetDate ? formatDate(goal.targetDate, { month: "short", day: "numeric", year: "numeric" }) : "Flexible"}</strong></div><span className="date-impact">{delta !== null && <span>{delta === 0 ? "Same date" : `${Math.abs(delta)} days ${delta > 0 ? "later" : "earlier"}`}</span>}<ArrowRight size={22} /></span><div><small>{outlook.evidence?.paceSource === "Observed input pace" ? "If your reported pace continues" : "Conditional goal outlook"}</small><strong>{outlook.projection ? projectionDate(outlook.projection.expectedDate) : "Finish not yet estimated"}</strong></div></div>
        <div className="implication-footer"><span>{outlook.projection ? `Scenario range · ${projectionDate(outlook.projection.earliestDate)}–${projectionDate(outlook.projection.latestDate)}` : "More action and outcome context may help establish an estimate."}</span><Link className="button secondary" to={`${coach}&prompt=${encodeURIComponent("Review my reported work, next milestone and the goal outlook. Explain what is supported and what remains unknown before suggesting an adjustment.")}`}>Review with Coach ↗</Link></div>
      </section>
    </section>
    {error && <p className="goal-view-error" role="alert">{error}</p>}
    {reporting && action && <GoalActionReport key={action.id} action={action} outcome={reporting} onClose={() => setReporting(null)} />}
    {schedule && action && <Modal title="Schedule action" onClose={() => setSchedule(false)}><p><strong>{action.title}</strong></p><Calendar embedded goalId={goal.id} actionId={action.id} onDone={() => setSchedule(false)} /></Modal>}
    {reasoning && <Modal title={historical ? "Reasoning for this earlier plan" : "Why this approach?"} onClose={() => setReasoning(false)}>{plan.basis ? <PlanExplanation basis={plan.basis} reasoning={plan.adaptive?.reasoning} /> : plan.adaptive?.reasoning ? <BehavioralRationale reasoning={plan.adaptive.reasoning} sources={data.decisions.find(decision => decision.goalId === goal.id && decision.planVersion === plan.version)?.researchSources} /> : <p>This plan records your chosen work. No behavioural interpretation is saved for this version.</p>}{plan.adaptive && <><h3>Planning window</h3><p>{plan.adaptive.window.rationale}</p><h3>Next review</h3><p>{plan.adaptive.assessment.question}</p></>}{related && <button className="text-link" onClick={() => { setReasoning(false); setLearningId(related.id); }}>Inspect the saved experiment ↗</button>}</Modal>}
    {selectedLearning && <Modal title="Experiment & evidence" onClose={() => setLearningId(null)}>{error && <p role="alert">{error}</p>}<LearningDashboard data={data} goalId={goal.id} recordId={selectedLearning.id} onControl={(record, action) => void control(record, action)} busy={busy} /></Modal>}
    {showProposal && <Modal title="Suggested plan change" onClose={() => setShowProposal(false)}>{error && <p role="alert">{error}</p>}{pending.map(proposal => <article className="plan-adaptation" key={proposal.id}><h3>{proposal.summary}</h3><ProposalChanges changes={proposal.changes} data={data} beforeRecords={proposal.before} /><div className="plan-actions"><button className="button primary" disabled={busy} onClick={() => void decide(proposal, "approve")}>Accept updated plan <Check size={15} /></button><Link className="button secondary" to={`${coach}&prompt=${encodeURIComponent(`Discuss the suggested change: ${proposal.summary}`)}`}>Discuss changes</Link><button className="text-link" disabled={busy} onClick={() => void decide(proposal, "dismiss")}>Keep current plan</button></div></article>)}</Modal>}
  </div>;
}
