import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type {
  Checkpoint,
  CoachDecision,
  GoalArea,
  ProgramVersion,
  WorkBlock,
} from "./program-types";
import { DEFAULT_METHODS } from "./methods";

export type Outcome = "Done" | "Partly" | "Didn’t happen";
export type GoalStatus = "Active" | "Paused" | "Completed" | "Set aside";
export type GoalKind = "project" | "learning" | "practical";
export interface Plan {
  version: number;
  action: string;
  timing: string;
  criterion: string;
  date: string;
}
export interface Milestone {
  id: string;
  title: string;
  criterion: string;
  done: boolean;
  dueDate?: string;
  completedAt?: string;
}
export interface Goal {
  id: string;
  title: string;
  kind: GoalKind;
  why: string;
  success: string;
  status: GoalStatus;
  area?: GoalArea;
  organizationVersion?: number;
  tags?: string[];
  priority?: "Focus" | "Maintain" | "Later";
  targetDate?: string;
  startDate?: string;
  target?: number;
  unit?: string;
  checkpoints?: Checkpoint[];
  outcomeUpdatedAt?: string;
  checkpointHistory?: {
    date: string;
    checkpoints: Checkpoint[];
    targetDate: string;
    reason: string;
  }[];
  milestones: Milestone[];
  plans: Plan[];
  results: { id: string; value: number; date: string; source: string }[];
  trial?: {
    state: "Suggested" | "Trying" | "Set aside" | "Reviewed";
    version: number;
    sourceId: string;
  };
}
export interface Action {
  id: string;
  goalId: string;
  title: string;
  criterion: string;
  timing: string;
  date: string;
  planVersion: number;
  outcome?: Outcome;
  note?: string;
  unplanned?: boolean;
  history: { outcome?: Outcome; note?: string; at: string }[];
}
export interface Message {
  id: string;
  goalId: string;
  role: "user" | "coach";
  text: string;
  decisionId?: string;
}
export interface Review {
  step: number;
  note: string;
  decision: string;
  completedAt?: string;
}
export interface Data {
  schema: 1;
  goals: Goal[];
  actions: Action[];
  messages: Message[];
  memories: { id: string; text: string; date: string }[];
  review: Review;
  reviewDay: string;
  theme: "light" | "dark";
  goalDraft: Record<string, string>;
  programs: ProgramVersion[];
  workBlocks: WorkBlock[];
  decisions: CoachDecision[];
  modelConsent: boolean;
  calendarSnapshot?: {
    busy: { start: string; end: string }[];
    checkedAt: string;
    provider: string;
    start: string;
    end: string;
  };
}
export const STORAGE_KEY = "adler-preview-v1";
export function localDate(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function formatDate(date: string, options?: Intl.DateTimeFormatOptions) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(
    "en-US",
    options ?? { month: "short", day: "numeric" },
  );
}
export const currentPlan = (goal: Goal) => goal.plans[goal.plans.length - 1];
export function resultLabel(goal: Goal) {
  if (goal.kind === "learning")
    return goal.results.length
      ? `${goal.results.at(-1)!.value} of 10 problems solved correctly`
      : "No assessment recorded yet";
  const done = goal.milestones.filter((m) => m.done).length;
  return goal.kind === "project"
    ? `${done} of ${goal.milestones.length} ${goal.id === "portfolio" ? "case studies published" : "milestones complete"}`
    : `${done} of ${goal.milestones.length} ${goal.milestones[0]?.id.startsWith("document-") ? "documents retrieved in under a minute" : "steps verified"}`;
}
export function initialData(): Data {
  const goals: Goal[] = [
    {
      id: "portfolio",
      title: "Publish 3 portfolio case studies",
      kind: "project",
      why: "Have three examples of my work to include in product design applications.",
      success:
        "Three published case studies, each explaining the problem, my contribution, and the result.",
      status: "Active",
      milestones: [
        {
          id: "case-1",
          title: "Case study one",
          criterion:
            "Published and ready to share, with the problem, my contribution, and the result.",
          done: true,
        },
        {
          id: "case-2",
          title: "Case study two",
          criterion:
            "Published and ready to share, with the problem, my contribution, and the result.",
          done: false,
        },
        {
          id: "case-3",
          title: "Case study three",
          criterion:
            "Published and ready to share, with the problem, my contribution, and the result.",
          done: false,
        },
      ],
      plans: [
        {
          version: 1,
          action: "Draft the problem statement for case study two",
          timing: "After lunch · 25 minutes",
          criterion: "A rough explanation of the problem is on the page.",
          date: localDate(-5),
        },
      ],
      results: [],
      trial: { state: "Suggested", version: 1, sourceId: "portfolio-earlier" },
    },
    {
      id: "statistics",
      title: "Solve 8 of 10 statistics problems correctly",
      kind: "learning",
      why: "Pass the course assessment and explain which method fits each problem.",
      success:
        "Solve and explain at least 8 out of 10 comparable course problems.",
      status: "Active",
      milestones: [
        {
          id: "stats-1",
          title: "Choose the right method",
          criterion: "Explain which method fits three different problem types.",
          done: false,
        },
        {
          id: "stats-2",
          title: "Solve a fresh practice set",
          criterion:
            "Solve and explain 8 out of 10 comparable course problems.",
          done: false,
        },
      ],
      plans: [
        {
          version: 1,
          action: "Work through three practice problems",
          timing: "This evening · 20 minutes",
          criterion:
            "Attempt three problems and check the reasoning against the course notes.",
          date: localDate(-8),
        },
      ],
      results: [
        {
          id: "score-1",
          value: 3,
          date: localDate(-7),
          source: "Example course practice set A",
        },
        {
          id: "score-2",
          value: 5,
          date: localDate(-2),
          source: "Example course practice set B",
        },
      ],
    },
    {
      id: "documents",
      title: "Find each of 5 essential documents in under a minute",
      kind: "practical",
      why: "Find my passport, tax return, lease, insurance, and birth certificate when needed.",
      success:
        "Five important documents are stored together and I can find each one again.",
      status: "Active",
      milestones: [
        {
          id: "document-passport",
          title: "Passport",
          criterion:
            "Find and open the saved passport copy in under one minute, starting outside the folder.",
          done: true,
        },
        {
          id: "document-tax",
          title: "Tax return",
          criterion:
            "Find and open the saved tax return in under one minute, starting outside the folder.",
          done: false,
        },
        {
          id: "document-lease",
          title: "Lease",
          criterion:
            "Find and open the saved lease in under one minute, starting outside the folder.",
          done: false,
        },
        {
          id: "document-insurance",
          title: "Insurance policy",
          criterion:
            "Find and open the saved policy in under one minute, starting outside the folder.",
          done: false,
        },
        {
          id: "document-birth",
          title: "Birth certificate",
          criterion:
            "Find and open the saved certificate in under one minute, starting outside the folder.",
          done: false,
        },
      ],
      plans: [
        {
          version: 1,
          action: "Gather the five documents I need",
          timing: "Unscheduled",
          criterion: "The five important documents are in one place.",
          date: localDate(-2),
        },
      ],
      results: [],
    },
  ];
  return enrichData({
    schema: 1,
    goals,
    actions: [
      ...goals.map((goal) => ({
        id: `${goal.id}-today`,
        goalId: goal.id,
        title: currentPlan(goal).action,
        criterion: currentPlan(goal).criterion,
        timing: currentPlan(goal).timing,
        date: goal.id === "documents" ? "" : localDate(),
        planVersion: 1,
        history: [],
      })),
      {
        id: "portfolio-earlier",
        goalId: "portfolio",
        title: "Draft the opening for case study two",
        criterion: "A rough opening is on the page.",
        timing: "After lunch",
        date: localDate(-2),
        planVersion: 1,
        outcome: "Partly",
        note: "I kept editing the opening paragraph instead of getting the ideas down.",
        history: [],
      },
    ],
    memories: [
      {
        id: "memory-1",
        text: "I prefer to keep evenings free from portfolio work.",
        date: localDate(-5),
      },
    ],
    messages: [],
    review: { step: 0, note: "", decision: "" },
    reviewDay: "Sunday",
    theme: "light",
    goalDraft: {},
    programs: [],
    workBlocks: [],
    decisions: [],
    modelConsent: false,
  });
}
export function enrichData(data: Data): Data {
  const legacy: Record<string, string> = {
    "Store and find 5 essential documents in under a minute":
      "Find each of 5 essential documents in under a minute",
    "Publish my portfolio": "Publish 3 portfolio case studies",
    "Feel confident with statistics":
      "Solve 8 of 10 statistics problems correctly",
    "Get my important files in order":
      "Find each of 5 essential documents in under a minute",
  };
  const meta: Record<string, { area: GoalArea; tags: string[]; days: number }> =
    {
      portfolio: { area: "Career", tags: ["Portfolio", "Writing"], days: 28 },
      statistics: {
        area: "Learning",
        tags: ["Statistics", "Course"],
        days: 21,
      },
      documents: {
        area: "Personal",
        tags: ["Life admin", "Documents"],
        days: 7,
      },
    };
  for (const goal of data.goals) {
    if (legacy[goal.title]) goal.title = legacy[goal.title];
    const sample = meta[goal.id];
    if (!goal.area) goal.area = sample?.area ?? "Personal";
    goal.tags ??= sample?.tags ?? [];
    goal.priority ??= goal.id === "portfolio" ? "Focus" : "Maintain";
    goal.startDate ??= goal.plans[0]?.date ?? localDate();
    goal.target ??= goal.kind === "learning" ? 8 : goal.milestones.length;
    goal.unit ??=
      goal.kind === "learning"
        ? "correct answers / 10"
        : goal.id === "portfolio"
          ? "case studies published"
          : goal.id === "documents" && goal.milestones.length === 5
            ? "documents retrieved in under a minute"
            : "milestones verified";
    if (sample && !goal.targetDate) {
      goal.targetDate = localDate(sample.days);
      goal.checkpoints =
        goal.id === "portfolio"
          ? [
              {
                id: "portfolio-start",
                date: localDate(-14),
                value: 0,
                label: "Start",
              },
              {
                id: "portfolio-checkpoint",
                date: localDate(-1),
                value: 2,
                label: "Two case studies published",
              },
              {
                id: "portfolio-target",
                date: goal.targetDate,
                value: 3,
                label: "Portfolio ready for applications",
              },
            ]
          : goal.id === "statistics"
            ? [
                {
                  id: "stats-start",
                  date: localDate(-8),
                  value: 3,
                  label: "Starting assessment",
                },
                {
                  id: "stats-checkpoint",
                  date: localDate(-2),
                  value: 5,
                  label: "Intermediate practice set",
                },
                {
                  id: "stats-target",
                  date: goal.targetDate,
                  value: 8,
                  label: "Course target",
                },
              ]
            : [
                {
                  id: "files-start",
                  date: localDate(-2),
                  value: 0,
                  label: "Start",
                },
                {
                  id: "files-checkpoint",
                  date: localDate(-1),
                  value: 1,
                  label:
                    goal.milestones.length === 5
                      ? "First document retrieval verified"
                      : "Folder created",
                },
                {
                  id: "files-target",
                  date: goal.targetDate,
                  value: goal.target,
                  label: "All documents retrievable",
                },
              ];
      if (goal.kind !== "learning" && !goal.results.length)
        goal.results.push({
          id: crypto.randomUUID(),
          value: goal.milestones.filter((m) => m.done).length,
          date: localDate(),
          source: "Snapshot of saved milestone records",
        });
      goal.outcomeUpdatedAt = goal.results.at(-1)?.date;
      if (goal.why === "Less searching. A little more peace of mind.")
        goal.why =
          "Find my passport, tax return, lease, insurance, and birth certificate in under a minute each.";
      if (goal.why === "Make space for the next chapter in my career.")
        goal.why =
          "Include three completed projects in product design applications.";
    }
  }
  data.programs ??= [];
  if (!data.programs.length)
    data.programs.push({
      version: 1,
      date: localDate(),
      focusGoalId: data.goals.find((g) => g.status === "Active")?.id ?? "",
      sprintStart: localDate(-6),
      sprintEnd: localDate(7),
      sprintResult: "Finish the second case study draft and request feedback.",
      weeklyMinutes: 180,
      workStart: "09:00",
      workEnd: "17:00",
      workDays: [1, 2, 3, 4, 5],
      sessionMinutes: 25,
      reviewDay: data.reviewDay ?? "Sunday",
      enabledMethods: [...DEFAULT_METHODS],
      approach:
        "Draft before editing. Use short work blocks, then check whether project milestones actually move.",
      reason:
        "Initial program. Review these example settings and edit them for your schedule.",
    });
  data.workBlocks ??= [];
  data.decisions ??= [];
  data.modelConsent ??= false;
  return data;
}
export function currentProgram(data: Data) {
  return data.programs[data.programs.length - 1];
}
export function reviseProgram(
  data: Data,
  expectedVersion: number,
  changes: Partial<Omit<ProgramVersion, "version" | "date">>,
) {
  const current = currentProgram(data);
  if (current.version !== expectedVersion)
    throw new Error(
      "This program changed in another view. Reload the form to use the latest version.",
    );
  const next = {
    ...current,
    ...changes,
    version: current.version + 1,
    date: localDate(),
  };
  data.programs.push(next);
  data.reviewDay = next.reviewDay;
}
function readData(): Data {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.schema === 1) return enrichData(parsed);
    }
  } catch {
    /* A fresh preview remains usable when stored data is unavailable. */
  }
  return initialData();
}
type Store = {
  data: Data;
  commit: (change: (draft: Data) => void, message?: string) => boolean;
  toast: string;
  notify: (message: string) => void;
};
const StoreContext = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(readData);
  const [toast, setToast] = useState("");
  useEffect(() => {
    const handler = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setData(readData());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = data.theme;
  }, [data.theme]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4200);
    return () => clearTimeout(timer);
  }, [toast]);
  function commit(change: (draft: Data) => void, message?: string) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const next: Data = structuredClone(
        enrichData(saved ? JSON.parse(saved) : data),
      );
      change(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setData(next);
      if (message) setToast(message);
      return true;
    } catch (error) {
      setToast(
        error instanceof Error && error.message.startsWith("This ")
          ? error.message
          : "Your changes couldn’t be saved in this browser. Please try again.",
      );
      return false;
    }
  }
  return (
    <StoreContext.Provider value={{ data, commit, toast, notify: setToast }}>
      {children}
    </StoreContext.Provider>
  );
}
export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("Store provider is required");
  return store;
}
export function recordAction(
  data: Data,
  id: string,
  outcome?: Outcome,
  note?: string,
) {
  const action = data.actions.find((a) => a.id === id)!;
  if (!action.date && outcome) {
    action.date = localDate();
    action.unplanned = true;
  }
  action.history.push({
    outcome: action.outcome,
    note: action.note,
    at: new Date().toISOString(),
  });
  action.outcome = outcome;
  if (note !== undefined) action.note = note;
  if (!outcome) action.note = undefined;
  const goal = data.goals.find((g) => g.id === action.goalId)!;
  if (goal.trial?.sourceId === id) goal.trial.state = "Set aside";
}
export function applyPlan(
  data: Data,
  goalId: string,
  expectedVersion: number,
  changes: Pick<Plan, "action" | "timing" | "criterion">,
) {
  const goal = data.goals.find((g) => g.id === goalId)!;
  if (currentPlan(goal).version !== expectedVersion)
    throw new Error(
      "This plan changed in another view. Close this form and review the latest plan.",
    );
  if (goal.status !== "Active")
    throw new Error(
      "This goal is no longer active. Resume it before changing the plan.",
    );
  const plan: Plan = {
    ...changes,
    version: expectedVersion + 1,
    date: localDate(),
  };
  goal.plans.push(plan);
  if (goal.trial?.state === "Suggested") goal.trial.state = "Set aside";
  const future = data.actions.filter(
    (a) => a.goalId === goalId && a.date > localDate() && !a.outcome,
  );
  if (future.length)
    future.forEach((a) => {
      a.title = plan.action;
      a.criterion = plan.criterion;
      a.timing = plan.timing;
      a.planVersion = plan.version;
    });
  else
    data.actions.push({
      id: crypto.randomUUID(),
      goalId,
      title: plan.action,
      criterion: plan.criterion,
      timing: plan.timing,
      date: plan.timing === "Unscheduled" ? "" : localDate(1),
      planVersion: plan.version,
      history: [],
    });
}
