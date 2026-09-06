import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, CalendarDays } from "lucide-react";
import { ProgressChart } from "./ProgressChart";
import { CheckInPreview } from "./CheckInPreview";
import { demoGoal, proposedCheckpoints } from "./landing-data";

const steps = [
  {
    label: "Find a starting point",
    title: "Bring the goal. We’ll work out the next step.",
    body: "Describe what you want. Adler asks what it needs, researches approaches, and proposes a result and first action. You can inspect why, or start when it fits.",
  },
  {
    label: "Start the plan",
    title: "One thing to do next.",
    body: "Your goal opens to a concrete action and a clear finish line. Start the plan here. The reasoning, milestones, and history are available below when you want them.",
  },
  {
    label: "Make time",
    title: "A place in your day.",
    body: "A suggested time appears with the action. Save it, choose another, or begin now. Connecting Google or iCloud is optional; external bookings require confirmation.",
  },
  {
    label: "Check in",
    title: "A small update keeps the plan real.",
    body: "After the session, Adler asks how it went. Add the relevant amount or context when useful. Connected iMessage and SMS conversations share your account’s records.",
  },
  {
    label: "Open the bigger picture",
    title: "Your progress, when you want to look.",
    body: "Expand Progress & history beneath your next step. Compare observed results with agreed checkpoints. Completing work and achieving the result remain separate.",
  },
  {
    label: "Review and adapt",
    title: "The right question, at the right time.",
    body: "Your review arrives in the same flow. Adler looks at your observations and asks what matters, then proposes a useful adjustment. You choose what to accept.",
  },
  {
    label: "A coach that knows you",
    title: "You don’t start from scratch every week.",
    body: "Adler remembers what you share: your preferences, constraints, and what happened when you tried the plan. It brings that context into later conversations and reviews, so the next recommendation can fit you better.",
  },
];
function WalkScreen({ step }: { step: number }) {
  const [time, setTime] = useState("Tuesday, 7:00 am");
  const [saved, setSaved] = useState(false);
  const [compare, setCompare] = useState(false);
  return (
    <div className={`walk-screen ${step === 3 ? "walk-phone-screen" : ""}`}>
      {step !== 3 && (
        <div className="walk-windowbar">
          <span>
            <i />
            <i />
            <i />
          </span>
          <b>
            adler /{" "}
            {step === 4
              ? "progress & history"
              : step === 6
                ? "what Adler remembers"
                : "your next step"}
          </b>
        </div>
      )}
      <div className="walk-screen-content">
        {step === 0 && (
          <>
            <span className="section-kicker">ONE PLACE TO START</span>
            <h3>What would you like to achieve?</h3>
            <div className="walk-example-input">
              I want to run 5 km without stopping.
            </div>
            <div className="walk-coach-question">
              What distance can you comfortably run now?
            </div>
            <p className="demo-footnote">
              One question at a time. No setup checklist.
            </p>
          </>
        )}
        {step === 1 && (
          <>
            <p className="walk-goal-name">Run my first 5 km</p>
            <span className="section-kicker">YOUR PLAN IS READY</span>
            <h3>Go for my next planned run.</h3>
            <p>
              Finished when I’ve completed the agreed session and recorded what
              happened.
            </p>
            <p className="demo-footnote">25 minutes · Illustrative plan</p>
            <button className="button primary" onClick={() => setSaved(!saved)}>
              {saved ? "Plan started" : "Start plan"}{" "}
              {saved ? <Check size={16} /> : <ArrowRight size={16} />}
            </button>
            <details className="quiet-disclosure">
              <summary>Why this plan?</summary>
              <p>
                The session is a first step to test. Adler uses the person’s
                context and relevant evidence to evaluate the approach.
              </p>
            </details>
            <div className="walk-closed-row">
              Progress & history <span>+</span>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <span className="section-kicker">
              {saved ? "YOU’RE SET" : "MAKE ROOM FOR THE NEXT STEP"}
            </span>
            <h3>Go for my next planned run.</h3>
            <div className="suggested-time">
              <CalendarDays size={20} />
              <div>
                <b>{time}</b>
                <span>25 minutes</span>
              </div>
            </div>
            {!saved ? (
              <button className="button primary" onClick={() => setSaved(true)}>
                Save time <Check size={16} />
              </button>
            ) : (
              <p>You can leave things here. Check in after the session.</p>
            )}
            <details className="quiet-disclosure">
              <summary>Choose another time</summary>
              {["Tuesday, 7:00 am", "Tuesday, 6:30 pm"].map((option) => (
                <button
                  className="text-link"
                  key={option}
                  onClick={() => {
                    setTime(option);
                    setSaved(false);
                  }}
                >
                  {option}
                </button>
              ))}
            </details>
            <p className="demo-footnote">
              Illustration only. No calendar booking is made here.
            </p>
          </>
        )}
        {step === 3 && <CheckInPreview />}
        {step === 4 && (
          <>
            <span className="section-kicker">PROGRESS & HISTORY</span>
            <ProgressChart
              goal={demoGoal}
              today="2026-10-17"
              compact
              proposedCheckpoints={compare ? proposedCheckpoints : undefined}
            />
            <p>2 km recorded. Your checkpoint called for 3 km by October 15.</p>
            <details className="quiet-disclosure">
              <summary>Compare a proposed adjustment</summary>
              <button
                className="button secondary"
                onClick={() => setCompare(!compare)}
              >
                {compare ? "Show current dates" : "Show proposed dates"}
              </button>
            </details>
          </>
        )}
        {step === 5 && (
          <>
            <span className="section-kicker">REVIEW YOUR WEEK</span>
            <h3>What got in the way?</h3>
            <p>
              Both weekday runs were missed. Your latest distance is still 2 km.
            </p>
            <div className="walk-example-input">
              Work ran late. Mornings are usually free.
            </div>
            <div className="walk-coach-question">
              Try moving the next sessions to the morning, then review how they
              went?
            </div>
            <button className="button primary" onClick={() => setSaved(!saved)}>
              {saved ? "Adjustment saved" : "Confirm changes"}
              <Check size={16} />
            </button>
            <p className="demo-footnote">
              An illustrative adjustment based on the person’s update.
            </p>
          </>
        )}
        {step === 6 && (
          <>
            <span className="section-kicker">WHAT ADLER REMEMBERS</span>
            <h3>A plan with your life in mind.</h3>
            <div className="remembered-context">
              <span>YOU SHARED</span>
              <p>“Mornings are usually free. Work often runs late.”</p>
              <span>SAVED CONTEXT</span>
              <p>Mornings are usually free. Work can run late.</p>
            </div>
            <div className="walk-coach-question">
              You mentioned mornings are free. Both evening runs were missed —
              shall we try mornings next week?
            </div>
            <p className="demo-footnote">
              An illustrative conversation. You can review, correct, or remove
              saved information.
            </p>
            <details className="quiet-disclosure">
              <summary>How does Adler decide what to change?</summary>
              <p>
                It combines your context and recorded results with relevant
                behavioural research, considers alternatives, and proposes an
                adjustment. The next review checks whether it helped.
              </p>
              <p>
                Open Why this plan? to inspect the evidence, measurement choice,
                and uncertainty.
              </p>
            </details>
          </>
        )}
      </div>
    </div>
  );
}
export function LandingWalkthrough() {
  return (
    <section className="landing-walkthrough" id="how-it-works">
      <div className="walkthrough-intro">
        <h2>
          Reach your goals with a plan
          <br />
          <em>that adapts to you.</em>
        </h2>
        <p>See how Adler helps you plan, act, and learn from what happens.</p>
      </div>
      <div id="walkthrough-screens">
        {steps.map((step, index) => (
          <article
            className="walk-step"
            id={`step-${index + 1}`}
            key={step.label}
          >
            <div className="walk-copy">
              <span className="walk-number">
                0{index + 1} / {step.label.toUpperCase()}
              </span>
              <h2>{step.title}</h2>
              <p>{step.body}</p>
            </div>
            <WalkScreen step={index} />
          </article>
        ))}
        <div className="walkthrough-end">
          <Link className="button primary" to="/app/goals/new">
            Start with your goal <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}
