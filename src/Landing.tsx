import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  MessageCircle,
  Target,
} from "lucide-react";
import { Footer, Logo } from "./components";
import { AdlerAvatar } from "./persona";
import { ProgressChart } from "./ProgressChart";
import { METHODS } from "./methods";
import type { Goal } from "./store";
const demoGoal: Goal = {
  id: "demo-portfolio",
  title: "Publish 3 portfolio case studies by October 31",
  kind: "project",
  status: "Active",
  area: "Career",
  tags: ["Portfolio", "Writing"],
  priority: "Focus",
  why: "Include three examples of my work in design applications.",
  success:
    "Each published case study explains the problem, my contribution, and the result.",
  target: 3,
  unit: "Case studies published",
  targetDate: "2026-10-31",
  outcomeUpdatedAt: "2026-10-17",
  milestones: [
    { id: "1", title: "First case study", criterion: "Published", done: true },
    {
      id: "2",
      title: "Second case study",
      criterion: "Published",
      done: false,
    },
    { id: "3", title: "Third case study", criterion: "Published", done: false },
  ],
  plans: [
    {
      version: 1,
      date: "2026-10-01",
      action: "Draft five bullets for case study two",
      criterion: "Five bullets describe the problem and my contribution.",
      timing: "Tuesday, 1:00 pm · 25 min",
    },
  ],
  checkpoints: [
    { id: "p0", date: "2026-10-01", value: 0, label: "Start" },
    { id: "p1", date: "2026-10-08", value: 1, label: "First published" },
    { id: "p2", date: "2026-10-15", value: 2, label: "Second published" },
    { id: "p3", date: "2026-10-31", value: 3, label: "All three published" },
  ],
  results: [
    { id: "r0", date: "2026-10-01", value: 0, source: "Starting result" },
    {
      id: "r1",
      date: "2026-10-09",
      value: 1,
      source: "First case study published",
    },
    {
      id: "r2",
      date: "2026-10-17",
      value: 1,
      source: "Second case study remains in draft",
    },
  ],
};
function WindowBar({ title }: { title: string }) {
  return (
    <div className="walk-windowbar">
      <span>
        <i />
        <i />
        <i />
      </span>
      <b>adler / {title}</b>
      <span>Example</span>
    </div>
  );
}
function HeroPreview() {
  return (
    <div className="landing-product">
      <WindowBar title="goals / portfolio / progress" />
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
          <small>CAREER</small>
          <b>Portfolio</b>
          <span className="mini-goal-line">1 of 3 published</span>
          <small>LEARNING</small>
          <span>Statistics course</span>
          <small>PERSONAL</small>
          <span>Essential documents</span>
        </aside>
        <div className="landing-product-main">
          <div className="mini-breadcrumb">
            Career <ChevronRight size={12} /> #Portfolio <span>Focus goal</span>
          </div>
          <h2>Publish 3 portfolio case studies</h2>
          <p className="mini-deadline">
            By October 31 · Each explains the problem, my contribution, and the
            result.
          </p>
          <div className="mini-tabs">
            <b>Progress</b>
            <span>Plan</span>
            <span>Learning</span>
          </div>
          <ProgressChart goal={demoGoal} today="2026-10-17" compact />
          <div className="hero-coach-note">
            <AdlerAvatar small />
            <div>
              <b>The second case study is still in draft.</b>
              <p>
                You reported editing the opening in two sessions. Try five rough
                bullets before editing, then review after two attempts.
              </p>
              <Link to="/app/coach?goal=portfolio">
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
    label: "Define the result",
    title: "Turn “work on my portfolio” into a result you can verify.",
    problem: "A vague goal gives you no finish line.",
    body: "Set a target, a date, and what counts as finished. Add checkpoints so you can compare progress with a plan before the deadline arrives.",
    route: "/app/goals/portfolio/progress",
  },
  {
    label: "Build your program",
    title: "Decide what this week can realistically hold.",
    problem: "Each goal competes for the same hours.",
    body: "Choose a focus goal, a sprint result, and a weekly time budget. Adler considers your other active goals and confirmed preferences when it suggests the next step.",
    route: "/app/coach/program",
  },
  {
    label: "Find the time",
    title: "Give the next action a time and a place.",
    problem: "“I’ll do it this week” leaves the decision for later.",
    body: "Connect a calendar, check for gaps within your work hours, and approve a work block. Add a short check-in immediately afterward while the details are fresh.",
    route: "/app/calendar",
  },
  {
    label: "Record what happened",
    title: "Keep the useful details from each attempt.",
    problem: "A checked box can hide the obstacle.",
    body: "Record done, partly, or didn’t happen. Add what got in the way. Verify the goal result separately, so a drafting session is never mistaken for a published case study.",
    route: "/app/today",
  },
  {
    label: "See your progress",
    title: "Know where you stand before the deadline.",
    problem: "Being busy doesn’t tell you whether you’re on track.",
    body: "Compare recorded results with your dated checkpoints. See ahead, on, or behind plan—and exactly which numbers produce that label. Missing or old evidence asks for an update.",
    route: "/app/goals/portfolio/progress",
  },
  {
    label: "Make a useful change",
    title: "Get a specific adjustment, with a reason you can inspect.",
    problem: "Advice is hard to use when you can’t see what it’s based on.",
    body: "Adler reviews your records, schedule constraints, and coaching program. Inspect the methods and context behind a suggestion, approve the change, and decide when to review it.",
    route: "/app/coach?goal=portfolio",
  },
];
function WalkScreen({ step }: { step: number }) {
  const [outcome, setOutcome] = useState("Partly");
  const [time, setTime] = useState("1:00 pm");
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
            "coach / decision",
          ][step]
        }
      />
      <div className="walk-screen-content">
        {step === 0 && (
          <>
            <div className="goal-tags">
              <span>Career</span>
              <span>#Portfolio</span>
              <b>Focus</b>
            </div>
            <h3>{demoGoal.title}</h3>
            <dl className="demo-definition">
              <dt>Why</dt>
              <dd>Have three examples to include in design applications.</dd>
              <dt>Finished means</dt>
              <dd>
                Each case study is published and explains the problem, my
                contribution, and the result.
              </dd>
              <dt>Milestones</dt>
              <dd>
                <span>
                  <Check size={14} /> First published · Oct 8
                </span>
                <span>02 · Second published · Oct 15</span>
                <span>03 · Third published · Oct 31</span>
              </dd>
            </dl>
            <div className="demo-next">
              <span>NEXT ACTION</span>
              <b>Draft five bullets for case study two.</b>
              <p>Done = the problem and my contribution are on the page.</p>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <div className="mini-program-title">
              <AdlerAvatar small />
              <h3>
                Your coaching program <span>v2</span>
              </h3>
            </div>
            <div className="demo-program-grid">
              <div>
                <span>FOCUS</span>
                <b>Portfolio</b>
                <p>Statistics stays at two short sessions.</p>
              </div>
              <div>
                <span>THIS SPRINT</span>
                <b>Finish case study two</b>
                <p>Draft → feedback → publish</p>
              </div>
              <div>
                <span>TIME BUDGET</span>
                <b>180 min / week</b>
                <p>25-minute blocks after lunch</p>
              </div>
              <div>
                <span>REVIEW</span>
                <b>Every Friday</b>
                <p>Results, obstacles, next change</p>
              </div>
            </div>
            <div className="demo-method-flow">
              <span>Define</span>
              <ArrowRight size={13} />
              <span>Schedule</span>
              <ArrowRight size={13} />
              <span>Observe</span>
              <ArrowRight size={13} />
              <span>Adjust</span>
            </div>
            <p className="demo-footnote">
              Editable goals, constraints, methods, context, and version
              history.
            </p>
          </>
        )}
        {step === 2 && (
          <>
            <div className="mini-calendar-head">
              <h3>Tuesday, October 20</h3>
              <span className="pace-badge positive">Example availability</span>
            </div>
            <div className="demo-calendar">
              <span>12:00</span>
              <div className="calendar-busy">Busy</div>
              <span>12:30</span>
              <div className="calendar-free">Available</div>
              <span>1:00</span>
              <div className="calendar-focus">
                <b>Draft five rough bullets</b>
                <small>Portfolio · 25 min</small>
              </div>
              <span>1:25</span>
              <div className="calendar-checkin">
                <Check size={13} /> Check in · 5 min
              </div>
              <span>2:00</span>
              <div className="calendar-busy">Busy</div>
            </div>
            <div className="demo-time-options">
              {["1:00 pm", "3:00 pm", "4:15 pm"].map((t) => (
                <button
                  key={t}
                  className={time === t ? "selected" : ""}
                  aria-pressed={time === t}
                  onClick={() => setTime(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="demo-footnote">
              Selected: {time} · Choose a slot, then confirm it in the app.
            </p>
          </>
        )}
        {step === 3 && (
          <>
            <span className="section-kicker">AFTER YOUR WORK BLOCK</span>
            <h3>How did the draft go?</h3>
            <p>Planned: five rough bullets for case study two.</p>
            <div className="demo-outcomes">
              {["Done", "Partly", "Didn’t happen"].map((v) => (
                <button
                  key={v}
                  className={outcome === v ? "selected" : ""}
                  aria-pressed={outcome === v}
                  onClick={() => setOutcome(v)}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="demo-record">
              <span>
                {outcome === "Done" ? "WHAT CHANGED" : "WHAT GOT IN THE WAY"}
              </span>
              <p>
                {outcome === "Done"
                  ? "Five bullets are drafted. Ready for a feedback pass."
                  : outcome === "Partly"
                    ? "“I kept editing the opening instead of getting the rest down.”"
                    : "“A meeting ran over and took the time I’d reserved.”"}
              </p>
            </div>
            <div className="demo-result-separation">
              <Check size={17} />
              <span>
                Action recorded: <b>{outcome}</b>
              </span>
              <span>
                Published result: <b>1 of 3</b>
              </span>
            </div>
          </>
        )}
        {step === 4 && (
          <>
            <h3>Are the results keeping pace?</h3>
            <ProgressChart goal={demoGoal} today="2026-10-17" compact />
            <div className="demo-next">
              <span>WHAT TO REVIEW</span>
              <b>The second case study was due October 15.</b>
              <p>Open the action records to see what delayed it.</p>
            </div>
          </>
        )}
        {step === 5 && (
          <>
            <div className="mini-program-title">
              <AdlerAvatar small />
              <h3>
                Adler <span>Portfolio</span>
              </h3>
            </div>
            <p className="demo-coach-message">
              You’ve made time for the draft, but the opening is taking the
              whole session. Let’s give the first pass a smaller job.
            </p>
            <div className="demo-proposal">
              <span className="section-kicker">TRY FOR TWO SESSIONS</span>
              <h3>Draft five bullets before editing.</h3>
              <p>
                Finish when the problem and your contribution are on the page.
              </p>
              <div>
                <b>Based on</b>
                <span>Two action notes about editing the opening.</span>
              </div>
              <div>
                <b>Method</b>
                <span>Identify the blocker → change the task.</span>
              </div>
              <div>
                <b>Review</b>
                <span>Did you finish a draft ready for feedback?</span>
              </div>
            </div>
            <Link className="demo-inspect" to="/app/coach/program">
              Open the full coaching program <ArrowUpRight size={15} />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
export function Landing() {
  return (
    <div className="concrete-landing">
      <header className="site-header">
        <Logo />
        <nav aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <Link to="/method">The method</Link>
          <Link to="/sign-in">Log in</Link>
        </nav>
        <Link className="button primary" to="/app/today">
          Explore the app <ArrowUpRight size={16} />
        </Link>
      </header>
      <main>
        <section className="concrete-hero">
          <div className="hero-label">
            <span className="status-dot" /> A GOAL COACH WITH A PLAN YOU CAN SEE
          </div>
          <h1>
            Know if you’re making progress.
            <br /> <span>Know what to do next.</span>
          </h1>
          <p>
            Turn a goal into measurable milestones, find time for the work, and
            see whether the results match your plan. Adler helps you adjust
            using what actually happened.
          </p>
          <div className="hero-actions">
            <Link className="button primary" to="/app/today">
              Explore the app <ArrowRight size={17} />
            </Link>
            <a className="button text-button" href="#how-it-works">
              See every step <ArrowDown size={16} />
            </a>
          </div>
          <div className="hero-access-note">
            Interactive local preview · Start with example goals or create your
            own
          </div>
          <HeroPreview />
          <div className="hero-caption">
            Fictional portfolio example · The same progress view is available
            inside the app.
          </div>
        </section>
        <section className="concrete-problem">
          <span className="section-kicker">
            THE GAP BETWEEN PLANNING AND PROGRESS
          </span>
          <h2>
            You have a goal. A list. Maybe a chat.
            <br />
            But is the plan working?
          </h2>
          <div className="problem-grid">
            <article>
              <span>01</span>
              <h3>“I worked on it all week.”</h3>
              <p>
                Hours spent and tasks finished can hide a result that hasn’t
                moved.
              </p>
              <b>Track the outcome alongside the effort.</b>
            </article>
            <article>
              <span>02</span>
              <h3>“I’ll fit it in somewhere.”</h3>
              <p>
                The plan competes with meetings, other goals, and the rest of
                your week.
              </p>
              <b>Find time before committing more work.</b>
            </article>
            <article>
              <span>03</span>
              <h3>“Now what should I change?”</h3>
              <p>
                Generic encouragement doesn’t tell you which obstacle to
                address.
              </p>
              <b>Connect the next change to your records.</b>
            </article>
          </div>
        </section>
        <section className="product-walkthrough" id="how-it-works">
          <div className="walkthrough-heading">
            <span className="section-kicker">
              ONE GOAL, FROM INTENTION TO ADJUSTMENT
            </span>
            <h2>
              Here’s how Adler helps.
              <br />
              Screen by screen.
            </h2>
            <p>
              Follow a portfolio goal through the full workflow. Try the
              controls, then open any screen in the app.
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
              className={`walk-step ${i % 2 ? "reverse" : ""}`}
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
                  Open this screen <ArrowUpRight size={15} />
                </Link>
              </div>
              <WalkScreen step={i} />
            </article>
          ))}
        </section>
        <section className="concrete-method">
          <div>
            <span className="section-kicker">
              BEHAVIOURAL SCIENCE, WITH A JOB TO DO
            </span>
            <h2>
              A method should change
              <br />
              what you do next.
            </h2>
            <p>
              Adler’s program uses research on goal setting, implementation
              intentions, progress monitoring, and structured review. For
              learning goals, it can add retrieval and spaced practice.
            </p>
            <Link className="button secondary" to="/method">
              See the methods and sources <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="method-examples">
            <article>
              <span>Instead of “try harder”</span>
              <h3>Find the blocker.</h3>
              <p>
                A meeting displaced the session? Change the time. The task was
                unclear? Define a smaller, observable first step.
              </p>
            </article>
            <article>
              <span>Instead of “keep going”</span>
              <h3>Check the result.</h3>
              <p>
                If practice sessions are complete but test results haven’t
                improved, inspect the practice method before adding more
                sessions.
              </p>
            </article>
            <article>
              <span>Instead of advice you can’t inspect</span>
              <h3>Open the program.</h3>
              <p>
                See the goals, context, enabled methods, proposed changes, and
                saved versions Adler uses to coach you.
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
              "What is available in this preview?",
              "Goals, tagging, action records, progress charts, program editing, and local scheduling work in this browser. Live coaching needs a configured Anthropic account; calendar connections need your authorization. There is no account sync or background coaching service.",
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
          <AdlerAvatar />
          <h2>
            Bring a goal.
            <br />
            Leave with a next step you can check.
          </h2>
          <p>
            Start with the example workspace. See the plan, the progress, and
            the program behind the coach.
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
export function SignIn() {
  return (
    <div className="public-page">
      <header className="site-header">
        <Logo />
        <Link to="/">
          Back to home <ArrowUpRight size={15} />
        </Link>
      </header>
      <main className="signin-card">
        <AdlerAvatar />
        <span className="section-kicker">YOUR GOALS, READY TO EXPLORE</span>
        <h1>Welcome to Adler.</h1>
        <p>
          Open the local workspace with three example goals, or create your own.
          Your changes are saved in this browser.
        </p>
        <Link to="/app/today" className="button primary full-width">
          Enter the preview <ArrowRight size={17} />
        </Link>
        <p className="field-hint">
          No account needed. Enable live coaching separately in Coach and
          connect calendars from Calendar.
        </p>
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
    terms: "About this local preview.",
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
              decisions, and confirmed context are stored in this browser.
              Anyone using this browser profile can access them. This preview
              has no account sync.
            </p>
            <h2>Live coaching</h2>
            <p>
              After you enable live coaching, requests send your current
              program, active goals, recent records, confirmed context, relevant
              conversation, and saved work blocks to Anthropic. API credentials
              stay on the server. You can disable live coaching in Settings.
            </p>
            <h2>Calendar connections</h2>
            <p>
              Google tokens and iCloud app-specific credentials are held in
              local server memory and cleared when it restarts. Availability is
              read only when requested. Google returns busy intervals; iCloud
              event data is processed on the server to calculate those
              intervals. Unrelated event titles and calendar credentials are not
              included in coaching requests.
            </p>
            <p>
              Booking confirmations are saved in a private local server file for
              retry protection. Resetting the browser workspace does not delete
              that file or events already created in your calendar. Disconnect
              accounts in Calendar and manage existing events in the calendar
              provider.
            </p>
            <h2>Your controls</h2>
            <p>
              Export or reset browser records in{" "}
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
              This is a single-user local preview for exploring the product.
              There are no subscriptions or payments.
            </p>
            <h2>Connected features</h2>
            <p>
              The coach uses your configured Anthropic account after you enable
              it. Calendar connections require account configuration and
              authorization. Approving a booking creates real calendar events.
            </p>
            <h2>Current scope</h2>
            <p>
              There is no production authentication, cloud sync, or background
              coaching service. Sample goals and records are fictional. Coaching
              supports planning and reflection; it is not a guarantee of results
              or a professional care service.
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
              history. Live coaching requires ANTHROPIC_API_KEY on the local
              server. Calendar setup instructions are in the Calendar screen.
            </p>
            <h2>Export or start fresh</h2>
            <p>
              Use <Link to="/app/settings">Settings</Link> to export or reset
              browser records. Calendar events and the local booking journal are
              separate. Share problems in the workspace conversation where this
              preview was built.
            </p>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
