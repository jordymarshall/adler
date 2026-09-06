import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Footprints,
  Menu,
  PenLine,
  Plus,
  Sun,
  X,
} from "lucide-react";
import { Logo } from "./LandingArt";

import { LandingHero } from "./LandingHero";
import { LandingSchedulePreview } from "./LandingPlanPreview";
import {
  GoalDefinitionPreview,
  WeeklyPlanPreview,
  ProgressProposalPreview,
  AdaptivePlanPreview,
} from "./LandingJourneyPreviews";
import { CheckInPreview } from "./CheckInPreview";
import "./landing-core.css";

const chapters = [
  {
    label: "Set your goal",
    title: (
      <>
        Decide exactly what
        <br />
        <em>you want to achieve.</em>
      </>
    ),
    body: "Tell Adler what you want and why it matters. Together, define what success looks like, where you’re starting, and the milestones along the way.",
    visual: <GoalDefinitionPreview />,
  },
  {
    label: "Plan your week",
    title: (
      <>
        Know what to do.
        <br />
        <em>And how to tell it’s working.</em>
      </>
    ),
    body: "Adler proposes a strategy and turns it into actions that fit your available time. Know what to do, what result to check, and when to review it. Start with one clear next step.",
    visual: <WeeklyPlanPreview />,
  },
  {
    label: "Make time",
    title: (
      <>
        Give your next step
        <br />
        <em>a place in your day.</em>
      </>
    ),
    body: "Choose a time or connect your calendar to find room. As you text, check in, and share more, Adler automatically revises its timing suggestions. You confirm changes before they reach your calendar.",
    visual: <LandingSchedulePreview />,
  },
  {
    label: "Check in",
    title: (
      <>
        A little closer.
        <br />
        <em>Even when you’re away.</em>
      </>
    ),
    body: "After your session, send a quick check-in by text or in Adler: what happened, what helped, and what got in the way. Your reply stays with the goal and informs what comes next.",
    visual: <ConnectedPreview />,
  },
  {
    label: "See progress",
    title: (
      <>
        See where you stand.
        <br />
        <em>And what could change.</em>
      </>
    ),
    body: "Compare your results with the plan. When the approach needs adjusting, see the proposed checkpoints alongside your progress, with a clear explanation of what changes and why.",
    visual: <ProgressProposalPreview />,
  },
  {
    label: "Learn and adapt",
    title: (
      <>
        Life moves.
        <br />
        Your plan
        <br />
        should, <em>too.</em>
      </>
    ),
    body: "Adler remembers what you share and keeps reassessing the strategy. At your weekly review, it brings together your check-ins, results, and relevant research to propose changes to the approach, actions, and milestones. You choose what to accept, then test it the following week.",
    visual: <AdaptivePlanPreview />,
  },
];

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
            className={`chapter-panel ${index === 3 ? "chapter-connected" : ""}`}
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
            <div className="chapter-copy">
              <span className="chapter-label">{chapter.label}</span>
              <h3 id={`chapter-title-${index}`}>{chapter.title}</h3>
              <p>{chapter.body}</p>
            </div>
            <div className={`chapter-visual chapter-${index}`}>
              {chapter.visual}
            </div>
          </article>
        ))}
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
        <LandingHero />
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
