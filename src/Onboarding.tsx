import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "./api";
import { useStore } from "./store";
import { LiveCoach } from "./LiveCoach";

export function Onboarding() {
  const [goal, setGoal] = useState("");
  const [chatId, setChatId] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const { data, flush, refresh } = useStore();
  const navigate = useNavigate();
  async function begin(event: FormEvent) {
    event.preventDefault();
    setStarting(true);
    setError("");
    try {
      await flush();
      const id = crypto.randomUUID();
      await api("conversations", {
        entity: "conversation",
        operation: "create",
        id,
        parentId: null,
        values: JSON.stringify({
          title: goal.trim().slice(0, 70),
          goalId: "general",
        }),
      });
      await refresh();
      setChatId(id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStarting(false);
    }
  }
  return (
    <div className="onboarding-page journey-page">
      {chatId ? (
        <>
          <h1>Let’s shape your goal.</h1>
          <LiveCoach
            embedded
            goalId="general"
            initialConversationId={chatId}
            initialPrompt={`Help me develop this goal and a researched plan: ${goal.trim()}`}
            autoSend
            onContinue={async (id) => {
              if (!id) {
                setChatId("");
                return;
              }
              await flush();
              await api("conversations", {
                entity: "conversation",
                operation: "update",
                id: chatId,
                parentId: null,
                values: JSON.stringify({
                  goalId: id,
                  title:
                    data.goals.find((g) => g.id === id)?.title ??
                    goal.trim().slice(0, 70),
                }),
              });
              await refresh();
              navigate(`/app/goals/${id}`);
            }}
          />
        </>
      ) : (
        <>
          <span className="section-kicker">ONE PLACE TO START</span>
          <h1>What would you like to achieve?</h1>
          <p>
            Describe it in your own words. We’ll work out the next step
            together.
          </p>
          <form
            className="onboarding-intake"
            onSubmit={(event) => void begin(event)}
          >
            <label htmlFor="first-goal" className="sr-only">
              What do you want to achieve?
            </label>
            <textarea
              id="first-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              required
              rows={3}
              maxLength={1500}
              placeholder="Something you keep meaning to do…"
              autoFocus
            />
            {error && (
              <p className="inline-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="button primary"
              disabled={!goal.trim() || starting}
            >
              {starting ? "Opening…" : "Continue"} <ArrowRight size={17} />
            </button>
          </form>
          <details className="quiet-disclosure">
            <summary>Prefer to set it up yourself?</summary>
            <Link className="text-link" to="/app/goals/new/manual">
              Set up a goal manually →
            </Link>
          </details>
        </>
      )}
    </div>
  );
}
