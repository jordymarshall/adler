import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Menu,
  Plus,
  X,
} from "lucide-react";
import { Logo } from "./LandingArt";

import { LandingImmersiveGraph } from "./LandingImmersiveGraph";
import { LandingHero } from "./LandingHero";
import { LandingBackdrop } from "./LandingBackdrop";
import { LandingJourney } from "./LandingJourney";
import { MountainFinale } from "./MountainFinale";
import "./landing-core.css";

export function Landing() {
  const [menu, setMenu] = useState(false);
  return (
    <div className="v2-landing">
      <LandingBackdrop />
      <header className="landing-nav">
        <Logo />
        <nav aria-label="Main navigation" className={menu ? "menu-open" : ""}>
          <a href="#the-path" onClick={() => setMenu(false)}>
            How it works
          </a>
          <a href="#approach" onClick={() => setMenu(false)}>
            Our approach
          </a>
          <Link to="/app/today">
            Explore the app <ArrowUpRight size={12} />
          </Link>
        </nav>
        <Link className="btn dark nav-cta" to="/app/goals/new">
          Start with a goal <ArrowUpRight size={15} />
        </Link>
        <button
          className="icon-button menu-toggle"
          aria-label={menu ? "Close menu" : "Open menu"}
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </header>
      <main id="main-content">
        <LandingHero />
        <LandingJourney />
        <LandingImmersiveGraph />
        <section className="journey-method section-wrap" id="approach">
          <div className="journey-method-copy">
            <span className="section-kicker">THE THINKING BEHIND YOUR PLAN</span>
            <h2>Research informs the suggestion.<br /><em>Your experience informs what happens next.</em></h2>
            <p>Adler connects your reports to specific behavioural research, saves what we’re testing, and revisits it as you learn. You can inspect the reasoning and correct what it remembers.</p>
            <Link className="text-link" to="/method">Explore the coaching method <ArrowUpRight size={15} /></Link>
            <small>Research-informed coaching. Adler’s effectiveness has not yet been evaluated.</small>
          </div>
          <img className="journey-method-art" src="/media/landing/learning-rhythm.webp" width="1254" height="1254" alt="" loading="lazy" decoding="async" />
        </section>
        <section className="v2-faq section-wrap">
          <div className="faq-heading"><span className="section-kicker">GOOD QUESTIONS</span><h2>A little more clarity.</h2><p>A few things you might be wondering before you begin.</p></div>
          <div className="faq-questions">
          {[
            [
              "What can I work toward?",
              "A career goal, a creative project, a skill you want to learn, or a change in your everyday life. Start with something that matters to you; Adler helps make the outcome and next step clear.",
            ],
            [
              "What happens when I miss a step?",
              "Record what happened, with as much or as little context as you want. Adler helps you look at the approach, timing, or size of the next step. Your previous progress stays part of the picture.",
            ],
            [
              "Does Adler remember what I tell it?",
              "Yes. Adler can save your preferences, constraints, and context for future conversations. It also uses your check-ins, results, and past plan decisions to help refine its recommendations. You can review, correct, or remove saved information.",
            ],
            [
              "How is Adler’s coaching system improving?",
              "Adler uses our behavioural research framework, specific source claims and your reports to guide suggestions. Each substantive recommendation is checked before you see it. This review can still miss errors; Adler’s combined coaching system has not yet been evaluated for effectiveness.",
            ],
            [
              "Do I stay in control?",
              "Yes. You can review the reason for a suggestion, ask for a different approach, or keep your current plan. You choose what to accept.",
            ],
            [
              "How do I start?",
              "Describe one goal. Adler helps clarify the result and build a plan around how you work. Review your first step, start the plan, and choose when to do it. Your account keeps your goals and check-ins. Coaching requires a configured AI provider.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <Plus size={18} />
              </summary>
              <p>{a}</p>
            </details>
          ))}
          </div>
        </section>
        <MountainFinale />
      </main>
      <footer className="landing-footer section-wrap">
        <Logo />
        <p>
          A little direction.
          <br />A meaningful difference.
        </p>
        <div>
          <a href="#the-path">How it works</a>
          <a href="#approach">Our approach</a>
          <Link to="/app/today">
            Explore the app <ArrowUpRight size={12} />
          </Link>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Adler</span>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/support">Help</Link>
          <span className="canada-note"><span aria-hidden="true">🇨🇦</span> Proudly built in Canada</span>
        </div>
      </footer>
    </div>
  );
}
