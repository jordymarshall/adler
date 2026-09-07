import { initialData, type Data, type Goal, type Outcome } from '../shared/workspace.ts';
import { addDays } from '../shared/journey.ts';
import { demoGoal } from './portfolio-goal.ts';
import type { Proposal } from '../server/service.ts';
import { synthesisSources } from "../server/behavioral-research.ts";
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
  data.decisions = [{ id: 'learned-rhythm', date: '2026-10-16', goalId: portfolio.id, programVersion: 1, planVersion: 1, mode: 'live', checks: [], methods: ['implementation-intentions'], summary: 'Keep the cue that helped. Test a smaller finish line.', status: 'Accepted', insights: [
    { finding: 'A familiar cue makes it easier to start.', status: 'Reported', sourceIds: ['breakfast-cue', `${portfolio.id}-2026-10-15`], changeIndexes: [0] },
    { finding: 'A clear stopping point may help with repeated polishing.', status: 'To test', sourceIds: ['polishing'], changeIndexes: [1] },
    { finding: 'Keeping the book nearby helped you read.', status: 'Reported', sourceIds: ['book-cue'], changeIndexes: [2] },
  ] }];
  data.memories.find(m => m.id === 'polishing')!.date = '2026-10-05';
  data.memories.find(m => m.id === 'breakfast-cue')!.date = '2026-10-01';
  data.actions.find(a => a.id === `${portfolio.id}-2026-10-15`)!.note = 'I used the finish line, stopped polishing, and left a note for next time.';
  const decision = data.decisions[0];
  decision.methods = ['goal-definition', 'barriers', 'review'];
  decision.frameworkVersion = 'besci-coaching-v1';
  decision.researchSources = [...methodSources(), ...synthesisSources()].filter(source => ['method:goal-definition', 'adler:P3', 'adler:P4'].includes(source.id)).map(source => ({ ...source, retrievedAt: new Date(captureDate).toISOString() }));
  decision.insights = [{ finding: 'I keep editing the same paragraph when I have no clear stopping point.', status: 'Reported', sourceIds: ['polishing', 'breakfast-cue'], changeIndexes: [1], learning: {
    reasoning: {
      principleIds: ['P3', 'P4'], goalRoute: 'session', ruleExceptions: ['A drafting session uses a chosen finish criterion, not a daily habit or automaticity threshold.'],
      barrier: { domain: 'uncertain', status: 'tentative', explanation: 'You report repeated editing without a stopping point. That does not establish a capability or motivation problem.', sourceIds: ['polishing'] },
      methodId: 'goal-definition', researchSourceIds: ['method:goal-definition', 'adler:P3', 'adler:P4'],
      mechanism: 'A specific finish criterion can make the next action and its feedback clearer.',
      fit: 'You already chose the drafting work. A stopping criterion addresses the ambiguity you reported without prescribing how to write.',
      prediction: 'You can stop at the chosen finish line and identify a next step, instead of repeatedly polishing the same paragraph.',
      reviewRule: 'Keep the finish criterion if your reports show it helps you move on. If not, inspect the obstacle before increasing the workload.',
      limitation: 'Two self-reports do not establish causation; available time or draft difficulty may also have changed.',
    },
    hypothesis: 'A clear stopping point could reduce repeated polishing.',
    experiment: 'Choose a finish line before opening the draft. Work for 25 minutes, then leave a note for next time.',
    result: { summary: 'You reported completing two sessions. In the second, the finish line helped you stop polishing and leave a next step.', sourceIds: [`${portfolio.id}-2026-10-13`, `${portfolio.id}-2026-10-15`] },
    insight: 'In two reported sessions, you finished the work. In one, you explicitly linked stopping to the finish line; we need more observations.', nextHypothesis: 'Could a smaller fallback help on crowded days?', previousInsightId: null,
    researchSourceIds: ['method:goal-definition', 'adler:P3', 'adler:P4'],
  } }];
  decision.insights.push(
    { finding: 'Starting after breakfast works better for me than leaving it until the evening.', status: 'Reported', sourceIds: ['breakfast-cue'], changeIndexes: [0] },
    { finding: 'I read more often when my book is already beside my lunch spot.', status: 'Reported', sourceIds: ['book-cue'], changeIndexes: [2] },
  );
  return data;
}
export const landingProposals: Proposal[] = [{ id: 'rhythm-change', summary: 'Keep the helpful cues and test a clear finish line.', status: 'applied', expires: Date.parse('2026-11-01'), channel: 'web', goalId: 'demo-portfolio', decisionId: 'learned-rhythm', changes: [
  { entity: 'plan', operation: 'update', id: null, parentId: 'demo-portfolio', values: JSON.stringify({ timing: 'After breakfast' }), reason: 'Keep your after-breakfast session. It is a cue you reported finding useful.' },
  { entity: 'plan', operation: 'update', id: null, parentId: 'demo-portfolio', values: JSON.stringify({ criterion: 'Choose one finish line, work for 25 minutes, then leave a note.' }), reason: 'Choose a finish line before opening the draft. Review whether it helped after two sessions.' },
  { entity: 'plan', operation: 'update', id: null, parentId: 'reading', values: JSON.stringify({ timing: 'After lunch, with my book nearby' }), reason: 'Keep the book beside your lunch spot. Use one page as the smaller option on a busy day.' },
] }];
