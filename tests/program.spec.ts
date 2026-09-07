import { expect, test } from "@playwright/test";
import { register, snapshot, save, synced } from "./fixtures";

test("coach has only small message avatars and shows cross-channel proposals for approval", async ({
  page,
}) => {
  await register(page, true);
  const current = await snapshot(page);
  current.data.messages.push({
    id: "sms-message",
    goalId: "general",
    role: "coach",
    text: "Would you like to move your drafting session to mornings?",
    channel: "sms",
    at: new Date().toISOString(),
  });
  await save(page, current.data, current.revision);
  await page.request.post("/api/proposals", {
    data: {
      summary: "Keep mornings for drafting",
      changes: [
        {
          entity: "memory",
          operation: "create",
          id: null,
          parentId: null,
          values: JSON.stringify({ text: "I prefer mornings for drafting." }),
        },
      ],
    },
  });
  await page.goto("/app/coach");
  await expect(page.locator(".coach-topline .adler-avatar")).toHaveCount(0);
  await expect(page.locator(".live-message .adler-avatar")).toHaveCount(1);
  await expect(page.locator(".message-author")).toContainText("SMS");
  await expect(page.locator(".shared-proposal")).toContainText(
    "Keep mornings for drafting",
  );
  expect((await snapshot(page)).data.memories).toHaveLength(0);
  await page.getByText("React", { exact: true }).click();
  await page.getByRole("button", { name: "React like", exact: true }).click();
  await expect(
    page.getByLabel("You reacted like", { exact: true }),
  ).toBeVisible();
  expect((await snapshot(page)).data.messages[0].reactions?.user?.type).toBe(
    "like",
  );
  expect((await snapshot(page)).data.memories).toHaveLength(0);
  await page.getByRole("button", { name: "Confirm changes" }).click();
  await expect(page.locator(".shared-proposal")).toHaveCount(0);
  expect((await snapshot(page)).data.memories[0].text).toBe(
    "I prefer mornings for drafting.",
  );
});

test("failed coaching preserves the draft without manufacturing a reply", async ({
  page,
}) => {
  await register(page, true);
  await page.route("**/api/status", (route) =>
    route.fulfill({
      json: {
        coach: { configured: true, model: "fixture" },
        google: { configured: false, connected: false },
        apple: { connected: false },
      },
    }),
  );
  await page.route("**/api/coach", (route) =>
    route.fulfill({
      status: 400,
      json: { error: "The account needs API credits." },
    }),
  );
  await page.goto("/app/coach");
  await page.getByLabel("Message Adler").fill("Review my progress");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("alert")).toContainText("API credits");
  await expect(page.getByLabel("Message Adler")).toHaveValue(
    "Review my progress",
  );
  await expect(page.locator(".live-message")).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel("Message Adler")).toHaveValue(
    "Review my progress",
  );
});

test("provider choices save without returning the key and phone setup reports missing configuration", async ({
  page,
}) => {
  await register(page);
  await page.goto("/app/settings/provider");
  await page.getByLabel("Provider", { exact: true }).selectOption("openai");
  await page
    .getByLabel("API key", { exact: true })
    .fill("fictional-api-key-for-test");
  await page
    .getByRole("button", { name: "Save provider", exact: true })
    .click();
  await expect(page.locator(".form-notice")).toContainText(
    "Provider settings saved",
  );
  await expect(page.getByLabel("API key", { exact: true })).toHaveValue("");
  const status = await (await page.request.get("/api/provider")).json();
  expect(status.selected.provider).toBe("openai");
  expect(JSON.stringify(status)).not.toContain("fictional-api-key-for-test");
  await page.goto("/app/connections");
  await expect(
    page.getByRole("button", { name: "Get pairing code" }),
  ).toBeDisabled();
  await expect(
    page.getByText("Phone messaging has not been connected", { exact: false }),
  ).toBeVisible();
});

test("local scheduling creates a synced work block without an external booking claim", async ({
  page,
}) => {
  await register(page, true);
  await page.goto("/app/calendar");
  await page.getByRole("button", { name: "Add time", exact: true }).click();
  await expect(page.locator(".scheduler-form")).toContainText(
    "External calendars haven’t been checked",
  );
  await page.getByRole("button", { name: "Next week", exact: true }).click();
  await page.getByRole("button", { name: "Save time", exact: true }).click();
  await synced(page);
  await page.reload();
  await page.getByRole("button", { name: "Next week", exact: true }).click();
  await expect(page.locator(".calendar-entry.entry-work")).toHaveCount(1);
  await expect(page.locator(".calendar-entry.entry-work")).toContainText(
    "Adler only",
  );
  const { data } = await snapshot(page);
  expect(data.actions.some((a) => a.id === data.workBlocks[0].id)).toBeTruthy();
  expect(data.workBlocks[0].eventId).toBeUndefined();
  await page.goto("/app/coach/program");
  const marker = page
    .locator(".plan-timeline")
    .getByRole("button", { name: new RegExp(data.workBlocks[0].action) });
  await marker.click();
  await expect(page.locator(".timeline-detail")).toContainText(
    data.workBlocks[0].action,
  );
  await expect(page.locator(".timeline-detail")).toContainText("Scheduled");
  await expect(page.locator(".timeline-detail")).toContainText(
    "America/Toronto",
  );
});

test("program views preserve edits and show the context and settings behind each revision", async ({
  page,
}) => {
  await register(page, true);
  await page.goto("/app/coach/program");
  await expect(page.locator(".program-roadmap")).toContainText(
    "Publish two essays",
  );
  await page.getByRole("button", { name: "Edit program", exact: true }).click();
  await page.getByLabel("Minutes per week", { exact: true }).fill("180");
  await page
    .getByLabel("Reason for this revision", { exact: true })
    .fill("Reserve more time for the essay draft");
  await page.getByRole("button", { name: /Save program v/ }).click();
  await synced(page);
  await expect(page.locator(".program-budget h2")).toContainText("180");
  await page
    .getByRole("button", { name: "Context & checks", exact: true })
    .click();
  await expect(page.locator(".program-check-detail")).toContainText(
    "Two published essays with a clear problem and result",
  );
  await page.getByRole("button", { name: /Schedule & capacity/ }).click();
  await expect(page.locator(".context-finding")).toContainText(
    "180 minutes budgeted per week",
  );
  await page.getByRole("button", { name: "Versions", exact: true }).click();
  await expect(page.locator(".program-version-entry").first()).toContainText(
    "Reserve more time for the essay draft",
  );
  await expect(page.locator(".version-changes").first()).toContainText(
    "180 minutes",
  );
  await expect(page.locator(".version-before").first()).toContainText(
    "120 minutes",
  );
  await page.getByRole("button", { name: /Decisions/ }).click();
  await expect(page.locator(".program-empty")).toContainText(
    "Your first coaching decision starts here.",
  );
  await page.reload();
  await expect(page.locator(".program-budget h2")).toContainText("180");
});

test("a coordinated adjustment saves goal, approach, timing, and memory before optional calendar booking", async ({
  page,
}) => {
  await register(page, true);
  const initial = await snapshot(page);
  initial.data.programs.at(-1)!.focusGoalId = "";
  await save(page, initial.data, initial.revision);
  const deadline = initial.data.goals[0].targetDate!;
  const proposal = await page.request.post("/api/proposals", {
    data: {
      summary: "Outline first and protect the lunch break",
      changes: [
        {
          entity: "goal",
          operation: "update",
          reason: "Allow time for feedback within the user's available hours.",
          id: "essays",
          parentId: null,
          values: JSON.stringify({ targetDate: "2027-04-30" }),
        },
        {
          entity: "plan",
          operation: "update",
          id: null,
          parentId: "essays",
          values: JSON.stringify({
            action: "Write the whole outline before editing",
            criterion: "Five main points on the page",
            timing: "Tuesday after lunch · 25 min",
          }),
        },
        {
          entity: "program",
          operation: "update",
          id: null,
          parentId: null,
          values: JSON.stringify({
            approach:
              "Try outlining before sentence edits; review the next draft on Friday.",
            workStart: "12:00",
            workEnd: "15:00",
            reviewDay: "Friday",
            reason: "The user has confirmed that evenings are reserved.",
          }),
        },
        {
          entity: "memory",
          operation: "create",
          id: null,
          parentId: null,
          values: JSON.stringify({
            text: "Evenings are reserved. Lunch breaks are available for writing.",
          }),
        },
        {
          entity: "action",
          operation: "update",
          id: initial.data.actions[0].id,
          parentId: null,
          values: JSON.stringify({
            title: "Write the whole outline before editing",
            timing: "Tuesday after lunch · 25 min",
          }),
        },
      ],
    },
  });
  expect(await proposal.text()).not.toContain('"error"');
  await page.goto("/app/coach");
  const adjustment = page.locator(".shared-proposal");
  await adjustment.getByText("What changes & why", { exact: true }).click();
  await expect(
    adjustment
      .getByRole("list", { name: "Proposed changes" })
      .locator(":scope > li"),
  ).toHaveCount(5);
  await expect(adjustment.locator(".adjustment-dimension")).toHaveCount(0);
  await expect(adjustment.locator(".adjustment-context-note")).toContainText(
    "information Adler uses",
  );
  await expect(adjustment.locator(".change-before").first()).toContainText(
    new Date(`${deadline}T12:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  );
  await expect(adjustment.locator(".change-after").first()).toContainText(
    "Apr 30, 2027",
  );
  await expect(adjustment.locator(".change-reason").first()).toContainText(
    "Allow time for feedback within the user's available hours.",
  );
  expect((await snapshot(page)).data.memories).toHaveLength(0);
  await expect(page.locator(".coach-calendar-next")).toHaveCount(0);
  await page.getByRole("button", { name: "Confirm changes" }).click();
  await expect(adjustment).toHaveCount(0);
  const approved = (await snapshot(page)).data;
  expect(approved.goals[0].targetDate).toBe("2027-04-30");
  expect(approved.goals[0].plans.at(-1)!.action).toBe(
    "Write the whole outline before editing",
  );
  expect(approved.programs.at(-1)!.workStart).toBe("12:00");
  expect(approved.programs.at(-1)!.reviewDay).toBe("Friday");
  expect(approved.memories[0].text).toContain("Evenings are reserved");
  expect(approved.goals[0].results).toEqual(initial.data.goals[0].results);
  expect(approved.workBlocks).toHaveLength(0);
  await page.reload();
  await page.getByRole("link", { name: "Continue", exact: false }).click();
  await expect(page.locator(".next-step-card")).toContainText(
    "Write the whole outline before editing",
  );
  await page.getByText("Something doesn’t fit?", { exact: true }).click();
  await page
    .getByRole("button", { name: "Choose a time", exact: true })
    .click();
  await expect(page.locator(".inline-scheduler")).toBeVisible();
  expect((await snapshot(page)).data.workBlocks).toHaveLength(0);
});

test("chats can be renamed, filed under a goal, and deleted without removing the goal", async ({
  page,
}) => {
  await register(page, true);
  await page.goto("/app/coach");
  await page.getByText("Conversations", { exact: true }).click();
  await page.getByRole("button", { name: "New chat", exact: true }).click();
  await expect(page.locator(".conversation-item.selected")).toContainText(
    "New conversation",
  );
  await page
    .getByRole("button", { name: "Edit chat: New conversation", exact: true })
    .click();
  await page.getByLabel("Chat name").fill("A plan for my essays");
  await page.getByLabel("Goal folder").selectOption("essays");
  await page.getByRole("button", { name: "Save chat", exact: true }).click();
  await expect(page.locator(".coach-context-strip")).not.toContainText("Across goals");
  await expect(page.locator(".conversation-item.selected")).toContainText(
    "A plan for my essays",
  );
  await page.reload();
  await page.getByText("Conversations", { exact: true }).click();
  await expect(page.locator(".conversation-item.selected")).toContainText(
    "A plan for my essays",
  );
  await page.getByRole("button", { name: "New chat", exact: true }).click();
  await expect(page.locator(".coach-context-strip")).not.toContainText("Across goals");
  await page
    .getByRole("button", {
      name: "Delete chat: A plan for my essays",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Delete conversation", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Delete chat: A plan for my essays",
      exact: true,
    }),
  ).toHaveCount(0);
  expect((await snapshot(page)).data.goals[0].id).toBe("essays");
  expect((await snapshot(page)).data.conversations).toHaveLength(1);
});

test("a sourced insight opens its original chat and a reply links to the actual plan", async ({
  page,
}) => {
  await register(page, true);
  const state = await snapshot(page);
  const now = new Date().toISOString();
  state.data.conversations = [
    {
      id: "conversation-source",
      title: "Evening check-in",
      goalId: "essays",
      createdAt: now,
    },
  ];
  state.data.messages = [
    {
      id: "message-source",
      conversationId: "conversation-source",
      goalId: "essays",
      role: "user",
      text: "My meeting ran late. I missed the session.",
      at: now,
    },
    {
      id: "message-reply",
      conversationId: "conversation-source",
      goalId: "essays",
      role: "coach",
      text: "Let’s review the timing in your plan.",
      at: now,
      decisionId: "decision-source",
      links: [{ goalId: "essays", tab: "plan" }],
    },
  ];
  state.data.decisions = [
    {
      id: "decision-source",
      date: now,
      goalId: "essays",
      programVersion: state.data.programs.at(-1)!.version,
      planVersion: 1,
      mode: "live",
      checks: [],
      methods: [],
      summary: "Review the timing.",
      status: "No change",
      insights: [
        {
          finding: "A late meeting interrupted the session.",
          status: "Reported",
          sourceIds: ["message-source"],
          changeIndexes: [],
        },
      ],
    },
  ];
  state.data.memories.push({
    id: "shared-context",
    text: "I prefer short sessions.",
    date: now.slice(0, 10),
  });
  await save(page, state.data, state.revision);
  await page.goto("/app/goals/essays/progress");
  await page.getByText("What Adler has noticed", { exact: true }).click();
  await page
    .getByRole("link", { name: "See observations & sources", exact: false })
    .click();
  await expect(page).toHaveURL(/\/app\/coach\/about-you\?goal=essays$/);
  await expect(page.getByRole("combobox")).toHaveValue("essays");
  await expect(page.locator(".insight-row")).toHaveCount(1);
  await expect(page.locator(".insight-row")).toContainText(
    "A late meeting interrupted the session.",
  );
  await page.locator(".insight-sources summary").click();
  await expect(page.locator(".insight-sources")).toContainText(
    "My meeting ran late. I missed the session.",
  );
  await page.getByRole("link", { name: "Open source" }).click();
  await expect(page.locator(".coach-thread")).toContainText(
    "My meeting ran late.",
  );
  await page.locator(".message-record-links a").click();
  await expect(page).toHaveURL(/\/app\/goals\/essays$/);
  await page.goto("/app/goals/essays/learning");
  await expect(page).toHaveURL(/\/app\/coach\/about-you\?goal=essays$/);
  await page.getByRole("combobox").selectOption("all");
  await expect(page.locator(".insight-row")).toHaveCount(1);
  await expect(page.locator(".memory-card")).toContainText("I prefer short sessions.");
  await page.reload();
  await expect(page.getByRole("combobox")).toHaveValue("all");
});
