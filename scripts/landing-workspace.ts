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
export function landingWorkspace(): Data {
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
  const routines = [
    { title: '25 minutes on my chosen draft', cue: 'After breakfast', minutes: 25, days: [2, 4], hour: '08:30', approach: 'Open the draft after breakfast. Choose one finish line, work for 25 minutes, then leave a note for next time.' },
    { title: 'Read 20 pages', cue: 'After lunch, with my book nearby', minutes: 20, days: [0, 1, 2, 3, 4, 5, 6], hour: '12:30', approach: 'Keep the book beside my lunch spot. Read 20 pages; one page is the smaller option on busy days.' },
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
    { id: 'book-cue', date: '2026-10-16', text: 'I read more often when I leave my book beside my lunch spot.' },
  ];
  data.memories.find(memory => memory.id === 'book-cue')!.text = 'I forget to pick up my book after lunch, even when I have time.';
  data.memories.find(memory => memory.id === 'book-cue')!.date = '2026-10-09';
  data.memories.find(memory => memory.id === 'polishing')!.date = '2026-10-10';
  const claims = RESEARCH_CLAIMS.filter(claim => ['claim:implementation-if-then', 'claim:goal-specific-challenging'].includes(claim.id));
  const learningExamples = [
    { id: 'reading-lunch', goalId: 'reading', observationId: 'book-cue', method: 'implementation', principle: 'P2', claim: claims.find(claim => claim.id === 'claim:implementation-if-then')!, hypothesis: 'A visible book may make it easier to begin after lunch.', change: 'Keep your book beside your lunch spot.', mechanism: 'An if–then plan links a familiar cue to a chosen action. Leaving the book nearby is a practical way to make that cue easier to notice.', prediction: 'You notice the book and begin reading after lunch when there is time.', reviewAfter: '2026-10-22' },
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
      reviewRule: 'Review whether the change was used and whether it helped you begin or stop as intended. Keep the amount of useful work visible too.',
      limitation: 'This is a possible explanation, not a proven personal rule. Available time and the difficulty of the work can also change.',
      grounding: [{ claimId: example.claim.id, version: example.claim.version, relation: 'motivates', application: example.mechanism }],
    };
    const decisionId = `example-${example.id}`;
    data.decisions.push({ id: decisionId, date: '2026-10-12', goalId: example.goalId, programVersion: 1, planVersion: 1, mode: 'live', checks: [], methods: [example.method], summary: example.change, status: 'Accepted', researchClaims: [example.claim], researchSources: [...methodSources(), ...synthesisSources(), ...claims.map(claim => claim.source)].filter(source => reasoning.researchSourceIds.includes(source.id)) });
    return { id: example.id, goalIds: [example.goalId], state: index === 0 ? 'reviewed' : 'agreed', standing: index === 0 ? 'consistent' : 'untested', activeVersion: 1, versions: [{ version: 1, goalIds: [example.goalId], decisionId, at: '2026-10-12T12:00:00Z', observation: observation.text, hypothesis: example.hypothesis, reasoning, sources: [evidenceRevision(data, observation.id)!], test: { change: example.change, design: 'prospective', prediction: example.prediction, comparison: 'Compare your next reports with the starting difficulty you described; circumstances are not controlled.', start: '2026-10-12', reviewAfter: example.reviewAfter, reviewRule: reasoning.reviewRule, mechanismSignal: 'Whether you noticed the cue or stopping point.', behaviorSignal: index === 0 ? 'Whether you began reading, and how many pages you read.' : 'Whether you moved on at your chosen stopping point.', inputStepIds: [`${example.goalId}-session`], outcomeSignal: index === 0 ? 'Books finished may take longer to change.' : null, alternatives: ['Available time changed.', 'This week’s work was easier.'] }, transfer: null, proposalId: null }], reviews: index === 0 ? [{ id: 'reading-first-review', version: 1, decisionId, at: '2026-10-16T18:00:00Z', sources: ['reading-2026-10-13', 'reading-2026-10-15'].map(id => evidenceRevision(data, id)!), summary: 'You reported reading 20 pages on two days. On one day, seeing the book helped you remember to begin.', exposure: 'used', mechanism: 'You linked noticing the book to starting on one occasion.', behavior: 'Two reported reading sessions, 20 pages each.', outcome: null, confounds: ['Both days had a quiet lunch break.'], decision: 'keep', standing: 'consistent', nextReviewAfter: '2026-10-22', implication: 'Keep the book nearby while we learn whether the cue holds up on busier days.', nextQuestion: 'Does this still help when lunch is interrupted?' }] : [], events: [{ at: '2026-10-12T12:00:00Z', state: 'agreed', reason: 'You agreed to try the change.' }], invalidations: [] };
  });
  return data;
}
export const landingProposals: Proposal[] = [{ id: 'rhythm-change', summary: 'Keep the helpful cues and test a clear finish line.', status: 'applied', expires: Date.parse('2026-11-01'), channel: 'web', goalId: 'demo-portfolio', decisionId: 'learned-rhythm', changes: [
  { entity: 'plan', operation: 'update', id: null, parentId: 'demo-portfolio', values: JSON.stringify({ timing: 'After breakfast' }), reason: 'Keep your after-breakfast session. It is a cue you reported finding useful.' },
  { entity: 'plan', operation: 'update', id: null, parentId: 'demo-portfolio', values: JSON.stringify({ criterion: 'Choose one finish line, work for 25 minutes, then leave a note.' }), reason: 'Choose a finish line before opening the draft. Review whether it helped after two sessions.' },
  { entity: 'plan', operation: 'update', id: null, parentId: 'reading', values: JSON.stringify({ timing: 'After lunch, with my book nearby' }), reason: 'Keep the book beside your lunch spot. Use one page as the smaller option on a busy day.' },
] }];
