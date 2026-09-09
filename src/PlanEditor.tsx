import { useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { currentPlan, useStore, type Data, type Goal } from "./store";
import { api } from "./api";
import { Modal } from "./components";
import { CoachMessage } from "./CoachMessage";
import { ProposalChanges } from "./ProposalChanges";
import type { Proposal } from "../server/service";

export type PlanEditScope = { kind: "plan" } | { kind: "milestone"; id: string } | { kind: "action"; id?: string };

export function PlanEditor({ goal, scope, onClose, onApplied }: { goal: Goal; scope: PlanEditScope; onClose: () => void; onApplied?: () => void }) {
  const { data, flush, refresh } = useStore();
  const [original] = useState(() => structuredClone(goal));
  const plan = currentPlan(original);
  const item = scope.kind === "milestone" ? original.milestones.find(item => item.id === scope.id)
    : scope.kind === "action" ? plan.adaptive?.steps.find(step => step.id === scope.id) : undefined;
  const initial: Record<string, string> = scope.kind === "plan" ? {} : scope.kind === "milestone" ? { title: item?.title ?? "", criterion: item?.criterion ?? "", dueDate: original.milestones.find(item => item.id === scope.id)?.dueDate ?? "" }
    : { title: item?.title ?? plan.action, criterion: item?.criterion ?? plan.criterion, timing: plan.adaptive?.steps.find(step => step.id === (scope.kind === "action" ? scope.id : undefined))?.cue ?? plan.timing };
  const [fields, setFields] = useState<Record<string, string>>(initial);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [result, setResult] = useState<{ conversationId: string; data: Data; reply?: string; proposal?: Proposal | null }>();
  const request = useRef<{ message: string; id: string; sent: boolean } | undefined>(undefined);
  const changed = Object.entries(fields).filter(([key, value]) => value !== initial[key]);
  const pending = result?.proposal?.status === "pending" ? result.proposal : undefined;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !changed.length && !note.trim()) return;
    setBusy(true); setError("");
    const message = `Edit my ${scope.kind} in goal "${original.title.slice(0, 250)}" (${original.id}), plan version ${plan.version}${"id" in scope && scope.id ? `, ${scope.kind} ID ${scope.id}` : ""}.\n${changed.map(([key, value]) => `${key}: ${JSON.stringify(initial[key]?.slice(0, 200))} → ${JSON.stringify(value)}`).join("\n")}\n${note.trim()}\nUse these as requested edits, reconcile the affected inputs, measures, milestone links and schedule within my capacity, and preserve reported/booked history. Keep milestone outcomes separate from executable actions. Do not invent business strategy. Explain any further suggestion before changing it.`;
    if (request.current?.message !== message) request.current = { message, id: crypto.randomUUID(), sent: false };
    try {
      await flush();
      const fresh = await api<{ data: Data }>("workspace");
      const current = fresh.data.goals.find(item => item.id === original.id);
      if (!request.current.sent && (!current || currentPlan(current).version !== plan.version || JSON.stringify(current.milestones) !== JSON.stringify(original.milestones)))
        throw new Error("This plan changed while you were editing. Close and reopen the editor to use the latest plan.");
      request.current.sent = true;
      const response = await api<NonNullable<typeof result>>("coach", { message, goalId: goal.id, focusGoalId: goal.id, conversationId: result?.conversationId, requestId: request.current.id });
      setResult(response); await refresh();
      const savedGoal = response.data.goals.find(item => item.id === original.id);
      if (response.proposal?.status === "applied" || savedGoal && (currentPlan(savedGoal).version !== plan.version || JSON.stringify(savedGoal.milestones) !== JSON.stringify(original.milestones))) onApplied?.();
    } catch (error) { await refresh().catch(() => {}); setError(error instanceof Error ? error.message : "The change could not be processed. Your edits are still here."); }
    finally { setBusy(false); }
  }
  async function decide(choice: "approve" | "dismiss") {
    if (!pending) return;
    setBusy(true); setError("");
    try {
      await flush(); await api(`proposals/${pending.id}/${choice}`, {}); await refresh();
      if (choice === "approve") onApplied?.();
      setResult(previous => previous ? { ...previous, proposal: { ...pending, status: choice === "approve" ? "applied" : "dismissed" } } : previous);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not update this suggestion."); }
    finally { setBusy(false); }
  }
  const reply = result?.data.messages.filter(message => message.role === "coach" && message.conversationId === result.conversationId).at(-1);
  return <Modal title={`Edit ${scope.kind}`} onClose={() => { if (!busy) onClose(); }}>
    <p className="field-hint">Goal · {original.title}{item ? ` / ${scope.kind === "milestone" ? "Milestone outcome" : "Action input"} · ${item.title}` : ""}</p>
    {error && <p role="alert" className="inline-error">{error}</p>}
    {result ? <div className="plan-edit-result">
      <strong>{pending ? "Suggested adjustment" : result.proposal?.status === "applied" ? "Plan updated" : result.proposal?.status === "dismissed" ? "Suggestion dismissed" : "From Adler"}</strong>
      {reply && <CoachMessage data={result.data} message={reply} />}
      {pending && <><ProposalChanges data={data} changes={pending.changes} beforeRecords={pending.before} /><div className="modal-actions"><button className="button primary" disabled={busy} onClick={() => void decide("approve")}>Accept adjustment</button><button className="button secondary" disabled={busy} onClick={() => void decide("dismiss")}>Keep current plan</button></div></>}
      <div className="modal-actions"><Link className="text-link" to={`/app/check-in?goal=${goal.id}&chat=${result.conversationId}`}>Continue with Coach ↗</Link><button className="button secondary" disabled={busy} onClick={onClose}>Done</button></div>
    </div> : <form className="program-form" onSubmit={submit} aria-busy={busy}>
      {Object.entries(fields).map(([key, value]) => <label key={key}>{key === "title" ? scope.kind === "milestone" ? "Milestone outcome" : "Action to do" : key === "criterion" ? scope.kind === "milestone" ? "Reached when" : "Action is done when" : key === "dueDate" ? "Target date (optional)" : "Timing or cue"}
        <input type={key === "dueDate" ? "date" : "text"} value={value} required={key !== "dueDate"} maxLength={key === "criterion" ? 500 : 300} disabled={busy} onChange={event => setFields(previous => ({ ...previous, [key]: event.target.value }))} />
      </label>)}
      <label>{scope.kind === "plan" ? "What should change?" : "Anything else Adler should adjust? (optional)"}<textarea rows={3} value={note} maxLength={1500} disabled={busy} onChange={event => setNote(event.target.value)} placeholder={scope.kind === "plan" ? "These milestones are tasks. Help me choose useful subgoals and concrete inputs." : "For example, make the workload fit two hours a week."} /></label>
      <p className="field-hint">Adler checks this against your goals, capacity and learning.</p>
      {busy && <p className="plan-edit-loading" role="status"><LoaderCircle size={18} />Adler is adjusting your plan…</p>}
      <div className="modal-actions"><button type="button" className="button secondary" disabled={busy} onClick={onClose}>Cancel</button><button className="button primary" disabled={busy || !changed.length && !note.trim()}>{busy ? "Adjusting…" : "Update with Adler"}</button></div>
    </form>}
  </Modal>;
}
