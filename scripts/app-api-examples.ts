// Generates docs/ios-api-examples/*.json from a fictional example account so Swift
// engineers can write Codable models against real payloads. Nothing here describes a
// real customer: the account, goals, reports and coaching records are all invented.
// The fixture itself lives in scripts/demo-fixture.ts, shared with
// scripts/seed-demo-account.ts (which seeds the same account into a real dev data
// directory) so the two scripts cannot drift.
//
//   npx tsx scripts/app-api-examples.ts
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { createRuntime } from "../server/api.ts";
import type { Change } from "../server/commands.ts";
import { dateInZone } from "../shared/journey.ts";
import { buildDemoFixture, seedDemoProposals, DEMO_TIME_ZONE, DEMO_USERNAME } from "./demo-fixture.ts";

const today = dateInZone(DEMO_TIME_ZONE);

const directory = mkdtempSync(join(tmpdir(), "adler-app-examples-"));
const runtime = createRuntime(directory);
const server = createServer(
  (req, res) =>
    void runtime.handle(req, res, () => {
      res.writeHead(404);
      res.end();
    }),
);
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = (server.address() as { port: number }).port;
const origin = `http://127.0.0.1:${port}`;
const output = "docs/ios-api-examples";
mkdirSync(output, { recursive: true });

let cookie = "";
async function call(path: string, payload?: unknown) {
  const response = await fetch(origin + path, {
    method: payload === undefined ? "GET" : "POST",
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(payload === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
  });
  return { status: response.status, body: await response.json(), headers: response.headers };
}
function write(name: string, request: string, value: { status: number; body: unknown }) {
  writeFileSync(
    join(output, `${name}.json`),
    `${JSON.stringify({ request, status: value.status, response: value.body }, null, 2)}\n`,
  );
  console.log(`${name}.json · ${request} · ${value.status}`);
}

try {
  const auth = await call("/api/auth/register", {
    username: DEMO_USERNAME,
    password: "a-long-example-password",
    timeZone: DEMO_TIME_ZONE,
  });
  if (auth.status !== 200) throw new Error(JSON.stringify(auth.body));
  cookie = auth.headers.get("set-cookie")!.split(";")[0];
  const userId = (auth.body as { user: { id: string } }).user.id;
  const snapshot = runtime.db.snapshot(userId);
  runtime.db.save(userId, buildDemoFixture(snapshot.data), snapshot.revision, "web", "Fictional example account");
  seedDemoProposals(runtime, userId, today);

  write("session", "GET /api/app/session", await call("/api/app/session"));
  const todayView = await call("/api/app/today");
  write("today", "GET /api/app/today", todayView);
  write("goals", "GET /api/app/goals", await call("/api/app/goals"));
  write("goal-detail", "GET /api/app/goals/portfolio", await call("/api/app/goals/portfolio"));
  write(
    "goal-detail-projection",
    "GET /api/app/goals/guide?step=write-words",
    await call("/api/app/goals/guide?step=write-words"),
  );
  write("coach", "GET /api/app/coach", await call("/api/app/coach"));
  write(
    "coach-conversation",
    "GET /api/app/coach/chat-portfolio",
    await call("/api/app/coach/chat-portfolio"),
  );
  write("insights", "GET /api/app/insights", await call("/api/app/insights"));
  write(
    "insight-record",
    "GET /api/app/insights/learning-breakfast-cue",
    await call("/api/app/insights/learning-breakfast-cue"),
  );
  write("calendar", `GET /api/app/calendar?start=${today}`, await call(`/api/app/calendar?start=${today}`));
  write("settings", "GET /api/app/settings", await call("/api/app/settings"));

  const view = todayView.body as {
    revision: number;
    lineup: { action: { id: string; goalId: string; durationMinutes: number; measure: { target: number | null } } }[];
  };
  const reportable = view.lineup[0].action;
  const report: Change[] = [
    {
      entity: "action",
      operation: "update",
      id: reportable.id,
      parentId: null,
      reason: "Reported from the app right after the session.",
      values: JSON.stringify({
        outcome: "Done",
        ...(reportable.measure.target === null ? {} : { amount: reportable.measure.target }),
        actualMinutes: reportable.durationMinutes,
        note: "Finished the session before the first meeting.",
      }),
    },
  ];
  const body = {
    changes: report,
    revision: view.revision,
    requestId: randomUUID(),
    goalId: reportable.goalId,
  };
  write("changes", "POST /api/app/changes", await call("/api/app/changes", body));
  write(
    "changes-conflict",
    "POST /api/app/changes with a stale revision",
    await call("/api/app/changes", { ...body, requestId: randomUUID() }),
  );
  write("goal-start", "POST /api/app/goals/reading/start", await call("/api/app/goals/reading/start", {}));
  write(
    "goal-start-blocked",
    "POST /api/app/goals/running/start on a draft with no chosen work",
    await call("/api/app/goals/running/start", {}),
  );
  write("not-found", "GET /api/app/goals/not-a-goal", await call("/api/app/goals/not-a-goal"));
} finally {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  runtime.close();
  rmSync(directory, { recursive: true, force: true });
}
