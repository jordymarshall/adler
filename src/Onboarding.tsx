import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Compass, CalendarDays, FlaskConical } from "lucide-react";
import { useStore } from "./store";

export function Onboarding() {
  const { data } = useStore();
  const [goal, setGoal] = useState("");
  const navigate = useNavigate();
  return (
    <div className="onboarding-page">
      <span className="section-kicker">
        {data.goals.length ? "MAKE ROOM FOR WHAT MATTERS" : "WELCOME TO ADLER"}
      </span>
      <h1>
        {data.goals.length
          ? "What would you like to work toward?"
          : "A goal. A clear plan. Your next step."}
      </h1>
      <p className="onboarding-intro">
        Bring the ambition. Adler will help define success, investigate
        approaches that fit, and turn your plan into something you can act on.
      </p>
      <form
        className="panel onboarding-intake"
        onSubmit={(event) => {
          event.preventDefault();
          navigate(
            `/app/coach?goal=general&prompt=${encodeURIComponent(`Help me develop a goal and an evidence-informed plan: ${goal.trim()}`)}`,
          );
        }}
      >
        <label htmlFor="first-goal">What do you want to achieve?</label>
        <textarea
          id="first-goal"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          rows={3}
          maxLength={1500}
          required
          placeholder="Describe it in your own words. You don’t need to know the plan or how to measure it yet."
        />
        <div className="button-row">
          <button className="button primary" disabled={!goal.trim()}>
            Work it out with Adler <ArrowRight size={17} />
          </button>
          <Link className="text-link" to="/app/goals/new/manual">
            Set up a goal manually
          </Link>
        </div>
        <p className="field-hint">
          You’ll review the proposed goal, measurements, and first action before
          starting. Coaching uses your connected AI provider.
        </p>
      </form>
      <div className="onboarding-steps">
        {[
          {
            Icon: Compass,
            title: "1. Define success",
            text: "Clarify what you want and what would count as progress.",
          },
          {
            Icon: FlaskConical,
            title: "2. Understand the plan",
            text: "See the approach, research, alternatives, and assumptions behind it.",
          },
          {
            Icon: CalendarDays,
            title: "3. Start and learn",
            text: "Choose your first action’s time. Review what happens and adapt with Adler.",
          },
        ].map(({ Icon, title, text }) => (
          <div key={title}>
            <Icon size={22} />
            <h2>{title}</h2>
            <p>{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
