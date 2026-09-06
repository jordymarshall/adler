import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  Clock3,
  Target,
} from "lucide-react";
import { METHODS } from "./methods";
import { AdlerAvatar } from "./persona";
import { ChangeComparison, ChangeReason } from "./ChangeComparison";
import { PlanTimeline, type TimelineEvent } from "./PlanTimeline";

const weeklyEvents: TimelineEvent[] = [
  {
    id: "tuesday-run",
    kind: "work",
    date: "2026-10-13",
    title: "Tuesday run",
    detail: "6:30–7:00 pm · Time for the run and a short check-in afterward.",
  },
  {
    id: "thursday-run",
    kind: "work",
    date: "2026-10-15",
    title: "Thursday run",
    detail:
      "6:30–7:00 pm · Record whether you ran and the distance you covered.",
  },
  {
    id: "distance",
    kind: "checkpoint",
    date: "2026-10-15",
    title: "Check the 3 km milestone",
    detail:
      "Record 3 km only when you have completed that distance without a walking break.",
  },
  {
    id: "sunday-run",
    kind: "work",
    date: "2026-10-18",
    title: "Sunday run",
    detail: "9:00–9:30 am · Your weekend run and check-in.",
  },
  {
    id: "review",
    kind: "review",
    date: "2026-10-18",
    title: "Weekly review",
    detail:
      "Which runs happened? What got in the way? Compare your recorded distance with the milestone you planned to reach.",
  },
];

export function ProgramPreview() {
  return (
    <div className="program-preview">
      <div className="program-preview-heading">
        <span className="section-kicker">YOUR WEEKLY PLAN</span>
        <span className="program-version">Oct 12–18</span>
      </div>
      <div className="program-destination">
        <span className="program-node">
          <Target size={15} />
        </span>
        <div>
          <span className="section-kicker">YOUR GOAL · NOVEMBER 15</span>
          <h3>Run 5 km without stopping.</h3>
          <p>
            2 km recorded <span aria-hidden="true">→</span> 5 km goal
          </p>
        </div>
      </div>
      <PlanTimeline events={weeklyEvents} today="2026-10-12" />
      <div className="program-capacity">
        <div>
          <span>
            <Clock3 size={14} /> Time set aside this week
          </span>
          <b>2 hours</b>
        </div>
        <div className="program-capacity-bar" aria-hidden="true">
          <i style={{ width: "75%" }} />
          <i style={{ width: "16.67%" }} />
          <i style={{ width: "8.33%" }} />
        </div>
        <ul>
          <li>
            <i /> Runs & check-ins <b>90m</b>
          </li>
          <li>
            <i /> Spanish <b>20m</b>
          </li>
          <li>
            <i /> Review <b>10m</b>
          </li>
        </ul>
      </div>
      <details className="program-rules">
        <summary>
          Your availability and other commitments <ChevronDown size={15} />
        </summary>
        <p>
          You planned two runs after work and one on Sunday morning. The two
          hours also include time for Spanish and a weekly review.
        </p>
        <p>
          At the review, check which sessions happened and whether you reached
          the distance milestone. Adjust next week’s plan using those results.
        </p>
      </details>
    </div>
  );
}

// These sources inform planning and review. The example changes address
// reported scheduling problems; they do not prescribe a running progression.
const decisionMethods = [
  {
    id: "monitoring",
    title: "Track the result as well as the sessions",
    application:
      "Keep the longest recorded run at 2 km until a longer distance is confirmed. Moving a milestone does not change the recorded result.",
    basis:
      "Experimental meta-analysis of progress-monitoring interventions. Supports recording progress toward a goal.",
  },
  {
    id: "barriers",
    title: "Address the reason the runs were missed",
    application:
      "Both weekday check-ins say work ran late. Check whether the available morning time is easier to keep before adding sessions.",
    basis:
      "COM-B examines capability, opportunity, and motivation. Here it helps identify a reported scheduling obstacle.",
  },
  {
    id: "goal-definition",
    title: "Set clear distance milestones",
    application:
      "Name the distance, date, and what counts as reaching it. Review the proposed dates against actual progress.",
    basis:
      "Review of goal-setting research on specificity, challenge, and feedback. The dates shown here are planning choices to review with the user.",
  },
  {
    id: "implementation",
    title: "Choose when to start and what to do first",
    application:
      "Use the morning window the user confirmed. Link putting out running clothes to brushing their teeth the night before.",
    basis:
      "Meta-analysis of implementation intentions: connect a specific situation with a planned action.",
  },
  {
    id: "review",
    title: "Use the week’s results to decide what changes next",
    application:
      "At Sunday’s review, compare planned and completed runs, inspect any missed starts, and check the latest recorded distance.",
    basis:
      "Meta-analysis of structured debriefs in individual and team performance. The weekly schedule is a practical review choice.",
  },
];

const planChanges = [
  {
    category: "Schedule",
    from: "Weekdays at 6:30 pm",
    to: "Weekdays at 7:00 am",
    name: "Move weekday runs to before work",
    before: "Tuesday & Thursday at 6:30 pm",
    after: "Tuesday & Thursday at 7:00 am",
    reason:
      "Work ran late on both planned evenings. You said 7:00 am is free, so try that time for the same two sessions.",
    source: "Oct 13 & 15 check-ins · “I’m free before work at 7.”",
    methods: ["barriers", "implementation"],
  },
  {
    category: "Preparation",
    from: "Find kit before leaving",
    to: "Lay it out the night before",
    name: "Get your running clothes ready the night before",
    before: "Look for your kit when it’s time to leave",
    after: "Put shoes and clothes by the door after brushing your teeth",
    reason:
      "You reported losing time looking for your kit. Preparing it during your evening routine removes that task from the morning start.",
    source: "Your check-in · “I lose time finding my running kit.”",
    methods: ["implementation"],
  },
  {
    category: "Milestones",
    from: "3 km Oct 15 · 4 km Nov 1",
    to: "3 km Nov 1 · 4 km Nov 8",
    name: "Set new dates for the 3 km and 4 km milestones",
    before: "3 km by Oct 15 · 4 km by Nov 1",
    after: "3 km by Nov 1 · 4 km by Nov 8",
    reason:
      "Your longest run is still 2 km and the first date has passed. Set new dates to check progress, then review whether the November 15 goal still fits after trying the new schedule.",
    source: "Oct 17 result · 2 km recorded against a 3 km milestone",
    methods: ["monitoring", "goal-definition"],
  },
  {
    category: "Review",
    from: "Count completed runs",
    to: "Check starts and distance",
    name: "Check whether the new start times worked",
    before: "Count how many runs you completed",
    after:
      "On Oct 25, review start times, missed sessions, and longest distance",
    reason:
      "Use the next week to find out whether mornings helped you follow the plan. Check running progress separately before deciding what to change next.",
    source: "Next weekly review · Sunday, October 25",
    methods: ["monitoring", "review"],
  },
];

export function DecisionPreview() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [drafts, setDrafts] = useState(planChanges.map((change) => change.after));
  const [calendar, setCalendar] = useState(false);
  return (
    <div className="decision-preview compact-decision">
      <div className="program-preview-heading">
        <span className="section-kicker">WEEKLY REVIEW · OCT 18</span>
        <span className="program-version">4 proposed changes</span>
      </div>
      <div className="decision-message">
        <AdlerAvatar small />
        <p>Work interrupted both weekday runs. Try mornings next week, then check whether the new times helped.</p>
      </div>
      <div className="decision-table-head" aria-hidden="true">
        <span>Change</span><span>Current plan</span><span>Proposed plan</span><span />
      </div>
      <div className="decision-change-list">
        {planChanges.map((change, index) => (
          <details className="decision-change-row" key={change.category} open={expanded === index}>
            <summary onClick={(e) => { e.preventDefault(); setExpanded(expanded === index ? null : index); }}>
              <b>{change.category}</b>
              <span className="change-from">{change.from}</span>
              <span className="change-to">{drafts[index] === change.after ? change.to : drafts[index]}</span>
              <ChevronDown size={15} />
            </summary>
            <div className="decision-change-detail">
              <h3>{change.name}</h3>
              <ChangeComparison before={change.before} after={drafts[index]} />
              <ChangeReason>{change.reason}</ChangeReason>
              <div className="change-basis">
                <span className="comparison-label">Based on</span>
                <p>{change.source}</p>
                <details className="change-research">
                  <summary>Research behind this change <ChevronDown size={13} /></summary>
                  {change.methods.map((id) => {
                    const method = METHODS.find((m) => m.id === id)!;
                    const application = decisionMethods.find((m) => m.id === id)!;
                    return (
                      <div key={id}>
                        <b>{application.title}</b>
                        <p>{application.application}</p>
                        <a href={method.url} target="_blank" rel="noreferrer">
                          {method.source} <ArrowUpRight size={12} />
                        </a>
                        <p>{application.basis}</p>
                      </div>
                    );
                  })}
                </details>
              </div>
              {editing === index && (
                <label className="decision-edit">
                  Proposed {change.category.toLowerCase()} change
                  <textarea
                    rows={3}
                    maxLength={300}
                    value={drafts[index]}
                    onChange={(e) => setDrafts(drafts.map((value, i) => i === index ? e.target.value : value))}
                  />
                </label>
              )}
              <button className="button text-button small-button" onClick={() => setEditing(editing === index ? null : index)}>
                {editing === index ? "Done editing" : "Edit this change"}
              </button>
            </div>
          </details>
        ))}
      </div>
      <p className="decision-summary-note">Your 5 km goal stays on November 15. Review the new schedule on October 25.</p>
      <div className="decision-calendar-step">
        <button aria-expanded={calendar} aria-controls="decision-calendar-options" onClick={() => setCalendar(!calendar)}>
          <CalendarDays size={16} /><span>Add the new run times to your calendar</span><ChevronDown size={15} />
        </button>
        {calendar && (
          <div id="decision-calendar-options">
            <p>{drafts[0]}. Allow 25 minutes for each run and a five-minute check-in afterward.</p>
            <Link to="/app/calendar">Check availability & choose times <ArrowRight size={13} /></Link>
            <small>You confirm the calendar and time before anything is booked.</small>
          </div>
        )}
      </div>
    </div>
  );
}
