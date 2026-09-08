import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Database } from "../server/database.ts";
import { Service } from "../server/service.ts";
import { adaptiveWorkspace, adaptiveFixture } from "./adaptive-fixture.ts";
import { researched, literature, basis } from "./planning-fixture.ts";
import { dateInZone } from "../shared/journey.ts";
import { coachingContext } from "../src/coach-context.ts";
import {
  saveLearning,
  reconcileLearning,
  applyLearningAction,
} from "../server/learning.ts";
import { currentLearningVersion } from "../shared/learning.ts";
import type { CoachInsight } from "../src/program-types.ts";

test("accepting an adjustment preserves its prospective prediction and a corrected report reopens its evidence", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "adler-learning-"));
  const db = new Database(directory);
  t.after(() => {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  });
  const user = db.createUser("learning", "a-long-test-password", "UTC");
  db.setSecret(user.id, "model-choice", {
    provider: "gemini",
    model: "fixture",
    useServer: false,
  });
  db.setSecret(user.id, "model-gemini", { key: "fixture-only" });
  const today = dateInZone("UTC");
  const data = adaptiveWorkspace(adaptiveFixture(today, today));
  data.memories.push({
    id: "quiet-breakfast",
    date: today,
    text: "Breakfast is usually a quiet time for writing.",
  });
  db.save(user.id, data, 0, "web", "Existing work");
  const plan = adaptiveFixture(today, today);
  plan.reasoning!.barrier = {
    domain: "opportunity",
    status: "reported",
    explanation: "You report a quiet window after breakfast.",
    sourceIds: ["quiet-breakfast"],
  };
  const service = new Service(
    db,
    researched(async (_config, _instructions, _context, schema) =>
      schema.parse({
        reply: "Try your writing session after breakfast.",
        summary: "Try the available writing window",
        methods: ["implementation"],
        changes: [
          {
            entity: "plan",
            operation: "update",
            id: null,
            parentId: "essay",
            reason: "Use the quiet window you described.",
            values: JSON.stringify({
              action: plan.steps[0].title,
              timing: plan.steps[0].cue,
              criterion: plan.steps[0].criterion,
              adaptive: plan,
              basis: { ...basis, review: { ...basis.review, date: today } },
            }),
          },
        ],
      }),
    ),
    literature,
  );
  const proposed = await service.chat(
    user.id,
    "Help me adjust my writing window",
    "essay",
    "web",
    "learning-proposal",
  );
  assert.equal(proposed.data.learning.length, 1);
  const hypothesis = proposed.data.learning[0];
  assert.equal(hypothesis.state, "suggested");
  assert.equal(
    hypothesis.versions[0].test.prediction,
    plan.reasoning!.prediction,
  );
  const accepted = await service.approve(user.id, proposed.proposal.id, "sms");
  assert.equal(accepted.data.learning[0].state, "agreed");
  assert.equal(accepted.data.learning[0].standing, "untested");
  assert.equal(accepted.data.learning[0].reviews.length, 0);
  assert.deepEqual(accepted.data.learning[0].versions, hypothesis.versions);
  await service.approve(user.id, proposed.proposal.id, "web");
  assert.equal(db.snapshot(user.id).data.learning!.length, 1);
  const corrected = db.snapshot(user.id);
  corrected.data.memories[0].text =
    "Breakfast is no longer quiet; I now take an early meeting.";
  const saved = await service.update(
    user.id,
    corrected.data,
    corrected.revision,
    "correct-breakfast",
  );
  assert.equal(saved.data.learning[0].standing, "reconsider");
  assert.equal(
    saved.data.learning[0].invalidations[0].sourceId,
    "quiet-breakfast",
  );
  assert.equal(
    saved.data.learning[0].versions[0].test.prediction,
    plan.reasoning!.prediction,
  );
});

test("declining a revision keeps the previously agreed hypothesis current", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "adler-learning-revision-"));
  const db = new Database(directory);
  t.after(() => {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  });
  const user = db.createUser("revisions", "a-long-test-password", "UTC");
  db.setSecret(user.id, "model-choice", {
    provider: "gemini",
    model: "fixture",
    useServer: false,
  });
  db.setSecret(user.id, "model-gemini", { key: "fixture-only" });
  const today = dateInZone("UTC"),
    data = adaptiveWorkspace(adaptiveFixture(today, today));
  db.save(user.id, data, 0, "web", "Existing goal");
  let recordId: string | undefined;
  const service = new Service(
    db,
    researched(async (_config, _instructions, _context, schema) => {
      const adaptive = adaptiveFixture(today, today);
      if (recordId)
        adaptive.reasoning!.prediction =
          "A smaller starting point may be easier to begin.";
      const test = {
        change: adaptive.approach,
        design: "prospective",
        prediction: adaptive.reasoning!.prediction,
        comparison: "No comparison yet",
        start: today,
        reviewAfter: today,
        reviewRule: adaptive.reasoning!.reviewRule,
        mechanismSignal: null,
        behaviorSignal: "Whether you start",
        outcomeSignal: null,
        alternatives: ["Available time may change"],
      };
      return schema.parse({
        reply: "Try this writing setup.",
        summary: "A writing setup to consider",
        methods: ["implementation"],
        changes: [
          {
            entity: "plan",
            operation: "update",
            id: null,
            parentId: "essay",
            reason: "Consider the setup",
            values: JSON.stringify({
              action: adaptive.steps[0].title,
              criterion: adaptive.steps[0].criterion,
              timing: adaptive.steps[0].cue,
              adaptive,
              basis: { ...basis, review: { ...basis.review, date: today } },
            }),
          },
        ],
        insights: [
          {
            finding: "No starting comparison yet",
            status: "To test",
            sourceIds: [
              (_context as { currentMessageId: string }).currentMessageId,
            ],
            changeIndexes: [0],
            learning: {
              recordId,
              goalIds: ["essay"],
              reasoning: adaptive.reasoning,
              hypothesis: adaptive.reasoning!.prediction,
              experiment: adaptive.approach,
              test,
              result: null,
              insight: null,
              nextHypothesis: null,
              previousInsightId: null,
              researchSourceIds: adaptive.reasoning!.researchSourceIds,
            },
          },
        ],
      });
    }),
    literature,
  );
  const first = await service.chat(
    user.id,
    "Help me with a setup",
    "essay",
    "web",
    "revision-first",
  );
  await service.approve(user.id, first.proposal!.id, "web");
  recordId = first.data.learning[0].id;
  const before = db.snapshot(user.id).data.learning[0];
  const revised = await service.chat(
    user.id,
    "Suggest another setup",
    "essay",
    "web",
    "revision-second",
  );
  await service.reject(user.id, revised.proposal!.id);
  const saved = db.snapshot(user.id).data.learning[0];
  assert.equal(saved.state, "agreed");
  assert.equal(saved.activeVersion, 1);
  assert.equal(saved.pendingVersion, undefined);
  assert.equal(
    saved.versions.length,
    2,
    "The declined suggestion stays in history",
  );
  assert.equal(
    saved.versions[0].test.prediction,
    before.versions[0].test.prediction,
  );
});

test("actual advice-only text is reviewed and an unavailable coach retains a report exactly once", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "adler-advice-")),
    db = new Database(directory);
  t.after(() => {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  });
  const user = db.createUser("advice", "a-long-test-password", "UTC");
  db.setSecret(user.id, "model-choice", {
    provider: "gemini",
    model: "fixture",
    useServer: false,
  });
  db.setSecret(user.id, "model-gemini", { key: "fixture-only" });
  let calls = 0,
    reviews = 0;
  const service = new Service(
    db,
    async (_config, _instructions, context: any, schema) => {
      if (context.task === "review-plan") {
        reviews++;
        assert.equal(
          context.reply,
          "Your missed work means you lack motivation. Try a daily reminder.",
        );
        return schema.parse({ issues: [], needsGrounding: true });
      }
      calls++;
      if (calls > 1)
        assert.match(context.validationError, /substantive advice/);
      return schema.parse({
        reply:
          "Your missed work means you lack motivation. Try a daily reminder.",
        summary: "Advice",
        methods: [],
        changes: [],
      });
    },
  );
  await assert.rejects(
    service.chat(
      user.id,
      "I missed a writing session",
      "general",
      "web",
      "saved-report",
    ),
    /grounded reasoning/,
  );
  assert.equal(reviews, 3, "Every attempted visible reply was reviewed");
  assert.equal(db.snapshot(user.id).data.messages.length, 1);
  assert.equal(db.snapshot(user.id).data.decisions.length, 0);
  await assert.rejects(
    service.chat(
      user.id,
      "A different report",
      "general",
      "web",
      "saved-report",
    ),
    /request ID/,
  );
  const recovered = new Service(db, async (_c, _i, context: any, schema) =>
    schema.parse(
      context.task === "review-plan"
        ? { issues: [] }
        : {
            reply: "What got in the way?",
            summary: "Clarify the obstacle",
            methods: [],
            changes: [],
          },
    ),
  );
  const result = await recovered.chat(
    user.id,
    "I missed a writing session",
    "general",
    "web",
    "saved-report",
  );
  assert.equal(
    result.data.messages.filter((message) => message.role === "user").length,
    1,
  );
  assert.equal(
    result.data.messages.filter((message) => message.role === "coach").length,
    1,
  );
});

test("connected context cannot be saved as a personal report or a reported insight", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "adler-origin-")),
    db = new Database(directory);
  t.after(() => {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  });
  const user = db.createUser("origin", "a-long-test-password", "UTC");
  db.setSecret(user.id, "model-choice", {
    provider: "gemini",
    model: "fixture",
    useServer: false,
  });
  db.setSecret(user.id, "model-gemini", { key: "fixture-only" });
  const service = new Service(db, async (_c, _i, context: any, schema) => {
    assert.equal(context.inputOrigin, "connected");
    assert(!context.reportedSourceIds.includes(context.currentMessageId));
    return schema.parse({
      reply: "Your day was exhausting",
      summary: "Personal observation",
      methods: [],
      changes: [],
      insights: [
        {
          finding: "You were exhausted",
          status: "Reported",
          sourceIds: [context.currentMessageId],
          changeIndexes: [],
        },
      ],
    });
  });
  await assert.rejects(
    service.chat(
      user.id,
      "Calendar: six meetings",
      "general",
      "job",
      "connected-one",
    ),
    /user-reported evidence/,
  );
  assert.equal(db.snapshot(user.id).data.messages.length, 0);
  assert.equal(db.snapshot(user.id).data.decisions.length, 0);
});

test("an explicit correction withdraws a hypothesis without rewriting the original report or requiring a result", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "adler-correction-")),
    db = new Database(directory);
  t.after(() => {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  });
  const user = db.createUser("correction", "a-long-test-password", "UTC");
  db.setSecret(user.id, "model-choice", {
    provider: "gemini",
    model: "fixture",
    useServer: false,
  });
  db.setSecret(user.id, "model-gemini", { key: "fixture-only" });
  const today = dateInZone("UTC"),
    data = adaptiveWorkspace(adaptiveFixture(today, today));
  data.memories.push({
    id: "available",
    date: today,
    text: "Breakfast is quiet every day.",
  });
  db.save(user.id, data, 0, "web", "Fictional goal");
  const adaptive = adaptiveFixture(today, today);
  adaptive.reasoning!.barrier = {
    domain: "opportunity",
    status: "reported",
    explanation: "You report quiet time after breakfast.",
    sourceIds: ["available"],
  };
  const planner = new Service(
    db,
    researched(async (_c, _i, _context, schema) =>
      schema.parse({
        reply: "Try after breakfast.",
        summary: "A quiet window",
        methods: ["implementation"],
        changes: [
          {
            entity: "plan",
            operation: "update",
            id: null,
            parentId: "essay",
            reason: "Use the time you described",
            values: JSON.stringify({
              action: adaptive.steps[0].title,
              criterion: adaptive.steps[0].criterion,
              timing: adaptive.steps[0].cue,
              adaptive,
              basis: { ...basis, review: { ...basis.review, date: today } },
            }),
          },
        ],
      }),
    ),
    literature,
  );
  await planner.chat(
    user.id,
    "Help me plan",
    "essay",
    "web",
    "correction-first",
  );
  const correcting = new Service(db, async (_c, _i, context: any, schema) =>
    schema.parse(
      context.task === "review-plan"
        ? { issues: [] }
        : {
            reply: "Which days have that quiet time?",
            summary: "Reconsider the cue",
            methods: [],
            changes: [],
            evidenceCorrections: [
              {
                sourceId: "available",
                replacementSourceIds: [context.currentMessageId],
                reason:
                  "You corrected the availability behind this suggestion.",
              },
            ],
          },
    ),
  );
  const result = await correcting.chat(
    user.id,
    "Correction: breakfast is only quiet at weekends",
    "essay",
    "sms",
    "correction-second",
  );
  assert.equal(result.data.evidenceCorrections[0].active, true);
  assert.equal(result.data.learning[0].standing, "reconsider");
  assert.equal(result.data.learning[0].versions.length, 1);
  assert.equal(result.data.learning[0].reviews.length, 0);
  assert.equal(
    result.data.memories[0].text,
    "Breakfast is quiet every day.",
    "Retain the original account and its correction link",
  );
  assert.ok(
    result.data.learning[0].invalidations[0].replacementSourceIds?.length,
  );
  const saved = db.snapshot(user.id);
  const context = coachingContext(
    saved.data,
    "essay",
    "Review the corrected availability",
    today,
  );
  assert.equal(context.confirmedContext.length, 0);
  assert.deepEqual(
    context.checks.find((check) => check.id === "memory")!.sources,
    [],
  );
  assert.ok(
    !context.checks
      .find((check) => check.id === "memory")!
      .finding.includes("Breakfast is quiet every day"),
  );
  await assert.rejects(
    correcting.learningAction(
      user.id,
      saved.data.learning[0].id,
      1,
      "agree",
      "cannot-accept-stale",
    ),
    /evidence changed/,
  );
  const spoofed = structuredClone(saved.data);
  spoofed.goals[0].plans.at(-1)!.basis = {
    ...basis,
    strategy: "Unsupported new claim",
    sources: [],
  };
  await assert.rejects(
    correcting.update(user.id, spoofed, saved.revision, "unreviewed-science"),
    /shared coach/,
  );
});

test("standalone revisions can be declined or accepted across channels without activating unrelated advice", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "adler-standalone-"));
  const db = new Database(directory);
  t.after(() => {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  });
  const user = db.createUser("standalone", "a-long-test-password", "UTC");
  const today = dateInZone("UTC"),
    adaptive = adaptiveFixture(today, today);
  const data = adaptiveWorkspace(adaptive),
    reasoning = adaptive.reasoning!;
  const insight: CoachInsight = {
    finding: "A setup to try",
    status: "To test",
    sourceIds: [],
    changeIndexes: [],
    learning: {
      goalIds: ["essay"],
      hypothesis: reasoning.fit,
      experiment: "Keep the draft open",
      reasoning,
      researchSourceIds: reasoning.researchSourceIds,
      result: null,
      insight: null,
      nextHypothesis: null,
      previousInsightId: null,
      test: {
        change: "Keep the draft open",
        design: "prospective",
        prediction: reasoning.prediction,
        comparison: "No starting comparison",
        start: today,
        reviewAfter: today,
        reviewRule: reasoning.reviewRule,
        mechanismSignal: null,
        behaviorSignal: "Whether you start",
        outcomeSignal: null,
        alternatives: [reasoning.limitation],
      },
    },
  };
  saveLearning(
    data,
    "first-advice",
    [insight],
    [
      {
        entity: "action",
        operation: "update",
        id: data.actions[0].id,
        parentId: null,
        values: JSON.stringify({ outcome: "Done" }),
      },
    ],
    "unrelated-report",
    true,
  );
  assert.equal(
    data.learning![0].state,
    "suggested",
    "Saving an action report does not accept accompanying advice",
  );
  assert.equal(data.learning![0].versions[0].proposalId, null);
  const beforeStart = structuredClone(data);
  beforeStart.goals[0].status = "Draft";
  reconcileLearning(data, new Date().toISOString(), beforeStart);
  assert.equal(
    data.learning![0].state,
    "suggested",
    "Starting a goal does not accept unrelated standalone advice",
  );
  db.save(user.id, data, 0, "web", "Suggested support");
  const service = new Service(db),
    id = data.learning![0].id;
  await service.learningAction(user.id, id, 1, "agree", "try-first", "sms");
  let state = db.snapshot(user.id);
  insight.learning!.recordId = id;
  insight.learning!.test!.prediction = "A different cue may help";
  saveLearning(state.data, "second-advice", [insight], [], null, false);
  db.save(user.id, state.data, state.revision, "web", "Second suggestion");
  await service.learningAction(
    user.id,
    id,
    2,
    "decline",
    "decline-second",
    "mcp",
  );
  state = db.snapshot(user.id);
  assert.equal(state.data.learning![0].activeVersion, 1);
  assert.equal(state.data.learning![0].pendingVersion, undefined);
  assert.equal(state.data.learning![0].state, "agreed");
  saveLearning(state.data, "third-advice", [insight], [], null, false);
  db.save(user.id, state.data, state.revision, "web", "Third suggestion");
  await service.learningAction(user.id, id, 3, "agree", "accept-third", "sms");
  const final = db.snapshot(user.id).data.learning![0];
  assert.equal(final.activeVersion, 3);
  assert.equal(final.pendingVersion, undefined);
  assert.equal(final.versions.length, 3);
  assert.equal(final.standing, "untested");
  db.setSecret(user.id, "model-choice", {
    provider: "gemini",
    model: "fixture",
    useServer: false,
  });
  db.setSecret(user.id, "model-gemini", { key: "fixture-only" });
  const conversational = new Service(
    db,
    async (_config, _instructions, context: any, schema) => {
      if (context.task === "review-plan") {
        assert.deepEqual(context.learningActions, [
          { id, version: 3, action: "pause" },
        ]);
        return schema.parse({ issues: [] });
      }
      return schema.parse({
        reply: "Paused this test at your request.",
        summary: "Pause the current test",
        methods: [],
        changes: [],
        learningActions: [{ id, version: 3, action: "pause" }],
      });
    },
  );
  await conversational.chat(
    user.id,
    "Pause that test",
    "essay",
    "sms",
    "pause-through-chat",
  );
  const paused = db.snapshot(user.id).data.learning![0];
  assert.equal(paused.state, "paused");
  await conversational.chat(
    user.id,
    "Pause that test",
    "essay",
    "sms",
    "pause-through-chat",
  );
  assert.equal(
    db.snapshot(user.id).data.learning![0].events.length,
    paused.events.length,
  );
});

test("reviewing an old test also preserves the prospective replacement attached to a new plan", () => {
  const today = dateInZone("UTC"),
    adaptive = adaptiveFixture(today, today),
    data = adaptiveWorkspace(adaptive);
  const change = {
    entity: "plan" as const,
    operation: "update" as const,
    id: null,
    parentId: "essay",
    values: JSON.stringify({ adaptive }),
  };
  saveLearning(data, "original", [], [change], "initial-plan", true);
  const record = data.learning![0];
  data.messages.push({
    id: "later-feedback",
    role: "user",
    origin: "user",
    goalId: "essay",
    text: "I tried the cue but was interrupted.",
    at: new Date().toISOString(),
  });
  const next = structuredClone(adaptive);
  next.reasoning!.prediction = "A lunch cue may make it easier to start";
  next.reasoning!.barrier.sourceIds = ["later-feedback"];
  const review: CoachInsight = {
    finding: "The first cue was interrupted",
    status: "To test",
    sourceIds: ["later-feedback"],
    changeIndexes: [0],
    learning: {
      recordId: record.id,
      goalIds: ["essay"],
      hypothesis: record.versions[0].hypothesis,
      experiment: "Review the original cue",
      reasoning: adaptive.reasoning!,
      researchSourceIds: adaptive.reasoning!.researchSourceIds,
      result: {
        summary: "The cue was tried, but the window was interrupted",
        sourceIds: ["later-feedback"],
      },
      insight: "The available window remains uncertain",
      nextHypothesis: null,
      previousInsightId: null,
      review: {
        exposure: "used",
        mechanism: null,
        behavior: "Interrupted",
        outcome: null,
        confounds: ["Meeting timing"],
        decision: "adjust",
        standing: "insufficient",
        nextReviewAfter: null,
      },
    },
  };
  saveLearning(
    data,
    "review-and-adjust",
    [review],
    [{ ...change, values: JSON.stringify({ adaptive: next }) }],
    "new-plan",
    false,
  );
  assert.equal(record.reviews.length, 1);
  assert.equal(record.versions.length, 2);
  assert.equal(record.activeVersion, 1);
  assert.equal(record.pendingVersion, 2);
  assert.equal(record.versions[1].proposalId, "new-plan");
  assert.equal(record.versions[1].test.prediction, next.reasoning!.prediction);
});

test("a new suggestion after an unstarted decline becomes the visible pending version", () => {
  const today = dateInZone("UTC"),
    adaptive = adaptiveFixture(today, today),
    data = adaptiveWorkspace(adaptive);
  saveLearning(
    data,
    "initial",
    [],
    [
      {
        entity: "plan",
        operation: "update",
        id: null,
        parentId: "essay",
        values: JSON.stringify({ adaptive }),
      },
    ],
    null,
    false,
  );
  const record = data.learning![0];
  applyLearningAction(
    data,
    { id: record.id, version: 1, action: "decline" },
    [],
  );
  assert.equal(record.state, "declined");
  const previous = record.versions[0];
  saveLearning(
    data,
    "revised",
    [
      {
        finding: "Another setup to consider",
        status: "To test",
        sourceIds: [],
        changeIndexes: [],
        learning: {
          recordId: record.id,
          goalIds: ["essay"],
          hypothesis: previous.hypothesis,
          experiment: "A revised setup",
          reasoning: previous.reasoning,
          researchSourceIds: previous.reasoning.researchSourceIds,
          test: {
            ...previous.test,
            change: "Open the draft before your chosen session",
          },
          result: null,
          insight: null,
          nextHypothesis: null,
          previousInsightId: null,
        },
      },
    ],
    [],
    null,
    false,
  );
  assert.equal(record.state, "suggested");
  assert.equal(record.standing, "untested");
  assert.equal(currentLearningVersion(record).version, 2);
  assert.equal(record.activeVersion, undefined);
  assert.equal(record.versions.length, 2);
});
