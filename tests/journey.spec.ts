import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { register, save, snapshot, synced } from "./fixtures";
import { addDays, dateInZone, reviewBlock } from "../shared/journey";
import { basis, literature } from "./planning-fixture";

test("a first goal moves from onboarding to a started plan and one scheduled action", async ({
  page,
}) => {
  await register(page);
  await page.goto("/app/today");
  await expect(
    page.getByRole("heading", {
      name: "A goal. A clear plan. Your next step.",
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Set up a goal manually" }).click();
  await page
    .getByLabel("What would you like to work toward?")
    .fill("Publish my illustration");
  await page
    .getByLabel("What would a good result look like?")
    .fill("One illustration published on my website");
  await page
    .getByLabel("Your next milestone")
    .fill("First illustration published");
  await page
    .getByLabel("One useful next action")
    .fill("Sketch three thumbnails");
  await page
    .getByLabel("This action is finished when")
    .fill("Three thumbnails are on paper");
  await page.getByRole("button", { name: "Review my plan" }).click();
  await page.getByRole("button", { name: "Save plan", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Start plan", exact: true }),
  ).toBeVisible();
  await synced(page);
  expect((await snapshot(page)).data.goals[0].status).toBe("Draft");
  await page.getByRole("button", { name: "Start plan", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Do now", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Do now", exact: true }).click();
  await page.getByRole("link", { name: "Choose a time", exact: true }).click();
  await page
    .locator(".custom-calendar-time")
    .getByLabel("Date", { exact: true })
    .fill(addDays(dateInZone("America/Toronto"), 1));
  await page.getByLabel("Start time", { exact: true }).fill("10:00");
  await page.getByRole("button", { name: "Review this time" }).click();
  await page
    .getByRole("button", { name: "Save in Adler", exact: true })
    .click();
  await synced(page);
  const { data } = await snapshot(page);
  expect(data.goals[0].status).toBe("Active");
  expect(data.actions).toHaveLength(1);
  expect(data.workBlocks).toHaveLength(1);
  expect(data.actions[0].id).toBe(data.workBlocks[0].id);
  expect(data.actions[0].criterion).toBe("Three thumbnails are on paper");
  expect(data.actions[0].outcome).toBeUndefined();
  await page.reload();
  await expect(page.getByRole("region", { name: "Your week" })).toBeVisible();
  await expect(page.locator(".work-block")).toContainText(
    "Sketch three thumbnails",
  );
});

test("the goal explains the model's choice and records its action measure separately from outcomes", async ({
  page,
}) => {
  await register(page, true);
  const state = await snapshot(page);
  const sources = (await literature(["progress monitoring"])).sources;
  state.data.goals[0].plans[0].basis = { ...basis, sources };
  state.data.goals[0].plans[0].durationMinutes = 35;
  await save(page, state.data, state.revision);
  await page.goto("/app/goals/essays");
  await expect(
    page.getByRole("heading", { name: "Why this plan?" }),
  ).toBeVisible();
  await page
    .getByText("Alternatives Adler considered", { exact: true })
    .click();
  await expect(
    page.getByText("Minutes spent writing", { exact: true }),
  ).toBeVisible();
  await page
    .getByText("Research & applicability · 1 sources", { exact: false })
    .click();
  await expect(page.locator(".research-source")).toContainText(
    "does not establish an optimal metric",
  );
  await expect(page.locator(".research-source a")).toHaveAttribute(
    "href",
    "https://europepmc.org/article/MED/26479070",
  );
  await page
    .getByRole("button", { name: "Record what happened", exact: true })
    .click();
  await page.getByLabel("Outline points drafted (points) · optional").fill("4");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await synced(page);
  const { data } = await snapshot(page);
  expect(data.actions[0].amount).toBe(4);
  expect(data.goals[0].results.at(-1)!.value).toBe(0);
  await expect(page.locator(".action-observations")).toContainText(
    "4 points recorded",
  );
});

test("new chats inherit the current goal and can be moved to General", async ({
  page,
}) => {
  await register(page, true);
  await page.goto("/app/goals/essays");
  await page
    .getByRole("link", { name: "Open goal chats", exact: true })
    .click();
  await page.getByRole("button", { name: "New chat", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Edit chat: New conversation" }),
  ).toBeVisible();
  expect((await snapshot(page)).data.conversations[0].goalId).toBe("essays");
  await page
    .getByRole("button", { name: "Edit chat: New conversation" })
    .click();
  await page
    .getByRole("combobox", { name: "Goal folder", exact: true })
    .selectOption("general");
  await page.getByRole("button", { name: "Save chat", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await snapshot(page)).data.conversations[0].goalId).toBe("general");
});

test("reviews resume for a new period and retain the context when opening Adler", async ({
  page,
}) => {
  await register(page, true);
  const state = await snapshot(page);
  state.data.review = {
    step: 3,
    note: "Old note",
    decision: "Keep",
    completedAt: "2026-01-04T20:00:00Z",
    periodStart: "2025-12-29",
    periodEnd: "2026-01-04",
  };
  state.data.reviews.push(state.data.review);
  await save(page, state.data, state.revision);
  await page.goto("/app/reviews/current");
  await expect(
    page.getByRole("heading", { name: "Review & plan your week" }),
  ).toBeVisible();
  await page
    .getByLabel("What helped or got in the way?")
    .fill("My drafting time was interrupted.");
  await synced(page);
  await page.getByRole("link", { name: "Review changes with Adler" }).click();
  await expect(page.getByLabel("Message Adler")).toContainText(
    "Guide my weekly review",
  );
  expect((await snapshot(page)).data.review.note).toBe(
    "My drafting time was interrupted.",
  );
  expect((await snapshot(page)).data.reviews[0].note).toBe("Old note");
});

test("goal guidance and the week agenda work at phone width and pass accessibility checks", async ({
  page,
}) => {
  await register(page, true);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "/app/goals/essays",
    "/app/calendar",
    "/app/onboarding",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBeTruthy();
    const report = await new AxeBuilder({ page }).analyze();
    expect(report.violations).toEqual([]);
  }
  await page.screenshot({
    path: ".context/onboarding-mobile.png",
    fullPage: true,
  });
});

test("Do now uses the account day even when the browser is on a different date", async ({
  page,
}) => {
  await register(page, true);
  await page.clock.setFixedTime(new Date("2026-09-06T23:00:00Z"));
  const state = await snapshot(page);
  state.data.timeZone = "Asia/Tokyo";
  state.data.actions[0].date = "";
  await save(page, state.data, state.revision);
  await page.goto("/app/goals/essays");
  await page.getByRole("button", { name: "Do now", exact: true }).click();
  await synced(page);
  await page.goto("/app/today");
  await expect(page.locator(".action-card")).toContainText(
    "Draft five main points",
  );
  await expect(
    page.getByRole("heading", { name: "Your next steps 1" }),
  ).toBeVisible();
  expect((await snapshot(page)).data.actions[0].date).toBe("2026-09-07");
});

test("latest action amounts survive week boundaries and follow action dates", async ({
  page,
}) => {
  await register(page, true);
  const state = await snapshot(page);
  state.data.goals[0].plans[0].basis = basis;
  state.data.actions[0] = {
    ...state.data.actions[0],
    date: "2026-01-05",
    outcome: "Done",
    amount: 7,
  };
  state.data.actions.push({
    ...state.data.actions[0],
    id: "older-action",
    date: "2026-01-01",
    amount: 2,
  });
  await save(page, state.data, state.revision);
  await page.goto("/app/goals/essays");
  await expect(page.locator(".action-observations")).toContainText(
    "7 points recorded",
  );
});

test("the calendar preserves review time and cannot switch weeks during an availability check", async ({
  page,
}) => {
  await register(page, true);
  const state = await snapshot(page);
  state.data.goals[0].startDate = "2026-01-01";
  await save(page, state.data, state.revision);
  await page.route("**/api/status", async (route) => {
    const response = await route.fetch();
    const status = await response.json();
    await route.fulfill({
      json: { ...status, google: { ...status.google, connected: true } },
    });
  });
  await page.route("**/api/calendars", (route) =>
    route.fulfill({
      json: {
        google: [{ id: "primary", name: "Test calendar", writable: true }],
        apple: [],
      },
    }),
  );
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/availability", async (route) => {
    await pending;
    await route.fulfill({
      json: { busy: [], checkedAt: new Date().toISOString() },
    });
  });
  await page.goto("/app/calendar");
  await page.getByRole("button", { name: "Next week", exact: true }).click();
  await expect(page.locator(".calendar-entry.entry-review")).toHaveCount(1);
  const review = reviewBlock(
    state.data,
    addDays(dateInZone(state.data.timeZone), 1),
  )!;
  await page
    .locator(".custom-calendar-time")
    .getByLabel("Date", { exact: true })
    .fill(dateInZone(state.data.timeZone, new Date(review.start)));
  await page
    .getByLabel("Start time", { exact: true })
    .fill(state.data.automation.reviewTime);
  await page.getByRole("button", { name: "Review this time" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "conflicts with a commitment",
  );
  await page
    .getByRole("combobox", { name: "Book in", exact: true })
    .selectOption("google");
  await page
    .getByRole("button", { name: "Check availability", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Next week", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("combobox", { name: "Book in", exact: true }),
  ).toBeDisabled();
  release();
  await expect(
    page.getByRole("button", { name: "Refresh", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Next week", exact: true }),
  ).toBeEnabled();
});
