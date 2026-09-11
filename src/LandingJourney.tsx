import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { LandingAppCapture } from "./LandingAppCapture";
import { landingBeats, landingFrames } from "./landing-sequence";
import { Link } from "react-router-dom";
import { ReasonButton } from "./LandingEvidence";
import "./landing-journey.css";

function StoryBackdrop() {
  return <svg className="story-backdrop" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <g className="story-fan">
      <path d="M-90 960 30 340 120 335Z" />
      <path d="M-90 960 190 315 295 335Z" />
      <path d="M-90 960 380 350 485 395Z" />
      <path d="M-90 960 560 445 640 520Z" />
      <path d="M-90 960 690 585 725 670Z" />
      <path d="M-90 960 765 750 765 840Z" />
    </g>
    <g className="story-folds">
      <path d="M1500 -160 950 140 980 330Z" />
      <path d="M1500 -160 1080 450 1210 530Z" />
      <path d="M1500 -160 1360 580 1520 610Z" />
    </g>
  </svg>;
}

export function LandingJourney() {
  const query = "(max-width: 650px) and (max-height: 620px), (max-height: 600px) and (min-width: 651px)";
  const [linear, setLinear] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setLinear(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  // Short viewports use document flow so the app stays readable at native size.
  return linear ? <section className="phone-story-linear" id="the-path" aria-label="One goal, from first plan to learning what helps">
    <span id="inside-adler" />
    {landingBeats.map((beat, index) => <article key={beat.screen} data-screen={beat.screen}>
      <StoryBackdrop />
      <header><span className="phone-story-date">{beat.date} · {index + 1} / {landingBeats.length}</span><h2>{beat.title}</h2></header>
      <LandingAppCapture screen={beat.screen} phase={beat.frames - 1} />
      <aside className="phone-story-brain"><p>{beat.explanation}</p>{beat.research && <ReasonButton reviewed={beat.research === "reviewed"} />}</aside>
    </article>)}
  </section> : <ScrollJourney />;
}

function ScrollJourney() {
  const journey = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { beat, beatIndex, phase } = landingFrames[active];

  useEffect(() => {
    let frame = 0;
    function update() {
      frame = 0;
      const box = journey.current!.getBoundingClientRect();
      const travel = box.height - stage.current!.offsetHeight;
      const progress = Math.max(0, Math.min(1, -box.top / travel));
      setActive(Math.min(landingFrames.length - 1, Math.floor(progress * landingFrames.length)));
    }
    function scroll() { if (!frame) frame = requestAnimationFrame(update); }
    const observer = new ResizeObserver(scroll);
    observer.observe(journey.current!);
    update();
    addEventListener("scroll", scroll, { passive: true });
    addEventListener("resize", scroll);
    return () => {
      observer.disconnect();
      removeEventListener("scroll", scroll);
      removeEventListener("resize", scroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  function goTo(index: number) {
    const node = journey.current!;
    const distance = (node.offsetHeight - stage.current!.offsetHeight) / landingFrames.length;
    // Land inside the frame so fractional layout pixels cannot select its predecessor.
    const offset = index === landingFrames.length ? node.offsetHeight : (index + .2) * distance;
    window.scrollTo({ top: scrollY + node.getBoundingClientRect().top + offset, behavior: "instant" });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("dialog, input, textarea, button, a, select, summary")) return;
    const next = event.key === "ArrowRight" ? active + 1 : event.key === "ArrowLeft" ? active - 1 : event.key === "Home" ? 0 : event.key === "End" ? landingFrames.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    goTo(Math.max(0, Math.min(landingFrames.length - 1, next)));
  }

  return <section className="phone-journey" id="the-path" ref={journey} style={{ "--story-frames": landingFrames.length } as CSSProperties} aria-label="One goal, from first plan to learning what helps">
    <span id="inside-adler" className="phone-story-anchor" aria-hidden="true" />
    <div className="phone-story" ref={stage} data-screen={beat.screen} data-frame={active} style={{ "--story-step": phase } as CSSProperties} onKeyDown={onKeyDown} tabIndex={0} aria-label="Scroll or use the left and right arrow keys to follow the goal.">
      <StoryBackdrop />
      <header className="phone-story-top"><span>ONE GOAL, OVER TIME <span className="phone-story-count">{beatIndex + 1} / {landingBeats.length}</span></span><div className="phone-story-tools">{beatIndex >= 6 ? <Link to="/app/goals/new">Start with a goal <ArrowUpRight size={14} /></Link> : <span className="phone-scroll-hint"><ArrowDown size={13} /> Scroll to continue</span>}<button onClick={() => goTo(landingFrames.length)}>Skip <ArrowUpRight size={14} /></button></div></header>
      <div className="phone-story-content">
        <div className="phone-story-copy" aria-live="polite" aria-atomic="true"><span className="phone-story-date">{beat.date}</span><h2>{beat.title}</h2></div>
        <LandingAppCapture screen={beat.screen} phase={phase} />
        <aside className="phone-story-brain" aria-label="How Adler helps" aria-live="polite" aria-atomic="true">
          <span className="phone-brain-label">HOW ADLER HELPS</span><p>{beat.explanation}</p>
          {beat.research && <ReasonButton key={beat.screen} reviewed={beat.research === "reviewed"} />}
        </aside>
      </div>
    </div>
  </section>;
}
