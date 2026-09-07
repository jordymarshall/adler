import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen, Briefcase, PenLine, Play } from "lucide-react";
import { Mark } from "./LandingArt";
import { LearningPreview } from "./LandingLearningPreview";

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
      node.style.setProperty(
        "--gather",
        String(Math.min(1, Math.max(0, (progress - 0.08) / 0.24))),
      );
      node.style.setProperty(
        "--bundle",
        String(
          motion.matches
            ? Math.min(1, Math.max(0, (progress - 0.2) / 0.32))
            : 1,
        ),
      );
      node.style.setProperty(
        "--learning",
        String(
          motion.matches
            ? Math.min(1, Math.max(0, (progress - 0.5) / 0.45))
            : 1,
        ),
      );
      setScene(
        !motion.matches
          ? "static"
          : progress >= 0.45
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
      aria-label="From scattered goals to a plan that learns"
    >
      <div className="hero-sticky">
        <div className="hero-atmosphere" />
        <div className="hero-intro-v2">
          <h1>
            Reach your goals with a plan <em>that adapts to you.</em>
          </h1>
          <p>
            Adler turns your goals into a manageable plan, then uses behavioural
            science and your check-ins to help you follow through.
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
            <small>THE PROJECT I KEEP PUTTING OFF</small>
            <h3>Publish my portfolio.</h3>
            <p>Another week polishing the same draft.</p>
            <svg className="hero-action-chart" viewBox="0 0 260 45">
              <path d="M2 8L45 19L86 12L128 27L168 22L211 38L258 34" />
            </svg>
          </div>
          <div className="hero-float floating-progress">
            <BookOpen size={20} />
            <small>THE HABIT THAT NEVER QUITE STICKS</small>
            <h3>Read more often.</h3>
            <p>A good start. Then life gets busy.</p>
            <svg className="hero-action-chart" viewBox="0 0 260 45">
              <path d="M2 12L45 5L86 24L128 20L168 34L211 29L258 41" />
            </svg>
          </div>
          <div className="hero-float floating-action">
            <Briefcase size={20} />
            <small>THE CHANGE THAT KEEPS WAITING</small>
            <h3>Find my next role.</h3>
            <p>On my list. Never on my calendar.</p>
            <svg className="hero-action-chart" viewBox="0 0 260 45">
              <path d="M2 3L45 17L86 12L128 25L168 20L211 36L258 40" />
            </svg>
          </div>
          <div className="hero-float floating-coach">
            <Mark />
            <p>
              Your goals shouldn’t compete.
              <br />
              Let’s make a plan that fits.
            </p>
          </div>
        </div>
        <div
          className="hero-assembled"
          inert={scene === "intro" || scene === "transition"}
          aria-hidden={scene === "intro" || scene === "transition"}
        >
          <h2>
            Scattered goals. <em>A plan that learns with you.</em>
          </h2>
          <LearningPreview />
        </div>
      </div>
    </section>
  );
}
