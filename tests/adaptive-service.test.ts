import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Database } from "../server/database.ts";
import { Service } from "../server/service.ts";
import { createGoal } from "../shared/validation.ts";
import { basis, literature, researched } from "./planning-fixture.ts";
import { adaptiveFixture } from "./adaptive-fixture.ts";
import { dateInZone } from "../shared/journey.ts";
import { assessmentDue } from "../shared/adaptive-plan.ts";
import { PlanWorker } from "../server/plan-worker.ts";

function fixture(t: test.TestContext) {
  const directory = mkdtempSync(join(tmpdir(), "adler-adaptive-"));
  const db = new Database(directory);
  t.after(() => { db.close(); rmSync(directory, { recursive: true, force: true }); });
  const user = db.createUser("planner", "a-long-test-password", "UTC");
  db.setSecret(user.id, "model-choice", { provider: "gemini", model: "fixture", useServer: false });
  db.setSecret(user.id, "model-gemini", { key: "fixture-only" });
  const today = dateInZone("UTC");
  const adaptive = adaptiveFixture(today, today);
  const input = {
    title: "Publish an essay", kind: "project" as const, why: "Share an idea", success: "Essay published",
    area: "Unassigned" as const, tags: [], targetDate: "2027-12-31",
    milestones: [{ title: "Published", criterion: "Public URL" }], assessmentTarget: 8, baseline: null,
    action: adaptive.steps[0].title, criterion: adaptive.steps[0].criterion, timing: adaptive.steps[0].cue,
    basis: { ...basis, review: { ...basis.review, date: today } },
  };
  return { db, user, today, input, adaptive };
}

test("new coach plans must contain executable structure and receive repair feedback", async t => {
  const { db, user, input, adaptive } = fixture(t);
  let attempts = 0;
  const service = new Service(db, researched(async (_config, _instructions, context: any, schema) => {
    attempts++;
    if (attempts === 2) assert.match(context.validationError, /adaptive/i);
    return schema.parse({ reply: "Review your plan.", summary: "A short outline experiment", execution: "apply", methods: [], changes: [{
      entity: "goal", operation: "create", id: "essay", parentId: null,
      values: JSON.stringify({ ...input, ...(attempts === 2 ? { adaptive } : {}) }), reason: "You asked to publish an essay.",
    }] });
  }), literature);
  const result = await service.chat(user.id, "Create my goal", "general", "web", "adaptive-create");
  assert.equal(attempts, 2);
  assert.equal(result.data.goals[0].plans[0].adaptive.steps.length, 1);
  assert.equal(result.data.actions.length, 1);
});

test("an existing goal's upgrade remains a proposal until accepted and preserves records", async t => {
  const { db, user, input, adaptive, today } = fixture(t);
  const saved = db.snapshot(user.id);
  createGoal(saved.data, input, today, "essay");
  db.save(user.id, saved.data, saved.revision, "web", "Existing goal");
  const previousAction = db.snapshot(user.id).data.actions[0].id;
  const service = new Service(db, researched(async (_config, _instructions, _context, schema) => schema.parse({
    reply: "Review this updated plan.", summary: "Connect your existing goal to an adaptive plan", execution: "apply", methods: [],
    changes: [{ entity: "plan", operation: "update", id: null, parentId: "essay", reason: "Make the existing approach executable.",
      values: JSON.stringify({ action: input.action, criterion: input.criterion, timing: input.timing, basis: input.basis, adaptive }) }],
  })), literature);
  const result = await service.chat(user.id, "Prepare an updated plan", "essay", "web", "adaptive-upgrade");
  assert.equal(result.proposal.status, "pending");
  assert.equal(result.data.goals[0].plans.length, 1);
  await service.approve(user.id, result.proposal.id, "web");
  const updated = db.snapshot(user.id).data;
  assert.equal(updated.goals[0].plans.length, 2);
  assert.equal(updated.actions[0].id, previousAction);
  assert.equal(updated.goals[0].results[0].value, 0);
});

test("an automatic assessment does not block check-ins and discards a stale recommendation", async t => {
  const { db, user, input, adaptive, today } = fixture(t);
  const saved = db.snapshot(user.id);
  adaptive.assessment.at = new Date(Date.now() - 60000).toISOString();
  createGoal(saved.data, { ...input, adaptive }, today, "essay");
  db.save(user.id, saved.data, saved.revision, "web", "Started plan");
  let entered!: () => void;
  let release!: () => void;
  const waiting = new Promise<void>(resolve => { entered = resolve; });
  const resume = new Promise<void>(resolve => { release = resolve; });
  const service = new Service(db, async (_config, _instructions, _context, schema) => {
    entered();
    await resume;
    return schema.parse({ reply: "Keep the approach and collect another observation.", summary: "More evidence is needed", changes: [], methods: [], nextAssessmentAt: new Date(Date.now() + 3600000).toISOString() });
  }, literature);
  const need = assessmentDue(db.snapshot(user.id).data, "essay")!;
  const reviewing = service.chat(user.id, need.reason, "essay", "job", "automatic-assessment", undefined, undefined, { key: need.key });
  await waiting;
  const fresh = db.snapshot(user.id);
  fresh.data.actions[0].outcome = "Done";
  const update = await Promise.race([
    service.update(user.id, fresh.data, fresh.revision, "check-in-during-review"),
    new Promise<never>((_, reject) => { const timer = setTimeout(() => reject(new Error("Check-in was blocked by the model")), 1000); timer.unref(); }),
  ]);
  assert.equal(update.data.actions[0].outcome, "Done");
  release();
  await assert.rejects(reviewing, /changed|stale/i);
  assert.equal(service.listProposals(user.id).length, 0);
});

test("chosen assessments run without a phone connection and do not repeatedly review unchanged evidence", async t => {
  const { db, user, input, adaptive, today } = fixture(t);
  adaptive.assessment.at = new Date(Date.now() - 60000).toISOString();
  const state = db.snapshot(user.id);
  createGoal(state.data, { ...input, adaptive }, today, "essay");
  db.save(user.id, state.data, state.revision, "web", "Plan accepted");
  let calls = 0;
  const service = new Service(db, async (_config, _instructions, context: any, schema) => {
    calls++;
    assert.equal(context.automaticAssessment, true);
    return schema.parse({ reply: "Your first check-in will inform this experiment.", summary: "Waiting for your first observation", changes: [], methods: [], nextAssessmentAt: null });
  }, literature);
  const worker = new PlanWorker(service);
  await worker.tick();
  await worker.tick();
  assert.equal(calls, 1);
  assert.equal(db.snapshot(user.id).data.messages.filter(m => m.role === "user").length, 0);
  assert.match(db.snapshot(user.id).data.goals[0].assessment!.summary!, /first check-in/);
});

test("the coach can test feasibility without saving the trial plan", async t => {
  const { db, user, input, adaptive, today } = fixture(t);
  const state = db.snapshot(user.id);
  createGoal(state.data, { ...input, adaptive }, today, "essay");
  db.save(user.id, state.data, state.revision, "web", "Accepted plan");
  const trial = structuredClone(adaptive);
  trial.steps[0].durationMinutes = 120;
  let calls = 0;
  const service = new Service(db, async (_config, _instructions, context: any, schema) => {
    calls++;
    assert.equal(db.snapshot(user.id).data.goals[0].plans.length, 1);
    if (calls === 1) return schema.parse({ reply: "Checking fit", summary: "Check fit", changes: [], methods: [], planCheck: [{
      entity: "plan", operation: "update", id: null, parentId: "essay", reason: "Test available capacity",
      values: JSON.stringify({ action: input.action, criterion: input.criterion, timing: input.timing, adaptive: trial }),
    }] });
    assert.equal(context.planningChecks.feasible, false);
    assert.match(context.planningChecks.issue, /capacity/);
    return schema.parse({ reply: "The larger session does not fit your available time.", summary: "Keep the smaller session", changes: [], methods: [] });
  }, literature);
  await service.chat(user.id, "Would a longer session fit?", "essay");
  assert.equal(calls, 2);
  assert.equal(service.listProposals(user.id).length, 0);
  assert.equal(db.snapshot(user.id).data.goals[0].plans[0].adaptive!.steps[0].durationMinutes, 25);
});

test("automatic scheduling maintenance preserves its change and does not invent a check-in", async t => {
  const { db, user, input, adaptive, today } = fixture(t);
  adaptive.assessment.at = new Date(Date.now() - 60000).toISOString();
  const state = db.snapshot(user.id);
  createGoal(state.data, { ...input, adaptive }, today, "essay");
  db.save(user.id, state.data, state.revision, "web", "Accepted plan");
  const actionId = db.snapshot(user.id).data.actions[0].id;
  const service = new Service(db, async (_config, _instructions, _context, schema) => schema.parse({
    reply: "The session fits after lunch, within the time you already agreed.", summary: "Clarified the unbooked session cue", changes: [{
      entity: "action", operation: "update", id: actionId, parentId: null, reason: "Use the available afternoon window",
      values: JSON.stringify({ timing: "After lunch" }),
    }], methods: [], nextAssessmentAt: null,
  }), literature);
  await new PlanWorker(service).tick();
  const saved = db.snapshot(user.id).data;
  assert.equal(saved.actions[0].timing, "After lunch");
  assert.equal(saved.actions[0].outcome, undefined);
  assert.equal(saved.goals[0].plans.length, 1);
  assert.equal(service.listProposals(user.id)[0].status, "applied");
});

test("previewing an upgrade is read-only, and stale worker jobs can be scheduled again", async t => {
  const { db, user, input, adaptive, today } = fixture(t);
  const state = db.snapshot(user.id);
  createGoal(state.data, input, today, "essay");
  db.save(user.id, state.data, state.revision, "web", "Legacy goal");
  const service = new Service(db);
  const worker = new PlanWorker(service);
  worker.ensureJobs(user.id);
  db.sql.prepare("UPDATE jobs SET status='cancelled' WHERE kind='plan-review'").run();
  worker.ensureJobs(user.id);
  assert.equal(worker.status(user.id)[0].status, "pending");
  const proposal = service.propose(user.id, [{ entity: "plan", operation: "update", id: null, parentId: "essay", reason: "Make the plan executable",
    values: JSON.stringify({ action: input.action, criterion: input.criterion, timing: input.timing, adaptive }),
  }], "An adaptive plan", "web", "essay");
  const before = db.snapshot(user.id);
  const preview = service.previewPlan(user.id, proposal.id);
  assert.equal(preview.forecasts[0].forecast.method, "none");
  assert.deepEqual(db.snapshot(user.id), before);
  assert.equal(service.listProposals(user.id)[0].status, "pending");
});

test("a check-in supersedes a stale recommendation and schedules a fresh assessment", async t => {
  const { db, user, input, adaptive, today } = fixture(t);
  const state = db.snapshot(user.id);
  createGoal(state.data, { ...input, adaptive }, today, "essay");
  db.save(user.id, state.data, state.revision, "web", "Accepted plan");
  const service = new Service(db);
  const worker = new PlanWorker(service);
  service.onChanged = () => worker.ensureJobs(user.id);
  const proposal = service.propose(user.id, [{ entity: "plan", operation: "update", id: null, parentId: "essay", reason: "Adapt to reported work",
    values: JSON.stringify({ action: input.action, criterion: input.criterion, timing: input.timing, adaptive }),
  }], "A proposed revision", "web", "essay");
  const updated = db.snapshot(user.id);
  updated.data.actions[0].outcome = "Partly";
  await service.update(user.id, updated.data, updated.revision, "new-report");
  assert.equal(service.listProposals(user.id).find(p => p.id === proposal.id)!.status, "stale");
  assert.ok(worker.status(user.id).some(job => job.status === "pending"));
});

test("a shared conversation records a focused check-in while retaining other goals and safe inline references", async t => {
  const { db, user, input, today } = fixture(t);
  const state = db.snapshot(user.id);
  createGoal(state.data, input, today, "essay");
  createGoal(state.data, { ...input, title: "Second essay" }, today, "second");
  state.data.memories.push({ id: "morning", text: "I work best after breakfast", date: today });
  db.save(user.id, state.data, state.revision, "web", "Fixture");
  const actionId = state.data.actions[0].id;
  const service = new Service(db, async (_config, instructions, context: any, schema) => {
    assert.match(instructions, /behavioral coach, not the user's domain strategist/);
    assert.equal(context.selectedGoalId, "essay");
    assert.equal(context.allGoalContexts.length, 2);
    return schema.parse({ reply: "Your essay update is saved. After breakfast remains something to test.", summary: "Save your reported action", methods: [], execution: "apply",
      changes: [{ entity: "action", operation: "update", id: actionId, parentId: null, values: JSON.stringify({ outcome: "Partly", note: "Work ran late" }), reason: "You reported partial completion." }],
      references: [{ text: "essay", recordId: "essay" }, { text: "After breakfast", recordId: "morning" }, { text: "saved", recordId: "foreign" }],
    });
  });
  const result = await service.chat(user.id, "I partly finished the essay action today; work ran late.", "general", "web", "shared-checkin", undefined, undefined, undefined, "essay");
  assert.equal(result.data.conversations.at(-1).goalId, "general");
  assert.equal(result.data.actions[0].outcome, "Partly");
  assert.equal(result.data.goals[0].milestones[0].done, false);
  assert.equal(result.data.messages.at(-1).goalId, "essay");
  assert.equal(result.data.decisions.at(-1).goalId, "essay");
  assert.equal(result.data.messages.at(-1).references.length, 2);
  assert.equal(result.data.messages.at(-1).references[1].recordId, "morning");
});
