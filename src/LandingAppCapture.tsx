import { useState } from "react";
import { BookOpen, CalendarDays, Check, Clock3, Maximize2 } from "lucide-react";
import { Mark } from "./LandingArt";
import { Modal } from "./components";

const screens = {
  goals: { title: "Your goals", image: "goals-mobile", alt: "Adler’s actual mobile goals view, with goals and their reported activity and outcomes." },
  plan: { title: "Your plan", image: "plan-mobile", alt: "The earlier reading plan: try 20 pages after lunch, then review whether the window was available." },
  checkin: { title: "Check-in", image: "hero-check-in-mobile", alt: "The later reading check-in: lunch works at home, while meetings still fill office days. Adler keeps the home-day plan and revisits office-day capacity." },
  insights: { title: "Insights", image: "insights-mobile-detail", alt: "The saved learning journey: the original lunch test, two reported attempts, and a revised test for home days. The evidence does not prove timing caused the difference." },
  calendar: { title: "Your calendar", image: "calendar-mobile", alt: "Adler’s actual mobile calendar, showing planned reading alongside work toward other goals." },
  progress: { title: "Goal progress", image: "hero-progress-mobile", alt: "Read 30 books: one reported book finished, with a conditional projection and scenario range based on pages read and assumed book lengths." },
};

export type LandingScreen = keyof typeof screens;

// Concise views of the saved reading example in scripts/landing-workspace.ts.
// Full captures retain the original evidence, history and projection assumptions.
function PhoneScreen({ screen }: { screen: LandingScreen }) {
  return <>
    <span className="story-preview-bar"><Mark /> adler</span>
    <span className="story-preview-content">
      {screen === "goals" && <>
        <BookOpen className="story-preview-icon" />
        <span className="story-preview-kicker">Your goal</span>
        <strong className="story-preview-title">Read 30 books</strong>
        <span className="story-preview-row"><CalendarDays /> By Jan 1, 2028</span>
        <span className="story-preview-status"><Check /> Goal saved</span>
      </>}
      {screen === "plan" && <>
        <span className="story-preview-kicker">Read 30 books · First plan</span>
        <strong className="story-preview-title">Read 20 pages</strong>
        <span className="story-preview-row"><Clock3 /> After lunch</span>
        <span className="story-preview-note">Try this window.<br />Review on Oct 16.</span>
      </>}
      {screen === "checkin" && <>
        <span className="story-preview-kicker">Check-in</span>
        <span className="story-preview-message"><small>You</small>Lunch works at home. Office days are full of meetings.</span>
        <span className="story-preview-reply"><Mark /><span>Keep reading at home. Let’s check time on office days.</span></span>
      </>}
      {screen === "insights" && <>
        <span className="story-preview-kicker">Read 30 books · Updated plan</span>
        <strong className="story-preview-title">Read 20 pages</strong>
        <span className="story-preview-row"><CalendarDays /> Tuesday & Thursday</span>
        <span className="story-preview-row"><Clock3 /> After lunch at home</span>
        <span className="story-preview-note">Check time on office days.</span>
        <span className="story-preview-status">Next test · Review Oct 22</span>
      </>}
      {screen === "calendar" && <>
        <span className="story-preview-kicker">Tuesday, Oct 20</span>
        <strong className="story-preview-title">Your afternoon</strong>
        <span className="story-preview-calendar"><span>12:00</span><span className="story-calendar-space" /><span>12:30</span><span className="story-calendar-block"><BookOpen /><strong>Read 20 pages</strong><small>12:30–12:50 · Planned</small></span><span>13:00</span><span className="story-calendar-space" /></span>
      </>}
      {screen === "progress" && <>
        <span className="story-preview-kicker">Read 30 books</span>
        <strong className="story-preview-total">1 <span>/ 30</span></strong>
        <span className="story-preview-result">books finished</span>
        <span className="story-preview-books" aria-hidden="true">{Array.from({ length: 30 }, (_, i) => <span key={i} className={i === 0 ? "is-finished" : ""} />)}</span>
        <span className="story-preview-status"><Check /> First book finished</span>
        <span className="story-preview-note">Reported Oct 10</span>
      </>}
    </span>
    <span className="story-preview-foot">Reading example</span>
  </>;
}

export function LandingAppCapture({ screen }: { screen: LandingScreen }) {
  const [expanded, setExpanded] = useState<LandingScreen | null>(null);
  const [detail, setDetail] = useState(0);
  const current = screens[expanded ?? screen];
  const frames = expanded === "insights" ? [
    { label: "The learning journey", image: current.image, alt: current.alt },
    { label: "Why this test?", image: "insights-mobile-reasoning", alt: "The saved reasoning behind the reading test, with reported evidence, specific behavioural research, limits and the next review." },
  ] : expanded === "progress" ? [
    { label: "Goal projection", image: current.image, alt: current.alt },
    { label: "Inputs & assumptions", image: "progress-mobile-detail", alt: "The projection’s measured pages, assumed book lengths, unknown quantities and linked reports." },
  ] : [{ label: current.title, image: current.image, alt: current.alt }];
  const frame = frames[detail] ?? frames[0];

  return <figure className="story-app-capture">
    <button className="story-phone" onClick={() => { setDetail(0); setExpanded(screen); }} aria-label={`Open full ${screens[screen].title} screen`}>
      <span className="story-phone-camera" aria-hidden="true" />
      <span className="story-phone-display">
        {(Object.keys(screens) as LandingScreen[]).map(name => <span className="story-phone-frame" key={name} data-preview={name} data-active={name === screen} aria-hidden={name !== screen}><PhoneScreen screen={name} /></span>)}
      </span>
      <span className="story-phone-home" aria-hidden="true" />
    </button>
    <figcaption><Maximize2 size={12} /> Open full app screen</figcaption>
    {expanded && <Modal title={current.title} onClose={() => setExpanded(null)}>
      {frames.length > 1 && <div className="story-capture-details" role="group" aria-label={`${current.title} detail views`}>
        {frames.map((item, index) => <button key={item.label} aria-pressed={detail === index} onClick={() => setDetail(index)}>{item.label}</button>)}
      </div>}
      <img className="story-capture-expanded" src={`/media/app/${frame.image}.webp`} width="780" height="2100" alt={frame.alt} />
    </Modal>}
  </figure>;
}
