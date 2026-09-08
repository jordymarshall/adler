import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUp,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  Plus,
  Signal,
  Wifi,
  BatteryFull,
  Pause,
  Play,
} from "lucide-react";
import { Mark } from "./LandingArt";

function Phone({
  label,
  className,
  children,
}: {
  label: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`connection-phone ${className}`}
      role="group"
      aria-label={label}
    >
      <div className="connection-phone-screen">
        <div className="phone-hardware">
          <b>9:41</b>
          <i />
          <span>
            <Signal size={10} />
            <Wifi size={10} />
            <BatteryFull size={13} />
          </span>
        </div>
        {children}
        <span className="phone-home" />
      </div>
    </div>
  );
}
export function ConnectionsPreview() {
  const [phase, setPhase] = useState(0);
  const [paused, setPaused] = useState(false);
  const showcase = useRef<HTMLDivElement>(null);
  const messages = useRef<HTMLDivElement>(null);
  const sent = phase >= 2;
  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    function sync() {
      clearInterval(timer);
      if (!motion.matches && visible && !paused && !document.hidden) timer = setInterval(() => setPhase(previous => (previous + 1) % 4), 4000);
    }
    function motionChanged() { if (motion.matches) setPhase(3); sync(); }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: .25 });
    observer.observe(showcase.current!);
    motion.addEventListener("change", motionChanged);
    document.addEventListener("visibilitychange", sync);
    if (motion.matches && !paused) setPhase(3);
    sync();
    return () => { clearInterval(timer); observer.disconnect(); motion.removeEventListener("change", motionChanged); document.removeEventListener("visibilitychange", sync); };
  }, [paused]);
  useEffect(() => {
    if (messages.current)
      messages.current.scrollTop = messages.current.scrollHeight;
  }, [phase]);
  return (
    <div className="connections-showcase" ref={showcase} data-phase={phase}>
      <div className="connection-universe">
        <div className="connection-orbits" aria-hidden="true">
          <svg viewBox="0 0 700 540" preserveAspectRatio="none">
            <ellipse cx="350" cy="270" rx="325" ry="145" />
            <ellipse
              cx="350"
              cy="270"
              rx="285"
              ry="175"
              transform="rotate(38 350 270)"
            />
            <ellipse
              cx="350"
              cy="270"
              rx="285"
              ry="175"
              transform="rotate(-38 350 270)"
            />
          </svg>
        </div>
        <div
          className="connection-orbit-icons"
          role="group"
          aria-label="Connect Adler to your everyday apps"
        >
          {[
            ["Google Calendar", "google-calendar.png"],
            ["Claude", "claude.svg"],
            ["Apple Calendar", "apple-calendar.png"],
            ["ChatGPT", "chatgpt.svg"],
            ["Messages", "imessage.png"],
            ["Gemini", "gemini.svg"],
          ].map(([name, icon]) => (
            <div className="connection-orbit-icon" key={name}>
              <img src={`/brands/${icon}`} alt="" />
              <span>{name}</span>
            </div>
          ))}
        </div>
        <div className="connection-phones">
          <Phone
            className="claude-phone"
            label="Illustrative Claude conversation connected to Adler"
          >
            <header>
              <img src="/brands/claude.svg" alt="" />
              <b>Claude</b>
              <Plus size={15} />
            </header>
            <p className="phone-date">{phase === 0 ? "Reading your Adler plan…" : "Adler context connected"}</p>
            <p className="phone-user-note">What’s my plan for today?</p>
            <div
              className="claude-answer"
              tabIndex={phase >= 1 ? 0 : -1}
              role="region"
              aria-label="Example Claude reply"
              aria-hidden={phase === 0}
            >
              <img src="/brands/claude.svg" alt="" />
              <p>
                Your next action is to read 20 pages after lunch at home on Tuesday.
              </p>
              <p>
                Quiet lunches seemed helpful in two reports. Office days still need a capacity check; we’re keeping that distinction in the plan.
              </p>
              <span className="phone-record-link">↗ Read 30 books</span>
              <span className="phone-record-link">↗ Your last check-in</span>
            </div>
            <div className="mock-phone-composer">
              Reply to Claude <ArrowUp size={15} />
            </div>
          </Phone>
          <Phone
            className="texting-phone adler-phone"
            label="Illustrative Adler check-in connected to your other apps"
          >
            <header>
              <ChevronLeft size={17} />
              <div>
                <Mark />
                <b>Adler</b>
              </div>
              <span />
            </header>
            <p className="phone-date">YOUR CHECK-IN · TODAY</p>
            <div
              className="phone-messages"
              ref={messages}
              tabIndex={0}
              role="log"
              aria-label="Example Adler check-in"
              aria-live="off"
            >
              <p className="phone-bubble incoming">
                How did the lunch plan go?
              </p>
              <p className="phone-bubble outgoing">
                Lunch works at home, Tuesday and Thursday. Office days are full of meetings.
              </p>
              <p className="phone-delivered">Delivered</p>
              <p className="phone-bubble incoming">
                Keep home-day reading. We’ll check office-day capacity before adding a session.
              </p>
              {sent && (
                <>
                  <p className="phone-bubble outgoing">
                    I’ll try that. Can you also make room in my calendar?
                  </p>
                  <p className="phone-bubble incoming">
                    I found 12:30 on Tuesday. Book 20 minutes for reading? We can review whether the window helped after your next few reports.
                  </p>
                </>
              )}
              {phase === 3 && <><p className="phone-bubble outgoing">Yes, book 12:30.</p><p className="phone-bubble incoming">Booked in your calendar. Your next step is ready.</p></>}
            </div>
            <button
              className="mock-phone-composer"
              onClick={() => { setPaused(true); setPhase(sent ? 0 : 3); }}
              aria-label={
                sent
                  ? "Reset example text check-in"
                  : "Try the example text check-in"
              }
            >
              {sent ? "Replay check-in" : "Try the check-in"}
              <ArrowUp size={15} />
            </button>
          </Phone>
          <Phone
            className="calendar-phone"
            label="Illustrative phone calendar with planned work"
          >
            <header>
              <ChevronLeft size={16} />
              <b>October</b>
              <Plus size={17} />
            </header>
            <div className="phone-calendar-date">
              <small>TUESDAY</small>
              <strong>20</strong>
              <span>Room for your goals.</span>
            </div>
            <div
              className="phone-calendar-day"
              tabIndex={0}
              role="region"
              aria-label="Example calendar schedule"
            >
              <div>
                <time>12 PM</time>
                <span>Lunch</span>
              </div>
              <div className={phase === 3 ? "calendar-focus-block phone-booking-reveal" : "calendar-open-slot"}>
                <time>12:30</time>
                {phase === 3 ? <span>
                  <CalendarDays size={14} />
                  <b>Read 20 pages</b>
                  <small>20 minutes · Added by Adler</small>
                </span> : <span>Available<small>Room for a next step</small></span>}
              </div>
              <div>
                <time>1 PM</time>
                <span>Team catch-up</span>
              </div>
              <div>
                <time>2 PM</time>
                <span>Project work</span>
              </div>
              <div className="calendar-reading-block">
                <time>7 PM</time>
                <span>
                  <b>My portfolio draft</b>
                  <small>25 minutes · After dinner</small>
                </span>
              </div>
            </div>
            <p className="phone-calendar-note">
              {phase === 3 ? "Added after your confirmation." : "Adler finds time around your day."}
            </p>
          </Phone>
        </div>
      </div>
      <div className="phone-demo-playback"><span>{["Your plan, inside Claude", "Same context, wherever you check in", "A next step shaped by your check-in", "Confirmed by you. Added to your calendar."][phase]}</span><button className="phone-playback" onClick={() => setPaused(!paused)} aria-label={`${paused ? "Play" : "Pause"} connected apps animation`}>{paused ? <Play size={12} /> : <Pause size={12} />}{paused ? "Play" : "Pause"}</button></div>
      <div className="connections-caption-list">
        <span>Claude, ChatGPT & compatible AI tools</span>
        <span>Google & Apple Calendar</span>
        <span>iMessage & SMS</span>
      </div>
      <p className="connections-upcoming">
        Apple Health · Shared goals & stakes <span>Coming soon</span>
      </p>
      <p className="demo-footnote">
        Illustrative screens. Connect supported accounts; review calendar
        changes before they’re applied.
      </p>
      <Link className="text-link" to="/integrations">
        Explore connections <ArrowUpRight size={14} />
      </Link>
    </div>
  );
}
