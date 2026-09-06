import { BookOpen, FlaskConical } from "lucide-react";
import type { PlanningBasis } from "../shared/planning";
import { formatDate } from "./store";

export function PlanExplanation({ basis }: { basis: PlanningBasis }) {
  return (
    <section className="panel plan-explanation" aria-label="Why this plan">
      <div className="list-heading">
        <h2>
          <FlaskConical size={20} /> Why this plan?
        </h2>
        <span className="tag">A testable approach</span>
      </div>
      <p>{basis.interpretation}</p>
      <div className="explanation-grid">
        <div>
          <span className="section-kicker">THE APPROACH</span>
          <p>{basis.strategy}</p>
        </div>
        <div>
          <span className="section-kicker">WHY THIS MEASUREMENT</span>
          <p>{basis.outcomeRationale}</p>
        </div>
      </div>
      {basis.actionMeasure && (
        <div className="action-measure-summary">
          <b>What to record during each action: {basis.actionMeasure.label}</b>
          <p>{basis.actionMeasure.rationale}</p>
          <span className="field-hint">
            {basis.actionMeasure.target === null
              ? "No numeric target proposed"
              : `Suggested target: ${basis.actionMeasure.target} ${basis.actionMeasure.unit} per ${basis.actionMeasure.period}`}
          </span>
        </div>
      )}
      <details className="explanation-details">
        <summary>Alternatives Adler considered</summary>
        {basis.alternatives.map((alternative, index) => (
          <div key={index}>
            <b>{alternative.option}</b>
            <p>{alternative.tradeoff}</p>
          </div>
        ))}
      </details>
      <details className="explanation-details">
        <summary>
          <BookOpen size={16} /> Research & applicability ·{" "}
          {basis.evidence.length} sources
        </summary>
        {!basis.evidence.length && (
          <p>
            No directly applicable source was cited. Read the uncertainty below
            before deciding whether to try this approach.
          </p>
        )}
        {basis.evidence.map((evidence, index) => {
          const source = basis.sources?.find((s) => s.id === evidence.sourceId);
          return (
            <article className="research-source" key={index}>
              {source ? (
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.title} ↗
                </a>
              ) : (
                <b>Source details unavailable</b>
              )}
              {source && (
                <p className="field-hint">
                  {source.authors} · {source.year} · {source.kind} · Read:{" "}
                  {source.access}
                </p>
              )}
              <p>
                <b>Finding:</b> {evidence.finding}
              </p>
              <p>
                <b>Why it may apply:</b> {evidence.application}
              </p>
              <p>
                <b>Limits:</b> {evidence.limitation}
              </p>
              {source && (
                <details>
                  <summary>View retrieved {source.access}</summary>
                  <p>{source.summary}</p>
                  <span className="field-hint">
                    Retrieved {formatDate(source.retrievedAt)}
                  </span>
                </details>
              )}
            </article>
          );
        })}
      </details>
      <div className="plan-uncertainty">
        <b>What remains uncertain</b>
        <p>{basis.uncertainty}</p>
        {!!basis.assumptions.length && (
          <ul>
            {basis.assumptions.map((assumption, index) => (
              <li key={index}>{assumption}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="plan-review-question">
        <span className="section-kicker">
          CHECK THE APPROACH · {formatDate(basis.review.date)}
        </span>
        <h3>{basis.review.question}</h3>
        <p>{basis.review.adaptation}</p>
      </div>
    </section>
  );
}
