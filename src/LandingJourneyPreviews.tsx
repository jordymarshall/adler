import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Mark } from "./LandingArt";
import { WeeklyActions } from "./ExecutionTimeline";
import { demoGoal, demoExecutionData, demoPlanChanges } from "./landing-data";
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
export function ProgressProposalPreview() {
  const [channel, setChannel] = useState("In Adler");
  return (
    <div className="journey-preview progress-proposal-preview">
      <span className="section-kicker">YOUR PROGRESS, WITH CONTEXT</span>
      <h3>See the work you can control.</h3>
      <div className="proposal-metrics">
        <span>
          <b>2 of 2</b> sessions completed
        </span>
        <span>
          <b>Oct 25</b> cycle review
        </span>
      </div>
      <WeeklyActions data={demoExecutionData} goal={demoGoal} today="2026-10-17" compact />
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
        The sessions happened; the draft still needs work. Review the stopping
        point together before committing to the next cycle.
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

export function MultiGoalPlanPreview() {
  const [selected, setSelected] = useState("portfolio");
  const goals = [
    { id: "portfolio", title: "Publish my portfolio", cue: "Tuesday & Thursday · After breakfast", action: "25 minutes on the draft I chose", note: "Choose a stopping point before opening the draft.", done: 2, total: 2, days: [1, 3], color: "sage" },
    { id: "reading", title: "Read for enjoyment", cue: "Monday & Wednesday · After dinner", action: "15 minutes with my book", note: "Leave the book where I usually sit after dinner.", done: 1, total: 2, days: [0, 2], color: "clay" },
    { id: "career", title: "Prepare for my next role", cue: "Friday · Before email", action: "20 minutes on the application I chose", note: "Start with the next unfinished part, then leave a note.", done: 0, total: 1, days: [4], color: "blue" },
  ];
  const goal = goals.find(g => g.id === selected)!;
  return <div className="journey-preview multi-goal-preview">
    <span className="section-kicker">ONE WEEK · ROOM FOR WHAT MATTERS</span>
    <h3>Your goals, working together.</h3>
    <div className="demo-week-labels"><span>Your goals</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span></div>
    <div className="demo-goal-rows">{goals.map(g => <button key={g.id} className={`demo-goal-row ${g.color}`} aria-pressed={g.id === selected} onClick={() => setSelected(g.id)}>
      <span><b>{g.title}</b><small>{g.done} of {g.total} actions done</small></span>
      {[0,1,2,3,4].map(day => <span className={`demo-day ${g.days.includes(day) ? "committed" : ""}`} key={day}>{g.days.indexOf(day) >= 0 && g.days.indexOf(day) < g.done ? <Check size={12} /> : g.days.includes(day) ? "·" : ""}</span>)}
    </button>)}</div>
    <div className="demo-selected-action" aria-live="polite"><small>{goal.cue}</small><h4>{goal.action}</h4><p>{goal.note}</p></div>
    <p className="demo-footnote">100 minutes planned across your goals. Review what fits before adding more.</p>
  </div>;
}
