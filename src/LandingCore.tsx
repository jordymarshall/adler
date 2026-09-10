import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "./LandingArt";

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
          <Link to="/method" onClick={() => setMenu(false)}>
            Our approach
          </Link>
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
        <MountainFinale />
      </main>
      <footer className="landing-footer section-wrap">
        <Logo />
        <div>
          <a href="#the-path">How it works</a>
          <Link to="/method">Our approach</Link>
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
