import { Link } from "react-router-dom";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { useState } from "react";

export function LandingHero() {
  const [availability, setAvailability] = useState("Get started on the web. iOS and Android apps are coming soon.");
  return (
    <section className="journey-introduction" aria-label="Know what to do next to reach your goals">
      <div className="hero-cover">
      <div className="hero-intro-v2">
        <h1>Know what to do next <em>to reach your goals.</em></h1>
        <p>
          Tell Adler what you want to achieve. It works out a plan, checks in on
          how it’s going, and recommends what to change when you’re stuck. You can
          talk it through over text.
        </p>
        <div className="hero-downloads">
          <Link className="btn dark" to="/app/goals/new">Start with a goal <ArrowUpRight size={17} /></Link>
          <button className="store-download apple-download" aria-describedby="mobile-availability" onClick={() => setAvailability("The App Store version is coming soon. You can get started on the web.")}><img src="/brands/app-store-badge.svg" width="120" height="40" alt="Download on the App Store" /></button>
          <button className="store-download google-download" aria-describedby="mobile-availability" onClick={() => setAvailability("The Google Play version is coming soon. You can get started on the web.")}><img src="/brands/google-play-badge.png" width="646" height="250" alt="Get it on Google Play" /></button>
        </div>
        <p id="mobile-availability" className="hero-availability" role="status">{availability}</p>
      </div>
      <div className="hero-bloom" aria-hidden="true">
        <img src="/media/landing/wrapped-bloom.webp" width="1254" height="1254" alt="" fetchPriority="high" />
      </div>
      <div className="hero-cover-footer"><a href="#inside-adler">A look inside Adler <ArrowDown size={15} /></a></div>
      </div>
    </section>
  );
}
