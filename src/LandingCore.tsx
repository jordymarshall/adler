import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  Clock3,
  Footprints,
  Menu,
  PenLine,
  Play,
  Plus,
  Sun,
  Target,
  X,
} from "lucide-react";
import { Eyebrow, Logo, Mark, PathGraphic } from "./LandingArt";

import { LandingWalkthrough } from "./LandingWalkthrough";
import "./landing-core.css";

function Hero() {
  const section = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = section.current!;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      frame = 0;
      const box = node.getBoundingClientRect();
      const progress = Math.min(
        1,
        Math.max(0, -box.top / (box.height - innerHeight)),
      );
      node.style.setProperty("--journey", String(media.matches ? 0 : progress));
    };
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", scroll, { passive: true });
    addEventListener("resize", scroll);
    media.addEventListener("change", scroll);
    return () => {
      removeEventListener("scroll", scroll);
      removeEventListener("resize", scroll);
      media.removeEventListener("change", scroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <section
      className="journey-hero"
      ref={section}
      aria-label="From a goal to a way forward"
    >
      <div className="hero-sticky">
        <div className="hero-atmosphere" />
        <div className="hero-intro-v2">
          <h1>
            Big goals.
            <br />
            <em>A way forward.</em>
          </h1>
          <p>
            For the things you keep meaning to do.
            <br />A personal coach. One clear next step.
            <br className="desktop-break" /> A plan that adapts as life changes.
          </p>
          <div className="hero-buttons">
            <Link className="btn dark" to="/app/goals/new">
              Find your way forward <ArrowUpRight size={17} />
            </Link>
            <a className="btn quiet" href="#the-path">
              <span className="play-icon">
                <Play size={11} fill="currentColor" />
              </span>{" "}
              See it take shape
            </a>
          </div>
        </div>
        <div className="hero-assembled-title">
          <Eyebrow>Your ambition, with a little direction</Eyebrow>
          <h2>
            Someday becomes <em>a next step.</em>
          </h2>
        </div>
        <div
          className="hero-objects"
          aria-label="An example goal and its plan"
          role="group"
        >
          <svg
            className="hero-connecting-path"
            viewBox="0 0 1200 500"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M-80 290C80 290 55 80 230 160S405 450 545 250S730 50 835 130S1110 230 1280-20"
              stroke="#c8d3af"
              strokeWidth="1.5"
              strokeDasharray="4 7"
            />
            <path
              d="M-80 290C80 290 55 80 230 160S405 450 545 250"
              stroke="#637748"
              strokeWidth="2"
            />
            <circle cx="545" cy="250" r="7" fill="#637748" />
            <circle
              cx="835"
              cy="130"
              r="6"
              fill="#f9f9f3"
              stroke="#637748"
              strokeWidth="2"
            />
          </svg>
          <div className="hero-window">
            <div className="mini-window-bar">
              <span>
                <i />
                <i />
                <i />
              </span>
              <span>YOUR SPACE TO MOVE FORWARD</span>
              <span>adler</span>
            </div>
            <div className="mini-sidebar">
              <Mark />
              <span className="mini-nav-active">
                <Sun size={15} />
                Today
              </span>
              <span>
                <Target size={15} />
                Your goals
              </span>
              <span>
                <CalendarDays size={15} />
                Your week
              </span>
              <div className="mini-profile">
                <span>A</span>Alex’s workspace
              </div>
            </div>
          </div>
          <h2 className="sr-only">An example next step</h2>
          <article className="floating-goal">
            <div className="tiny-label">
              <span className="goal-symbol">
                <Footprints size={15} />
              </span>{" "}
              YOUR GOAL
            </div>
            <h3>Run my first 5 km.</h3>
            <p>More energy. A little fresh air. Something for me.</p>
            <div className="floating-goal-bottom">
              <span>
                <span className="destination-diamond" /> November 15
              </span>
              <span>
                Plan ready <ArrowUpRight size={13} />
              </span>
            </div>
          </article>
          <article className="floating-progress">
            <div className="tiny-label">
              PROGRESS · OPEN WHEN YOU NEED IT <span className="live-dot" />
            </div>
            <div className="hero-metric">
              <strong>
                2<span>km</span>
              </strong>
              <span>
                A little further
                <br />
                than last week.
              </span>
              <span className="metric-target">
                5 km
                <br />
                <small>your goal</small>
              </span>
            </div>
            <PathGraphic compact />
            <div className="card-baseline">
              <span>Oct 1</span>
              <span>Every step has a place.</span>
              <span>Nov 15</span>
            </div>
          </article>
          <article className="floating-action">
            <span className="tiny-label">
              <Sun size={14} /> YOUR NEXT SMALL STEP
            </span>
            <h3>
              A little run.
              <br />A clearer head.
            </h3>
            <p>Tuesday · 7:00 am</p>
            <div className="action-duration">
              <Clock3 size={14} />
              <span>25 minutes, just for you</span>
            </div>
            <span className="mini-action">
              <span className="empty-check" /> Go for an easy run{" "}
              <ArrowRight size={14} />
            </span>
          </article>
          <article className="floating-coach">
            <span className="coach-token">
              <Mark />
            </span>
            <div>
              <span className="tiny-label">ADLER, IN YOUR CORNER</span>
              <p>One next step. Ask me whenever you need a hand.</p>
            </div>
            <ArrowUpRight size={14} />
          </article>
          <span className="hero-handnote">
            A big thing starts
            <br />
            with a small thing.
            <svg viewBox="0 0 60 35" fill="none" aria-hidden="true">
              <path
                d="M4 4c20 18 29 21 49 10m-10-2 11 2-5 10"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </div>
        <div className="hero-scroll">
          <span>SCROLL TO FIND YOUR WAY</span>
          <ArrowDown size={14} />
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
    body: "Something you care about. A clear idea of what success looks like. A first step you can see yourself taking.",
    note: "Your goal. Your reasons. A plan built around both.",
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
    body: "Adler brings one suggested time to your next action. Confirm it here, or connect a calendar when you want to check availability.",
    note: "Choose a time. Then leave the planning here.",
  },
  {
    label: "See yourself move",
    title: (
      <>
        Small steps.
        <br />
        <em>Something to show.</em>
      </>
    ),
    body: "A short check-in keeps your plan connected to real life. Open progress and history whenever you want the bigger picture.",
    note: "Your effort matters. Your results tell the story.",
  },
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

function ThePath() {
  const [chapter, setChapter] = useState(0);
  return (
    <section className="path-section section-wrap" id="the-path">
      <div className="section-intro reveal">
        <Eyebrow>From a good intention to a real possibility</Eyebrow>
        <h2>
          A little clarity
          <br />
          changes <em>everything.</em>
        </h2>
        <p>
          You bring the ambition.
          <br />
          We’ll help you find the way.
        </p>
      </div>
      <div className="chapter-position" aria-label="Walkthrough step">
        0{chapter + 1} / 03 · {chapters[chapter].label}
      </div>
      <div
        className="chapter-panel"
        id="chapter-panel"
        aria-label={chapters[chapter].label}
      >
        <div className="chapter-copy" key={`copy-${chapter}`}>
          <span className="chapter-number">
            0{chapter + 1} / THE WAY FORWARD
          </span>
          <h3>{chapters[chapter].title}</h3>
          <p>{chapters[chapter].body}</p>
          <span className="chapter-note">
            <Mark />
            {chapters[chapter].note}
          </span>
          <button
            className="text-link"
            onClick={() => setChapter((chapter + 1) % 3)}
          >
            {chapter === 2 ? "Back to the beginning" : "Follow the next step"}
            <ArrowRight size={16} />
          </button>
        </div>
        <div
          className={`chapter-visual chapter-${chapter}`}
          key={`scene-${chapter}`}
        >
          {chapter === 0 ? (
            <>
              <div className="ambition-note">
                <PenLine size={15} />
                <span>“I want to feel like a runner.”</span>
              </div>
              <div className="direction-card">
                <div className="tiny-label">
                  <Footprints size={16} /> A GOAL WITH A LITTLE DIRECTION
                </div>
                <h4>My first uninterrupted 5 km.</h4>
                <div className="direction-stats">
                  <span>
                    <strong>
                      1 <small>km</small>
                    </strong>
                    Where I am
                  </span>
                  <ArrowRight size={25} />
                  <span>
                    <strong>
                      5 <small>km</small>
                    </strong>
                    Where I’m going
                  </span>
                </div>
                <div className="direction-milestones">
                  <span>
                    <i className="solid" />
                    Start here
                  </span>
                  <span>
                    <i />3 km
                  </span>
                  <span>
                    <i />4 km
                  </span>
                  <span>
                    <i />5 km
                  </span>
                </div>
                <div className="direction-why">
                  THE REASON THAT MATTERS
                  <p>Join my friends at our local Sunday run.</p>
                </div>
              </div>
              <span className="visual-caption">
                A destination you can picture. A first step you can take.
              </span>
            </>
          ) : chapter === 1 ? (
            <>
              <Week adjusted />
              <span className="visual-caption">
                Two little windows. A week that feels possible.
              </span>
            </>
          ) : (
            <>
              <div className="evidence-card">
                <span className="tiny-label">LOOK HOW FAR YOU’VE COME</span>
                <div className="evidence-metric">
                  <strong>
                    2 <small>km</small>
                  </strong>
                  <span>
                    without stopping
                    <br />
                    <b>+1 km from your starting point</b>
                  </span>
                </div>
                <PathGraphic />
                <div className="evidence-footer">
                  <Check size={16} />
                  <span>Your latest result, recorded October 17.</span>
                </div>
              </div>
              <div className="small-message">
                <Mark />
                <p>
                  That’s twice your starting distance.
                  <br />
                  <b>Next, let’s make 3 km feel possible.</b>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Adaptation() {
  const [adjusted, setAdjusted] = useState(false);
  return (
    <section className="adapt-section" id="a-plan-that-adapts">
      <div className="adapt-inner section-wrap">
        <div className="adapt-copy reveal">
          <Eyebrow light>A coach for real life</Eyebrow>
          <h2>
            Life moves.
            <br />
            Your plan
            <br />
            should, <em>too.</em>
          </h2>
          <p>
            Late meetings. Low energy. A week that got away from you. Adler
            helps you understand what got in the way—and find a better way
            through.
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
            <span
              className={`proposal-status ${adjusted ? "is-approved" : ""}`}
            >
              {adjusted ? (
                <Check size={12} />
              ) : (
                <span className="outline-dot" />
              )}
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
        </div>
      </div>
    </section>
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
        <Adaptation />
        <section className="approach-section section-wrap" id="approach">
          <div className="approach-heading reveal">
            <Eyebrow>Thoughtful by nature. Grounded in science.</Eyebrow>
            <h2>
              Your next step deserves
              <br />
              <em>good support.</em>
            </h2>
            <p>
              Behavioural science, translated into the small
              <br className="desktop-break" /> decisions that make your next
              step easier.
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
              <span className="chapter-number">01 / FIND CLARITY</span>
              <h3>Make it mean something.</h3>
              <p>
                Adler clarifies your goal, researches approaches, and explains
                the measurement it recommends.
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
              <span className="chapter-number">02 / FIND YOUR RHYTHM</span>
              <h3>Give the work a when.</h3>
              <p>
                One concrete next action, with a time that fits. Calendar
                connections are optional.
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
              <div className="principle-art art-adapt">
                <svg viewBox="0 0 240 120" fill="none" aria-hidden="true">
                  <path
                    d="M15 90C60 90 70 25 120 25S175 90 225 30"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="3 6"
                  />
                  <path
                    d="M15 90C65 90 70 60 120 60S175 65 225 30"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <circle cx="120" cy="60" r="8" fill="currentColor" />
                  <circle
                    cx="225"
                    cy="30"
                    r="5"
                    fill="#f8f8f2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <span className="chapter-number">03 / KEEP LEARNING</span>
              <h3>Let the plan get wiser.</h3>
              <p>
                A short review brings forward what matters. See the evidence and
                alternatives when you want to go deeper.
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
            Research informs the approach. Your experience shapes the plan.
          </p>
        </section>
        <section className="connected-section section-wrap">
          <div>
            <Eyebrow>One plan. Wherever life finds you.</Eyebrow>
            <h2>
              A little closer.
              <br />
              <em>Even when you’re away.</em>
            </h2>
            <p>
              Text a quick update. Make space in your calendar.
              <br />
              Your goals and conversations stay together. Connections are
              optional.
            </p>
            <Link className="text-link" to="/app/coach">
              Meet your coach <ArrowRight size={16} />
            </Link>
          </div>
          <div className="connection-art">
            <span className="orbit-line" />
            <span className="orbit-line inner" />
            <span className="connection-center">
              <Mark />
            </span>
            <span className="connection-icon imessage">
              <img src="/brands/imessage.png" alt="iMessage" />
            </span>
            <span className="connection-icon google-calendar">
              <img src="/brands/google-calendar.png" alt="Google Calendar" />
            </span>
            <span className="connection-icon apple-calendar">
              <img src="/brands/apple-calendar.png" alt="Apple Calendar" />
            </span>
            <span className="connection-note">
              <Check size={14} />A small update. Part of the bigger picture.
            </span>
          </div>
        </section>
        <LandingWalkthrough />
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
          <Eyebrow>There’s a way from here</Eyebrow>
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
