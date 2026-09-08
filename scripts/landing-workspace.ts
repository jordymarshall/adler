import { initialData, type Data, type Goal, type Outcome } from '../shared/workspace.ts';
import { addDays } from '../shared/journey.ts';
import { demoGoal } from './portfolio-goal.ts';
import type { Proposal } from '../server/service.ts';
import { synthesisSources } from "../server/behavioral-research.ts";
import { RESEARCH_CLAIMS } from "../shared/research-claims.ts";
import { evidenceRevision } from "../server/learning.ts";
import type { BehavioralReasoning } from "../shared/behavioral-reasoning.ts";
import { methodSources } from '../server/research.ts';

export const captureDate = '2026-10-17T16:00:00-04:00';
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
    { title: '25 minutes on my chosen draft', cue: 'After breakfast', minutes: 25, days: [2, 4], hour: '08:30', approach: 'Open the draft after breakfast. Choose one finish line, work for 25 minutes, then leave a note for next time.' },
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
      if (date >= '2026-10-12' && date <= '2026-10-25') {
        const start = `${date}T${routine.hour}:00-04:00`;
        data.workBlocks.push({ id, goalId: goal.id, action: routine.title, start, end: new Date(Date.parse(start) + routine.minutes * 60000).toISOString(), provider: 'local', status: outcome ?? 'Scheduled' });
      }
    }
  });
  Object.assign(data.programs[0], { date: '2026-09-20', focusGoalId: portfolio.id, sprintStart: '2026-10-12', sprintEnd: '2026-10-25', weeklyMinutes: 250, workStart: '08:00', workEnd: '18:00', workDays: [1, 2, 3, 4, 5], sprintResult: 'Find a rhythm that fits all three goals.' });
  data.memories = [
    { id: 'breakfast-cue', date: '2026-10-15', text: 'Starting after breakfast works better for me than leaving it until the evening.' },
    { id: 'polishing', date: '2026-10-15', text: 'I keep editing the same paragraph when I have no clear stopping point.' },
    { id: 'reading-window', date: '2026-10-16', text: 'Even ten pages did not happen at night. Work ran late, but I had time at lunch.' },
  ];
  data.memories.find(memory => memory.id === 'reading-window')!.text = 'Even ten pages did not happen at night. Work ran late, but I had time at lunch.';
  data.memories.find(memory => memory.id === 'reading-window')!.date = '2026-10-09';
  data.memories.find(memory => memory.id === 'polishing')!.date = '2026-10-10';
  for (const date of ['2026-10-13', '2026-10-15']) {
    data.actions.find(action => action.id === `reading-${date}`)!.note = 'I read 20 pages during an uninterrupted lunch break.';
  }
  const claims = RESEARCH_CLAIMS.filter(claim => ['claim:com-b-opportunity', 'claim:goal-specific-challenging'].includes(claim.id));
  const learningExamples = [
    { id: 'reading-lunch', goalId: 'reading', observationId: 'reading-window', method: 'barriers', principle: 'P24', claim: claims.find(claim => claim.id === 'claim:com-b-opportunity')!, hypothesis: 'An available lunch window may make it easier to begin than evenings interrupted by work.', change: 'Try your 20 pages after lunch.', mechanism: 'COM-B distinguishes external opportunity from motivation and capability. Your report of late work suggests checking the available window before reducing the target again; the timing change is a practical hypothesis, not a proven effect.', prediction: 'When lunch provides a usable window, you begin reading and report the pages you read.', reviewAfter: '2026-10-16' },
    { id: 'writing-finish', goalId: portfolio.id, observationId: 'polishing', method: 'goal-definition', principle: 'P3', claim: claims.find(claim => claim.id === 'claim:goal-specific-challenging')!, hypothesis: 'A chosen stopping point may help you move beyond repeated polishing.', change: 'Choose one finish line before opening the draft.', mechanism: 'Specific goals can direct attention and make feedback clearer. A stopping criterion is a tentative application to the repeated polishing you described.', prediction: 'You can stop at your chosen criterion and leave a next step.', reviewAfter: '2026-10-20' },
  ];
  data.decisions = [];
  data.learning = learningExamples.map((example, index) => {
    const observation = data.memories.find(memory => memory.id === example.observationId)!;
    const reasoning: BehavioralReasoning = {
      principleIds: [example.principle], goalRoute: index === 0 ? 'habit-shaped' : 'session', ruleExceptions: [],
      barrier: { domain: 'uncertain', status: 'tentative', explanation: observation.text, sourceIds: [observation.id] },
      methodId: example.method, researchSourceIds: [`method:${example.method}`, `adler:${example.principle}`, example.claim.source.id],
      mechanism: example.mechanism, fit: example.hypothesis, prediction: example.prediction,
      reviewRule: 'Review whether the change was possible, whether you used it, and whether it helped you begin or stop as intended. Keep the amount of useful work visible too.',
      limitation: 'This is a possible explanation, not a proven personal rule. Available time and the difficulty of the work can also change.',
      grounding: [{ claimId: example.claim.id, version: example.claim.version, relation: 'motivates', application: example.mechanism }],
    };
    const decisionId = `example-${example.id}`;
    data.decisions.push({ id: decisionId, date: '2026-10-12', goalId: example.goalId, programVersion: 1, planVersion: 1, mode: 'live', checks: [], methods: [example.method], summary: example.change, status: 'Accepted', researchClaims: [example.claim], researchSources: [...methodSources(), ...synthesisSources(), ...claims.map(claim => claim.source)].filter(source => reasoning.researchSourceIds.includes(source.id)) });
    return { id: example.id, goalIds: [example.goalId], state: index === 0 ? 'reviewed' : 'agreed', standing: index === 0 ? 'consistent' : 'untested', activeVersion: 1, versions: [{ version: 1, goalIds: [example.goalId], decisionId, at: '2026-10-12T12:00:00Z', observation: observation.text, hypothesis: example.hypothesis, reasoning, sources: [evidenceRevision(data, observation.id)!], test: { change: example.change, design: 'prospective', prediction: example.prediction, comparison: observation.text, start: '2026-10-12', reviewAfter: example.reviewAfter, reviewRule: reasoning.reviewRule, mechanismSignal: index === 0 ? 'Whether an uninterrupted lunch window was available.' : 'Whether you used the chosen stopping point.', behaviorSignal: index === 0 ? 'Whether you began reading, and how many pages you read.' : 'Whether you moved on at your chosen stopping point.', inputStepIds: [`${example.goalId}-session`], outcomeSignal: index === 0 ? 'Books finished may take longer to change.' : null, alternatives: ['Available time changed.', 'This week’s work was easier.'] }, transfer: null, proposalId: null }], reviews: index === 0 ? [{ id: 'reading-first-review', version: 1, decisionId, at: '2026-10-16T18:00:00Z', sources: ['reading-2026-10-13', 'reading-2026-10-15'].map(id => evidenceRevision(data, id)!), summary: 'You reported reading 20 pages on two days. Both had an uninterrupted lunch break.', exposure: 'used', mechanism: 'You reported having a usable lunch window on both occasions.', behavior: 'Two reported reading sessions, 20 pages each.', outcome: null, confounds: ['Both days had a quiet lunch break.'], decision: 'keep', standing: 'consistent', nextReviewAfter: '2026-10-22', implication: 'Keep the lunch plan for now. Two reports suggest it may help, but do not establish that timing caused the difference.', nextQuestion: 'Does this still help on office days, when meetings may interrupt lunch?' }] : [], events: [{ at: '2026-10-12T12:00:00Z', state: 'agreed', reason: 'You agreed to try the change.' }], invalidations: [] };
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
  return data;
}
export const landingProposals: Proposal[] = [{ id: 'rhythm-change', summary: 'Keep the helpful cues and test a clear finish line.', status: 'applied', expires: Date.parse('2026-11-01'), channel: 'web', goalId: 'demo-portfolio', decisionId: 'learned-rhythm', changes: [
  { entity: 'plan', operation: 'update', id: null, parentId: 'demo-portfolio', values: JSON.stringify({ timing: 'After breakfast' }), reason: 'Keep your after-breakfast session. It is a cue you reported finding useful.' },
  { entity: 'plan', operation: 'update', id: null, parentId: 'demo-portfolio', values: JSON.stringify({ criterion: 'Choose one finish line, work for 25 minutes, then leave a note.' }), reason: 'Choose a finish line before opening the draft. Review whether it helped after two sessions.' },
  { entity: 'plan', operation: 'update', id: null, parentId: 'reading', values: JSON.stringify({ timing: 'After lunch' }), reason: 'Try reading after lunch; review whether that window was available and how many pages you actually read.' },
] }];
