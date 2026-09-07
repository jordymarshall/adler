import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Mark } from "./LandingArt";

export function MountainFinale() {
  const section = useRef<HTMLElement>(null);
  const mountain = useRef<SVGGElement>(null);
  const origin = useRef<SVGGElement>(null);
  const [scene, setScene] = useState("static");
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
      const travel = Math.min(1, Math.max(0, (progress - 0.1) / 0.8));
      const eased = travel * travel * (3 - 2 * travel);
      const scale = 1 - eased;
      node.style.setProperty("--convergence", String(progress));
      mountain.current!.setAttribute(
        "transform",
        `translate(800 ${760 - eased * 280}) scale(${scale}) translate(-800 -760)`,
      );
      origin.current!.setAttribute("transform", `translate(0 ${-eased * 280})`);
      setScene(
        !motion.matches
          ? "static"
          : progress >= 0.9
            ? "start"
            : progress > 0.16
              ? "converging"
              : "summit",
      );
    }
    function queue() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    update();
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", queue);
    motion.addEventListener("change", queue);
    return () => {
      removeEventListener("scroll", queue);
      removeEventListener("resize", queue);
      motion.removeEventListener("change", queue);
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <section
      className="mountain-finale"
      ref={section}
      data-scene={scene}
      aria-label="From your someday to a first step"
    >
      <div className="mountain-stage">
        <div className="mountain-summit-copy" aria-hidden={scene === "start"}>
          <span className="section-kicker">A GOAL THAT MATTERS TO YOU</span>
          <h2>Your someday.</h2>
          <span className="mountain-scroll-hint">
            It starts with one step <ArrowDown size={16} />
          </span>
        </div>
        <svg
          className="mountain-graph"
          viewBox="0 0 1600 1000"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="mountain-area" x2="0" y2="1">
              <stop stopColor="#b7cd92" stopOpacity=".65" />
              <stop offset="1" stopColor="#dce8b3" stopOpacity=".12" />
            </linearGradient>
            <pattern id="mountain-grid" width="160" height="160" patternUnits="userSpaceOnUse">
              <path d="M160 0H0V160" fill="none" stroke="#e2e5d9" strokeWidth="1" />
            </pattern>
          </defs>
          <rect className="mountain-grid" width="1600" height="1000" fill="url(#mountain-grid)" />
          <g className="mountain-series" ref={mountain}>
            <path
              className="mountain-area"
              d="M-140 760L60 696L170 600L280 636L420 492L510 536L670 348L790 428L905 296L1040 476L1140 440L1260 604L1380 564L1510 700L1740 760Z"
              fill="url(#mountain-area)"
            />
            <path
              className="mountain-ridge"
              d="M-140 760L60 696L170 600L280 636L420 492L510 536L670 348L790 428L905 296L1040 476L1140 440L1260 604L1380 564L1510 700L1740 760"
              fill="none"
              stroke="#677e48"
              strokeWidth="3"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            <path d="M-140 760H1740" stroke="#9caa89" vectorEffect="non-scaling-stroke" />
          </g>
          <g className="mountain-origin" ref={origin}>
            <path className="mountain-origin-guide" d="M0 760H1600" stroke="#c8d2ba" strokeDasharray="3 7" vectorEffect="non-scaling-stroke" />
            <circle cx="800" cy="760" r="30" fill="#f6f7ef" />
            <Mark className="mountain-start-point" x={779} y={739} width={42} height={42} />
          </g>
        </svg>
        <div
          className="mountain-start-copy"
          inert={scene !== "start" && scene !== "static"}
          aria-hidden={scene !== "start" && scene !== "static"}
        >
          <h2>Let’s give it a start.</h2>
          <p>One goal. One manageable first step.</p>
          <Link className="btn dark" to="/app/goals/new">
            Take your first step <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}
