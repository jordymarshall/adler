import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Check, Play } from "lucide-react";
import {
  currentPlan,
  startGoal,
  formatDate,
  resultLabel,
  useStore,
  type Goal,
  type Action,
} from "./store";
import { dateInZone, reviewSchedule } from "../shared/journey";
import { PlanExplanation } from "./PlanExplanation";
import { GoalOrganization } from "./GoalOrganization";

export function GoalOverview({
  goal,
  onRecord,
}: {
  goal: Goal;
  onRecord: (action: Action) => void;
}) {
  const { data, commit } = useStore();
  const plan = currentPlan(goal);
  const draft = goal.status === "Draft";
  const active = goal.status === "Active";
  const action = data.actions
    .filter((a) => a.goalId === goal.id && !a.outcome)
    .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"))[0];
  const block = data.workBlocks.find((b) => b.id === action?.id);
  const review = reviewSchedule(data);
  const measure = plan.basis?.actionMeasure;
  const observations = data.actions
    .filter(
      (a) =>
        a.goalId === goal.id &&
        a.planVersion === plan.version &&
        a.outcome &&
        (measure?.period === "action"
          ? true
          : measure?.period === "day"
            ? a.date === review.today
            : a.date >= review.periodStart && a.date <= review.today),
    )
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.history.at(-1)?.at ?? "").localeCompare(b.history.at(-1)?.at ?? ""),
    );
  const amounts = (
    measure?.period === "action" ? observations.slice(-1) : observations
  ).filter((a) => a.amount !== undefined);
  const milestone = goal.milestones.find((m) => !m.done);
  const coach = `/app/coach?goal=${encodeURIComponent(goal.id)}`;
  const schedule = `/app/calendar?goal=${encodeURIComponent(goal.id)}${action ? `&action=${encodeURIComponent(action.id)}` : ""}`;
  return (
    <div className="goal-overview">
      {draft && (
        <section className="plan-launch panel">
          <div>
            <span className="section-kicker">YOUR PLAN IS READY TO REVIEW</span>
            <h2>Make this your starting point.</h2>
            <p>
              Review the result and first action below. Start when you’re ready,
              then choose when to do the work.
            </p>
          </div>
          <button
            className="button primary"
            onClick={() =>
              commit(
                (d) => startGoal(d, goal.id),
                "Plan started. Choose when to do your first action.",
              )
            }
          >
            <Play size={16} /> Start plan
          </button>
        </section>
      )}
      <div className="overview-columns">
        <div>
          <section className="panel goal-destination">
            <span className="section-kicker">WHAT SUCCESS LOOKS LIKE</span>
            <h2>{goal.success}</h2>
            <p>
              {goal.targetDate
                ? `Target ${formatDate(goal.targetDate, { month: "long", day: "numeric", year: "numeric" })}`
                : "Target date not chosen"}
            </p>
            <b>{resultLabel(goal)}</b>
            <GoalOrganization goal={goal} />
          </section>
          <section className="panel next-action-panel" id="next-action">
            <span className="section-kicker">
              {draft ? "YOUR FIRST ACTION" : "YOUR NEXT ACTION"}
            </span>
            {plan.durationMinutes && (
              <span className="action-duration">
                {plan.durationMinutes} min
              </span>
            )}
            <h2>{action?.title ?? "Choose the next useful step."}</h2>
            {action ? (
              <>
                <p className="criterion">
                  <Check size={17} />
                  <span>
                    <b>Finished when</b>
                    {action.criterion}
                  </span>
                </p>
                <p className="next-action-time">
                  <CalendarDays size={17} />{" "}
                  {block
                    ? new Date(block.start).toLocaleString(undefined, {
                        timeZone: data.timeZone,
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      }) + ` · ${data.timeZone}`
                    : action.date
                      ? `${formatDate(action.date)} · ${action.timing}`
                      : "Time not chosen"}
                </p>
                {!block && !action.date && action.timing !== "Unscheduled" && (
                  <p className="field-hint">
                    Suggested cue: {action.timing}. No time has been booked.
                  </p>
                )}
                {active && (
                  <div className="button-row">
                    {!action.date && (
                      <button
                        className="button primary"
                        onClick={() =>
                          commit((d) => {
                            const next = d.actions.find(
                              (a) => a.id === action.id,
                            )!;
                            next.date = dateInZone(d.timeZone);
                            next.timing = "Today · start when ready";
                          }, "Your next action is on Today. Record what happened when you finish.")
                        }
                      >
                        <Play size={16} /> Do now
                      </button>
                    )}
                    {!block && (
                      <Link
                        className={`button ${action.date ? "primary" : "secondary"}`}
                        to={schedule}
                      >
                        Choose a time <CalendarDays size={16} />
                      </Link>
                    )}
                    {(!action.date ||
                      action.date <= dateInZone(data.timeZone)) && (
                      <button
                        className="button secondary"
                        onClick={() => onRecord(action)}
                      >
                        Record what happened <Check size={16} />
                      </button>
                    )}
                  </div>
                )}
                {draft && (
                  <p className="field-hint">
                    Start the plan to put this action on Today or choose a
                    calendar slot.
                  </p>
                )}
              </>
            ) : (
              <Link
                className="button primary"
                to={`${coach}&prompt=${encodeURIComponent("Review what I completed and help me choose the next action for this goal.")}`}
              >
                Plan the next step with Adler <ArrowRight size={16} />
              </Link>
            )}
          </section>
          {measure && (
            <section className="panel action-observations">
              <span className="section-kicker">
                THE WORK YOU RECORDED ·{" "}
                {measure.period === "day"
                  ? "TODAY"
                  : measure.period === "week"
                    ? "THIS REVIEW WEEK"
                    : "LATEST ACTION"}
              </span>
              <h3>{measure.label}</h3>
              <p>
                {amounts.length
                  ? `${amounts.reduce((total, a) => total + a.amount!, 0)} ${measure.unit} recorded`
                  : "No amount recorded yet"}
                {measure.target !== null
                  ? ` · Suggested target ${measure.target} per ${measure.period}`
                  : ""}
              </p>
              <p className="field-hint">
                From actions using this plan. Missing amounts are unknown.
                Compare the work with the goal result during your review.
              </p>
            </section>
          )}
          {plan.basis ? (
            <PlanExplanation basis={plan.basis} />
          ) : (
            <section className="panel">
              <h2>Understand your approach.</h2>
              <p>
                This plan has no saved research explanation. Adler can evaluate
                the measurement and approach using your context and scientific
                literature.
              </p>
              <Link
                className="button secondary"
                to={`${coach}&prompt=${encodeURIComponent("Evaluate this goal’s measurement and approach using relevant scientific literature. Explain alternatives, limitations, and what we should test; propose a revised plan if appropriate.")}`}
              >
                Evaluate this plan with Adler <ArrowRight size={16} />
              </Link>
            </section>
          )}
        </div>
        <aside className="goal-overview-aside">
          {milestone && (
            <section className="panel">
              <span className="section-kicker">NEXT MILESTONE</span>
              <h3>{milestone.title}</h3>
              {milestone.dueDate && (
                <p className="field-hint">
                  Due {formatDate(milestone.dueDate)}
                </p>
              )}
              <p>{milestone.criterion}</p>
              <Link className="text-link" to={`/app/goals/${goal.id}/progress`}>
                View progress <ArrowRight size={15} />
              </Link>
            </section>
          )}
          <section className="panel">
            <span className="section-kicker">REVIEW & PLAN YOUR WEEK</span>
            <h3>
              {draft ? (
                "After you start the plan"
              ) : (
                <>
                  {formatDate(review.nextDate, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  · {data.automation.reviewTime}
                </>
              )}
            </h3>
            <p>
              Look at what happened across your goals, decide what to keep or
              change, and make room for the next steps.
            </p>
            <p className="field-hint">
              {data.timeZone} · Change the day and time in your review.
            </p>
            <Link className="text-link" to="/app/reviews/current">
              Open weekly review <ArrowRight size={15} />
            </Link>
          </section>
          <section className="panel">
            <span className="section-kicker">THIS GOAL’S CONVERSATIONS</span>
            <p>Keep questions, planning, and check-ins together.</p>
            <Link className="button secondary" to={coach}>
              Open goal chats <ArrowRight size={16} />
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
