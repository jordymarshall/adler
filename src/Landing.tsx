import { LandingAtmosphere } from "./LandingAtmosphere";
import { IntegrationShowcase } from "./Integrations";
import { CheckInPreview } from "./CheckInPreview";
import { LandingInsights } from "./Insights";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CalendarDays,
  ChevronRight,
  MessageCircle,
  Target,
} from "lucide-react";
import { Footer, Logo } from "./components";
import { AdlerAvatar } from "./persona";
import { ProgressChart } from "./ProgressChart";
import { METHODS } from "./methods";
import { CalendarLogo } from "./CalendarLogo";
import { DecisionPreview, ProgramPreview } from "./LandingProgram";
import { demoGoal, proposedCheckpoints } from "./landing-data";
function WindowBar({ title }: { title: string }) {
  return (
    <div className="walk-windowbar">
      <span>
        <i />
        <i />
        <i />
      </span>
      <b>adler / {title}</b>
    </div>
  );
}
function HeroPreview() {
  return (
    <div className="landing-product">
      <WindowBar title="goals / running / progress" />
      <div className="landing-product-body">
        <aside>
          <Logo />
          <nav>
            <span>☀ Today</span>
            <b>
              <Target size={14} /> Goals
            </b>
            <span>
              <CalendarDays size={14} /> Calendar
            </span>
            <span>
              <MessageCircle size={14} /> Coach
            </span>
          </nav>
          <small>PERSONAL</small>
          <b>My first 5 km</b>
          <span className="mini-goal-line">2 km without stopping</span>
          <small>LEARNING</small>
          <span>Learn conversational Spanish</span>
        </aside>
        <div className="landing-product-main">
          <div className="mini-breadcrumb">
            Personal <ChevronRight size={12} /> #Running <span>Focus goal</span>
          </div>
          <h2>Run 5 km without stopping</h2>
          <p className="mini-deadline">
            By November 15 · Complete the route without a walking break.
          </p>
          <div className="mini-tabs">
            <b>Progress</b>
            <span>Plan</span>
            <span>Learning</span>
          </div>
          <ProgressChart goal={demoGoal} today="2026-10-17" compact />
          <div className="hero-outcome-count">
            <Check size={13} />
            <b>2 km recorded</b>
            <span>Goal: 5 km without stopping</span>
          </div>
          <div className="hero-coach-note">
            <AdlerAvatar small />
            <div>
              <b>Work ran late. Both weekday runs were missed.</b>
              <p>
                You said mornings are free. Try your Tuesday and Thursday runs
                before work, then review how they went on Sunday.
              </p>
              <Link to="/app/coach?goal=general">
                Review with Adler <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
const steps = [
  {
    label: "Set your goal",
    cta: "Set your goal",
    title: "Decide exactly what you want to achieve.",
    problem: "“Get fitter” gives you no clear way to know you’ve succeeded.",
    body: "Set a goal such as “run 5 km without stopping by November 15.” Record where you are now and choose smaller milestones so you can see progress along the way.",
    route: "/app/goals/new",
  },
  {
    label: "Plan your week",
    cta: "Plan your week",
    title: "Know what to do this week.",
    problem: "A goal needs specific actions you can fit into your life.",
    body: "Put your planned runs, distance milestones, and weekly review on one timeline. See how much time they need alongside your other goals and commitments.",
    route: "/app/coach/program",
  },
  {
    label: "Make time",
    cta: "Find a time",
    title: "Put it on your calendar.",
    problem: "“I’ll go for a run this week” is easy to put off.",
    body: "Connect your calendar, choose an available time, and confirm the booking. Add a short check-in afterward to record how it went.",
    route: "/app/calendar",
  },
  {
    label: "Check in",
    cta: "Record what happened",
    title: "Text your coach. Or open the app.",
    problem: "A missed run doesn’t tell you why the plan failed.",
    body: "Send Adler a message after a session, or check in through the app. Your coach records what happened in the same plan. Use iMessage or SMS to create goals, update progress, and review changes wherever you are.",
    route: "/app/today",
  },
  {
    label: "See your progress",
    cta: "Track your own goal",
    title: "See whether you’re on track.",
    problem:
      "Doing something every week doesn’t always mean you’re getting closer.",
    body: "Compare your recorded results with the milestones you planned to reach. See exactly why you’re ahead or behind, and compare proposed dates before changing your plan.",
    route: "/app/goals/new",
  },
  {
    label: "Learn what helps",
    cta: "See your insights",
    title: "See what helps you make progress.",
    problem: "A check-in is only useful if you learn something you can act on.",
    body: "See what Adler has learned from your results and conversations, where each insight came from, and what it changes in your plan. Open the sources and see which ideas still need testing.",
    route: "/app/insights",
  },
  {
    label: "Improve your plan",
    cta: "Review your plan with Adler",
    title: "Get specific changes when your plan isn’t working.",
    problem:
      "Another reminder won’t help if work keeps taking the time you set aside.",
    body: "Adler uses your results, check-ins, and availability to suggest what to change. See the current plan, the proposed changes, and the reason for each one. You choose what to approve.",
    route: "/app/coach?goal=general",
  },
];
function WalkScreen({ step }: { step: number }) {
  const [time, setTime] = useState("6:30 pm");
  const [compare, setCompare] = useState(false);
  return (
    <div className="walk-screen">
      <WindowBar
        title={
          [
            "goals / define",
            "coach / program",
            "calendar / schedule",
            "today / check-in",
            "goals / progress",
            "insights / what helps",
            "coach / decision",
          ][step]
        }
      />
      <div className="walk-screen-content">
        {step === 0 && (
          <>
            <div className="goal-tags">
              <span>Personal</span>
              <span>#Running</span>
              <b>Focus</b>
            </div>
            <h3>{demoGoal.title}</h3>
            <dl className="demo-definition">
              <dt>Why</dt>
              <dd>{demoGoal.why}</dd>
              <dt>Finished means</dt>
              <dd>{demoGoal.success}</dd>
              <dt>Milestones</dt>
              <dd>
                <span>
                  <Check size={14} /> 2 km without stopping · reached Oct 11
                </span>
                <span>3 km · planned for Oct 15</span>
                <span>5 km · goal for Nov 15</span>
              </dd>
            </dl>
            <div className="demo-next">
              <span>NEXT ACTION</span>
              <b>Go for my next planned run.</b>
              <p>Afterward, record whether I ran and the distance I covered.</p>
            </div>
          </>
        )}
        {step === 1 && <ProgramPreview />}
        {step === 2 && (
          <>
            <div className="mini-calendar-head">
              <h3>Thursday, October 15</h3>
              <span className="pace-badge positive">Choose a time</span>
            </div>
            <div
              className="calendar-provider-list"
              aria-label="Calendar connections"
            >
              <span>
                <CalendarLogo provider="google" /> Google Calendar
              </span>
              <span>
                <CalendarLogo provider="apple" /> Apple Calendar
              </span>
            </div>
            <div className="demo-calendar">
              <span>6:00</span>
              <div className="calendar-busy">Busy</div>
              <span>6:15</span>
              <div className="calendar-free">Available</div>
              <span>{time === "7:00 pm" ? "7:00" : "6:30"}</span>
              <div className="calendar-focus">
                <b>Go for a run</b>
                <small>My first 5 km · 25 min</small>
              </div>
              <span>{time === "7:00 pm" ? "7:25" : "6:55"}</span>
              <div className="calendar-checkin">
                <Check size={13} /> Check in · 5 min
              </div>
              <span>7:30</span>
              <div className="calendar-busy">Busy</div>
            </div>
            <div className="demo-time-options">
              {["6:30 pm", "7:00 pm", "7:30 pm"].map((t) => (
                <button
                  key={t}
                  className={time === t ? "selected" : ""}
                  aria-pressed={time === t}
                  disabled={t === "7:30 pm"}
                  title={
                    t === "7:30 pm"
                      ? "Busy on your calendar"
                      : "Available for a 25-minute run and 5-minute check-in"
                  }
                  onClick={() => setTime(t)}
                >
                  {t}
                  {t === "7:30 pm" ? " · Busy" : ""}
                </button>
              ))}
            </div>
            <p className="demo-footnote">
              Selected: {time} · Choose a slot, then confirm it in the app.
            </p>
          </>
        )}
        {step === 3 && <CheckInPreview />}
        {step === 4 && (
          <>
            <h3>How close are you to 5 km?</h3>
            <div
              className="chart-scenario-switch"
              role="group"
              aria-label="Compare plans"
            >
              <button aria-pressed={!compare} onClick={() => setCompare(false)}>
                Current plan
              </button>
              <button aria-pressed={compare} onClick={() => setCompare(true)}>
                Proposed adjustment
              </button>
            </div>
            <ProgressChart
              goal={demoGoal}
              today="2026-10-17"
              compact
              proposedCheckpoints={compare ? proposedCheckpoints : undefined}
            />
            <div className="demo-next">
              <span>WHAT TO REVIEW</span>
              <b>2 km recorded. Your plan called for 3 km by October 15.</b>
              <p>
                {compare
                  ? "Compare new dates for the 3 km and 4 km milestones. Your 5 km goal stays on November 15, with a review next week to check whether that date still fits."
                  : "Both weekday runs were missed when work ran late. Review the schedule before adding more sessions."}
              </p>
            </div>
          </>
        )}
        {step === 5 && <LandingInsights />}
        {step === 6 && <DecisionPreview />}
      </div>
    </div>
  );
}
export function Landing() {
  return (
    <div className="concrete-landing">
      <LandingAtmosphere />
      <header className="site-header">
        <Logo />
        <nav aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <Link to="/method">The method</Link>
          <Link to="/integrations">Integrations</Link>
          <Link to="/sign-in">Log in</Link>
        </nav>
        <Link className="button primary" to="/app/today">
          Explore the app <ArrowUpRight size={16} />
        </Link>
      </header>
      <main>
        <section className="concrete-hero">
          <div className="hero-label">
            <span className="status-dot" /> YOUR PERSONAL BEHAVIOURAL SCIENCE
            COACH
          </div>
          <h1>
            Reach your goals with a plan
            <br /> <span>that adapts to you.</span>
          </h1>
          <p>
            Turn a goal into weekly actions, make time for them, and see your
            progress. When you get stuck, Adler uses your check-ins and schedule
            to suggest specific changes and explain why.
          </p>
          <div className="hero-actions">
            <Link className="button primary" to="/app/today">
              Explore the app <ArrowRight size={17} />
            </Link>
            <a className="button text-button" href="#how-it-works">
              See how Adler helps <ArrowDown size={16} />
            </a>
          </div>
          <div className="hero-access-note">
            Start with your own goal · Connect your AI provider when you’re
            ready
          </div>
          <HeroPreview />
        </section>

        <section className="concrete-problem">
          <span className="section-kicker">WHY GOALS GET STUCK</span>
          <h2>
            You know what you want.
            <br />
            Following through is harder.
          </h2>
          <div className="problem-grid">
            <article>
              <span>01</span>
              <h3>“Am I actually getting closer?”</h3>
              <p>
                A list of completed tasks doesn’t show how close you are to the
                goal.
              </p>
              <b>See your results against your milestones.</b>
            </article>
            <article>
              <span>02</span>
              <h3>“I’ll fit it in somewhere.”</h3>
              <p>
                The plan competes with meetings, other goals, and the rest of
                your week.
              </p>
              <b>Choose times that fit your actual week.</b>
            </article>
            <article>
              <span>03</span>
              <h3>“Now what should I change?”</h3>
              <p>
                “Keep going” doesn’t tell you what to do differently when the
                same problem keeps coming up.
              </p>
              <b>Get a specific change and the reason for it.</b>
            </article>
          </div>
        </section>
        <section className="product-walkthrough" id="how-it-works">
          <div className="walkthrough-heading">
            <span className="section-kicker">HOW ADLER HELPS</span>
            <h2>
              A clear plan.
              <br />
              Progress you can see.
            </h2>
            <p>
              Follow a goal to run 5 km without stopping—from choosing the first
              steps to changing a schedule that isn’t working.
            </p>
          </div>
          <nav className="walk-step-nav" aria-label="Product walkthrough">
            {steps.map((s, i) => (
              <a key={s.label} href={`#step-${i + 1}`}>
                <span>0{i + 1}</span>
                {s.label}
              </a>
            ))}
          </nav>
          {steps.map((s, i) => (
            <article
              className={`walk-step ${i === 3 || i >= 5 ? "walk-step-wide" : i % 2 ? "reverse" : ""}`}
              id={`step-${i + 1}`}
              key={s.label}
            >
              <div className="walk-copy">
                <span className="walk-number">
                  0{i + 1} / {s.label.toUpperCase()}
                </span>
                <h2>{s.title}</h2>
                <p className="walk-problem">{s.problem}</p>
                <p>{s.body}</p>
                <Link className="text-link" to={s.route}>
                  {s.cta} <ArrowUpRight size={15} />
                </Link>
              </div>
              <WalkScreen step={i} />
            </article>
          ))}
        </section>
        <IntegrationShowcase />

        <section className="concrete-method">
          <div>
            <span className="section-kicker">
              COACHING BASED ON BEHAVIOURAL SCIENCE
            </span>
            <h2>
              Get help with what’s
              <br />
              stopping your progress.
            </h2>
            <p>
              Adler looks at what you planned, what happened, and the time you
              have available. It uses research on goal setting, action planning,
              and progress reviews to suggest a next step that addresses the
              problem you reported.
            </p>
            <Link className="button secondary" to="/method">
              See the methods and sources <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="method-examples">
            <article>
              <span>“Work keeps getting in the way.”</span>
              <h3>Find a time you can keep.</h3>
              <p>
                If late work keeps displacing your runs, Adler uses your
                availability to suggest another time. You confirm it before
                anything is booked.
              </p>
            </article>
            <article>
              <span>“I’m trying, but not improving.”</span>
              <h3>Check what needs to change.</h3>
              <p>
                Compare the actions you completed with your actual result. Adler
                helps you review the approach, the schedule, and the milestones
                before committing to more work.
              </p>
            </article>
            <article>
              <span>“Why this change?”</span>
              <h3>Understand the recommendation.</h3>
              <p>
                See exactly what would change and why. Your check-ins and
                preferences explain the situation; research informs the
                suggested response.
              </p>
            </article>
          </div>
        </section>
        <section className="concrete-faq">
          <h2>A few practical questions.</h2>
          {[
            [
              "Is this just a to-do list?",
              "Adler keeps actions and results as separate records. Your progress chart compares verified outcomes with dated checkpoints. The coach uses both records to help review what should change.",
            ],
            [
              "How does Adler know I’m ahead or behind?",
              "It compares your latest recorded result with the checkpoint due by today, using the same measure. It does not assume progress should be linear. If evidence is missing or over seven days old, it asks for an update.",
            ],
            [
              "What can I edit in the coach?",
              "Your focus goal, sprint result, time budget, working hours, review day, enabled methods, current approach, and confirmed context. Accepted changes create a new version. The underlying model is not retrained.",
            ],
            [
              "Can it use my calendar?",
              "The app includes Google Calendar OAuth and iCloud CalDAV connections. After account setup, it checks selected calendars and can create the work block and check-in you approve. You can also schedule inside Adler without connecting a calendar.",
            ],
            [
              "What can I use today?",
              "Create an empty workspace, define goals, track results, and run weekly reviews. Connect Gemini, GPT, or Claude with an API key for goal setup and coaching. Linked phone conversations and MCP clients share the same records; scheduled check-ins run on your configured server.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <span>+</span>
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
        <section className="concrete-final">
          <h2>
            Start working toward
            <br />a goal that matters to you.
          </h2>
          <p>
            Create your workspace, define your first goal, and build a plan
            around the time you actually have.
          </p>
          <Link className="button primary" to="/app/today">
            Explore the app <ArrowRight size={17} />
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
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
