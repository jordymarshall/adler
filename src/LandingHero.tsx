import { Link } from "react-router-dom";
import { ArrowDown, ArrowUpRight, Asterisk } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Modal } from "./components";

const screens = [
  { image: "progress", label: "See your progress", alt: "Adler’s actual mobile goal view, with reported books, projected finish and the uncertainty range." },
  { image: "check-in", label: "Check in with Adler", alt: "Adler’s actual mobile Check-in, with a reading report and a contextual response linked to the goal." },
  { image: "insights", label: "Understand what helps", alt: "Adler’s actual mobile Insights, with current hypotheses and their next review dates." },
];

export function LandingHero() {
  const stage = useRef<HTMLDivElement>(null);
  const [screen, setScreen] = useState<number | null>(null);
  const [availability, setAvailability] = useState("iOS and Android apps coming soon.");
  useEffect(() => {
    const motion = matchMedia("(min-width: 900px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)");
    let frame = 0;
    function update() {
      frame = 0;
      const node = stage.current!;
      const box = node.getBoundingClientRect();
      const travel = box.height - node.firstElementChild!.getBoundingClientRect().height - 100;
      const progress = motion.matches ? Math.min(1, Math.max(0, (100 - box.top) / Math.max(1, travel))) : 0;
      node.style.setProperty("--phone-gather", String(progress * progress * (3 - 2 * progress)));
    }
    function scroll() { if (!frame) frame = requestAnimationFrame(update); }
    update();
    motion.addEventListener("change", scroll);
    addEventListener("scroll", scroll, { passive: true });
    addEventListener("resize", scroll);
    return () => {
      motion.removeEventListener("change", scroll);
      removeEventListener("scroll", scroll);
      removeEventListener("resize", scroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <section className="journey-introduction" aria-label="A system that understands you">
      <div className="hero-cover">
      <div className="hero-eyebrow"><span className="landing-chapter-number">01</span> YOUR NEXT CHAPTER <Asterisk size={22} aria-hidden="true" /></div>
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
      <div className="hero-preview">
      <div className="hero-preview-heading" id="inside-adler"><span className="hero-eyebrow"><span className="landing-chapter-number">02</span> ONE SYSTEM, EVERY STEP</span><h2>Your progress.<br />Your coach.<br /><em>Your kind of clarity.</em></h2></div>
      <div className="hero-phone-stage" ref={stage}>
      <div className="hero-mobile-screens" role="group" aria-label="Three views of the Adler app">
        <svg className="hero-phone-curves" viewBox="0 0 1200 620" fill="none" aria-hidden="true">
          <path d="M-80 390C80 390 55 80 230 160S405 530 600 310S790 50 900 130S1110 330 1280 60" />
          <path d="M-80 500C100 580 150 350 310 420S485 70 600 200S830 530 1000 420S1100 120 1280 210" />
          <circle cx="230" cy="160" r="5" /><circle cx="1000" cy="420" r="5" />
        </svg>
        {screens.map((item, index) => <figure className={`hero-mobile-preview hero-mobile-${item.image}`} key={item.image}>
          <button className="hero-mobile-phone" onClick={() => setScreen(index)} aria-label={`Enlarge ${item.label}`}>
            <span className="hero-phone-camera" aria-hidden="true" />
            <img src={`/media/app/hero-${item.image}-mobile.webp`} width="780" height="1560" alt={item.alt} fetchPriority={index === 1 ? "high" : "auto"} />
            <span className="hero-phone-home" aria-hidden="true" />
          </button>
          <figcaption>{item.label}</figcaption>
        </figure>)}
      </div>
      </div>
      <div className="hero-overview-caption"><small>Actual web app · Example workspace · Tap a screen to explore</small><a className="text-link" href="#the-path">Follow one goal <ArrowDown size={15} /></a></div>
      </div>
      {screen !== null && <Modal title={screens[screen].label} onClose={() => setScreen(null)}><img className="hero-screen-expanded" src={`/media/app/hero-${screens[screen].image}-mobile.webp`} width="780" height="1560" alt={screens[screen].alt} /></Modal>}
    </section>
  );
}
