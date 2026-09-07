import { useState, type CSSProperties } from "react";
import { Maximize2, MousePointer2, Pause, Play } from "lucide-react";
import { Modal } from "./components";
import points from "./landing-capture-points.json";

const screens = {
  goals: { title: "Your goals", alt: "Adler’s categorized goals table with activity heatmaps, goal attainment, and projected finish dates." },
  calendar: { title: "Your calendar", alt: "Adler’s full month calendar with goal colours and highlighted plan sessions. Selecting a session shows its full details." },
  progress: { title: "Goal progress", alt: "The Read 30 books goal detail: reported books, projected finish, and a conditional scenario band with error bars extending to the goal horizon. The projection uses pages read per day and an assumed book length." },
  insights: { title: "Insights", alt: "An overview of three personal observations and their planning implications. Open one to follow the observations, behavioural research, experiment, feedback and next question." },
};

export function LandingAppCapture({ screen }: { screen: keyof typeof screens }) {
  const [expanded, setExpanded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [frame, setFrame] = useState<number | null>(null);
  const steps = screen === "progress" ? ["Goal projection", "Inputs & assumptions"] : screen === "insights" ? ["Your insights", "Evidence & test", "Feedback & learning"] : null;
  const { title, alt } = screens[screen];
  const point = points[screen];
  function capture(enlarged = false, detail = false, followup = false) {
    const suffix = enlarged && screen === "insights" ? "-reasoning" : followup ? "-followup" : detail || (enlarged && frame === 1) ? "-detail" : "";
    const hidden = !enlarged && (frame === null ? detail || followup : frame !== (followup ? 2 : detail ? 1 : 0));
    const description = screen === "progress" && (detail || (enlarged && frame === 1))
      ? "The inputs behind Read 30 books: measured pages per day, book-length assumptions, unknown quantities and linked reports."
      : screen === "insights" && followup ? "Reported follow-up, a tentative working insight, and the next question to test."
      : screen === "insights" && detail ? "Reported observations lead to a research-informed hypothesis and a change to test. The behavioural mechanism and source links remain visible."
      : alt;
    return (
      <picture className={enlarged ? "capture-expanded" : followup ? "capture-followup capture-animation" : detail ? "capture-detail capture-animation" : "capture-still"} aria-hidden={hidden || undefined}>
        <source media="(max-width: 650px)" srcSet={`/media/app/${screen}-mobile${suffix}.webp`} width="780" height="2100" />
        <img src={`/media/app/${screen}-desktop${suffix}.webp`} alt={hidden ? "" : enlarged && screen === "insights" ? "The complete reasoning behind a working insight, from reported evidence through the next experiment." : description} width={steps ? 1680 : 2000} height="1800" loading={enlarged ? "eager" : "lazy"} decoding="async" />
      </picture>
    );
  }
  return (
    <figure className="app-capture-preview" data-paused={paused || expanded} data-frame={frame ?? "auto"} data-guided={!!steps} style={{ "--cursor-desktop-x": `${point.desktop.x}%`, "--cursor-desktop-y": `${point.desktop.y}%`, "--cursor-mobile-x": `${point.mobile.x}%`, "--cursor-mobile-y": `${point.mobile.y}%` } as CSSProperties}>
      <button className="app-capture-window" onClick={() => setExpanded(true)} aria-label={`Enlarge ${title} screenshot`}>
        <span className="app-capture-bar">
          <span>Adler <span aria-hidden="true">/</span> {title}</span>
          <Maximize2 size={14} />
        </span>
        <span className="app-capture-frames">
          {capture()}
          {capture(false, true)}
          {screen === "insights" && capture(false, false, true)}
          <MousePointer2 className="capture-cursor capture-animation" size={24} aria-hidden="true" />
          <span className="capture-click capture-animation" aria-hidden="true" />
        </span>
      </button>
      <figcaption>
        <span>Actual app · Example workspace</span>
        <button className="capture-playback" onClick={() => { setPaused(!paused); if (paused) setFrame(null); }} aria-label={`${paused ? "Play" : "Pause"} ${title} animation`}>
          {paused ? <Play size={12} /> : <Pause size={12} />} {paused ? "Play" : "Pause"}
        </button>
        <span>Click to expand ↗</span>
      </figcaption>
      {steps && <div className="capture-steps" role="group" aria-label={`${title} walkthrough frames`}>
        {steps.map((step, index) => <button key={step} aria-pressed={frame === index} onClick={() => { setFrame(index); setPaused(true); }}><span>{index + 1}</span>{step}</button>)}
      </div>}
      {expanded && (
        <Modal title={title} onClose={() => setExpanded(false)} wide>
          {capture(true)}
        </Modal>
      )}
    </figure>
  );
}
