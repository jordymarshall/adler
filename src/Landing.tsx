import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowLeft, ArrowRight } from "lucide-react";
import { Footer, Logo } from "./components";
import { METHODS } from "./methods";
export { Landing } from "./LandingCore";

export function PublicPage({
  type,
}: {
  type: "method" | "privacy" | "terms" | "support";
}) {
  const titles = {
    method: "What Adler’s methods do.",
    privacy: "Your data and controls.",
    terms: "Using Adler.",
    support: "Using Adler.",
  };
  return (
    <div className="public-page">
      <header className="site-header">
        <Logo />
        <Link className="button primary" to="/app/today">
          Explore the app <ArrowUpRight size={16} />
        </Link>
      </header>
      <main className="prose-page">
        <Link to="/" className="back-link">
          <ArrowLeft size={15} /> Back to Adler
        </Link>
        <span className="section-kicker">{type.toUpperCase()}</span>
        <h1>{titles[type]}</h1>
        {type === "method" ? (
          <>
            <p className="prose-lead">
              Define a result, plan a realistic opportunity to work, record the
              outcome, and use the evidence to choose the next adjustment.
            </p>
            {METHODS.map((m) => (
              <section className="public-method" key={m.id}>
                <h2>{m.name}</h2>
                <p>{m.action}</p>
                <blockquote>{m.example}</blockquote>
                <a href={m.url} target="_blank" rel="noreferrer">
                  {m.evidence} · {m.source} ↗
                </a>
                <details>
                  <summary>Scope of the evidence</summary>
                  <p>{m.limit}</p>
                </details>
              </section>
            ))}
            <h2>Why a checklist or a chat can leave gaps</h2>
            <p>
              Specific wording alone does not create time or skill. Task
              completion alone does not establish a result. A useful
              recommendation needs to fit the obstacle and current constraints.
              Adler connects these records so you can inspect the plan and
              decide what to change.
            </p>
            <h2>What has been evaluated</h2>
            <p>
              These sources support individual methods in their studied
              settings. Adler’s combined program has not yet been evaluated for
              effectiveness. Weekly reviews, time budgets, and the seven-day
              freshness threshold are product choices you can inspect, not
              claims of a scientifically optimal schedule.
            </p>
            <Link className="button primary" to="/app/coach/program">
              Open the editable program <ArrowRight size={15} />
            </Link>
          </>
        ) : type === "privacy" ? (
          <>
            <h2>Workspace records</h2>
            <p>
              Goals, results, actions, program versions, conversations,
              decisions, and confirmed context are stored under your account on
              this Adler server. Signed-in browsers and authorized phone or MCP
              connections share these records. The server operator controls
              storage and backups.
            </p>
            <h2>Live coaching</h2>
            <p>
              When you message Adler, requests send your current program, active
              goals, recent records, confirmed context, relevant conversation,
              and saved work blocks to your selected AI provider: Google Gemini,
              OpenAI, or Anthropic. API credentials stay on the server. Manage
              your provider in Settings and scheduled messages in Connections.
            </p>
            <h2>Calendar connections</h2>
            <p>
              Google tokens and iCloud app-specific credentials are encrypted on
              the server and survive restarts. Availability is read when you
              request slots or Adler assembles coaching context. Google returns
              busy intervals; iCloud event data is processed on the server to
              calculate those intervals. Unrelated event titles and calendar
              credentials are not included in coaching requests.
            </p>
            <p>
              Booking confirmations are saved on the server for retry
              protection. Clearing workspace records does not delete the booking
              journal or events already created in your calendar. Disconnect
              accounts in Calendar and manage existing events in the calendar
              provider.
            </p>
            <h2>Texting and connected clients</h2>
            <p>
              Linq (iMessage, RCS, and SMS) or Twilio (SMS), depending on the
              server configuration, processes messages to and from your linked
              phone. Incoming messages and delivery history are saved on this
              server. Pairing a phone enables conversational replies; scheduled
              messages require a separate opt-in. Reply STOP to stop texts,
              unlink the phone, or revoke client tokens in Connections.
            </p>
            <h2>Your controls</h2>
            <p>
              Export or clear workspace records in{" "}
              <Link to="/app/settings">Settings</Link>, edit{" "}
              <Link to="/app/coach/about-you">confirmed context</Link>, and
              disconnect calendars in <Link to="/app/calendar">Calendar</Link>.
              Fonts load from Google Fonts. No analytics or email service is
              configured.
            </p>
          </>
        ) : type === "terms" ? (
          <>
            <p className="prose-lead">
              Adler saves your goals and conversations on the server where it is
              hosted. There is no Adler subscription billing in this version;
              model and messaging providers charge their configured API
              accounts.
            </p>
            <h2>Connected features</h2>
            <p>
              The coach uses the AI provider you choose after you enable it.
              Calendar connections require account configuration and
              authorization. Approving a booking creates real calendar events.
            </p>
            <h2>Current scope</h2>
            <p>
              Each account starts empty. The landing walkthrough uses fictional
              records. Phone messaging needs a configured messaging account and
              public HTTPS server. Personal MCP tokens work with compatible
              clients; OAuth-only clients need an authorization service.
            </p>
          </>
        ) : (
          <>
            <h2>Start with a measurable goal</h2>
            <p>
              Open <Link to="/app/goals">Goals</Link> to organize by area, tags,
              and priority. Use the progress screen to record verified results
              and edit dated checkpoints.
            </p>
            <h2>Find time and check in</h2>
            <p>
              Open <Link to="/app/calendar">Calendar</Link> to connect an
              account or schedule inside Adler. Record what happened in{" "}
              <Link to="/app/today">Today</Link>. A work block and a result are
              separate records.
            </p>
            <h2>Inspect Adler</h2>
            <p>
              The <Link to="/app/coach/program">coaching program</Link> contains
              the sprint, capacity, enabled methods, context checks, and version
              history. Choose your model and API key in AI provider settings.
              Use Connections to pair a phone or create an MCP token.
            </p>
            <h2>Export or start fresh</h2>
            <p>
              Use <Link to="/app/settings">Settings</Link> to export or reset
              workspace records. Calendar events, connection credentials, audit
              events, delivery history, and the booking journal are separate.
              The server operator can manage retention and backups.
            </p>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
