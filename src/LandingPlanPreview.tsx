import { useState } from "react";
import { ArrowRight, CalendarDays, Check } from "lucide-react";
import { Mark } from "./LandingArt";
import { ProgressChart } from "./ProgressChart";
import { demoGoal } from "./landing-data";

export function LandingPlanPreview() {
  return (
    <div
      className="landing-plan-preview"
      aria-label="Example goal in Adler"
      role="group"
    >
      <div className="preview-windowbar">
        <Mark />
        <span>adler / your next step</span>
        <small>Interactive example</small>
      </div>
      <div className="preview-content">
        <header className="preview-goal">
          <h4>Run my first 5 km.</h4>
          <p>Without stopping · By November 15</p>
        </header>
        <div className="preview-next-step">
          <span className="section-kicker">YOUR PLAN IS READY</span>
          <h4>Go for my next planned run.</h4>
          <p>Complete the planned session, then record how it went.</p>
          <span className="preview-duration">25 minutes</span>
          <a className="button primary" href="#step-2">
            Start plan <ArrowRight size={16} />
          </a>
        </div>
        <details className="preview-disclosure">
          <summary>Why this plan?</summary>
          <p>
            Adler uses your starting point, constraints, and relevant research
            to propose a strategy. You can inspect its evidence, assumptions,
            and alternatives before starting.
          </p>
        </details>
        <details className="preview-disclosure preview-progress">
          <summary>
            Progress & history <span>2 / 5 km</span>
          </summary>
          <div className="preview-progress-content">
            <h4>Longest run without stopping</h4>
            <p>2 km recorded · 3 km due October 15</p>
            <ProgressChart
              goal={demoGoal}
              today="2026-10-17"
              compact
              graphOnly
            />
          </div>
        </details>
        <details className="preview-disclosure">
          <summary>Questions & conversations</summary>
          <p>
            Ask Adler about this goal whenever you need help. The conversation
            stays with the goal, so your plan and context stay together.
          </p>
        </details>
      </div>
    </div>
  );
}

export function LandingSchedulePreview() {
  const [time, setTime] = useState("Tuesday, 6:30 pm");
  const [saved, setSaved] = useState(false);
  return (
    <div className="landing-schedule-preview">
      <span className="section-kicker">
        {saved ? "YOU’RE SET" : "MAKE TIME FOR YOUR NEXT STEP"}
      </span>
      <h4>Go for my next planned run.</h4>
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
        <p role="status">
          You can leave things here. Check in after the session.
        </p>
      )}
      <details className="preview-disclosure">
        <summary>Choose another time</summary>
        <div className="preview-time-options">
          {["Tuesday, 6:30 pm", "Tuesday, 7:00 am"].map((option) => (
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
        </div>
      </details>
      <p className="demo-footnote">
        Illustration only. No calendar booking is made here.
      </p>
    </div>
  );
}
