import { referencedText } from "../shared/record-links";
import { Conversations } from "./Conversations";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUp, Check } from "lucide-react";
import { AdlerAvatar } from "./persona";
import { api, type ServiceStatus } from "./api";
import { useStore, reactionTypes, reactionEmoji } from "./store";
import { METHODS } from "./methods";
import type { Proposal } from "../server/service";
import { ProposalChanges, ProposalEssentials } from "./ProposalChanges";
export function LiveCoach() {
  const { data, flush, refresh } = useStore(),
    [params, setParams] = useSearchParams();
  const requestedGoal = params.get("goal") ?? "general";
  const selectedChat = params.get("chat");
  const conversation = selectedChat
    ? data.conversations.find((c) => c.id === selectedChat)
    : data.conversations.filter((c) => c.goalId === "general").at(-1);
  const selected = conversation?.goalId ?? "general";
  function selectChat(id: string, goalId: string) {
    setParams(
      id
        ? {
            chat: id,
            ...(requestedGoal !== "general" ? { goal: requestedGoal } : {}),
          }
        : { goal: goalId },
    );
  }
  const goal = data.goals.find((g) => g.id === requestedGoal);
  const key = `adler-coach-draft-${conversation?.id ?? selected}`;
  const [text, setText] = useState(
      () => params.get("prompt") ?? sessionStorage.getItem(key) ?? "",
    ),
    [sending, setSending] = useState(false),
    [error, setError] = useState(""),
    [service, setService] = useState<ServiceStatus | null>(null),
    [proposals, setProposals] = useState<Proposal[]>([]);
  const latestApplied = proposals.find(
    (p) =>
      p.status === "applied" &&
      (p.conversationId
        ? p.conversationId === conversation?.id
        : p.goalId === selected),
  );
  const continuedGoal =
    data.goals.find((g) =>
      latestApplied?.changes.some(
        (c) => c.entity === "goal" && c.operation === "create" && c.id === g.id,
      ),
    ) ?? goal;
  const hasPending = proposals.some((p) => p.status === "pending");
  const bottom = useRef<HTMLDivElement>(null),
    request = useRef<{ text: string; goal: string; id: string } | null>(null);
  const messages = data.messages.filter((m) =>
    conversation
      ? m.conversationId === conversation.id
      : !m.conversationId && m.goalId === selected,
  );
  async function reloadProposals() {
    setProposals(await api<Proposal[]>("proposals"));
  }
  useEffect(() => {
    api<ServiceStatus>("status")
      .then(setService)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    void reloadProposals().catch((e) => setError(e.message));
  }, [data]);
  useEffect(() => {
    const draft = params.get("prompt") ?? sessionStorage.getItem(key) ?? "";
    setText(draft);
    if (draft) sessionStorage.setItem(key, draft);
    setError("");
  }, [key, params.get("prompt")]);
  useEffect(() => {
    if (messages.length && !window.location.hash)
      bottom.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages.length, sending]);
  async function send(e?: FormEvent) {
    e?.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    setError("");
    const value = text.trim();
    if (
      request.current?.text !== value ||
      request.current.goal !== (conversation?.id ?? selected)
    )
      request.current = {
        text: value,
        goal: conversation?.id ?? selected,
        id: crypto.randomUUID(),
      };
    try {
      await flush();
      const result = await api<{
        conversationId: string;
        data: typeof data;
        proposal?: Proposal;
      }>("coach", {
        message: value,
        goalId: selected,
        focusGoalId: goal?.id,
        conversationId: conversation?.id,
        requestId: request.current.id,
      });
      sessionStorage.removeItem(key);
      setText("");
      selectChat(result.conversationId, selected);
      await refresh();
      await reloadProposals();
      request.current = null;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Adler could not respond. Your draft is saved.",
      );
    } finally {
      setSending(false);
    }
  }
  async function review(id: string, action: "approve" | "dismiss") {
    setSending(true);
    setError("");
    try {
      await flush();
      await api(`proposals/${id}/${action}`, {});
      await refresh();
      await reloadProposals();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }
  return (
    <div className="coach-workspace focused-coach">
      <details className="chat-library-disclosure">
        <summary>Conversations</summary>
        <Conversations
          selected={conversation?.id}
          goalId={selected}
          disabled={sending}
          onSelect={selectChat}
          onError={setError}
        />
      </details>
      <div className="live-coach">
        <div className="coach-topline">
          <div className="coach-identity">
            <div>
              <h1>Check-in</h1>
            </div>
          </div>
        </div>
        <div className="coach-context-strip">
          {!service?.coach.configured && (
            <Link to="/app/settings/provider">Connect your AI provider</Link>
          )}
        </div>
        <div
          className="coach-thread"
          role="log"
          aria-label="Conversation with Adler"
          aria-live="polite"
        >
          {!messages.length && (
            <div className="coach-welcome">
              <h2>
                {data.goals.length
                  ? "What would you like to work through?"
                  : "What would you like to achieve?"}
              </h2>
              <p>
                {goal
                  ? `We’re working toward: ${goal.title}. Tell me what happened or what needs to change.`
                  : "Share what happened, check in on your week, or work through a blocker. Your goals and what you’ve shared are already here."}
              </p>
            </div>
          )}
          {messages.map((m) => {
            const decision = data.decisions.find((d) => d.id === m.decisionId);
            return (
              <article
                className={`live-message ${m.role}`}
                key={m.id}
                id={`record-${m.id}`}
              >
                {m.role === "coach" && <AdlerAvatar small />}
                <div className="message-content">
                  <span className="message-author">
                    {m.role === "coach" ? "Adler" : "You"}
                    {m.channel && m.channel !== "web"
                      ? ` · ${m.channel === "job" ? "Scheduled check-in" : m.channel.toUpperCase()}`
                      : ""}
                  </span>
                  <p>
                    {referencedText(data, m.text, m.references).map(
                      (part, index) =>
                        part.href ? (
                          <Link key={index} to={part.href}>
                            {part.text}
                          </Link>
                        ) : (
                          part.text
                        ),
                    )}
                  </p>
                  {decision?.status === "Accepted" && (
                    <span className="insight-change-status">
                      Saved to your workspace
                    </span>
                  )}
                  {!!m.links?.length && (
                    <div className="message-record-links">
                      {m.links
                        .filter((l) =>
                          data.goals.some((g) => g.id === l.goalId),
                        )
                        .map((l) => (
                          <Link
                            key={`${l.goalId}-${l.tab}`}
                            to={
                              l.tab === "plan"
                                ? `/app/goals/${encodeURIComponent(l.goalId)}`
                                : `/app/goals/${encodeURIComponent(l.goalId)}/${l.tab}`
                            }
                          >
                            {data.goals.find((g) => g.id === l.goalId)!.title} ·{" "}
                            {l.tab === "plan" ? "Open plan" : "View progress"} ↗
                          </Link>
                        ))}
                    </div>
                  )}
                  <div className="message-reactions">
                    {(["user", "coach"] as const).map((actor) => {
                      const reaction = m.reactions?.[actor]?.type;
                      return reaction ? (
                        <span
                          key={actor}
                          aria-label={`${actor === "coach" ? "Adler" : "You"} reacted ${reaction}`}
                          title={`${actor === "coach" ? "Adler" : "You"}: ${reaction}`}
                        >
                          {reactionEmoji[reaction]}
                        </span>
                      ) : null;
                    })}
                    {m.role === "coach" && (
                      <details className="reaction-picker">
                        <summary>React</summary>
                        <div>
                          {reactionTypes.map((reaction) => (
                            <button
                              key={reaction}
                              type="button"
                              aria-label={`React ${reaction}`}
                              aria-pressed={
                                m.reactions?.user?.type === reaction
                              }
                              onClick={async () => {
                                try {
                                  await flush();
                                  await api(
                                    `messages/${encodeURIComponent(m.id)}/reaction`,
                                    {
                                      reaction,
                                      remove:
                                        m.reactions?.user?.type === reaction,
                                    },
                                  );
                                  await refresh();
                                } catch (e) {
                                  setError((e as Error).message);
                                }
                              }}
                            >
                              {reactionEmoji[reaction]}
                            </button>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                  {decision && (
                    <details className="decision-inspector">
                      <summary>Why this suggestion?</summary>
                      <p>{decision.summary}</p>
                      <div className="decision-checks">
                        {decision.checks.map((c) => (
                          <div key={c.id}>
                            <Check size={13} />
                            <div>
                              <b>{c.label}</b>
                              <p>{c.finding}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="decision-methods">
                        {decision.methods.map((id) => {
                          const method = METHODS.find((m) => m.id === id);
                          return (
                            method && (
                              <a
                                key={id}
                                href={method.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {method.name} ↗
                              </a>
                            )
                          );
                        })}
                      </div>
                    </details>
                  )}
                </div>
              </article>
            );
          })}
          {proposals
            .filter((p) => p.status === "pending")
            .map((p) => (
              <article className="live-proposal shared-proposal" key={p.id}>
                <span className="section-kicker">PROPOSED CHANGES</span>
                <h3>{p.summary}</h3>
                <ProposalEssentials changes={p.changes} data={data} />
                <details className="quiet-disclosure">
                  <summary>What changes & why</summary>
                  <ProposalChanges
                    changes={p.changes}
                    data={data}
                    beforeRecords={p.before}
                  />
                </details>
                <div className="button-row">
                  <button
                    className="button primary"
                    disabled={sending || p.expires < Date.now()}
                    onClick={() => void review(p.id, "approve")}
                  >
                    Confirm changes <Check size={15} />
                  </button>
                  <button
                    className="button text-button"
                    disabled={sending}
                    onClick={() => void review(p.id, "dismiss")}
                  >
                    Dismiss
                  </button>
                </div>
                <p className="field-hint">
                  Expires {new Date(p.expires).toLocaleString()}. If your
                  workspace has changed, Adler will need to make an updated
                  proposal.
                </p>
              </article>
            ))}
          {latestApplied && !hasPending && (
            <Link
              className="button primary coach-continue"
              to={
                continuedGoal ? `/app/goals/${continuedGoal.id}` : `/app/today`
              }
            >
              Continue →
            </Link>
          )}
          {sending && (
            <div className="coach-working">
              <AdlerAvatar small />
              <span>Thinking with you…</span>
            </div>
          )}
          <div ref={bottom} />
        </div>
        <form className="live-composer" onSubmit={send}>
          {error && (
            <p className="inline-error" role="alert">
              {error}
            </p>
          )}
          <div>
            <textarea
              aria-label="Message Adler"
              rows={2}
              maxLength={5000}
              value={text}
              disabled={sending}
              placeholder="A goal, an update, or something to work through…"
              onChange={(e) => {
                setText(e.target.value);
                sessionStorage.setItem(key, e.target.value);
              }}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={sending || !text.trim() || !service?.coach.configured}
            >
              <ArrowUp size={21} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
