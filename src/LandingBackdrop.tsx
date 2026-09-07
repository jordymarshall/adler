import { useEffect, useRef } from "react";

export function LandingBackdrop() {
  const backdrop = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = backdrop.current!;
    const page = node.parentElement!;
    const hero = page.querySelector<HTMLElement>(".journey-hero")!;
    const finale = page.querySelector<HTMLElement>(".mountain-finale")!;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const immersive = matchMedia("(min-width: 900px) and (min-height: 700px)");
    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    const ease = (value: number) => {
      const t = clamp(value);
      return t * t * (3 - 2 * t);
    };
    let frame = 0;
    function update() {
      frame = 0;
      if (reducedMotion.matches) {
        node.style.setProperty("--backdrop-progress", ".5");
        node.style.setProperty("--backdrop-pigment", ".24");
        node.style.setProperty("--backdrop-grain", ".045");
        return;
      }
      const bounds = page.getBoundingClientRect();
      const progress = clamp(
        -bounds.top / Math.max(1, bounds.height - innerHeight),
      );
      const heroBounds = hero.getBoundingClientRect();
      const journey = clamp(
        -heroBounds.top / Math.max(1, heroBounds.height - innerHeight),
      );
      // Clear the paper as the chart enters, then restore pigment as it leaves.
      const graph = immersive.matches
        ? ease((journey - .08) / .18) *
          (1 - ease((innerHeight - heroBounds.bottom) / innerHeight))
        : 0;
      const ending = ease(
        (innerHeight - finale.getBoundingClientRect().top) / innerHeight,
      );
      const quiet = Math.max(graph, ending);
      node.style.setProperty("--backdrop-progress", String(progress));
      node.style.setProperty("--backdrop-pigment", String(.42 - quiet * .39));
      node.style.setProperty("--backdrop-grain", String(.065 - quiet * .035));
    }
    function scroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    update();
    addEventListener("scroll", scroll, { passive: true });
    addEventListener("resize", scroll);
    reducedMotion.addEventListener("change", scroll);
    immersive.addEventListener("change", scroll);
    return () => {
      removeEventListener("scroll", scroll);
      removeEventListener("resize", scroll);
      reducedMotion.removeEventListener("change", scroll);
      immersive.removeEventListener("change", scroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return <div className="landing-backdrop" ref={backdrop} aria-hidden="true" />;
}
