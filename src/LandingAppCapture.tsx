import { useState, type CSSProperties } from "react";
import { Maximize2, MousePointer2, Pause, Play } from "lucide-react";
import { Modal } from "./components";
import points from "./landing-capture-points.json";

const screens = {
  goals: { title: "Your goals", alt: "Adler’s categorized goals table with activity heatmaps, goal attainment, and projected finish dates." },
  calendar: { title: "Your calendar", alt: "Adler’s full month calendar with goal colours and highlighted plan sessions. Selecting a session shows its full details." },
  progress: { title: "Goal progress", alt: "A goal to read 30 books, with a 100 percent target line and projected goal attainment fan based on measured pages per day and assumed book lengths." },
  insights: { title: "Insights", alt: "Adler’s learning loop: check-in observations, a research-informed hypothesis, a behavioral experiment, observed results, a new insight, and the next hypothesis." },
};

export function LandingAppCapture({ screen }: { screen: keyof typeof screens }) {
  const [expanded, setExpanded] = useState(false);
  const [paused, setPaused] = useState(false);
  const { title, alt } = screens[screen];
  const point = points[screen];
  function capture(enlarged = false, detail = false) {
    const suffix = detail ? "-detail" : "";
    return (
      <picture className={detail ? "capture-detail capture-animation" : "capture-still"} aria-hidden={detail || undefined}>
        <source media="(max-width: 650px)" srcSet={`/media/app/${screen}-mobile${suffix}.webp`} width="780" height="2100" />
        <img src={`/media/app/${screen}-desktop${suffix}.webp`} alt={detail ? "" : alt} width="2000" height="1800" loading={enlarged ? "eager" : "lazy"} decoding="async" />
      </picture>
    );
  }
  return (
    <figure className="app-capture-preview" data-paused={paused || expanded} style={{ "--cursor-desktop-x": `${point.desktop.x}%`, "--cursor-desktop-y": `${point.desktop.y}%`, "--cursor-mobile-x": `${point.mobile.x}%`, "--cursor-mobile-y": `${point.mobile.y}%` } as CSSProperties}>
      <button className="app-capture-window" onClick={() => setExpanded(true)} aria-label={`Enlarge ${title} screenshot`}>
        <span className="app-capture-bar">
          <span>Adler <span aria-hidden="true">/</span> {title}</span>
          <Maximize2 size={14} />
        </span>
        <span className="app-capture-frames">
          {capture()}
          {capture(false, true)}
          <MousePointer2 className="capture-cursor capture-animation" size={24} aria-hidden="true" />
          <span className="capture-click capture-animation" aria-hidden="true" />
        </span>
      </button>
      <figcaption>
        <span>Actual app · Example workspace</span>
        <button className="capture-playback" onClick={() => setPaused(!paused)} aria-label={`${paused ? "Play" : "Pause"} ${title} animation`}>
          {paused ? <Play size={12} /> : <Pause size={12} />} {paused ? "Play" : "Pause"}
        </button>
        <span>Click to expand ↗</span>
      </figcaption>
      {expanded && (
        <Modal title={title} onClose={() => setExpanded(false)} wide>
          {capture(true)}
        </Modal>
      )}
    </figure>
  );
}
