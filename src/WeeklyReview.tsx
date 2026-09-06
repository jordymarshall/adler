import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { reviewSchedule } from "../shared/journey";
import { currentProgram, reviseProgram, useStore, formatDate } from "./store";
import { LiveCoach } from "./LiveCoach";

export function WeeklyReview({ embedded = false }: { embedded?: boolean }) {
  const { data, commit } = useStore();
  const schedule = reviewSchedule(data);
  const review = schedule.completed ?? schedule.current;
  const [talking, setTalking] = useState(false);
  const actions = data.actions.filter(
    (a) => a.date >= schedule.periodStart && a.date <= schedule.today,
  );
  const recorded = actions.filter((a) => a.outcome).length;
  function complete(decision: string) {
    commit((d) => {
      d.review = {
        ...schedule.current,
        decision,
        completedAt: new Date().toISOString(),
      };
      d.reviews.push({ ...d.review });
    }, "Review saved.");
  }
  const content = (
    <>
      {!embedded && (
        <Link className="back-link" to="/app/today">
          ← Today
        </Link>
      )}
      <span className="section-kicker">
        {formatDate(schedule.periodStart)} — {formatDate(schedule.periodEnd)}
      </span>
      <h1>{embedded ? "A moment to look back." : "Review your week"}</h1>
      {review.completedAt ? (
        <div className="review-complete">
          <Check size={25} />
          <h2>Your week is reviewed.</h2>
          <p>{review.decision}</p>
          <Link className="button primary" to="/app/today">
            Continue <ArrowRight size={16} />
          </Link>
          <details className="quiet-disclosure">
            <summary>Review options</summary>
            <button
              className="text-link"
              onClick={() =>
                commit((d) => {
                  d.review = {
                    ...schedule.current,
                    note: "",
                    decision: "",
                    completedAt: undefined,
                  };
                })
              }
            >
              Reopen this review
            </button>
          </details>
        </div>
      ) : talking ? (
        <LiveCoach
          embedded
          goalId="general"
          autoSend
          initialPrompt={`Guide my weekly review for ${schedule.periodStart} through ${schedule.today}. Use my note and recorded actions/results. Present one observation and ask at most one necessary question at a time. Compare plans with their review criteria. Recommend one useful next step, explain a proposed change briefly, and include completing this review when I agree. Do not require filling in every missing check-in.`}
          onContinue={() => setTalking(false)}
        />
      ) : (
        <>
          <p>
            {recorded
              ? `${recorded} ${recorded === 1 ? "check-in" : "check-ins"} this week.`
              : "A quiet week in your records."}{" "}
            Let’s decide what to keep or adjust.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setTalking(true);
            }}
          >
            <label className="form-field">
              Anything Adler should know?{" "}
              <span className="field-hint">Optional</span>
              <textarea
                aria-label="What helped or got in the way?"
                value={review.note}
                rows={2}
                maxLength={2000}
                onChange={(e) => {
                  const note = e.target.value;
                  commit((d) => {
                    d.review = { ...schedule.current, note };
                  });
                }}
                placeholder="What helped, or what got in the way…"
              />
            </label>
            <button className="button primary">
              Review with Adler <ArrowRight size={16} />
            </button>
          </form>
          <details className="quiet-disclosure">
            <summary>Other options</summary>
            <button
              className="text-link"
              onClick={() => complete("Keep the current plans")}
            >
              Keep my current plans
            </button>
            <button
              className="text-link"
              onClick={() => complete("Skipped — plans unchanged")}
            >
              Skip this review
            </button>
          </details>
        </>
      )}
      <details className="journey-disclosure">
        <summary>
          Review time · {data.reviewDay} at {data.automation.reviewTime}
        </summary>
        <p className="field-hint">
          A short check on what’s working. {data.timeZone}.
        </p>
        <label>
          Review day
          <select
            value={data.reviewDay}
            onChange={(e) =>
              commit((d) =>
                reviseProgram(d, currentProgram(d).version, {
                  reviewDay: e.target.value,
                  reason: "Changed review day.",
                }),
              )
            }
          >
            {[
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ].map((day) => (
              <option key={day}>{day}</option>
            ))}
          </select>
        </label>
        <label>
          Review time
          <input
            type="time"
            value={data.automation.reviewTime}
            onChange={(e) => {
              if (e.target.value)
                commit((d) => {
                  d.automation.reviewTime = e.target.value;
                });
            }}
          />
        </label>
      </details>
      {!!data.reviews.length && (
        <details className="journey-disclosure">
          <summary>Previous reviews</summary>
          {[...data.reviews].reverse().map((r, i) => (
            <article className="review-history-entry" key={i}>
              <b>{r.periodEnd ? formatDate(r.periodEnd) : "Previous review"}</b>
              <p>{r.decision}</p>
              {r.note && <p>{r.note}</p>}
            </article>
          ))}
        </details>
      )}
    </>
  );
  return (
    <div
      className={
        embedded
          ? "next-step-card panel review-step"
          : "journey-page review-step"
      }
    >
      {content}
    </div>
  );
}
