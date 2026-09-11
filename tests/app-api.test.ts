import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer, request as httpRequest } from "node:http";
import { randomUUID } from "node:crypto";
import { createRuntime } from "../server/api.ts";
import { applyChanges, type Change } from "../server/commands.ts";
import { createGoal } from "../shared/validation.ts";
import { initialData, type Data } from "../shared/workspace.ts";
import { addDays, dateInZone } from "../shared/journey.ts";
import type { LearningRecord } from "../shared/learning.ts";
import { adaptiveFixture, adaptiveWorkspace } from "./adaptive-fixture.ts";
import {
  calendarView,
  coachView,
  goalDetailView,
  goalsView,
  insightsView,
  learningDetailView,
  sessionView,
  settingsView,
  todayView,
} from "../shared/app-views.ts";

const change = (
  entity: Change["entity"],
  operation: Change["operation"],
  values: unknown,
  id: string | null = null,
  parentId: string | null = null,
): Change => ({
  entity,
  operation,
  id,
  parentId,
  reason: "Recorded from the app at the person’s request.",
  values: JSON.stringify(values),
});

// A fictional example account. Nothing here describes a real customer.
const essayGoal = (today: string) => ({
  title: "Publish two essays",
  kind: "project" as const,
  why: "Explain my work clearly",
  success: "Two published essays with a clear problem and result",
  area: "Career" as const,
  tags: ["Writing"],
  targetDate: addDays(today, 28),
  status: "Draft" as const,
  milestones: [
    { title: "First essay published", criterion: "A published URL" },
    { title: "Second essay published", criterion: "A published URL" },
  ],
  assessmentTarget: 8,
  baseline: null,
  action: "Draft five main points",
  criterion: "Five main points are on the page",
  timing: "After lunch",
});

async function fixture(t: test.TestContext) {
  const directory = mkdtempSync(join(tmpdir(), "adler-app-"));
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
  });
  let cookie = "";
  async function call(path: string, payload?: unknown, headers: Record<string, string> = {}) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: payload === undefined ? "GET" : "POST",
      headers: {
        ...(cookie ? { cookie } : {}),
        ...(payload === undefined ? {} : { "Content-Type": "application/json" }),
        ...headers,
      },
      ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
    });
    const text = await response.text();
    return {
      status: response.status,
      body: (text ? JSON.parse(text) : {}) as any,
      headers: response.headers,
    };
  }
  // Host-specific checks need a raw request; fetch manages the Host header itself.
  const withHost = (path: string, host: string) =>
    new Promise<number>((resolve, reject) => {
      const request = httpRequest(
        `http://127.0.0.1:${port}${path}`,
        { method: "GET", headers: { Host: host } },
        (response) => {
          response.resume();
          response.on("end", () => resolve(response.statusCode ?? 0));
        },
      );
      request.on("error", reject);
      request.end();
    });
  async function register(username: string) {
    const response = await call("/api/auth/register", {
      username,
      password: "a-long-test-password",
      timeZone: "UTC",
    });
    assert.equal(response.status, 200, JSON.stringify(response.body));
    cookie = response.headers.get("set-cookie")!.split(";")[0];
    return response.body as { user: { id: string }; revision: number };
  }
  async function changes(list: Change[], revision: number, goalId?: string) {
    return call("/api/app/changes", {
      changes: list,
      revision,
      requestId: randomUUID(),
      ...(goalId ? { goalId } : {}),
    });
  }
  return { runtime, call, withHost, register, changes };
}

const readRoutes = [
  "/api/app/session",
  "/api/app/today",
  "/api/app/goals",
  "/api/app/coach",
  "/api/app/insights",
  "/api/app/calendar",
  "/api/app/settings",
];

test("every app view requires a signed-in session", async (t) => {
  const { call } = await fixture(t);
  for (const route of readRoutes) {
    const response = await call(route);
    assert.equal(response.status, 401, route);
    assert.equal(response.body.error, "Sign in to your workspace.");
  }
  const write = await call("/api/app/changes", {
    changes: [change("memory", "create", { text: "Anything" })],
    revision: 0,
    requestId: randomUUID(),
  });
  assert.equal(write.status, 401);
});

test("the app builds every view from the shared workspace and edits it through the command catalog", async (t) => {
  const { call, register, changes, runtime } = await fixture(t);
  const account = await register("app-reader");
  const today = dateInZone("UTC");

  const session = await call("/api/app/session");
  assert.equal(session.status, 200);
  assert.equal(session.body.user.username, "app-reader");
  assert.equal(session.body.today, today);
  assert.equal(session.body.counts.goals, 0);
  assert.equal(typeof session.body.status.serverKeysAllowed, "boolean");
  assert.equal(session.body.preferences.timeZone, "UTC");

  const created = await changes(
    [change("goal", "create", essayGoal(today), "essays")],
    account.revision,
  );
  assert.equal(created.status, 200, JSON.stringify(created.body));
  assert.equal(created.body.revision, account.revision + 1);
  assert.equal(created.body.today.goals.length, 1);
  assert.equal(created.body.today.next.goal.id, "essays");
  assert.equal(created.body.today.next.phase, "draft");
  assert.equal(created.body.today.next.phaseLabel, "YOUR PLAN IS READY");
  assert.equal(created.body.today.next.canStartGoal, true);
  assert.equal(created.body.today.progress[0].label, "Draft");
  assert.equal(created.body.today.progress[0].actionLabel, "Shape the plan");
  assert.equal(created.body.today.quietDay, false);
  let revision = created.body.revision as number;

  const goals = await call("/api/app/goals");
  assert.equal(goals.status, 200);
  assert.equal(goals.body.rows.length, 1);
  assert.equal(goals.body.rows[0].goal.id, "essays");
  assert.equal(goals.body.rows[0].resultLabel, "0 of 2 milestones complete");
  assert.equal(goals.body.rows[0].outlook, "Goal finish not yet estimated");
  assert.equal(goals.body.rows[0].series, null, "A goal without a behavior step has no input series");
  assert.equal(goals.body.rows[0].activity.length % 7, 0);
  assert.equal(goals.body.budget.budgetMinutes, 120);
  assert.deepEqual(goals.body.groups, [{ status: "Draft", goalIds: ["essays"] }]);

  const detail = await call("/api/app/goals/essays");
  assert.equal(detail.status, 200);
  assert.equal(detail.body.plans.length, 1);
  assert.equal(detail.body.plans[0].steps.length, 0);
  assert.equal(detail.body.milestones.length, 2);
  assert.equal(detail.body.milestones[0].statusLabel, "In progress");
  assert.equal(detail.body.actions.length, 1);
  assert.equal(detail.body.actions[0].executionLabel, "Upcoming");
  assert.equal(detail.body.projection.projection, null);
  assert.equal(
    detail.body.rationale.note,
    "This plan records your chosen work. No behavioural interpretation is saved for this version.",
  );
  assert.equal(detail.body.journey[0].label, "Starting plan");
  assert.equal(detail.body.streak.count, 0);
  assert.equal((await call("/api/app/goals/missing")).status, 404);

  const started = await call("/api/app/goals/essays/start", {});
  assert.equal(started.status, 200, JSON.stringify(started.body));
  assert.equal(started.body.goal.goal.status, "Active");
  assert.equal(started.body.today.next.phase, "schedule");
  revision = started.body.revision;
  assert.equal(
    (await call("/api/app/goals/essays/start", {})).body.error,
    "Only a draft plan can be started.",
  );

  const actionId = started.body.goal.actions[0].id as string;
  const begun = await call(`/api/app/actions/${actionId}/start`, { goalId: "essays" });
  assert.equal(begun.status, 200, JSON.stringify(begun.body));
  assert.equal(begun.body.today.next.action.startedAt !== null, true);
  assert.equal(begun.body.today.next.action.date, today);
  assert.equal(begun.body.today.lineup[0].stateLabel, "Started");
  revision = begun.body.revision;
  assert.equal(
    (await call(`/api/app/actions/${actionId}/start`, {})).body.error,
    "This action already started.",
  );
  assert.equal((await call("/api/app/actions/nope/start", {})).status, 404);

  const reported = await changes(
    [
      change(
        "action",
        "update",
        { outcome: "Done", actualMinutes: 30, note: "Wrote the five points before lunch." },
        actionId,
      ),
    ],
    revision,
    "essays",
  );
  assert.equal(reported.status, 200, JSON.stringify(reported.body));
  assert.equal(reported.body.today.doneCount, 1);
  assert.equal(reported.body.today.plannedCount, 1);
  assert.equal(reported.body.today.lineup[0].state, "done");
  assert.equal(reported.body.today.lineup[0].stateLabel, "Done");
  assert.equal(reported.body.today.lineup[0].action.actualMinutes, 30);
  const record = reported.body.goal.actions.find((item: { id: string }) => item.id === actionId);
  assert.equal(record.outcome, "Done");
  assert.equal(record.execution, "done");
  assert.equal(record.history.length, 1, "The earlier state is kept as a correctable receipt");
  assert.equal(record.history[0].outcome, null);
  assert.equal(reported.body.goal.streak.count, 1);
  assert.equal(reported.body.goal.streak.completedCount, 1, "Completed actions inside the streak window");
  assert.equal(reported.body.today.progress[0].actionLabel, "Review plan");
  revision = reported.body.revision;

  const conversation = await changes(
    [change("conversation", "create", { title: "Planning", goalId: "essays" }, "chat-1")],
    revision,
  );
  assert.equal(conversation.status, 200, JSON.stringify(conversation.body));
  revision = conversation.body.revision;
  const coach = await call("/api/app/coach");
  assert.equal(coach.body.conversations.length, 1);
  assert.equal(coach.body.conversations[0].goalTitle, "Publish two essays");
  assert.equal(coach.body.conversations[0].messageCount, 0);
  assert.equal(coach.body.selectedConversationId, null);
  assert.equal(coach.body.model.configured, typeof coach.body.model.configured === "boolean");
  assert(coach.body.quickPrompts.length > 0);
  const thread = await call("/api/app/coach/chat-1");
  assert.equal(thread.body.selectedConversationId, "chat-1");
  assert.deepEqual(thread.body.messages, []);
  assert.deepEqual(thread.body.proposals, []);
  assert.equal((await call("/api/app/coach/missing")).status, 404);

  const saved = await changes(
    [change("memory", "create", { text: "Mornings are the quietest time to write." }, "memory-app")],
    revision,
  );
  revision = saved.body.revision;
  const insights = await call("/api/app/insights");
  assert.deepEqual(insights.body.tryingNow, []);
  assert.deepEqual(insights.body.learned, []);
  assert.deepEqual(insights.body.history, []);
  assert.deepEqual(insights.body.observations, []);
  assert.equal(insights.body.memories.length, 1);
  assert.equal(insights.body.memories[0].corrected, false);
  assert.equal((await call("/api/app/insights/nothing")).status, 404);

  const calendar = await call(`/api/app/calendar?start=${today}`);
  assert.equal(calendar.body.days.length, 7);
  assert.equal(calendar.body.timeZone, "UTC");
  assert.equal(calendar.body.availability.coverage, "unknown");
  assert.equal(calendar.body.workingHours.sessionMinutes, 25);
  assert.equal(calendar.body.calendars.google.connected, false);
  assert.equal((await call("/api/app/calendar?start=not-a-date")).status, 200);

  const settings = await call("/api/app/settings");
  assert.equal(settings.body.user.username, "app-reader");
  assert.equal(settings.body.program.weeklyMinutes, 120);
  assert.equal(settings.body.methods.length, 7);
  assert.deepEqual(settings.body.tokens, []);
  assert.equal(settings.body.publicUrl, null);
  assert.equal(settings.body.preferences.automation.enabled, false);

  assert.equal((await call("/api/app/nowhere")).status, 404);
  assert.equal(runtime.db.snapshot(account.user.id).revision, revision);
});

test("app changes carry a revision check, request idempotency, and no new scientific rationale", async (t) => {
  const { call, register, changes, runtime } = await fixture(t);
  const account = await register("app-writer");
  const today = dateInZone("UTC");
  const created = await changes(
    [change("goal", "create", essayGoal(today), "essays")],
    account.revision,
  );
  assert.equal(created.status, 200, JSON.stringify(created.body));
  const revision = created.body.revision as number;

  const stale = await changes([change("memory", "create", { text: "Late change" })], account.revision);
  assert.equal(stale.status, 409);
  assert.equal(stale.body.revision, revision);
  assert.match(stale.body.error, /changed in another channel/);

  const requestId = randomUUID();
  const payload = {
    changes: [change("memory", "create", { text: "Evenings are busy." }, "memory-once")],
    revision,
    requestId,
  };
  const first = await call("/api/app/changes", payload);
  assert.equal(first.status, 200);
  const replay = await call("/api/app/changes", payload);
  assert.equal(replay.status, 200);
  assert.equal(replay.body.revision, first.body.revision);
  assert.equal(runtime.db.snapshot(account.user.id).data.memories.length, 1);
  assert.equal(runtime.db.snapshot(account.user.id).revision, first.body.revision);
  const reused = await call("/api/app/changes", {
    changes: [change("memory", "create", { text: "Something else" })],
    revision: first.body.revision,
    requestId,
  });
  assert.equal(reused.status, 400);
  assert.match(reused.body.error, /request ID cannot be reused/);

  const plan = adaptiveFixture(today, today);
  const explained = await changes(
    [
      change(
        "plan",
        "update",
        {
          action: plan.steps[0].title,
          criterion: plan.steps[0].criterion,
          timing: plan.steps[0].cue,
          adaptive: plan,
        },
        null,
        "essays",
      ),
    ],
    first.body.revision,
  );
  assert.equal(explained.status, 400);
  assert.match(explained.body.error, /must use the shared coach/);
});

test("starting a plan built on corrected evidence is refused in the app", async (t) => {
  const { call, register, runtime } = await fixture(t);
  const account = await register("app-guard");
  const today = dateInZone("UTC");
  const data = adaptiveWorkspace(adaptiveFixture(today, today));
  const goal = data.goals[0];
  goal.status = "Draft";
  data.memories.push({
    id: "quiet-breakfast",
    date: addDays(today, -5),
    text: "Breakfast is usually the quiet part of my morning.",
  });
  const reasoning = structuredClone(goal.plans.at(-1)!.adaptive!.reasoning!);
  data.learning = [
    {
      id: "learning-corrected",
      goalIds: [goal.id],
      activeVersion: 1,
      state: "agreed",
      standing: "reconsider",
      versions: [
        {
          version: 1,
          decisionId: "decision-1",
          at: new Date().toISOString(),
          observation: "You reported that mornings are interrupted.",
          hypothesis: "An after-breakfast cue may make starting easier.",
          reasoning,
          sources: [
            {
              id: "quiet-breakfast",
              version: "1",
              kind: "context",
              occurredAt: addDays(today, -5),
              reportedAt: addDays(today, -5),
            },
          ],
          test: {
            change: "Outline right after breakfast.",
            design: "prospective",
            prediction: "Starting feels easier on the days the cue is used.",
            comparison: "Compared with the person's reported starting experience.",
            start: today,
            reviewAfter: addDays(today, 7),
            reviewRule: "Review after three reported attempts.",
            mechanismSignal: null,
            behaviorSignal: "Whether the outline happens after breakfast.",
            outcomeSignal: null,
            alternatives: [],
          },
          transfer: null,
          proposalId: null,
        },
      ],
      reviews: [],
      events: [],
      invalidations: [
        {
          at: new Date().toISOString(),
          sourceId: "quiet-breakfast",
          reason: "The context this relied on was corrected.",
          version: 1,
        },
      ],
    } satisfies LearningRecord,
  ];
  data.decisions.push({
    id: "decision-1",
    date: today,
    goalId: goal.id,
    programVersion: 1,
    planVersion: 1,
    mode: "live",
    status: "Reviewed",
    summary: "The after-breakfast cue was suggested from your reports.",
    methods: [],
    checks: [],
    insights: [
      {
        finding: "You reported that mornings are interrupted.",
        status: "Reported",
        sourceIds: ["quiet-breakfast"],
        changeIndexes: [],
      },
    ],
  });
  runtime.db.save(account.user.id, data, account.revision, "web", "Fictional coaching fixture");

  const refused = await call(`/api/app/goals/${goal.id}/start`, {});
  assert.equal(refused.status, 400);
  assert.match(refused.body.error, /corrected evidence/);
  assert.equal(runtime.db.snapshot(account.user.id).data.goals[0].status, "Draft");
  const detail = await call(`/api/app/goals/${goal.id}`);
  assert.equal(detail.body.needsPlanReview, true);
  assert.equal(detail.body.plans[0].steps[0].dates.length > 0, true);
  assert.equal(detail.body.rationale.reasoning.methodId, "implementation");
  assert.equal(detail.body.rationale.grounding.length, 1);
  const insights = await call("/api/app/insights");
  assert.equal(insights.body.tryingNow.length, 1);
  assert.equal(insights.body.tryingNow[0].standingLabel, "Evidence has changed");
  assert.deepEqual(
    insights.body.observations,
    [],
    "A decision a learning record already carries is not repeated as a loose observation",
  );
  const learning = await call("/api/app/insights/learning-corrected");
  assert.equal(learning.status, 200);
  assert.equal(learning.body.versions.length, 1);
  assert.equal(learning.body.invalidations.length, 1);
  assert.equal(learning.body.row.controls.agree, false);
  assert.equal(learning.body.row.controls.pause, true);
  assert.equal(learning.body.row.actionVersion, 1);
  assert.deepEqual(learning.body.row.sources, [
    {
      id: "quiet-breakfast",
      kind: "context",
      label: `Saved context · ${new Date(`${addDays(today, -5)}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      text: "Breakfast is usually the quiet part of my morning.",
      deepLink: "adler://insights?memory=quiet-breakfast",
    },
  ]);
  assert.equal(Array.isArray(learning.body.row.attempts), true);
  const cards = await call("/api/app/today");
  assert.equal(cards.body.learning[0].recordId, "learning-corrected");
  assert.equal(cards.body.learning[0].actionVersion, 1);
  assert.equal(cards.body.learning[0].controls.close, true);
  assert.equal(Array.isArray(cards.body.learning[0].attempts), true);
});

test("a pending proposal states what accepting would do before it is accepted", async (t) => {
  const { call, register, changes, runtime } = await fixture(t);
  const account = await register("app-proposal");
  const today = dateInZone("UTC");
  const created = await changes(
    [change("goal", "create", essayGoal(today), "essays")],
    account.revision,
  );
  const start = `${addDays(today, 1)}T15:00:00.000Z`;
  const milestoneId = runtime.db.snapshot(account.user.id).data.goals[0].milestones[0].id;
  const proposal = runtime.service.propose(
    account.user.id,
    [
      change("milestone", "update", { dueDate: addDays(today, 20) }, milestoneId, "essays"),
      change(
        "workBlock",
        "create",
        {
          action: "Draft five main points",
          start,
          end: `${addDays(today, 1)}T15:25:00.000Z`,
          provider: "google",
          calendarId: "casey@example.com",
          conflictIds: ["casey@example.com"],
          checkIn: true,
        },
        "block-1",
        "essays",
      ),
    ],
    "Book Tuesday’s drafting session and move the milestone target.",
    "web",
    "essays",
    undefined,
    true,
  );
  assert.equal(proposal.status, "pending");
  assert.equal(created.status, 200, JSON.stringify(created.body));
  const coach = await call("/api/app/coach");
  const view = coach.body.proposals[0];
  assert.equal(view.id, proposal.id);
  assert.deepEqual(view.affected, { actions: 1, milestones: 1, planVersions: 0 });
  assert.deepEqual(view.booking, {
    provider: "google",
    calendarName: "casey@example.com",
    start,
    end: `${addDays(today, 1)}T15:25:00.000Z`,
    includesCheckIn: true,
  });
  assert.deepEqual(view.consequences, [
    "Accepting creates this event in your connected google calendar, with a separate check-in event.",
  ]);
  assert.equal(view.expired, false);
});

test("a development server accepts a private LAN host but still refuses a public one", async (t) => {
  const { withHost } = await fixture(t);
  assert.equal(process.env.PUBLIC_URL, undefined, "This rule only applies without PUBLIC_URL");
  assert.equal(await withHost("/api/health", "192.168.1.24:8080"), 200);
  assert.equal(await withHost("/api/health", "10.0.0.24:8080"), 200);
  assert.equal(await withHost("/api/health", "172.16.4.9:8080"), 200);
  assert.equal(await withHost("/api/app/session", "192.168.1.24:8080"), 401);
  assert.equal(await withHost("/api/health", "172.32.0.1:8080"), 403);
  assert.equal(await withHost("/api/health", "8.8.8.8:8080"), 403);
  assert.equal(await withHost("/api/health", "adler.example.com"), 403);
});

test("views stay readable for empty, draft, manual, remeasured and closed records", () => {
  const revision = 7;
  const options = { revision };
  const empty = initialData();
  assert.equal(todayView(empty, options).quietDay, true);
  assert.equal(todayView(empty, options).next, null);
  assert.equal(goalsView(empty, options).rows.length, 0);
  assert.equal(coachView(empty, options).conversations.length, 0);
  assert.equal(insightsView(empty, options).memories.length, 0);
  assert.equal(calendarView(empty, { revision, start: "" }).days.length, 7);
  assert.equal(
    sessionView(empty, {
      revision,
      user: { id: "u", username: "example" },
      coach: { configured: false, provider: "", model: "" },
      calendars: { google: { configured: false, connected: false }, apple: { connected: false } },
      serverKeysAllowed: false,
    }).hasGoals,
    false,
  );
  assert.equal(
    settingsView(empty, {
      revision,
      user: { id: "u", username: "example" },
      coach: { configured: false, provider: "", model: "" },
      calendars: { google: { configured: false, connected: false }, apple: { connected: false } },
      serverKeysAllowed: false,
      provider: { selected: { provider: "gemini", model: "", useServer: true }, providers: [] },
      connections: {
        configured: false,
        provider: "twilio",
        number: null,
        publicUrl: null,
        link: null,
        jobs: [],
        deliveries: [],
      },
      tokens: [],
      publicUrl: null,
    }).methods.length,
    7,
  );

  const today = dateInZone("UTC");
  const data: Data = initialData();
  data.timeZone = "UTC";
  createGoal(
    data,
    {
      title: "Decide what to work on",
      kind: "practical",
      why: "I am not sure yet",
      success: "A goal I can act on",
      area: "Personal",
      tags: [],
      targetDate: "",
      deadline: "none",
      status: "Draft",
      milestones: [],
      assessmentTarget: 8,
      baseline: null,
      action: "",
      criterion: "",
      timing: "",
    },
    today,
    "draft-only",
  );
  createGoal(data, { ...essayGoal(today), status: undefined }, today, "manual");
  const remeasured = applyChanges(
    data,
    [
      change(
        "goal",
        "update",
        {
          measure: {
            label: "Words written",
            unit: "words",
            target: 5000,
            baseline: 400,
            aggregation: "cumulative",
          },
        },
        "manual",
      ),
    ],
    today,
  );
  remeasured.learning = [
    {
      id: "learning-finished",
      goalIds: ["manual"],
      activeVersion: 1,
      state: "closed",
      standing: "insufficient",
      versions: [
        {
          version: 1,
          decisionId: "decision-closed",
          at: new Date().toISOString(),
          observation: "You reported that afternoons were interrupted.",
          hypothesis: "A morning slot may be easier to protect.",
          reasoning: {
            principleIds: ["P2"],
            goalRoute: "session",
            ruleExceptions: [],
            barrier: {
              domain: "opportunity",
              status: "reported",
              explanation: "Afternoons were interrupted.",
              sourceIds: [],
            },
            methodId: "implementation",
            researchSourceIds: ["method:implementation"],
            mechanism: "A protected slot can remove a competing demand.",
            fit: "You described quiet mornings.",
            prediction: "More sessions start on time.",
            reviewRule: "Review after a week of reports.",
            limitation: "One week of reports cannot isolate the cause.",
          },
          sources: [],
          test: {
            change: "Write in the morning instead.",
            design: "observation",
            prediction: "More sessions start.",
            comparison: "Compared with the interrupted afternoons you described.",
            start: null,
            reviewAfter: null,
            reviewRule: "Review after a week.",
            mechanismSignal: null,
            behaviorSignal: "Whether the morning session happens.",
            outcomeSignal: null,
            alternatives: [],
          },
          transfer: null,
          proposalId: null,
        },
      ],
      reviews: [],
      events: [{ at: new Date().toISOString(), state: "closed", reason: "You finished trying this." }],
      invalidations: [],
    } satisfies LearningRecord,
  ];

  const view = todayView(remeasured, options);
  assert.equal(view.revision, revision);
  assert.equal(view.progress.length, 2);
  assert.equal(view.learning.length, 0, "A closed record without reviews stays out of Today");
  assert.equal(
    view.progress.find((row) => row.goal.id === "draft-only")!.label,
    "Draft",
  );
  assert.equal(view.progress.find((row) => row.goal.id === "manual")!.unit, "words");
  const rows = goalsView(remeasured, options).rows;
  assert.equal(rows.length, 2);
  assert.equal(rows.find((row) => row.goal.id === "draft-only")!.stepTitle, null);
  for (const goal of remeasured.goals) {
    const detail = goalDetailView(remeasured, { revision, goalId: goal.id });
    assert.equal(detail.goal.id, goal.id);
    assert.equal(detail.series.points.length, 14);
    assert.equal(typeof detail.execution.summary.planned, "number");
  }
  assert.equal(
    goalDetailView(remeasured, { revision, goalId: "manual" }).measurementHistory!.length,
    1,
  );
  const insights = insightsView(remeasured, options);
  assert.deepEqual(insights.tryingNow, []);
  assert.equal(insights.history.length, 1);
  assert.equal(insights.history[0].statusLabel, "Finished");
  assert.equal(
    learningDetailView(remeasured, { revision, recordId: "learning-finished" }).row.controls.close,
    false,
  );
  assert.equal(calendarView(remeasured, options).unplaced.length >= 0, true);
  assert.equal(coachView(remeasured, options).quickPrompts.length > 0, true);
});

test("insights keep reported observations beside, not inside, the learning records", async (t) => {
  const { call, register, runtime } = await fixture(t);
  const account = await register("app-observations");
  const today = dateInZone("UTC");
  const data = adaptiveWorkspace(adaptiveFixture(today, today));
  data.memories.push({
    id: "editor-friday",
    date: today,
    text: "My editor reviews drafts on Fridays.",
  });
  data.decisions.push({
    id: "decision-observed",
    date: today,
    goalId: "essay",
    programVersion: 1,
    planVersion: 1,
    mode: "live",
    status: "Reviewed",
    summary: "Kept your editor’s Friday review as context.",
    methods: [],
    checks: [],
    insights: [
      {
        finding: "You reported that your editor reviews drafts on Fridays.",
        status: "Reported",
        sourceIds: ["editor-friday"],
        changeIndexes: [],
      },
      {
        finding: "A Thursday buffer may be what protects the Friday review.",
        status: "To test",
        sourceIds: ["editor-friday", "missing-record"],
        changeIndexes: [0],
      },
    ],
  });
  runtime.db.save(account.user.id, data, account.revision, "web", "Fictional coaching fixture");
  const proposal = runtime.service.propose(
    account.user.id,
    [change("memory", "create", { text: "Keep Thursday evening free." }, "memory-thursday")],
    "Save the Thursday hand-off as context.",
    "web",
    "essay",
    undefined,
    true,
  );
  proposal.decisionId = "decision-observed";
  runtime.db.sql
    .prepare("UPDATE proposals SET json=? WHERE id=?")
    .run(JSON.stringify(proposal), proposal.id);

  const insights = await call("/api/app/insights");
  assert.equal(insights.body.observations.length, 2);
  assert.deepEqual(insights.body.tryingNow, [], "Observations never become learning records");
  const [reported, hypothesis] = insights.body.observations;
  assert.equal(reported.id, "decision-observed-0");
  assert.equal(reported.decisionId, "decision-observed");
  assert.equal(reported.date, today);
  assert.equal(reported.status, "Reported");
  assert.equal(reported.kindLabel, "Your observation");
  assert.equal(reported.statusLabel, "Reported by you");
  assert.equal(reported.implicationLabel, "What to explore next");
  assert.equal(
    reported.implication,
    "Keep this context in view when reviewing the next plan. No change is attached yet.",
  );
  assert.deepEqual(reported.changes, []);
  assert.equal(reported.learning, null);
  assert.equal(reported.goalTitle, "Publish an essay");
  assert.deepEqual(reported.goalIds, ["essay"]);
  assert.equal(reported.goals[0].id, "essay");
  assert.deepEqual(reported.sources, [
    {
      id: "editor-friday",
      kind: "context",
      label: `Saved context · ${new Date(`${today}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      text: "My editor reviews drafts on Fridays.",
      deepLink: "adler://insights?memory=editor-friday",
    },
  ]);

  assert.equal(hypothesis.status, "To test");
  assert.equal(hypothesis.kindLabel, "Hypothesis");
  assert.equal(hypothesis.statusLabel, "To test");
  assert.equal(hypothesis.implicationLabel, "Proposed adjustment");
  assert.equal(hypothesis.changeStatus, "Proposed");
  assert.equal(hypothesis.proposalId, proposal.id);
  assert.equal(hypothesis.changes.length, 1);
  assert.equal(hypothesis.implication, "Recorded from the app at the person’s request.");
  assert.equal(hypothesis.sources[1].label, "Source removed");
  assert.equal(hypothesis.sources[1].deepLink, null);

  assert.equal((await call("/api/app/insights?goal=essay")).body.observations.length, 2);
  assert.deepEqual((await call("/api/app/insights?goal=other")).body.observations, []);
});
