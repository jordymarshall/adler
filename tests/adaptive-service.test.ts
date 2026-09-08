import { reviewed } from "./planning-fixture.ts";
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
  const service = new Service(db, reviewed(async (_config, _instructions, _context, schema) => {
    entered();
    await resume;
    return schema.parse({ reply: "Keep the approach and collect another observation.", summary: "More evidence is needed", changes: [], methods: [], nextAssessmentAt: new Date(Date.now() + 3600000).toISOString() });
  }), literature);
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
  const service = new Service(db, reviewed(async (_config, _instructions, context: any, schema) => {
    calls++;
    assert.equal(context.automaticAssessment, true);
    return schema.parse({ reply: "Your first check-in will inform this experiment.", summary: "Waiting for your first observation", changes: [], methods: [], nextAssessmentAt: null });
  }), literature);
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
  const service = new Service(db, reviewed(async (_config, _instructions, context: any, schema) => {
    calls++;
    assert.equal(db.snapshot(user.id).data.goals[0].plans.length, 1);
    if (calls === 1) return schema.parse({ reply: "Checking fit", summary: "Check fit", changes: [], methods: [], planCheck: [{
      entity: "plan", operation: "update", id: null, parentId: "essay", reason: "Test available capacity",
      values: JSON.stringify({ action: input.action, criterion: input.criterion, timing: input.timing, adaptive: trial }),
    }] });
    assert.equal(context.planningChecks.feasible, false);
    assert.match(context.planningChecks.issue, /capacity/);
    return schema.parse({ reply: "The larger session does not fit your available time.", summary: "Keep the smaller session", changes: [], methods: [] });
  }), literature);
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
  const service = new Service(db, reviewed(async (_config, _instructions, _context, schema) => schema.parse({
    reply: "The session fits after lunch, within the time you already agreed.", summary: "Clarified the unbooked session cue", changes: [{
      entity: "action", operation: "update", id: actionId, parentId: null, reason: "Use the available afternoon window",
      values: JSON.stringify({ timing: "After lunch" }),
    }], methods: [], nextAssessmentAt: null,
  })), literature);
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
  }], "An adaptive plan", "web", "essay", undefined, true);
  const before = db.snapshot(user.id);
  const preview = service.previewPlan(user.id, proposal.id);
  assert.equal(preview.execution[0].current?.label, adaptive.window.label);
  assert.ok(preview.execution[0].summary.planned > 0);
  assert.equal("forecasts" in preview, false);
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
  }], "A proposed revision", "web", "essay", undefined, true);
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
  const service = new Service(db, reviewed(async (_config, instructions, context: any, schema) => {
    assert.match(instructions, /behavioral coach, not the user's domain strategist/);
    assert.equal(context.selectedGoalId, "essay");
    assert.equal(context.allGoalContexts.length, 2);
    return schema.parse({ reply: "Your essay update is saved. After breakfast remains something to test.", summary: "Save your reported action", methods: [], execution: "apply",
      changes: [{ entity: "action", operation: "update", id: actionId, parentId: null, values: JSON.stringify({ outcome: "Partly", note: "Work ran late" }), reason: "You reported partial completion." }],
      references: [{ text: "essay", recordId: "essay" }, { text: "After breakfast", recordId: "morning" }, { text: "saved", recordId: "foreign" }],
    });
  }));
  const result = await service.chat(user.id, "I partly finished the essay action today; work ran late.", "general", "web", "shared-checkin", undefined, undefined, undefined, "essay");
  assert.equal(result.data.conversations.at(-1).goalId, "general");
  assert.equal(result.data.actions[0].outcome, "Partly");
  assert.equal(result.data.goals[0].milestones[0].done, false);
  assert.equal(result.data.messages.at(-1).goalId, "essay");
  assert.equal(result.data.decisions.at(-1).goalId, "essay");
  assert.equal(result.data.messages.at(-1).references.length, 2);
  assert.equal(result.data.messages.at(-1).references[1].recordId, "morning");
});

test("switching goals within shared chat attributes learning to the affected records and links newly saved evidence", async t => {
  const { db, user, input, today } = fixture(t);
  const state = db.snapshot(user.id);
  createGoal(state.data, input, today, "essay");
  createGoal(state.data, { ...input, title: "Publish a collection", measure: { label: "Published pieces", unit: "pieces", target: 10, baseline: 0, aggregation: "cumulative" } }, today, "collection");
  const collection = state.data.goals[1];
  collection.plans.push({ ...collection.plans[0], version: 2 });
  state.data.conversations.push({ id: "shared", title: "Shared coach", goalId: "general", createdAt: new Date().toISOString() });
  state.data.messages.push({ id: "earlier", conversationId: "shared", goalId: "general", role: "user", text: "I want to work on the collection." });
  db.save(user.id, state.data, state.revision, "web", "Fixture");
  let count = 0;
  const service = new Service(db, reviewed(async (_config, _instructions, context: any, schema) => {
    assert.equal(context.conversation.find((m: any) => m.text === "I want to work on the collection.")?.id, "earlier");
    const mixed = count++ > 0;
    const discussion = count > 2;
    return schema.parse({ reply: "Your collection result is saved alongside your earlier note.", summary: "Save reported progress", methods: [], execution: "apply",
      changes: discussion ? [] : mixed ? state.data.actions.map(a => ({ entity: "action", operation: "update", id: a.id, parentId: null, values: JSON.stringify({ outcome: "Done" }), reason: "You reported both actions done." })) : [{ entity: "result", operation: "create", id: "new-result", parentId: "collection", values: JSON.stringify({ value: 2, date: today, source: "User confirmed two pieces published" }), reason: "Your report" }],
      references: [{ text: "collection result", recordId: "new-result" }, { text: "earlier note", recordId: "earlier" }],
    });
  }));
  const result = await service.chat(user.id, "For the collection, two pieces are published today.", "general", "web", "switch-goal", undefined, "shared", undefined, "essay");
  assert.equal(result.data.messages.at(-1).goalId, "collection");
  assert.equal(result.data.decisions.at(-1).goalId, "collection");
  assert.equal(result.data.decisions.at(-1).planVersion, 2);
  assert.deepEqual(result.data.messages.at(-1).references.map((r: any) => r.recordId), ["new-result", "earlier"]);
  const mixed = await service.chat(user.id, "Both goals’ planned actions are done today.", "general", "web", "mixed-goal", undefined, "shared", undefined, "essay");
  assert.equal(mixed.data.decisions.at(-1).goalId, "general");
  assert.equal(mixed.data.decisions.at(-1).planVersion, 0);
  const discussion = await service.chat(user.id, "Let’s discuss what is blocking the collection, without changing anything yet.", "general", "web", "discuss-other-goal", undefined, "shared", undefined, "essay");
  assert.equal(discussion.data.decisions.at(-1).goalId, "collection");
  assert.equal(discussion.data.messages.at(-1).goalId, "collection");
  assert.equal(discussion.data.decisions.at(-1).planVersion, 2);
});

test("an invented comparison source receives repair feedback before a repeating plan is saved", async t => {
  const { db, user, input, adaptive } = fixture(t);
  let attempts = 0;
  const service = new Service(db, researched(async (_config, _instructions, context: any, schema) => {
    attempts++;
    if (attempts === 2) assert.match(context.validationError, /starting comparison must cite existing source/);
    const candidate = structuredClone(adaptive);
    if (attempts === 1) {
      candidate.experiment!.comparisonStatus = "reported";
      candidate.experiment!.comparisonSourceIds = ["foreign-source"];
    }
    return schema.parse({ reply: "Review the trial with an unknown starting comparison.", summary: "An outline trial", execution: "apply", methods: [], changes: [{
      entity: "goal", operation: "create", id: "essay", parentId: null, values: JSON.stringify({ ...input, adaptive: candidate }), reason: "You asked for this goal.",
    }] });
  }), literature);
  const result = await service.chat(user.id, "Create a trial", "general", "web", "comparison-source");
  assert.equal(attempts, 2);
  assert.equal(result.data.goals[0].plans[0].adaptive.experiment.comparisonStatus, "unknown");
});

test("new coach recurrences receive repair feedback without changing older plan validation", async t => {
  const { db, user, input, adaptive } = fixture(t);
  let attempts = 0;
  const service = new Service(db, researched(async (_config, _instructions, context: any, schema) => {
    attempts++;
    if (attempts === 2) assert.match(context.validationError, /visits only one weekday/);
    const candidate = structuredClone(adaptive);
    if (attempts === 1) candidate.steps[0].recurrence = { everyDays: 7, weekdays: [1, 3], until: candidate.window.end };
    return schema.parse({ reply: "Review the actual dated work.", summary: "A dated trial", execution: "apply", methods: [], changes: [{ entity: "goal", operation: "create", id: "essay", parentId: null, values: JSON.stringify({ ...input, adaptive: candidate }), reason: "You asked for this trial." }] });
  }), literature);
  await service.chat(user.id, "Create my trial", "general", "web", "recurrence-repair");
  assert.equal(attempts, 2);
});

test("legacy proposal forecasts leave model inputs without mutating stored commands or snapshots", async () => {
  const { coachingProposal } = await import("../server/service.ts");
  const proposal = { id: "legacy", summary: "Old plan", status: "pending", expires: Date.now() + 1000, channel: "web" as const, goalId: "essay",
    changes: [{ entity: "plan" as const, operation: "update" as const, id: null, parentId: "essay", reason: "Earlier proposal", values: JSON.stringify({ adaptive: { forecast: { method: "observed-rate" }, approach: "Make starting easier" } }) }],
    before: [{ plans: [{ adaptive: { forecast: { method: "observed-rate" } } }], forecasts: [{ expectedDate: "2026-12-01" }] }],
  };
  const clean = coachingProposal(proposal);
  assert.equal(JSON.stringify(clean).includes("forecast"), false);
  assert.equal(JSON.parse(clean.changes[0].values).adaptive.approach, "Make starting easier");
  assert.ok(proposal.before[0].forecasts);
  assert.ok(JSON.parse(proposal.changes[0].values).adaptive.forecast);
});

test("learning reviews repair unsupported results and retain a prospective prediction across reviews", async t => {
  const { db, user, today, input, adaptive } = fixture(t);
  const saved = db.snapshot(user.id);
  createGoal(saved.data, { ...input, adaptive }, today, "essay");
  saved.data.actions[0].outcome = "Partly";
  saved.data.actions[0].note = "I hesitated before starting.";
  const actionId = saved.data.actions[0].id;
  db.save(user.id, saved.data, saved.revision, "web", "Starting observation");
  let recordId: string | undefined, previousInsightId: string | null = null, attempts = 0;
  const source = (await literature(["monitoring"])).sources[0];
  const sources = [...adaptive.reasoning!.researchSourceIds, source.id];
  const service = new Service(db, researched(async (_config, _instructions, context: any, schema) => {
    if (recordId) attempts++;
    if (attempts === 2) assert.match(context.validationError, /user-reported evidence/);
    return schema.parse({ reply: "The outline may help you start. Its effect is still uncertain.", summary: "Learn from your report", methods: [], changes: [], insights: [{
      finding: recordId ? "You reported starting after the outline." : "You reported hesitation before starting.", status: "Reported", sourceIds: recordId ? [context.currentMessageId] : [actionId], changeIndexes: [],
      learning: { recordId, goalIds: ["essay"], reasoning: { ...adaptive.reasoning!, researchSourceIds: sources }, hypothesis: "A visible starting point may reduce hesitation.", experiment: "Write the outline before drafting.",
        result: recordId ? { summary: "You started drafting after the outline.", sourceIds: [attempts === 1 ? "essay" : context.currentMessageId] } : null,
        review: recordId ? { exposure: "used", mechanism: null, behavior: "You reported starting.", outcome: null, confounds: ["Task and available time may differ."], decision: "keep", standing: "consistent", nextReviewAfter: null } : undefined,
        insight: recordId ? "The outline may make starting easier; further reports can change this interpretation." : null,
        nextHypothesis: recordId ? "Would a shorter outline help on busy days?" : null,
        previousInsightId, researchSourceIds: sources },
    }] });
  }), literature);
  const proposed = await service.chat(user.id, "Help me try an outline before drafting", "essay", "web", "prepare-learning");
  recordId = proposed.data.learning[0].id;
  await service.learningAction(user.id, recordId!, 1, "agree", "agree-learning");
  const prediction = proposed.data.learning[0].versions[0].test.prediction;
  const first = await service.chat(user.id, "I used the outline and started drafting", "essay", "web", "first-learning");
  assert.equal(attempts, 2);
  const decision = first.data.decisions.at(-1)!;
  assert.ok(decision.researchSources!.some(s => s.id === source.id && s.summary === source.summary));
  assert.ok(decision.researchClaims!.some(c => c.id === "claim:implementation-if-then"));
  assert.equal(first.data.learning[0].reviews.length, 1);
  assert.equal(first.data.learning[0].versions[0].test.prediction, prediction);
  previousInsightId = `${decision.id}-0`;
  const second = await service.chat(user.id, "I used the outline again and started another draft", "essay", "web", "next-learning");
  assert.equal(second.data.decisions.at(-1)!.insights![0].learning!.previousInsightId, previousInsightId);
  assert.equal(second.data.learning.length, 1);
  assert.equal(second.data.learning[0].reviews.length, 2);
  assert.equal(second.data.learning[0].versions.length, 1);
});

for (const invalid of ["research", "conclusion", "predecessor"] as const) test(`learning reviews reject a fabricated ${invalid} and allow genuinely pending stages`, async t => {
  const { db, user, today, input, adaptive } = fixture(t);
  const saved = db.snapshot(user.id);
  createGoal(saved.data, { ...input, adaptive }, today, "essay");
  const actionId = saved.data.actions[0].id;
  saved.data.actions[0].outcome = "Partly";
  db.save(user.id, saved.data, saved.revision, "web", "Reported starting friction");
  let attempts = 0;
  const service = new Service(db, researched(async (_config, _instructions, context: any, schema) => {
    attempts++;
    if (attempts === 2) assert.match(context.validationError, invalid === "research" ? /research sources/ : invalid === "conclusion" ? /user-reported evidence/ : /existing insight/);
    return schema.parse({ reply: "Let’s test a smaller starting point.", summary: "A question to test", methods: [], changes: [], insights: [{
      finding: "You started but did not finish.", status: "Reported", sourceIds: [actionId], changeIndexes: [],
      learning: { goalIds: ["essay"], reasoning: adaptive.reasoning, hypothesis: "A smaller start may help.", experiment: "Try three points.", result: null,
        insight: attempts === 1 && invalid === "conclusion" ? "This worked." : null, nextHypothesis: null,
        previousInsightId: attempts === 1 && invalid === "predecessor" ? "invented-0" : null,
        researchSourceIds: attempts === 1 && invalid === "research" ? [...adaptive.reasoning!.researchSourceIds, "invented-study"] : adaptive.reasoning!.researchSourceIds },
    }] });
  }), literature);
  const result = await service.chat(user.id, "Review what to try", "essay", "web", `pending-${invalid}`);
  assert.equal(attempts, 2);
  assert.equal(result.data.decisions.at(-1)!.insights![0].learning!.result, null);
  assert.equal(result.data.decisions.at(-1)!.insights![0].learning!.insight, null);
});

test("the shared coach reads the research and repairs a recommendation whose valid citations do not support its mechanism", async t => {
  const { db, user, input, adaptive, today } = fixture(t);
  const state = db.snapshot(user.id);
  createGoal(state.data, { ...input, adaptive }, today, "essay");
  db.save(user.id, state.data, state.revision, "web", "Chosen writing goal");
  let recommendations = 0, reviews = 0;
  const service = new Service(db, async (_config, instructions, context: any, schema) => {
    if (context.task === "review-plan") {
      reviews++;
      assert.match(context.behavioralResearch.synthesis, /P24. Structural constraints/);
      assert.ok(context.methodologyReadings.some((reading: { id: string }) => reading.id === "deep/structural-limits.md"));
      return schema.parse({ issues: reviews === 1 ? [{ changeIndex: 0, issue: "The source does not show that reminders overcome a fixed time constraint.", correction: "Check for a viable opportunity or offer to park the work; do not infer low motivation." }] : [] });
    }
    assert.match(instructions, /BEHAVIORAL SCIENCE IS AN INPUT/);
    assert.equal(context.coachingFramework.researchCommit, "472e979");
    if (!context.methodologyReadings.length) return schema.parse({ reply: "I’m checking the research on fixed constraints.", summary: "Read the structural constraints evidence", methods: [], changes: [], methodologyRequests: ["deep/structural-limits.md"], researchQueries: ["implementation intentions structural constraints"] });
    assert.equal(context.researchSearches.length, 1, "Owned research and literature can be read in the same turn");
    recommendations++;
    if (recommendations === 2) assert.match(context.validationError, /fixed time constraint/);
    const reasoning = { ...adaptive.reasoning!, principleIds: ["P2", "P24"], researchSourceIds: ["method:implementation", "adler:P2", "adler:P24", "curated:implementation-if-then"],
      barrier: { domain: "opportunity", status: "reported", explanation: "Caregiving displaced the intended work time.", sourceIds: [context.currentMessageId] },
      mechanism: recommendations === 1 ? "Reminders solve the missing time." : "A cue helps initiation only if the chosen opportunity is viable.",
      fit: "First establish whether an available window exists; parking the goal is a valid option.",
    };
    return schema.parse({ reply: "Caregiving displaced the window. Is there another window you would choose, or would parking the work fit better?", summary: "Check the opportunity before changing the cue", methods: ["implementation"], changes: [], insights: [{ finding: "Caregiving took the time set aside for writing.", status: "Reported", sourceIds: [context.currentMessageId], changeIndexes: [], learning: {
      goalIds: ["essay"], reasoning, hypothesis: "A reliable cue may help only after a viable window is identified.", experiment: "First check whether a different opportunity exists.", result: null, insight: null, nextHypothesis: null, previousInsightId: null, researchSourceIds: reasoning.researchSourceIds,
    } }] });
  }, literature);
  const result = await service.chat(user.id, "Caregiving took the time I had set aside for writing.", "essay", "web", "framework-fit");
  assert.equal(recommendations, 2);
  assert.equal(reviews, 2);
  assert.match(result.data.decisions.at(-1)!.insights![0].learning!.reasoning!.mechanism, /only if/);
  assert.ok(result.data.decisions.at(-1)!.researchSources!.some(source => source.id === "adler:P24"));
  assert.deepEqual(result.data.decisions.at(-1)!.methodologyReadings, ["deep/structural-limits.md"]);
  assert.equal(result.data.goals[0].plans.length, 1, "Reading and reflection must not change chosen work");
});
