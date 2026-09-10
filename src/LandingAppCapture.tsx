import { useState, type ReactNode } from "react";
import { ArrowRight, ArrowUp, BookOpen, CalendarDays, Check, ChevronLeft, Clock3, FileText, Maximize2, Plus, Sparkles } from "lucide-react";
import { Mark } from "./LandingArt";
import { Modal } from "./components";
import { portfolioStory } from "./landing-story";
import { integrations } from "./integration-catalog";

const screens = {
  goals: { title: "Your goals", image: "goals-mobile", alt: "Adler’s All Goals view at the start of the portfolio plan, before any sessions or published case studies have been reported." },
  plan: { title: "Today", image: "plan-mobile", alt: "The actual Today screen: spend 25 minutes drafting the next case study after breakfast, before the later stopping-point suggestion." },
  progress: { title: "Goal progress", image: "hero-progress-mobile", alt: "The actual portfolio view, with reported work and one of three case studies published. Sessions do not establish a finish date." },
  checkin: { title: "Your experiment", image: "portfolio-experiment-mobile", alt: "The saved portfolio experiment: the reported repeated edits, the stopping-point suggestion and the next review, before any result." },
  insights: { title: "Insights", image: "portfolio-learning-mobile", alt: "The portfolio learning journey links the earlier stopping-point suggestion to the next check-in. The result is still pending." },
  imessage: { title: "Your calendar", image: "calendar-mobile", alt: "The actual calendar with the portfolio session on Tuesday at 8:30, alongside other goals." },
  connections: { title: "Connections", image: "connections-mobile", alt: "Adler’s connection catalog distinguishes setup available today from planned chat-app and health connections." },
};
export type LandingScreen = keyof typeof screens;

function ChatMessage({ from = "Adler", children }: { from?: "Adler" | "You"; children: ReactNode }) {
  return <div className={`story-message ${from === "You" ? "from-you" : "from-adler"}`} role="group" aria-label={from}><p>{children}</p></div>;
}

function PhoneScreen({ screen, openReasoning }: { screen: LandingScreen; openReasoning: () => void }) {
  return <>
    {screen === "imessage" ? <div className="story-imessage-header"><ChevronLeft /><span><span className="story-contact-avatar"><Mark /></span>Adler</span></div> : <div className="story-preview-bar"><span><Mark /> adler</span><span className="story-avatar">J</span></div>}
    <div className={`story-preview-content story-view-${screen}`}>
      {screen === "goals" && <>
        <div className="story-view-heading"><span className="story-preview-kicker">A place for what matters</span><strong>Your goals</strong></div>
        <div className="story-goal-focus">
          <span className="story-card-label"><FileText /><span>YOUR FOCUS</span></span>
          <strong>Publish my portfolio</strong>
          <p>3 case studies, ready to share.</p>
          <ol className="story-milestones">{[1, 2, 3].map(i => <li key={i}><span>{i}</span>Publish case study {i}</li>)}</ol>
        </div>
        <div className="story-other-goal"><BookOpen /><span>Read 30 books<small>Make time for reading</small></span></div>
        <div className="story-other-goal"><Sparkles /><span>Find my next role<small>Work that fits my priorities</small></span></div>
      </>}
      {screen === "plan" && <>
        <div className="story-view-heading"><span className="story-preview-kicker">Thursday, October 8</span><strong>Your daily story</strong></div>
        <div className="story-app-tabs" aria-hidden="true"><span className="is-selected">Do</span><span>Progress</span><span>Learn</span></div>
        <div className="story-today-card"><span className="story-card-label">PUBLISH MY PORTFOLIO</span><strong>Spend 25 minutes drafting your next case study after breakfast.</strong><p className="story-time"><Clock3 /> 8:30–8:55 · 25 minutes</p><span className="story-demo-action">Your next step <ArrowRight /></span></div>
        <p className="story-quiet-note">Your next step, already in your plan.</p>
      </>}
      {screen === "progress" && <>
        <div className="story-view-heading"><span className="story-preview-kicker">Publish my portfolio</span><strong>Your work is adding up.</strong></div>
        <div className="story-outcome"><strong>1 <span>/ 3</span></strong><p>case studies published</p><div className="story-outcome-track" aria-hidden="true"><span /><span /><span /></div><span className="story-quiet-note">First case study published · Oct 11</span></div>
        <div className="story-work-summary"><span className="story-card-label">SEPT 21 – OCT 11</span><div className="story-session-grid" role="img" aria-label="Three weeks of activity: two sessions done, two partly done, two reported as not happening, and fifteen days without a scheduled session.">{Array.from({ length: 21 }, (_, i) => <span key={i} className={`is-${({ 1: "missed", 3: "partly", 8: "done", 10: "missed", 15: "done", 17: "partly" } as Record<number, string>)[i] ?? "unscheduled"}`} />)}</div><p>6 session check-ins</p><small>2 done · 2 partly · 2 didn’t happen</small></div>
        <div className="story-next-milestone"><span>Next milestone</span><strong>Publish case study 2 <ArrowRight /></strong></div>
      </>}
      {screen === "checkin" && <>
        <div className="story-view-heading"><span className="story-preview-kicker">Publish my portfolio</span><strong>Your next experiment</strong></div>
        <div className="story-experiment-report"><span className="story-card-label">YOUR CHECK-IN · OCT 10</span><p>“I keep editing the same paragraph.”</p></div>
        <div className="story-experiment"><span className="story-card-label">A CHANGE TO TRY</span><strong>{portfolioStory.suggestion}</strong></div>
        <div className="story-reason"><span>Why this may help</span><p>{portfolioStory.rationale}</p><button onClick={openReasoning}>Why this suggestion? <ArrowRight /></button></div>
        <span className="story-saved"><Check /> Agreed to try · Oct 12</span>
      </>}
      {screen === "insights" && <>
        <div className="story-view-heading"><span className="story-preview-kicker">Publish my portfolio</span><strong>Your learning journey</strong></div>
        <ol className="story-learning-timeline">
          <li><span className="story-card-label">OCT 12 · THE CHANGE YOU’RE TRYING</span><strong>Choose what to finish before you open the draft.</strong></li>
          <li><span className="story-card-label">NEXT CHECK-IN</span><p>{portfolioStory.followUp}</p></li>
        </ol>
        <div className="story-learning-pending"><Clock3 /><span>Waiting for your check-in<small>The next result stays open.</small></span></div>
      </>}
      {screen === "imessage" && <>
        <span className="story-message-date">iMessage · Today 8:00 AM</span>
        <ChatMessage from="You">Book my next portfolio session.</ChatMessage>
        <ChatMessage>Booked for Tuesday, 8:30–8:55.</ChatMessage>
        <div className="story-booking"><span className="story-card-label"><CalendarDays /> TUE, OCT 20</span><strong>Portfolio session</strong><p>8:30–8:55 · Case study 2</p><span className="story-booking-status"><Check /> Booked in Google Calendar</span></div>
        <p className="story-quiet-note">Choose your stopping point before you open the draft.</p>
      </>}
      {screen === "connections" && <>
        <div className="story-view-heading"><span className="story-preview-kicker">Your goals and plan, connected</span><strong>Connections</strong></div>
        <div className="story-connection-group"><span className="story-card-label">CONNECT TODAY</span>
          {[["google-calendar", "Plan around your day"], ["apple-calendar", "Find time for your goals"], ["mcp", "Use Adler in compatible assistants"]].map(([id, benefit]) => {
            const item = integrations.find(item => item.id === id)!;
            return <div className="story-connection" key={id}><img src={`/brands/${item.icon}`} alt="" /><span><strong>{item.name}</strong><small>{benefit}</small></span></div>;
          })}
        </div>
        <div className="story-connection-group story-connections-planned"><span className="story-card-label">PLANNED CONNECTIONS</span><div className="story-connection-apps">
          {["chatgpt", "claude", "gemini", "apple-health"].map(id => {
            const item = integrations.find(item => item.id === id)!;
            return <div key={id}><img src={`/brands/${item.icon}`} alt="" /><span>{item.name}</span></div>;
          })}
        </div><p className="story-quiet-note">More ways to bring your conversations and activity into the plan.</p></div>
      </>}
    </div>
    {screen === "imessage" ? <div className="story-message-composer" aria-hidden="true"><Plus /><span>iMessage</span><ArrowUp /></div> : <div className="story-preview-foot" aria-hidden="true"><span className={screen === "plan" ? "is-selected" : ""}>Today</span><span className={screen === "goals" || screen === "progress" || screen === "checkin" ? "is-selected" : ""}>Goals</span><span className={screen === "insights" ? "is-selected" : ""}>Insights</span><span className={screen === "connections" ? "is-selected" : ""}>Connections</span></div>}
  </>;
}

export function LandingAppCapture({ screen }: { screen: LandingScreen }) {
  const [expanded, setExpanded] = useState<LandingScreen | null>(null);
  const [reasoning, setReasoning] = useState(false);
  const current = screens[expanded ?? screen];
  function open(name: LandingScreen, why = false) { setReasoning(why); setExpanded(name); }
  return <figure className="story-app-capture">
    <div className="story-phone">
      <span className="story-phone-camera" aria-hidden="true" />
      <div className="story-phone-display">
        {(Object.keys(screens) as LandingScreen[]).map(name => <div className="story-phone-frame" key={name} data-preview={name} data-active={name === screen} aria-hidden={name !== screen} inert={name !== screen}><PhoneScreen screen={name} openReasoning={() => open(name, true)} /></div>)}
      </div>
      <span className="story-phone-home" aria-hidden="true" />
    </div>
    <figcaption><span>Illustrative example<span className="story-scroll-hint"> · Scroll inside</span></span><button onClick={() => open(screen)} aria-label={`Open full ${screens[screen].title} screen`}><Maximize2 size={12} /> {screen === "imessage" ? "See calendar" : "See app screen"}</button></figcaption>
    {expanded && <Modal title={current.title} onClose={() => setExpanded(null)}>
      {(expanded === "insights" || expanded === "checkin") && <div className="story-capture-details" role="group" aria-label="Learning detail views"><button aria-pressed={!reasoning} onClick={() => setReasoning(false)}>The learning journey</button><button aria-pressed={reasoning} onClick={() => setReasoning(true)}>Why this test?</button></div>}
      <p className="story-capture-note">{expanded === "connections" ? "The connection catalog shows current availability and planned integrations." : "Actual app view with illustrative data."}{(expanded === "insights" || expanded === "checkin") && " This is the saved test before its review. The result is waiting for your check-in."}{expanded === "imessage" && " The walkthrough sends no messages and makes no calendar changes."}</p>
      <img className="story-capture-expanded" src={`/media/app/${reasoning ? "portfolio-reasoning-mobile" : current.image}.webp`} alt={reasoning ? "The saved stopping-point rationale, original prediction, personal evidence, research claim and its limits. The test has not been reviewed yet." : current.alt} />
    </Modal>}
  </figure>;
}
