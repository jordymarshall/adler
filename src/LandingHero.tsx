import { Link } from "react-router-dom";
import { ArrowDown, ArrowUpRight, Asterisk } from "lucide-react";
import { useState } from "react";

export function LandingHero() {
  const [availability, setAvailability] = useState("iOS and Android apps coming soon.");
  return (
    <section className="journey-introduction" aria-label="A system that understands you">
      <div className="hero-cover">
      <div className="hero-eyebrow">YOUR NEXT CHAPTER <Asterisk size={22} aria-hidden="true" /></div>
      <div className="hero-intro-v2">
        <h1>Reach your goals with a system <em>that understands you.</em></h1>
        <p>
          Adler turns your goals into manageable actions, then uses behavioural
          science and your check-ins to adapt the system as you go.
        </p>
        <div className="hero-downloads">
          <Link className="btn dark" to="/app/goals/new">Get started on web <ArrowUpRight size={17} /></Link>
          <button className="store-download apple-download" aria-describedby="mobile-availability" onClick={() => setAvailability("The App Store version is coming soon. You can get started on the web.")}><img src="/brands/app-store-badge.svg" width="120" height="40" alt="Download on the App Store" /></button>
          <button className="store-download google-download" aria-describedby="mobile-availability" onClick={() => setAvailability("The Google Play version is coming soon. You can get started on the web.")}><img src="/brands/google-play-badge.png" width="646" height="250" alt="Get it on Google Play" /></button>
        </div>
        <p id="mobile-availability" className="hero-availability" role="status">{availability}</p>
      </div>
      <div className="hero-bloom" aria-hidden="true">
        <img src="/media/landing/wrapped-bloom.webp" width="1254" height="1254" alt="" fetchPriority="high" />
      </div>
      <div className="hero-cover-footer"><span>Your goals. Your pace.</span><a href="#inside-adler">A look inside Adler <ArrowDown size={15} /></a></div>
      </div>
    </section>
  );
}
