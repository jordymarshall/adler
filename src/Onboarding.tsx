import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
export function Onboarding() {
  const [goal, setGoal] = useState("");
  const navigate = useNavigate();
  function begin(event: FormEvent) {
    event.preventDefault();
    if (goal.trim())
      navigate(
        `/app/coach?intent=new-goal&prompt=${encodeURIComponent(`Help me develop this goal and a plan around how I work: ${goal.trim()}`)}`,
      );
  }
  return (
    <div className="onboarding-page journey-page">
      <span className="section-kicker">ONE PLACE TO START</span>
      <h1>What would you like to achieve?</h1>
      <p>
        Describe it in your own words. We’ll work out the next step together.
      </p>
      <form className="onboarding-intake" onSubmit={begin}>
        <label htmlFor="first-goal" className="sr-only">
          What do you want to achieve?
        </label>
        <textarea
          id="first-goal"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          required
          rows={3}
          maxLength={1500}
          placeholder="Something you keep meaning to do…"
          autoFocus
        />
        <button className="button primary" disabled={!goal.trim()}>
          Continue <ArrowRight size={17} />
        </button>
      </form>
      <details className="quiet-disclosure">
        <summary>Prefer to set it up yourself?</summary>
        <Link className="text-link" to="/app/goals/new/manual">
          Set up a goal manually →
        </Link>
      </details>
    </div>
  );
}
