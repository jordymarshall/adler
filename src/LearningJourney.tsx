import { Link } from "react-router-dom";
import { currentLearningVersion, learningStanding, type LearningRecord } from "../shared/learning";
import { recordLink } from "../shared/record-links";
import { formatDate, type Data } from "./store";
import "./goal-structure.css";

export function LearningJourney({ data, record }: { data: Data; record: LearningRecord }) {
  const current = currentLearningVersion(record);
  const first = record.versions[0];
  const deciding = record.state === "suggested" || Boolean(record.pendingVersion);
  const next = deciding ? record.versions.find(version => version.version === record.pendingVersion) ?? current : current;
  const chat = `/app/check-in?${new URLSearchParams({ goal: record.goalIds.length === 1 ? record.goalIds[0] : "general", prompt: deciding ? `Let’s discuss learning ${record.id}, proposed test version ${next.version}: “${next.test.change}”. Help me decide whether to try it.` : `Let’s review learning ${record.id}, test version ${current.version}. Here is what happened when I tried “${current.test.change}”: ` })}`;
  const stages = record.versions.flatMap(version => [
    { at: version.at, key: `test-${version.version}`, version, review: null },
    ...record.reviews.filter(review => review.version === version.version).map(review => ({ at: review.at, key: review.id, version, review })),
  ]).sort((a, b) => a.at.localeCompare(b.at));
  return <section className="learning-journey" aria-label="Starting point and changes over time">
    <div className="learning-origin"><span className="section-kicker">STARTING POINT</span><p>{first.test.comparison}</p><small>Your starting comparison, saved with test 1.</small></div>
    <ol className="learning-chronology">
      {stages.map(stage => {
        const active = !stage.review && stage.version.version === record.activeVersion;
        const pending = !stage.review && stage.version.version === record.pendingVersion;
        return <li key={stage.key} className={stage.review ? "learning-stage-review" : active ? "learning-stage-current" : "learning-stage-test"}>
          <time dateTime={stage.at}>{formatDate(stage.at)}</time>
          <div><small>{stage.review ? `Feedback on test ${stage.version.version}` : `Test ${stage.version.version} · ${pending ? "Suggested · not active" : active ? "Current" : "Earlier"}`}</small>
            <strong>{stage.review ? stage.review.summary : stage.version.test.change}</strong>
            {stage.review ? <><p>{learningStanding[stage.review.standing]} · Decision: {{ keep: "keep trying", adjust: "adjust", clarify: "clarify", pause: "pause", close: "finish this test" }[stage.review.decision]}</p>{stage.review.implication && <p>{stage.review.implication}</p>}<div className="evidence-links">{stage.review.sources.map(source => <Link key={source.id} to={recordLink(data, source.id) ?? chat}>Read the check-in ↗</Link>)}</div></> : <>
              <p>{stage.version.test.start ? `Planned from ${formatDate(stage.version.test.start)}` : "Start after agreement"}{stage.version.test.reviewAfter ? ` · Review ${formatDate(stage.version.test.reviewAfter)}` : " · Review after useful feedback"}</p>
              <details><summary>Original prediction & review rule</summary><p>{stage.version.test.prediction}</p><p>{stage.version.test.reviewRule}</p></details>
            </>}
          </div>
        </li>;
      })}
      {(deciding || !record.reviews.some(review => review.version === current.version)) && !["closed", "declined", "paused"].includes(record.state) && <li className="learning-stage-awaiting"><span>Next</span><div><small>{deciding ? "Your decision" : "Your experience"}</small><strong>{deciding ? "Choose whether to try this" : "Check in on the current test"}</strong><p>{next.test.behaviorSignal}</p><Link className="text-link" to={chat}>Open Check-in ↗</Link></div></li>}
    </ol>
  </section>;
}
