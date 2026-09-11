import { initialData, type Data, type Goal, type Outcome } from '../shared/workspace.ts';
import { addDays } from '../shared/journey.ts';
import { demoGoal } from './portfolio-goal.ts';
import type { Proposal } from '../server/service.ts';
import { synthesisSources } from "../server/behavioral-research.ts";
import { RESEARCH_CLAIMS } from "../shared/research-claims.ts";
import { evidenceRevision } from "../server/learning.ts";
import type { BehavioralReasoning } from "../shared/behavioral-reasoning.ts";
import { methodSources } from '../server/research.ts';
import { portfolioStory, portfolioConversation } from '../src/landing-story.ts';

export const captureDate = '2026-10-20T08:00:00-04:00';
const portfolioBookingAt = '2026-10-20T11:59:00Z';
export function landingWorkspace(stage: "current" | "first-plan" = "current"): Data {
  const data = initialData();
  data.timeZone = 'America/Toronto';
  const portfolio = structuredClone(demoGoal);
  portfolio.title = 'Publish my portfolio';
  portfolio.checkpoints = [];
  portfolio.plans[0].date = '2026-09-20';
  portfolio.milestones[0].completedAt = '2026-10-11';
  const reading: Goal = { ...structuredClone(portfolio), id: 'reading', title: 'Read more often', kind: 'practical', area: 'Personal', priority: 'Maintain', tags: ['Reading'], why: 'Make room for something I enjoy.', success: 'Finish the four books I chose this autumn.', target: 4, unit: 'books', measure: { label: 'Books finished', unit: 'books', target: 4, baseline: 0 }, targetDate: '2026-11-30', milestones: [1, 2, 3, 4].map(i => ({ id: `book-${i}`, title: `Finish book ${i}`, criterion: 'Read the last page and note one idea to keep.', done: i === 1, dueDate: ['2026-10-10', '2026-10-31', '2026-11-15', '2026-11-30'][i - 1] })), checkpoints: [], results: [{ id: 'book-result', date: '2026-10-10', value: 1, source: 'Finished my first book.' }] };
  const career: Goal = { ...structuredClone(portfolio), id: 'next-role', title: 'Find my next role', priority: 'Maintain', tags: ['Career'], why: 'Find work that fits the life I want.', success: 'Accept a role that fits my priorities.', target: 3, unit: 'milestones', measure: undefined, targetDate: '2026-12-15', milestones: ['Choose my priorities', 'Have a first interview', 'Accept a suitable offer'].map((title, i) => ({ id: `career-${i}`, title, criterion: title, done: i === 0, dueDate: ['2026-10-10', '2026-11-15', '2026-12-15'][i] })), checkpoints: [], results: [] };
  data.goals = [portfolio, reading, career];
  Object.assign(reading, { title: 'Read 30 books', success: 'Read 30 books I want to make time for.', target: 30, targetDate: '2028-01-01', measure: { label: 'Books finished', unit: 'books', target: 30, baseline: 0, aggregation: 'cumulative' } });
  reading.milestones = [{ id: 'book-1', title: 'Finish the first book', criterion: 'Report finishing the book and one idea to keep.', done: true, completedAt: '2026-10-10' }];
  const routines = [
    { title: 'Spend 25 minutes drafting your next case study at 8:30.', cue: '8:30', minutes: 25, days: [2, 4], hour: '08:30', approach: 'Open the chosen draft at 8:30. Work for 25 minutes, then note where you stopped.' },
    { title: 'Read 20 pages', cue: 'After lunch', minutes: 20, days: [0, 1, 2, 3, 4, 5, 6], hour: '12:30', approach: 'Try 20 pages after lunch. Check whether that window was available before changing the reading target again.' },
    { title: 'One next step toward my next role', cue: 'After my morning coffee', minutes: 20, days: [1, 5], hour: '09:30', approach: 'Choose one next step the evening before. Use a short morning block and note what helped me start.' },
  ];
  const outcomes: Outcome[] = ['Didn’t happen', 'Partly', 'Done', 'Didn’t happen', 'Done', 'Partly', 'Done', 'Done', 'Partly', 'Done', 'Done', 'Done'];
  data.goals.forEach((goal, index) => {
    const routine = routines[index];
    const plan = goal.plans[0];
    Object.assign(plan, { action: routine.title, timing: routine.cue, criterion: 'Complete the session and leave a clear next step.', durationMinutes: routine.minutes });
    const adaptive = plan.adaptive!;
    adaptive.approach = routine.approach;
    adaptive.window.capacityMinutes = routine.minutes * routine.days.length * 2;
    const step = adaptive.steps[0];
    Object.assign(step, { id: `${goal.id}-session`, title: routine.title, cue: routine.cue, durationMinutes: routine.minutes, criterion: plan.criterion, scheduledDate: '2026-10-12', recurrence: { everyDays: 1, weekdays: routine.days, until: '2026-10-25' } });
    if (goal.id === 'reading') {
      step.measure = { id: 'reading-pages', label: 'Pages read', unit: 'pages', target: 20 };
      adaptive.projection = { kind: 'direct', driverStepId: step.id, inputMetric: 'amount', outcomeUnit: 'books', observationStart: '2026-09-21', horizonDays: 3660, feedbackDelayDays: 0, inputPerOutcome: { low: 200, expected: 300, high: 400 }, rationale: 'An adjustable starting assumption: 300 pages per book, with lengths from 200 to 400 pages.' };
    }
    let attempt = 0;
    for (let offset = 0; offset < 35; offset++) {
      const date = addDays('2026-09-21', offset);
      if (!routine.days.includes(new Date(`${date}T12:00:00Z`).getUTCDay())) continue;
      const outcome = date < '2026-10-17' ? outcomes[Math.min(attempt++, outcomes.length - 1)] : undefined;
      const id = `${goal.id}-${date}`;
      data.actions.push({ id, goalId: goal.id, stepId: step.id, occurrence: `${step.id}:${date}`, title: routine.title, criterion: plan.criterion, timing: routine.cue, date, planVersion: 1, outcome, note: outcome === 'Done' ? 'The cue helped me start. I left a note for next time.' : outcome === 'Didn’t happen' ? 'The day got busy before I made a start.' : outcome === 'Partly' ? 'I started, but kept revisiting the same part.' : undefined, history: [] });
      if (goal.id === 'reading' && outcome) data.actions.at(-1)!.amount = outcome === 'Done' ? 20 : outcome === 'Partly' ? 5 : 0;
      if ((date >= '2026-10-12' || goal.id === portfolio.id) && date <= '2026-10-25') {
        const start = `${date}T${routine.hour}:00-04:00`;
        data.workBlocks.push({ id, goalId: goal.id, action: routine.title, start, end: new Date(Date.parse(start) + routine.minutes * 60000).toISOString(), provider: 'local', status: outcome ?? 'Scheduled' });
      }
    }
  });
  // The reading story starts with the October 12 test. Its only reported
  // attempts are October 13 and 15; other sessions remain unreported.
  data.actions = data.actions.filter(action => action.goalId !== 'reading' || action.date >= '2026-10-12');
  for (const action of data.actions.filter(action => action.goalId === 'reading' && !['2026-10-13', '2026-10-15'].includes(action.date))) {
    delete action.outcome;
    delete action.amount;
    delete action.note;
  }
  for (const block of data.workBlocks.filter(block => block.goalId === 'reading')) {
    block.status = data.actions.find(action => action.id === block.id)?.outcome ?? 'Scheduled';
  }
  Object.assign(data.programs[0], { date: '2026-09-20', focusGoalId: portfolio.id, sprintStart: '2026-10-12', sprintEnd: '2026-10-25', weeklyMinutes: 250, workStart: '08:00', workEnd: '18:00', workDays: [1, 2, 3, 4, 5], sprintResult: 'Find a rhythm that fits all three goals.' });
  data.memories = [
    { id: 'writing-time', date: '2026-09-21', text: 'Tuesday and Thursday at 8:30 are available for 25 minutes of writing.' },
    { id: 'phone-distraction', date: '2026-10-15', text: portfolioStory.observation },
    { id: 'reading-window', date: '2026-10-16', text: 'Even ten pages did not happen at night. Work ran late, but I had time at lunch.' },
  ];
  data.memories.find(memory => memory.id === 'reading-window')!.text = 'Even ten pages did not happen at night. Work ran late, but I had time at lunch.';
  data.memories.find(memory => memory.id === 'reading-window')!.date = '2026-10-09';
  data.memories.find(memory => memory.id === 'phone-distraction')!.date = '2026-10-10';
  for (const date of ['2026-10-13', '2026-10-15']) {
    data.actions.find(action => action.id === `reading-${date}`)!.note = 'I read 20 pages during an uninterrupted lunch break.';
  }
  const claims = RESEARCH_CLAIMS.filter(claim => ['claim:com-b-opportunity', ...portfolioStory.claimIds].includes(claim.id));
  const learningExamples = [
    { id: 'reading-lunch', goalId: 'reading', observationId: 'reading-window', method: 'barriers', principle: 'P24', claim: claims.find(claim => claim.id === 'claim:com-b-opportunity')!, hypothesis: 'An available lunch window may make it easier to begin than evenings interrupted by work.', change: 'Try your 20 pages after lunch.', mechanism: 'COM-B distinguishes external opportunity from motivation and capability. Your report of late work suggests checking the available window before reducing the target again; the timing change is a practical hypothesis, not a proven effect.', prediction: 'When lunch provides a usable window, you begin reading and report the pages you read.', reviewAfter: '2026-10-16' },
    { id: 'writing-finish', goalId: portfolio.id, observationId: 'phone-distraction', method: portfolioStory.methodId, principle: portfolioStory.principleId, claim: claims.find(claim => claim.id === 'claim:situational-modification-student-trials')!, hypothesis: portfolioStory.rationale, change: portfolioStory.suggestion, mechanism: portfolioStory.science, prediction: portfolioStory.prediction, reviewAfter: portfolioStory.reviewDate },
  ];
  data.decisions = [];
  data.learning = learningExamples.map((example, index) => {
    const observation = data.memories.find(memory => memory.id === example.observationId)!;
    const supportingClaims = index === 0 ? [example.claim] : claims.filter(claim => portfolioStory.claimIds.some(id => id === claim.id));
    const reasoning: BehavioralReasoning = {
      principleIds: [example.principle], goalRoute: index === 0 ? 'habit-shaped' : 'session', ruleExceptions: [],
      barrier: { domain: 'uncertain', status: 'tentative', explanation: observation.text, sourceIds: [observation.id] },
      methodId: example.method, researchSourceIds: [`method:${example.method}`, `adler:${example.principle}`, ...supportingClaims.map(claim => claim.source.id)],
      mechanism: example.mechanism, fit: example.hypothesis, prediction: example.prediction,
      reviewRule: index === 0 ? 'Review whether the change was possible, whether you used it, and whether it helped you begin or stop as intended. Keep the amount of useful work visible too.' : 'Review whether the phone could stay in the kitchen, whether you used that setup, and the reported phone checks and writing time. Review publications separately.',
      limitation: index === 0 ? 'This is a possible explanation, not a proven personal rule. Available time and the difficulty of the work can also change.' : portfolioStory.testLimitation,
      grounding: supportingClaims.map(claim => ({ claimId: claim.id, version: claim.version, relation: index === 1 && claim.role === 'theory' ? 'defines' : 'motivates', application: index === 0 ? example.mechanism : claim.role === 'theory' ? 'COM-B distinguishes external opportunity from capability and motivation; the report identifies a changeable distraction in the writing setup.' : 'The student experiments motivate a prospective test of this setup; they do not establish a personal benefit or isolate this phone placement.' })),
    };
    const decisionId = `example-${example.id}`;
    data.decisions.push({ id: decisionId, date: '2026-10-12', goalId: example.goalId, programVersion: 1, planVersion: 1, mode: 'live', checks: [], methods: [example.method], summary: example.change, status: 'Accepted', researchClaims: supportingClaims, researchSources: [...methodSources(), ...synthesisSources(), ...claims.map(claim => claim.source)].filter(source => reasoning.researchSourceIds.includes(source.id)) });
    return { id: example.id, goalIds: [example.goalId], state: index === 0 ? 'reviewed' : 'agreed', standing: index === 0 ? 'consistent' : 'untested', activeVersion: 1, versions: [{ version: 1, goalIds: [example.goalId], decisionId, at: '2026-10-12T12:00:00Z', observation: observation.text, hypothesis: example.hypothesis, reasoning, sources: [evidenceRevision(data, observation.id)!], test: { change: example.change, design: 'prospective', prediction: example.prediction, comparison: observation.text, start: '2026-10-12', reviewAfter: example.reviewAfter, reviewRule: reasoning.reviewRule, mechanismSignal: index === 0 ? 'Whether an uninterrupted lunch window was available.' : 'Whether the phone stayed in the kitchen and whether you checked it.', behaviorSignal: index === 0 ? 'Whether you began reading, and how many pages you read.' : 'How many minutes you wrote and whether you felt able to focus.', inputStepIds: [`${example.goalId}-session`], outcomeSignal: index === 0 ? 'Books finished may take longer to change.' : null, alternatives: ['Available time changed.', 'This week’s work was easier.'] }, transfer: null, proposalId: null }], reviews: index === 0 ? [{ id: 'reading-first-review', version: 1, decisionId, at: '2026-10-16T18:00:00Z', sources: ['reading-2026-10-13', 'reading-2026-10-15'].map(id => evidenceRevision(data, id)!), summary: 'You reported reading 20 pages on two days. Both had an uninterrupted lunch break.', exposure: 'used', mechanism: 'You reported having a usable lunch window on both occasions.', behavior: 'Two reported reading sessions, 20 pages each.', outcome: null, confounds: ['Both days had a quiet lunch break.'], decision: 'keep', standing: 'consistent', nextReviewAfter: '2026-10-22', implication: 'Keep the lunch plan for now. Two reports suggest it may help, but do not establish that timing caused the difference.', nextQuestion: 'Does this still help on office days, when meetings may interrupt lunch?' }] : [], events: [{ at: '2026-10-12T12:00:00Z', state: 'agreed', reason: 'You agreed to try the change.' }], invalidations: [] };
  });
  const firstPlan = reading.plans[0];
  firstPlan.date = '2026-10-12';
  firstPlan.criterion = 'Read 20 pages and report the amount read.';
  firstPlan.adaptive!.window = { start: '2026-10-12', end: '2026-10-16', label: 'Try the lunch window', rationale: 'Check whether lunch offers usable time before changing the amount again. Review your next reports on Friday.', capacityMinutes: 100, capacityStatus: 'provisional' };
  firstPlan.adaptive!.reasoning = structuredClone(data.learning[0].versions[0].reasoning);
  firstPlan.adaptive!.assessment = { at: '2026-10-16T18:00:00Z', question: 'Was lunch available, did you start reading, and how many pages did you read?', adaptation: 'Keep a useful window, or review what got in the way before adding more reading.', feedbackDelayDays: 0, triggers: ['check-in', 'window-end'] };
  Object.assign(firstPlan.adaptive!.steps[0], { criterion: firstPlan.criterion, reason: data.learning[0].versions[0].hypothesis, recurrence: { everyDays: 1, until: '2026-10-16' }, fallback: 'Report when lunch is unavailable so we can review the timing.' });
  if (stage === 'first-plan') {
    // Capture the actual earlier app state, before the feedback and its revision.
    data.memories = data.memories.filter(memory => memory.date <= '2026-10-12');
    for (const record of data.learning) {
      record.reviews = [];
      record.state = 'agreed';
      record.standing = 'untested';
    }
    for (const action of data.actions.filter(action => action.date >= '2026-10-12')) {
      delete action.outcome;
      delete action.amount;
      delete action.note;
    }
    data.actions = data.actions.filter(action => action.goalId !== 'reading' || action.date <= '2026-10-16');
    data.workBlocks = data.workBlocks.filter(block => block.goalId !== 'reading' || block.start.slice(0, 10) <= '2026-10-16');
    for (const block of data.workBlocks) if (block.start.slice(0, 10) >= '2026-10-12') block.status = 'Scheduled';
    return data;
  }
  // Preserve the first test when new context narrows the next hypothesis.
  const officeReport = { id: 'reading-office-days', date: '2026-10-17', text: 'Lunch works at home on Tuesdays and Thursdays. Office days are still meeting after meeting. Keep the home-day reading plan and let’s discuss whether office days have a realistic window.' };
  data.memories.push(officeReport);
  const record = data.learning[0];
  const next = structuredClone(record.versions[0]);
  next.version = 2;
  next.decisionId = 'example-reading-refined';
  next.at = '2026-10-17T16:00:00Z';
  next.observation = officeReport.text;
  next.hypothesis = 'An uninterrupted lunch at home may be a workable reading window. Office days need a separate capacity check.';
  next.sources = [evidenceRevision(data, officeReport.id)!];
  next.reasoning.barrier = { ...next.reasoning.barrier, explanation: officeReport.text, sourceIds: [officeReport.id] };
  next.reasoning.fit = next.hypothesis;
  next.reasoning.prediction = 'You begin reading in available home-day lunch windows and report whether office-day time is realistic.';
  next.test = { ...next.test, change: 'Keep lunch reading on home days. Check office-day capacity before adding a session.', start: '2026-10-17', prediction: next.reasoning.prediction, reviewAfter: '2026-10-22', comparison: 'Compare the next reports by home and office context, recognizing that those days differ in other ways.', mechanismSignal: 'Whether a usable lunch window was available, and where.', alternatives: ['Home and office days differ in workload.', 'Book interest or difficulty changed.'] };
  data.decisions.push({ ...structuredClone(data.decisions[0]), id: next.decisionId, date: '2026-10-17', planVersion: 2, summary: next.test.change });
  record.versions.push(next);
  record.activeVersion = 2;
  record.state = 'agreed';
  record.standing = 'untested';
  record.events.push({ at: next.at, state: 'agreed', reason: 'You chose to keep home-day reading and discuss office-day capacity.' });
  const homeDays = [2, 4];
  const revisedPlan = structuredClone(reading.plans[0]);
  revisedPlan.version = 2;
  revisedPlan.date = '2026-10-17';
  revisedPlan.timing = 'Tuesday and Thursday, after lunch at home';
  revisedPlan.criterion = 'Read 20 pages and report the amount read.';
  revisedPlan.adaptive!.reasoning = structuredClone(next.reasoning);
  revisedPlan.adaptive!.approach = 'Keep reading at lunch on your reported home days. Check office-day capacity before adding another session.';
  revisedPlan.adaptive!.window = { start: '2026-10-17', end: '2026-10-22', label: 'Test home-day lunch windows', rationale: 'Two further home-day opportunities before reviewing the next reports. This does not establish a causal effect.', capacityMinutes: 40, capacityStatus: 'confirmed' };
  revisedPlan.adaptive!.assessment = { ...revisedPlan.adaptive!.assessment, at: '2026-10-22T18:00:00Z', question: 'Was the lunch window available, did you use it, and what happened on office days?', adaptation: 'Review the window and goal timing with you before adding work.' };
  const revisedStep = revisedPlan.adaptive!.steps[0];
  Object.assign(revisedStep, { cue: revisedPlan.timing, criterion: revisedPlan.criterion, reason: next.hypothesis, scheduledDate: '2026-10-20', recurrence: { everyDays: 1, weekdays: homeDays, until: '2026-10-22' }, fallback: 'Report when the window is unavailable and discuss what fits.' });
  reading.plans.push(revisedPlan);
  const inRevisedWindow = (date: string) => date <= '2026-10-22' && homeDays.includes(new Date(`${date}T12:00:00Z`).getUTCDay());
  data.actions = data.actions.filter(action => action.goalId !== 'reading' || action.date < revisedPlan.date || inRevisedWindow(action.date));
  for (const action of data.actions.filter(action => action.goalId === 'reading' && action.date >= revisedPlan.date)) Object.assign(action, { planVersion: 2, timing: revisedPlan.timing, criterion: revisedPlan.criterion });
  data.workBlocks = data.workBlocks.filter(block => block.goalId !== 'reading' || block.start.slice(0, 10) < revisedPlan.date || inRevisedWindow(block.start.slice(0, 10)));
  data.conversations = [{ id: 'reading-conversation', title: 'A reading plan that fits', goalId: 'general', createdAt: '2026-10-17T16:00:00Z' }];
  data.messages = [
    { id: 'reading-message-user', conversationId: 'reading-conversation', goalId: 'general', role: 'user', text: officeReport.text, origin: 'user', channel: 'web' },
    { id: 'reading-message-coach', conversationId: 'reading-conversation', goalId: 'general', role: 'coach', text: 'Keep lunch reading on home days.\n\nBefore adding an office-day session, let’s check whether there’s a realistic window. If there isn’t, we can revisit the goal’s timing.\n\nI’ve saved the updated hypothesis with your earlier reports in Insights. Let’s review the next reports on Oct 22.', decisionId: next.decisionId, references: [{ text: 'Insights', recordId: record.id }], links: [{ goalId: 'reading', tab: 'plan' }], channel: 'web' },
  ];
  addEarlierReadingPlan(data, reading);
  completePortfolioExample(data);
  return data;
}

// Keep the earlier daily agenda distinct from the later lunch-window test.
function addEarlierReadingPlan(data: Data, goal: Goal) {
  const earlier = structuredClone(goal.plans[0]);
  for (const plan of goal.plans) plan.version++;
  for (const action of data.actions.filter(action => action.goalId === goal.id)) action.planVersion++;
  for (const decision of data.decisions.filter(decision => decision.goalId === goal.id)) decision.planVersion++;
  earlier.version = 1;
  earlier.date = '2026-09-21';
  earlier.timing = 'After dinner';
  earlier.adaptive!.approach = 'Read the book I chose after dinner.';
  delete earlier.adaptive!.reasoning;
  earlier.adaptive!.window = { start: '2026-09-21', end: '2026-10-11', label: 'Make time for reading', rationale: 'The user chose a daily evening opportunity.', capacityMinutes: 420, capacityStatus: 'confirmed' };
  earlier.adaptive!.assessment = { ...earlier.adaptive!.assessment, at: '2026-10-11T18:00:00Z', question: 'Was there time to read, and how many pages did you read?' };
  Object.assign(earlier.adaptive!.steps[0], { cue: earlier.timing, scheduledDate: earlier.date, reason: 'The reading time you chose.', recurrence: { everyDays: 1, until: '2026-10-11' } });
  goal.plans.unshift(earlier);
  const step = earlier.adaptive!.steps[0];
  data.actions.push({ id: 'reading-2026-10-08', goalId: goal.id, stepId: step.id, occurrence: `${step.id}:2026-10-08`, title: 'Read 20 pages', criterion: earlier.criterion, timing: earlier.timing, date: '2026-10-08', planVersion: 1, outcome: 'Didn’t happen', amount: 0, note: 'Work ran late; I did not read after dinner.', history: [] });
}

function completePortfolioExample(data: Data) {
  const goal = data.goals[0], original = goal.plans[0];
  original.adaptive!.window.start = '2026-09-21';
  original.adaptive!.window.end = '2026-10-11';
  original.adaptive!.window.capacityMinutes = 150;
  original.adaptive!.window.rationale = 'Three weeks of the chosen Tuesday and Thursday sessions, then review what happened.';
  original.adaptive!.steps[0].scheduledDate = '2026-09-22';
  original.adaptive!.steps[0].recurrence!.until = '2026-10-11';
  original.adaptive!.assessment.question = 'Did you work on the chosen draft, and where did you stop?';
  original.adaptive!.assessment.at = '2026-10-11T18:00:00Z';
  original.adaptive!.projection = { kind: 'learned', driverStepId: original.adaptive!.steps[0].id, inputMetric: 'hours', outcomeUnit: 'case studies', observationStart: '2026-09-21', horizonDays: 45, feedbackDelayDays: 0, rationale: 'Explore what happens if recorded writing pace and the early observed relationship continue. Case studies differ in size; earlier work and other influences may explain publication. Zero additional return remains in the scenario range.' };
  // Explicit fictional measurements, never inferred from a Done status or booking.
  for (const [date, minutes] of [['2026-09-24', 12], ['2026-09-29', 25], ['2026-10-06', 25]] as const) {
    const action = data.actions.find(action => action.id === `${goal.id}-${date}`)!;
    action.actualMinutes = minutes;
    action.note = `I wrote for ${minutes} minutes on my chosen draft.`;
  }
  goal.results.at(-1)!.source = 'Still one published. I wrote in both trial sessions but neither completed another case study.';
  Object.assign(data.actions.find(action => action.id === `${goal.id}-2026-10-08`)!, { outcome: 'Done', actualMinutes: 25, note: 'I wrote for 25 minutes at 8:30. No new case study published.' });
  const record = data.learning!.find(item => item.id === 'writing-finish')!;
  const version = record.versions[0];
  const plan = structuredClone(original);
  plan.version = 2;
  plan.date = '2026-10-12';
  plan.action = portfolioStory.revisedAction;
  plan.timing = '8:30 · Phone in the kitchen';
  plan.criterion = 'Leave the phone in the kitchen and write for 25 minutes; report phone location, phone checks and writing time.';
  plan.adaptive!.approach = portfolioStory.suggestion;
  plan.adaptive!.reasoning = structuredClone(version.reasoning);
  delete plan.adaptive!.projection;
  plan.adaptive!.projectionUnavailableReason = 'Putting the phone in the kitchen changes the writing setup. Collect comparable input and outcome reports before estimating a finish under this plan.';
  plan.adaptive!.window = { start: '2026-10-12', end: '2026-10-18', label: 'Try writing with the phone away', rationale: 'Two chosen opportunities on October 13 and 15, followed by a review of actual use and useful work.', capacityMinutes: 50, capacityStatus: 'confirmed' };
  Object.assign(plan.adaptive!.steps[0], { title: plan.action, cue: plan.timing, criterion: plan.criterion, reason: version.hypothesis, scheduledDate: '2026-10-13', recurrence: { everyDays: 1, weekdays: [2, 4], until: '2026-10-18' } });
  plan.adaptive!.assessment.question = portfolioStory.followUp;
  plan.adaptive!.assessment.at = '2026-10-19T17:00:00Z';
  goal.plans.push(plan);
  data.decisions.find(decision => decision.id === version.decisionId)!.planVersion = plan.version;
  const continued = structuredClone(plan);
  continued.version = 3;
  continued.date = portfolioStory.reviewDate;
  continued.adaptive!.window = { start: '2026-10-19', end: '2026-10-25', label: 'Keep the phone away', rationale: portfolioStory.implication, capacityMinutes: 50, capacityStatus: 'confirmed' };
  continued.adaptive!.steps[0].scheduledDate = '2026-10-20';
  continued.adaptive!.steps[0].recurrence!.until = '2026-10-25';
  continued.adaptive!.assessment.at = '2026-10-25T18:00:00Z';
  goal.plans.push(continued);
  for (const action of data.actions.filter(action => action.goalId === goal.id && action.date >= plan.date)) {
    Object.assign(action, { planVersion: action.date < continued.date ? 2 : 3, title: plan.action, timing: plan.timing, criterion: plan.criterion });
    if (portfolioStory.trialDates.some(date => date === action.date)) Object.assign(action, { outcome: 'Done', actualMinutes: 25, note: 'My phone stayed in the kitchen. I did not check it and wrote for 25 minutes. Staying focused felt easier. No additional case study published.' });
    else { delete action.outcome; delete action.actualMinutes; delete action.note; }
  }
  for (const block of data.workBlocks.filter(block => block.goalId === goal.id)) {
    const action = data.actions.find(action => action.id === block.id)!;
    block.status = action.outcome ?? 'Scheduled';
    block.action = action.title;
  }
  const feedback = { id: 'portfolio-phone-away-feedback', date: portfolioStory.reviewDate, text: portfolioStory.feedback };
  data.memories.push(feedback);
  const decision = { ...structuredClone(data.decisions.find(item => item.id === version.decisionId)!), id: 'portfolio-keep-phone-away', date: feedback.date, planVersion: 3, summary: portfolioStory.implication };
  data.decisions.push(decision);
  record.state = 'reviewed';
  record.standing = 'consistent';
  record.reviews.push({ id: 'portfolio-phone-away-review', version: 1, decisionId: decision.id, at: '2026-10-19T18:00:00Z', sources: [evidenceRevision(data, feedback.id)!, ...portfolioStory.trialDates.map(date => evidenceRevision(data, `${goal.id}-${date}`)!)], summary: portfolioStory.reviewSummary, exposure: 'used', mechanism: 'You reported that the phone stayed in the kitchen and you did not check it on either occasion.', behavior: 'You reported writing for 25 minutes on both occasions.', outcome: 'No additional published case study reported.', confounds: ['The chosen work and available time may differ from earlier sessions.'], decision: 'keep', standing: 'consistent', nextReviewAfter: portfolioStory.nextReviewDate, implication: portfolioStory.implication, nextQuestion: 'Does keeping the phone away still help as the work and demands on your attention change, and has another case study been published?' });
  record.events.push({ at: '2026-10-19T18:01:00Z', state: 'reviewed', reason: 'Reviewed two reported uses. You asked to keep the setup in the next plan.' });
  data.conversations.push({ id: 'portfolio-conversation', title: 'Writing without phone distractions', goalId: goal.id, createdAt: '2026-10-08T12:55:00Z' });
  data.messages.push({ conversationId: 'portfolio-conversation', goalId: goal.id, id: 'portfolio-session-checkin', role: 'coach', text: 'How did your portfolio session go? Reply done, partly, or didn’t happen, and add what changed or got in the way. Goal: Publish my portfolio.', at: '2026-10-08T12:55:00Z', channel: 'job' });
  data.conversations.push({ id: 'portfolio-booking', title: 'My next portfolio session', goalId: goal.id, createdAt: '2026-10-20T11:55:00Z' });
  for (const { phase, ...message } of portfolioConversation) {
    data.messages.push({ ...message, conversationId: phase >= 8 ? 'portfolio-booking' : 'portfolio-conversation', goalId: goal.id, channel: 'sms', ...(message.role === 'user' ? { origin: 'user' as const } : {}), ...(message.id === 'portfolio-suggestion' ? { decisionId: version.decisionId } : message.id === 'portfolio-kept-plan' ? { decisionId: decision.id } : {}) });
  }
  Object.assign(data.workBlocks.find(block => block.id === 'demo-portfolio-2026-10-20')!, { provider: 'google', eventId: 'illustrative-portfolio-booking' });
}

// Earlier portfolio views exclude later reports, recommendations and reviews.
export function portfolioSnapshot(at: string): Data {
  const date = at.slice(0, 10);
  const data = landingWorkspace();
  const goal = data.goals[0];
  data.goals = [goal];
  goal.plans = goal.plans.filter(plan => plan.date <= date);
  goal.results = goal.results.filter(result => result.date <= date);
  goal.outcomeUpdatedAt = goal.results.at(-1)?.date;
  for (const milestone of goal.milestones) if (milestone.completedAt && milestone.completedAt > date) { milestone.done = false; delete milestone.completedAt; }
  data.actions = data.actions.filter(action => action.goalId === goal.id && goal.plans.some(plan => plan.version === action.planVersion));
  for (const action of data.actions) if (action.date >= date) { delete action.outcome; delete action.note; delete action.amount; delete action.actualMinutes; }
  data.workBlocks = data.workBlocks.filter(block => data.actions.some(action => action.id === block.id));
  for (const block of data.workBlocks) {
    block.status = data.actions.find(action => action.id === block.id)?.outcome ?? 'Scheduled';
    if (block.eventId === 'illustrative-portfolio-booking' && Date.parse(at) < Date.parse(portfolioBookingAt)) { block.provider = 'local'; delete block.eventId; }
  }
  data.memories = data.memories.filter(memory => memory.date <= date);
  data.decisions = data.decisions.filter(decision => decision.goalId === goal.id && decision.date <= date);
  data.learning = data.learning!.filter(record => record.goalIds.includes(goal.id) && record.versions[0].at.slice(0, 10) <= date);
  for (const record of data.learning) {
    record.reviews = record.reviews.filter(review => review.at.slice(0, 10) <= date);
    record.events = record.events.filter(event => event.at.slice(0, 10) <= date);
    if (!record.reviews.length) { record.state = 'agreed'; record.standing = 'untested'; }
  }
  data.conversations = data.conversations.filter(conversation => conversation.goalId === goal.id && Date.parse(conversation.createdAt) <= Date.parse(at));
  data.messages = data.messages.filter(message => message.goalId === goal.id && Date.parse(message.at!) <= Date.parse(at));
  return data;
}
export const landingProposals: Proposal[] = [{ id: 'rhythm-change', summary: 'Keep the available writing time and leave the phone in the kitchen.', status: 'applied', expires: Date.parse('2026-11-01'), channel: 'web', goalId: 'demo-portfolio', decisionId: 'learned-rhythm', changes: [
  { entity: 'plan', operation: 'update', id: null, parentId: 'demo-portfolio', values: JSON.stringify({ timing: '8:30' }), reason: 'Keep the Tuesday and Thursday time you said was available.' },
  { entity: 'plan', operation: 'update', id: null, parentId: 'demo-portfolio', values: JSON.stringify({ action: portfolioStory.revisedAction, criterion: 'Leave the phone in the kitchen and write for 25 minutes.' }), reason: portfolioStory.implication },
  { entity: 'plan', operation: 'update', id: null, parentId: 'reading', values: JSON.stringify({ timing: 'After lunch' }), reason: 'Try reading after lunch; review whether that window was available and how many pages you actually read.' },
] }];
