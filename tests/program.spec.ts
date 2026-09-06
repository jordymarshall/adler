import { expect, test } from "@playwright/test";
const key = "adler-preview-v1";
const status = {
  coach: { configured: true, model: "fixture" },
  google: { configured: false, connected: false },
  apple: { connected: false },
};
const reply = {
  reply:
    "Your last note says editing the opening displaced the draft. Try five rough bullets before editing.",
  summary:
    "The published result is behind the dated checkpoint, and the recorded blocker is editing while drafting.",
  methods: ["barriers", "monitoring"],
  proposal: {
    title: "Draft before editing",
    action: "Write five rough bullets for the problem statement",
    criterion: "Five bullets describe the problem and my contribution.",
    timing: "Unscheduled",
    reason:
      "The saved action note describes editing the opening instead of drafting.",
    reviewAfter:
      "Two sessions: check whether a complete draft is ready for feedback.",
  },
};

test("goal filters and checkpoint edits persist with the previous schedule", async ({
  page,
}) => {
  await page.goto("/app/goals");
  await expect(page.locator(".organized-card")).toHaveCount(3);
  await page.getByLabel("Filter by tag").selectOption("Writing");
  await expect(page.locator(".organized-card")).toHaveCount(1);
  await page.locator(".organized-card").click();
  await expect(page.locator(".progress-viz .pace-badge")).toHaveText(
    "Behind plan",
  );
  await page
    .getByRole("button", { name: "Organize & edit checkpoints" })
    .click();
  await page.getByLabel("Checkpoint 2 value").fill("1");
  await page
    .getByLabel("Tags, separated by commas")
    .fill("Portfolio, Applications");
  await page
    .getByLabel("Reason for a schedule change")
    .fill("Feedback needs an extra week.");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.locator(".progress-viz .pace-badge")).toHaveText("On plan");
  await page.reload();
  await page
    .getByText("Previous checkpoint schedules", { exact: true })
    .click();
  await expect(page.locator(".chart-data").last()).toContainText(
    "Feedback needs an extra week.",
  );
  const saved = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!),
    key,
  );
  expect(saved.goals[0].checkpointHistory[0].checkpoints[1].value).toBe(2);
});

test("program revisions preserve history and stale forms cannot overwrite changes", async ({
  page,
  context,
}) => {
  await page.goto("/app/coach/program");
  await page.getByRole("button", { name: "Edit program", exact: true }).click();
  await page.getByLabel("Minutes per week").fill("120");
  await page
    .getByLabel("Reason for this revision")
    .fill("Fewer hours available this week.");
  await page.getByRole("button", { name: "Save program v2" }).click();
  await page.reload();
  await expect(page.locator(".program-grid")).toContainText("120");
  await page.getByRole("button", { name: "Edit program", exact: true }).click();
  const second = await context.newPage();
  await second.goto("/app/settings");
  await second.getByLabel("Weekly review day").selectOption("Friday");
  await page.getByLabel("Minutes per week").fill("90");
  await page
    .getByLabel("Reason for this revision")
    .fill("Old form should not replace the new review day.");
  await page.getByRole("button", { name: "Save program v3" }).click();
  await expect(page.getByRole("status")).toContainText(
    "changed in another view",
  );
  const saved = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!),
    key,
  );
  expect(saved.programs).toHaveLength(3);
  expect(saved.programs.at(-1).weeklyMinutes).toBe(120);
  expect(saved.programs.at(-1).reviewDay).toBe("Friday");
});

test("coach uses saved context and requires approval before changing the program", async ({
  page,
}) => {
  let sent: Record<string, any> | undefined;
  await page.route("**/api/status", (route) => route.fulfill({ json: status }));
  await page.route("**/api/coach", (route) => {
    sent = route.request().postDataJSON();
    return route.fulfill({ json: reply });
  });
  await page.goto("/app/coach?goal=portfolio");
  await page.getByRole("button", { name: "Enable live coaching" }).click();
  await page
    .getByRole("textbox", { name: "Message Adler" })
    .fill("I feel stuck on the opening.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator(".live-proposal")).toContainText(
    "Draft before editing",
  );
  expect(sent!.context.activeGoals).toHaveLength(3);
  expect(sent!.context.confirmedContext).toHaveLength(1);
  expect(sent!.context.checks).toHaveLength(6);
  expect(
    sent!.context.recentActions.some((a: { note?: string }) =>
      a.note?.includes("editing"),
    ),
  ).toBe(true);
  let saved = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!),
    key,
  );
  expect(saved.goals[0].plans).toHaveLength(1);
  await page.getByText("Why this response", { exact: false }).click();
  await expect(page.locator(".decision-checks")).toContainText(
    "Confirmed context",
  );
  await page.getByRole("button", { name: "Use this change" }).click();
  await expect(page.locator(".live-proposal")).toContainText("Accepted");
  await page.reload();
  saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), key);
  expect(saved.goals[0].plans).toHaveLength(2);
  expect(saved.programs).toHaveLength(2);
  expect(
    saved.actions.find((a: { id: string }) => a.id === "portfolio-earlier")
      .planVersion,
  ).toBe(1);
  await page.getByLabel("Conversation goal").selectOption("statistics");
  await expect(page.locator(".live-message.user")).toHaveCount(0);
  await page.goto("/app/coach/program");
  await page.getByRole("button", { name: "Decisions & versions" }).click();
  await page.getByRole("button", { name: "Review this change" }).click();
  await page
    .getByLabel("What did you observe?")
    .fill("Both attempts produced a full draft ready for feedback.");
  await page.getByRole("button", { name: "Save review", exact: true }).click();
  await page.reload();
  saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), key);
  expect(saved.decisions[0].status).toBe("Reviewed");
  expect(saved.decisions[0].review.note).toContain("full draft");
});

test("a failed live turn preserves the draft and does not manufacture a response", async ({
  page,
}) => {
  await page.route("**/api/status", (route) => route.fulfill({ json: status }));
  await page.route("**/api/coach", (route) =>
    route.fulfill({
      status: 502,
      json: {
        error:
          "The model provider account needs API credits before live coaching can run.",
      },
    }),
  );
  await page.goto("/app/coach");
  await page.getByRole("button", { name: "Enable live coaching" }).click();
  await page.getByLabel("Message Adler").fill("Review my progress");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("alert")).toContainText("API credits");
  await expect(page.getByLabel("Message Adler")).toHaveValue(
    "Review my progress",
  );
  await expect(page.locator(".live-message.coach")).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel("Message Adler")).toHaveValue(
    "Review my progress",
  );
});

test("local scheduling creates a persistent action without claiming an external booking", async ({
  page,
}) => {
  await page.goto("/app/calendar");
  await expect(page.locator(".calendar-availability-note")).toContainText(
    "External calendar conflicts have not been checked",
  );
  await page.locator(".slot-grid button").first().click();
  await page
    .getByRole("button", { name: "Save in Adler", exact: true })
    .click();
  await page.reload();
  await expect(page.locator(".work-block")).toHaveCount(1);
  await expect(page.locator(".work-block")).toContainText("Adler only");
  const saved = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!),
    key,
  );
  expect(
    saved.actions.some((a: { id: string }) => a.id === saved.workBlocks[0].id),
  ).toBe(true);
  expect(saved.workBlocks[0].eventId).toBeUndefined();
});

test("calendar errors do not offer conflict-free slots", async ({ page }) => {
  await page.route("**/api/status", (route) =>
    route.fulfill({
      json: { ...status, google: { configured: true, connected: true } },
    }),
  );
  await page.route("**/api/calendars", (route) =>
    route.fulfill({
      json: {
        google: [{ id: "primary", name: "Personal", writable: true }],
        apple: [],
      },
    }),
  );
  await page.route("**/api/availability", (route) =>
    route.fulfill({
      status: 400,
      json: { error: "Google could not check every selected calendar." },
    }),
  );
  await page.goto("/app/calendar");
  await page.getByLabel("Book in", { exact: true }).selectOption("google");
  await page
    .getByRole("button", { name: "Check availability", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("could not check");
  await expect(page.locator(".slot-grid button")).toHaveCount(0);
});
