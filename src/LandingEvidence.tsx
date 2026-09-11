import { useState } from "react";
import { ArrowDown, ArrowUpRight, Check, Plus } from "lucide-react";
import { Modal } from "./components";
import { portfolioStory as story } from "./landing-story";

export function PlanChange({ applied }: { applied: boolean }) {
  return <div className="story-plan-change">
    <div className="story-plan-before"><span className="story-card-label">BEFORE THE TEST</span><p>{story.originalAction}</p></div>
    <span className="story-change-arrow" aria-hidden="true"><ArrowDown size={17} /></span>
    <div className="story-plan-after"><span className="story-card-label">{applied ? "YOUR UPDATED PLAN" : "PROPOSED NEXT PLAN"}</span><strong>Phone in the kitchen.<br />Then write.</strong><p>25 min at 8:30 · Tue & Thu</p></div>
  </div>;
}

export function TrialReports() {
  return <div className="story-trial-results"><span className="story-card-label">TWO REPORTED SESSIONS</span>
    {["Oct 13", "Oct 15"].map(date => <div key={date}><span>{date}</span><Check size={16} /><span>Phone stayed away</span><strong>25 min</strong></div>)}
  </div>;
}

export function ReasonButton({ reviewed = false }: { reviewed?: boolean }) {
  const [open, setOpen] = useState(false);
  return <>
    <button className="story-reason-link" onClick={() => setOpen(true)}>Why this change? <Plus size={14} /></button>
    {open && <Modal title="Why this change?" onClose={() => setOpen(false)}>
      <div className="landing-reason-detail">
        <section><h3>Your report</h3><p>{story.observation}</p></section>
        <section><h3>{story.method}</h3><p>{story.science}</p><p>{story.rationale}</p></section>
        <section><h3>{reviewed ? "What happened" : "What we’re testing"}</h3><p>{reviewed ? story.feedback : story.prediction}</p><p>{reviewed ? story.limitation : story.testLimitation}</p></section>
        <section><h3>The research and its limits</h3><p>{story.researchFinding}</p><p>{story.researchGrade}</p><a href={story.researchUrl} target="_blank" rel="noreferrer">{story.researchTitle} <ArrowUpRight size={14} /></a></section>
      </div>
    </Modal>}
  </>;
}
