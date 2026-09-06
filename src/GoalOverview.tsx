import { useEffect, useState } from "react";
import { ArrowRight, Check, Play } from "lucide-react";
import { beginAction, goalStep } from "../shared/next-step";
import {
  currentPlan,
  startGoal,
  useStore,
  formatDate,
  type Goal,
} from "./store";
import { RecordAction } from "./ActionCheckIn";
import { Calendar, savedPending } from "./Calendar";
import { LiveCoach } from "./LiveCoach";

export function GoalOverview({
  goal,
  actionId,
}: {
  goal: Goal;
  actionId?: string;
}) {
  const { data, commit } = useStore();
  const [now, setNow] = useState(() => new Date());
  const [mode, setMode] = useState<"step" | "schedule" | "checkin" | "chat">(
    "step",
  );
  const [prompt, setPrompt] = useState("");
  const [deferred, setDeferred] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  const step = goalStep(
    { ...data, actions: data.actions.filter((a) => !deferred.includes(a.id)) },
    goal,
    now,
    actionId,
  );
  const { action, block, phase } = step;
  const plan =
    goal.plans.find((p) => p.version === action?.planVersion) ??
    currentPlan(goal);
  function ask(text = "") {
    setPrompt(text);
    setMode("chat");
  }
  const pending = savedPending();
  if (pending?.goalId === goal.id)
    return (
      <section className="next-step-card panel" data-phase="booking">
        <Calendar
          embedded
          goalId={goal.id}
          actionId={pending.id}
          onDone={() => {
            setMode("step");
            setNow(new Date());
          }}
        />
      </section>
    );
  if (mode === "chat")
    return (
      <LiveCoach
        embedded
        goalId={goal.id}
        initialPrompt={prompt}
        autoSend={Boolean(prompt)}
        onContinue={() => setMode("step")}
      />
    );
  if (action && (mode === "checkin" || phase === "checkin"))
    return (
      <div className="next-step-card panel" data-phase="checkin">
        <RecordAction
          key={action.id}
          action={action}
          inline
          onClose={() => {
            setSaved(true);
            setMode("step");
          }}
        />
        <button
          className="button text-button"
          onClick={() => {
            setDeferred((ids) => [...ids, action.id]);
            setMode("step");
          }}
        >
          Leave this for later
        </button>
      </div>
    );
  if (action && (mode === "schedule" || phase === "schedule"))
    return (
      <section className="next-step-card panel" data-phase="schedule">
        <span className="section-kicker">MAKE ROOM FOR THE FIRST STEP</span>
        <h2>{action.title}</h2>
        <Calendar
          embedded
          goalId={goal.id}
          actionId={action.id}
          onDone={() => {
            setMode("step");
            setNow(new Date());
          }}
        />
        <button
          className="button text-button"
          onClick={() => {
            commit((d) => beginAction(d, action.id), "You’re ready to begin.");
            setMode("step");
          }}
        >
          I’ll do it now
        </button>
      </section>
    );
  return (
    <section
      className="next-step-card panel"
      data-phase={phase}
      aria-label="Your next step"
    >
      <span className="section-kicker">
        {phase === "draft"
          ? "YOUR PLAN IS READY"
          : phase === "waiting"
            ? "YOU’RE SET"
            : phase === "working"
              ? "ONE THING TO FOCUS ON"
              : phase === "next"
                ? "CHECK-IN SAVED"
                : phase === "inactive"
                  ? goal.status.toUpperCase()
                  : "YOUR NEXT STEP"}
      </span>
      <h2>
        {phase === "next"
          ? saved
            ? "That’s enough for now."
            : "Ready for the next step?"
          : phase === "inactive"
            ? "Pick this up when you’re ready."
            : (action?.title ?? plan.action)}
      </h2>
      {action && (
        <>
          <p className="next-step-criterion">
            Finished when{" "}
            {action.criterion.charAt(0).toLowerCase() +
              action.criterion.slice(1)}
          </p>
          <p className="next-step-meta">
            {block
              ? new Date(block.start).toLocaleString(undefined, {
                  timeZone: data.timeZone,
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : action.date && phase === "waiting"
                ? formatDate(action.date)
                : `${plan.durationMinutes ?? data.programs.at(-1)!.sessionMinutes} minutes`}
          </p>
        </>
      )}
      {phase === "draft" && (
        <>
          <p className="goal-outcome-summary">Working toward: {goal.success}</p>
          {plan.basis && (
            <p className="decision-limit">
              {plan.basis.decisionNote ?? plan.basis.uncertainty}
            </p>
          )}
          <button
            className="button primary"
            onClick={() => {
              commit((d) => startGoal(d, goal.id), "Plan started.");
              setSaved(false);
            }}
          >
            <Play size={16} /> Start plan
          </button>
        </>
      )}
      {phase === "ready" && action && (
        <button
          className="button primary"
          onClick={() =>
            commit((d) => beginAction(d, action.id), "You’re ready to begin.")
          }
        >
          <Play size={16} /> Start action
        </button>
      )}
      {phase === "working" && action && (
        <>
          <p>
            You can close Adler and do the work. Check in here when you finish.
          </p>
          <button className="button primary" onClick={() => setMode("checkin")}>
            <Check size={16} /> I’m finished
          </button>
        </>
      )}
      {phase === "waiting" && (
        <p>
          You can leave things here. Your check-in will appear after the
          session.
        </p>
      )}
      {phase === "next" && (
        <>
          <p>
            {saved
              ? "Your update is saved. Adler can help when you’re ready to continue."
              : "Adler can help you choose the next useful step."}
          </p>
          <button
            className="button primary"
            onClick={() =>
              ask(
                "Use my latest check-in and goal results to help me choose one next action. Ask only what you need; explain any proposed change briefly.",
              )
            }
          >
            Plan the next step <ArrowRight size={16} />
          </button>
        </>
      )}
      {phase !== "inactive" && (
        <details className="quiet-disclosure step-options">
          <summary>Something doesn’t fit?</summary>
          <button className="text-link" onClick={() => ask()}>
            Ask Adler
          </button>
          {action && !block && !action.startedAt && phase !== "draft" && (
            <button className="text-link" onClick={() => setMode("schedule")}>
              Choose a time
            </button>
          )}
          {action && phase !== "draft" && phase !== "waiting" && (
            <button className="text-link" onClick={() => setMode("checkin")}>
              Already did it? Check in
            </button>
          )}
        </details>
      )}
    </section>
  );
}
