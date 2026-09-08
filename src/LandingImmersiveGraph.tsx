import { useEffect, useRef, useState } from "react";
import { LearningPreview } from "./LandingLearningPreview";

export function LandingImmersiveGraph() {
  const section = useRef<HTMLElement>(null);
  const [scene, setScene] = useState<
    "intro" | "transition" | "plan" | "static"
  >("intro");
  const [learningStage, setLearningStage] = useState(5);
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
      const clamp = (value: number) => Math.min(1, Math.max(0, value));
      const travel = clamp((progress - 0.25) / 0.55);
      const pullback = motion.matches ? clamp((progress - 0.82) / 0.14) : 1;
      const overview = pullback * pullback * (3 - 2 * pullback);
      const scale = 3.2 - overview * 2.2;
      const focus = (0.12 + travel * 0.8) * (1 - overview) + 0.5 * overview;
      const shift = Math.min(0, Math.max(1 - scale, 0.5 - focus * scale));
      node.style.setProperty(
        "--gather",
        String(clamp((progress - 0.04) / 0.17)),
      );
      node.style.setProperty("--camera-scale", String(scale));
      node.style.setProperty("--camera-shift", `${(shift / scale) * 100}%`);
      node.style.setProperty("--overview", String(overview));
      node.style.setProperty(
        "--reveal",
        String(motion.matches ? clamp(0.18 + travel * 0.94) : 1),
      );
      setLearningStage(
        !motion.matches || progress >= 0.84
          ? 5
          : travel < 0.2
            ? 0
            : travel < 0.38
              ? 1
              : travel < 0.57
                ? 2
                : travel < 0.8
                  ? 3
                  : 4,
      );
      setScene(
        !motion.matches
          ? "static"
          : progress >= 0.28
            ? "plan"
            : progress >= 0.12
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
  return <section className="journey-hero graph-journey" ref={section} data-scene={scene} aria-label="From scattered goals to a plan that learns">
    <div className="hero-sticky">
      <div className="hero-assembled">
        <h2>Scattered goals. <em>A system that learns with you.</em></h2>
        <LearningPreview stage={learningStage} />
      </div>
    </div>
  </section>;
}
