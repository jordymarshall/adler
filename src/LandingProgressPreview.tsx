import { ArrowRight } from "lucide-react";

export function ProgressProposalPreview() {
  return (
    <div className="journey-preview progress-proposal-preview">
      <span className="section-kicker">
        OCTOBER 17 · ACTIONS AND NEXT CHECKPOINTS
      </span>
      <h3>Portfolio sessions completed</h3>
      <div className="proposal-metrics">
        <span>
          <b>4 sessions</b> recorded
        </span>
        <span>
          <b>6 sessions</b> planned by Oct 15
        </span>
      </div>
      <div
        className="landing-projection"
        role="img"
        aria-label="Illustrative portfolio plan: four sessions recorded against six planned. The original plan reaches twelve sessions by November 15. A revised scenario follows a slower path, with a shaded range of possible future action completion. The projection and range are examples, not a calculated confidence interval."
      >
        <div className="projection-ticks" aria-hidden="true">
          <span>12</span>
          <span>8</span>
          <span>4</span>
          <span>0</span>
        </div>
        <div className="projection-plot">
          <span className="projection-today">Today</span>
          <svg
            viewBox="0 0 600 220"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0 10H600M0 76H600M0 143H600M0 210H600"
              fill="none"
              stroke="#e0e5d7"
              vectorEffect="non-scaling-stroke"
            />
            <path
              className="projection-range"
              d="M215 143L340 95L470 46L600 10L600 76L470 123L340 143Z"
            />
            <path
              className="projection-plan"
              d="M0 177H90V143H185V110H360V76H470V43H600V10"
            />
            <path
              className="projection-scenario"
              d="M215 143L340 124L470 89L600 43"
            />
            <path className="projection-recorded" d="M0 177H128V143H215" />
            <path
              d="M215 0V220"
              stroke="#8b9c77"
              strokeDasharray="4 6"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <span className="projection-result first" />
          <span className="projection-result latest" />
        </div>
      </div>
      <div className="projection-dates">
        <span>Oct 1</span>
        <span>Nov 15</span>
      </div>
      <div className="projection-legend">
        <span className="recorded">Recorded actions</span>
        <span className="planned">Dated plan</span>
        <span className="scenario">Example projection</span>
        <span className="range">Possible range</span>
      </div>
      <div className="projection-adjustment">
        <h4>Proposed: make the next sessions easier to start.</h4>
        <p>
          Try a shorter session after breakfast, with one paragraph as your
          stopping point. Review what happened before planning the next cycle.
        </p>
        <small>
          Illustrative projection and range. Your four recorded sessions stay
          unchanged.
        </small>
      </div>
      <a className="text-link" href="#step-4">
        See what changes in the plan <ArrowRight size={16} />
      </a>
    </div>
  );
}
