import { reviewed } from "./planning-fixture.ts";
import { adaptiveFixture } from "./adaptive-fixture.ts";
import { basis, literature, researched } from "./planning-fixture.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer, request as httpRequest } from "node:http";
import { randomUUID } from "node:crypto";
import twilio from "twilio";
import { z } from "zod";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Database, digest } from "../server/database.ts";
import { Service, dayInZone } from "../server/service.ts";
import { applyChanges, type Change } from "../server/commands.ts";
import {
  Channels,
  nextReview,
  inQuietHours,
  validateTwilio,
  describeChanges,
} from "../server/channels.ts";
import { generate } from "../server/providers.ts";
import { createRuntime } from "../server/api.ts";
import { createGoal, type GoalInput } from "../shared/validation.ts";
import type { coachingContext } from "../src/coach-context.ts";
import { applyPlan, currentPlan } from "../shared/workspace.ts";
import { addDays, dateInZone, reviewBlock, reviewSchedule } from "../shared/journey.ts";
const goalInput: GoalInput = {
  basis,
  title: "Publish two essays",
  kind: "project",
  why: "Practice explaining my work",
  success: "Two essays are published on my site",
  area: "Career",
  tags: ["Writing"],
  targetDate: "2026-12-31",
  milestones: [
    { title: "Publish first essay", criterion: "A published URL" },
    { title: "Publish second essay", criterion: "A published URL" },
  ],
  assessmentTarget: 8,
  baseline: null,
  action: "Draft five main points",
  criterion: "Five points on the page",
  timing: "Unscheduled",
};
function coachGoalInput() {
  const adaptive = adaptiveFixture(dateInZone("UTC"), dateInZone("UTC"));
  Object.assign(adaptive.steps[0], { type: "task", title: goalInput.action, criterion: goalInput.criterion, cue: goalInput.timing });
  delete adaptive.steps[0].recurrence;
  return { ...goalInput, adaptive };
}
function fixture(t: test.TestContext) {
  const directory = mkdtempSync(join(tmpdir(), "adler-test-"));
  const db = new Database(directory);
  t.after(() => {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  });
  const user = db.createUser(
    "writer",
    "a-long-test-password",
    "America/Toronto",
  );
  db.setSecret(user.id, "model-choice", {
    provider: "gemini",
    model: "fixture",
    useServer: false,
  });
  db.setSecret(user.id, "model-gemini", { key: "fake-private-key" });
  const service = new Service(db);
  return { db, user, service, directory };
}
const change = (
  entity: Change["entity"],
  operation: Change["operation"],
  values: unknown,
  id: string | null = null,
  parentId: string | null = null,
): Change => ({
  entity,
  operation,
  values: JSON.stringify(values),
  id,
  parentId,
  reason: "The user requested this change to their plan.",
});
function twilioEnvironment(t: test.TestContext) {
  const old = { ...process.env };
  Object.assign(process.env, {
    MESSAGING_PROVIDER: "twilio",
    TWILIO_ACCOUNT_SID: "AC" + "1".repeat(32),
    TWILIO_AUTH_TOKEN: "fixture-auth-token",
    TWILIO_NUMBER: "+14165550000",
    PUBLIC_URL: "https://adler.example.test",
  });
  t.after(() => {
    for (const key of [
      "MESSAGING_PROVIDER",
      "TWILIO_ACCOUNT_SID",
      "TWILIO_AUTH_TOKEN",
      "TWILIO_NUMBER",
      "PUBLIC_URL",
    ]) {
      if (old[key] === undefined) delete process.env[key];
      else process.env[key] = old[key];
    }
  });
}
function form(
  body: string,
  from = "+14165550111",
  sid = "SM" + randomUUID().replaceAll("-", ""),
) {
  return {
    AccountSid: process.env.TWILIO_ACCOUNT_SID!,
    MessageSid: sid,
    From: from,
    To: process.env.TWILIO_NUMBER!,
    Body: body,
  };
}

test("new accounts start empty, isolate passwords, and encrypt provider keys at rest", (t) => {
  const { db, user, directory } = fixture(t);
  assert.equal(db.snapshot(user.id).data.goals.length, 0);
  assert.equal(db.snapshot(user.id).data.messages.length, 0);
  assert.equal(db.login("WRITER", "a-long-test-password").id, user.id);
  assert.throws(() => db.login("writer", "wrong-password"));
  assert.equal(
    db.secret<{ key: string }>(user.id, "model-gemini")?.key,
    "fake-private-key",
  );
  const bytes = readFileSync(join(directory, "adler.sqlite")).toString();
  assert(!bytes.includes("fake-private-key"));
  assert(!bytes.includes("a-long-test-password"));
  const token = db.session(user.id);
  assert.equal(db.authenticate(token)?.id, user.id);
  assert(!db.authenticate(token + "0"));
});
test("stale workspace saves are rejected and request IDs cannot hide changed content", async (t) => {
  const { db, user, service } = fixture(t),
    snapshot = db.snapshot(user.id);
  const next = structuredClone(snapshot.data);
  next.theme = "dark";
  await service.update(user.id, next, 0, "change-0001");
  await service.update(user.id, next, 0, "change-0001");
  assert.equal(db.snapshot(user.id).revision, 1);
  const later = db.snapshot(user.id);
  later.data.decisions.push({ id: "later-decision", goalId: "general", programVersion: 1, planVersion: 1, mode: "live", checks: [], methods: [], summary: "New evidence arrived after this request.", date: "2026-09-07", status: "No change" });
  db.save(user.id, later.data, later.revision, "web", "Later coaching decision");
  await service.update(user.id, next, 0, "change-0001");
  assert.equal(db.snapshot(user.id).revision, 2);
  assert.equal(db.snapshot(user.id).data.decisions.at(-1)?.id, "later-decision");
  await assert.rejects(
    service.update(user.id, snapshot.data, 0, "change-0002"),
    /another channel/,
  );
  next.messages.push({
    id: "message",
    goalId: "general",
    role: "user",
    text: "different",
  });
  await assert.rejects(
    service.update(user.id, next, 0, "change-0001"),
    /reused/,
  );
});
test("one command system creates, edits and deletes goals; action completion is separate from the result", (t) => {
  const { db, user } = fixture(t);
  let data = applyChanges(
    db.snapshot(user.id).data,
    [change("goal", "create", goalInput, "goal-one")],
    "2026-09-05",
  );
  assert.equal(data.goals[0].results[0].value, 0);
  assert.equal(data.goals[0].checkpoints?.[0].value, 0);
  assert.equal(data.programs.at(-1)?.focusGoalId, "goal-one");
  data = applyChanges(
    data,
    [change("action", "update", { outcome: "Done" }, data.actions[0].id)],
    "2026-09-05",
  );
  assert.equal(data.goals[0].milestones.filter((m) => m.done).length, 0);
  data = applyChanges(
    data,
    [
      change(
        "milestone",
        "update",
        { done: true },
        data.goals[0].milestones[0].id,
        "goal-one",
      ),
      change(
        "goal",
        "update",
        { tags: ["Essays"], priority: "Focus" },
        "goal-one",
      ),
      change("program", "update", {
        weeklyMinutes: 90,
        reason: "Time available this week.",
      }),
    ],
    "2026-09-05",
  );
  assert.equal(data.goals[0].results.at(-1)?.value, 1);
  assert.equal(data.programs.at(-1)?.weeklyMinutes, 90);
  data = applyChanges(
    data,
    [change("goal", "delete", {}, "goal-one")],
    "2026-09-05",
  );
  assert.equal(data.goals.length, 0);
  assert.equal(data.actions.length, 0);
});
test("invalid changes are atomic and cannot target another user’s proposal", async (t) => {
  const { db, user, service } = fixture(t);
  assert.throws(() =>
    applyChanges(
      db.snapshot(user.id).data,
      [
        change("goal", "create", goalInput),
        change("program", "update", { weeklyMinutes: -10, reason: "invalid" }),
      ],
      "2026-09-05",
    ),
  );
  assert.equal(db.snapshot(user.id).data.goals.length, 0);
  const proposal = service.propose(
    user.id,
    [change("goal", "create", goalInput)],
    "Publish two essays",
    "mcp", "general", undefined, true,
  );
  const other = db.createUser("other", "another-long-password", "UTC");
  await assert.rejects(
    service.approve(other.id, proposal.id, "web"),
    /not found/,
  );
  await service.approve(user.id, proposal.id, "web");
  await service.approve(user.id, proposal.id, "sms");
  assert.equal(db.snapshot(user.id).data.goals.length, 1);
});
test("proposal approval checks current records; expired proposals and duplicate message IDs cannot be reused", async (t) => {
  const { db, user, service } = fixture(t);
  const proposal = service.propose(
    user.id,
    [change("goal", "create", goalInput)],
    "Create goal",
    "sms", "general", undefined, true,
  );
  const current = db.snapshot(user.id);
  current.data.theme = "dark";
  await service.update(user.id, current.data, 0, "theme-update");
  await assert.rejects(
    service.approve(user.id, proposal.id, "web"),
    /workspace changed/,
  );
  const expired = service.propose(
    user.id,
    [change("memory", "create", { text: "Keep evenings free." })],
    "Save preference",
    "mcp",
  );
  db.sql.prepare("UPDATE proposals SET expires=0 WHERE id=?").run(expired.id);
  await assert.rejects(
    service.approve(user.id, expired.id, "mcp"),
    /no longer pending/,
  );
});
test("AI goal setup uses server records, saves conversation once, and waits for approval", async (t) => {
  const { db, user } = fixture(t);
  let calls = 0;
  const runner: typeof generate = async (
    _config,
    _instructions,
    context,
    validator,
  ) => {
    calls++;
    assert.equal((context as any).workspace.goals.length, 0);
    const responseSchema = z.toJSONSchema(validator) as any;
    assert(responseSchema.properties.changes.items.required.includes("reason"));
    return validator.parse({
      reply: "Let’s review your two essay milestones.",
      summary: "Two published essays with an initial outline action.",
      methods: ["monitoring"],
      changes: [change("goal", "create", coachGoalInput())],
    });
  };
  const service = new Service(db, researched(runner), literature);
  const result = await service.chat(
    user.id,
    "Create my two essay goal",
    "general",
    "sms",
    "same-message-001",
  );
  assert.equal(
    result.proposal!.changes[0].reason,
    "The user requested this change to their plan.",
  );
  assert.equal(
    service.listProposals(user.id)[0].changes[0].reason,
    result.proposal!.changes[0].reason,
  );
  assert.match(
    describeChanges(result.proposal!.changes),
    /Why: The user requested this change/,
  );
  assert.equal(result.data.goals.length, 0);
  assert.equal(result.data.messages.length, 2);
  assert.equal(result.data.messages[0].channel, "sms");
  await service.chat(
    user.id,
    "Create my two essay goal",
    "general",
    "sms",
    "same-message-001",
  );
  assert.equal(calls, 1);
  await assert.rejects(
    service.chat(
      user.id,
      "Different message",
      "general",
      "sms",
      "same-message-001",
    ),
    /reused/,
  );
  await service.approve(user.id, result.proposal!.id, "web");
  const snapshot = db.snapshot(user.id);
  assert.equal(snapshot.data.goals.length, 1);
  assert.equal(snapshot.data.decisions[0].status, "Accepted");
});
test("program, memory, review and local scheduling are editable through the same commands", (t) => {
  const { db, user } = fixture(t);
  let data = db.snapshot(user.id).data;
  createGoal(data, goalInput, "2026-09-05", "goal");
  const start = new Date(Date.now() + 3600000).toISOString(),
    end = new Date(Date.now() + 5100000).toISOString();
  data = applyChanges(
    data,
    [
      change("memory", "create", { text: "I prefer mornings" }, "memory"),
      change("review", "update", {
        note: "Drafting went well",
        decision: "Keep the morning sessions",
        complete: true,
      }),
      change(
        "workBlock",
        "create",
        { action: "Outline essay", start, end },
        "block",
        "goal",
      ),
    ],
    dayInZone(data),
  );
  assert.equal(data.reviews.length, 1);
  assert.equal(data.workBlocks[0].provider, "local");
  assert(data.actions.some((a) => a.id === "block"));
  data = applyChanges(
    data,
    [
      change("workBlock", "delete", {}, "block"),
      change("memory", "delete", {}, "memory"),
    ],
    dayInZone(data),
  );
  assert.equal(data.workBlocks.length, 0);
  assert.equal(data.memories.length, 0);
  assert.equal(data.actions.length, 1);
});
test("signed SMS pairing requires the expected sending number and deduplicates inbound events", async (t) => {
  twilioEnvironment(t);
  const { db, user, service } = fixture(t);
  let sends = 0;
  const channels = new Channels(db, service, async () => {
    sends++;
    return { sid: "SM" + "9".repeat(32), status: "queued" };
  });
  const pair = channels.pair(user.id, "+14165550111", "sms");
  const path = "/api/webhooks/twilio/inbound";
  const input = form(pair.send);
  const signature = twilio.getExpectedTwilioSignature(
    process.env.TWILIO_AUTH_TOKEN!,
    process.env.PUBLIC_URL + path,
    input,
  );
  assert(validateTwilio(path, signature, input));
  assert(!validateTwilio(path, signature, { ...input, Body: "tampered" }));
  channels.inbound(form(pair.send, "+14165550222"));
  assert.equal(channels.status(user.id).link, null);
  channels.inbound(input);
  channels.inbound(input);
  assert(channels.status(user.id).link);
  await channels.tick();
  await channels.tick();
  assert.equal(sends, 1);
  assert.equal(
    (db.sql.prepare("SELECT COUNT(*) AS count FROM inbound").get() as any)
      .count,
    2,
  );
});
test("STOP cancels queued text before any provider call; uncertain sends are never retried", async (t) => {
  twilioEnvironment(t);
  const { db, user, service } = fixture(t);
  db.sql
    .prepare("INSERT INTO phone_links VALUES(?,?,0,?)")
    .run("+14165550111", user.id, Date.now());
  let calls = 0;
  const channels = new Channels(db, service, async () => {
    calls++;
    throw new Error("timeout after transmission");
  });
  channels.queueText(user.id, "first", "Hello");
  channels.inbound(form("STOP"));
  await channels.tick();
  assert.equal(calls, 0);
  assert.equal(
    (
      db.sql
        .prepare("SELECT status FROM deliveries WHERE id='first:0'")
        .get() as any
    ).status,
    "cancelled",
  );
  channels.inbound(form("START"));
  channels.queueText(user.id, "second", "Hello again");
  await channels.tick();
  await channels.tick();
  assert.equal(calls, 1);
  assert.equal(
    (
      db.sql
        .prepare("SELECT status FROM deliveries WHERE id='second:0'")
        .get() as any
    ).status,
    "unknown",
  );
});
test("delivery callbacks can arrive early and out of order without regressing delivered status", (t) => {
  twilioEnvironment(t);
  const { db, user, service } = fixture(t);
  db.sql
    .prepare("INSERT INTO phone_links VALUES(?,?,0,?)")
    .run("+14165550111", user.id, Date.now());
  const channels = new Channels(db, service);
  channels.queueText(user.id, "callback", "Hello");
  const input = {
    To: "+14165550111",
    MessageSid: "SM" + "2".repeat(32),
    MessageStatus: "delivered",
  };
  channels.callback(input, "callback:0");
  channels.callback({ ...input, MessageStatus: "sent" }, "callback:0");
  assert.equal(
    (
      db.sql
        .prepare("SELECT status FROM deliveries WHERE id='callback:0'")
        .get() as any
    ).status,
    "delivered",
  );
  assert.throws(() =>
    channels.callback({ ...input, To: "+14165550333" }, "callback:0"),
  );
});
test("durable jobs recover on restart and timezone rules respect quiet hours and DST", (t) => {
  const { db, user, directory } = fixture(t);
  const data = db.snapshot(user.id).data;
  data.timeZone = "America/Toronto";
  data.reviewDay = "Sunday";
  data.automation.reviewTime = "17:00";
  assert.equal(
    new Date(
      nextReview(data, Date.parse("2026-10-31T12:00:00Z")),
    ).toISOString(),
    "2026-11-01T22:00:00.000Z",
  );
  assert(inQuietHours(data, new Date("2026-11-02T03:00:00Z")));
  assert(!inQuietHours(data, new Date("2026-11-02T15:00:00Z")));
  db.enqueue("durable", user.id, "webhook", { message: "An update" });
  assert.equal(db.claim()?.id, "durable");
  db.close();
  const second = new Database(directory);
  db.sql = second.sql;
  assert.equal(second.claim()?.id, "durable");
});
test("provider adapters enforce structured responses, use the chosen endpoint, and keep storage disabled", async (t) => {
  const old = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = old;
  });
  for (const provider of ["openai", "gemini", "anthropic"] as const) {
    globalThis.fetch = async (input, init) => {
      const body = JSON.parse(init?.body as string);
      assert.equal(body.model, "fixture-model");
      if (provider !== "anthropic") assert.equal(body.store, false);
      assert(
        String(input).includes(
          provider === "openai"
            ? "openai.com"
            : provider === "gemini"
              ? "googleapis.com"
              : "anthropic.com",
        ),
      );
      const text = '{"status":"connected"}';
      return new Response(
        JSON.stringify(
          provider === "openai"
            ? {
                status: "completed",
                output: [
                  { type: "message", content: [{ type: "output_text", text }] },
                ],
              }
            : provider === "gemini"
              ? {
                  status: "completed",
                  steps: [
                    { type: "model_output", content: [{ type: "text", text }] },
                  ],
                }
              : { stop_reason: "end_turn", content: [{ type: "text", text }] },
        ),
      );
    };
    assert.deepEqual(
      await generate(
        {
          provider,
          model: "fixture-model",
          key: "fixture-key",
          source: "personal",
        },
        "Test",
        {},
        z.object({ status: z.literal("connected") }).strict(),
      ),
      { status: "connected" },
    );
  }
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        error: { message: "insufficient credits private-secret-value" },
      }),
      { status: 400 },
    );
  await assert.rejects(
    generate(
      {
        provider: "gemini",
        model: "fixture",
        key: "fixture",
        source: "personal",
      },
      "",
      {},
      z.object({}),
    ),
    (error) =>
      error instanceof Error &&
      error.message.includes("credits") &&
      !error.message.includes("private-secret-value"),
  );
});
test("authenticated HTTP and a real MCP client share one workspace; revoked tokens lose access", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "adler-http-"));
  const runtime = createRuntime(directory);
  const server = createServer(
    (req, res) =>
      void runtime.handle(req, res, () => {
        res.writeHead(404);
        res.end();
      }),
  );
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as { port: number }).port,
    origin = `http://127.0.0.1:${port}`;
  t.after(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    runtime.close();
    rmSync(directory, { recursive: true, force: true });
  });
  const request = async (
    path: string,
    body?: unknown,
    headers: Record<string, string> = {},
  ) =>
    fetch(origin + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        ...headers,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  assert.equal((await request("/api/workspace")).status, 401);
  const auth = await request("/api/auth/register", {
    username: "mcp-user",
    password: "my-long-password",
    timeZone: "UTC",
  });
  assert.equal(auth.status, 200);
  const cookie = auth.headers.get("set-cookie")!.split(";")[0];
  const account = await auth.json();
  const access = await (
    await request(
      "/api/tokens",
      { name: "Test MCP", scope: "mcp", days: 1 },
      { cookie },
    )
  ).json();
  assert(access.token);
  assert(
    !JSON.stringify(
      await (await request("/api/connections", undefined, { cookie })).json(),
    ).includes(access.token),
  );
  const client = new Client({ name: "test", version: "1" });
  await client.connect(
    new StreamableHTTPClientTransport(new URL(origin + "/mcp"), {
      requestInit: { headers: { Authorization: `Bearer ${access.token}` } },
    }),
  );
  t.after(() => client.close());
  const tools = await client.listTools();
  assert(tools.tools.some((tool) => tool.name === "propose_changes"));
  const unchecked = await client.callTool({ name: "propose_changes", arguments: { changes: [change("goal", "create", goalInput)], summary: "Unchecked goal advice" } });
  assert.equal(unchecked.isError, true, "New coaching must use the shared coach_message tool");
  const proposed = await client.callTool({
    name: "propose_changes",
    arguments: {
      changes: [change("memory", "create", { text: "Keep evenings free." })],
      summary: "Publish two essays",
    },
  });
  const proposal = JSON.parse((proposed.content as { text: string }[])[0].text);
  assert.equal(runtime.db.snapshot(account.user.id).data.memories.length, 0);
  const applied = await client.callTool({
    name: "apply_proposal",
    arguments: { id: proposal.id, confirmed: true },
  });
  assert(!applied.isError);
  assert.equal(
    (await (await request("/api/workspace", undefined, { cookie })).json()).data
      .memories.length,
    1,
  );
  await request("/api/tokens/revoke", { id: access.id }, { cookie });
  const refused = await request(
    "/mcp",
    {},
    { Authorization: `Bearer ${access.token}` },
  );
  assert.equal(refused.status, 401);
  assert.equal(
    (
      await request(
        "/api/workspace",
        {},
        { cookie, Origin: "https://foreign.example" },
      )
    ).status,
    403,
  );
});
test("a configured frontend can use the backend through a same-origin proxy without admitting foreign sites", async (t) => {
  const previous = {
    PUBLIC_URL: process.env.PUBLIC_URL,
    FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN,
  };
  process.env.PUBLIC_URL = "https://backend.example.test";
  process.env.FRONTEND_ORIGIN = "https://adler.example.test";
  const directory = mkdtempSync(join(tmpdir(), "adler-proxy-"));
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
  t.after(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    runtime.close();
    rmSync(directory, { recursive: true, force: true });
    for (const key of ["PUBLIC_URL", "FRONTEND_ORIGIN"] as const) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  });
  const request = (
    path: string,
    headers: Record<string, string> = {},
    body?: unknown,
  ) =>
    new Promise<Response>((resolve, reject) => {
      const req = httpRequest(
        `http://127.0.0.1:${port}${path}`,
        {
          method: body === undefined ? "GET" : "POST",
          headers: {
            Host: "backend.example.test",
            Origin: "https://adler.example.test",
            "Sec-Fetch-Site": "same-origin",
            "Content-Type": "application/json",
            ...headers,
          },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("error", reject);
          res.on("end", () =>
            resolve(
              new Response(Buffer.concat(chunks), {
                status: res.statusCode,
                headers: Object.fromEntries(
                  Object.entries(res.headers).map(([key, value]) => [
                    key,
                    Array.isArray(value) ? value.join(", ") : (value ?? ""),
                  ]),
                ),
              }),
            ),
          );
        },
      );
      req.on("error", reject);
      req.end(body === undefined ? undefined : JSON.stringify(body));
    });
  const health = await request("/api/health");
  const healthBody = await health.json();
  assert.equal(health.status, 200, JSON.stringify(healthBody));
  assert.deepEqual(healthBody, { ok: true });
  const auth = await request(
    "/api/auth/register",
    {},
    {
      username: "proxy-user",
      password: "a-long-test-password",
      timeZone: "UTC",
    },
  );
  assert.equal(auth.status, 200);
  const session = auth.headers.get("set-cookie")!;
  assert(
    session.includes("HttpOnly") &&
      session.includes("Secure") &&
      session.includes("SameSite=Lax"),
  );
  assert(!session.includes("Domain="));
  const workspace = await request("/api/workspace", {
    Cookie: session.split(";")[0],
  });
  assert.equal(workspace.status, 200);
  assert.equal(workspace.headers.get("cache-control"), "private, no-store");
  assert.equal((await request("/api/workspace")).status, 401);
  assert.equal(
    (await request("/api/auth", { Origin: "https://untrusted.vercel.app" }))
      .status,
    403,
  );
  assert.equal(
    (await request("/api/auth", { Host: "untrusted.example.test" })).status,
    403,
  );
  assert.equal(
    (await request("/api/auth", { "Sec-Fetch-Site": "cross-site" })).status,
    403,
  );
});
test("web, iMessage, SMS, and MCP coaching share the model, program, memory, and conversation", async (t) => {
  const { db, user } = fixture(t);
  const snapshot = db.snapshot(user.id);
  const data = applyChanges(
    snapshot.data,
    [
      change("goal", "create", goalInput),
      change("memory", "create", { text: "I prefer morning work." }),
      change("program", "update", {
        weeklyMinutes: 90,
        reason: "I have 90 minutes a week available.",
      }),
    ],
    dayInZone(snapshot.data),
  );
  const calls: {
    config: Parameters<typeof generate>[0];
    instructions: string;
    context: ReturnType<typeof coachingContext>;
  }[] = [];
  const runner: typeof generate = async (
    config,
    instructions,
    context,
    schema,
  ) => {
    calls.push({
      config,
      instructions,
      context: context as ReturnType<typeof coachingContext>,
    });
    return schema.parse({
      reply: "Let's review the work you recorded.",
      summary: "Review current records.",
      methods: [],
      changes: [],
    });
  };
  const service = new Service(db, reviewed(runner));
  // Explicit manual goals do not attach a scientific explanation.
  data.goals.forEach(goal => goal.plans.forEach(plan => { delete plan.basis; }));
  // The same save path used by goal/program forms must feed every coach surface.
  await service.update(user.id, data, snapshot.revision, randomUUID());
  assert.equal(calls.length, 0, "An explicit form save does not require a model call");
  const channels = ["web", "imessage", "sms", "mcp"] as const;
  for (const channel of channels)
    await service.chat(
      user.id,
      `Review my goals from ${channel}.`,
      "general",
      channel,
      randomUUID(),
    );
  for (const call of calls) {
    assert.deepEqual(call.config, calls[0].config);
    assert.equal(call.instructions, calls[0].instructions);
    const frameworkContext = call.context as typeof call.context & { coachingFramework: { version: string }; behavioralResearch: { synthesis: string }; researchLibrary: { id: string }[] };
    assert.equal(frameworkContext.coachingFramework.version, "besci-coaching-v2.1");
    assert.match(frameworkContext.behavioralResearch.synthesis, /P24. Structural constraints/);
    assert.match(frameworkContext.behavioralResearch.synthesis, /P29. Health rules do not export/);
    assert.ok(frameworkContext.researchLibrary.some(document => document.id === "deep/idiographic-inference.md"));
    assert.deepEqual(call.context.program, data.programs.at(-1));
    assert.deepEqual(call.context.confirmedContext, data.memories);
    assert.deepEqual(call.context.activeGoals, data.goals);
  }
  calls.forEach((call, i) => {
    for (const channel of channels.slice(0, i))
      assert(
        call.context.conversation.some(
          (m) => m.text === `Review my goals from ${channel}.`,
        ),
      );
  });
  assert.deepEqual(
    db
      .snapshot(user.id)
      .data.messages.filter((m) => m.role === "user")
      .map((m) => m.channel),
    channels,
  );
});
test("SMS conversation proposes a change, web approval syncs it, and the same text does not call the model twice", async (t) => {
  twilioEnvironment(t);
  const { db, user } = fixture(t);
  db.sql
    .prepare("INSERT INTO phone_links VALUES(?,?,0,?)")
    .run("+14165550111", user.id, Date.now());
  let calls = 0;
  const runner: typeof generate = async (_c, _i, _context, schema) => {
    calls++;
    return schema.parse({
      reply: "I can save your preference for morning work.",
      summary: "Prefer morning work.",
      methods: ["monitoring"],
      changes: [change("memory", "create", { text: "I prefer mornings." })],
    });
  };
  const service = new Service(db, reviewed(runner)),
    channels = new Channels(db, service, async () => ({
      sid: "SM" + randomUUID().replaceAll("-", ""),
      status: "queued",
    }));
  const input = form("Remember that I prefer mornings.");
  channels.inbound(input);
  channels.inbound(input);
  await channels.tick();
  assert.equal(calls, 1);
  assert.equal(db.snapshot(user.id).data.memories.length, 0);
  const proposal = service.listProposals(user.id)[0];
  assert.equal(proposal.channel, "sms");
  await service.approve(user.id, proposal.id, "web");
  assert.equal(
    db.snapshot(user.id).data.memories[0].text,
    "I prefer mornings.",
  );
  channels.inbound(form(`CONFIRM ${proposal.id}`));
  await channels.tick();
  assert.equal(db.snapshot(user.id).data.memories.length, 1);
  assert.equal(calls, 1);
});
test("scheduled sends recheck action completion and quiet hours just before delivery", async (t) => {
  twilioEnvironment(t);
  const { db, user, service } = fixture(t);
  const data = db.snapshot(user.id).data;
  createGoal(data, goalInput, dayInZone(data), "goal");
  data.automation.enabled = true;
  data.automation.quietStart = "00:00";
  data.automation.quietEnd = "00:00";
  data.actions[0].id = "action";
  db.save(user.id, data, 0, "web", "Setup");
  db.sql
    .prepare("INSERT INTO phone_links VALUES(?,?,0,?)")
    .run("+14165550111", user.id, Date.now());
  let sends = 0;
  const channels = new Channels(db, service, async () => {
    sends++;
    return { sid: "SM" + "3".repeat(32), status: "queued" };
  });
  const job = "check-in:test:action";
  db.enqueue(job, user.id, "check-in", { goalId: "goal", actionId: "action" });
  db.sql.prepare("UPDATE jobs SET status='done' WHERE id=?").run(job);
  channels.queueText(user.id, job, "How did it go?");
  const latest = db.snapshot(user.id);
  latest.data.actions[0].outcome = "Done";
  db.save(user.id, latest.data, latest.revision, "web", "Recorded outcome");
  await channels.tick();
  assert.equal(sends, 0);
  assert.equal(
    (
      db.sql
        .prepare("SELECT status FROM deliveries WHERE id=?")
        .get(job + ":0") as any
    ).status,
    "cancelled",
  );
});
test("approved external work blocks use the same stable booking ID and persist the provider event", async (t) => {
  const { db, user, service } = fixture(t);
  const snapshot = db.snapshot(user.id);
  createGoal(snapshot.data, goalInput, dayInZone(snapshot.data), "goal");
  delete snapshot.data.goals[0].plans[0].basis;
  await service.update(user.id, snapshot.data, 0, "setup-external");
  let calls = 0;
  service.externalApply = async (_id, changes, data) => {
    calls++;
    data.workBlocks.find((b) => b.id === changes[0].id)!.eventId =
      "provider-event";
  };
  const proposal = service.propose(
    user.id,
    [
      change(
        "workBlock",
        "create",
        {
          action: "Draft essay",
          start: new Date(Date.now() + 3600000).toISOString(),
          end: new Date(Date.now() + 5100000).toISOString(),
          provider: "google",
          calendarId: "primary",
          conflictIds: ["primary"],
          checkIn: true,
        },
        null,
        "goal",
      ),
    ],
    "Book the essay session on Google",
    "mcp",
  );
  assert(proposal.changes[0].id);
  assert.equal(db.snapshot(user.id).data.workBlocks.length, 0);
  await service.approve(user.id, proposal.id, "sms");
  await service.approve(user.id, proposal.id, "web");
  assert.equal(calls, 1);
  assert.equal(
    db.snapshot(user.id).data.workBlocks[0].eventId,
    "provider-event",
  );
});

test("existing workspaces can coach without the retired enable switch", async (t) => {
  const { db, user } = fixture(t);
  const snapshot = db.snapshot(user.id);
  // Stored workspaces from the previous version may still contain this flag.
  db.save(
    user.id,
    { ...snapshot.data, modelConsent: false } as typeof snapshot.data,
    snapshot.revision,
    "web",
    "Previous workspace format",
  );
  let called = false;
  const service = new Service(
    db,
    async (_config, _instructions, _context: any, schema) => {
      if (_context.task === "review-plan") return schema.parse({ issues: [] });
      called = true;
      return schema.parse({
        reply: "What result would you like to work toward?",
        summary: "Clarify the goal",
        methods: [],
        changes: [],
      });
    },
  );
  const result = await service.chat(
    user.id,
    "Help me plan",
    "general",
    "web",
    "automatic-coaching-001",
  );
  assert.equal(called, true);
  assert.equal(result.data.messages.length, 2);
  assert.equal(result.data.automation.enabled, false);
  assert.equal(result.data.goals.length, 0);
});

test("explicit chat creation saves a linked goal and next action once", async (t) => {
  const { db, user } = fixture(t);
  const service = new Service(
    db,
    researched(async (_config, _instructions, _context, schema) =>
      schema.parse({
        reply: "Your goal is ready.",
        summary: "Create the goal you requested.",
        methods: [],
        execution: "apply",
        changes: [change("goal", "create", coachGoalInput())],
      })),
    literature,
  );
  const response = await service.chat(
    user.id,
    "Create this goal now",
    "general",
    "web",
    "direct-create-001",
  );
  assert.equal(response.data.goals.length, 1);
  assert.equal(response.data.goals[0].status, "Draft");
  assert.equal(response.data.actions[0].goalId, response.data.goals[0].id);
  assert.equal(response.proposal.status, "applied");
  assert.equal(
    response.data.messages.at(-1).links[0].goalId,
    response.data.goals[0].id,
  );
  await service.chat(
    user.id,
    "Create this goal now",
    "general",
    "web",
    "direct-create-001",
  );
  assert.equal(db.snapshot(user.id).data.goals.length, 1);
});

test("the coach researches its own questions, repairs invented citations, and saves the source-backed plan", async (t) => {
  const { db, user } = fixture(t);
  let calls = 0;
  const service = new Service(db, async (_config, _instructions, context: any, schema) => {
    if (context.task === "review-plan") return schema.parse({ issues: [] });
    calls++;
    if (calls === 1) return schema.parse({ reply: "I’m investigating feedback during writing.", summary: "Research", methods: [], changes: [], researchQueries: ["writing feedback monitoring outcomes"] });
    assert.equal(context.researchSearches[0].queries[0], "writing feedback monitoring outcomes");
    assert.match(context.researchSearches[0].sources[0].summary, /138 experimental studies/);
    if (calls === 3) assert.match(context.validationError, /Do not invent citations/);
    return schema.parse({ reply: "Review the draft and start when ready.", summary: "A provisional writing approach", methods: [], execution: "apply", changes: [change("goal", "create", { ...coachGoalInput(), basis: { ...basis, evidence: calls === 2 ? [{ ...basis.evidence[0], sourceId: "invented-study" }] : basis.evidence, sources: [] } })] });
  }, literature);
  const result = await service.chat(user.id, "Help me develop my essay goal.");
  assert.equal(calls, 3);
  assert.equal(result.data.goals[0].status, "Draft");
  assert.equal(result.data.goals[0].plans[0].basis.sources[0].id, "epmc:MED:26479070");
  assert.equal(result.data.goals[0].plans[0].basis.sources[0].access, "abstract");
  assert.equal(result.data.decisions[0].research[0].queries[0], "writing feedback monitoring outcomes");
  assert.equal(result.data.actions.length, 1);
});

test("unsupported citations cannot be saved after the repair attempt", async (t) => {
  const { db, user } = fixture(t);
  const service = new Service(db, researched(async (_config, _instructions, _context, schema) => schema.parse({ reply: "A plan", summary: "A plan", methods: [], execution: "apply", changes: [change("goal", "create", { ...coachGoalInput(), basis: { ...basis, evidence: [{ ...basis.evidence[0], sourceId: "fabricated" }] } })] })), literature);
  await assert.rejects(service.chat(user.id, "Create the essay goal"), /Do not invent citations/);
  assert.equal(db.snapshot(user.id).data.goals.length, 0);
  assert.equal(db.snapshot(user.id).data.messages.length, 1);
  assert.equal(db.snapshot(user.id).data.messages[0].role, "user", "Keep the valid report; no unchecked coaching is saved");
});

test("an evidence review sends unsupported causal claims back for correction before saving", async (t) => {
  const { db, user } = fixture(t);
  let revisions = 0;
  let reviews = 0;
  const service = new Service(db, async (_config, _instructions, context: any, schema) => {
    if (context.task === "review-plan") {
      reviews++;
      assert.equal(db.snapshot(user.id).data.goals.length, 0);
      assert.equal(context.effectiveGoals[0].target, 2);
      return schema.parse({ issues: reviews === 1 ? [{ changeIndex: 0, issue: "The proposed claim says the intervention guarantees success.", correction: "Describe the average result and uncertainty for this individual." }] : [] });
    }
    if (!context.researchSearches.length) return schema.parse({ reply: "Checking evidence", summary: "Research", methods: [], changes: [], researchQueries: ["progress monitoring"] });
    revisions++;
    if (revisions === 2) assert.match(context.validationError, /guarantees success/);
    return schema.parse({ reply: "A plan to review", summary: "Plan", methods: [], execution: "apply", changes: [change("goal", "create", { ...coachGoalInput(), basis: { ...basis, evidence: [{ ...basis.evidence[0], finding: revisions === 1 ? "This guarantees success." : basis.evidence[0].finding }] } })] });
  }, literature);
  const result = await service.chat(user.id, "Create my essay goal");
  assert.equal(reviews, 2);
  assert.equal(revisions, 2);
  assert.equal(result.data.goals[0].plans[0].basis.evidence[0].finding, basis.evidence[0].finding);
});

test("unavailable research can produce an explicitly provisional plan without fabricated sources", async (t) => {
  const { db, user } = fixture(t);
  const service = new Service(db, researched(async (_config, _instructions, context: any, schema) => {
    assert.equal(context.researchSearches[0].sources.length, 0);
    assert(context.researchSearches[0].unavailable.length);
    return schema.parse({ reply: "Research search is unavailable. This is a provisional plan to discuss.", summary: "Provisional plan", methods: [], changes: [change("goal", "create", { ...coachGoalInput(), basis: { ...basis, evidence: [], uncertainty: "Search was unavailable. There is no retrieved evidence for this individual approach." } })] });
  }), async (queries) => ({ queries, sources: [], unavailable: queries, searchedAt: new Date().toISOString() }));
  const result = await service.chat(user.id, "Help me plan the essays");
  const values = JSON.parse(result.proposal.changes[0].values);
  assert.deepEqual(values.basis.sources.map((s: { id: string }) => s.id), ["method:implementation", "adler:P2", "curated:implementation-if-then"]);
  assert.ok(values.basis.sources.every((s: { access: string }) => ["method summary", "full text excerpt", "abstract"].includes(s.access)));
  assert.match(values.basis.uncertainty, /unavailable/);
});

test("starting a saved draft twice keeps one first action, and changing a metric archives the old observations", (t) => {
  const { db, user } = fixture(t);
  let data = applyChanges(db.snapshot(user.id).data, [change("goal", "create", { ...goalInput, status: "Draft", measure: { label: "First measurement", unit: "units", target: 20, baseline: 5 } }, "draft")], "2026-09-06");
  assert.equal(data.goals[0].status, "Draft");
  data = applyChanges(data, [change("goal", "update", { status: "Active" }, "draft"), change("goal", "update", { status: "Active" }, "draft")], "2026-09-06");
  assert.equal(data.actions.length, 1);
  assert.equal(data.actions[0].outcome, undefined);
  data = applyChanges(data, [change("goal", "update", { measure: { label: "A different result", unit: "other units", target: 3, baseline: null } }, "draft")], "2026-09-06");
  assert.equal(data.goals[0].results.length, 0);
  assert.equal(data.goals[0].measurementHistory![0].results[0].value, 5);
  assert.equal(data.goals[0].measurementHistory![0].unit, "units");
  assert.equal(data.goals[0].checkpoints!.at(-1)!.value, 3);
});

test("a measured personal goal keeps distance separate from milestone and action completion", (t) => {
  const { db, user } = fixture(t);
  const data = db.snapshot(user.id).data;
  const goal = createGoal(
    data,
    {
      ...goalInput,
      kind: "practical",
      title: "Run 5 km without stopping",
      measure: {
        label: "Longest continuous run",
        unit: "km",
        target: 5,
        baseline: 2,
      },
      milestones: [
        { title: "Run 3 km", criterion: "Watch records 3 continuous km" },
        { title: "Run 5 km", criterion: "Watch records 5 continuous km" },
      ],
    } as any,
    "2026-09-06",
    "run",
  );
  assert.equal(goal.target, 5);
  assert.equal(goal.results[0].value, 2);
  const updated = applyChanges(
    data,
    [
      change(
        "milestone",
        "update",
        { done: true },
        goal.milestones[0].id,
        goal.id,
      ),
    ],
    "2026-09-06",
  );
  assert.equal(updated.goals[0].results.at(-1)!.value, 2);
  assert.equal(updated.goals[0].target, 5);
});

test("chat repairs a rejected command and records a sourced insight with the saved change", async (t) => {
  const { db, user } = fixture(t);
  let calls = 0;
  const service = new Service(
    db,
    async (_config, _instructions, context: any, schema) => {
      if (context.task === "review-plan") return schema.parse({ issues: [] });
      calls++;
      if (calls === 2)
        assert.match(context.validationError, /Unrecognized key/);
      return schema.parse({
        reply: "Saved your preference.",
        summary: "Keep evenings free as requested.",
        methods: [],
        execution: "apply",
        changes: [
          change(
            "memory",
            "create",
            calls === 1
              ? { content: "Evenings are reserved." }
              : { text: "Evenings are reserved." },
          ),
        ],
        insights: [
          {
            finding: "Evenings are reserved.",
            status: "Reported",
            sourceIds: [context.currentMessageId],
            changeIndexes: [0],
          },
        ],
      });
    },
  );
  const response = await service.chat(
    user.id,
    "Remember that evenings are reserved",
    "general",
    "imessage",
    "repair-message-001",
  );
  assert.equal(calls, 2);
  assert.equal(response.data.memories.length, 1);
  assert.equal(
    response.data.decisions.at(-1).insights[0].sourceIds[0],
    response.data.messages[0].id,
  );
  assert.equal(response.proposal.status, "applied");
});

test("an ordinary chat reply can confirm a pending proposal without invalidating it", async (t) => {
  const { db, user } = fixture(t);
  let calls = 0;
  const service = new Service(
    db,
    researched(async (_config, _instructions, context: any, schema) => {
      calls++;
      if (calls === 1)
        return schema.parse({
          reply: "Here is the goal to review.",
          summary: "Create two essays.",
          methods: [],
          changes: [change("goal", "create", coachGoalInput())],
        });
      assert.equal(context.pendingProposals.length, 1);
      return schema.parse({
        reply: "Confirmed.",
        summary: "Apply the plan.",
        methods: [],
        changes: [],
        confirmProposalId: context.pendingProposals[0].id,
      });
    }),
    literature,
  );
  const first = await service.chat(
    user.id,
    "Help me set up two essays",
    "general",
    "web",
    "proposal-turn-001",
  );
  const second = await service.chat(
    user.id,
    "Yes, create that goal",
    "general",
    "mcp",
    "proposal-turn-002",
  );
  assert.equal(second.data.goals.length, 1);
  assert.equal(second.proposal.status, "applied");
  assert.equal(
    second.data.messages.at(-1).conversationId,
    first.conversationId,
  );
});

test("conversation folders isolate history, can move to a goal, and delete messages without deleting work", async (t) => {
  const { db, user } = fixture(t);
  const service = new Service(
    db,
    async (_config, _instructions, context: any, schema) => {
      if (context.task === "review-plan") return schema.parse({ issues: [] });
      assert(
        !context.conversation.some(
          (m: any) => m.text === "Private topic in first chat",
        ),
      );
      return schema.parse({
        reply: "We can work on this here.",
        summary: "New discussion.",
        methods: [],
        changes: [],
      });
    },
  );
  const state = db.snapshot(user.id);
  createGoal(state.data, goalInput, "2026-09-06", "goal-a");
  state.data.conversations.push({
    id: "chat-a",
    title: "First",
    goalId: "general",
    createdAt: new Date().toISOString(),
  });
  state.data.messages.push({
    id: "message-a",
    conversationId: "chat-a",
    goalId: "general",
    role: "user",
    text: "Private topic in first chat",
  });
  db.save(user.id, state.data, state.revision, "web", "Fixture");
  await service.editConversation(
    user.id,
    change(
      "conversation",
      "create",
      { title: "Second", goalId: "general" },
      "chat-b",
    ),
  );
  await service.chat(
    user.id,
    "A different topic",
    "general",
    "web",
    "separate-thread-001",
    undefined,
    "chat-b",
  );
  await service.editConversation(
    user.id,
    change(
      "conversation",
      "update",
      { title: "Essay planning", goalId: "goal-a" },
      "chat-b",
    ),
  );
  assert.equal(
    db.snapshot(user.id).data.conversations.find((c) => c.id === "chat-b")!
      .goalId,
    "goal-a",
  );
  await service.editConversation(
    user.id,
    change("conversation", "delete", {}, "chat-a"),
  );
  const saved = db.snapshot(user.id).data;
  assert(!saved.messages.some((m) => m.id === "message-a"));
  assert.equal(saved.goals.length, 1);
  assert.equal(saved.conversations.length, 1);
  await assert.rejects(
    service.chat(
      user.id,
      "Hello",
      "general",
      "web",
      "deleted-thread-001",
      undefined,
      "chat-a",
    ),
    /deleted/,
  );
});


test("cue-only edits preserve the researched measurement and action duration", (t) => {
  const { db, user } = fixture(t);
  const data = db.snapshot(user.id).data;
  createGoal(data, { ...goalInput, durationMinutes: 45 }, "2026-09-01", "essays");
  const plan = currentPlan(data.goals[0]);
  applyPlan(data, "essays", plan.version, { action: plan.action, criterion: plan.criterion, timing: "After breakfast" });
  const updated = currentPlan(data.goals[0]);
  assert.equal(updated.durationMinutes, 45);
  assert.deepEqual(updated.basis, basis);
  assert.equal(data.actions[0].planVersion, updated.version);
  assert.equal(data.actions[0].timing, "After breakfast");
});

test("first-day reviews wait for a week of observations and calendar reservations recur", (t) => {
  const { db, user } = fixture(t);
  const data = db.snapshot(user.id).data;
  createGoal(data, goalInput, "2026-09-06", "essays");
  const now = new Date("2026-09-06T13:00:00Z");
  assert.equal(reviewSchedule(data, now).due, false);
  assert.equal(reviewSchedule(data, now).nextDate, "2026-09-13");
  assert.equal(reviewBlock(data, "2026-09-14", now)?.start, "2026-09-20T21:00:00.000Z");
  data.actions[0].outcome = "Done";
  assert.equal(reviewSchedule(data, now).due, true);
});

test("command scheduling cannot overlap the weekly review reservation", (t) => {
  const { db, user } = fixture(t);
  const data = db.snapshot(user.id).data;
  createGoal(data, goalInput, addDays(dateInZone(data.timeZone), -7), "essays");
  const review = reviewBlock(data, addDays(dateInZone(data.timeZone), 1))!;
  assert.throws(() => applyChanges(data, [change("workBlock", "create", {
    action: "Draft five points", ...review, provider: "local",
  }, "reserved-work", "essays")], dateInZone(data.timeZone)), /overlaps your weekly review/);
  assert.equal(data.workBlocks.length, 0);
});
