import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, MessageCircle, MoveUpRight } from "lucide-react";
import { currentLearningVersion, learningActionVersion, learningStanding, learningStatus, type LearningRecord } from "../shared/learning";
import { todayLearning } from "../shared/today";
import { api } from "./api";
import { Modal } from "./components";
import { LearningDashboard, type LearningControl } from "./LearningDashboard";
import { formatDate, useStore } from "./store";

export function TodayLearning({ today }: { today: string }) {
  const { data, flush, refresh } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const records = todayLearning(data, today);
  const record = records.find(record => record.id === selectedId) ?? records[0];
  const index = records.indexOf(record);
  const version = record && currentLearningVersion(record);
  const review = record?.reviews.filter(review => review.version === version?.version).at(-1);
  const status = record && learningStatus(record, today);
  const needsDecision = record && (record.state === "suggested" || !!record.pendingVersion);
  const reviewDate = review?.nextReviewAfter ?? version?.test.reviewAfter;
  const memory = data.memories.at(-1);
  const chat = `/app/check-in?${new URLSearchParams({ goal: record?.goalIds.length === 1 ? record.goalIds[0] : "general", prompt: record && version ? `Let’s discuss learning ${record.id}, test version ${version.version}: “${version.test.change}”. ${["Live experiment", "Ready to review"].includes(status!) ? "I’d like to report whether I tried it and what happened: " : "Help me review where this stands."}` : "Here’s what helped or got in the way of my actions: " })}`;
  async function control(record: LearningRecord, action: LearningControl) {
    setBusy(true);
    setError("");
    try {
      await flush();
      await api("learning", { id: record.id, version: learningActionVersion(record, action), action, requestId: crypto.randomUUID() });
      await refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save this change."); }
    finally { setBusy(false); }
  }
  return <section className="today-card today-learning" id="today-learning" aria-labelledby="today-learning-title">
    <header className="today-card-heading"><h2 id="today-learning-title"><span>03</span> What we’re learning</h2><span className="today-learning-status"><i />{status ?? "OPEN TO DISCOVERY"}</span></header>
    {record && version ? <>
      <div className="today-learning-layout">
        <div className="today-learning-copy"><span className="today-eyebrow">{data.goals.filter(goal => record.goalIds.includes(goal.id)).map(goal => goal.title).join(" · ")}</span><h3>{version.test.change}</h3><p className="today-hypothesis"><span>Working hypothesis</span>{version.hypothesis}</p><div className="today-learning-controls"><button className="today-dark-button" onClick={() => setOpen(true)}>{needsDecision ? "Review suggestion" : "Explore the experiment"}<ArrowUpRight size={16} /></button><Link to={chat}>{status === "Ready to review" ? "Review with Adler" : status === "Live experiment" ? "Share an update" : "Discuss with Adler"}<ArrowRight size={15} /></Link></div></div>
        <div className="today-learning-diagram" role="group" aria-label="The observation and what we are learning">
          <div className="today-learning-observation"><span><MessageCircle size={15} /> WHAT YOU REPORTED</span><p>{version.observation}</p></div>
          <div className="today-learning-join" aria-hidden="true"><MoveUpRight size={25} /></div>
          <div className="today-learning-question"><span>{review ? "LATEST FEEDBACK" : "WHAT WE’RE WATCHING"}</span><p>{review?.summary ?? version.test.behaviorSignal}</p><small>{learningStanding[record.standing]}</small></div>
        </div>
      </div>
      <footer className="today-learning-footer"><span>{record.standing === "reconsider" ? "The evidence changed. Review this explanation before using it." : record.state === "paused" ? "Paused. Resume when this fits your life again." : needsDecision ? record.activeVersion ? "A revision is awaiting your choice. The agreed test is shown." : "A suggestion to consider. Nothing has started yet." : status === "Reviewed" || status === "Finished" ? "A saved finding to revisit. Its evidence and limits stay attached." : reviewDate ? `${status === "Starting soon" ? `Planned from ${formatDate(version.test.start!)} · ` : ""}Review ${formatDate(reviewDate)} · Your experience will inform what comes next.` : "Review when there’s useful feedback."}</span>{records.length > 1 && <div className="today-learning-pager"><button aria-label="Previous learning question" disabled={index === 0} onClick={() => setSelectedId(records[index - 1].id)}><ChevronLeft size={17} /></button><span>{index + 1} / {records.length}</span><button aria-label="Next learning question" disabled={index === records.length - 1} onClick={() => setSelectedId(records[index + 1].id)}><ChevronRight size={17} /></button></div>}</footer>
    </> : <div className="today-learning-layout today-learning-empty">
      <div className="today-learning-copy"><span className="today-eyebrow">{memory ? "STARTING WITH WHAT YOU’VE SHARED" : "NO EXPERIMENT RUNNING"}</span><h3>The next clue<br />comes from you.</h3><p>A useful detail from your day can help Adler understand what fits. No need to run an experiment to check in.</p><Link className="today-dark-button" to={chat}>Share how it went <ArrowUpRight size={16} /></Link></div>
      <div className="today-discovery"><span className="today-discovery-circle" aria-hidden="true" /><span className="today-discovery-circle" aria-hidden="true" /><div><MessageCircle size={25} aria-hidden="true" /><span>{memory ? "YOU TOLD ADLER" : "A PLACE TO START"}</span><p>{memory ? memory.text : "What helped you get started? What got in the way?"}</p>{memory && <small>Saved {formatDate(memory.date)}</small>}</div></div>
    </div>}
    {open && record && <Modal title="Experiment & evidence" onClose={() => setOpen(false)}>{error && <p role="alert">{error}</p>}<LearningDashboard data={data} recordId={record.id} onControl={(record, action) => void control(record, action)} busy={busy} /></Modal>}
  </section>;
}
