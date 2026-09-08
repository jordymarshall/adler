import type {
  BehavioralReasoning,
  Recommendation,
} from "../shared/behavioral-reasoning";
import type { ResearchSource } from "../shared/planning";
import { RESEARCH_CLAIMS, type ResearchClaim } from "../shared/research-claims";

const roles = {
  theory: "Framework idea",
  technique: "Technique definition",
  empirical: "Research finding",
  heuristic: "Practical rule",
};
export function BehavioralRationale({
  reasoning,
  sources = [],
  claims = RESEARCH_CLAIMS,
}: {
  reasoning: BehavioralReasoning;
  sources?: ResearchSource[];
  claims?: ResearchClaim[];
}) {
  const bindings = (reasoning.grounding ?? []).map((binding) => ({
    binding,
    claim: claims.find(
      (c) => c.id === binding.claimId && c.version === binding.version,
    ),
  }));
  return (
    <details className="behavioral-rationale">
      <summary>
        Why this may help <span>+</span>
      </summary>
      <dl className="reasoning-details">
        <div>
          <dt>What may be getting in the way</dt>
          <dd>
            {reasoning.barrier.explanation}{" "}
            <small>
              {reasoning.barrier.status === "reported"
                ? "From your report"
                : reasoning.barrier.status === "tentative"
                  ? "A possibility to explore"
                  : "Not established yet"}
            </small>
          </dd>
        </div>
        <div>
          <dt>How the change could help</dt>
          <dd>{reasoning.mechanism}</dd>
        </div>
        <div>
          <dt>Why consider it for you</dt>
          <dd>{reasoning.fit}</dd>
        </div>
        <div>
          <dt>What would change our view</dt>
          <dd>{reasoning.reviewRule}</dd>
        </div>
        <div>
          <dt>What remains uncertain</dt>
          <dd>{reasoning.limitation}</dd>
        </div>
      </dl>
      {reasoning.ruleExceptions?.map((exception) => (
        <p key={exception}>
          <b>Fitted to this goal:</b> {exception}
        </p>
      ))}
      <div
        className="claim-evidence"
        aria-label="Specific research behind this interpretation"
      >
        {bindings.map(({ binding, claim }) => (
          <details key={`${binding.claimId}:${binding.version}`}>
            <summary>
              {claim
                ? `${roles[claim.role]} · ${claim.label ?? claim.construct}`
                : "Earlier research reference"}
            </summary>
            {claim ? (
              <>
                <p>{claim.statement}</p>
                <p>
                  <b>Application here:</b> {binding.application}
                </p>
                <p>
                  <b>Where it applies:</b> {claim.scope}
                </p>
                <ul>
                  {claim.limitations.map((limit) => (
                    <li key={limit}>{limit}</li>
                  ))}
                </ul>
                <a href={claim.source.url} target="_blank" rel="noreferrer">
                  {claim.source.authors} ({claim.source.year}) · Read source ↗
                </a>
                <details>
                  <summary>Source and review details</summary>
                  <dl className="reasoning-details">
                    <div>
                      <dt>Passage checked</dt>
                      <dd>{claim.locator}</dd>
                    </div>
                    <div>
                      <dt>Source access</dt>
                      <dd>
                        {claim.source.access}. {claim.source.summary}
                      </dd>
                    </div>
                    <div>
                      <dt>Evidence strength</dt>
                      <dd>{claim.grade}</dd>
                    </div>
                    <div>
                      <dt>Framework connection</dt>
                      <dd>
                        {claim.principleIds.join(", ")} · {binding.relation}
                      </dd>
                    </div>
                    <div>
                      <dt>Review provenance</dt>
                      <dd>
                        {claim.review.by} · {claim.review.at}. Claim {claim.id},
                        version {claim.version}.
                      </dd>
                    </div>
                  </dl>
                </details>
              </>
            ) : (
              <p>
                This earlier claim version is unavailable here. The saved
                explanation remains historical; ask Adler to review its current
                support.
              </p>
            )}
          </details>
        ))}
        {!bindings.length && (
          <p className="field-hint">
            This earlier explanation has no specific claim links. Its original
            sources are below; Adler can review it against the current method.
          </p>
        )}
      </div>
      <div className="rationale-sources">
        {sources
          .filter(
            (source) =>
              reasoning.researchSourceIds.includes(source.id) &&
              !bindings.some(({ claim }) => claim?.source.id === source.id),
          )
          .map((source) => (
            <a
              key={source.id}
              href={source.url}
              target="_blank"
              rel="noreferrer"
            >
              {source.title} ↗
            </a>
          ))}
      </div>
    </details>
  );
}

export function RecommendationReasons({
  recommendation,
  sources,
  claims,
}: {
  recommendation: Recommendation;
  sources?: ResearchSource[];
  claims?: ResearchClaim[];
}) {
  return (
    <div className="recommendation-reasons">
      <dl>
        <div>
          <dt>
            {recommendation.reasoning.barrier.status === "unknown"
              ? "What we know"
              : "What you told me"}
          </dt>
          <dd>{recommendation.observation}</dd>
        </div>
        <div>
          <dt>Behavioural science</dt>
          <dd>
            {recommendation.interpretation}
            <ScienceSource
              reasoning={recommendation.reasoning}
              claims={claims}
            />
          </dd>
        </div>
        <div>
          <dt>What we’re testing</dt>
          <dd>{recommendation.expectedEffect}</dd>
        </div>
      </dl>
      <BehavioralRationale
        reasoning={recommendation.reasoning}
        sources={sources}
        claims={claims}
      />
    </div>
  );
}

export function ScienceSource({
  reasoning,
  claims = RESEARCH_CLAIMS,
}: {
  reasoning: BehavioralReasoning;
  claims?: ResearchClaim[];
}) {
  const first = reasoning.grounding?.[0];
  const source = claims.find(
    (c) => c.id === first?.claimId && c.version === first?.version,
  );
  return source ? (
    <a
      className="inline-science-source"
      href={source.source.url}
      target="_blank"
      rel="noreferrer"
    >
      {source.label ?? source.construct} ↗
    </a>
  ) : null;
}
