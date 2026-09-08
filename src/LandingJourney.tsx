import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { Mark } from "./LandingArt";
import { LandingAppCapture } from "./LandingAppCapture";
import { ConnectionsPreview } from "./LandingConnectionsPreview";
import "./landing-journey.css";

const steps = ["Choose your goal", "Make a workable plan", "Check in on real life", "Test and adapt", "See the path ahead"];

function AppDetails({ screen, label }: { screen: "goals" | "calendar" | "progress" | "insights"; label: string }) {
  return <details className="journey-app-detail" data-screen={screen}>
    <summary>{label} <span aria-hidden="true">+</span></summary>
    <LandingAppCapture screen={screen} />
  </details>;
}

export function LandingJourney() {
  const journey = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const panels = [...journey.current!.querySelectorAll<HTMLElement>(".journey-step")];
    let frame = 0;
    function update() {
      frame = 0;
      let current = 0;
      panels.forEach((panel, index) => {
        if (panel.getBoundingClientRect().top <= innerHeight * .4) current = index;
      });
      panels.forEach((panel, index) => panel.classList.toggle("is-current", index === current));
      setActive(current);
    }
    function scroll() { if (!frame) frame = requestAnimationFrame(update); }
    update();
    addEventListener("scroll", scroll, { passive: true });
    addEventListener("resize", scroll);
    return () => {
      removeEventListener("scroll", scroll);
      removeEventListener("resize", scroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return <section className="goal-journey section-wrap" id="the-path" ref={journey} aria-label="One goal, from first plan to finish">
    <header className="journey-opening">
      <span className="section-kicker">FOLLOW ONE GOAL</span>
      <h2>You bring the goal.<br /><em>We keep working on how you get there.</em></h2>
      <p>A fictional reading journey. Your goal, actions and review rhythm will be your own.</p>
    </header>
    <div className="journey-layout">
      <nav className="journey-index" aria-label="Your goal journey">
        <div className="journey-goal-anchor"><BookOpen size={19} /><span>Read 30 books<small>One goal. An evolving plan.</small></span></div>
        <ol>{steps.map((step, index) => <li key={step}>
          <a href={`#step-${index + 1}`} aria-current={active === index ? "step" : undefined}>
            <span className="journey-index-number">0{index + 1}</span><span>{step}</span>
          </a>
        </li>)}</ol>
      </nav>
      <div className="journey-stages">
        <article className="journey-step" id="step-1" aria-labelledby="journey-title-1">
          <header className="journey-step-heading"><span className="journey-eyebrow">01 · YOUR GOAL</span><h2 id="journey-title-1">Start with something<br /><em>that matters to you.</em></h2><p>You choose the outcome. Adler helps clarify what success means and what else needs your time.</p></header>
          <div className="journey-app-demo" data-screen="goals"><LandingAppCapture screen="goals" /></div>
          <p className="journey-transition"><ArrowDown size={16} /> Start with the time and energy you actually have.</p>
        </article>
        <article className="journey-step" id="step-2" aria-labelledby="journey-title-2">
          <header className="journey-step-heading"><span className="journey-eyebrow">02 · YOUR FIRST PLAN</span><h2 id="journey-title-2">Make the next action clear.<br /><em>Leave room to learn.</em></h2><p>Adler chooses a manageable action and review period. Your goal page shows what you’re working on now, how it fits, and what comes next.</p></header>
          <div className="journey-app-demo" data-screen="plan"><LandingAppCapture screen="plan" /></div>
          <p className="journey-transition"><ArrowDown size={16} /> Then your check-ins show where the plan needs to change.</p>
        </article>
        <article className="journey-step" id="step-3" aria-labelledby="journey-title-3">
          <header className="journey-step-heading"><span className="journey-eyebrow">03 · CHECK IN ON REAL LIFE</span><h2 id="journey-title-3">A missed action is a clue.<br /><em>Your check-in gives it context.</em></h2><p>Tell Adler what you tried and what got in the way. It keeps the context across your goals and connects your check-in to the plan and learning it informs.</p></header>
          <div className="journey-app-demo" data-screen="checkin"><LandingAppCapture screen="checkin" /></div>
          <p className="journey-transition"><ArrowDown size={16} /> Turn that explanation into one change you can test.</p>
        </article>
        <article className="journey-step" id="step-4" aria-labelledby="journey-title-4">
          <header className="journey-step-heading"><span className="journey-eyebrow">04 · TRY, REVIEW, ADAPT</span><h2 id="journey-title-4">The suggestion is a test.<br /><em>The next check-in moves it forward.</em></h2><p>You choose the change. Adler remembers what you’re testing, checks what happened, and updates the plan with you.</p></header>
          <div className="journey-app-demo" data-screen="insights"><LandingAppCapture screen="insights" /></div>
          <div className="journey-in-life"><h3>The same coach, inside your day.</h3><p>Check in through the app, text or a connected AI tool. Adler keeps the context and can book reading time around your calendar, with your approval.</p><details className="journey-app-detail"><summary>See the check-in become a calendar booking <span aria-hidden="true">+</span></summary><ConnectionsPreview /></details><AppDetails screen="calendar" label="Explore the full calendar with your other goals" /></div>
          <p className="journey-transition"><ArrowDown size={16} /> Keep the useful changes. Keep the outcome in view.</p>
        </article>
        <article className="journey-step" id="step-5" aria-labelledby="journey-title-5">
          <header className="journey-step-heading"><span className="journey-eyebrow">05 · PROGRESS TOWARD YOUR GOAL</span><h2 id="journey-title-5">See where your actions<br /><em>could take you.</em></h2><p>Track pages read and books finished separately. As you report more, Adler updates the estimate and helps you revisit the plan or target date.</p></header>
          <div className="journey-app-demo journey-progress" data-screen="progress"><LandingAppCapture screen="progress" /><p className="journey-capture-note">The dashed line and shaded range depend on reported pages and assumed book lengths. They show possible scenarios, not a success probability.</p></div>
          <div className="journey-finish"><Mark /><div><span className="journey-eyebrow">WHEN YOU REACH THE FINISH</span><blockquote>“That’s book 30 finished.”</blockquote><p>You confirm the result. Keep what you learned for the next goal you choose.</p><small>Illustrative journey, not a customer result or a promised outcome.</small></div></div>
          <Link className="btn dark" to="/app/goals/new">Start with your own goal <ArrowRight size={16} /></Link>
        </article>
      </div>
    </div>
  </section>;
}
