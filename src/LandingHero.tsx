import { Link } from "react-router-dom";
import { ArrowUpRight, Check, PenLine, Sparkles } from "lucide-react";

export function LandingHero() {
  return (
    <section className="adaptive-hero" aria-label="A plan that adapts to you">
      <div className="hero-atmosphere" aria-hidden="true" />
      <div className="adaptive-hero-copy">
        <span className="chapter-label">
          YOUR GOALS. YOUR LIFE. A WAY FORWARD.
        </span>
        <h1>
          Reach your goals with a plan <em>that adapts to you.</em>
        </h1>
        <p>
          Adler learns what gets in your way and adjusts your plan to help you
          build the behaviours that move you forward, guided by behavioural
          science research.
        </p>
        <div className="hero-buttons">
          <Link className="btn dark" to="/app/goals/new">
            Start with your goal <ArrowUpRight size={17} />
          </Link>
          <a className="btn quiet" href="#the-path">
            See how it works ↓
          </a>
        </div>
      </div>
      <div className="hero-plan-story" aria-label="Illustrative portfolio goal">
        <div className="hero-story-card">
          <PenLine size={22} />
          <small>THE GOAL</small>
          <h2>Publish my portfolio.</h2>
          <p>3 case studies · November 15</p>
          <div className="story-progress">
            <span />
          </div>
          <span className="story-caption">1 published · 2 to go</span>
        </div>
        <span className="story-connector" aria-hidden="true">
          →
        </span>
        <div className="hero-story-card">
          <Check size={22} />
          <small>THE BEHAVIOUR</small>
          <h2>25 minutes after breakfast.</h2>
          <p>Open my draft before opening email.</p>
          <span className="story-caption">
            Tuesday & Thursday · A rhythm to test
          </span>
        </div>
        <span className="story-connector" aria-hidden="true">
          →
        </span>
        <div className="hero-story-card story-adaptation">
          <Sparkles size={22} />
          <small>WHAT CHANGES</small>
          <h2>Make starting easier.</h2>
          <p>“I keep editing instead of finishing.”</p>
          <span className="story-caption">
            Try a smaller finish line. Review after two sessions.
          </span>
        </div>
      </div>
      <span className="hero-example-note">
        An example of how your plan develops.
      </span>
    </section>
  );
}
