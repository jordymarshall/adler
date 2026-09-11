import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRuntime } from "../server/api.ts";
import { validateWorkspace } from "../shared/validation.ts";
import { dateInZone } from "../shared/journey.ts";
import { learningStatus } from "../shared/learning.ts";
import { buildDemoFixture, DEMO_TIME_ZONE } from "../scripts/demo-fixture.ts";
import { seedDemoAccount } from "../scripts/seed-demo-account.ts";

test("buildDemoFixture builds a workspace that validateWorkspace accepts and shows the required live states", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "adler-fixture-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const runtime = createRuntime(directory);
  t.after(() => runtime.close());

  const user = runtime.db.createUser("fixture-check", "irrelevant-password-value", DEMO_TIME_ZONE);
  const snapshot = runtime.db.snapshot(user.id);
  const fixture = buildDemoFixture(snapshot.data);
  validateWorkspace(fixture);
  // Save and re-read through the real path: db.save() and db.snapshot() run
  // reconcileLearning(), which is what actually decides each record's standing (a
  // hand-built fixture can validate fine but still get reconciled away from the
  // status it was meant to demonstrate — e.g. a source cited with the wrong evidence
  // version silently flips standing to "reconsider" on the very next save).
  runtime.db.save(user.id, fixture, snapshot.revision, "system", "test");
  const data = runtime.db.snapshot(user.id).data;
  const today = dateInZone(DEMO_TIME_ZONE);

  // The specific live states the demo account exists to demonstrate.
  assert.ok(
    data.actions.some((action) => action.date === today && !action.outcome),
    "expected an action due today",
  );
  assert.equal(data.learning?.length, 2);
  const statuses = data.learning!.map((record) => learningStatus(record, today));
  assert.ok(statuses.includes("Live experiment"), `expected a "Live experiment" record, got ${statuses}`);
  assert.ok(statuses.includes("Ready to review"), `expected a "Ready to review" record, got ${statuses}`);
  const paused = data.goals.find((goal) => goal.status === "Paused");
  assert.ok(paused, "expected a paused goal");
  assert.ok(paused!.milestones.some((milestone) => milestone.done), "expected a completed milestone");
  assert.ok(
    data.goals.some((goal) => goal.status === "Draft" && !goal.plans.at(-1)!.action.trim()),
    "expected an unplanned Draft goal",
  );
  const measured = data.goals.find((goal) => goal.measure);
  assert.ok(measured?.results.length && measured?.checkpoints?.length, "expected a measured goal with results and checkpoints");
});

test("seedDemoAccount is idempotent without --reset", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "adler-seed-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));

  const first = await seedDemoAccount(directory, {});
  if (first.status !== "seeded") throw new Error(`expected "seeded", got "${first.status}": ${first.message}`);

  const second = await seedDemoAccount(directory, {});
  if (second.status !== "exists") throw new Error(`expected "exists", got "${second.status}": ${second.message}`);
  assert.equal(second.userId, first.userId);

  const runtime = createRuntime(directory);
  try {
    const count = runtime.db.sql.prepare("SELECT COUNT(*) as n FROM users").get() as { n: number };
    assert.equal(count.n, 1);
  } finally {
    runtime.close();
  }
});

test("seedDemoAccount --reset deletes and recreates only that user's rows", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "adler-seed-reset-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));

  const first = await seedDemoAccount(directory, {});
  if (first.status !== "seeded") throw new Error(`expected "seeded", got "${first.status}": ${first.message}`);

  const reset = await seedDemoAccount(directory, { reset: true });
  if (reset.status !== "seeded") throw new Error(`expected "seeded", got "${reset.status}": ${reset.message}`);
  assert.notEqual(reset.userId, first.userId);

  const runtime = createRuntime(directory);
  try {
    const count = runtime.db.sql.prepare("SELECT COUNT(*) as n FROM users").get() as { n: number };
    assert.equal(count.n, 1);
  } finally {
    runtime.close();
  }
});
