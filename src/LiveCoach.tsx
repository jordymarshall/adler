import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowUp,
  Check,
  ChevronRight,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { AdlerAvatar } from "./persona";
import { api, type ServiceStatus } from "./api";
import {
  applyPlan,
  currentPlan,
  currentProgram,
  localDate,
  reviseProgram,
  useStore,
} from "./store";
import { coachingContext } from "./coach-context";
import { METHODS } from "./methods";
import type { CoachDecision } from "./program-types";
interface Reply {
  reply: string;
  summary: string;
  methods: string[];
  proposal: CoachDecision["proposal"] | null;
}
export function LiveCoach() {
  const { data, commit } = useStore();
  const [params, setParams] = useSearchParams();
  const selected = params.get("goal") ?? currentProgram(data).focusGoalId;
  const goal = data.goals.find((g) => g.id === selected);
  const key = `adler-coach-draft-${selected}`;
  const [text, setText] = useState(() => sessionStorage.getItem(key) ?? "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [service, setService] = useState<ServiceStatus | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const messages = data.messages.filter((m) => m.goalId === selected);
  useEffect(() => {
    api<ServiceStatus>("status")
      .then(setService)
      .catch(() =>
        setError(
          "The coaching server is unavailable. Start Adler with npm run dev.",
        ),
      );
  }, []);
  useEffect(() => {
    setText(sessionStorage.getItem(key) ?? "");
    setError("");
  }, [key]);
  useEffect(() => {
    if (messages.length)
      bottom.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages.length, sending]);
  async function send(e: FormEvent) {
    e.preventDefault();
    if (
      !text.trim() ||
      sending ||
      !data.modelConsent ||
      !service?.coach.configured
    )
      return;
    const value = text.trim();
    const context = coachingContext(data, selected, value, localDate());
    setSending(true);
    setError("");
    try {
      const reply = await api<Reply>("coach", { consent: true, context });
      if (
        !reply.reply ||
        !Array.isArray(reply.methods) ||
        reply.methods.some((id) => !context.program.enabledMethods.includes(id))
      )
        throw new Error(
          "Adler returned a method outside your program. Please retry. Your plan is unchanged.",
        );
      const id = crypto.randomUUID();
      if (
        commit((d) => {
          const decision: CoachDecision = {
            id,
            date: new Date().toISOString(),
            goalId: selected,
            programVersion: context.program.version,
            planVersion: goal ? currentPlan(goal).version : 0,
            mode: "live",
            checks: context.checks,
            methods: reply.methods,
            summary: reply.summary,
            ...(reply.proposal && goal?.status === "Active"
              ? { proposal: reply.proposal }
              : {}),
            status:
              reply.proposal && goal?.status === "Active"
                ? "Suggested"
                : "No change",
          };
          d.decisions.push(decision);
          d.messages.push(
            {
              id: crypto.randomUUID(),
              goalId: selected,
              role: "user",
              text: value,
            },
            {
              id: crypto.randomUUID(),
              goalId: selected,
              role: "coach",
              text: reply.reply,
              decisionId: id,
            },
          );
        })
      ) {
        setText("");
        sessionStorage.removeItem(key);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Adler could not respond. Your draft is saved.",
      );
    } finally {
      setSending(false);
    }
  }
  function accept(decision: CoachDecision) {
    if (!decision.proposal) return;
    commit((d) => {
      const saved = d.decisions.find((x) => x.id === decision.id)!;
      if (saved.status !== "Suggested")
        throw new Error("This proposal has already been reviewed.");
      if (currentProgram(d).version !== decision.programVersion)
        throw new Error(
          "This program has changed since this suggestion. Ask Adler to review the current version.",
        );
      applyPlan(d, decision.goalId, decision.planVersion, decision.proposal!);
      reviseProgram(d, decision.programVersion, {
        ...(currentProgram(d).focusGoalId === decision.goalId
          ? {
              approach: `${decision.proposal!.action}. Review: ${decision.proposal!.reviewAfter}`,
            }
          : {}),
        reason: `Accepted for ${d.goals.find((g) => g.id === decision.goalId)?.title}: ${decision.proposal!.title}`,
      });
      saved.status = "Accepted";
    }, "Future plan and coaching program updated.");
  }
  return (
    <div className="live-coach">
      <div className="coach-topline">
        <div className="coach-identity">
          <AdlerAvatar />
          <div>
            <h1>Adler</h1>
            <p>Your goals. A plan. Someone to work through it with.</p>
          </div>
        </div>
        <Link className="button secondary" to="/app/coach/program">
          <SlidersHorizontal size={16} /> Coaching program{" "}
          <span className="program-version">
            v{currentProgram(data).version}
          </span>
        </Link>
      </div>
      <div className="coach-context-strip">
        <span className="status-dot" />
        <span>
          {service?.coach.configured
            ? "Model configured"
            : "Live coach needs setup"}
        </span>
        <label>
          Working on
          <select
            aria-label="Conversation goal"
            value={selected}
            disabled={sending}
            onChange={(e) => setParams({ goal: e.target.value })}
          >
            <option value="general">The bigger picture</option>
            {data.goals.map((g) => (
              <option value={g.id} key={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </label>
        <Link to="/app/coach/about-you">
          <UserRound size={15} /> About you
        </Link>
      </div>
      {!data.modelConsent && (
        <section className="coach-consent">
          <div>
            <b>Let Adler use your saved context.</b>
            <p>
              Live coaching sends your active goals, program, recent records,
              confirmed context, and conversation to Anthropic. Calendar
              passwords and unrelated event titles stay out. Your workspace
              stays in this browser.
            </p>
          </div>
          <button
            className="button primary"
            disabled={!service?.coach.configured}
            onClick={() =>
              commit((d) => {
                d.modelConsent = true;
              })
            }
          >
            Enable live coaching
          </button>
        </section>
      )}
      <div
        className="coach-thread"
        role="log"
        aria-label="Conversation with Adler"
        aria-live="polite"
      >
        <div className="coach-welcome">
          <AdlerAvatar />
          <h2>Let’s work out what needs to change.</h2>
          <p>
            {goal
              ? `We’re working toward: ${goal.title}. Tell me what happened in your last session, or ask me to review the progress you’ve recorded.`
              : "We can look across your goals and decide where this week’s time will do the most useful work."}
          </p>
          <div className="coach-starters">
            {[
              "Am I on track? What should I change?",
              "My schedule changed. Help me replan.",
              "What are you using to coach me?",
            ].map((prompt) => (
              <button
                key={prompt}
                onClick={() => {
                  setText(prompt);
                  sessionStorage.setItem(key, prompt);
                }}
                disabled={sending}
              >
                {prompt}
                <ArrowRight size={14} />
              </button>
            ))}
          </div>
        </div>
        {messages.map((m) => {
          const decision = data.decisions.find((d) => d.id === m.decisionId);
          return (
            <article key={m.id} className={`live-message ${m.role}`}>
              {m.role === "coach" && <AdlerAvatar small />}
              <div className="message-content">
                <span className="message-author">
                  {m.role === "coach" ? "Adler" : "You"}
                  {m.role === "coach" && !decision
                    ? " · Example conversation"
                    : ""}
                </span>
                <p>{m.text}</p>
                {decision && (
                  <>
                    <details className="decision-inspector">
                      <summary>
                        Why this response{" "}
                        <span>Program v{decision.programVersion}</span>
                        <ChevronRight size={14} />
                      </summary>
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
                    {decision.proposal && (
                      <div className="live-proposal">
                        <span className="section-kicker">
                          PROPOSED PLAN CHANGE
                        </span>
                        <h3>{decision.proposal.title}</h3>
                        <p>{decision.proposal.action}</p>
                        <dl>
                          <dt>Finished when</dt>
                          <dd>{decision.proposal.criterion}</dd>
                          <dt>When</dt>
                          <dd>{decision.proposal.timing}</dd>
                          <dt>Why try it</dt>
                          <dd>{decision.proposal.reason}</dd>
                          <dt>Review after</dt>
                          <dd>{decision.proposal.reviewAfter}</dd>
                        </dl>
                        {decision.status === "Suggested" ? (
                          <div className="button-row">
                            <button
                              className="button primary"
                              onClick={() => accept(decision)}
                            >
                              Use this change <Check size={15} />
                            </button>
                            <button
                              className="button secondary"
                              onClick={() =>
                                commit((d) => {
                                  d.decisions.find(
                                    (x) => x.id === decision.id,
                                  )!.status = "Kept plan";
                                }, "Current plan kept.")
                              }
                            >
                              Keep my plan
                            </button>
                          </div>
                        ) : (
                          <span className="pace-badge positive">
                            {decision.status}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </article>
          );
        })}
        {sending && (
          <div className="coach-working">
            <AdlerAvatar small />
            <span>
              Reviewing your goal, records, and program
              <span className="thinking-dots">…</span>
            </span>
          </div>
        )}
        <div ref={bottom} />
      </div>
      <form className="live-composer" onSubmit={send}>
        {error && (
          <p role="alert" className="inline-error">
            {error}
          </p>
        )}
        <div>
          <textarea
            aria-label="Message Adler"
            rows={2}
            maxLength={5000}
            placeholder={
              data.modelConsent
                ? "What happened, or what’s on your mind?"
                : "Enable live coaching to start a conversation"
            }
            value={text}
            disabled={sending}
            onChange={(e) => {
              setText(e.target.value);
              sessionStorage.setItem(key, e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={
              sending ||
              !text.trim() ||
              !data.modelConsent ||
              !service?.coach.configured
            }
          >
            <ArrowUp size={21} />
          </button>
        </div>
        <p>
          Adler can suggest a change. You decide whether to use it.{" "}
          <Link to="/app/coach/program">See the program</Link>
        </p>
      </form>
    </div>
  );
}
