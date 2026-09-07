import { useState } from "react";
import { ArrowRight, Check, PenLine, Flag, RotateCcw } from "lucide-react";
import { Mark } from "./LandingArt";
import { ProgressChart } from "./ProgressChart";
import { demoGoal, demoPlanChanges } from "./landing-data";
import type { Forecast } from "../shared/forecast";
const demoForecast: Forecast = {
  at: "2026-10-17T12:00:00Z",
  asOf: "2026-10-17",
  anchorDate: "2026-10-17",
  planVersion: 1,
  status: "provisional",
  method: "observed-rate",
  reason: "Illustrative scenario if the recorded pace continues.",
  inputKey: "demo",
  sourceIds: ["r0", "r1", "r2"],
  inputs: [],
  current: 1,
  probability: null,
  expectedDate: "2026-11-26",
  earliestDate: "2026-11-06",
  horizonDate: "2026-12-01",
  rates: { low: 0, typical: 0.05, high: 0.1 },
};
export function GoalDefinitionPreview() {
  return (
    <div className="journey-preview goal-definition-preview">
      <span className="section-kicker">SOMETHING WORTH MAKING TIME FOR</span>
      <h3>Publish my portfolio.</h3>
      <dl className="goal-definition">
        <div>
          <dt>Why it matters</dt>
          <dd>{demoGoal.why}</dd>
        </div>
        <div>
          <dt>Finished means</dt>
          <dd>{demoGoal.success}</dd>
        </div>
        <div>
          <dt>Starting point</dt>
          <dd>
            No case studies published yet. I’ve chosen the three projects.
          </dd>
        </div>
        <div>
          <dt>Target date</dt>
          <dd>November 15 · Flexible</dd>
        </div>
      </dl>
      <div className="goal-checkpoints">
        <span>
          Today <b>0 published</b>
        </span>
        <ArrowRight size={16} />
        <span>
          My goal <b>3 case studies</b>
        </span>
      </div>
      <p className="demo-footnote">
        Your definition of success. Room for your other goals.
      </p>
    </div>
  );
}
export function WeeklyPlanPreview() {
  return (
    <div className="journey-preview weekly-plan-preview">
      <span className="section-kicker">A PLAN FOR HOW YOU WORK</span>
      <h3>A rhythm you can actually try.</h3>
      <ol className="week-plan-steps">
        <li>
          <PenLine size={20} />
          <div>
            <b>Give the work a reliable start</b>
            <p>Tuesday & Thursday · 25 minutes after breakfast</p>
            <small>
              Open the draft before email. Work on the project you chose.
            </small>
          </div>
        </li>
        <li>
          <Flag size={20} />
          <div>
            <b>Make the finish line small</b>
            <p>Choose what “enough for this session” means.</p>
            <small>
              Busy day? Leave a five-minute note to make the next start easier.
            </small>
          </div>
        </li>
        <li>
          <RotateCcw size={20} />
          <div>
            <b>Learn before planning further</b>
            <p>Review after two sessions.</p>
            <small>
              Did the cue help you start? Did the stopping point help you
              finish?
            </small>
          </div>
        </li>
      </ol>
      <p className="weekly-time">
        Later steps stay flexible as we learn what works.
      </p>
    </div>
  );
}
export function ProgressProposalPreview() {
  const [channel, setChannel] = useState("In Adler");
  return (
    <div className="journey-preview progress-proposal-preview">
      <span className="section-kicker">YOUR PROGRESS, WITH CONTEXT</span>
      <h3>One published. A clearer picture.</h3>
      <div className="proposal-metrics">
        <span>
          <b>1 of 3</b> case studies published
        </span>
        <span>
          <b>Nov 26</b> if this pace continues
        </span>
      </div>
      <ProgressChart
        goal={demoGoal}
        today="2026-10-17"
        compact
        graphOnly
        forecast={demoForecast}
      />
      <div className="preview-chat">
        <div className="preview-channel" aria-label="Example check-in channel">
          {["In Adler", "By text"].map((value) => (
            <button
              key={value}
              aria-pressed={value === channel}
              onClick={() => setChannel(value)}
            >
              {value}
            </button>
          ))}
        </div>
        <p className="preview-user">
          “Both sessions happened. I’m still polishing the same draft.”
        </p>
        <p>
          <b>Adler</b> What made it hard to call the draft finished?
        </p>
      </div>
      <p className="demo-footnote">
        Illustrative pace scenario, not a probability. Your check-ins explain
        the work; published results inform the outcome projection.
      </p>
    </div>
  );
}
export function AdaptivePlanPreview() {
  const [accepted, setAccepted] = useState(false);
  return (
    <div className="journey-preview adaptive-plan-preview">
      <span className="section-kicker">WHAT YOU SHARE → WHAT WE TRY</span>
      <h3>
        {accepted
          ? "A new experiment, saved."
          : "The plan learns your patterns."}
      </h3>
      <div className="learned-context">
        <Mark />
        <p>
          <b>You said:</b> “I keep editing instead of finishing.”
          <br />
          <b>To test:</b> a smaller, explicit finish line may help.
        </p>
      </div>
      <div className="plan-changes">
        {demoPlanChanges.map((change) => (
          <details className="plan-change" key={change.label}>
            <summary>
              <b>{change.label}</b>
              <span className="change-before">{change.before}</span>
              <ArrowRight size={16} />
              <span className="change-after">{change.after}</span>
            </summary>
            <p>{change.reason}</p>
          </details>
        ))}
      </div>
      {accepted ? (
        <p className="plan-accepted" role="status">
          <Check size={18} />
          Example plan updated. Review after two sessions.
        </p>
      ) : (
        <button className="button primary" onClick={() => setAccepted(true)}>
          Try this adjustment <Check size={16} />
        </button>
      )}
      <p className="demo-footnote">
        Behavioural science guides the experiment. Your experience tells us
        whether it helps.
      </p>
    </div>
  );
}
