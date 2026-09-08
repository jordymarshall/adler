import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { todayStep } from "../shared/next-step";
import { dateInZone } from "../shared/journey";
import { useStore } from "./store";
import { GoalOverview } from "./GoalOverview";
import { Onboarding } from "./Onboarding";

export function Today() {
  const { data } = useStore();
  const [params, setParams] = useSearchParams();
  const chosen = params.get("goal") ?? "";
  function setChosen(id: string) {
    setParams(id ? { goal: id } : {});
  }
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  const next = todayStep(data, now);
  const chosenGoal = data.goals.find((g) => g.id === chosen);
  const goal = chosenGoal ?? next.step?.goal;
  if (!data.goals.length) return <Onboarding />;
  return (
    <div className="journey-page today-journey">
      <span className="today-date">
        {new Date(
          `${dateInZone(data.timeZone, now)}T12:00:00`,
        ).toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </span>
      {goal ? (
        <>
          <header className="today-goal-heading"><span className="section-kicker">YOUR NEXT ACTION</span><h1>{goal.title}</h1></header>
          <GoalOverview key={goal.id} goal={goal} />
          <nav className="today-plan-links" aria-label="More about this goal"><Link to={`/app/goals/${goal.id}`}>Plan & progress ↗</Link><Link to={`/app/insights?goal=${goal.id}`}>What we’re learning ↗</Link></nav>
        </>
      ) : (
        <section className="next-step-card panel">
          <h1>A little space for what’s next.</h1>
          <p>Your goals are complete or on hold.</p>
          <Link className="button primary" to="/app/goals">
            Choose a goal →
          </Link>
        </section>
      )}
      {next.review && <p className="today-review-note">Ready to look back? <Link to="/app/check-in?prompt=Let’s%20review%20what%20happened%20this%20week%20and%20what%20to%20adjust.">Review your week in Check-in ↗</Link></p>}
      <details className="journey-disclosure focus-picker">
        <summary>Choose something else</summary>
        {data.goals
          .filter((g) => g.status === "Active" || g.status === "Draft")
          .map((g) => (
            <button
              className="focus-option"
              key={g.id}
              onClick={(e) => {
                setChosen(g.id);
                e.currentTarget.closest("details")?.removeAttribute("open");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              {g.title}
              <span>{g.status === "Draft" ? "Review plan" : "Continue"} →</span>
            </button>
          ))}
        <Link className="text-link" to="/app/reviews/current">
          Review my week
        </Link>
        <Link className="text-link" to="/app/goals/new">
          Start a new goal
        </Link>
        {chosen && (
          <button className="text-link" onClick={() => setChosen("")}>
            Return to Adler’s next step
          </button>
        )}
      </details>
    </div>
  );
}
