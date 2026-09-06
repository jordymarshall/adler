import { useState } from "react";
import { ArrowRight, CalendarDays, Check } from "lucide-react";
import { Mark } from "./LandingArt";

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
          <h3>Run my first 5 km.</h3>
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
        <nav className="preview-depth" aria-label="Explore the example plan">
          <a href="#step-2">
            Why this plan? <ArrowRight size={14} />
          </a>
          <a href="#step-5">
            Progress & history <ArrowRight size={14} />
          </a>
          <a href="#step-4">
            Questions & conversations <ArrowRight size={14} />
          </a>
        </nav>
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
      <div className="schedule-day">
        <span>Tuesday, October 13</span>
        <small>Your day</small>
      </div>
      <div className="schedule-slots">
        {!time.includes("7:00") && (
          <div className="schedule-busy">
            <time>9 am–5 pm</time>
            <span>Work</span>
          </div>
        )}
        <div className="suggested-time">
          <CalendarDays size={20} />
          <div>
            <b>{time}</b>
            <span>25-minute run · Then a 5-minute check-in</span>
          </div>
        </div>
        <div className="schedule-open">
          <time>{time.includes("7:00") ? "7:30 am" : "7:00 pm"}</time>
          <span>Time for the rest of life</span>
        </div>
        {time.includes("7:00") && (
          <div className="schedule-busy">
            <time>9 am–5 pm</time>
            <span>Work</span>
          </div>
        )}
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
      <p className="schedule-learning">
        Texts and check-ins help Adler find times that fit better. Calendar
        updates wait for your confirmation.
      </p>
      <p className="demo-footnote">
        Illustration only. No calendar booking is made here.
      </p>
    </div>
  );
}
