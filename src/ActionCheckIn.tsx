import { useState } from "react";
import { Check } from "lucide-react";
import { dateInZone } from "../shared/journey";
import { recordAction, useStore, type Action, type Outcome } from "./store";
import { Modal } from "./components";
import { actionStep } from "../shared/adaptive-plan";
import { checkInContext } from "../shared/check-in-context";

export function RecordAction({
  action,
  onClose,
  inline = false,
}: {
  action: Action;
  onClose: () => void;
  inline?: boolean;
}) {
  const { data, commit } = useStore();
  const [outcome, setOutcome] = useState<Outcome | undefined>(action.outcome);
  const [note, setNote] = useState(action.note ?? "");
  const [amount, setAmount] = useState(action.amount?.toString() ?? "");
  const [minutes, setMinutes] = useState(action.actualMinutes?.toString() ?? "");
  const step = actionStep(data, action);
  const context = checkInContext(data, action);
  const measure = step?.measure ?? data.goals
    .find((g) => g.id === action.goalId)
    ?.plans.find((p) => p.version === action.planVersion)?.basis?.actionMeasure;
  function save(value: Outcome) {
    if (
      commit(
        (d) =>
          recordAction(
            d,
            action.id,
            value,
            note,
            amount === "" ? undefined : Number(amount),
            minutes === "" ? undefined : Number(minutes),
          ),
        "Check-in saved.",
      )
    )
      onClose();
  }
  const content = (
    <div className="checkin-content">
      <p className="checkin-action-name">{action.title}</p>
      <p className="field-hint">Finished when: {action.criterion}</p>
      {context.length > 0 && <aside className="checkin-context" aria-label="Relevant context">
        <b>Context for this check-in</b>
        {context.map((item, i) => <div key={i}>
          <p>{item.text}</p><small>{item.source} · {new Date(item.observedAt.includes("T") ? item.observedAt : `${item.observedAt}T12:00:00`).toLocaleDateString()}</small>
          <button type="button" className="text-link" onClick={() => setNote(previous => previous ? `${previous}\n${item.text}` : item.text)}>Use in my note</button>
        </div>)}
        <p className="field-hint">Confirm what happened below. Context does not record an outcome.</p>
      </aside>}
      <div className="outcome-buttons" role="group" aria-label="How did it go?">
        {(["Done", "Partly", "Didn’t happen"] as Outcome[]).map((value) => (
          <button
            key={value}
            className={`outcome-option ${outcome === value ? "selected" : ""}`}
            aria-pressed={outcome === value}
            disabled={action.date > dateInZone(data.timeZone)}
            onClick={() => {
              setOutcome(value);
              if (!step && !context.length && !measure && value === "Done" && !action.outcome) save(value);
            }}
          >
            {value}
          </button>
        ))}
      </div>
      {outcome && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save(outcome);
          }}
        >
          {measure && (
            <label className="form-field">
              {measure.label} ({measure.unit}) · optional
              <input
                type="number"
                min="0"
                max="1000000"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Leave blank if unknown"
              />
            </label>
          )}
          <details className="quiet-disclosure">
            <summary>
              {outcome === "Done"
                ? "Add a note"
                : "What got in the way? · optional"}
            </summary>
            <label className="form-field">
              Your note
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={2000}
                rows={2}
              />
            </label>
          </details>
          {step && <details className="quiet-disclosure"><summary>Time spent · optional</summary>
            <label className="form-field">Actual minutes
              <input type="number" min="0" max="1440" step="any" value={minutes} onChange={e => setMinutes(e.target.value)} placeholder="Leave blank if unknown" />
            </label>
          </details>}
          <button className="button primary">
            Save check-in <Check size={16} />
          </button>
        </form>
      )}
      {action.outcome && (
        <button
          className="button text-button"
          onClick={() => {
            if (commit((d) => recordAction(d, action.id), "Check-in cleared."))
              onClose();
          }}
        >
          Clear this update
        </button>
      )}
      <p className="field-hint">
        This records the work. Goal results stay separate.
      </p>
    </div>
  );
  return inline ? (
    <section className="inline-checkin" aria-label="Check in">
      <h2>How did it go?</h2>
      {content}
    </section>
  ) : (
    <Modal title="How did it go?" onClose={onClose}>
      {content}
    </Modal>
  );
}
