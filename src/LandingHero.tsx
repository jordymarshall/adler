import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Footprints, Play } from "lucide-react";
import { Mark } from "./LandingArt";
import { LandingPlanPreview } from "./LandingPlanPreview";
import { ProgressChart } from "./ProgressChart";
import { demoGoal } from "./landing-data";

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
            Big goals.
            <br />
            <em>A way forward.</em>
          </h1>
          <p>
            Personal coaching, grounded in behavioural science.
            <br />
            Adler helps you find a strategy, make a plan,
            <br className="desktop-break" /> and keep it working as life
            changes.
          </p>
          <div
            className="hero-buttons"
            inert={scene === "plan" || scene === "transition"}
          >
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
            <Footprints size={20} />
            <small>A GOAL WORTH MAKING ROOM FOR</small>
            <h3>Run my first 5 km.</h3>
            <p>One day → November 15</p>
          </div>
          <div className="hero-float floating-progress">
            <small>SMALL STEPS, VISIBLE PROGRESS</small>
            <h3>
              2 km <span>of 5 km</span>
            </h3>
            <ProgressChart
              goal={demoGoal}
              today="2026-10-17"
              compact
              graphOnly
            />
          </div>
          <div className="hero-float floating-action">
            <small>ONE NEXT STEP</small>
            <h3>
              A little run.
              <br />A clearer head.
            </h3>
            <p>Tuesday, 6:30 pm · 25 minutes</p>
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
            A clear <em>next step.</em>
          </h2>
          <LandingPlanPreview />
        </div>
      </div>
    </section>
  );
}
