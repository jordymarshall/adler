import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Asterisk, Check, Circle, Clock3, Pause, Play } from "lucide-react";
import { goalStep, todayStep } from "../shared/next-step";
import { actionReady } from "../shared/adaptive-plan";
import { todayActivity } from "../shared/today";
import { formatDate, useStore, type Action } from "./store";
import { GoalOverview } from "./GoalOverview";
import { GoalActionReport } from "./GoalActionReport";
import { Onboarding } from "./Onboarding";
import { TodayProgress } from "./TodayProgress";
import { TodayLearning } from "./TodayLearning";
import "./today.css";

const chapters = ["Do", "Progress", "Learn"];

export function Today() {
  const { data } = useStore();
  const [params, setParams] = useSearchParams();
  const [now, setNow] = useState(() => new Date());
  const [paused, setPaused] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const requestedChapter = Math.max(0, chapters.findIndex(label => label.toLowerCase() === params.get("card")));
  const [chapter, setChapter] = useState(requestedChapter);
  const deck = useRef<HTMLDivElement>(null);
  const currentChapter = useRef(chapter);
  currentChapter.current = chapter;
  const [reportId, setReportId] = useState<string | null>(null);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  useLayoutEffect(() => {
    const element = deck.current;
    if (!element) return;
    const align = () => {
      element.scrollTo({ left: element.clientWidth * currentChapter.current, behavior: "instant" });
    };
    align();
    const observer = new ResizeObserver(align);
    observer.observe(element);
    return () => observer.disconnect();
  }, [data.goals.length > 0]);
  useLayoutEffect(() => {
    if (requestedChapter === currentChapter.current) return;
    currentChapter.current = requestedChapter;
    setChapter(requestedChapter);
    deck.current?.scrollTo({ left: deck.current.clientWidth * requestedChapter, behavior: "instant" });
  }, [requestedChapter]);
  function goTo(index: number) {
    const next = Math.max(0, Math.min(2, index));
    deck.current?.scrollTo({ left: deck.current.clientWidth * next, behavior: paused || matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  const next = todayStep(data, now);
  const activity = todayActivity(data, now);
  const goal = data.goals.find(goal => goal.id === params.get("goal")) ?? next.step?.goal;
  const step = goal ? goalStep(data, goal, now, params.get("action") ?? undefined) : undefined;
  const done = activity.actions.filter(action => action.outcome === "Done").length;
  const report = data.actions.find(action => action.id === reportId);
  function choose(goalId: string, action?: Action) {
    setParams({ goal: goalId, ...(action ? { action: action.id } : {}) }, { preventScrollReset: true });
  }
  if (!data.goals.length) return <Onboarding />;
  return (
    <div className="today-story" data-paused={paused} data-chapter={chapter}>
      <header className="today-deck-heading">
        <div className="today-edition"><Asterisk size={19} aria-hidden="true" /><h1>Your daily story</h1><time className="today-date" dateTime={activity.today}>{formatDate(activity.today, { weekday: "short", month: "short", day: "numeric" })}</time></div>
        <nav className="today-chapters" aria-label="Your daily story">
          {chapters.map((label, index) => <button key={label} aria-label={`Show ${label} card`} aria-current={chapter === index ? "step" : undefined} onClick={() => goTo(index)}><span>0{index + 1}</span>{label}</button>)}
        </nav>
        <button className="today-motion" aria-label={paused ? "Play animations" : "Pause animations"} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? <Play size={15} /> : <Pause size={15} />}<span>Motion {paused ? "off" : "on"}</span></button>
      </header>
      <div className="today-deck" ref={deck} tabIndex={0} role="region" aria-roledescription="carousel" aria-label="Daily story cards" onScroll={event => {
        const element = event.currentTarget;
        if (!element.clientWidth) return;
        const index = Math.max(0, Math.min(2, Math.round(element.scrollLeft / element.clientWidth)));
        if (index === currentChapter.current) return;
        currentChapter.current = index;
        setChapter(index);
        setParams(previous => {
          const updated = new URLSearchParams(previous);
          if (index) updated.set("card", chapters[index].toLowerCase());
          else updated.delete("card");
          return updated;
        }, { replace: true, preventScrollReset: true });
      }} onKeyDown={event => {
        if ((event.target as HTMLElement).closest("input, textarea, select, [contenteditable], dialog")) return;
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          event.currentTarget.focus({ preventScroll: true });
          goTo(chapter + (event.key === "ArrowRight" ? 1 : -1));
        }
      }}>
        <div className="today-slide" role="group" aria-roledescription="slide" aria-label="1 of 3: What you need to do today" aria-hidden={chapter !== 0} inert={chapter !== 0}>
        <section className="today-card today-do" id="today-actions" aria-labelledby="today-actions-title">
          <header className="today-card-heading"><h2 id="today-actions-title"><span>01</span> What you need to do today</h2><ArrowUpRight size={19} aria-hidden="true" /></header>
          <div className="today-action-stage">
            <div className="today-focus">
              {goal ? <>
                <Link className="today-goal-label" to={`/app/goals/${goal.id}`}>{goal.title}<ArrowUpRight size={13} /></Link>
                {step?.action?.date && step.action.date !== activity.today && <p className="today-other-date">{step.action.date < activity.today ? "Earlier work" : "Coming up"} · {formatDate(step.action.date)}</p>}
                <GoalOverview key={`${goal.id}:${step?.action?.id ?? "plan"}`} goal={goal} actionId={step?.action?.id} compact />
                {step?.action && goal.status === "Active" && (!step.action.date || step.action.date <= activity.today) && <button className="today-report-link" onClick={() => setReportId(step.action!.id)}><Check size={15} /> Log what happened</button>}
              </> : <div className="today-rest"><span className="today-eyebrow">ROOM TO BREATHE</span><h3>A little space for what’s next.</h3><p>Your goals are complete or on hold.</p><Link className="button primary" to="/app/goals">Choose a goal <ArrowUpRight size={16} /></Link></div>}
            </div>
            <div className="today-orbit" role="img" aria-label={activity.actions.length ? `${done} of ${activity.actions.length} actions reported done today` : "No actions scheduled today"}>
              <svg viewBox="0 0 160 160" aria-hidden="true"><circle className="today-orbit-track" cx="80" cy="80" r="69" /><circle className="today-orbit-value" cx="80" cy="80" r="69" pathLength="100" strokeDasharray={`${activity.actions.length ? done / activity.actions.length * 100 : 0} 100`} /><g className="today-orbit-flower">{Array.from({ length: 8 }, (_, index) => <ellipse key={index} cx="80" cy="57" rx="12" ry="27" transform={`rotate(${index * 45} 80 80)`} />)}<circle cx="80" cy="80" r="12" /></g></svg>
              <strong>{activity.actions.length ? <>{String(done).padStart(2, "0")}<span> / {String(activity.actions.length).padStart(2, "0")}</span></> : "—"}</strong><small>{activity.actions.length ? "reported done today" : "nothing scheduled"}</small>
            </div>
          </div>

          {activity.actions.length > 0 ? <div className="today-agenda">
            <div className="today-agenda-heading"><span>TODAY’S LINEUP</span><span>{activity.actions.length} {activity.actions.length === 1 ? "action" : "actions"}</span></div>
            <ul>{(expanded ? activity.actions : activity.actions.slice(0, 3)).map(action => {
              const ready = actionReady(data, action);
              const selected = step?.action?.id === action.id;
              return <li key={action.id} data-selected={selected} data-outcome={action.outcome}>
                <button disabled={!action.outcome && !ready} aria-pressed={selected} onClick={() => action.outcome ? setReportId(action.id) : choose(action.goalId, action)}>
                  <span className="today-action-mark">{action.outcome === "Done" ? <Check size={15} /> : action.startedAt ? <Play size={13} /> : <Circle size={13} />}</span>
                  <span className="today-agenda-copy"><strong>{action.title}</strong><small>{data.goals.find(goal => goal.id === action.goalId)?.title}</small></span>
                  <span className="today-action-status">{action.outcome ?? (!ready ? "Waiting on earlier work" : action.startedAt ? "Started" : selected ? "Up next" : "View action")}{action.outcome ? <ArrowUpRight size={13} /> : null}</span>
                </button>
              </li>;
            })}</ul>
            {activity.actions.length > 3 && <button className="today-expand" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>{expanded ? "Show less" : `Show all ${activity.actions.length} actions`} <ArrowDown size={13} /></button>}
          </div> : <p className="today-no-actions"><Clock3 size={15} /> Nothing scheduled for today. Your next step is here when you need it.</p>}
          <div className="today-do-footer">
            <Link to={goal ? `/app/goals/${goal.id}` : "/app/goals"}>Plan & progress <ArrowUpRight size={14} /></Link>
            <details className="today-goal-picker"><summary>Choose something else</summary><div>{data.goals.filter(goal => goal.status === "Active" || goal.status === "Draft").map(goal => <button key={goal.id} onClick={event => { choose(goal.id); event.currentTarget.closest("details")?.removeAttribute("open"); }}>{goal.title}<span>{goal.status === "Draft" ? "Plan" : "View"} ↗</span></button>)}<Link to="/app/goals/new">Start a new goal ↗</Link>{params.has("goal") && <button onClick={() => setParams({})}>Return to Adler’s next step</button>}</div></details>
          </div>
        </section>
        </div>
        <div className="today-slide" role="group" aria-roledescription="slide" aria-label="2 of 3: Your progress" aria-hidden={chapter !== 1} inert={chapter !== 1}><TodayProgress today={activity.today} /></div>
        <div className="today-slide" role="group" aria-roledescription="slide" aria-label="3 of 3: What we’re learning" aria-hidden={chapter !== 2} inert={chapter !== 2}><TodayLearning today={activity.today} /></div>
      </div>
      <footer className="today-deck-nav">
        <button aria-label="Previous card" disabled={chapter === 0} onClick={() => goTo(chapter - 1)}><ArrowLeft size={19} /><span>Back</span></button>
        <span className="today-deck-position" aria-live="polite">0{chapter + 1} <span>/ 03</span><small>Swipe to explore</small></span>
        {chapter < 2 ? <button aria-label="Next card" onClick={() => goTo(chapter + 1)}><span>{chapter === 0 ? "Your progress" : "What we’re learning"}</span><ArrowRight size={19} /></button> : <Link to={next.review ? "/app/check-in?intent=review&prompt=Let’s%20review%20what%20happened%20this%20week%20and%20what%20to%20adjust." : "/app/check-in"}>Check in with Adler <ArrowUpRight size={17} /></Link>}
      </footer>
      {report && <GoalActionReport key={report.id} action={report} outcome={report.outcome ?? "Done"} onClose={() => setReportId(null)} />}
    </div>
  );
}
