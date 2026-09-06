import type { Goal } from "./store";

export const demoGoal: Goal = {
  id: "demo-running",
  title: "Run 5 km without stopping by November 15",
  kind: "practical",
  status: "Active",
  area: "Personal",
  tags: ["Running", "Fitness"],
  priority: "Focus",
  why: "Join my friends for our local 5 km run.",
  success:
    "Complete the full 5 km route without a walking break and record the distance.",
  target: 5,
  unit: "km",
  measure: { label: "Longest run without stopping", unit: "km", target: 5, baseline: 1 },
  targetDate: "2026-11-15",
  outcomeUpdatedAt: "2026-10-17",
  milestones: [3, 4, 5].map((distance) => ({
    id: `km-${distance}`,
    title: `Run ${distance} km without stopping`,
    criterion: `A recorded ${distance} km run with no walking breaks`,
    done: distance <= 2,
  })),
  plans: [
    {
      version: 1,
      date: "2026-10-12",
      action: "Go for the run I planned",
      criterion: "Record whether I ran and the distance I covered.",
      timing: "Tuesday & Thursday, 6:30 pm · Sunday, 9:00 am",
    },
  ],
  checkpoints: [
    {
      id: "p0",
      date: "2026-10-01",
      value: 1,
      label: "Run 1 km without stopping",
    },
    {
      id: "p1",
      date: "2026-10-08",
      value: 2,
      label: "Run 2 km without stopping",
    },
    {
      id: "p2",
      date: "2026-10-15",
      value: 3,
      label: "Run 3 km without stopping",
    },
    {
      id: "p3",
      date: "2026-11-01",
      value: 4,
      label: "Run 4 km without stopping",
    },
    {
      id: "p4",
      date: "2026-11-15",
      value: 5,
      label: "Complete the 5 km route",
    },
  ],
  results: [
    {
      id: "r0",
      date: "2026-10-01",
      value: 1,
      source: "Recorded a 1 km run without stopping",
    },
    {
      id: "r1",
      date: "2026-10-11",
      value: 2,
      source: "Recorded a 2 km run without stopping",
    },
    {
      id: "r2",
      date: "2026-10-17",
      value: 2,
      source:
        "Confirmed 2 km is still my longest run; both weekday runs were missed",
    },
  ],
};

export const proposedCheckpoints = [
  { date: "2026-10-17", value: 2 },
  { date: "2026-11-01", value: 3 },
  { date: "2026-11-08", value: 4 },
  { date: "2026-11-15", value: 5 },
];
