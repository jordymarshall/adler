import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const moments = [
  {
    label: "Tell Adler what happened",
    quote: "I had time after lunch, but forgot to pick up my book.",
    title: "The plan starts with your experience.",
    body: "A missed action needs context. Your check-in helps Adler understand what got in the way.",
  },
  {
    label: "Choose a useful adjustment",
    quote: "Try keeping your book beside your lunch spot.",
    title: "One change, with a reason you can inspect.",
    body: "You reported forgetting to start. Cue-based planning suggests linking a familiar moment to the action; making the book visible is a tentative application to try.",
    source: true,
  },
  {
    label: "Learn what helps you",
    quote: "I noticed the book and read 20 pages on two days.",
    title: "Keep what seems helpful. Keep learning.",
    body: "Adler saves this as early feedback, keeps the helpful cue for now, and checks whether it also works on busier days.",
  },
];
export function FirstCoachingLoop() {
  const [selected, setSelected] = useState(0);
  const moment = moments[selected];
  return (
    <section
      className="first-coaching-loop section-wrap"
      aria-label="A check-in that changes the plan"
    >
      <header>
        <span className="section-kicker">ONE GOAL · READ 30 BOOKS</span>
        <h2>
          A plan is a start.
          <br />
          <em>Learning what works is the difference.</em>
        </h2>
      </header>
      <div className="coaching-loop-example">
        <div
          className="coaching-loop-steps"
          role="group"
          aria-label="Follow a coaching example"
        >
          {moments.map((item, index) => (
            <button
              key={item.label}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
            >
              <span>0{index + 1}</span>
              {item.label}
              <ArrowRight size={17} />
            </button>
          ))}
        </div>
        <div className="coaching-loop-moment" aria-live="polite">
          <small>
            {selected === 1 ? "ADLER’S SUGGESTION" : "YOUR CHECK-IN"}
          </small>
          <blockquote>“{moment.quote}”</blockquote>
          <h3>{moment.title}</h3>
          <p>{moment.body}</p>
          {moment.source && (
            <a
              href="https://doi.org/10.1016/S0065-2601(06)38002-1"
              target="_blank"
              rel="noreferrer"
            >
              Implementation intentions · Gollwitzer & Sheeran ↗
            </a>
          )}
          <small className="coaching-example-note">
            Fictional example. Early feedback suggests a possibility, not a
            proven personal rule.
          </small>
        </div>
      </div>
      <Link className="btn dark" to="/app/goals/new">
        Start with your goal <ArrowRight size={16} />
      </Link>
    </section>
  );
}
