import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Database } from "../server/database.ts";
import { Service } from "../server/service.ts";
import { initialData, startGoal } from "../shared/workspace.ts";
import { coachingContext } from "../src/coach-context.ts";
import { dateInZone } from "../shared/journey.ts";
import { createGoal, validateWorkspace } from "../shared/validation.ts";

test("long intake retains the original goal and later corrections without mixing conversations", () => {
  const data = initialData();
  const original = "Make $100k in side business within one year";
  data.messages = Array.from({ length: 20 }, (_, i) => ({ id: i === 2 ? "correction" : `m${i}`, goalId: "general", conversationId: "intake", role: i % 2 ? "coach" as const : "user" as const, text: i === 0 ? original : i === 2 ? "Actually make it $20k over eighteen months." : `Exchange ${i}`, channel: "web" as const }));
  data.messages.push({ id: "other", goalId: "general", conversationId: "other", role: "user", text: "Unrelated conversation" });
  const context = coachingContext(data, "general", "Make the goal", "2026-09-09", "intake");
  assert.ok(context.conversation.some(message => message.text === original));
  assert.ok(context.conversation.some(message => message.id === "correction"));
  assert.ok(!context.conversation.some(message => message.id === "other"));
  assert.equal(new Set(context.conversation.map(message => message.id)).size, context.conversation.length);
  assert.ok(context.conversation.findIndex(message => message.id === "correction") > context.conversation.findIndex(message => message.text === original));
});

test("an unplanned learning goal has no invented score, baseline or dated measurement", () => {
  const data = initialData();
  createGoal(data, { title: "Learn guitar", kind: "learning", why: "", success: "Play songs I enjoy", status: "Draft", area: "Learning", tags: [], targetDate: "2027-09-08", milestones: [], assessmentTarget: 8, baseline: null, action: "", criterion: "", timing: "" }, "2026-09-08", "guitar");
  assert.equal(data.goals[0].target, undefined);
  assert.equal(data.goals[0].unit, undefined);
  assert.deepEqual(data.goals[0].checkpoints, []);
  assert.deepEqual(data.goals[0].results, []);
  assert.deepEqual(data.actions, []);
  validateWorkspace(data);
  data.goals[0].status = "Active";
  assert.throws(() => validateWorkspace(data), /chosen work|first action/);
});

test("large conversations stay bounded without pinning an obsolete opening above omitted corrections", () => {
  const data = initialData();
  data.messages = Array.from({ length: 1000 }, (_, i) => ({ id: `m${i}`, goalId: "general", conversationId: "long", role: "user" as const, text: i === 0 ? "Make $100k in one year" : i === 2 ? "Change that to $20k over eighteen months" : "x".repeat(4000) }));
  data.messages.push({ id: "latest", goalId: "general", conversationId: "long", role: "user", text: "Use my saved goal, with a $30k target now." });
  const context = coachingContext(data, "general", "Keep the goal", "2026-09-09", "long");
  assert.ok(context.conversation.reduce((sum, message) => sum + message.text.length, 0) <= 84000);
  assert.ok(context.conversationHistory.omittedUserMessages > 0);
  assert.equal(context.conversation.some(message => message.id === "m0"), false);
  assert.equal(context.conversation.at(-1)!.id, "latest");
});

test("the shared coach saves goal intent without inventing work and sends it to the reviewer", async t => {
  const directory = mkdtempSync(join(tmpdir(), "adler-goal-intake-"));
  const db = new Database(directory);
  t.after(() => { db.close(); rmSync(directory, { recursive: true, force: true }); });
  const user = db.createUser("goal-intake", "local-test-password", "UTC");
  db.setSecret(user.id, "model-choice", { provider: "gemini", model: "fixture", useServer: false });
  db.setSecret(user.id, "model-gemini", { key: "fixture-only" });
  const today = dateInZone("UTC"), targetDate = `${Number(today.slice(0, 4)) + 1}${today.slice(4)}`;
  let reviewed = false;
  const service = new Service(db, async (_config, _instructions, context: any, schema) => {
    if (context.task === "review-plan") {
      assert.equal(context.effectiveGoals[0].measure.target, 100000);
      assert.equal(context.effectiveGoals[0].targetDate, targetDate);
      reviewed = true;
      return schema.parse({ issues: [], needsGrounding: false });
    }
    assert.equal(context.validationError, undefined);
    return schema.parse({ reply: "Saved your goal. What work would you like help making time for?", summary: "Save the requested outcome while the work is undecided", execution: "apply", methods: [], changes: [{ entity: "goal", operation: "create", id: "revenue", parentId: null, reason: "You asked to save your revenue goal.", values: JSON.stringify({
      title: "Make $100k in my side business", kind: "project", why: "", success: "Earn $100k within one year", area: "Career", tags: [], targetDate,
      measure: { label: "Revenue", unit: "dollars", target: 100000, baseline: null, aggregation: "cumulative" },
      milestones: [], assessmentTarget: 8, baseline: null, action: "", criterion: "", timing: "",
    }) }] });
  });
  const result = await service.chat(user.id, "Save a goal to make $100k in side business within one year. I have not chosen the work or my schedule yet.", "general", "web", "save-intent");
  assert.ok(reviewed);
  assert.equal(result.data.goals[0].status, "Draft");
  assert.equal(result.data.goals[0].measure.target, 100000);
  assert.equal(result.data.actions.length, 0);
  assert.equal(result.data.learning.length, 0);
  assert.equal(result.data.goals[0].results.length, 0);
  startGoal(result.data, "revenue");
  assert.equal(result.data.goals[0].status, "Draft", "A goal with no chosen work cannot claim its plan has started");
});
