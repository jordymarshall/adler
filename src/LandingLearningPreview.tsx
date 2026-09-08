import { ArrowRight, BookOpen, Briefcase, PenLine } from "lucide-react";
import { Mark } from "./LandingArt";

const scenes = [
  {
    title: "Good intentions. Scattered effort.",
    body: "Each goal gets a fresh start. Then time, energy, and attention run out.",
    label: "01 · Scattered effort",
  },
  {
    title: "Bring your goals into one plan.",
    body: "Choose what fits together, make room for the work, and start with something manageable.",
    label: "02 · A shared plan",
  },
  {
    title: "One change. A real test.",
    body: "Some actions get easier. Others still don’t happen. Your check-in helps explain why.",
    label: "03 · Try it in real life",
  },
  {
    title: "A setback gives us something to learn.",
    body: "Compare what you expected with what happened. Use the context to revisit the next step.",
    label: "04 · Learn and adjust",
  },
  {
    title: "Keep what helps. Adjust what doesn’t.",
    body: "The plan keeps changing as you learn how to make it work in your life.",
    label: "05 · Keep learning",
  },
  {
    title: "Progress isn’t linear. Learning adds up.",
    body: "Step back: the setbacks are still there. So is everything you learned along the way.",
    label: "The whole picture",
  },
];

export function LearningPreview({ stage }: { stage: number }) {
  const scene = scenes[stage];
  return (
    <div className="learning-preview" data-stage={stage}>
      <div className="learning-narration" key={stage}>
        <span className="section-kicker">{scene.label}</span>
        <h2>{scene.title}</h2>
        <p>{scene.body}</p>
      </div>
      <div
        className="learning-goals"
        role="group"
        aria-label="Scattered goals brought into one plan"
      >
        <span className="learning-goal portfolio">
          <PenLine size={15} />
          Publish my portfolio
        </span>
        <span className="learning-goal reading">
          <BookOpen size={15} />
          Read more often
        </span>
        <span className="learning-goal career">
          <Briefcase size={15} />
          Find my next role
        </span>
      </div>
      <div className="learning-chart-card">
        <div className="learning-chart-heading">
          <div>
            <span className="section-kicker">FOLLOW-THROUGH, OVER TIME</span>
            <h3>Progress has its ups and downs.</h3>
          </div>
          <span className="learning-plan-label">
            <Mark />
            One adaptable plan
          </span>
        </div>
        <p className="learning-axis-title">
          Actions completed / actions planned
        </p>
        <div
          className="learning-chart"
          role="img"
          aria-label="Illustrative action completion rates: three scattered goals lose momentum, come together in one plan, then improve through repeated dips and adjustments. This is an example, not measured product results."
        >
          <div className="learning-y-axis" aria-hidden="true">
            <span>100%</span>
            <span>50%</span>
            <span>0%</span>
          </div>
          <div className="learning-chart-viewport">
            <div className="learning-chart-world">
              <svg
                viewBox="0 0 900 250"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M0 10H900M0 125H900M0 240H900"
                  stroke="#e4e8dc"
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                />
                <g className="learning-time-grid" stroke="#e4e8dc" fill="none">
                  {Array.from({ length: 13 }, (_, i) => (
                    <path
                      key={i}
                      d={`M${i * 75} 10V240`}
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                </g>
                <path
                  className="learning-join-guide"
                  d="M300 10V240"
                  stroke="#a3b18b"
                  strokeDasharray="3 5"
                  vectorEffect="non-scaling-stroke"
                />
                <defs>
                  <clipPath id="learning-curve-reveal">
                    <rect
                      className="learning-reveal-mask"
                      x="0"
                      y="-20"
                      width="900"
                      height="300"
                    />
                  </clipPath>
                </defs>
                <g clipPath="url(#learning-curve-reveal)">
                  <path
                    className="learning-fragment-line portfolio"
                    d="M0 94L40 108L75 88L115 139L153 133L195 175L235 159L270 188L300 177"
                  />
                  <path
                    className="learning-fragment-line reading"
                    d="M0 140L35 120L75 158L115 148L155 185L198 177L240 199L270 185L300 177"
                  />
                  <path
                    className="learning-fragment-line career"
                    d="M0 64L38 77L76 115L117 102L155 137L196 151L237 138L273 166L300 177"
                  />
                  <path
                    className="learning-improvement-line"
                    d="M300 177L355 149L398 173L455 124L503 143L565 80L615 102L685 50L742 68L820 22L875 33L900 16"
                  />
                </g>
              </svg>
              <span className="learning-join-dot" aria-hidden="true" />
              <span className="learning-adjustment first">Test one change</span>
              <span className="learning-adjustment second">Revise the hypothesis</span>
              <span className="learning-adjustment third">
                A rhythm that fits
              </span>
              <div className="learning-time-marks" aria-hidden="true">
                <span>Early attempts</span>
                <span>One shared plan</span>
                <span>Try, learn, adjust</span>
                <span>Over time →</span>
              </div>
            </div>
          </div>
        </div>
        <div className="learning-x-axis">
          <span>Scattered effort</span>
          <span>One plan. Keep learning.</span>
          <span>
            Time <ArrowRight size={12} />
          </span>
        </div>
        <div className="learning-loop">
          <Mark />
          <span>Check in</span>
          <ArrowRight />
          <span>Learn</span>
          <ArrowRight />
          <span>Adjust</span>
          <ArrowRight />
          <span>Try again</span>
        </div>
      </div>
      <a className="learning-skip" href="#the-path">
        Continue to how Adler works <ArrowRight size={13} />
      </a>
      <p className="learning-example-note">
        An illustration of learning over time. Your progress will follow its own
        path.
      </p>
    </div>
  );
}
