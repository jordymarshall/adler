import { Fragment, useLayoutEffect, useRef, type ReactNode } from "react";
import { ArrowRight, ArrowUp, BookOpen, CalendarDays, Check, ChevronLeft, Clock3, FileText, FlaskConical, MessageCircle, Smartphone, Plus, Signal, Wifi, X } from "lucide-react";
import { Mark } from "./LandingArt";
import { PlanChange, TrialReports } from "./LandingEvidence";
import { portfolioStory as story, portfolioConversation } from "./landing-story";
import progressStory from "./landing-progress.json";

import type { LandingScreen } from "./landing-sequence";

const descriptions: Record<LandingScreen, string> = {
  goals: "Adler turns a portfolio idea into a goal: publish three case studies by November 15, with three milestones and a first action of drafting for 25 minutes at 8:30 on Tuesdays and Thursdays.",
  plan: "Today's two actions: draft case study 1 for 25 minutes at 8:30, and read 20 pages after dinner. Scrolling shows partial work and completion. Scheduled rest days preserve the streak without adding work.",
  barrier: "You report losing a writing session to scrolling on your phone. Adler asks whether you need the phone for work or to be reachable. You confirm it can stay in the kitchen.",
  progress: "One of three case studies published, reported October 11. The shared projection model gives November 5 if the recorded writing pace and early relationship continue. Its wide scenario range includes no further progress and is not a guarantee. The target remains three by November 15. Six work check-ins are shown separately.",
  checkin: "A goal-linked experiment: leave the phone in the kitchen during writing. The user reported scrolling displaced writing and confirmed the phone was not needed. Situation modification may help reduce distraction. Try it for two sessions and review October 19. Agreement is followed by waiting for a report, not a result.",
  review: "October 19 review: on October 13 and 15, you reported keeping the phone in the kitchen and writing for 25 minutes without checking it. Staying focused felt easier. Still one of three case studies published. These two reports do not establish a personal rule.",
  insights: "The updated plan puts the phone in the kitchen during writing. In two reported trials, the user wrote for 25 minutes without checking it. Changing the surroundings may help reduce distraction. This is encouraging early evidence, not a proven personal rule. Review again October 25.",
  imessage: "An iMessage conversation about today’s actions, milestone progress and a calendar booking confirmed by you. Blue bubbles are your messages. Gray bubbles are Adler’s replies. Text and the app use the same goal and plan.",
};

function ScreenHeading({ eyebrow, children }: { eyebrow?: string; children: ReactNode }) {
  return <div className="story-view-heading">{eyebrow && <span className="story-card-label">{eyebrow}</span>}<h3>{children}</h3></div>;
}
function VisualAction({ children, tap = false }: { children: ReactNode; tap?: boolean }) {
  return <div className="story-primary" data-tap={tap}>{children}<ArrowRight size={20} />{tap && <span className="story-tap" />}</div>;
}
function Saved({ children, detail }: { children: ReactNode; detail: string }) {
  return <div className="story-saved"><span className="story-saved-icon"><Check size={21} /></span><span>{children}<small>{detail}</small></span></div>;
}
function Booking() {
  return <div className="story-booking"><span className="story-card-label"><CalendarDays size={16} /> TUE, OCT 20</span><strong>Portfolio session</strong><p>{story.booking.time} · Case study 2</p><span className="story-booking-status"><Check size={15} /> Booked in Google Calendar</span></div>;
}
function GoalBuilder({ phase }: { phase: number }) {
  return phase === 0 ? <>
    <ScreenHeading>New goal</ScreenHeading>
    <div className="story-idea"><span className="story-card-label">YOUR IDEA</span><p>I want to finish my portfolio.</p></div>
      <div className="story-question"><Mark /><strong>What would a finished portfolio include?</strong></div>
      <div className="story-answer">Three case studies live by November 15.</div>
      <div className="story-known"><span className="story-card-label">ALSO FROM YOUR CONVERSATION</span><p>3 projects chosen · 50 min/week<br />Tue & Thu at 8:30</p></div>
      <VisualAction tap>Build my plan</VisualAction>
  </> : <>
    <ScreenHeading eyebrow="YOUR GOAL">Publish 3 case studies.</ScreenHeading>
    <p className="story-goal-target"><CalendarDays size={17} />By Nov 15 <span>Preferred</span></p>
    <div className="story-milestones">
      {[1, 2, 3].map((value, i) => <div className="story-milestone" key={value}>
        <div className="story-milestone-title"><span className="story-number">{value}</span><strong>Publish case study {value}<small>By {["Oct 15", "Nov 1", "Nov 15"][i]}</small></strong></div>
        {value === 1 && <div className="story-milestone-action"><span className="story-card-label">FIRST ACTION</span><strong>Draft case study 1</strong><p>25 min at 8:30 · Tue & Thu</p></div>}
      </div>)}
    </div>
    <p className="story-muted">Later actions set at review.</p>
    {phase === 1 ? <VisualAction tap>Create goal & plan</VisualAction> : <Saved detail="Your first action is ready.">Goal and plan created</Saved>}
  </>;
}
function TodayScreen({ phase }: { phase: number }) {
  const portfolio = phase >= 2 ? "done" : phase === 1 ? "partial" : "empty";
  return <>
    <ScreenHeading eyebrow="THURSDAY, OCTOBER 8">Today</ScreenHeading>
    <p className="story-today-summary">{phase >= 2 ? "1 of 2 actions done" : "2 actions for today"}</p>
    {[
      { goal: "PUBLISH 3 CASE STUDIES", title: "Draft case study 1", time: "25 min · 8:30", icon: FileText, status: portfolio },
      { goal: "READ 30 BOOKS", title: "Read 20 pages", time: "After dinner", icon: BookOpen, status: "empty" },
    ].map((task, index) => <div className={"story-today-card is-" + task.status} key={task.title}>
      <span className="story-card-label"><task.icon size={15} />{task.goal}</span><strong>{task.title}</strong><p className="story-time"><Clock3 size={16} />{task.time}</p>
      <div className="story-report-controls">
        <span className={task.status === "done" ? "is-selected" : ""}><Check size={22} />{index === 0 && phase === 1 && <i className="story-tap" />}</span>
        <span><X size={21} /></span><span><MessageCircle size={21} /></span>
        <small>{task.status === "done" ? "25 min · Done" : task.status === "partial" ? "Partly done" : "Check in"}</small>
      </div>
      {index === 0 && <div className="story-week">
        {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => {
          const status = i > 3 ? "future" : i === 3 ? portfolio : i === 1 ? "done" : "rest";
          return <div key={i}><span>{day}</span><span className={"story-day is-" + status} data-day={i} data-status={status}>{status === "done" ? <Check size={15} /> : status === "partial" ? "·" : status === "rest" ? "–" : ""}</span></div>;
        })}
        <p>Rest days keep your streak.</p>
      </div>}
    </div>)}
    <p className="story-muted story-control-key">✓ Done · × Didn’t happen · Discuss</p>
  </>;
}
function ProgressScreen() {
  const projection = progressStory.projection;
  const start = Date.parse(progressStory.observations[0].date), end = Date.parse(projection.points.at(-1)!.date);
  const x = (date: string) => 25 + (Date.parse(date) - start) / (end - start) * 278;
  const y = (value: number) => 185 - value / progressStory.target * 150;
  const line = (points: { date: string; value: number }[]) => points.map((p, i) => `${i ? "L" : "M"}${x(p.date)} ${y(p.value)}`).join(" ");
  const projected = line(projection.points.map(p => ({ date: p.date, value: p.expected })));
  const range = line(projection.points.map(p => ({ date: p.date, value: p.high }))) + " " + line([...projection.points].reverse().map(p => ({ date: p.date, value: p.low }))).replace("M", "L") + " Z";
  const actual = line(progressStory.observations);
  const finish = new Date(projection.expectedDate + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return <>
    <ScreenHeading eyebrow="AS OF OCT 11 · PORTFOLIO">Progress</ScreenHeading>
    <div className="story-progress-summary"><div className="story-outcome"><strong>1<span> / 3</span></strong><p>published</p></div><div className="story-projected-finish"><span className="story-card-label">PROJECTED FINISH</span><strong>{finish}</strong><small>If this pattern continues</small></div></div>
    <div className="story-chart">
      <svg viewBox="0 0 326 224" aria-hidden="true">
        <defs><linearGradient id="story-progress-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#a6c968" stopOpacity=".75" /><stop offset="1" stopColor="#a6c968" stopOpacity=".18" /></linearGradient></defs>
        {[0, 1, 2, 3].map(value => <g key={value}><path d={`M25 ${y(value)} H310`} stroke="#cfd8c6" strokeWidth="1" /><text x="8" y={y(value)+4}>{value}</text></g>)}
        <path d={`M25 ${y(3)} H310`} stroke="#6c795e" strokeDasharray="3 4" /><text x="305" y="20" textAnchor="end">Goal: 3 by Nov 15</text>
        <path className="story-chart-area" d={`${actual} L${x(progressStory.asOf)} 185 L25 185 Z`} fill="#a6c96866" />
        <path className="story-projection-range" d={range} fill="url(#story-progress-fill)" />
        <path d={actual} fill="none" stroke="#365d36" strokeWidth="3.5" strokeLinecap="round" />
        <path className="story-projection-line" d={projected} fill="none" stroke="#597c43" strokeWidth="2.5" strokeDasharray="5 5" />
        <path d={`M${x(progressStory.asOf)} 26 V185`} stroke="#8e9b7f" strokeDasharray="2 4" />
        {progressStory.observations.map(p => <circle key={p.date} cx={x(p.date)} cy={y(p.value)} r="5" fill="#365d36" />)}
        <circle cx={x(projection.expectedDate)} cy={y(3)} r="5" fill="#fafbf6" stroke="#597c43" strokeWidth="2" />
        <text x="25" y="211">Oct 1</text><text x={x(progressStory.asOf)} y="199" textAnchor="middle">Oct 11</text><text x={x("2026-11-15")} y="211" textAnchor="middle">Nov 15</text>
      </svg>
      <div className="story-chart-key"><span><i />Recorded</span><span><i />Projected</span><span><i />Scenario range</span></div>
    </div>
    <div className="story-input-evidence"><strong>{progressStory.paceMinutesPerWeek} min/week</strong><span>{progressStory.reportedMinutes} min across 6 reports</span></div>
    <p className="story-projection-note">Early estimate from one measured interval. The range includes no further progress.</p>
    <div className="story-next-milestone"><span className="story-card-label">NEXT MILESTONE</span><strong>Publish case study 2</strong><p>By Nov 1</p></div>
  </>;
}
function ExperimentScreen({ phase }: { phase: number }) {
  return <>
    <ScreenHeading eyebrow="PUBLISH 3 CASE STUDIES">{phase === 0 ? "Try a change" : "Your experiment"}</ScreenHeading>
    <div className="story-experiment"><span className="story-card-label"><FlaskConical size={16} />ONE CHANGE</span><strong>Phone in the kitchen.</strong><div className="story-cue-sequence"><span><Smartphone size={20} />Phone away</span><ArrowRight size={16} /><span className="is-changed"><FileText size={20} />Write</span><ArrowRight size={16} /><span><Clock3 size={20} />25 min</span></div><p>Same writing time: 25 minutes</p></div>
    <div className="story-trial-dates"><div><span className="story-card-label">TRY IT</span><strong>Oct 13 & 15</strong><small>2 writing sessions</small></div><div><span className="story-card-label">REVIEW</span><strong>Oct 19</strong><small>Did it help you focus?</small></div></div>
    <div className="story-test-signals"><span className="story-card-label">REPORT AFTER EACH SESSION</span><div><span><span className="story-empty-check" />Phone away · Any checks?</span><span><Clock3 size={17} />Minutes written</span></div></div>
    {phase === 0 ? <VisualAction tap>Try this</VisualAction> : <Saved detail="You agreed · Waiting for your first report">Experiment added</Saved>}
  </>;
}
function ReviewScreen() {
  return <>
    <ScreenHeading eyebrow="PORTFOLIO · OCT 19">Your experiment results</ScreenHeading>
    <div className="story-reviewed-change"><span className="story-card-label">WHAT YOU TRIED</span><strong>Phone in the kitchen.</strong><p>25 min at 8:30 · 2 sessions</p></div>
    <TrialReports />
    <blockquote className="story-feedback">“Staying focused felt easier.”<span>Your report · Oct 19</span></blockquote>
    <div className="story-review-outcome"><strong>1<span> / 3</span></strong><p>case studies published<small>No new publication reported.</small></p></div>
    <p className="story-muted">Encouraging enough to try again.</p>
  </>;
}
function InsightsScreen({ phase }: { phase: number }) {
  return <>
    <ScreenHeading eyebrow="PORTFOLIO · OCT 19">{phase === 0 ? "Your next plan" : "Plan updated"}</ScreenHeading>
    <PlanChange applied={phase === 1} />
    <div className="story-plan-evidence"><Check size={19} /><p>No phone checks in either trial.<small>You reported that staying focused felt easier.</small></p></div>
    <div className="story-learning-status"><FlaskConical size={18} /><span>Keep testing</span><small>Review Oct 25</small></div>
    {phase === 0 ? <VisualAction tap>Use this plan</VisualAction> : <Saved detail="You agreed · Next session Oct 20">Your next action is ready</Saved>}
  </>;
}
function MessageScreen({ phase, barrier = false }: { phase: number; barrier?: boolean }) {
  const thread = useRef<HTMLDivElement>(null);
  const messages = portfolioConversation.filter(message => barrier ? message.phase <= phase : message.phase >= 8 && message.phase <= phase + 9);
  useLayoutEffect(() => { if (thread.current) thread.current.scrollTop = thread.current.scrollHeight; }, [phase, barrier]);
  return <div className="story-message-thread" ref={thread}>
    {messages.map((message, i) => <Fragment key={message.id}>
      {i === 0 && <span className="story-message-date">{barrier ? "October 10" : "October 20"}</span>}
      <div className={"story-message from-" + (message.role === "user" ? "you" : "adler")} data-message={message.id}><p>{message.text}</p></div>
    </Fragment>)}
    {!barrier && phase === 3 && <Booking />}
  </div>;
}

function MovieFrame({ screen, phase }: { screen: LandingScreen; phase: number }) {
  return <div className={"story-phone-frame story-view-" + screen} data-preview={screen} data-phase={phase}>
    {["barrier", "imessage"].includes(screen) ? <div className="story-imessage-header"><ChevronLeft size={25} /><span><span className="story-contact-avatar"><Mark /></span>Adler</span><span /></div> : <div className="story-preview-bar"><span><Mark />adler</span><span className="story-avatar">J</span></div>}
    <div className="story-preview-content">
      {screen === "goals" && <GoalBuilder phase={phase} />}{screen === "plan" && <TodayScreen phase={phase} />}{screen === "progress" && <ProgressScreen />}{screen === "checkin" && <ExperimentScreen phase={phase} />}{screen === "insights" && <InsightsScreen phase={phase} />}{screen === "review" && <ReviewScreen />}{screen === "barrier" && <MessageScreen phase={phase} barrier />}{screen === "imessage" && <MessageScreen phase={phase} />}
    </div>
    {["barrier", "imessage"].includes(screen) && <div className="story-message-composer"><Plus size={24} /><span>iMessage</span><ArrowUp size={22} /></div>}
  </div>;
}

export function LandingAppCapture({ screen, phase }: { screen: LandingScreen; phase: number }) {
  const figure = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const node = figure.current!;
    const resize = () => node.style.setProperty("--phone-scale", String(Math.min(1, node.clientWidth / 390, node.clientHeight / 844)));
    const observer = new ResizeObserver(resize);
    observer.observe(node); resize();
    return () => observer.disconnect();
  }, []);
  return <figure className="story-app-capture" ref={figure}>
    <div className="story-phone" role="img" aria-label={descriptions[screen]}><div className="story-phone-device" aria-hidden="true">
      <div className="story-phone-display">
        <div className="story-status-bar"><span>9:41</span><span><Signal size={16} /><Wifi size={16} /><i className="story-battery" /></span></div>
        <MovieFrame screen={screen} phase={phase} />
      </div>
      <span className="story-phone-camera" /><span className="story-phone-home" />
    </div></div>
  </figure>;
}
