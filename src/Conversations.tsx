import { useState } from "react";
import { MessageCircle, Plus, Pencil, Trash2, Folder } from "lucide-react";
import { Modal } from "./components";
import { api } from "./api";
import { useStore } from "./store";
import type { Conversation } from "../shared/workspace";

export function Conversations({
  selected,
  goalId = "general",
  disabled,
  onSelect,
  onError,
}: {
  selected?: string;
  goalId?: string;
  disabled: boolean;
  onSelect: (id: string, goalId: string) => void;
  onError: (message: string) => void;
}) {
  const { data, flush, refresh } = useStore();
  const [editing, setEditing] = useState<Conversation | null>(null);
  const [removing, setRemoving] = useState<Conversation | null>(null);
  const [busy, setBusy] = useState(false);
  async function save(
    operation: "create" | "update" | "delete",
    conversation: Conversation,
  ) {
    setBusy(true);
    try {
      await flush();
      await api("conversations", {
        entity: "conversation",
        operation,
        id: conversation.id,
        parentId: null,
        values: JSON.stringify(
          operation === "delete"
            ? {}
            : { title: conversation.title, goalId: conversation.goalId },
        ),
      });
      await refresh();
      setEditing(null);
      setRemoving(null);
      if (operation !== "delete")
        onSelect(conversation.id, conversation.goalId);
      else if (selected === conversation.id) onSelect("", conversation.goalId);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const groups = [{ id: "general", title: "General" }, ...data.goals];
  return (
    <aside className="conversation-library" aria-label="Your chats">
      <div className="conversation-library-heading">
        <h2>Chats</h2>
        <button
          className="icon-button"
          aria-label="New chat"
          disabled={disabled || busy}
          onClick={() =>
            void save("create", {
              id: crypto.randomUUID(),
              title: "New conversation",
              goalId,
              createdAt: new Date().toISOString(),
            })
          }
        >
          <Plus size={18} />
        </button>
      </div>
      <div className="conversation-groups">
        {groups
          .map((group) => (
            <section key={group.id}>
              <h3><Folder size={14} /> {group.title}</h3>
              {data.conversations
                .filter((c) => c.goalId === group.id)
                .slice()
                .reverse()
                .map((c) => (
                  <div
                    key={c.id}
                    className={`conversation-item ${selected === c.id ? "selected" : ""}`}
                  >
                    <button
                      disabled={disabled || busy}
                      aria-current={selected === c.id ? "true" : undefined}
                      onClick={() => onSelect(c.id, c.goalId)}
                    >
                      <MessageCircle size={14} />
                      <span>{c.title}</span>
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Edit chat: ${c.title}`}
                      disabled={disabled || busy}
                      onClick={() => setEditing({ ...c })}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Delete chat: ${c.title}`}
                      disabled={disabled || busy}
                      onClick={() => setRemoving(c)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              {!data.conversations.some((c) => c.goalId === group.id) && (
                  <button className="text-link" disabled={disabled || busy} onClick={() => void save("create", { id: crypto.randomUUID(), title: "New conversation", goalId: group.id, createdAt: new Date().toISOString() })}>Start a chat</button>
                )}
            </section>
          ))}
      </div>
      {editing && (
        <Modal title="Organize this chat" onClose={() => setEditing(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save("update", editing);
            }}
          >
            <label className="form-field">
              Chat name
              <input
                required
                maxLength={200}
                value={editing.title}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
              />
            </label>
            <label className="form-field">
              Goal folder
              <select
                value={editing.goalId}
                onChange={(e) =>
                  setEditing({ ...editing, goalId: e.target.value })
                }
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </label>
            <p className="field-hint">
              Adler can use all your goals when needed. This folder keeps the
              conversation organized.
            </p>
            <div className="modal-actions">
              <button
                className="button primary"
                disabled={busy || !editing.title.trim()}
              >
                Save chat
              </button>
            </div>
          </form>
        </Modal>
      )}
      {removing && (
        <Modal title="Delete this chat?" onClose={() => setRemoving(null)}>
          <p>
            The messages in “{removing.title}” will be deleted. Your goals,
            saved context and completed changes stay in your workspace.
          </p>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setRemoving(null)}
            >
              Cancel
            </button>
            <button
              className="button primary"
              disabled={busy}
              onClick={() => void save("delete", removing)}
            >
              Delete conversation
            </button>
          </div>
        </Modal>
      )}
    </aside>
  );
}
