import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, PenLine, Play } from "lucide-react";
import { Mark } from "./LandingArt";
import { MultiGoalPlanPreview } from "./LandingJourneyPreviews";

export function LandingHero() {
  const section = useRef<HTMLElement>(null);
  const [scene, setScene] = useState<
    "intro" | "transition" | "plan" | "static"
  >("intro");
  useEffect(() => {
    const motion = matchMedia(
      "(min-width: 900px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)",
    );
    let frame = 0;
    function update() {
      frame = 0;
      const node = section.current!;
      const box = node.getBoundingClientRect();
      const progress = motion.matches
        ? Math.min(1, Math.max(0, -box.top / (box.height - innerHeight)))
        : 0;
      node.style.setProperty("--journey", String(progress));
      setScene(
        !motion.matches
          ? "static"
          : progress >= 0.85
            ? "plan"
            : progress >= 0.2
              ? "transition"
              : "intro",
      );
    }
    function scroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    update();
    motion.addEventListener("change", scroll);
    addEventListener("scroll", scroll, { passive: true });
    addEventListener("resize", scroll);
    return () => {
      motion.removeEventListener("change", scroll);
      removeEventListener("scroll", scroll);
      removeEventListener("resize", scroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <section
      className="journey-hero"
      ref={section}
      data-scene={scene}
      aria-label="From a goal to a way forward"
    >
      <div className="hero-sticky">
        <div className="hero-atmosphere" />
        <div className="hero-intro-v2">
          <h1>
            Reach your goals with a plan <em>that adapts to you.</em>
          </h1>
          <p>
            Adler is a behavioural science coach that learns about you to create
            adaptable plans that help you achieve your goals.
          </p>
          <div
            className="hero-buttons"
            inert={scene === "plan" || scene === "transition"}
          >
            <Link className="btn dark" to="/app/goals/new">
              Start with your goal <ArrowUpRight size={17} />
            </Link>
            <a className="btn quiet" href="#the-path">
              <span className="play-icon">
                <Play size={11} fill="currentColor" />
              </span>
              See it take shape
            </a>
          </div>
        </div>
        <div className="hero-objects" aria-hidden="true" inert>
          <svg
            className="hero-connecting-path"
            viewBox="0 0 1200 510"
            fill="none"
          >
            <path
              d="M-80 290C80 290 55 80 230 160S405 450 545 250S730 50 835 130S1110 230 1280-20"
              stroke="#aaba8d"
              strokeWidth="1.5"
              strokeDasharray="5 7"
            />
            <circle cx="230" cy="160" r="5" fill="#819b5d" />
            <circle cx="835" cy="130" r="5" fill="#819b5d" />
          </svg>
          <div className="hero-float floating-goal">
            <PenLine size={20} />
            <small>A GOAL WORTH MAKING ROOM FOR</small>
            <h3>Publish my portfolio.</h3>
            <p>3 case studies · November 15</p>
          </div>
          <div className="hero-float floating-progress">
            <small>SMALL STEPS, VISIBLE PROGRESS</small>
            <h3>
              2 of 2 <span>sessions completed</span>
            </h3>
            <svg className="hero-action-chart" viewBox="0 0 260 92" role="presentation">
              <path d="M10 72H250M10 42H250M10 12H250" stroke="#e3e7d9" />
              <path d="M20 65L75 45L130 45L185 15" fill="none" stroke="#68804c" strokeWidth="3" />
              <path d="M185 15H240" fill="none" stroke="#a5b68d" strokeWidth="3" strokeDasharray="4 5" />
              {[ [20,65], [75,45], [130,45], [185,15] ].map(([x,y]) => <circle key={x} cx={x} cy={y} r="4" fill="#68804c" />)}
            </svg>
            <p>Check in. Learn. Adjust the next cycle.</p>
          </div>
          <div className="hero-float floating-action">
            <small>ONE NEXT STEP</small>
            <h3>
              Work on my draft.
              <br />25 focused minutes.
            </h3>
            <p>Tuesday & Thursday · After breakfast</p>
          </div>
          <div className="hero-float floating-coach">
            <Mark />
            <p>
              We’ll find what works for you.
              <br />
              And keep learning as you go.
            </p>
          </div>
        </div>
        <div
          className="hero-assembled"
          inert={scene === "intro" || scene === "transition"}
          aria-hidden={scene === "intro" || scene === "transition"}
        >
          <h2>
            Your goals. <em>One adaptable plan.</em>
          </h2>
          <MultiGoalPlanPreview />
        </div>
      </div>
    </section>
  );
}
