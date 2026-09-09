import { useState, type FormEvent } from "react";
import { Modal } from "./components";
import { formatDate, recordAction, useStore, type Action, type Outcome } from "./store";
import { inputMeasure } from "../shared/goal-view";
import { dateInZone } from "../shared/journey";

export function GoalActionReport({ action, outcome, onClose }: { action: Action; outcome: Outcome; onClose: () => void }) {
  const { data, commit } = useStore();
  const goal = data.goals.find(goal => goal.id === action.goalId)!;
  const plan = goal.plans.find(plan => plan.version === action.planVersion)!;
  const measure = inputMeasure(plan, action.stepId);
  const [choice, setChoice] = useState(outcome);
  const [amount, setAmount] = useState(action.amount?.toString() ?? "");
  const [minutes, setMinutes] = useState(action.actualMinutes?.toString() ?? "");
  const [note, setNote] = useState(action.note ?? "");
  const [original] = useState(() => JSON.stringify(action));
  function save(event: FormEvent) {
    event.preventDefault();
    if (commit(draft => {
      const current = draft.actions.find(item => item.id === action.id);
      if (JSON.stringify(current) !== original) throw new Error("This report changed. Close and reopen it to use the latest version.");
      recordAction(draft, action.id, choice, note.trim(), choice === "Didn’t happen" ? 0 : amount === "" ? undefined : Number(amount), choice === "Didn’t happen" ? 0 : minutes === "" ? undefined : Number(minutes));
    }, `${action.title} · ${formatDate(action.date || dateInZone(data.timeZone))}: ${choice}. Report saved.`)) onClose();
  }
  return <Modal title={action.outcome ? "Correct your report" : "Report this action"} onClose={onClose}>
    <p><strong>{action.title}</strong> · {formatDate(action.date || dateInZone(data.timeZone))}<br /><span className="muted">{action.criterion}</span></p>
    <form className="program-form" onSubmit={save}>
      <label>What happened?<select value={choice} onChange={event => setChoice(event.target.value as Outcome)}>{(["Done", "Partly", "Didn’t happen"] as const).map(value => <option key={value}>{value}</option>)}</select></label>
      {choice !== "Didn’t happen" && measure.metric === "amount" && <label>{measure.label} ({measure.unit})<input type="number" min="0" max="1000000" step="any" value={amount} onChange={event => setAmount(event.target.value)} /><small>Leave blank if you don’t know the amount.</small></label>}
      {choice !== "Didn’t happen" && <label>Actual time (minutes, optional)<input type="number" min="0" max="1440" step="1" value={minutes} onChange={event => setMinutes(event.target.value)} /></label>}
      <label>Anything to remember? (optional)<textarea value={note} onChange={event => setNote(event.target.value)} maxLength={1800} rows={2} /></label>
      <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button className="button primary">Save report</button></div>
    </form>
  </Modal>;
}
