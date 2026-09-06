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
      <div className="program-sprint">
        <span className="section-kicker">THIS WEEK</span>
        <h3>Make time for your three planned runs.</h3>
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
      <Link className="demo-inspect" to="/app/coach/program">
        Edit your weekly plan <ArrowUpRight size={15} />
      </Link>
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
  const [calendar, setCalendar] = useState(false);
  return (
    <div className="decision-preview">
      <div className="program-preview-heading">
        <span className="section-kicker">PROPOSED CHANGES TO YOUR PLAN</span>
        <span className="program-version">
          4 changes · review before saving
        </span>
      </div>
      <div className="decision-layout">
        <aside className="decision-recommendation">
          <div className="decision-message">
            <AdlerAvatar small />
            <p>
              You missed both weekday runs when work ran late. You said mornings
              are free. Let’s try your runs before work next week.
            </p>
          </div>
          <div className="decision-adjustment">
            <span className="section-kicker">NEXT WEEK’S PLAN</span>
            <h3>Try your weekday runs before work.</h3>
            <p>
              Keep the sessions you already planned. Change the start time,
              prepare your kit, and check how the week goes before changing the
              workload.
            </p>
          </div>
          <ol
            className="decision-impact-path"
            aria-label="Your next runs and progress checks"
          >
            <li>
              <span>
                20+22<small>OCT</small>
              </span>
              <div>
                <b>Tuesday & Thursday · 7:00 am</b>
                <p>Try the morning start times</p>
              </div>
            </li>
            <li>
              <span>
                25<small>OCT</small>
              </span>
              <div>
                <b>Review the week on Sunday</b>
                <p>Check the runs, start times, and distance</p>
              </div>
            </li>
            <li>
              <span>
                01<small>NOV</small>
              </span>
              <div>
                <b>Check your progress toward 3 km</b>
                <p>Next proposed distance milestone</p>
              </div>
            </li>
            <li>
              <span>
                15<small>NOV</small>
              </span>
              <div>
                <b>Your goal: 5 km without stopping</b>
                <p>Review this date as results come in</p>
              </div>
            </li>
          </ol>
          <details className="decision-inputs">
            <summary>
              What Adler used to suggest these changes <ChevronDown size={14} />
            </summary>
            <dl>
              <div>
                <dt>Latest result · Oct 17</dt>
                <dd>
                  2 km without stopping. The plan called for 3 km by Oct 15.
                </dd>
              </div>
              <div>
                <dt>Tuesday · Oct 13</dt>
                <dd>“Work ran late, so I missed the run.”</dd>
              </div>
              <div>
                <dt>Thursday · Oct 15</dt>
                <dd>“Got home late again. By then I’d missed it.”</dd>
              </div>
              <div>
                <dt>Your availability</dt>
                <dd>“I’m free before work at 7.”</dd>
              </div>
              <div>
                <dt>Your preparation</dt>
                <dd>“I lose time finding my running kit.”</dd>
              </div>
            </dl>
          </details>
          <div className="decision-calendar-step">
            <button
              aria-expanded={calendar}
              aria-controls="decision-calendar-options"
              onClick={() => setCalendar(!calendar)}
            >
              <CalendarDays size={16} />
              <span>
                <small>OPTIONAL NEXT STEP</small>Add the new run times to your
                calendar
              </span>
              <ChevronDown size={15} />
            </button>
            {calendar && (
              <div id="decision-calendar-options">
                <p>Check these times against your connected calendar:</p>
                <ul>
                  <li>Tue, Oct 20 · 7:00–7:25 am</li>
                  <li>Thu, Oct 22 · 7:00–7:25 am</li>
                </ul>
                <p>Add a five-minute check-in after each run.</p>
                <Link to="/app/calendar">
                  Check availability & choose times <ArrowRight size={13} />
                </Link>
                <small>
                  You confirm the calendar and time before anything is booked.
                </small>
              </div>
            )}
          </div>
          <Link className="decision-cta" to="/app/coach/program">
            Open your weekly plan <ArrowRight size={14} />
          </Link>
        </aside>
        <section
          className="decision-plan-changes"
          aria-label="Proposed plan changes"
        >
          <ol className="decision-change-list">
            {planChanges.map((change, index) => (
              <li key={change.name}>
                <article className="decision-change-panel">
                  <span className="section-kicker">
                    0{index + 1} · {change.category}
                  </span>
                  <h4>{change.name}</h4>
                  <ChangeComparison
                    before={change.before}
                    after={change.after}
                  />
                  <ChangeReason>{change.reason}</ChangeReason>
                  <div className="change-basis">
                    <span className="comparison-label">Based on</span>
                    <p>{change.source}</p>
                    <details className="change-research">
                      <summary>
                        Research behind this change <ChevronDown size={13} />
                      </summary>
                      {change.methods.map((id) => {
                        const method = METHODS.find((m) => m.id === id)!;
                        const application = decisionMethods.find(
                          (m) => m.id === id,
                        )!;
                        return (
                          <div key={id}>
                            <b>{application.title}</b>
                            <p>{application.application}</p>
                            <a
                              href={method.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {method.source} <ArrowUpRight size={12} />
                            </a>
                            <p>{application.basis}</p>
                          </div>
                        );
                      })}
                    </details>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
