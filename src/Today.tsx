import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { todayStep } from "../shared/next-step";
import { dateInZone } from "../shared/journey";
import { useStore } from "./store";
import { GoalWorkspace } from "./GoalWorkspace";
import { Onboarding } from "./Onboarding";
import { WeeklyReview } from "./WeeklyReview";

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
      {next.review && !chosenGoal ? (
        <WeeklyReview embedded />
      ) : goal ? (
        <GoalWorkspace key={goal.id} focusedGoalId={goal.id} home />
      ) : (
        <section className="next-step-card panel">
          <h1>A little space for what’s next.</h1>
          <p>Your goals are complete or on hold.</p>
          <Link className="button primary" to="/app/goals">
            Choose a goal →
          </Link>
        </section>
      )}
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
