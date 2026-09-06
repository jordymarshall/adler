import type { ResearchSearch } from "../shared/planning";
export type GoalArea = "Unassigned" | "Career" | "Learning" | "Personal";
export interface Checkpoint {
  id: string;
  date: string;
  value: number;
  label: string;
}
export interface ProgramVersion {
  version: number;
  date: string;
  focusGoalId: string;
  sprintStart: string;
  sprintEnd: string;
  sprintResult: string;
  weeklyMinutes: number;
  workStart: string;
  workEnd: string;
  workDays: number[];
  sessionMinutes: number;
  reviewDay: string;
  enabledMethods: string[];
  approach: string;
  reason: string;
}
export interface WorkBlock {
  id: string;
  goalId: string;
  action: string;
  start: string;
  end: string;
  provider: "local" | "google" | "apple";
  eventId?: string;
  checkInId?: string;
  status: "Scheduled" | "Done" | "Partly" | "Didn’t happen";
}
export interface BusyInterval {
  start: string;
  end: string;
  provider?: string;
}
export interface DecisionCheck {
  id: string;
  label: string;
  finding: string;
  sources: string[];
}
export interface CoachInsight {
  finding: string;
  status: "Reported" | "To test";
  sourceIds: string[];
  changeIndexes: number[];
}
export interface CoachDecision {
  research?: (Omit<ResearchSearch, "sources"> & { sourceCount: number })[];
  insights?: CoachInsight[];
  id: string;
  date: string;
  goalId: string;
  programVersion: number;
  planVersion: number;
  mode: "live" | "guided";
  checks: DecisionCheck[];
  methods: string[];
  summary: string;
  proposal?: {
    title: string;
    action: string;
    criterion: string;
    timing: string;
    reason: string;
    reviewAfter: string;
  };
  status: "Suggested" | "Accepted" | "Kept plan" | "No change" | "Reviewed";
  review?: { date: string; note: string; choice: "Keep" | "Revisit" };
}
