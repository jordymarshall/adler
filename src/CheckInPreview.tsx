import { useState } from "react";
import {
  Check,
  ChevronLeft,
  ArrowUp,
  Asterisk,
  Signal,
  Wifi,
  BatteryFull,
  Smartphone,
  LayoutDashboard,
} from "lucide-react";

export function CheckInPreview() {
  const [surface, setSurface] = useState<"text" | "app">("text");
  const [protocol, setProtocol] = useState<"iMessage" | "SMS">("iMessage");
  const [outcome, setOutcome] = useState("Didn’t happen");
  const note =
    outcome === "Done"
      ? "I went for my run. My longest distance without stopping is still 2 km."
      : outcome === "Partly"
        ? "I got outside for a walk but didn’t start the run."
        : "Work ran late again. I missed the run.";
  return (
    <div className="checkin-preview">
      <div
        className="checkin-surface-tabs"
        role="group"
        aria-label="Choose how to check in"
      >
        <button
          aria-pressed={surface === "text"}
          onClick={() => setSurface("text")}
        >
          <Smartphone size={15} />
          Text your coach
        </button>
        <button
          aria-pressed={surface === "app"}
          onClick={() => setSurface("app")}
        >
          <LayoutDashboard size={15} />
          Use the app
        </button>
      </div>
      <div className="checkin-surfaces">
        {surface === "text" ? (
          <div
            className={`text-phone ${protocol === "SMS" ? "sms" : ""}`}
            aria-label={`${protocol} conversation with Adler`}
          >
            <div className="phone-status" aria-hidden="true">
              <b>7:05</b>
              <i />
              <span>
                <Signal size={13} />
                <Wifi size={13} />
                <BatteryFull size={17} />
              </span>
            </div>
            <div className="phone-contact">
              <ChevronLeft size={21} />
              <div>
                <span className="phone-adler">
                  <Asterisk size={23} />
                </span>
                <b>
                  Adler <span>›</span>
                </b>
              </div>
              <span />
            </div>
            <div className="phone-messages">
              <span className="phone-timestamp">
                {protocol} · Today 7:05 PM
              </span>
              <div className="phone-bubble incoming">
                How did your 6:30 run go?
              </div>
              <div className="phone-bubble outgoing" key={outcome}>
                {note}
              </div>
              <span className="phone-delivered">Delivered</span>
              <div className="phone-bubble incoming">
                {outcome === "Done"
                  ? "Logged your run as done. Your longest continuous run stays at 2 km."
                  : outcome === "Partly"
                    ? "Logged the session as partly done, with your note about walking. Your longest continuous run stays at 2 km."
                    : "Logged the missed run and what got in the way. Want to look at another time for your weekday runs?"}
              </div>
              <div className="phone-saved">
                <Check size={12} />
                Check-in saved to My first 5 km
              </div>
            </div>
            <div className="phone-compose" aria-hidden="true">
              <span>＋</span>
              <div>
                {protocol}
                <ArrowUp size={16} />
              </div>
            </div>
            <div className="phone-home" aria-hidden="true" />
          </div>
        ) : (
          <div className="text-phone app-phone" aria-label="Adler mobile app check-in">
            <div className="phone-status" aria-hidden="true"><b>7:05</b><i /><span><Signal size={13} /><Wifi size={13} /><BatteryFull size={17} /></span></div>
            <div className="phone-app-title"><Asterisk size={22} /><b>Adler</b><span>Today</span></div>
          <div className="app-checkin-preview">
            <span className="section-kicker">MY FIRST 5 KM · THURSDAY</span>
            <h3>How did your run go?</h3>
            <p>Planned: go for a run at 6:30 pm.</p>
            <div className="demo-record">
              <span>
                {outcome === "Done" ? "WHAT YOU DID" : "WHAT GOT IN THE WAY"}
              </span>
              <p>{note}</p>
            </div>
            <div className="app-checkin-saved">
              <Check size={15} />
              Saved: {outcome}
            </div>
          </div>
            <nav className="phone-app-nav" aria-label="App preview"><b>Today</b><span>Goals</span><span>Calendar</span></nav>
            <div className="phone-home" aria-hidden="true" />
          </div>
        )}
        <div className="checkin-linked-result">
          <Check size={14} />
          <div><b>{outcome} · Saved to My first 5 km</b><span>2 km recorded · 5 km goal</span></div>
        </div>
      </div>
      <div className="checkin-demo-controls">
        <div>
          <span>Try a different check-in</span>
          <div className="demo-outcomes">
            {["Done", "Partly", "Didn’t happen"].map((value) => (
              <button
                key={value}
                aria-pressed={outcome === value}
                onClick={() => setOutcome(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        {surface === "text" && (
          <div
            className="phone-protocol"
            role="group"
            aria-label="Text message format"
          >
            {(["iMessage", "SMS"] as const).map((value) => (
              <button
                key={value}
                aria-pressed={protocol === value}
                onClick={() => setProtocol(value)}
              >
                {value}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
