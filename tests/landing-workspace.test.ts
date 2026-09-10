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
  assert.equal(goal.plans.length, 2);
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
  assert.equal(goal.results.at(-1)?.value, 1, "Finishing a section is not publishing a case study");
  assert.ok(review.confounds.length > 0);
  assert.ok(data.messages.some(message => message.id === "portfolio-review-report" && message.origin === "user"));
});

test("earlier phone captures cannot show later feedback or apply the stopping-point plan early", (t) => {
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
