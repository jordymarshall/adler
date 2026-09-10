import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "./api";
import { useStore } from "./store";
type Provider = "gemini" | "openai" | "anthropic";
const labels = {
  gemini: "Google Gemini",
  openai: "OpenAI GPT",
  anthropic: "Anthropic Claude",
};
type ProviderInfo = {
  selected: { provider: Provider; model: string; useServer: boolean };
  providers: {
    provider: Provider;
    defaultModel: string;
    personalConfigured: boolean;
    serverAvailable: boolean;
    testedAt: string | null;
  }[];
};
export function ProviderSettings() {
  const [status, setStatus] = useState<ProviderInfo | null>(null),
    [provider, setProvider] = useState<Provider>("gemini"),
    [model, setModel] = useState(""),
    [useServer, setUseServer] = useState(false),
    [key, setKey] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  function accept(result: ProviderInfo) {
    setStatus(result);
    setProvider(result.selected.provider);
    setModel(result.selected.model);
    setUseServer(result.selected.useServer);
  }
  useEffect(() => {
    api<ProviderInfo>("provider")
      .then(accept)
      .catch((e) => setMessage(e.message));
  }, []);
  async function save(e?: FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      accept(
        await api<ProviderInfo>("provider", {
          provider,
          model,
          useServer,
          ...(key ? { key } : {}),
        }),
      );
      setKey("");
      setMessage(
        "Provider settings saved. Test the connection to check this account’s API access.",
      );
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const selected = status?.providers.find((p) => p.provider === provider);
  return (
    <div className="settings-page">
      <Link className="back-link" to="/app/integrations">
        ← Integrations
      </Link>
      <div className="page-heading">
        <div>
          <span className="section-kicker">AI PROVIDER</span>
          <h1>Choose the model behind Adler.</h1>
          <p>
            Goal setup and ongoing coaching use your selected provider. Your
            program, records, and proposed changes work the same way.
          </p>
        </div>
      </div>
      <section className="panel settings-section">
        <form className="connection-form" onSubmit={save}>
          <label>
            Provider
            <select
              aria-label="Provider"
              disabled={!status || busy}
              value={provider}
              onChange={(e) => {
                const value = e.target.value as Provider;
                setProvider(value);
                setModel(
                  status!.providers.find((p) => p.provider === value)!
                    .defaultModel,
                );
                setUseServer(false);
                setKey("");
                setMessage("");
              }}
            >
              {Object.entries(labels).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Model
            <input
              required
              value={model}
              maxLength={100}
              onChange={(e) => setModel(e.target.value)}
            />
          </label>
          {selected?.serverAvailable && (
            <label className="check-label">
              <input
                type="checkbox"
                checked={useServer}
                onChange={(e) => setUseServer(e.target.checked)}
              />
              Use this server’s configured API account
            </label>
          )}
          {!useServer && (
            <label>
              API key
              <input
                type="password"
                autoComplete="off"
                value={key}
                maxLength={500}
                placeholder={
                  selected?.personalConfigured
                    ? "Saved securely — enter a replacement to change it"
                    : "Paste your provider API key"
                }
                onChange={(e) => setKey(e.target.value)}
              />
            </label>
          )}
          <p className="field-hint">
            Keys are encrypted on the server and never returned to the browser
            or sent to chat. API billing is separate from a ChatGPT, Gemini, or
            Claude app subscription. Requests use credits on the selected API
            account.
          </p>
          <div className="button-row">
            <button className="button primary" disabled={busy || !status}>
              Save provider
            </button>
            <button
              type="button"
              className="button secondary"
              disabled={busy || !status}
              onClick={async () => {
                setBusy(true);
                setMessage("");
                try {
                  await api("provider", {
                    provider,
                    model,
                    useServer,
                    ...(key ? { key } : {}),
                  });
                  setKey("");
                  const result = await api<{ model: string; testedAt: string }>(
                    "provider/test",
                    {},
                  );
                  accept(await api<ProviderInfo>("provider"));
                  setMessage(
                    `Connected to ${result.model}. A small test request succeeded at ${new Date(result.testedAt).toLocaleTimeString()}.`,
                  );
                } catch (e) {
                  setMessage((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Save & test connection
            </button>
            {selected?.personalConfigured && (
              <button
                className="button text-button"
                type="button"
                disabled={busy}
                onClick={async () => {
                  accept(
                    await api<ProviderInfo>("provider", {
                      provider,
                      model,
                      useServer: false,
                      removeKey: true,
                    }),
                  );
                  setMessage("Saved key removed.");
                }}
              >
                Remove key
              </button>
            )}
          </div>
          <p className="field-hint">
            The connection test makes one small paid API request, without your
            workspace data.
          </p>
          {message && (
            <p role="status" className="form-notice">
              {message}
            </p>
          )}
        </form>
      </section>
      <section className="panel settings-section">
        <h3>Ready when your provider is connected</h3>
        <p>
          Coaching is available automatically. Messages use your saved goals,
          program, records, confirmed context, and conversation with the
          provider you choose.
        </p>
        <p className="field-hint">
          App, phone, and MCP share the same coach. You approve proposed
          changes; scheduled check-ins have their own setting in Connections.
        </p>
      </section>
      <Link className="button secondary" to="/app/check-in">
        Talk to Adler →
      </Link>
    </div>
  );
}
type ConnectionInfo = {
  configured: boolean;
  provider: "linq" | "twilio";
  number: string | null;
  publicUrl: string | null;
  link: { address: string; opted_out: number } | null;
  jobs: {
    id: string;
    kind: string;
    status: string;
    due: number;
    error: string | null;
  }[];
  deliveries: {
    id: string;
    status: string;
    at: number;
    error: string | null;
  }[];
  tokens: { id: string; name: string; scope: string; expires: number }[];
};
export function Connections() {
  const { data, commit } = useStore();
  const [status, setStatus] = useState<ConnectionInfo | null>(null),
    [phone, setPhone] = useState(""),
    [pair, setPair] = useState<{
      send: string;
      to: string;
      expires: number;
    } | null>(null),
    [message, setMessage] = useState(""),
    [revealed, setRevealed] = useState(""),
    [scope, setScope] = useState<"mcp" | "webhook">("mcp");
  const refresh = () =>
    api<ConnectionInfo>("connections")
      .then(setStatus)
      .catch((e) => setMessage(e.message));
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 10000);
    return () => clearInterval(timer);
  }, []);
  async function run(fn: () => Promise<unknown>) {
    setMessage("");
    try {
      await fn();
      await refresh();
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  const origin = status?.publicUrl ?? window.location.origin;
  return (
    <div className="settings-page connections-page">
      <Link className="back-link" to="/app/integrations">
        ← Integrations
      </Link>
      <div className="page-heading">
        <div>
          <span className="section-kicker">CONNECTED COACHING</span>
          <h1>The same Adler, wherever you reply.</h1>
          <p>
            Text a progress update, plan your week, or edit a goal from a
            connected chat client. Every confirmed change syncs to this
            workspace.
          </p>
        </div>
      </div>
      {message && (
        <p role="alert" className="inline-error">
          {message}
        </p>
      )}
      <section className="panel settings-section">
        <h2>Text Adler from your phone</h2>
        <p>
          {status?.provider === "linq"
            ? "Use iMessage with reactions on supported phones. Adler falls back to RCS or SMS when iMessage is unavailable."
            : "Use SMS to talk to the same Adler you see in the app."}
        </p>
        {status?.link ? (
          <>
            <p>
              Linked: <b>{status.link.address}</b> ·{" "}
              {status.link.opted_out
                ? "Texts stopped. Send START to resume."
                : "Ready for replies"}
            </p>
            <a className="button primary" href={`sms:${status.number}`}>
              Open a text to Adler
            </a>
            <button
              className="button text-button"
              onClick={() => void run(() => api("connections/unlink", {}))}
            >
              Unlink phone
            </button>
          </>
        ) : (
          <>
            <p>
              Link a number you control by sending a one-time code from that
              phone.
            </p>
            {!status?.configured && (
              <p className="form-notice">
                Phone messaging has not been connected on this server yet.
              </p>
            )}
            <form
              className="connection-form"
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () =>
                  setPair(await api("connections/pair", { address: phone })),
                );
              }}
            >
              <label>
                Your phone number
                <input
                  type="tel"
                  required
                  placeholder="+14165550123"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>
              <button
                className="button secondary"
                disabled={!status?.configured}
              >
                Get pairing code
              </button>
            </form>
            {pair && (
              <div className="form-notice">
                <p>
                  From {phone}, text this to <b>{pair.to}</b> within 10 minutes:
                </p>
                <code>{pair.send}</code>
                <p>
                  Sending the code enables conversational replies. Reply STOP at
                  any time. Your mobile carrier and the server’s messaging
                  provider may charge for messages.
                </p>
              </div>
            )}
          </>
        )}
        <p className="field-hint">
          Try “Help me set up a goal” or “Review my week.” Adler shows a change
          proposal; reply CONFIRM followed by its code to save it. You can also
          confirm or dismiss it in web chat.
        </p>
      </section>
      <section className="panel settings-section">
        <h2>Scheduled check-ins & weekly reviews</h2>
        <label className="check-label">
          <input
            type="checkbox"
            checked={data.automation.enabled}
            onChange={(e) =>
              commit((d) => {
                d.automation.enabled = e.target.checked;
              })
            }
          />
          Send me scheduled check-ins and a weekly review invitation
        </label>
        <div className="connection-grid">
          <label>
            When to check in
            <select value={data.automation.checkInMode} onChange={(e) => commit((d) => {
              d.automation.checkInMode = e.target.value as "after-session" | "end-of-day";
            })}>
              <option value="after-session">After scheduled work</option>
              <option value="end-of-day">At the end of my day</option>
            </select>
          </label>
          {data.automation.checkInMode === "end-of-day" && <label>
            Daily check-in time
            <input type="time" value={data.automation.checkInTime} onChange={(e) => commit((d) => {
              d.automation.checkInTime = e.target.value;
            })} />
          </label>}
          <label>
            Time zone
            <input
              defaultValue={data.timeZone}
              onBlur={(e) =>
                commit((d) => {
                  d.timeZone = e.target.value;
                })
              }
            />
          </label>
          <label>
            {data.reviewDay} review time
            <input
              type="time"
              value={data.automation.reviewTime}
              onChange={(e) =>
                commit((d) => {
                  d.automation.reviewTime = e.target.value;
                })
              }
            />
          </label>
          <label>
            Quiet hours start
            <input
              type="time"
              value={data.automation.quietStart}
              onChange={(e) =>
                commit((d) => {
                  d.automation.quietStart = e.target.value;
                })
              }
            />
          </label>
          <label>
            Quiet hours end
            <input
              type="time"
              value={data.automation.quietEnd}
              onChange={(e) =>
                commit((d) => {
                  d.automation.quietEnd = e.target.value;
                })
              }
            />
          </label>
        </div>
        <p className="field-hint">
          Requires a linked phone. Scheduled messages wait during quiet hours.
          Session check-ins skip completed actions and paused goals. Daily
          check-ins ask about your day while you have active goals. Change your
          review day in Settings.
        </p>
        <details>
          <summary>Scheduled work and delivery status</summary>
          <ul>
            {status?.jobs.map((j) => (
              <li key={j.id}>
                {j.kind} · {new Date(j.due).toLocaleString()} ·{" "}
                <b>{j.status}</b>
                {j.error && ` · ${j.error}`}
              </li>
            ))}
          </ul>
          {!status?.jobs.length && <p>No jobs scheduled yet.</p>}
          <ul>
            {status?.deliveries.map((d) => (
              <li key={d.id}>
                {new Date(d.at).toLocaleString()} · <b>{d.status}</b>
                {d.error && ` · ${d.error}`}
              </li>
            ))}
          </ul>
        </details>
      </section>
      <section className="panel settings-section">
        <h2>MCP & incoming webhooks</h2>
        <p>
          Connect an MCP client to read your workspace, talk to Adler, and
          propose changes to every workspace feature. Applying a proposal
          requires your confirmation.
        </p>
        <p className="field-hint">
          This server supports personal bearer tokens in compatible MCP clients.
          Clients requiring OAuth discovery need an additional OAuth
          authorization service.
        </p>
        <div className="button-row">
          <select
            aria-label="Access token type"
            value={scope}
            onChange={(e) => setScope(e.target.value as "mcp" | "webhook")}
          >
            <option value="mcp">MCP access</option>
            <option value="webhook">Incoming webhook access</option>
          </select>
          <button
            className="button secondary"
            onClick={() =>
              void run(async () => {
                const result = await api<{ token: string }>("tokens", {
                  name:
                    scope === "mcp"
                      ? "Personal MCP client"
                      : "External event source",
                  scope,
                  days: 30,
                });
                setRevealed(
                  scope === "mcp"
                    ? JSON.stringify(
                        {
                          url: `${origin}/mcp`,
                          headers: { Authorization: `Bearer ${result.token}` },
                        },
                        null,
                        2,
                      )
                    : JSON.stringify(
                        {
                          url: `${origin}/api/webhooks/events`,
                          headers: {
                            Authorization: `Bearer ${result.token}`,
                            "Content-Type": "application/json",
                          },
                          exampleBody: {
                            id: "unique-event-id",
                            message: "A short update for Adler to review.",
                          },
                        },
                        null,
                        2,
                      ),
                );
              })
            }
          >
            Create 30-day token
          </button>
        </div>
        {revealed && (
          <div className="token-reveal">
            <p>Copy this now. The token is shown only once.</p>
            <pre>{revealed}</pre>
            <button
              className="button secondary"
              onClick={() =>
                void navigator.clipboard
                  .writeText(revealed)
                  .then(() => setMessage("Connection details copied."))
              }
            >
              Copy connection details
            </button>
            <button
              className="button text-button"
              onClick={() => setRevealed("")}
            >
              Hide token
            </button>
          </div>
        )}
        <p className="field-hint">
          Webhooks enqueue a coaching review and use the selected model’s
          credits. Event IDs prevent duplicate processing. External events do
          not automatically approve changes.
        </p>
        {status?.tokens.map((t) => (
          <div className="settings-row" key={t.id}>
            <div>
              <b>{t.name}</b>
              <p>
                {t.scope} · expires {new Date(t.expires).toLocaleDateString()}
              </p>
            </div>
            <button
              className="button text-button"
              onClick={() => void run(() => api("tokens/revoke", { id: t.id }))}
            >
              Revoke
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
