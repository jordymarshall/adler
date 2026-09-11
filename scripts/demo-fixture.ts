// The fictional casey-example account fixture shared by scripts/app-api-examples.ts
// (generates docs/ios-api-examples/*.json from a temp-directory runtime) and
// scripts/seed-demo-account.ts (seeds the same account into a real dev data directory)
// so the two scripts cannot drift. Nothing here describes a real customer: the account,
// goals, reports and coaching records are all invented — never present this content as
// customer proof.
//
// All dates are computed relative to whenever buildDemoFixture() runs, so a fresh seed
// always shows live Today/Progress/Learn states: an action due today, a learning record
// mid-trial ("Live experiment") with its next review a few days out, a second learning
// record already "Ready to review", a pending proposal, an unplanned Draft goal, a
// completed milestone, a measured goal with results and checkpoints, and a paused goal.
import { createGoal } from "../shared/validation.ts";
import { maintainAdaptivePlans, stepDates, type AdaptivePlan } from "../shared/adaptive-plan.ts";
import { addDays, dateInZone } from "../shared/journey.ts";
import { weekStart } from "../shared/goal-execution.ts";
import { RESEARCH_CLAIMS } from "../shared/research-claims.ts";
import type { BehavioralReasoning } from "../shared/behavioral-reasoning.ts";
import { evidenceRevision } from "../server/learning.ts";
import type { LearningRecord } from "../shared/learning.ts";
import type { CoachDecision } from "../src/program-types.ts";
import type { Data, Outcome } from "../shared/workspace.ts";
import type { Change } from "../server/commands.ts";
import type { Service } from "../server/service.ts";
import type { Database } from "../server/database.ts";

export const DEMO_USERNAME = "casey-example";
export const DEMO_TIME_ZONE = "America/Toronto";

const claim = RESEARCH_CLAIMS.find((item) => item.id === "claim:implementation-if-then")!;
const source = {
  id: "curated:implementation-if-then",
  title: claim.source.title,
  authors: claim.source.authors,
  year: claim.source.year,
  url: claim.source.url,
  summary: claim.source.summary,
  kind: claim.source.kind,
  access: claim.source.access,
  retrievedAt: claim.source.retrievedAt,
};
const reasoning: BehavioralReasoning = {
  grounding: [
    {
      claimId: claim.id,
      version: claim.version,
      relation: "motivates",
      application:
        "Attaching the drafting session to the end of breakfast gives it a familiar moment to start from. Whether that helps this person is still being tested.",
    },
  ],
  principleIds: ["P2"],
  goalRoute: "session",
  ruleExceptions: ["Use a short drafting trial rather than a daily automaticity target."],
  barrier: {
    domain: "opportunity",
    status: "reported",
    explanation: "You reported that the writing hour disappears once the workday starts.",
    sourceIds: ["memory-morning"],
    },
  methodId: "implementation",
  researchSourceIds: [source.id],
  mechanism: "A specific cue can connect the intention to a concrete start.",
  fit: "You described a quiet window right after breakfast on Tuesdays and Thursdays.",
  prediction: "You report starting the session on more of the planned days.",
  reviewRule: "Keep the cue if sessions start; otherwise ask what blocked the start before adding work.",
  limitation: "A cue cannot create time that is already taken by something else.",
};

// A second, distinct research-grounded reasoning for the guide goal's own learning
// record below, so the demo account shows two independent trials rather than repeating
// the portfolio's implementation-intentions story.
const monitoringClaim = RESEARCH_CLAIMS.find((item) => item.id === "claim:monitoring-attainment")!;
const monitoringSource = {
  id: monitoringClaim.source.id,
  title: monitoringClaim.source.title,
  authors: monitoringClaim.source.authors,
  year: monitoringClaim.source.year,
  url: monitoringClaim.source.url,
  summary: monitoringClaim.source.summary,
  kind: monitoringClaim.source.kind,
  access: monitoringClaim.source.access,
  retrievedAt: monitoringClaim.source.retrievedAt,
};
const monitoringReasoning: BehavioralReasoning = {
  grounding: [
    {
      claimId: monitoringClaim.id,
      version: monitoringClaim.version,
      relation: "motivates",
      application:
        "Comparing the actual word count with the week's checkpoint, rather than waiting for the deadline, gives a concrete point to notice and correct a slipping pace.",
    },
  ],
  principleIds: ["P1"],
  goalRoute: "structural",
  ruleExceptions: [],
  barrier: {
    domain: "uncertain",
    status: "unknown",
    explanation: "It is not yet known whether a weekly check changes anything here, only that the pace has not been checked against the plan before.",
    sourceIds: [],
  },
  methodId: "monitoring",
  researchSourceIds: [monitoringSource.id],
  mechanism: "Comparing a recorded count with a dated checkpoint turns a vague sense of progress into a specific gap to close or confirm.",
  fit: "The guide already has a numeric target and dated checkpoints, so a weekly comparison uses records you already keep.",
  prediction: "You report checking the word count against the checkpoint most Fridays and can name whether it is ahead, on or behind.",
  reviewRule: "Keep the weekly check if it gets used; drop it if it becomes another unread report.",
  limitation: "Checking the pace does not by itself produce more words.",
};

function draftingPlan(monday: string): AdaptivePlan {
  return {
    projectionUnavailableReason:
      "Drafted sections and a published case study are tracked separately. There is no established conversion from sections drafted to a publication date.",
    reasoning,
    approach: "Test whether a fixed after-breakfast cue makes the drafting session start.",
    window: {
      start: monday,
      end: addDays(monday, 13),
      label: "Two-week drafting trial",
      rationale: "Two weeks give enough attempts to see whether the cue helps, without committing a month.",
      capacityMinutes: 240,
      capacityStatus: "confirmed",
    },
    steps: [
      {
        id: "draft-section",
        type: "behavior",
        title: "Draft one case-study section",
        criterion: "One section of the current case study is written end to end.",
        reason: "A section is small enough to finish in the available window.",
        durationMinutes: 25,
        cue: "Right after breakfast",
        scheduledDate: monday,
        recurrence: { everyDays: 1, weekdays: [2, 4], until: addDays(monday, 13) },
        dependsOn: [],
        milestoneId: "case-study-1",
        measure: { id: "sections", label: "Sections drafted", unit: "sections", target: 1 },
        fallback: "Write the section heading and one paragraph if time is short.",
        contextIds: ["memory-morning"],
      },
    ],
    experiment: {
      hypothesis: "A fixed after-breakfast cue may make the drafting session start on planned days.",
      inputStepIds: ["draft-section"],
      outcomeSignal: "Whether a section is drafted on the planned days.",
      comparison: "Compared with the interrupted mornings you described before this trial.",
      comparisonStatus: "reported",
      comparisonSourceIds: ["memory-morning"],
      decisionRule: "If sessions still do not start, inspect the obstacle before changing the commitment.",
      alternativeExplanations: ["A quieter fortnight at work could explain the same change."],
    },
    assessment: {
      at: `${addDays(monday, 13)}T20:00:00.000Z`,
      question: "Did the after-breakfast cue make the drafting session start?",
      adaptation: "Inspect what blocked the start before increasing the commitment.",
      feedbackDelayDays: 0,
      triggers: ["check-in", "window-end"],
    },
  };
}
function guidePlan(today: string, monday: string): AdaptivePlan {
  // Recurring weekdays are Monday/Wednesday/Friday, plus today's own weekday so a fresh
  // seed always has a guide session due today regardless of which day it runs on
  // (portfolio's Tuesday/Thursday cue stays untouched since its narrative names those
  // exact days). A no-op when today already falls on Mon/Wed/Fri.
  const todayWeekday = new Date(`${today}T12:00:00Z`).getUTCDay();
  const weekdays = Array.from(new Set([1, 3, 5, todayWeekday])).sort();
  return {
    approach: "Write in short weekday sessions and record the words written.",
    window: {
      start: monday,
      end: addDays(monday, 13),
      label: "Two-week writing block",
      rationale: "A fortnight of weekday sessions gives a measurable input pace to review.",
      capacityMinutes: 400,
      capacityStatus: "provisional",
    },
    steps: [
      {
        id: "write-words",
        type: "behavior",
        title: "Write 400 words of the guide",
        criterion: "400 words are saved in the guide document.",
        reason: "A word count is an input you control and can report exactly.",
        durationMinutes: 20,
        cue: "Before the first meeting",
        scheduledDate: monday,
        recurrence: { everyDays: 1, weekdays, until: addDays(monday, 13) },
        dependsOn: [],
        measure: { id: "words", label: "Words written", unit: "words", target: 400 },
        contextIds: [],
      },
    ],
    projection: {
      kind: "direct",
      driverStepId: "write-words",
      inputMetric: "amount",
      outcomeUnit: "words",
      observationStart: monday,
      horizonDays: 120,
      feedbackDelayDays: 0,
      inputPerOutcome: { low: 1, expected: 1, high: 1.25 },
      rationale:
        "Words written are the same unit as the goal, so the saved conversion is one to one, allowing for words that get cut in editing.",
    },
    assessment: {
      at: `${addDays(monday, 13)}T20:00:00.000Z`,
      question: "Is the weekday writing pace sustainable?",
      adaptation: "Reduce the session target before dropping the cadence.",
      feedbackDelayDays: 0,
      triggers: ["check-in", "result", "window-end"],
    },
  };
}

export function buildDemoFixture(data: Data): Data {
  const today = dateInZone(DEMO_TIME_ZONE);
  const monday = weekStart(addDays(today, -7));

  // Fictional reports across the trial window: a real record has gaps and partial days.
  const drafted: (Outcome | undefined)[] = ["Done", "Didn’t happen", "Done", "Done"];
  const written: { outcome: Outcome; amount: number; minutes: number }[] = [
    { outcome: "Done", amount: 520, minutes: 24 },
    { outcome: "Partly", amount: 180, minutes: 12 },
    { outcome: "Done", amount: 430, minutes: 20 },
    { outcome: "Done", amount: 610, minutes: 27 },
    { outcome: "Didn’t happen", amount: 0, minutes: 0 },
  ];

  data.timeZone = DEMO_TIME_ZONE;
  data.programs.at(-1)!.weeklyMinutes = 360;
  data.programs.at(-1)!.workDays = [1, 2, 3, 4, 5];
  data.memories.push(
    {
      id: "memory-morning",
      date: addDays(today, -20),
      text: "The writing hour disappears once the workday starts; breakfast is the quiet part of the morning.",
    },
    {
      id: "memory-editor",
      date: addDays(today, -9),
      text: "My editor reviews drafts on Fridays, so a section needs to be ready by Thursday evening.",
    },
  );
  createGoal(
    data,
    {
      title: "Publish three case studies",
      kind: "project",
      why: "Show how I work so the right people can find me.",
      success: "Three case studies are published with the problem, my contribution and the result.",
      area: "Career",
      tags: ["Writing", "Portfolio"],
      targetDate: addDays(today, 60),
      milestones: [
        { id: "case-study-1", title: "First case study published", criterion: "A published URL with the result." },
        { id: "case-study-2", title: "Second case study published", criterion: "A published URL with the result." },
        { id: "case-study-3", title: "Third case study published", criterion: "A published URL with the result." },
      ],
      assessmentTarget: 8,
      baseline: null,
      action: "Draft one case-study section",
      criterion: "One section of the current case study is written end to end.",
      timing: "Right after breakfast",
      adaptive: draftingPlan(monday),
    },
    monday,
    "portfolio",
  );
  createGoal(
    data,
    {
      title: "Write the onboarding guide",
      kind: "practical",
      why: "New teammates keep asking the same questions.",
      success: "A 20,000-word onboarding guide is finished and shared.",
      area: "Career",
      tags: ["Writing"],
      targetDate: addDays(today, 120),
      milestones: [],
      measure: {
        label: "Words written",
        unit: "words",
        target: 20000,
        baseline: 1200,
        aggregation: "cumulative",
      },
      baselineDate: addDays(today, -21),
      assessmentTarget: 8,
      baseline: null,
      action: "Write 400 words of the guide",
      criterion: "400 words are saved in the guide document.",
      timing: "Before the first meeting",
      adaptive: guidePlan(today, monday),
    },
    monday,
    "guide",
  );
  createGoal(
    data,
    {
      title: "Run a 10k without stopping",
      kind: "practical",
      why: "I want an evening that is not spent at a desk.",
      success: "Finish a 10k run without walking.",
      area: "Personal",
      tags: ["Health"],
      targetDate: "",
      deadline: "none",
      status: "Draft",
      milestones: [],
      assessmentTarget: 8,
      baseline: null,
      action: "",
      criterion: "",
      timing: "",
    },
    today,
    "running",
  );
  createGoal(
    data,
    {
      title: "Read the four books on my shelf",
      kind: "practical",
      why: "I keep buying books and not reading them.",
      success: "All four books are finished, with one idea kept from each.",
      area: "Personal",
      tags: ["Reading"],
      targetDate: addDays(today, 90),
      status: "Draft",
      milestones: [
        { id: "book-1", title: "Finish the first book", criterion: "The last page is read and one idea is written down." },
      ],
      assessmentTarget: 8,
      baseline: null,
      action: "Read 20 pages",
      criterion: "Twenty pages are read.",
      timing: "After dinner",
    },
    today,
    "reading",
  );
  // A paused goal with a completed milestone: cooked the first recipe, then paused the
  // whole effort to protect time for the case-study drafting trial above.
  createGoal(
    data,
    {
      title: "Cook one new recipe a week",
      kind: "practical",
      why: "I want more variety on weeknights.",
      success: "A new recipe is cooked and reviewed each week for eight weeks.",
      area: "Personal",
      tags: ["Cooking"],
      targetDate: addDays(today, 56),
      milestones: [
        { id: "recipe-1", title: "First new recipe cooked", criterion: "A recipe is cooked and a rating is noted." },
      ],
      assessmentTarget: 8,
      baseline: null,
      action: "Cook a new recipe",
      criterion: "One new recipe is cooked and rated.",
      timing: "Sunday afternoon",
    },
    addDays(today, -25),
    "cooking",
  );

  // Materialize every occurrence in the saved window, including the ones already past,
  // so the example shows a real reporting history rather than only future work.
  for (const goal of data.goals) {
    const plan = goal.plans.at(-1)!.adaptive;
    if (!plan) continue;
    for (const step of plan.steps)
      for (const date of stepDates(plan, step))
        if (!data.actions.some((action) => action.occurrence === `${step.id}:${date}`))
          data.actions.push({
            id: `${step.id}-${date}`,
            goalId: goal.id,
            title: step.title,
            criterion: step.criterion,
            timing: step.cue,
            date,
            planVersion: goal.plans.at(-1)!.version,
            stepId: step.id,
            occurrence: `${step.id}:${date}`,
            history: [],
          });
  }
  const past = (goalId: string) =>
    data.actions.filter((action) => action.goalId === goalId && action.date < today).sort((a, b) => a.date.localeCompare(b.date));
  past("portfolio").forEach((action, index) => {
    const outcome = drafted[index];
    if (!outcome) return;
    action.outcome = outcome;
    action.amount = outcome === "Done" ? 1 : 0;
    action.actualMinutes = outcome === "Done" ? 25 : 0;
    action.history = [{ at: `${action.date}T13:05:00.000Z` }];
    if (outcome === "Didn’t happen") action.note = "The stand-up moved to 8:30 that day.";
  });
  past("guide").forEach((action, index) => {
    const report = written[index];
    if (!report) return;
    Object.assign(action, {
      outcome: report.outcome,
      amount: report.amount,
      actualMinutes: report.minutes,
      history: [{ at: `${action.date}T14:00:00.000Z` }],
    });
  });
  data.goals
    .find((goal) => goal.id === "guide")!
    .results.push({
      id: "result-words-1",
      date: addDays(today, -7),
      value: 2330,
      source: "Word count from the guide document.",
    });
  data.goals.find((goal) => goal.id === "guide")!.outcomeUpdatedAt = addDays(today, -7);
  // Dated checkpoints alongside the recorded result, so Progress can chart actual vs plan.
  data.goals.find((goal) => goal.id === "guide")!.checkpoints = [
    { id: "checkpoint-2weeks", date: addDays(today, -7), value: 2000, label: "Two-week pace check" },
    { id: "checkpoint-6weeks", date: addDays(today, 30), value: 8000, label: "Six-week pace check" },
    { id: "checkpoint-target", date: addDays(today, 120), value: 20000, label: "Guide finished" },
  ];
  // Cooked the first recipe, then paused the goal.
  const cooking = data.goals.find((goal) => goal.id === "cooking")!;
  cooking.milestones[0].done = true;
  cooking.milestones[0].completedAt = addDays(today, -18);
  cooking.status = "Paused";

  const decision: CoachDecision = {
    id: "decision-portfolio-cue",
    date: monday,
    goalId: "portfolio",
    programVersion: data.programs.at(-1)!.version,
    planVersion: 1,
    mode: "live",
    status: "Accepted",
    summary:
      "You reported losing the writing hour once the workday starts. We attached the drafting session to the end of breakfast and will review after two weeks.",
    methods: ["implementation"],
    checks: [
      {
        id: "capacity",
        label: "Schedule & capacity",
        finding: "360 minutes are budgeted per week; the trial commits 100 minutes.",
        sources: [`program-v${data.programs.at(-1)!.version}`],
      },
    ],
    frameworkVersion: "input-outcome-learning-v2",
    researchClaims: [claim],
    researchSources: [source],
    recommendations: [
      {
        action: "Draft one case-study section right after breakfast on Tuesdays and Thursdays.",
        observation: "You reported that the writing hour disappears once the workday starts.",
        interpretation:
          "Cue-based action planning links a familiar moment to a specific action, which can make starting less dependent on finding time later.",
        expectedEffect: "More of the planned drafting sessions start.",
        goalIds: ["portfolio"],
        sourceIds: ["memory-morning"],
        changeIndexes: [0],
        reasoning,
      },
    ],
  };
  const observed: CoachDecision = {
    id: "decision-editor-friday",
    date: addDays(today, -9),
    goalId: "portfolio",
    programVersion: data.programs.at(-1)!.version,
    planVersion: 1,
    mode: "live",
    status: "Reviewed",
    summary:
      "You mentioned your editor's Friday review. Kept as context for the next milestone date; nothing is being tested.",
    methods: [],
    checks: [],
    insights: [
      {
        finding: "You reported that your editor reviews drafts on Fridays.",
        status: "Reported",
        sourceIds: ["memory-editor"],
        changeIndexes: [],
      },
      {
        finding: "A Thursday-evening buffer may be what protects the Friday review.",
        status: "To test",
        sourceIds: ["memory-editor", "message-3"],
        changeIndexes: [0],
      },
    ],
  };
  const monitoringDecision: CoachDecision = {
    id: "decision-guide-monitoring",
    date: addDays(today, -9),
    goalId: "guide",
    programVersion: data.programs.at(-1)!.version,
    planVersion: 1,
    mode: "live",
    status: "Accepted",
    summary:
      "We agreed to check the word count against the week's checkpoint every Friday instead of waiting for the deadline to find out the pace.",
    methods: ["monitoring"],
    checks: [
      {
        id: "pace",
        label: "Schedule & capacity",
        finding: "400 minutes are budgeted per week for the guide; the weekly check adds no extra writing time, only a comparison.",
        sources: [`program-v${data.programs.at(-1)!.version}`],
      },
    ],
    frameworkVersion: "input-outcome-learning-v2",
    researchClaims: [monitoringClaim],
    researchSources: [monitoringSource],
  };
  data.decisions.push(decision, observed, monitoringDecision);
  const learning: LearningRecord = {
    id: "learning-breakfast-cue",
    goalIds: ["portfolio"],
    activeVersion: 1,
    state: "agreed",
    standing: "consistent",
    versions: [
      {
        version: 1,
        decisionId: decision.id,
        at: `${monday}T13:00:00.000Z`,
        observation: "You reported that the writing hour disappears once the workday starts.",
        hypothesis: "A fixed after-breakfast cue may make the drafting session start on planned days.",
        reasoning,
        sources: [
          // version must be the real evidence hash (matching server/learning.ts's
          // evidenceRevision), or reconcileLearning() treats the citation as stale and
          // flips standing to "reconsider" on the very next save.
          { id: "memory-morning", version: evidenceRevision(data, "memory-morning")!.version, kind: "context", occurredAt: addDays(today, -20), reportedAt: addDays(today, -20) },
        ],
        test: {
          change: "Draft one case-study section right after breakfast on Tuesdays and Thursdays.",
          design: "prospective",
          prediction: "You report starting the session on more of the planned days.",
          comparison: "Compared with the interrupted mornings you described before this trial.",
          start: monday,
          reviewAfter: addDays(monday, 13),
          reviewRule: "Review after four planned occurrences, or sooner if you report a blocker.",
          mechanismSignal: "Whether starting felt easier on the days the cue was used.",
          behaviorSignal: "Whether a section is drafted on the planned days.",
          inputStepIds: ["draft-section"],
          outcomeSignal: null,
          alternatives: ["A quieter fortnight at work could explain the same change."],
        },
        transfer: null,
        proposalId: null,
      },
    ],
    reviews: [
      {
        id: "review-breakfast-1",
        version: 1,
        decisionId: decision.id,
        at: `${addDays(today, -3)}T13:00:00.000Z`,
        sources: [],
        exposure: "used",
        mechanism: "You reported that starting was easier on the days breakfast was unhurried.",
        behavior: "Two of the three planned sessions produced a drafted section.",
        outcome: null,
        confounds: ["A quieter fortnight at work could explain the same change."],
        decision: "keep",
        standing: "consistent",
        // A few days out, so a fresh seed shows this record as a live experiment rather
        // than one already due for review.
        nextReviewAfter: addDays(today, 4),
        summary: "Two of three planned sessions happened, and you reported an easier start on those days.",
        implication: "Keep the after-breakfast cue for the rest of the trial window.",
        nextQuestion: "Does the cue still work on days with an early stand-up?",
      },
    ],
    events: [
      { at: `${monday}T13:00:00.000Z`, state: "agreed", reason: "You agreed to try the after-breakfast cue." },
      { at: `${addDays(today, -3)}T13:00:00.000Z`, state: "reviewed", reason: "First review saved from your check-in." },
    ],
    invalidations: [],
  };
  // A second, independent trial already past its review date, so the demo account
  // always has one learning record "Live experiment" and one "Ready to review".
  const monitoringLearning: LearningRecord = {
    id: "learning-word-count-check",
    goalIds: ["guide"],
    activeVersion: 1,
    state: "agreed",
    standing: "insufficient",
    versions: [
      {
        version: 1,
        decisionId: monitoringDecision.id,
        at: `${addDays(today, -9)}T12:30:00.000Z`,
        observation: "You are writing the guide in short weekday sessions without checking the word count against the plan.",
        hypothesis: "Checking the word count against the plan each week may show whether the current pace reaches 20,000 words on time.",
        reasoning: monitoringReasoning,
        sources: [],
        test: {
          change: "Check the word count against the week's target every Friday.",
          design: "prospective",
          prediction: "The weekly check shows whether the pace is on track before the deadline gets close.",
          comparison: "Compared with not checking the pace until the guide is due.",
          start: addDays(today, -9),
          reviewAfter: addDays(today, -2),
          reviewRule: "Review two weeks after the first check, or sooner if the pace looks off.",
          mechanismSignal: null,
          behaviorSignal: "Whether the word count is checked and compared with the plan each Friday.",
          inputStepIds: ["write-words"],
          outcomeSignal: "Cumulative words written against the checkpoint pace.",
          alternatives: ["A busier or quieter week at work could change the pace independent of checking it."],
        },
        transfer: null,
        proposalId: null,
      },
    ],
    reviews: [],
    events: [
      { at: `${addDays(today, -9)}T12:30:00.000Z`, state: "agreed", reason: "You agreed to check the word count against the plan each Friday." },
    ],
    invalidations: [],
  };
  data.learning = [learning, monitoringLearning];
  data.conversations.push({
    id: "chat-portfolio",
    title: "Protecting the writing hour",
    goalId: "portfolio",
    createdAt: `${monday}T12:55:00.000Z`,
  });
  data.messages.push(
    {
      id: "message-1",
      conversationId: "chat-portfolio",
      goalId: "portfolio",
      role: "user",
      channel: "web",
      origin: "user",
      at: `${monday}T12:55:00.000Z`,
      text: "I had time to write this morning but the workday swallowed it again.",
    },
    {
      id: "message-2",
      conversationId: "chat-portfolio",
      goalId: "portfolio",
      role: "coach",
      channel: "web",
      decisionId: decision.id,
      at: `${monday}T12:56:00.000Z`,
      links: [{ goalId: "portfolio", tab: "plan" }],
      references: [{ text: "the writing hour", recordId: "memory-morning" }],
      reactions: { user: { type: "like", at: `${monday}T13:10:00.000Z` } },
      text: "Let’s attach the session to the end of breakfast on Tuesdays and Thursdays and review it in two weeks.",
    },
    {
      id: "message-3",
      conversationId: "chat-portfolio",
      goalId: "portfolio",
      role: "user",
      channel: "sms",
      origin: "user",
      at: `${addDays(today, -3)}T12:40:00.000Z`,
      text: "Two of the three sessions happened. Starting was easier when breakfast wasn’t rushed.",
    },
  );
  const block = data.actions.find((action) => action.goalId === "portfolio" && action.date >= today);
  if (block)
    data.workBlocks.push({
      id: block.id,
      goalId: "portfolio",
      action: block.title,
      start: `${block.date}T12:30:00.000Z`,
      end: `${block.date}T12:55:00.000Z`,
      provider: "local",
      status: "Scheduled",
    });
  maintainAdaptivePlans(data, new Date());
  return data;
}

// Two pending proposals on top of the seeded fixture: a milestone-due-date change tied
// to the portfolio decision, and a small saved-context proposal tied to the editor
// observation. Both scripts call this after saving buildDemoFixture()'s output so the
// account always has a reviewable proposal waiting in Coach.
export function seedDemoProposals(
  runtime: { service: Service; db: Database },
  userId: string,
  today: string,
) {
  const proposal = runtime.service.propose(
    userId,
    [
      {
        entity: "milestone",
        operation: "update",
        id: "case-study-1",
        parentId: "portfolio",
        reason: "Your editor reviews drafts on Fridays, so Thursday is the useful target.",
        values: JSON.stringify({ dueDate: addDays(today, 13) }),
      },
    ] satisfies Change[],
    "Move the first case study target to the Thursday before your editor’s review.",
    "web",
    "portfolio",
    undefined,
    true,
  );
  proposal.decisionId = "decision-portfolio-cue";
  proposal.conversationId = "chat-portfolio";
  runtime.db.sql
    .prepare("UPDATE proposals SET json=? WHERE id=?")
    .run(JSON.stringify(proposal), proposal.id);

  const context = runtime.service.propose(
    userId,
    [
      {
        entity: "memory",
        operation: "create",
        id: "memory-thursday",
        parentId: null,
        reason: "Your editor reviews on Fridays, so Thursday evening is the hand-off.",
        values: JSON.stringify({
          text: "Keep Thursday evening free for the editor hand-off.",
        }),
      },
    ] satisfies Change[],
    "Save the Thursday hand-off as context.",
    "web",
    "portfolio",
    undefined,
    true,
  );
  context.decisionId = "decision-editor-friday";
  runtime.db.sql
    .prepare("UPDATE proposals SET json=? WHERE id=?")
    .run(JSON.stringify(context), context.id);
}
