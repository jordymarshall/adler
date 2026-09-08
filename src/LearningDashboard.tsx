import { Link } from "react-router-dom";
import {
  currentLearningVersion,
  learningStanding,
  learningStatus,
  type LearningRecord,
} from "../shared/learning";
import { recordLink } from "../shared/record-links";
import { dateInZone } from "../shared/journey";
import { BehavioralRationale, ScienceSource } from "./BehavioralRationale";
import { formatDate, type Data } from "./store";

export type LearningControl =
  "agree" | "decline" | "pause" | "resume" | "close";
export function LearningDashboard({
  data,
  goalId = "all",
  onControl,
  busy = false,
}: {
  data: Data;
  goalId?: string;
  onControl?: (record: LearningRecord, action: LearningControl) => void;
  busy?: boolean;
}) {
  const today = dateInZone(data.timeZone, new Date());
  const records = (data.learning ?? []).filter(
    (record) => goalId === "all" || record.goalIds.includes(goalId),
  );
  const current = records.filter(
    (record) =>
      !!record.pendingVersion ||
      ["suggested", "agreed", "paused"].includes(record.state) ||
      record.standing === "reconsider" ||
      (record.state === "reviewed" && record.reviews.at(-1)?.nextReviewAfter),
  );
  const past = records.filter((record) => !current.includes(record));
  function renderRecord(record: LearningRecord) {
    const version = currentLearningVersion(record);
    const pending = record.versions.find(
      (item) => item.version === record.pendingVersion,
    );
    const reviews = record.reviews.filter(
      (review) => review.version === version.version,
    );
    const review = reviews.at(-1);
    const decision = data.decisions.find(
      (item) => item.id === version.decisionId,
    );
    const reviewDate = review?.nextReviewAfter ?? version.test.reviewAfter;
    const goals = data.goals.filter((goal) => record.goalIds.includes(goal.id));
    const chat = `/app/check-in?${new URLSearchParams({ goal: goals.length === 1 ? goals[0].id : "general", prompt: `Let's review “${version.test.change}” (${record.id}). Here is what happened: ` })}`;
    const sources = version.sources.filter(
      (source) => source.kind !== "measurement",
    );
    return (
      <details
        className="learning-record"
        key={record.id}
        id={`record-${record.id}`}
      >
        <summary>
          <span className="learning-record-main">
            <small>{goals.map((goal) => goal.title).join(" · ")}</small>
            <strong>{version.test.change}</strong>
            <span>{learningStanding[record.standing]}</span>
          </span>
          <span className="learning-record-timing">
            <b>{learningStatus(record, today)}</b>
            <span>
              {["agreed", "reviewed"].includes(record.state)
                ? reviewDate
                  ? `Review ${formatDate(reviewDate)}`
                  : "Review when there’s useful feedback"
                : record.state === "suggested"
                  ? "Your choice before we start"
                  : `${reviews.length} ${reviews.length === 1 ? "review" : "reviews"} saved`}
            </span>
          </span>
          <span className="learning-record-open">
            See why <span aria-hidden="true">↗</span>
          </span>
        </summary>
        <div className="learning-record-body">
          {pending && record.activeVersion && (
            <section
              className="learning-change"
              aria-label="Revised suggestion"
            >
              <h3>A revised suggestion</h3>
              <p>
                <strong>{pending.test.change}</strong>
              </p>
              <p>
                Your agreed test below remains current until you accept this
                suggestion.
              </p>
              <BehavioralRationale
                reasoning={pending.reasoning}
                sources={
                  data.decisions.find((item) => item.id === pending.decisionId)
                    ?.researchSources
                }
                claims={
                  data.decisions.find((item) => item.id === pending.decisionId)
                    ?.researchClaims
                }
              />
              <div className="button-row">
                {onControl && !pending.proposalId && (
                  <>
                    <button
                      className="button primary"
                      disabled={busy}
                      onClick={() => onControl(record, "agree")}
                    >
                      Try this
                    </button>
                    <button
                      className="button text-button"
                      disabled={busy}
                      onClick={() => onControl(record, "decline")}
                    >
                      No thanks
                    </button>
                  </>
                )}
                <Link
                  to={`/app/check-in?${new URLSearchParams({ prompt: `Let's discuss the pending suggestion “${pending.test.change}” (learning ${record.id}, version ${pending.version}) before I decide.` })}`}
                >
                  Discuss or edit in Check-in ↗
                </Link>
              </div>
            </section>
          )}
          {record.standing === "reconsider" && (
            <p className="learning-correction" role="status">
              Something this explanation relied on has changed. Review it with
              Adler before using it to guide a new plan.
            </p>
          )}
          <ol
            className="reasoning-path"
            aria-label="From your experience to a useful change"
          >
            <li>
              <span className="reasoning-step">1</span>
              <div>
                <h3>What you told us</h3>
                <p>{version.observation}</p>
                <div className="evidence-links">
                  {sources.map((source) => (
                    <Link
                      key={source.id}
                      to={recordLink(data, source.id) ?? chat}
                    >
                      {source.kind === "report"
                        ? "Your check-in"
                        : source.kind === "context"
                          ? "Saved context"
                          : source.kind === "outcome"
                            ? "Reported result"
                            : "Action report"}
                      {source.reportedAt
                        ? ` · ${formatDate(source.reportedAt)}`
                        : ""}{" "}
                      ↗
                    </Link>
                  ))}
                </div>
              </div>
            </li>
            <li>
              <span className="reasoning-step">2</span>
              <div>
                <h3>What behavioural science suggests</h3>
                <p>{version.reasoning.mechanism}</p>
                <ScienceSource
                  reasoning={version.reasoning}
                  claims={decision?.researchClaims}
                />
                <BehavioralRationale
                  reasoning={version.reasoning}
                  sources={decision?.researchSources}
                  claims={decision?.researchClaims}
                />
              </div>
            </li>
            <li>
              <span className="reasoning-step">3</span>
              <div>
                <h3>What we’re trying to learn</h3>
                <p>{version.hypothesis}</p>
                <p className="learning-change">
                  <b>Try:</b> {version.test.change}
                </p>
                <dl className="reasoning-details">
                  <div>
                    <dt>Expected effect</dt>
                    <dd>{version.test.prediction}</dd>
                  </div>
                  <div>
                    <dt>What to notice</dt>
                    <dd>
                      {version.test.behaviorSignal}
                      {version.test.mechanismSignal &&
                        ` ${version.test.mechanismSignal}`}
                    </dd>
                  </div>
                  {version.test.outcomeSignal && (
                    <div>
                      <dt>Goal result</dt>
                      <dd>{version.test.outcomeSignal}</dd>
                    </div>
                  )}
                </dl>
                <div
                  className="learning-timeline"
                  aria-label="Learning timeline"
                >
                  <span>
                    <i />
                    {version.test.start
                      ? formatDate(version.test.start)
                      : "Start when agreed"}
                  </span>
                  <span className="learning-timeline-line" />
                  <span>
                    <i />
                    {reviewDate
                      ? `Review ${formatDate(reviewDate)}`
                      : "Review after useful feedback"}
                  </span>
                </div>
                <p className="field-hint">{version.test.reviewRule}</p>
                <details className="quiet-disclosure">
                  <summary>How we’ll judge it fairly</summary>
                  <p>{version.test.comparison}</p>
                  {version.test.alternatives.length > 0 && (
                    <>
                      <b>Other possible explanations</b>
                      <ul>
                        {version.test.alternatives.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {version.transfer && (
                    <p>
                      <b>Using this across goals:</b> {version.transfer}
                    </p>
                  )}
                  <p>
                    Agreeing to try a change does not establish that you used it
                    or that it caused a result.
                  </p>
                </details>
              </div>
            </li>
            <li className={!reviews.length ? "awaiting-learning" : ""}>
              <span className="reasoning-step">4</span>
              <div>
                <h3>
                  {reviews.length
                    ? "What happened and what it means"
                    : "Your next report will help us learn"}
                </h3>
                {!reviews.length ? (
                  <p>
                    No review yet. A missed check-in is unknown, not a failed
                    action. Tell Adler what you tried, what happened and
                    anything else that changed.
                  </p>
                ) : (
                  reviews.map((item) => (
                    <article className="learning-review" key={item.id}>
                      <small>
                        {formatDate(item.at)} ·{" "}
                        {learningStanding[item.standing]}
                      </small>
                      <p>{item.summary}</p>
                      <dl className="reasoning-details">
                        <div>
                          <dt>Was the change used?</dt>
                          <dd>
                            {item.exposure === "unknown"
                              ? "Not established"
                              : item.exposure === "used"
                                ? "Reported as used"
                                : "Reported as not used"}
                          </dd>
                        </div>
                        {item.mechanism && (
                          <div>
                            <dt>What helped or got in the way</dt>
                            <dd>{item.mechanism}</dd>
                          </div>
                        )}
                        {item.behavior && (
                          <div>
                            <dt>What you did</dt>
                            <dd>{item.behavior}</dd>
                          </div>
                        )}
                        {item.outcome && (
                          <div>
                            <dt>Goal result</dt>
                            <dd>{item.outcome}</dd>
                          </div>
                        )}
                      </dl>
                      {item.implication && (
                        <p className="learning-change">
                          <b>For your plan:</b> {item.implication}
                        </p>
                      )}
                      {item.nextQuestion && (
                        <p>
                          <b>Next question:</b> {item.nextQuestion}
                        </p>
                      )}
                      {item.confounds.length > 0 && (
                        <details>
                          <summary>What else could explain this?</summary>
                          <ul>
                            {item.confounds.map((confound) => (
                              <li key={confound}>{confound}</li>
                            ))}
                          </ul>
                        </details>
                      )}
                      <div className="evidence-links">
                        {item.sources.map((source) => (
                          <Link
                            key={source.id}
                            to={recordLink(data, source.id) ?? chat}
                          >
                            Follow-up report ↗
                          </Link>
                        ))}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </li>
          </ol>
          <div className="button-row learning-controls">
            <Link className="button primary" to={chat}>
              {record.standing === "reconsider"
                ? "Review what changed"
                : "Discuss in Check-in"}
            </Link>
            {onControl &&
              record.standing !== "reconsider" &&
              record.state === "suggested" &&
              !version.proposalId && (
                <>
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() => onControl(record, "agree")}
                  >
                    Try this
                  </button>
                  <button
                    className="button text-button"
                    disabled={busy}
                    onClick={() => onControl(record, "decline")}
                  >
                    No thanks
                  </button>
                </>
              )}
            {onControl && ["agreed", "reviewed"].includes(record.state) && (
              <button
                className="button text-button"
                disabled={busy}
                onClick={() => onControl(record, "pause")}
              >
                Pause
              </button>
            )}
            {onControl &&
              record.state === "paused" &&
              record.standing !== "reconsider" && (
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => onControl(record, "resume")}
                >
                  Resume
                </button>
              )}
            {onControl &&
              !["closed", "declined", "suggested"].includes(record.state) && (
                <button
                  className="button text-button"
                  disabled={busy}
                  onClick={() => onControl(record, "close")}
                >
                  Finish trying this
                </button>
              )}
          </div>
          <details className="quiet-disclosure learning-history">
            <summary>
              Original reasoning & history · {record.versions.length}{" "}
              {record.versions.length === 1 ? "version" : "versions"}
            </summary>
            {record.versions.map((item) => (
              <div key={item.version}>
                <h4>
                  Version {item.version} · {formatDate(item.at)}
                </h4>
                <p>{item.hypothesis}</p>
                <p>
                  <b>Original prediction:</b> {item.test.prediction}
                </p>
                <BehavioralRationale
                  reasoning={item.reasoning}
                  sources={
                    data.decisions.find((d) => d.id === item.decisionId)
                      ?.researchSources
                  }
                  claims={
                    data.decisions.find((d) => d.id === item.decisionId)
                      ?.researchClaims
                  }
                />
              </div>
            ))}
            {record.events.map((event, index) => (
              <p key={index}>
                {formatDate(event.at)} · {event.reason}
              </p>
            ))}
            {record.invalidations.map((event, index) => (
              <p key={`correction-${index}`}>
                {formatDate(event.at)} · {event.reason} (version {event.version}
                )
              </p>
            ))}
          </details>
        </div>
      </details>
    );
  }
  return (
    <div className="learning-dashboard">
      {current.length > 0 && (
        <section aria-label="Learning in progress">
          <div className="learning-section-heading">
            <h2>What we’re learning now</h2>
            <span>
              {current.length} {current.length === 1 ? "question" : "questions"}
            </span>
          </div>
          {current.map(renderRecord)}
        </section>
      )}
      {past.length > 0 && (
        <section aria-label="What we have learned">
          <div className="learning-section-heading">
            <h2>What we’ve learned</h2>
            <span>Past reviews and choices</span>
          </div>
          {past.slice().reverse().map(renderRecord)}
        </section>
      )}
    </div>
  );
}
