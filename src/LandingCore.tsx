import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  Footprints,
  Menu,
  PenLine,
  Play,
  Plus,
  Sun,
  X,
} from "lucide-react";
import { Logo, Mark } from "./LandingArt";

import { ProgressChart } from "./ProgressChart";
import { demoGoal } from "./landing-data";
import {
  LandingPlanPreview,
  LandingSchedulePreview,
} from "./LandingPlanPreview";
import { CheckInPreview } from "./CheckInPreview";
import "./landing-core.css";

function Hero() {
  return (
    <section className="journey-hero" aria-label="From a goal to a way forward">
      <div className="hero-atmosphere" />
      <div className="hero-intro-v2">
        <h1>
          Big goals.
          <br />
          <em>A way forward.</em>
        </h1>
        <p>
          Personal coaching, grounded in behavioural science.
          <br />
          Adler helps you find a strategy, make a plan,
          <br className="desktop-break" /> and keep it working as life changes.
        </p>
        <div className="hero-buttons">
          <Link className="btn dark" to="/app/goals/new">
            Find your way forward <ArrowUpRight size={17} />
          </Link>
          <a className="btn quiet" href="#the-path">
            <span className="play-icon">
              <Play size={11} fill="currentColor" />
            </span>
            See it take shape
          </a>
        </div>
      </div>
    </section>
  );
}

const chapters = [
  {
    label: "Find your direction",
    title: (
      <>
        Give your someday
        <br />
        <em>a starting point.</em>
      </>
    ),
    body: "Bring the goal. Adler asks what it needs, researches approaches, and proposes a plan with one clear next action. The reasoning and progress are there when you want them.",
  },
  {
    label: "Make room for it",
    title: (
      <>
        Big things happen
        <br />
        <em>in small windows.</em>
      </>
    ),
    body: "Start the plan, then choose when to act. Save a suggested time or choose another. Connecting a calendar is optional; your next step stays in one place.",
  },
  {
    label: "Stay connected",
    title: (
      <>
        A little closer.
        <br />
        <em>Even when you’re away.</em>
      </>
    ),
    body: "After the session, send a quick check-in by text or in the app. Your goals, conversations, and calendar stay connected, so Adler can help wherever you reply.",
  },
  { label: "Review and adapt", title: null, body: "" },
];

export function Week({
  adjusted = false,
  detailed = false,
}: {
  adjusted?: boolean;
  detailed?: boolean;
}) {
  return (
    <div
      className={`week-visual ${adjusted ? "adjusted" : ""} ${detailed ? "detailed" : ""}`}
    >
      <div className="week-top">
        <span>YOUR WEEK, WITH A LITTLE ROOM</span>
        <span>
          Oct 19—23 <CalendarDays size={14} />
        </span>
      </div>
      <div className="week-grid">
        <div className="week-times">
          <span>7 am</span>
          <span>12 pm</span>
          <span>6 pm</span>
        </div>
        {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, i) => (
          <div className={`week-day day-${i}`} key={day}>
            <div className="week-date">
              {day}
              <b>{19 + i}</b>
            </div>
            <div className="week-lines" />
            {[0, 2, 4].includes(i) && (
              <div className="calendar-obligation">
                <span>
                  {i === 0
                    ? "Team meeting"
                    : i === 2
                      ? "Lunch with Sam"
                      : "Weekly catch-up"}
                </span>
              </div>
            )}
            {[1, 3].includes(i) && (
              <>
                <div className="calendar-late">Work ran late</div>
                <div className="calendar-run">
                  <Footprints size={14} />
                  <b>Easy run</b>
                  <span>{adjusted ? "7:00" : "6:30"} · 25 min</span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="week-legend">
        <span>
          <i />
          Time for your goal
        </span>
        <span>
          <i />
          The rest of life
        </span>
        <span>50 min this week</span>
      </div>
    </div>
  );
}

function ConnectedPreview() {
  return (
    <div className="connected-preview">
      <div className="connection-orbit" aria-hidden="true" />
      <div className="connected-phone">
        <CheckInPreview />
      </div>
      <div className="connection-brands" aria-label="Optional connections">
        {[
          ["imessage", "iMessage & SMS"],
          ["google-calendar", "Google Calendar"],
          ["apple-calendar", "Apple Calendar"],
        ].map(([brand, label]) => (
          <div className={`connected-brand brand-${brand}`} key={brand}>
            <img src={`/brands/${brand}.png`} alt="" />
            <span>{label}</span>
          </div>
        ))}
      </div>
      <p className="connections-caption">
        Connect what helps. You can also do everything in Adler.
      </p>
    </div>
  );
}

function ThePath() {
  const flow = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = flow.current!;
    const panels = [...node.querySelectorAll<HTMLElement>(".chapter-panel")];
    let frame = 0;
    function update() {
      frame = 0;
      const center = innerHeight * 0.55;
      const first = panels[0].getBoundingClientRect().top + 77;
      const last = panels.at(-1)!.getBoundingClientRect().top + 77;
      const progress = Math.min(
        1,
        Math.max(0, (center - first) / Math.max(1, last - first)),
      );
      node.style.setProperty("--path-progress", String(progress));
      node.style.setProperty("--path-length", `${last - first}px`);
      const current = panels.reduce(
        (selected, panel, index) =>
          panel.getBoundingClientRect().top < center ? index : selected,
        0,
      );
      panels.forEach((panel, index) => {
        panel.classList.toggle("is-current", index === current);
        panel.classList.toggle("is-past", index < current);
        const marker = panel.querySelector(".chapter-number")!;
        if (index === current) marker.setAttribute("aria-current", "step");
        else marker.removeAttribute("aria-current");
      });
    }
    function scroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    update();
    const resize = new ResizeObserver(scroll);
    resize.observe(node);
    addEventListener("scroll", scroll, { passive: true });
    addEventListener("resize", scroll);
    return () => {
      resize.disconnect();
      removeEventListener("scroll", scroll);
      removeEventListener("resize", scroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <section className="path-section section-wrap" id="the-path">
      <div className="section-intro reveal">
        <h2>
          Reach your goals with a plan
          <br />
          <em>that adapts to you.</em>
        </h2>
        <p>
          A strategy for your goal. A place in your day. A coach that learns
          about you.
        </p>
      </div>
      <div className="chapter-flow" ref={flow}>
        <div className="chapter-rail" aria-hidden="true">
          <span />
        </div>
        {chapters.map((chapter, index) => (
          <article
            className={`chapter-panel ${index === 2 ? "chapter-connected" : index === 3 ? "chapter-adaptation" : ""}`}
            id={`step-${index + 1}`}
            aria-labelledby={`chapter-title-${index}`}
            key={chapter.label}
          >
            <span
              className="chapter-number"
              aria-label={`Step ${index + 1} of ${chapters.length}`}
            >
              0{index + 1}
            </span>
            {index === 3 ? (
              <Adaptation />
            ) : (
              <>
                <div className="chapter-copy">
                  <h3 id={`chapter-title-${index}`}>{chapter.title}</h3>
                  <p>{chapter.body}</p>
                </div>
                <div className={`chapter-visual chapter-${index}`}>
                  {index === 0 ? (
                    <LandingPlanPreview />
                  ) : index === 1 ? (
                    <LandingSchedulePreview />
                  ) : (
                    <ConnectedPreview />
                  )}
                </div>
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function Adaptation() {
  const [adjusted, setAdjusted] = useState(false);
  return (
    <div className="adapt-inner" id="a-plan-that-adapts">
      <div className="adapt-copy reveal">
        <h3 id="chapter-title-3">
          Life moves.
          <br />
          Your plan
          <br />
          should, <em>too.</em>
        </h3>
        <p>
          At your weekly review, Adler compares your check-ins with the plan. It
          remembers your preferences and what you’ve tried, then proposes an
          adjustment. You choose what to accept.
        </p>
        <div className="adapt-message">
          <span>A</span>
          <p>
            “Work ran late again.
            <br />I missed both evening runs.”
          </p>
        </div>
        <div className="adapt-coach">
          <Mark />
          <p>
            You mentioned mornings are usually free.
            <br />
            Shall we give them a try next week?
          </p>
        </div>
        <details className="preview-disclosure remembered-context">
          <summary>What Adler remembers</summary>
          <p>Mornings are usually free. Work can run late.</p>
          <p>
            Saved context informs later conversations and reviews. You can
            review, correct, or remove it.
          </p>
        </details>
        <button
          className={`btn ${adjusted ? "accepted" : "lime"}`}
          onClick={() => setAdjusted(!adjusted)}
        >
          {adjusted ? (
            <>
              <Check size={17} /> A little more room to move
            </>
          ) : (
            <>
              Try the morning plan <ArrowRight size={17} />
            </>
          )}
        </button>
        <span className="adapt-helper" aria-live="polite">
          {adjusted
            ? "The future changes. Your progress stays yours. Click to replay."
            : "Try it. Watch the week find a new rhythm."}
        </span>
      </div>
      <div className="adapt-stage">
        <div className="adapt-stage-heading">
          <span className="tiny-label">THE SAME GOAL. A BETTER FIT.</span>
          <span className={`proposal-status ${adjusted ? "is-approved" : ""}`}>
            {adjusted ? <Check size={12} /> : <span className="outline-dot" />}
            {adjusted ? "Plan adjusted" : "Proposed adjustment"}
          </span>
        </div>
        <Week adjusted={adjusted} />
        <div className="adapt-change">
          <span>{adjusted ? "YOUR NEW RHYTHM" : "ONE SMALL CHANGE"}</span>
          <div>
            <b className={adjusted ? "crossed" : ""}>6:30 pm</b>
            <ArrowRight size={21} />
            <b className={adjusted ? "new-time" : ""}>7:00 am</b>
          </div>
          <p>
            Tuesday & Thursday · The same 25 minutes.
            <br />A little less life in the way.
          </p>
        </div>
        <div className="adapt-preserved">
          <span className="destination-diamond" />
          <div>
            Still heading toward your first 5 km.
            <small>Your recorded 2 km hasn’t changed.</small>
          </div>
          <Mark />
        </div>
        <details className="preview-disclosure adaptation-progress">
          <summary>Progress & history</summary>
          <ProgressChart goal={demoGoal} today="2026-10-17" compact />
          <p>
            Changing the session time leaves your recorded results and agreed
            checkpoints intact.
          </p>
        </details>
      </div>
    </div>
  );
}

export function Landing() {
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.12 },
    );
    document.querySelectorAll(".reveal").forEach((e) => observer.observe(e));
    return () => observer.disconnect();
  }, []);
  return (
    <div className="v2-landing">
      <header className="landing-nav">
        <Logo />
        <nav aria-label="Main navigation" className={menu ? "menu-open" : ""}>
          <a href="#the-path" onClick={() => setMenu(false)}>
            The way forward
          </a>
          <a href="#approach" onClick={() => setMenu(false)}>
            Our approach
          </a>
          <Link to="/app/today">
            Explore the app <ArrowUpRight size={12} />
          </Link>
        </nav>
        <Link className="btn dark nav-cta" to="/app/goals/new">
          Start with a goal <ArrowUpRight size={15} />
        </Link>
        <button
          className="icon-button menu-toggle"
          aria-label={menu ? "Close menu" : "Open menu"}
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </header>
      <main id="main-content">
        <Hero />
        <div className="possibility-strip">
          <span>FOR WHATEVER FORWARD MEANS TO YOU.</span>
          <div>
            <span>
              <Footprints />
              Run a little further
            </span>
            <span>
              <PenLine />
              Make something yours
            </span>
            <span>
              <BookOpen />
              Learn something new
            </span>
            <span>
              <Sun />
              Find a better rhythm
            </span>
          </div>
        </div>
        <ThePath />
        <section className="approach-section section-wrap" id="approach">
          <div className="approach-heading reveal">
            <h2>
              Behavioural science.
              <br />
              <em>In your corner.</em>
            </h2>
            <p>
              You shouldn’t need a professional coach to get thoughtful help
              with your goals. Adler brings behavioural research into everyday
              planning, with ongoing support to choose a strategy, make time,
              and adapt when life changes.
            </p>
          </div>
          <div className="principles">
            <article className="reveal">
              <div className="principle-art art-clarity">
                <span />
                <span />
                <span />
                <span className="art-destination" />
              </div>
              <h3>A strategy with a reason.</h3>
              <p>
                Adler researches approaches, weighs them against your goal and
                constraints, and explains why it recommends a particular plan.
              </p>
              <a
                href="https://doi.org/10.1037/0003-066X.57.9.705"
                target="_blank"
                rel="noreferrer"
              >
                Goal-setting research <ArrowUpRight size={13} />
              </a>
            </article>
            <article className="reveal">
              <div className="principle-art art-rhythm">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <span key={i} />
                ))}
              </div>
              <h3>A plan it helps you manage.</h3>
              <p>
                Turn the strategy into milestones, realistic work sessions, and
                one clear next action. Adler helps you revisit timing and
                priorities as your week changes.
              </p>
              <a
                href="https://doi.org/10.1016/S0065-2601(06)38002-1"
                target="_blank"
                rel="noreferrer"
              >
                Action-planning research <ArrowUpRight size={13} />
              </a>
            </article>
            <article className="reveal">
              <div className="principle-art art-memory" aria-hidden="true">
                <BookOpen size={34} />
                <span>Remember</span>
                <ArrowRight size={18} />
                <span>Refine</span>
              </div>
              <h3>Coaching that learns about you.</h3>
              <p>
                Your check-ins, results, and saved preferences inform later
                conversations. Adler uses that history to suggest changes, then
                reviews whether they helped.
              </p>
              <a
                href="https://doi.org/10.1037/bul0000025"
                target="_blank"
                rel="noreferrer"
              >
                Progress-monitoring research <ArrowUpRight size={13} />
              </a>
            </article>
          </div>
          <p className="science-note">
            Built on behavioural science. Refined through your check-ins,
            results, and reviews.
          </p>
        </section>
        <section className="v2-faq section-wrap">
          <h2>A little more clarity.</h2>
          {[
            [
              "What can I work toward?",
              "A fitness goal, a creative project, a skill you want to learn, or a change in your everyday life. Start with something that matters to you; Adler helps make the outcome and next step clear.",
            ],
            [
              "What happens when I miss a step?",
              "Record what happened, with as much or as little context as you want. Adler helps you look at the approach, timing, or size of the next step. Your previous progress stays part of the picture.",
            ],
            [
              "Does Adler remember what I tell it?",
              "Yes. Adler can save your preferences, constraints, and context for future conversations. It also uses your check-ins, results, and past plan decisions to help refine its recommendations. You can review, correct, or remove saved information.",
            ],
            [
              "How is Adler’s coaching system improving?",
              "Today, Adler combines retrieved behavioural research with your saved context, check-ins, and results. We plan to expand the system with additional model training and proprietary goal-attainment data.",
            ],
            [
              "Do I stay in control?",
              "Yes. You can review the reason for a suggestion, ask for a different approach, or keep your current plan. You choose what to accept.",
            ],
            [
              "How do I start?",
              "Describe one goal. Adler helps clarify the result and researches an approach. Review your first step, start the plan, and choose when to do it. Your account keeps your goals and check-ins. Coaching requires a configured AI provider.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <Plus size={18} />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
        <section className="final-section">
          <div className="final-orbit" />
          <h2>
            Your someday.
            <br />
            <em>Let’s give it a start.</em>
          </h2>
          <Link className="btn dark" to="/app/goals/new">
            Take your first step <ArrowUpRight size={17} />
          </Link>
          <span>A goal that matters. A little help along the way.</span>
        </section>
      </main>
      <footer className="landing-footer section-wrap">
        <Logo />
        <p>
          A little direction.
          <br />A meaningful difference.
        </p>
        <div>
          <a href="#the-path">The way forward</a>
          <a href="#approach">Our approach</a>
          <Link to="/app/today">
            Explore the app <ArrowUpRight size={12} />
          </Link>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Adler</span>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/support">Help</Link>
        </div>
      </footer>
    </div>
  );
}
