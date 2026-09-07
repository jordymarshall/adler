import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { register, save, snapshot } from "./fixtures";
import { adaptiveFixture, adaptiveWorkspace } from "./adaptive-fixture";
import { addDays, dateInZone } from "../shared/journey";

test("goals use full-width chart rows and show reporting coverage without invented completion", async ({
  page,
}) => {
  await register(page);
  const state = await snapshot(page);
  const today = dateInZone("UTC");
  const data = adaptiveWorkspace(adaptiveFixture(today, addDays(today, 4)));
  data.goals[0].measure = {
    label: "Published essays",
    unit: "essays",
    target: 3,
    baseline: 0,
    aggregation: "cumulative",
  };
  data.goals[0].target = 3;
  data.goals[0].targetDate = addDays(today, 40);
  data.goals[0].checkpoints = [
    {
      id: "finish",
      date: addDays(today, 40),
      value: 3,
      label: "Three published",
    },
  ];
  await save(page, data, state.revision);
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/app/goals");
  await expect(page.locator(".goal-chart-row")).toHaveCount(1);
  await expect(page.locator(".behavior-overview")).toContainText("0 reported");
  await expect(page.locator(".behavior-overview h2")).toContainText("—");
  await expect(page.getByTestId("required-pace-line")).toBeVisible();
  const width = await page
    .locator(".organized-goals")
    .evaluate((el) => el.getBoundingClientRect().width);
  expect(width).toBeGreaterThan(1200);
  expect(
    (await page.locator(".goal-chart-row").boundingBox())!.width,
  ).toBeGreaterThan(1200);
  expect(
    (await page.locator(".goal-chart-row .progress-viz").boundingBox())!.width,
  ).toBeGreaterThan(650);
  await expect(page.locator(".app-topbar .ask-adler-link")).toHaveCount(0);
  await page.screenshot({
    path: ".context/redesign-goals-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBeTruthy();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("a focused check-in keeps shared history and links directly to confirmed memory and source actions", async ({
  page,
}) => {
  await register(page, true);
  const state = await snapshot(page);
  const action = state.data.actions[0];
  state.data.memories.push({
    id: "breakfast",
    date: dateInZone(state.data.timeZone),
    text: "I prefer to draft after breakfast.",
  });
  state.data.conversations = [
    {
      id: "shared",
      title: "Shared coaching",
      goalId: "general",
      createdAt: new Date().toISOString(),
    },
  ];
  state.data.messages = [
    {
      id: "reply",
      role: "coach",
      conversationId: "shared",
      goalId: "general",
      text: "For Publish two essays, try after breakfast and revisit your last action.",
      references: [
        { text: "after breakfast", recordId: "breakfast" },
        { text: "your last action", recordId: action.id },
      ],
    },
  ];
  await save(page, state.data, state.revision);
  await page.goto("/app/coach?goal=essays&intent=checkin");
  await expect(page.locator(".coach-thread")).toContainText(
    "try after breakfast",
  );
  await expect(page.locator(".coach-context-strip")).not.toContainText(
    "Across goals",
  );
  await page
    .locator(".message-content p")
    .getByRole("link", { name: "after breakfast", exact: true })
    .click();
  await expect(page.locator("#record-breakfast")).toBeInViewport();
  await expect(
    page.getByRole("heading", { name: "What this means for your plan" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Coaching navigation" })
      .getByRole("link"),
  ).toHaveCount(2);
  await page.goBack();
  await page
    .getByRole("link", { name: "your last action", exact: true })
    .click();
  await expect(page.locator(`[id="record-${action.id}"]`)).toBeInViewport();
  await page.goto("/app/settings");
  await page.getByRole("link", { name: "Manage →", exact: true }).click();
  await expect(page).toHaveURL(/\/app\/settings\/coaching$/);
  await expect(
    page.getByRole("heading", { name: "Time & coaching", exact: true }),
  ).toBeVisible();
});
