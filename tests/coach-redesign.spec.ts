import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { register, save, seedCoaching, snapshot } from "./fixtures";
import { adaptiveFixture, adaptiveWorkspace } from "./adaptive-fixture";
import { addDays, dateInZone } from "../shared/journey";
import { type Outcome } from "../shared/workspace";

test("input lines distinguish zero from unknown and keep reports selectable", async ({ page }) => {
  await register(page);
  const today = dateInZone("UTC");
  const data = adaptiveWorkspace(adaptiveFixture(today, addDays(today, 4)));
  const records: { offset: number; outcome?: Outcome; amount?: number }[] = [
    { offset: -6, outcome: "Done", amount: 5 }, { offset: -4 },
    { offset: -2, outcome: "Didn’t happen" }, { offset: 0, outcome: "Done", amount: 5 }, { offset: 2 },
  ];
  data.actions = records.map((record, index) => ({ id: `report-${index}`, goalId: "essay", stepId: "outline", title: "Draft five outline points", criterion: "Five points are written", timing: "After breakfast", date: addDays(today, record.offset), occurrence: `outline:${addDays(today, record.offset)}`, planVersion: 1, outcome: record.outcome, amount: record.amount, history: [] }));
  await seedCoaching(page, data);
  await page.goto("/app/goals/essay");
  const chart = page.locator(".goal-action-canvas .goal-input-chart");
  await expect(chart.getByRole("img")).toHaveAccessibleName(/Outline points over time/);
  await expect(chart.locator("circle:not(.input-planned-point) title")).toHaveText([
    /5 points reported/, /0 points reported/, /5 points reported/,
  ]);
  await expect(chart.locator(".input-unknown")).not.toHaveCount(0);
  const missed = page.getByRole("group", { name: "Dated action reports" }).getByRole("button", { name: /Didn’t happen/ });
  await missed.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("region", { name: "Selected action" })).toContainText("Didn’t happen · 0 points");
  await expect(page.getByRole("button", { name: "Edit report", exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("goals use a full-width categorized table and show reporting coverage without invented completion", async ({
  page,
}) => {
  await register(page);
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
  await seedCoaching(page, data);
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/app/goals");
  await expect(page.locator(".goal-table-row")).toHaveCount(1);
  await expect(page.getByRole("region", { name: "Weekly time budget" })).toBeVisible();
  await expect(page.locator(".goal-activity")).toContainText("0 reported");
  await expect(page.locator(".goal-activity")).toContainText("No check-ins yet");
  await expect(page.locator(".goal-table-row .activity-cells")).toBeVisible();
  await expect(page.locator(".activity-day")).toHaveCount(84);
  const width = await page
    .locator(".organized-goals")
    .evaluate((el) => el.getBoundingClientRect().width);
  expect(width).toBeGreaterThan(1200);
  expect(
    (await page.locator(".goal-table-row").boundingBox())!.width,
  ).toBeGreaterThan(1200);
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
  await page.goto("/app/check-in?goal=essays&intent=checkin");
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
    page.getByRole("heading", { name: "Insights", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: "App navigation" }).getByRole("link", { name: "Check-in", exact: true })).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Saved context" })).toBeVisible();
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

test("legacy Coach and context links preserve their focus and source anchor", async ({ page }) => {
  await register(page, true);
  const state = await snapshot(page);
  state.data.memories.push({ id: "remember", text: "I prefer quiet mornings.", date: dateInZone(state.data.timeZone) });
  await save(page, state.data, state.revision);
  await page.goto("/app/coach?goal=essays&intent=checkin");
  await expect(page).toHaveURL(/\/app\/check-in\?goal=essays&intent=checkin/);
  await expect(page.getByRole("heading", { name: "Check-in", exact: true })).toBeVisible();
  await page.goto("/app/coach/about-you?goal=essays#record-remember");
  await expect(page).toHaveURL(/\/app\/insights\?goal=essays#record-remember/);
  await expect(page.locator("#record-remember")).toBeInViewport();
});

test("the landing keeps one coherent goal and connected coaching on desktop and mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText("Reach your goals with a system that understands you.");
  await expect(page.locator(".hero-intro-v2 > p").first()).toContainText("behavioural science and your check-ins");
  await expect(page.locator(".journey-step")).toHaveCount(5);
  await expect(page.locator(".hero-objects, .first-coaching-loop, .focus-chapter")).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Three views of the Adler app" }).locator(".hero-mobile-phone")).toHaveCount(3);
  await page.locator("summary").filter({ hasText: "See the check-in become a calendar booking" }).click();
  const connections = page.locator(".connections-showcase");
  await expect(connections.locator(".connection-phone")).toHaveCount(3);
  const phone = await connections.locator(".adler-phone").boundingBox();
  expect(phone!.height / phone!.width).toBeLessThan(2);
  await connections.getByRole("button", { name: "Try the example text check-in" }).click();
  await expect(connections.locator(".phone-messages")).toContainText("review whether the window helped");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".connection-orbits ellipse").first()).toHaveCSS("animation-name", "none");
  await page.getByRole("region", { name: "Example calendar schedule" }).focus();
  await page.keyboard.press("End");
  await expect.poll(() => page.locator(".phone-calendar-day").evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
