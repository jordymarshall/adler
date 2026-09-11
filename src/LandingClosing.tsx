import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Mark } from "./LandingArt";

export function LandingClosing() {
  return <section className="landing-closing" id="start-a-goal">
    <div className="landing-closing-copy"><Mark /><h2>Which goal do you<br />want to work on?</h2><Link className="btn dark" to="/app/goals/new">Start with a goal <ArrowUpRight size={17} /></Link><p>Start on the web.</p></div>
    <div className="landing-method-note"><span className="story-card-label">A REASON FOR THE CHANGE</span><p>Adler connects what you report with relevant behavioral research, and keeps the test and its results with your goal.</p><Link to="/method">The method <ArrowUpRight size={15} /></Link></div>
  </section>;
}
