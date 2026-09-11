import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUpRight } from "lucide-react";

const artwork = ["01", "02", "03"].map(pose => `/media/hero/adler-unfold-v1-${pose}`);

export function LandingHero() {
  const art = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const node = art.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let request = 0;
    const update = () => {
      request = 0;
      if (!ready || reduced.matches) { setFrame(0); return; }
      const rect = node.getBoundingClientRect();
      // Start as the artwork reaches view on mobile; no extra scroll section.
      const start = Math.max(0, rect.top + window.scrollY - window.innerHeight * .25);
      const progress = (window.scrollY - start) / (rect.height * .7);
      setFrame(Math.max(0, Math.min(5, Math.floor(progress * 6))));
    };
    const schedule = () => { if (!request) request = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    observer.observe(node);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reduced.addEventListener("change", schedule);
    update();
    return () => {
      cancelAnimationFrame(request);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reduced.removeEventListener("change", schedule);
    };
  }, [ready]);
  return <section className="journey-introduction" aria-label="Your AI goal coach">
    <div className="hero-cover">
      <div className="hero-intro-v2">
        <span className="hero-category">YOUR AI GOAL COACH</span>
        <h1>Follow through on the goal that keeps slipping.</h1>
        <p>Adler helps you plan the work, understand what gets in the way, and adjust your next steps using what you’ve tried.</p>
        <div className="hero-actions"><Link className="btn dark" to="/app/goals/new">Start with a goal <ArrowUpRight size={17} /></Link><a href="#the-path">See an example <ArrowDown size={15} /></a></div>
        <p className="hero-availability">Start on the web.</p>
      </div>
      <div className="hero-art" ref={art} data-frame={frame} aria-hidden="true">
        {artwork.map((path, i) => <img key={path} src={`${path}-1100.jpg`} srcSet={`${path}-640.jpg 640w, ${path}-1100.jpg 1100w`} sizes="(max-width: 650px) calc(100vw - 44px), (max-width: 1000px) 46vw, 560px" width="1100" height="1100" alt="" fetchPriority={i === 0 ? "high" : "low"} decoding="async" data-active={Math.floor(frame / 2) === i} onLoad={() => setReady([...art.current!.querySelectorAll("img")].every(image => image.complete && image.naturalWidth > 0))} />)}
      </div>
    </div>
  </section>;
}
