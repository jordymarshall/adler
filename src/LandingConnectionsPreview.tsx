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
  const [sent, setSent] = useState(false);
  const messages = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (messages.current)
      messages.current.scrollTop = messages.current.scrollHeight;
  }, [sent]);
  return (
    <div className="connections-showcase">
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
          <p className="phone-date">Your Adler plan, in the conversation</p>
          <p className="phone-user-note">What’s my plan for today?</p>
          <div className="claude-answer">
            <img src="/brands/claude.svg" alt="" />
            <p>
              You set aside 25 minutes after breakfast for your portfolio draft.
            </p>
            <p>
              Last check-in, you said it was hard to stop editing. Choose one
              finish line before you start.
            </p>
            <span className="phone-record-link">↗ Publish my portfolio</span>
            <span className="phone-record-link">↗ Your last check-in</span>
          </div>
          <div className="mock-phone-composer">
            Reply to Claude <ArrowUp size={15} />
          </div>
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
            <small>THURSDAY</small>
            <strong>15</strong>
            <span>Room for your goals.</span>
          </div>
          <div className="phone-calendar-day">
            <div>
              <time>8 AM</time>
              <span>Breakfast</span>
            </div>
            <div className="calendar-focus-block">
              <time>8:30</time>
              <span>
                <CalendarDays size={14} />
                <b>My portfolio draft</b>
                <small>25 minutes · A finish line I choose</small>
              </span>
            </div>
            <div>
              <time>9 AM</time>
              <span>Team catch-up</span>
            </div>
            <div>
              <time>10 AM</time>
              <span>Project work</span>
            </div>
            <div className="calendar-reading-block">
              <time>7 PM</time>
              <span>
                <b>Read for enjoyment</b>
                <small>15 minutes · After dinner</small>
              </span>
            </div>
          </div>
          <p className="phone-calendar-note">
            Your goals have a place in your day.
          </p>
        </Phone>
        <Phone
          className="texting-phone"
          label="Illustrative text check-in with Adler"
        >
          <header>
            <ChevronLeft size={17} />
            <div>
              <Mark />
              <b>Adler</b>
            </div>
            <span />
          </header>
          <p className="phone-date">iMessage · Today 9:05 AM</p>
          <div className="phone-messages" ref={messages} aria-live="polite">
            <p className="phone-bubble incoming">
              How did your portfolio session go?
            </p>
            <p className="phone-bubble outgoing">
              I started after breakfast, but kept editing the same paragraph.
            </p>
            <p className="phone-delivered">Delivered</p>
            <p className="phone-bubble incoming">
              You made the start happen. Would a smaller stopping point help
              next time?
            </p>
            {sent && (
              <>
                <p className="phone-bubble outgoing">
                  Yes. One paragraph, then leave a note for the next session.
                </p>
                <p className="phone-bubble incoming">
                  Let’s try that and check how it feels after two sessions.
                </p>
              </>
            )}
          </div>
          <button
            className="mock-phone-composer"
            onClick={() => setSent(!sent)}
            aria-label={
              sent
                ? "Reset example text check-in"
                : "Try the example text check-in"
            }
          >
            {sent ? "Replay check-in" : "Try a smaller finish line"}
            <ArrowUp size={15} />
          </button>
        </Phone>
      </div>
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
