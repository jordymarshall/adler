import { useEffect, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import { api } from "./api";
import { formatDate, useStore, type Data } from "./store";
import type { Proposal } from "../server/service";
import { ProposalChanges } from "./ProposalChanges";

export interface InsightRow {
  id: string;
  finding: string;
  status: string;
  sources: { label: string; text: string; href?: string }[];
  effect: ReactNode;
}
export function InsightsMatrix({ rows }: { rows: InsightRow[] }) {
  return (
    <div className="insights-matrix" aria-label="Insights and their effects">
      <div className="insights-column-heads" aria-hidden="true">
        <span>What we’ve learned</span>
        <span>Where it came from</span>
        <span>What changes as a result</span>
      </div>
      {rows.map((row) => (
        <article className="insight-row" key={row.id}>
          <div>
            <span
              className={`insight-status ${row.status === "To test" ? "hypothesis" : ""}`}
            >
              {row.status}
            </span>
            <h3>{row.finding}</h3>
          </div>
          <div className="insight-sources">
            {row.sources.map((source, i) => (
              <details key={i}>
                <summary>
                  {source.label}
                  <ChevronDown size={13} />
                </summary>
                <p>{source.text}</p>
                {source.href && <Link to={source.href}>Open source ↗</Link>}
              </details>
            ))}
          </div>
          <div className="insight-effect">{row.effect}</div>
        </article>
      ))}
    </div>
  );
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
      href: `/app/goals/${action.goalId}/plan`,
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
  const { data } = useStore();
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
    .filter(
      (d) =>
        goalId === "all" ||
        d.goalId === goalId ||
        proposals.some(
          (p) =>
            p.decisionId === d.id &&
            p.changes.some(
              (c) => (c.entity === "goal" ? c.id : c.parentId) === goalId,
            ),
        ),
    )
    .flatMap((decision) =>
      (decision.insights ?? []).map((insight, i) => {
        const proposal = proposals.find((p) => p.decisionId === decision.id);
        const changes = insight.changeIndexes.flatMap((index) =>
          proposal?.changes[index] ? [proposal.changes[index]] : [],
        );
        return {
          id: `${decision.id}-${i}`,
          finding: insight.finding,
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
    );
  return (
    <div className="insights-page">
      <div className="page-heading">
        <div>
          <span className="section-kicker">LEARN FROM WHAT HAPPENED</span>
          <h1>Insights</h1>
          <p>
            What Adler has learned, the records behind it, and the changes that
            followed.
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
      {rows.length ? (
        <section aria-label="Recorded insights">
          <h2 className="chart-screen-reader">Observations and plan changes</h2>
          <InsightsMatrix rows={rows} />
        </section>
      ) : (
        <div className="panel insights-empty">
          <h2>Start with what happened.</h2>
          <p>
            Tell Adler about a session, result, or obstacle. Useful observations
            will appear here with their sources and any changes to your plan.
          </p>
          <Link to={coachLink}>Share a check-in ↗</Link>
        </div>
      )}
    </div>
  );
}
