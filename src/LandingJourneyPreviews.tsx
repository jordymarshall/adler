import { useState } from "react";
import { ArrowRight, Check, Footprints, Flag, RotateCcw } from "lucide-react";
import { Mark } from "./LandingArt";
import { ProgressChart } from "./ProgressChart";
import {
  demoGoal,
  demoPlanChanges,
  demoProposedCheckpoints,
} from "./landing-data";

export function GoalDefinitionPreview() {
  return (
    <div className="journey-preview goal-definition-preview">
      <span className="section-kicker">YOUR GOAL, MADE CONCRETE</span>
      <h4>Run 5 km without stopping by November 15.</h4>
      <dl className="goal-definition">
        <div>
          <dt>Why it matters</dt>
          <dd>Join my friends for our local 5 km run.</dd>
        </div>
        <div>
          <dt>Finished means</dt>
          <dd>
            Complete the route without a walking break and record the distance.
          </dd>
        </div>
        <div>
          <dt>Starting point</dt>
          <dd>1 km without stopping · October 1</dd>
        </div>
      </dl>
      <div className="goal-checkpoints">
        <span>
          Start <b>1 km</b>
        </span>
        <ArrowRight size={16} />
        <span>
          Next <b>3 km</b>
        </span>
        <ArrowRight size={16} />
        <span>
          Goal <b>5 km</b>
        </span>
      </div>
      <details className="preview-disclosure">
        <summary>Why measure distance?</summary>
        <p>
          It checks the result this person wants: running continuously. Sessions
          completed help explain progress; they aren’t the outcome itself. Adler
          explains its measurement choice, alternatives, and uncertainty in each
          plan.
        </p>
      </details>
      <a className="button primary" href="#step-2">
        See the first week <ArrowRight size={16} />
      </a>
    </div>
  );
}

export function WeeklyPlanPreview() {
  return (
    <div className="journey-preview weekly-plan-preview">
      <span className="section-kicker">OCTOBER 12–18 · YOUR FIRST WEEK</span>
      <h4>A few actions. A result to check.</h4>
      <ol className="week-plan-steps">
        <li>
          <Footprints size={20} />
          <div>
            <b>Do the work</b>
            <p>Tuesday, Thursday, Sunday · 25 minutes each</p>
            <small>
              After each session, take 5 minutes to record what happened.
            </small>
          </div>
        </li>
        <li>
          <Flag size={20} />
          <div>
            <b>Check the result</b>
            <p>Thursday · Check the 3 km milestone</p>
            <small>Record your longest run without stopping.</small>
          </div>
        </li>
        <li>
          <RotateCcw size={20} />
          <div>
            <b>Review and adjust</b>
            <p>Sunday · 15-minute weekly review</p>
            <small>Look at what worked and choose the next adjustment.</small>
          </div>
        </li>
      </ol>
      <p className="weekly-time">
        <b>1 hr 45 min</b> set aside for sessions, check-ins, and review.
      </p>
      <a className="button primary" href="#step-3">
        Start plan <ArrowRight size={16} />
      </a>
      <details className="preview-disclosure">
        <summary>How does Adler choose the plan?</summary>
        <p>
          It considers your goal, starting point, other commitments, and
          relevant behavioural research. The first plan is something to test and
          revise as your results come in.
        </p>
      </details>
    </div>
  );
}

export function ProgressProposalPreview() {
  return (
    <div className="journey-preview progress-proposal-preview">
      <span className="section-kicker">
        OCTOBER 17 · RESULTS AND NEXT CHECKPOINTS
      </span>
      <h4>Longest run without stopping</h4>
      <div className="proposal-metrics">
        <span>
          <b>2 km</b> recorded
        </span>
        <span>
          <b>3 km</b> was due Oct 15
        </span>
      </div>
      <ProgressChart
        goal={demoGoal}
        today="2026-10-17"
        compact
        graphOnly
        proposedCheckpoints={demoProposedCheckpoints}
      />
      <div className="proposed-checkpoint-note">
        <b>Proposed: more time for the next milestones.</b>
        <p>
          3 km on November 1, then 4 km on November 8. The 5 km goal stays on
          November 15.
        </p>
        <small>
          These are proposed checkpoints, not predicted results. Your recorded 2
          km stays unchanged.
        </small>
      </div>
      <a className="text-link" href="#step-6">
        See what changes in the plan <ArrowRight size={16} />
      </a>
    </div>
  );
}

export function AdaptivePlanPreview() {
  const [accepted, setAccepted] = useState(false);
  return (
    <div className="journey-preview adaptive-plan-preview">
      <span className="section-kicker">WEEKLY REVIEW · OCTOBER 18</span>
      <h4>
        {accepted
          ? "Your revised plan is ready."
          : "A plan that fits what we’ve learned."}
      </h4>
      <div className="learned-context">
        <Mark />
        <p>
          Work interrupted your evening runs. You’ve said mornings are usually
          free, with about 15 minutes to spare.
        </p>
      </div>
      <div className="plan-change-labels" aria-hidden="true">
        <span>Current plan</span>
        <span>{accepted ? "Revised plan" : "Proposed plan"}</span>
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
      <details className="preview-disclosure remembered-context">
        <summary>What Adler remembers—and what it’s testing</summary>
        <p>
          <b>You reported:</b> evening work ran late; mornings have a 15-minute
          window.
        </p>
        <p>
          <b>To test:</b> shorter sessions and preparing your kit earlier may
          help you get started. The next review checks session starts and
          distance.
        </p>
        <p>You can review, correct, or remove saved context in Adler.</p>
      </details>
      {!accepted ? (
        <button className="button primary" onClick={() => setAccepted(true)}>
          Confirm revised plan <Check size={16} />
        </button>
      ) : (
        <p className="plan-accepted" role="status">
          <Check size={18} />
          Example plan updated. Review how it went on October 25.
        </p>
      )}
      <p className="demo-footnote">
        Illustrative proposal. Your recorded 2 km and November 15 goal are
        unchanged.
      </p>
    </div>
  );
}
