import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

export function LandingAtmosphere() {
  const [paused, setPaused] = useState(
    () =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      Boolean(
        (navigator as Navigator & { connection?: { saveData?: boolean } })
          .connection?.saveData,
      ),
  );
  const [loaded, setLoaded] = useState(!paused);
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduce = () => {
      if (media.matches) setPaused(true);
    };
    media.addEventListener("change", reduce);
    return () => media.removeEventListener("change", reduce);
  }, []);
  useEffect(() => {
    const update = () => {
      if (paused || document.hidden) video.current?.pause();
      else void video.current?.play().catch(() => setPaused(true));
    };
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, [paused, loaded]);
  return (
    <>
      <div className="landing-atmosphere" aria-hidden="true">
        <video
          ref={video}
          src={loaded ? "/media/personal-goals.mp4" : undefined}
          poster="/media/personal-goals-poster.jpg"
          muted
          playsInline
          loop
          preload="none"
          tabIndex={-1}
        />
        <div className="atmosphere-wash" />
        <div className="atmosphere-grain" />
      </div>
      <button
        className="landing-motion-toggle"
        onClick={() => {
          setLoaded(true);
          setPaused(!paused);
        }}
        aria-label={paused ? "Play background video" : "Pause background video"}
      >
        {paused ? <Play size={12} /> : <Pause size={12} />}
        <span>{paused ? "Play background" : "Pause background"}</span>
      </button>
    </>
  );
}
