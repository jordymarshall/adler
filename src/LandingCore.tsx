import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Briefcase,
  Menu,
  PenLine,
  Plus,
  Sun,
  X,
} from "lucide-react";
import { Logo } from "./LandingArt";

import { LandingHero } from "./LandingHero";
import { LandingBackdrop } from "./LandingBackdrop";
import { LandingAppCapture } from "./LandingAppCapture";
import { MountainFinale } from "./MountainFinale";
import { ConnectionsPreview } from "./LandingConnectionsPreview";
import "./landing-core.css";

const chapters = [
  {
    label: "Set and manage your goals",
    title: (
      <>
        Good intentions get lost. <em>Give your goals a clear home.</em>
      </>
    ),
    body: "A project in your notes. A habit you keep restarting. A change you’ve been putting off. Bring them together in Adler, define what success means, and decide what matters now.",
    visual: <LandingAppCapture screen="goals" />,
  },
  {
    label: "A plan Adler helps you manage",
    title: (
      <>
        Your goals compete for time. <em>Give them one workable plan.</em>
      </>
    ),
    body: "Planning each goal separately can leave you with more commitments than time. Adler organizes your goals into manageable actions, makes room for them in your week, and helps you adjust what no longer fits.",
    visual: <LandingAppCapture screen="calendar" />,
  },
  {
    label: "Track and visualize your progress",
    title: (
      <>
        It’s hard to see what’s working. <em>Make your progress visible.</em>
      </>
    ),
    body: "Being busy doesn’t tell you whether you’re moving forward. Check in by text or in the app to see your actions, results, and milestones together—and understand what needs to change in your plan or timeline.",
    visual: <LandingAppCapture screen="progress" />,
  },
  {
    label: "Behavioural science, personal to you",
    title: (
      <>
        The same plan keeps breaking. <em>Learn why. Try what helps.</em>
      </>
    ),
    body: "A missed action is something to understand. Adler uses behavioural science and your check-ins to explore the friction, try a different cue or a smaller commitment, and review whether the change actually helped.",
    visual: <LandingAppCapture screen="insights" />,
  },
  {
    label: "Adler connects to your life",
    title: (
      <>
        Message your coach anywhere. <em>Let Adler schedule your next step.</em>
      </>
    ),
    body: "Check in here, by text, or through connected AI tools like Claude and ChatGPT. Adler keeps the context together, finds time around your commitments, and books your next steps in your calendar with your approval.",
    visual: <ConnectionsPreview />,
  },
];
function ThePath() {
  const flow = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = flow.current!;
    const panels = [...node.querySelectorAll<HTMLElement>(".focus-chapter")];
    const motion = matchMedia(
      "(min-width: 1000px) and (min-height: 760px) and (prefers-reduced-motion: no-preference)",
    );
    let frame = 0;
    function update() {
      frame = 0;
      panels.forEach((panel) => {
        const box = panel.getBoundingClientRect();
        const focus = motion.matches
          ? Math.min(1, Math.max(0, (innerHeight - box.top) / innerHeight))
          : 1;
        panel.style.setProperty("--chapter-focus", String(focus));
        panel.classList.toggle(
          "is-current",
          box.top <= innerHeight * 0.5 && box.bottom > innerHeight * 0.5,
        );
      });
    }
    function scroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    update();
    addEventListener("scroll", scroll, { passive: true });
    addEventListener("resize", scroll);
    motion.addEventListener("change", scroll);
    return () => {
      removeEventListener("scroll", scroll);
      removeEventListener("resize", scroll);
      motion.removeEventListener("change", scroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <section
      className="adaptive-path"
      id="the-path"
      aria-label="How Adler works"
    >
      <div ref={flow}>
        {chapters.map((chapter, index) => (
          <article
            className="focus-chapter"
            id={`step-${index + 1}`}
            aria-labelledby={`chapter-title-${index}`}
            key={chapter.label}
          >
            <div className="chapter-stage">
              <div className="chapter-copy">
                <span className="chapter-label">
                  <span className="focus-number">0{index + 1}</span>
                  {chapter.label}
                </span>
                <h2 id={`chapter-title-${index}`}>{chapter.title}</h2>
                <p>{chapter.body}</p>
                <div
                  className="chapter-position"
                  aria-label={`Step ${index + 1} of 5`}
                >
                  {chapters.map((item, i) => (
                    <a
                      href={`#step-${i + 1}`}
                      key={item.label}
                      aria-label={item.label}
                      aria-current={i === index ? "step" : undefined}
                    />
                  ))}
                </div>
              </div>
              <div className="chapter-visual">{chapter.visual}</div>
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
      <LandingBackdrop />
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
              <Briefcase />
              Take the next career step
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
              planning, with ongoing support to build a workable rhythm, make
              time, and adapt when life changes.
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
              <h3>A behaviour worth testing.</h3>
              <p>
                Adler helps you define success, understand what gets in your
                way, and choose an execution experiment with a clear reason.
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
                Give your intentions a cue, a manageable commitment, and a time
                to reflect. Adler helps you revisit timing and priorities as
                your circumstances change.
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
              "A career goal, a creative project, a skill you want to learn, or a change in your everyday life. Start with something that matters to you; Adler helps make the outcome and next step clear.",
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
              "Describe one goal. Adler helps clarify the result and build a plan around how you work. Review your first step, start the plan, and choose when to do it. Your account keeps your goals and check-ins. Coaching requires a configured AI provider.",
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
        <MountainFinale />
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
          <span className="canada-note"><span aria-hidden="true">🇨🇦</span> Proudly built in Canada</span>
        </div>
      </footer>
    </div>
  );
}
