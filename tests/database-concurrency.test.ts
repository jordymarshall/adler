import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Worker } from "node:worker_threads";
import { once } from "node:events";
import { Database } from "../server/database";

test("a workspace can open while an existing writer finishes its transaction", async () => {
  const directory = mkdtempSync(join(tmpdir(), "adler-lock-check-"));
  const setup = new Database(directory);
  const user = setup.createUser("lock-check", "fictional-test-password", "UTC");
  setup.close();
  const writer = new Worker(
    `
    const { DatabaseSync } = require('node:sqlite');
    const { parentPort, workerData } = require('node:worker_threads');
    const db = new DatabaseSync(workerData);
    db.exec('BEGIN EXCLUSIVE');
    parentPort.postMessage('locked');
    setTimeout(() => { db.exec('COMMIT'); db.close(); }, 250);
  `,
    { eval: true, workerData: join(directory, "adler.sqlite") },
  );
  try {
    await once(writer, "message");
    const db = new Database(directory);
    try {
      assert.equal(db.snapshot(user.id).data.timeZone, "UTC");
    } finally {
      db.close();
    }
  } finally {
    await writer.terminate();
    rmSync(directory, { recursive: true, force: true });
  }
});
