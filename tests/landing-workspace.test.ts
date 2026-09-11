import test from "node:test";
import assert from "node:assert/strict";
import { captureDate, landingWorkspace, portfolioSnapshot } from "../scripts/landing-workspace.ts";
import { validateWorkspace } from "../shared/validation.ts";
import { evidenceRevision } from "../server/learning.ts";
import { planExperiment } from "../shared/goal-view.ts";

test("the portfolio demonstration preserves the first plan, attributed feedback and original prediction", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: Date.parse(captureDate) });
  const data = validateWorkspace(landingWorkspace());
  const goal = data.goals[0], record = data.learning!.find(record => record.id === "writing-finish")!;
  const version = record.versions[0], review = record.reviews[0];
  assert.equal(goal.plans.length, 3);
  assert.ok(goal.plans[0].date < version.test.start!);
  assert.equal(goal.plans[1].date, version.test.start);
  assert.equal(goal.plans[1].adaptive!.reasoning!.fit, version.hypothesis);
  assert.equal(planExperiment(data, goal, goal.plans[1], version.test.inputStepIds![0], [])?.record.id, record.id);
  assert.equal(record.versions.length, 1, "Reviewing an attempt must not rewrite its prediction");
  assert.equal(review.exposure, "used");
  assert.equal(review.standing, "consistent");
  assert.equal(review.decision, "keep");
  assert.ok(review.at.slice(0, 10) > "2026-10-15");
  for (const source of [...version.sources, ...review.sources]) assert.deepEqual(evidenceRevision(data, source.id), source);
  assert.equal(goal.results.at(-1)?.value, 1, "Writing for 25 minutes is not publishing a case study");
  assert.ok(review.confounds.length > 0);
  assert.equal(version.reasoning.methodId, "barriers");
  assert.deepEqual(version.reasoning.grounding!.map(item => [item.claimId, item.relation]), [["claim:com-b-opportunity", "defines"], ["claim:situational-modification-student-trials", "motivates"]]);
  assert.equal(goal.plans[2].date, "2026-10-19");
  assert.equal(goal.plans[2].adaptive!.window.capacityMinutes, 50);
  assert.ok(goal.plans[2].action.includes("phone in the kitchen"));
  for (const date of ["2026-10-13", "2026-10-15"]) {
    const action = data.actions.find(action => action.id === `${goal.id}-${date}`)!;
    assert.equal(action.outcome, "Done");
    assert.equal(action.actualMinutes, 25);
    assert.match(action.note!, /phone stayed in the kitchen/);
  }
  assert.ok(data.actions.filter(action => action.goalId === goal.id && action.date >= "2026-10-19").every(action => !action.outcome && action.planVersion === 3));
  assert.ok(data.messages.some(message => message.id === "portfolio-review-report" && message.origin === "user"));
});

test("earlier phone captures cannot show later feedback or apply the phone-away plan early", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: Date.parse(captureDate) });
  for (const date of ["2026-10-08", "2026-10-11", "2026-10-12", "2026-10-18"]) {
    const at = `${date}T${date === "2026-10-12" ? "09:00" : "08:00"}:00-04:00`;
    const data = validateWorkspace(portfolioSnapshot(at));
    assert.ok(data.messages.every(message => Date.parse(message.at!) <= Date.parse(at)));
    assert.ok(data.memories.every(memory => memory.date <= date));
    assert.ok(data.actions.every(action => !action.outcome || action.date < date));
    assert.ok(data.actions.every(action => data.goals[0].plans.some(plan => plan.version === action.planVersion)));
    assert.ok(data.learning!.every(record => record.reviews.length === 0));
    assert.ok(data.learning!.every(record => record.state === "agreed" && record.standing === "untested"));
    assert.ok(data.workBlocks.every(block => block.provider === "local" && !block.eventId), "Earlier screens cannot show the later booking");
    assert.equal(data.goals[0].plans.length, date < "2026-10-12" ? 1 : 2);
  }
});

test("the earlier agenda and the later text use the reading plan in force on their dates", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: Date.parse(captureDate) });
  const data = validateWorkspace(landingWorkspace());
  const goal = data.goals.find(goal => goal.id === "reading")!;
  for (const [date, cue] of [["2026-10-08", "After dinner"], ["2026-10-20", "Tuesday and Thursday, after lunch at home"]]) {
    const action = data.actions.find(action => action.id === `reading-${date}`)!;
    const plan = goal.plans.find(plan => plan.version === action.planVersion)!;
    assert.ok(plan.date <= date);
    assert.equal(action.timing, cue);
  }
});

test("the landing projection is computed from the shared model and explicit fictional reports", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: Date.parse(captureDate) });
  const { goalProjection } = await import('../shared/goal-projection.ts');
  const { readFileSync } = await import('node:fs');
  const snapshot = JSON.parse(readFileSync('src/landing-progress.json', 'utf8'));
  const data = validateWorkspace(portfolioSnapshot('2026-10-11T18:00:00-04:00'));
  const computed = goalProjection(data, data.goals[0], snapshot.asOf);
  assert.deepEqual(snapshot.projection, computed.projection);
  assert.deepEqual(snapshot.observations, computed.observations.map(({date,value}) => ({date,value})));
  assert.equal(snapshot.current, computed.current);
  assert.equal(snapshot.target, computed.target);
  assert.equal(snapshot.reportedMinutes, data.actions.reduce((sum, action) => sum + (action.actualMinutes ?? 0), 0));
  assert.equal(snapshot.paceMinutesPerWeek, Math.round(computed.evidence!.pace.expected * 60 * 7));
  assert.equal(snapshot.pairedIntervals, computed.evidence!.pairs.length);
  assert.equal(computed.projection!.expectedDate, '2026-11-05');
  assert.equal(computed.projection!.latestDate, null);
  assert.ok(computed.projection!.points.every(point => point.low === 1), 'The low scenario includes no further outcome progress');
  const current = validateWorkspace(landingWorkspace());
  assert.equal(goalProjection(current, current.goals[0], '2026-10-20').projection, null, 'The changed writing setup needs new comparable evidence');
});
