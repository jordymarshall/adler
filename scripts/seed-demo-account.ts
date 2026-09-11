// Seeds the fictional casey-example demo account into a real Adler dev data directory
// (ADLER_DATA_DIR, default .data/) so iOS feature agents and user testers can sign into
// a rich account without waiting on live coaching. The fixture is shared with
// scripts/app-api-examples.ts via scripts/demo-fixture.ts so the two cannot drift. This
// is fictional test data — never present it as customer proof (see AGENTS.md and the
// "Demo account" section of docs/ios-app.md).
//
// Idempotent: if casey-example already exists, running this again is a no-op unless
// --reset is passed, which deletes and recreates that user's rows only. Refuses to run
// against a data directory a dev server currently has open, unless --force.
//
//   npx tsx scripts/seed-demo-account.ts [--reset] [--force]
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRuntime } from "../server/api.ts";
import { defaults } from "../server/providers.ts";
import { dateInZone } from "../shared/journey.ts";
import type { Database } from "../server/database.ts";
import { buildDemoFixture, seedDemoProposals, DEMO_USERNAME, DEMO_TIME_ZONE } from "./demo-fixture.ts";

export const DEMO_PASSWORD = "fictional-example-password";

// The tables that own rows keyed by user id, per server/database.ts's schema. `state`
// and `sessions` declare a foreign key to `users`, so they (and users itself) must be
// deleted last/in this order for SQLite's foreign-key checks to allow it.
const USER_OWNED_TABLES = ["secrets", "proposals", "requests", "jobs", "sessions", "state"] as const;

function detectRunningServer(directory: string): string | null {
  const sqliteFile = join(directory, "adler.sqlite");
  const journalFile = join(directory, "adler.sqlite-journal");
  let pids = "";
  if (existsSync(sqliteFile)) {
    try {
      pids = execSync(`lsof -t "${sqliteFile}"`, { stdio: ["ignore", "pipe", "ignore"] })
        .toString()
        .trim();
    } catch {
      pids = "";
    }
  }
  const journalPresent = existsSync(journalFile);
  if (!pids && !journalPresent) return null;
  return [
    `A dev server appears to be using ${directory}` +
      (pids ? ` (process ${pids.split("\n").join(", ")} has ${sqliteFile} open).` : ` (${journalFile} exists).`),
    `docs/adler-runtime.md requires one process per data directory, so seeding while the`,
    `server runs risks corrupting it. Stop the server, seed, then restart it:`,
    ``,
    `  lsof -ti:8080 | xargs kill`,
    `  npx tsx scripts/seed-demo-account.ts${process.argv.includes("--reset") ? " --reset" : ""}`,
    `  (PORT=8080 nohup npm run dev -- --port 8080 > .context/dev-server.log 2>&1 &)`,
    ``,
    `Pass --force to skip this check if you are certain no server is running.`,
  ].join("\n");
}

function deleteUser(db: Database, userId: string) {
  db.transaction(() => {
    for (const table of USER_OWNED_TABLES)
      db.sql.prepare(`DELETE FROM ${table} WHERE user_id=?`).run(userId);
    db.sql.prepare("DELETE FROM users WHERE id=?").run(userId);
  });
}

export type SeedResult =
  | { status: "blocked"; message: string }
  | { status: "exists"; userId: string; message: string }
  | { status: "seeded"; userId: string; message: string };

export async function seedDemoAccount(
  directory: string,
  options: { reset?: boolean; force?: boolean } = {},
): Promise<SeedResult> {
  if (!options.force) {
    const blocked = detectRunningServer(resolve(directory));
    if (blocked) return { status: "blocked", message: blocked };
  }
  const runtime = createRuntime(directory);
  try {
    const existing = runtime.db.sql
      .prepare("SELECT id FROM users WHERE username=?")
      .get(DEMO_USERNAME) as { id: string } | undefined;
    if (existing && !options.reset)
      return {
        status: "exists",
        userId: existing.id,
        message: `${DEMO_USERNAME} already exists (user ${existing.id}). Nothing changed; pass --reset to delete and reseed.`,
      };
    if (existing && options.reset) deleteUser(runtime.db, existing.id);
    const user = runtime.db.createUser(DEMO_USERNAME, DEMO_PASSWORD, DEMO_TIME_ZONE);
    runtime.db.setSecret(user.id, "model-choice", {
      provider: "gemini",
      model: defaults.gemini,
      useServer: true,
    });
    const snapshot = runtime.db.snapshot(user.id);
    const today = dateInZone(DEMO_TIME_ZONE);
    runtime.db.save(user.id, buildDemoFixture(snapshot.data), snapshot.revision, "system", "Seeded fictional demo account.");
    seedDemoProposals(runtime, user.id, today);
    return {
      status: "seeded",
      userId: user.id,
      message: `Seeded ${DEMO_USERNAME} (user ${user.id}) into ${resolve(directory)}. Username: ${DEMO_USERNAME} · Password: ${DEMO_PASSWORD}`,
    };
  } finally {
    runtime.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await seedDemoAccount(resolve(process.env.ADLER_DATA_DIR || ".data"), {
    reset: process.argv.includes("--reset"),
    force: process.argv.includes("--force"),
  });
  console.log(result.message);
  process.exit(result.status === "blocked" ? 1 : 0);
}
