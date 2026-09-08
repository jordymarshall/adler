import { Link } from "react-router-dom";
import { BookOpen, MessageCircle, ArrowDown } from "lucide-react";
import {
  currentLearningVersion,
  learningStanding,
  learningStatus,
  type LearningRecord,
} from "../shared/learning";
import { recordLink } from "../shared/record-links";
import { dateInZone } from "../shared/journey";
import {
  BehavioralRationale,
  InferenceJoin,
  ScienceSource,
} from "./BehavioralRationale";
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
            className="reasoning-path inference-layout"
            aria-label="From your experience to a useful change"
          >
            <li className="inference-input">
              <div>
                <h3>
                  <MessageCircle size={16} aria-hidden="true" /> From your
                  check-ins
                </h3>
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
            <li className="inference-input inference-research">
              <div>
                <h3>
                  <BookOpen size={16} aria-hidden="true" /> From behavioural
                  science
                </h3>
                <p>{version.reasoning.mechanism}</p>
                <ScienceSource
                  reasoning={version.reasoning}
                  claims={decision?.researchClaims}
                />
              </div>
            </li>
            <li className="inference-conclusion learning-test">
              <InferenceJoin />
              <div className="working-explanation">
                <h3>Our working explanation</h3>
                <p>{version.hypothesis}</p>
              </div>
              <BehavioralRationale
                reasoning={version.reasoning}
                sources={decision?.researchSources}
                claims={decision?.researchClaims}
                label="Inspect the evidence and reasoning"
              />
              <div className="learning-experiment">
                <span className="section-kicker">
                  {record.state === "suggested"
                    ? "A CHANGE TO TRY"
                    : "THE CHANGE"}
                </span>
                <h3>{version.test.change}</h3>
                <div className="button-row learning-controls">
                  {onControl &&
                    record.standing !== "reconsider" &&
                    record.state === "suggested" &&
                    !version.proposalId && (
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
                  <Link className="button secondary" to={chat}>
                    {record.standing === "reconsider"
                      ? "Review what changed"
                      : "Discuss in Check-in"}
                  </Link>
                  {onControl &&
                    ["agreed", "reviewed"].includes(record.state) && (
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
                    !["closed", "declined", "suggested"].includes(
                      record.state,
                    ) && (
                      <button
                        className="button text-button"
                        disabled={busy}
                        onClick={() => onControl(record, "close")}
                      >
                        Finish trying this
                      </button>
                    )}
                </div>
                <dl className="reasoning-details">
                  <div>
                    <dt>Expected effect</dt>
                    <dd>{version.test.prediction}</dd>
                  </div>
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
                <details className="quiet-disclosure">
                  <summary>What to report & how we’ll review it</summary>
                  <dl className="reasoning-details">
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
                    <div>
                      <dt>When we’ll review it</dt>
                      <dd>{version.test.reviewRule}</dd>
                    </div>
                    <div>
                      <dt>A fair comparison</dt>
                      <dd>{version.test.comparison}</dd>
                    </div>
                  </dl>
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
            <li
              className={`learning-feedback ${!reviews.length ? "awaiting-learning" : ""}`}
            >
              <span className="feedback-connector" aria-hidden="true">
                <ArrowDown size={20} />
              </span>
              <div>
                <span className="section-kicker">
                  {reviews.length
                    ? "FROM YOUR FOLLOW-UP"
                    : "NEXT · LEARN FROM YOUR EXPERIENCE"}
                </span>
                <h3>
                  {reviews.length
                    ? "What your feedback tells us"
                    : record.state === "suggested"
                      ? "Your choice comes first"
                      : ["closed", "declined"].includes(record.state)
                        ? "No review recorded"
                        : "Waiting for your experience"}
                </h3>
                {!reviews.length ? (
                  <p>
                    {record.state === "suggested" || record.state === "declined"
                      ? "If you decide to try this, tell Adler what happened. We’ll review the idea using your feedback."
                      : "Tell Adler what you tried and what happened. Until then, we don’t know whether this helped."}
                  </p>
                ) : (
                  reviews
                    .slice()
                    .reverse()
                    .map((item) => (
                      <article className="learning-review" key={item.id}>
                        <small>
                          {formatDate(item.at)} ·{" "}
                          {learningStanding[item.standing]}
                        </small>
                        <p>{item.summary}</p>
                        <details className="quiet-disclosure review-observations">
                          <summary>What you reported</summary>
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
                        </details>
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
