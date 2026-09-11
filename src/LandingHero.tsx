import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUpRight } from "lucide-react";

const artwork = ["01", "02"].map(pose => `/media/hero/adler-form-v2-${pose}`);

export function LandingHero() {
  const art = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState(0);
  const [ready, setReady] = useState(false);
  function prepareArtwork() {
    const images = [...art.current!.querySelectorAll("img")];
    if (images.every(image => image.complete && image.naturalWidth > 0)) {
      void Promise.all(images.map(image => image.decode())).then(() => {
        if (art.current) setReady(true);
      }, () => { /* Keep the first picture if another pose cannot decode. */ });
    }
  }
  useEffect(() => {
    const node = art.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let request = 0;
    const update = () => {
      request = 0;
      if (!ready || reduced.matches) { setFrame(0); return; }
      const rect = node.getBoundingClientRect();
      // The composition folds toward the next section within the normal page scroll.
      const top = rect.top + window.scrollY;
      const entry = window.innerWidth <= 1000 ? Math.max(0, rect.height - 480) : 0;
      const start = Math.max(0, top + entry - window.innerHeight * .35);
      const end = top + rect.height - window.innerHeight * .35;
      const progress = (window.scrollY - start) / Math.max(1, end - start);
      setFrame(Math.max(0, Math.min(11, Math.floor(progress * 12))));
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
    <div className="hero-cover" style={{ "--hero-progress": frame / 11 } as CSSProperties}>
      <div className="hero-intro-v2">
        <span className="hero-category">YOUR AI GOAL COACH</span>
        <h1>Follow through on the goal that keeps slipping.</h1>
        <p>Adler helps you plan the work, understand what gets in the way, and adjust your next steps using what you’ve tried.</p>
        <div className="hero-actions"><Link className="btn dark" to="/app/goals/new">Start with a goal <ArrowUpRight size={17} /></Link><a href="#the-path">See an example <ArrowDown size={15} /></a></div>
        <p className="hero-availability">Start on the web.</p>
      </div>
      <div className="hero-art" ref={art} data-frame={frame} aria-hidden="true">
        <svg className="hero-flow" viewBox="0 0 1440 900" preserveAspectRatio="none">
          <defs>
            <linearGradient id="hero-flow-color" x1="1" y1="0" x2=".4" y2="1"><stop stopColor="#d5ec87" /><stop offset=".65" stopColor="#e5efc6" /><stop offset="1" stopColor="#dce7ca" /></linearGradient>
            <path id="hero-flow-path" d="M1580 -240 C1130 -250 1390 530 1040 530 C830 530 500 475 435 630 C355 815 720 800 720 950" />
          </defs>
          <use href="#hero-flow-path" fill="none" stroke="url(#hero-flow-color)" strokeWidth="190" />
          <use href="#hero-flow-path" fill="none" stroke="#f5f7e8" strokeWidth="100" />
          <use href="#hero-flow-path" fill="none" stroke="#d4e5b3" strokeWidth="2" />
        </svg>
        <span className="hero-orbit" />
        <div className="hero-sculpture">
          {artwork.map((path, i) => <img key={path} src={`${path}-1200.webp`} srcSet={`${path}-640.webp 640w, ${path}-1200.webp 1200w`} sizes="(max-width: 650px) 560px, (max-width: 1000px) 700px, 940px" width="1200" height="1200" alt="" fetchPriority={i === 0 ? "high" : "low"} decoding="sync" data-active={Math.min(1, Math.floor(frame / 4)) === i} onLoad={prepareArtwork} />)}
        </div>
      </div>
    </div>
  </section>;
}
