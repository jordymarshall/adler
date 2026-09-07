import { initialData, type Goal } from "./store";
export const demoGoal: Goal = {
  id: "demo-portfolio",
  title: "Publish my portfolio with 3 case studies by November 15",
  kind: "project",
  status: "Active",
  area: "Career",
  tags: ["Portfolio", "Creative"],
  priority: "Focus",
  why: "Have work I’m proud to share when the next opportunity comes.",
  success: "My portfolio is live with three finished case studies.",
  target: 3,
  unit: "case studies",
  measure: {
    label: "Published case studies",
    unit: "case studies",
    target: 3,
    baseline: 0,
    aggregation: "cumulative",
  },
  targetDate: "2026-11-15",
  outcomeUpdatedAt: "2026-10-17",
  milestones: [1, 2, 3].map((value) => ({
    id: `case-${value}`,
    title: `Publish case study ${value}`,
    criterion: `Case study ${value} is live on my portfolio.`,
    done: value === 1,
    dueDate: ["2026-10-15", "2026-11-01", "2026-11-15"][value - 1],
  })),
  plans: [
    {
      version: 1,
      date: "2026-10-12",
      action: "Work on the case study I chose",
      criterion:
        "Spend 25 focused minutes on my draft and note where I stopped.",
      timing: "Tuesday & Thursday, after breakfast",
      durationMinutes: 25,
      adaptive: {
        approach: "Use the breakfast cue to start and a small finish line to stop.",
        window: { start: "2026-10-12", end: "2026-10-25", label: "Try a reliable start", rationale: "Two weeks to try the cue and review what happened.", capacityMinutes: 100, capacityStatus: "confirmed" },
        steps: [{ id: "portfolio-session", type: "behavior", title: "Work on the case study I chose", criterion: "Spend 25 focused minutes on my draft and note where I stopped.", reason: "Make starting easier.", durationMinutes: 25, cue: "After breakfast", scheduledDate: "2026-10-13", recurrence: { everyDays: 1, weekdays: [2, 4], until: "2026-10-25" }, dependsOn: [], fallback: "Leave a five-minute note for tomorrow." }],
        assessment: { at: "2026-10-25T18:00:00Z", question: "Did the cue help you start and the stopping point help you finish?", adaptation: "Adjust the cue or session size based on your experience.", feedbackDelayDays: 0, triggers: ["check-in", "window-end"] },
      },
    },
  ],
  checkpoints: [
    { id: "p0", date: "2026-10-01", value: 0, label: "Starting point" },
    { id: "p1", date: "2026-10-15", value: 1, label: "First case study live" },
    { id: "p2", date: "2026-11-01", value: 2, label: "Second case study live" },
    {
      id: "p3",
      date: "2026-11-15",
      value: 3,
      label: "Portfolio ready to share",
    },
  ],
  results: [
    {
      id: "r0",
      date: "2026-10-01",
      value: 0,
      source: "No case studies published yet",
    },
    {
      id: "r1",
      date: "2026-10-11",
      value: 1,
      source: "Published the first case study",
    },
    {
      id: "r2",
      date: "2026-10-17",
      value: 1,
      source:
        "Still one published; I spent both sessions editing the same draft",
    },
  ],
};
export const demoPlanChanges = [
  {
    label: "Starting cue",
    before: "Work on it when I have time",
    after: "Open my draft after breakfast",
    reason:
      "Attach the session to something already in your day. Test whether this makes starting easier.",
  },
  {
    label: "Session",
    before: "Keep polishing until it feels ready",
    after: "25 minutes on the finish line you choose",
    reason:
      "You reported repeatedly editing. A concrete stopping point may help; we’ll check what happens.",
  },
  {
    label: "Smaller option",
    before: "Skip it when the day gets busy",
    after: "5 minutes to leave a note for tomorrow",
    reason:
      "Keep an easy way back into the work, without pretending a smaller session means a published case study.",
  },
];

export const demoExecutionData = initialData();
demoExecutionData.timeZone = "UTC";
demoExecutionData.goals = [demoGoal];
demoExecutionData.actions = ["2026-10-13", "2026-10-15", "2026-10-20", "2026-10-22"].map((date, i) => ({
  id: `demo-session-${i}`, goalId: demoGoal.id, title: demoGoal.plans[0].action, criterion: demoGoal.plans[0].criterion,
  timing: "After breakfast", date, history: [], planVersion: 1, stepId: "portfolio-session", occurrence: `portfolio-session:${date}`,
  ...(i < 2 ? { outcome: "Done" as const, note: "Both sessions happened. Still polishing the same draft." } : {}),
}));
