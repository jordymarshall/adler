import { useEffect, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import { api } from "./api";
import { formatDate, useStore, type Data } from "./store";
import type { Proposal } from "../server/service";
import { BehavioralRationale } from "./BehavioralRationale";
import { ProposalChanges } from "./ProposalChanges";
import type { CoachInsight } from "./program-types";
import type { ResearchSource } from "../shared/planning";
import { recordLink } from "../shared/record-links";
import "./learning-loops.css";
import { LearningDashboard, type LearningControl } from "./LearningDashboard";
import { currentLearningVersion, type LearningRecord } from "../shared/learning";

export interface InsightRow {
  id: string;
  finding: string;
  status: string;
  sources: { label: string; text: string; href?: string }[];
  effect: ReactNode;
  implication: string;
  implicationLabel: string;
  learning?: CoachInsight["learning"];
  resultSources: InsightRow["sources"];
  research: ResearchSource[];
  date: string;
  goalTitle: string;
  goalIds: string[];
}
export function InsightsMatrix({ rows }: { rows: InsightRow[] }) {
  const feedbackCount = rows.filter(row => row.learning?.result).length;
  useEffect(() => {
    function revealLinkedInsight() {
      const element = document.getElementById(location.hash.slice(1));
      if (element instanceof HTMLDetailsElement && element.classList.contains("learning-loop")) element.open = true;
    }
    revealLinkedInsight();
    addEventListener("hashchange", revealLinkedInsight);
    return () => removeEventListener("hashchange", revealLinkedInsight);
  }, [rows]);
  return <div className="learning-loops" aria-label="Learning experiments and their evidence">
    <header className="insights-overview-heading"><div><span className="section-kicker">WHAT SHAPES YOUR PLAN</span><h2>What we’re learning about you</h2></div><p>{rows.length} {rows.length === 1 ? "observation" : "observations"} · {feedbackCount} {feedbackCount === 1 ? "experiment" : "experiments"} with feedback</p></header>
    {rows.map(row => <details className="insight-row learning-loop" id={`learning-${row.id}`} key={row.id}>
      <summary className="insight-overview-summary">
        <span className="insight-overview-finding"><span className="insight-kind">{row.learning?.insight ? "Working insight" : row.learning || row.status === "To test" ? "Hypothesis" : "Your observation"}</span><small>{row.goalTitle} · {formatDate(row.date)}</small><strong>{row.learning?.insight ?? row.learning?.hypothesis ?? row.finding}</strong><span className="insight-status">{row.learning?.result ? "Feedback received" : row.learning ? "Earlier hypothesis" : row.status === "To test" ? "To test" : "Reported by you"} · {row.sources.length} {row.sources.length === 1 ? "source" : "sources"}</span></span>
        <ArrowRight className="insight-implication-arrow" size={18} aria-hidden="true" />
        <span className="insight-overview-implication"><small>{row.implicationLabel}</small><span>{row.implication}</span></span>
        <span className="insight-open-label"><span>View evidence & reasoning</span><ChevronDown size={17} aria-hidden="true" /></span>
      </summary>
      {row.learning?.previousInsightId && <a className="previous-loop" href={`#learning-${row.learning.previousInsightId}`}>↳ Builds on an earlier learning cycle</a>}
      <ol className="learning-canvas" role="list" aria-label="Coaching reasoning from evidence to the next test">
        <li className="learning-node observation-node">
          <div className="learning-stage"><b>01</b><span>OBSERVATION<small>Your reports</small></span></div>
          <div className="deduction-claim"><h3>What you reported</h3><p>{row.status === "Reported" ? row.finding : "Your check-ins provide the starting evidence."}</p></div>
          <aside className="deduction-evidence insight-sources" aria-label="Observation sources">{row.sources.map((source, index) => <details key={index}><summary>{source.label} <span>+</span></summary><p>{source.text}</p>{source.href && <Link to={source.href}>Open source ↗</Link>}</details>)}</aside>
        </li>
        <li className="learning-node hypothesis-node">
          <div className="learning-stage"><b>02</b><span>HYPOTHESIS<small>Possible explanation</small></span></div>
          <div className="deduction-claim"><h3>Based on that, Adler suspects…</h3><p>{row.learning?.hypothesis ?? (row.status === "To test" ? row.finding : "An explanation to explore with Adler.")}</p></div>
          <aside className="deduction-evidence"><b className="research-input-label">{row.learning?.reasoning || row.research.length ? "Behavioural science informs this hypothesis" : "Behavioural rationale not yet linked"}</b>{row.learning?.reasoning && <p>{row.learning.reasoning.mechanism}</p>}{row.learning?.reasoning && <BehavioralRationale reasoning={row.learning.reasoning} sources={row.research} />}{row.research.length > 0 ? <details className="learning-research"><summary>Research basis · {row.research.length} <span>+</span></summary>{row.research.map(source => <div key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a><p>{source.authors} · {source.year} · {source.access}</p><p>{source.summary}</p></div>)}</details> : <p>No literature linked yet.</p>}<small>Research informs the idea; it does not prove it applies to you.</small></aside>
        </li>
        <li className="learning-node experiment-node">
          <div className="learning-stage"><b>03</b><span>TEST<small>One change to try</small></span></div>
          <div className="deduction-claim"><h3>To test that explanation…</h3><p>{row.learning?.experiment ?? "Review a proposed adjustment with Adler."}</p></div>
          <aside className="deduction-evidence"><details className="loop-plan-change"><summary>Plan changes <span>+</span></summary>{row.effect}</details></aside>
        </li>
        <li className={`learning-node result-node ${row.learning?.result ? "has-feedback" : "awaiting-feedback"}`}>
          <div className="learning-stage"><b>04</b><span>RESULT<small>{row.learning?.result ? "Your follow-up" : "Awaiting feedback"}</small></span></div>
          <div className="deduction-claim"><h3>{row.learning?.result ? "What actually happened" : "The test needs your feedback"}</h3><p>{row.learning?.result?.summary ?? "A saved plan is not a result. Your next check-ins will provide the evidence."}</p></div>
          <aside className="deduction-evidence" aria-label="Experiment results">{row.resultSources.map((source, index) => <details key={index}><summary>{source.label} <span>+</span></summary><p>{source.text}</p>{source.href && <Link to={source.href}>Open result ↗</Link>}</details>)}</aside>
        </li>
        <li className="learning-node conclusion-node">
          <div className="learning-stage"><b>05</b><span>INFERENCE<small>Working insight</small></span></div>
          <div className="deduction-claim"><h3>What this evidence suggests</h3><p>{row.learning?.insight ?? "No conclusion yet. First, compare the feedback with the hypothesis."}</p></div>
          <aside className="deduction-evidence"><small>{row.learning?.insight ? "Tentative: other explanations may fit. Further reports can strengthen or change this interpretation." : "Pending evidence from the experiment."}</small></aside>
        </li>
        <li className="learning-node next-hypothesis-node">
          <div className="learning-stage"><b>06</b><span>NEXT QUESTION<small>Refine the hypothesis</small></span></div>
          <div className="deduction-claim"><h3>What to investigate next</h3><p>{row.learning?.nextHypothesis ?? "The next question follows from what we learn."}</p></div>
          <aside className="deduction-evidence"><small>The next experiment builds on this evidence. Earlier reasoning stays available.</small></aside>
        </li>
      </ol>
    </details>)}
  </div>;
}
function resolveSource(id: string, data: Data): InsightRow["sources"][number] {
  const memory = data.memories.find((m) => m.id === id);
  if (memory)
    return {
      label: `Saved context · ${formatDate(memory.date)}`,
      text: memory.text,
      href: `/app/insights#record-${encodeURIComponent(id)}`,
    };
  const message = data.messages.find((m) => m.id === id);
  if (message)
    return {
      label: `${message.role === "user" ? "You said" : "Adler replied"}${message.at ? ` · ${formatDate(message.at)}` : ""}`,
      text: message.text,
      href: `/app/check-in?${message.conversationId ? `chat=${encodeURIComponent(message.conversationId)}` : `goal=${encodeURIComponent(message.goalId)}`}`,
    };
  const action = data.actions.find((a) => a.id === id);
  if (action)
    return {
      label: `Check-in${action.date ? ` · ${formatDate(action.date)}` : ""}`,
      text: `${action.title}: ${action.outcome ?? "No outcome yet"}. ${action.note ?? ""}`,
      href: recordLink(data, id),
    };
  const block = data.workBlocks.find((b) => b.id === id);
  if (block)
    return {
      label: "Calendar block",
      text: `${block.action} · ${new Date(block.start).toLocaleString(undefined, { timeZone: data.timeZone })}`,
      href: `/app/calendar?goal=${block.goalId}`,
    };
  for (const goal of data.goals) {
    const result = goal.results.find((r) => r.id === id);
    if (result)
      return {
        label: `Result · ${formatDate(result.date)}`,
        text: `${result.value} ${goal.measure?.unit ?? goal.unit ?? "milestones verified"}. ${result.source}`,
        href: `/app/goals/${goal.id}/progress`,
      };
    const checkpoint = goal.checkpoints?.find((p) => p.id === id);
    const milestone = goal.milestones.find((m) => m.id === id);
    if (goal.id === id || checkpoint || milestone)
      return {
        label: checkpoint
          ? "Dated checkpoint"
          : milestone
            ? "Milestone"
            : "Goal definition",
        text: checkpoint
          ? `${checkpoint.value} due ${formatDate(checkpoint.date)}: ${checkpoint.label}`
          : milestone
            ? `${milestone.title} · ${milestone.criterion}`
            : goal.success,
        href: `/app/goals/${goal.id}/progress`,
      };
  }
  const program = data.programs.find((p) => `program-v${p.version}` === id);
  if (program)
    return {
      label: `Program v${program.version}`,
      text: `${program.sprintResult}. ${program.weeklyMinutes} minutes per week. ${program.approach}`,
      href: "/app/settings/coaching",
    };
  return {
    label: "Source removed",
    text: "The original record has been deleted. Review this insight before using it again.",
  };
}
export function Insights() {
  const { data, flush, refresh } = useStore();
  const [busy, setBusy] = useState(false);
  async function control(record: LearningRecord, action: LearningControl) {
    setBusy(true); setError("");
    try {
      await flush();
      await api("learning", { id: record.id, version: currentLearningVersion(record).version, action, requestId: crypto.randomUUID() });
      await refresh();
    } catch (error) { setError((error as Error).message); } finally { setBusy(false); }
  }
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const goalId = searchParams.get("goal") ?? "all";
  const coachLink = goalId === "all" ? "/app/check-in" : `/app/check-in?goal=${goalId}`;
  useEffect(() => {
    api<Proposal[]>("proposals")
      .then(setProposals)
      .catch((e) => setError(e.message));
  }, [data]);
  const rows: InsightRow[] = data.decisions
    .slice()
    .reverse()
    .filter(decision => !(data.learning ?? []).some(record => record.versions.some(version => version.decisionId === decision.id) || record.reviews.some(review => review.decisionId === decision.id)))
    .flatMap((decision) =>
      (decision.insights ?? []).map((insight, i) => {
        const proposal = proposals.find((p) => p.decisionId === decision.id);
        const changes = insight.changeIndexes.flatMap((index) =>
          proposal?.changes[index] ? [proposal.changes[index]] : [],
        );
        const affectedGoals = [...new Set(changes.map(change => change.entity === "goal" ? change.id : change.parentId).filter(Boolean))];
        const insightGoalId = affectedGoals.length === 1 ? affectedGoals[0]! : decision.goalId;
        return {
          id: `${decision.id}-${i}`,
          finding: insight.finding,
          implication: changes.length ? changes.map(change => change.reason).filter(Boolean).join(" ") || insight.learning?.experiment || "Review the linked plan change."
            : insight.learning?.experiment ?? "Keep this context in view when reviewing the next plan. No change is attached yet.",
          implicationLabel: changes.length ? proposal?.status === "applied" ? "In the saved plan" : proposal?.status === "pending" ? "Proposed adjustment" : "Previously considered adjustment" : "What to explore next",
          learning: insight.learning,
          resultSources: insight.learning?.result?.sourceIds.map(id => resolveSource(id, data)) ?? [],
          research: (decision.researchSources ?? []).filter(source => insight.learning?.researchSourceIds.includes(source.id)),
          date: decision.date,
          goalTitle: data.goals.find(g => g.id === insightGoalId)?.title ?? "Across your goals",
          goalIds: affectedGoals.length ? affectedGoals as string[] : [decision.goalId],
          status: insight.status,
          sources: insight.sourceIds.map((id) => resolveSource(id, data)),
          effect: (
            <>
              <span className="insight-change-status">
                {proposal?.status === "applied"
                  ? "Saved"
                  : proposal?.status === "pending"
                    ? "Proposed"
                    : proposal?.status === "stale"
                      ? "Needs a fresh review"
                      : proposal?.status === "dismissed"
                      ? "Not applied"
                      : "No plan change"}
              </span>
              {changes.length ? (
                <>
                  <p>
                    {changes
                      .map((c) => c.reason)
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                  <details className="insight-change-details">
                    <summary>
                      See{" "}
                      {changes.length === 1
                        ? "the change"
                        : `${changes.length} changes`}{" "}
                      <ArrowRight size={14} />
                    </summary>
                    <ProposalChanges
                      changes={changes}
                      data={data}
                      beforeRecords={
                        proposal?.before
                          ? insight.changeIndexes.map(
                              (index) => proposal.before![index],
                            )
                          : undefined
                      }
                    />
                  </details>
                  {proposal?.status === "pending" && (
                    <Link
                      to={`/app/check-in?${proposal.conversationId ? `chat=${proposal.conversationId}` : `goal=${proposal.goalId}`}`}
                    >
                      Review in chat ↗
                    </Link>
                  )}
                </>
              ) : (
                <p>
                  Keep this in view at the next review. No changes were attached
                  to this observation.
                </p>
              )}
            </>
          ),
        };
      }),
    ).filter(row => goalId === "all" || row.goalIds.includes(goalId));
  return (
    <div className="insights-page">
      <div className="page-heading">
        <div>
          <span className="section-kicker">LEARN FROM WHAT HAPPENED</span>
          <h1>Insights</h1>
          <p>
            Your experiences add up. See what Adler is learning, how it shapes your plan, and the evidence behind each working insight.
          </p>
        </div>
        <Link className="button secondary" to={coachLink}>
          Talk with Adler <ArrowRight size={16} />
        </Link>
      </div>
      <label className="insights-filter">
        Show
        <select
          value={goalId}
          onChange={(e) =>
            setSearchParams(
              e.target.value === "all" ? {} : { goal: e.target.value },
            )
          }
        >
          <option value="all">All goals</option>
          {data.goals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
      </label>
      {error && <p role="alert">{error}</p>}
      <LearningDashboard data={data} goalId={goalId} onControl={(record, action) => void control(record, action)} busy={busy} />
      {rows.length ? (
        <section aria-label="Recorded insights">
          <h2 className="chart-screen-reader">Observations and plan changes</h2>
          <InsightsMatrix rows={rows} />
        </section>
      ) : !(data.learning ?? []).some(record => goalId === "all" || record.goalIds.includes(goalId)) ? (
        <div className="panel insights-empty">
          <h2>Start with what happened.</h2>
          <p>
            Tell Adler about a session, result, or obstacle. Useful observations
            will appear here with their sources and any changes to your plan.
          </p>
          <Link to={coachLink}>Share a check-in ↗</Link>
        </div>
      ) : null}
    </div>
  );
}
