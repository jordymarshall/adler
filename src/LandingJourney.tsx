import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { LandingAppCapture, type LandingScreen } from "./LandingAppCapture";
import { ConnectionsPreview } from "./LandingConnectionsPreview";
import "./landing-journey.css";

const scenes: { screen: LandingScreen; label: string; title: string; copy: string }[] = [
  { screen: "goals", label: "Your goal", title: "Set a goal.", copy: "Read 30 books." },
  { screen: "plan", label: "Your plan", title: "Get a plan.", copy: "Read 20 pages after lunch." },
  { screen: "checkin", label: "Your check-in", title: "Report what happened.", copy: "Lunch worked at home. Office days were busy." },
  { screen: "insights", label: "Your learning", title: "Your plan adapts.", copy: "Keep reading at home. Check time at the office." },
  { screen: "calendar", label: "Your time", title: "Make time for it.", copy: "Tuesday, 12:30. Twenty minutes." },
  { screen: "progress", label: "Your progress", title: "See your progress.", copy: "1 of 30 books finished." },
];

export function LandingJourney() {
  const journey = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const scene = scenes[active];

  useEffect(() => {
    let frame = 0;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    function update() {
      frame = 0;
      const box = journey.current!.getBoundingClientRect();
      const travel = box.height - stage.current!.offsetHeight;
      const progress = Math.max(0, Math.min(1, -box.top / travel));
      const position = Math.min(scenes.length - 1, progress * scenes.length);
      const index = Math.floor(position);
      // Hold the screen for reading, then gently blend into the next one.
      const transition = reducedMotion.matches ? 0 : Math.max(0, (position - index - .72) / .28);
      const blend = transition * transition * (3 - 2 * transition);
      setActive(index + (blend >= .5 ? 1 : 0));
      stage.current!.querySelectorAll<HTMLElement>(".story-phone-frame").forEach((panel, i) => {
        const opacity = i === index ? 1 - blend : i === index + 1 ? blend : 0;
        panel.style.opacity = String(opacity);
        panel.style.visibility = opacity > 0 ? "visible" : "hidden";
        panel.style.transform = reducedMotion.matches ? "none" : `translateY(${(i - index - blend) * 8}px)`;
      });
      stage.current!.style.setProperty("--story-progress", String(progress));
    }
    function scroll() { if (!frame) frame = requestAnimationFrame(update); }
    const observer = new ResizeObserver(scroll);
    observer.observe(journey.current!);
    update();
    addEventListener("scroll", scroll, { passive: true });
    addEventListener("resize", scroll);
    reducedMotion.addEventListener("change", scroll);
    return () => {
      observer.disconnect();
      removeEventListener("scroll", scroll);
      removeEventListener("resize", scroll);
      reducedMotion.removeEventListener("change", scroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  function goTo(index: number) {
    const node = journey.current!;
    const distance = (node.offsetHeight - stage.current!.offsetHeight) / scenes.length;
    // Land just inside the scene so fractional layout pixels cannot select its predecessor.
    const offset = index === scenes.length ? node.offsetHeight : index * distance + 1;
    window.scrollTo({ top: scrollY + node.getBoundingClientRect().top + offset, behavior: "instant" });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("dialog")) return;
    const next = event.key === "ArrowRight" ? active + 1 : event.key === "ArrowLeft" ? active - 1 : event.key === "Home" ? 0 : event.key === "End" ? scenes.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    goTo(Math.max(0, Math.min(scenes.length - 1, next)));
  }

  return <>
    <section className="phone-journey" id="the-path" ref={journey} aria-label="One goal, from first plan to finish">
      <span id="inside-adler" className="phone-story-anchor" />
      <div className="phone-story" ref={stage} data-screen={scene.screen} onKeyDown={onKeyDown} tabIndex={0} aria-label="Phone walkthrough. Scroll or use the left and right arrow keys to explore.">
        <div className="phone-story-art" aria-hidden="true">
          <svg viewBox="0 0 800 900" fill="none">
            {scene.screen === "goals" && <g stroke="currentColor" strokeWidth="42" transform="rotate(-25 400 450)">
              {[0, 1, 2, 3].map(i => <rect key={i} x={35 + i * 80} y={-80 + i * 90} width={730 - i * 160} height={1060 - i * 180} rx={365 - i * 80} />)}
            </g>}
            {scene.screen === "plan" && <g fill="currentColor" transform="translate(400 450)">
              {Array.from({ length: 12 }, (_, i) => <ellipse key={i} cy="-230" rx="92" ry="245" transform={`rotate(${i * 30})`} />)}
              <circle r="135" className="phone-art-center" />
            </g>}
            {scene.screen === "checkin" && <g stroke="currentColor" strokeWidth="58">
              {[0, 1, 2, 3, 4].map(i => <path key={i} transform={`translate(${i * 145 - 200} 0)`} d="M120-100C520 180-200 400 160 660S540 920 170 1100" />)}
            </g>}
            {scene.screen === "insights" && <g stroke="currentColor" strokeWidth="35" transform="rotate(30 400 450)">
              {[120, 220, 320, 420, 520].map(r => <rect key={r} x={400 - r} y={450 - r} width={r * 2} height={r * 2} rx={r * .55} />)}
            </g>}
            {scene.screen === "calendar" && <g fill="currentColor" transform="rotate(-30 400 450)">
              {[0, 1, 2, 3, 4].map(i => <rect key={i} x={i * 185 - 60} y={i % 2 ? -120 : 120} width="112" height="880" rx="56" />)}
            </g>}
            {scene.screen === "progress" && <g stroke="currentColor" strokeWidth="52">
              {[0, 1, 2, 3, 4].map(i => <circle key={i} cx="780" cy="920" r={170 + i * 130} />)}
            </g>}
          </svg>
        </div>
        <header className="phone-story-top"><span>HOW ADLER WORKS</span><a href="#approach">Skip the story <ArrowUpRight size={14} /></a></header>
        <div className="phone-story-content">
          <div className="phone-story-copy" aria-live="polite" aria-atomic="true">
            <h2>{scene.title}</h2>
            <p>{scene.copy}</p>
          </div>
          <LandingAppCapture screen={scene.screen} />
        </div>
        <div className="phone-story-progress" aria-hidden="true"><span /></div>
        <footer className="phone-story-footer">
          <span className="phone-story-caption">Reading example</span>
          <nav className="phone-story-controls" aria-label="Your goal journey">
            <button aria-label="Previous screen" disabled={active === 0} onClick={() => goTo(active - 1)}><ArrowLeft size={18} /></button>
            <div className="phone-story-dots">{scenes.map((item, index) => <button key={item.screen} aria-label={`Show ${item.label.toLowerCase()}`} aria-current={active === index ? "step" : undefined} onClick={() => goTo(index)}><span /></button>)}</div>
            <button aria-label={active === scenes.length - 1 ? "Continue past the story" : "Next screen"} onClick={() => goTo(active + 1)}><ArrowRight size={18} /></button>
          </nav>
          <span className="phone-story-scroll">Scroll to explore <ArrowDown size={14} /></span>
        </footer>
      </div>
    </section>
    <div className="journey-connections section-wrap">
      <details className="journey-app-detail"><summary>See the check-in become a calendar booking <span aria-hidden="true">+</span></summary><ConnectionsPreview /></details>
    </div>
  </>;
}
