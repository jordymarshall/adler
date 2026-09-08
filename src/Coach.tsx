import { useState, type FormEvent } from "react";
import {
  Check,
  Pencil,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";
import { EmptyState, Modal, Tag } from "./components";
import { localDate, useStore } from "./store";
export { LiveCoach as Coach } from "./LiveCoach";

export function Memory() {
  const { data, commit } = useStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  function save(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    if (
      commit((d) => {
        if (editing === "new")
          d.memories.push({
            id: crypto.randomUUID(),
            text: text.trim(),
            date: localDate(),
          });
        else {
          const memory = d.memories.find((m) => m.id === editing)!;
          memory.text = text.trim();
          memory.date = localDate();
        }
      }, "Confirmed context saved.")
    )
      setEditing(null);
  }
  return (
    <div className="memory-page">
      <div className="page-heading">
        <div>
          <span className="section-kicker">ONLY WHAT YOU CHOOSE TO SHARE</span>
          <h2>Saved context</h2>
          <p>Context you’ve confirmed. Yours to correct or remove.</p>
        </div>
        <button
          className="button primary"
          onClick={() => {
            setEditing("new");
            setText("");
          }}
        >
          <Plus size={16} />
          Add context
        </button>
      </div>
      <p className="memory-explanation">
        <UserRound size={20} />
        This is confirmed context, separate from your goals and action history.
        It is saved to your workspace and included in live coaching requests
        to help plan your next step. Edit or remove anything Adler should stop using.
      </p>
      {data.memories.length ? (
        <div className="memory-list">
          {data.memories.map((m) => (
            <article className="panel memory-card" key={m.id} id={`record-${m.id}`}>
              <span className="memory-check">
                <Check size={18} />
              </span>
              <div>
                <Tag tone="sage">{data.evidenceCorrections?.some(correction => correction.active && correction.source.id === m.id) ? "Corrected · Review this context" : "Confirmed by you · All goals"}</Tag>
                <p>{m.text}</p>
                {data.evidenceCorrections?.filter(correction => correction.active && correction.source.id === m.id).map(correction => <p className="field-hint" key={correction.id}>{correction.reason} Adler is holding this earlier statement for review. Edit it to save your current context.</p>)}
                <span className="small-text muted">
                  {m.id === "memory-1"
                    ? "Fictional example context"
                    : "Entered by you"}{" "}
                  · {new Date(`${m.date}T12:00:00`).toLocaleDateString()}
                </span>
              </div>
              <button
                className="icon-button"
                aria-label={`Edit context: ${m.text}`}
                onClick={() => {
                  setEditing(m.id);
                  setText(m.text);
                }}
              >
                <Pencil size={17} />
              </button>
              <button
                className="icon-button"
                aria-label={`Remove context: ${m.text}`}
                onClick={() => setRemoving(m.id)}
              >
                <Trash2 size={17} />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="A clean page.">
          <p>
            No confirmed context is saved. Your goals and action records are
            still available.
          </p>
        </EmptyState>
      )}
      {editing && (
        <Modal
          title={
            editing === "new"
              ? "What would you like to remember?"
              : "Make this more accurate."
          }
          onClose={() => setEditing(null)}
        >
          <form onSubmit={save}>
            <label className="field-label" htmlFor="memory-text">
              Your confirmed context
            </label>
            <textarea
              id="memory-text"
              value={text}
              required
              maxLength={500}
              rows={4}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Mornings are the best time for focused work."
            />
            <p className="field-hint">
              Only save information you want kept across your goals.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button primary"
                disabled={!text.trim()}
              >
                Remember this <Check size={16} />
              </button>
            </div>
          </form>
        </Modal>
      )}
      {removing && (
        <Modal title="Remove this context?" onClose={() => setRemoving(null)}>
          <p>
            This removes the confirmed entry. It won’t be recreated from old
            conversations. Your separate goals and action history stay saved.
          </p>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setRemoving(null)}
            >
              Keep it
            </button>
            <button
              className="button primary"
              onClick={() => {
                if (
                  commit((d) => {
                    d.memories = d.memories.filter((m) => m.id !== removing);
                  }, "Context removed.")
                )
                  setRemoving(null);
              }}
            >
              Remove context
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
