import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:http";
import { Database } from "../server/database.ts";
import { Service } from "../server/service.ts";
import { Channels } from "../server/channels.ts";
import { createRuntime } from "../server/api.ts";
import { parseLinq, verifyLinq, sendLinq, reactLinq } from "../server/linq.ts";
import type { generate } from "../server/providers.ts";

const sender = "+14165550000",
  recipient = "+14165550111",
  chatId = "11111111-1111-4111-8111-111111111111";
function environment(t: test.TestContext) {
  const settings = {
    MESSAGING_PROVIDER: "linq",
    LINQ_API_KEY: "fixture-api-key",
    LINQ_NUMBER: sender,
    LINQ_WEBHOOK_SECRET: `whsec_${Buffer.from("a-secret-used-only-by-tests-12345").toString("base64")}`,
    PUBLIC_URL: "https://backend.example.test",
  };
  const old = Object.fromEntries(
    Object.keys(settings).map((key) => [key, process.env[key]]),
  );
  Object.assign(process.env, settings);
  t.after(() => {
    for (const key of Object.keys(settings)) {
      if (old[key] === undefined) delete process.env[key];
      else process.env[key] = old[key];
    }
  });
}
function envelope(event_type: string, data: unknown) {
  return {
    api_version: "v3",
    webhook_version: "2026-02-03",
    event_type,
    event_id: randomUUID(),
    created_at: new Date().toISOString(),
    partner_id: "fixture-partner",
    data,
  };
}
function incoming(text: string, service = "iMessage", from = recipient) {
  return envelope("message.received", {
    id: randomUUID(),
    chat: {
      id: chatId,
      is_group: false,
      owner_handle: { handle: sender, is_me: true },
    },
    direction: "inbound",
    sender_handle: { handle: from, is_me: false },
    parts: [{ type: "text", value: text }],
    service,
  });
}
function signed(
  raw: string,
  timestamp = Math.floor(Date.now() / 1000).toString(),
) {
  const eventId = randomUUID();
  const signature = createHmac(
    "sha256",
    Buffer.from(process.env.LINQ_WEBHOOK_SECRET!.slice(6), "base64"),
  )
    .update(`${eventId}.${timestamp}.${raw}`)
    .digest("base64");
  return {
    "webhook-id": eventId,
    "webhook-timestamp": timestamp,
    "webhook-signature": `v1,${signature}`,
  };
}
function fixture(t: test.TestContext, runner?: typeof generate) {
  environment(t);
  const directory = mkdtempSync(join(tmpdir(), "adler-linq-")),
    db = new Database(directory);
  t.after(() => {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  });
  const user = db.createUser(
    "native-user",
    "a-long-test-password",
    "America/Toronto",
  );
  db.setSecret(user.id, "model-choice", {
    provider: "gemini",
    model: "fixture-model",
    useServer: false,
  });
  db.setSecret(user.id, "model-gemini", { key: "fixture-provider-key" });
  const service = new Service(db, runner);
  const sends: { sid: string; body: string; deliveryId: string }[] = [];
  const channels = new Channels(
    db,
    service,
    async (_address, body, _callback, deliveryId) => {
      const sent = { sid: randomUUID(), body, deliveryId };
      sends.push(sent);
      return { sid: sent.sid, status: "accepted" };
    },
  );
  service.onReaction = (...args) => channels.queueReaction(...args);
  const accept = (input: unknown) => {
    const event = parseLinq(JSON.stringify(input));
    if (event) channels.acceptLinq(event);
  };
  const drain = async () => {
    for (let i = 0; i < 20; i++) {
      const pending = db.sql
        .prepare("SELECT COUNT(*) AS count FROM jobs WHERE status='pending'")
        .get() as { count: number };
      const unsent = db.sql
        .prepare(
          "SELECT COUNT(*) AS count FROM deliveries WHERE status='queued'",
        )
        .get() as { count: number };
      if (!pending.count && !unsent.count) return;
      await channels.tick();
    }
    assert.fail("Worker did not drain its jobs.");
  };
  return { db, user, service, channels, accept, drain, sends };
}

test("Linq verifies raw signed bytes, timestamps and the configured receiving line", (t) => {
  environment(t);
  const event = incoming("Hello"),
    raw = JSON.stringify(event),
    headers = signed(raw);
  assert(verifyLinq(raw, headers));
  assert(!verifyLinq(raw + " ", headers));
  assert(
    !verifyLinq(raw, signed(raw, String(Math.floor(Date.now() / 1000) - 301))),
  );
  assert(!verifyLinq(raw, { ...headers, "webhook-signature": "v1,incorrect" }));
  assert(!verifyLinq(raw, { ...headers, "webhook-timestamp": "NaN" }));
  assert.equal(parseLinq(raw)?.kind, "message");
  const other = incoming("Hello");
  (other.data as any).chat.owner_handle.handle = "+14165550999";
  assert.equal(parseLinq(JSON.stringify(other)), null);
  (event.data as any).chat.is_group = true;
  assert.equal(parseLinq(JSON.stringify(event)), null);
  assert.throws(() =>
    parseLinq(
      JSON.stringify({ ...incoming("Hello"), webhook_version: "2025-01-01" }),
    ),
  );
});

test("native messages, tapbacks and SMS confirmations use one coach and never approve by reaction", async (t) => {
  let calls = 0;
  const runner: typeof generate = async (
    _config,
    _instructions,
    context,
    schema,
  ) => {
    calls++;
    assert.equal((context as { channel: string }).channel, "imessage");
    return schema.parse({
      reply: "I can remember your preference for morning work.",
      summary: "Prefer mornings.",
      methods: [],
      reaction: "like",
      changes: [
        {
          reason:
            "The user asked Adler to remember their preference for mornings.",
          entity: "memory",
          operation: "create",
          id: null,
          parentId: null,
          values: JSON.stringify({ text: "I prefer mornings." }),
        },
      ],
    });
  };
  const f = fixture(t, runner);
  const nativeReactions: unknown[] = [];
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    assert(String(url).endsWith("/reactions"));
    nativeReactions.push(JSON.parse(String(init?.body)));
    return new Response("{}", { status: 200 });
  };
  t.after(() => {
    globalThis.fetch = previousFetch;
  });
  const pair = f.channels.pair(f.user.id, recipient, "sms");
  const pairing = incoming(pair.send);
  f.accept(pairing);
  f.accept(pairing);
  await f.drain();
  assert.equal(f.sends.length, 1);
  assert.equal(calls, 0);
  const turn = incoming("Remember that I prefer mornings.");
  f.accept(turn);
  f.accept(turn);
  f.accept({ ...turn, event_id: randomUUID() });
  await f.drain();
  assert.equal(calls, 1);
  assert.deepEqual(nativeReactions, [
    { operation: "add", type: "like", part_index: 0 },
  ]);
  const conversation = f.db.snapshot(f.user.id).data.messages;
  assert.equal(conversation[0].channel, "imessage");
  assert.equal(conversation[0].reactions?.coach?.type, "like");
  assert.equal(f.db.snapshot(f.user.id).data.memories.length, 0);
  const reply = f.sends.find((send) => send.body.includes("I can remember"))!;
  const reaction = (
    type: string,
    at: string,
    remove = false,
    from = recipient,
  ) =>
    envelope(remove ? "reaction.removed" : "reaction.added", {
      chat_id: chatId,
      message_id: reply.sid,
      part_index: 0,
      reaction_type: type,
      from,
      is_from_me: false,
      reacted_at: at,
    });
  const first = new Date(Date.now() + 1000).toISOString(),
    later = new Date(Date.now() + 2000).toISOString();
  const liked = reaction("like", first);
  f.accept(liked);
  f.accept(liked);
  await f.drain();
  assert.equal(
    f.db.snapshot(f.user.id).data.messages[1].reactions?.user?.type,
    "like",
  );
  assert.equal(f.service.listProposals(f.user.id)[0].status, "pending");
  assert.equal(calls, 1);
  f.accept(reaction("love", later));
  f.accept(reaction("like", first, true));
  f.accept(
    reaction(
      "dislike",
      new Date(Date.now() + 3000).toISOString(),
      false,
      "+14165550222",
    ),
  );
  await f.drain();
  assert.equal(
    f.db.snapshot(f.user.id).data.messages[1].reactions?.user?.type,
    "love",
  );
  const proposal = f.service.listProposals(f.user.id)[0];
  f.accept(incoming(`CONFIRM ${proposal.id}`, "SMS"));
  await f.drain();
  assert.equal(
    f.db.snapshot(f.user.id).data.memories[0].text,
    "I prefer mornings.",
  );
  assert.equal(f.db.snapshot(f.user.id).data.messages.at(-1)?.channel, "sms");
  assert.equal(calls, 1);
});

test("pairing rejects another phone and unpaired senders cannot reach the model", async (t) => {
  const f = fixture(t);
  const pair = f.channels.pair(f.user.id, recipient, "sms");
  f.accept(incoming(pair.send, "iMessage", "+14165550222"));
  f.accept(incoming("Read my goals", "SMS", "+14165550222"));
  await f.drain();
  assert.equal(
    f.db.sql.prepare("SELECT COUNT(*) AS count FROM phone_links").get()?.count,
    0,
  );
  assert.equal(f.sends.length, 0);
  f.accept(incoming(pair.send));
  await f.drain();
  f.accept(incoming("STOP"));
  await f.drain();
  assert.equal(
    f.db.sql
      .prepare("SELECT opted_out FROM phone_links WHERE user_id=?")
      .get(f.user.id)?.opted_out,
    1,
  );
  f.accept(incoming("Tell me my goals"));
  await f.drain();
  assert.equal(f.db.snapshot(f.user.id).data.messages.length, 0);
  assert.equal(f.sends.length, 1);
});

test("known-chat sends preserve idempotency and leave protocol fallback enabled", async (t) => {
  environment(t);
  const original = globalThis.fetch,
    requests: { url: string; body: any }[] = [];
  globalThis.fetch = async (url, init) => {
    assert.equal(
      (init?.headers as Record<string, string>).Authorization,
      "Bearer fixture-api-key",
    );
    requests.push({ url: String(url), body: JSON.parse(String(init?.body)) });
    return new Response(
      JSON.stringify({
        chat_id: chatId,
        message: {
          id: "native-message-id",
          delivery_status: "pending",
          service: "SMS",
        },
      }),
      { status: 202 },
    );
  };
  t.after(() => {
    globalThis.fetch = original;
  });
  const response = await sendLinq(chatId, "Hello", "immutable-outbox-id");
  assert.deepEqual(response, {
    sid: "native-message-id",
    status: "accepted",
    service: "SMS",
  });
  assert.deepEqual(requests[0], {
    url: `https://api.linqapp.com/api/partner/v3/chats/${chatId}/messages`,
    body: {
      message: {
        parts: [{ type: "text", value: "Hello" }],
        idempotency_key: "immutable-outbox-id",
      },
    },
  });
  await reactLinq("native-message-id", "love", true);
  assert.deepEqual(requests[1].body, {
    operation: "remove",
    type: "love",
    part_index: 0,
  });
  let attempts = 0;
  globalThis.fetch = async () => {
    attempts++;
    throw new Error("timeout");
  };
  await assert.rejects(sendLinq(chatId, "Hello", "same-outbox-id"));
  assert.equal(attempts, 1);
});

test("Linq receipts preserve the latest delivery state and sender changes require pairing again", async (t) => {
  const f = fixture(t);
  const pair = f.channels.pair(f.user.id, recipient, "sms");
  f.accept(incoming(pair.send));
  await f.drain();
  const snapshot = f.db.snapshot(f.user.id);
  snapshot.data.messages.push({
    id: "coach-message",
    role: "coach",
    goalId: "general",
    channel: "imessage",
    text: "How did the session go?",
  });
  f.db.save(
    f.user.id,
    snapshot.data,
    snapshot.revision,
    "web",
    "Save check-in",
  );
  f.channels.queueText(
    f.user.id,
    "native-outbox",
    "How did the session go?",
    "coach-message",
  );
  await f.drain();
  const sent = f.sends.at(-1)!;
  const receipt = (status: string) =>
    envelope(`message.${status}`, {
      id: sent.sid,
      chat: {
        id: chatId,
        is_group: false,
        owner_handle: { handle: sender, is_me: true },
      },
      direction: "outbound",
      sender_handle: { handle: sender, is_me: true },
      parts: [{ type: "text", value: sent.body }],
      service: "iMessage",
      idempotency_key: sent.deliveryId,
    });
  f.accept(receipt("delivered"));
  f.accept(receipt("sent"));
  f.accept(receipt("read"));
  f.accept(
    envelope("message.failed", {
      chat_id: chatId,
      message_id: sent.sid,
      code: 4006,
    }),
  );
  await f.drain();
  assert.equal(
    f.db.sql.prepare("SELECT status FROM deliveries WHERE sid=?").get(sent.sid)
      ?.status,
    "read",
  );
  process.env.LINQ_NUMBER = "+14165550999";
  assert.equal(f.channels.status(f.user.id).link, null);
  f.channels.queueText(f.user.id, "wrong-sender", "This must not send");
  await f.drain();
  assert.equal(f.sends.length, 2);
});

test("signed HTTP webhooks acknowledge persisted work before running the coach", async (t) => {
  environment(t);
  const directory = mkdtempSync(join(tmpdir(), "adler-linq-http-"));
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
  process.env.PUBLIC_URL = `https://127.0.0.1:${port}`;
  t.after(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    runtime.close();
    rmSync(directory, { recursive: true, force: true });
  });
  const user = runtime.db.createUser(
    "http-user",
    "a-long-test-password",
    "UTC",
  );
  const pair = runtime.channels.pair(user.id, recipient, "sms");
  const raw = JSON.stringify(incoming(pair.send));
  const post = (headers: Record<string, string>) =>
    fetch(`http://127.0.0.1:${port}/api/webhooks/linq?version=2026-02-03`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: raw,
    });
  assert.equal((await post({})).status, 403);
  assert.equal((await post(signed(raw))).status, 200);
  assert.equal((await post(signed(raw))).status, 200);
  assert.equal(
    runtime.db.sql
      .prepare("SELECT COUNT(*) AS count FROM jobs WHERE kind='linq-event'")
      .get()?.count,
    1,
  );
  assert.equal(
    runtime.db.sql.prepare("SELECT COUNT(*) AS count FROM phone_links").get()
      ?.count,
    0,
  );
  assert.equal(runtime.db.snapshot(user.id).data.messages.length, 0);
});
