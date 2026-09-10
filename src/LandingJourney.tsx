import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { LandingAppCapture, type LandingScreen } from "./LandingAppCapture";
import { Modal } from "./components";
import "./landing-journey.css";

const scenes: { screen: LandingScreen; label: string; title: string; copy: string; quote?: string }[] = [
  { screen: "goals", label: "Your goal", title: "Turn a rough idea into a clear goal.", quote: "“I want to finish my portfolio.”", copy: "Start there. Adler helps you decide what you’re aiming for and recommends how to begin." },
  { screen: "plan", label: "Your plan", title: "Know what to work on next.", copy: "Adler breaks the goal into actions and recommends your next step, so you can start without planning every detail yourself." },
  { screen: "progress", label: "Your progress", title: "See your progress toward the goal.", copy: "See your completed sessions and progress toward the goal in one place." },
  { screen: "checkin", label: "Your experiment", title: "Know what to try when your plan isn’t working.", copy: "If you keep missing sessions or spending time without finishing, Adler helps work out why. It uses your check-ins and behavioural science to suggest a different approach." },
  { screen: "insights", label: "Your learning", title: "Get advice that builds on what you’ve already tried.", copy: "Adler comes back to the change it suggested and asks how it went. It remembers your experience and recommends what to keep or change in the plan." },
  { screen: "imessage", label: "Texting", title: "Text Adler or chat in-app. It already knows what you’re working on.", copy: "Adler has your goals, current plan, and previous check-ins. Send an update, talk through a suggestion, or ask it to book time in your connected calendar." },
  { screen: "connections", label: "Your connections", title: "Bring Adler into the apps you already use.", copy: "Connect your calendar so Adler can plan around your day. Work on the same goals from compatible assistants, with your plan and check-ins already there." },
];

export function LandingJourney() {
  const journey = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [setup, setSetup] = useState(false);
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

  return <section className="phone-journey" id="the-path" ref={journey} aria-label="One goal, from first plan to learning what helps">
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
            {scene.screen === "imessage" && <g fill="currentColor" transform="rotate(-30 400 450)">
              {[0, 1, 2, 3, 4].map(i => <rect key={i} x={i * 185 - 60} y={i % 2 ? -120 : 120} width="112" height="880" rx="56" />)}
            </g>}
            {scene.screen === "progress" && <g stroke="currentColor" strokeWidth="52">
              {[0, 1, 2, 3, 4].map(i => <circle key={i} cx="780" cy="920" r={170 + i * 130} />)}
            </g>}
            {scene.screen === "connections" && <g stroke="currentColor" strokeWidth="32">
              {[160, 300, 440, 580].map(r => <circle key={r} cx="400" cy="450" r={r} />)}
            </g>}
          </svg>
        </div>
        <header className="phone-story-top"><span>HOW ADLER WORKS <span className="phone-story-count">0{active + 1} / 0{scenes.length}</span></span><button onClick={() => goTo(scenes.length)}>Skip the story <ArrowUpRight size={14} /></button></header>
        <div className="phone-story-content">
          <div className="phone-story-copy" aria-live="polite" aria-atomic="true">
            <h2>{scene.title}</h2>
            <p>{scene.quote && <span className="phone-story-quote">{scene.quote}</span>}{scene.copy}</p>
          </div>
          <LandingAppCapture screen={scene.screen} />
        </div>
        <div className="phone-story-progress" aria-hidden="true"><span /></div>
        <footer className="phone-story-footer">
          <nav className="phone-story-controls" aria-label="Your goal journey">
            <button aria-label="Previous screen" disabled={active === 0} onClick={() => goTo(active - 1)}><ArrowLeft size={18} /></button>
            <div className="phone-story-dots">{scenes.map((item, index) => <button key={item.screen} aria-label={`Show ${item.label.toLowerCase()}`} aria-current={active === index ? "step" : undefined} onClick={() => goTo(index)}><span /></button>)}</div>
            <button aria-label={active === scenes.length - 1 ? "Continue past the story" : "Next screen"} onClick={() => goTo(active + 1)}><ArrowRight size={18} /></button>
          </nav>
          <div className="phone-story-links"><Link to="/integrations">Explore connections</Link><Link to="/method">Read the coaching method</Link><button onClick={() => setSetup(true)}>Before you start</button></div>
        </footer>
        {setup && <Modal title="Before you start" onClose={() => setSetup(false)}>
          <div className="story-setup">
            {[
              ["What if I don’t know exactly what my goal is?", "Start with something you’d like to change or work toward. Adler helps you make it clear enough to plan."],
              ["What do I need to tell Adler?", "What you want to work toward, what you’ve tried, and how it went. Adler asks for the details it needs to recommend a useful next step."],
              ["When will Adler text me?", "Connect your phone and turn on scheduled check-ins. Choose a check-in after scheduled work or at the end of your day, with quiet hours that suit you. You can also text Adler whenever you want to talk something through."],
              ["Can I change the plan or what Adler remembers?", "Yes. Accept, edit, or discuss a suggestion, or keep your current plan. You can review, correct, or remove saved information about your goals and experience."],
              ["How do I get started?", "Start with a goal in the web app. Coaching currently requires an AI provider and your own API key. Texting and calendar access need to be connected too. iOS and Android apps are coming soon."],
            ].map(([question, answer]) => <details key={question}><summary>{question}<Plus size={16} /></summary><p>{answer}</p></details>)}
            <p>Adler’s effectiveness has not yet been evaluated. <Link to="/method">Read the coaching method <ArrowUpRight size={13} /></Link></p>
          </div>
        </Modal>}
      </div>
    </section>;
}
