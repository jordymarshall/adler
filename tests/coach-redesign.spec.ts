import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { register, save, snapshot } from "./fixtures";
import { adaptiveFixture, adaptiveWorkspace } from "./adaptive-fixture";
import { addDays, dateInZone } from "../shared/journey";
import { weekStart } from "../shared/goal-execution";
import { type Outcome } from "../shared/workspace";

test("weekly completion lines distinguish zero from unknown and retain the reports behind a week", async ({ page }) => {
  await register(page);
  const state = await snapshot(page);
  const today = dateInZone("UTC");
  const data = adaptiveWorkspace(adaptiveFixture(today, addDays(today, 4)));
  const monday = weekStart(today);
  const records: { offset: number; outcome?: Outcome }[] = [
    { offset: -21, outcome: "Done" }, { offset: -21, outcome: "Didn’t happen" }, { offset: -21 },
    { offset: -14 }, { offset: -7, outcome: "Didn’t happen" }, { offset: 0, outcome: "Done" }, { offset: 7 },
  ];
  data.actions = records.map((record, index) => ({ id: `report-${index}`, goalId: "essay", stepId: "outline", title: "Draft five outline points", criterion: "Five points are written", timing: "After breakfast", date: addDays(monday, record.offset), planVersion: 1, outcome: record.outcome, history: [] }));
  await save(page, data, state.revision);
  await page.goto("/app/goals/essay");
  const chart = page.locator(".weekly-actions");
  await expect(chart.locator(".execution-metric")).toHaveText("Action completion (%)");
  await expect(chart.locator(".execution-time-label")).toHaveText("Week starting");
  await expect(chart.locator(".execution-bar")).toHaveCount(0);
  await expect(chart.locator("circle title")).toHaveText([
    /50% · 1 of 2 reported actions completed/, /0% · 0 of 1 reported actions completed/, /100% · 1 of 1 reported actions completed/,
  ]);
  expect((await chart.locator(".execution-trend-line").getAttribute("d"))!.match(/M/g)).toHaveLength(2);
  const missed = chart.getByRole("button", { name: /: 0% completion, 1 planned/ });
  await missed.focus();
  await page.keyboard.press("Enter");
  await expect(chart.locator(".execution-week-summary")).toContainText("1 didn’t happen");
  await expect(chart.locator(".execution-action")).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("goals use a full-width categorized table and show reporting coverage without invented completion", async ({
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
  await expect(page.locator(".goal-table-row")).toHaveCount(1);
  await expect(page.locator(".behavior-overview")).toContainText("0 reported");
  await expect(page.locator(".behavior-overview h2")).toContainText("—");
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

test("landing keeps the floating scroll hero, five chapters, shared goal plan, and three phones", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator(".journey-hero")).toHaveAttribute("data-scene", "intro");
  await expect(page.locator("h1")).toHaveText("Reach your goals with a system that adapts to you.");
  await expect(page.locator(".hero-intro-v2 > p")).toContainText("behavioural science and your check-ins");
  await expect(page.locator(".focus-chapter")).toHaveCount(5);
  await expect(page.getByText("A clear next step.", { exact: true })).toHaveCount(0);
  await expect(page.locator(".hero-assembled")).toHaveAttribute("inert", "");
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
  await page.evaluate(() => { const el = document.querySelector(".journey-hero")!; window.scrollTo(0, el.getBoundingClientRect().top + scrollY + el.clientHeight - innerHeight); });
  await expect(page.locator(".journey-hero")).toHaveAttribute("data-scene", "plan");
  await expect(page.locator(".hero-buttons")).toHaveAttribute("inert", "");
  await expect(page.locator(".hero-assembled")).not.toHaveAttribute("inert", "");
  const assembled = await page.locator(".hero-assembled").boundingBox();
  expect(Math.abs(assembled!.y + assembled!.height / 2 - 500)).toBeLessThan(3);
  await expect(page.locator(".learning-fragment-line")).toHaveCount(3);
  await expect(page.locator(".learning-reveal-mask")).toHaveCSS("width", "900px");
  await expect(page.locator(".learning-example-note")).toContainText("illustration");
  await page.evaluate(() => { const el = document.querySelector(".journey-hero")!; window.scrollTo(0, el.getBoundingClientRect().top + scrollY + (el.clientHeight - innerHeight) * .52); });
  await expect(page.locator(".learning-preview")).toHaveAttribute("data-stage", "2");
  const camera = page.locator(".learning-chart-world");
  const viewport = await page.locator(".learning-chart-viewport").boundingBox();
  const closeView = await camera.boundingBox();
  expect(closeView!.width / viewport!.width).toBeGreaterThan(3);
  await page.evaluate(() => { const el = document.querySelector(".journey-hero")!; window.scrollTo(0, el.getBoundingClientRect().top + scrollY + (el.clientHeight - innerHeight) * .7); });
  await expect(page.locator(".learning-preview")).toHaveAttribute("data-stage", "4");
  expect((await camera.boundingBox())!.x).toBeLessThan(closeView!.x - 400);
  await page.evaluate(() => { const el = document.querySelector(".journey-hero")!; window.scrollTo(0, el.getBoundingClientRect().top + scrollY + el.clientHeight - innerHeight); });
  await expect(page.locator(".learning-preview")).toHaveAttribute("data-stage", "5");
  await expect.poll(async () => (await camera.boundingBox())!.width / viewport!.width).toBeCloseTo(1, 2);
  await expect(page.getByRole("heading", { name: "Progress isn’t linear. Learning adds up." })).toBeVisible();
  const chapter = page.locator("#step-2");
  await expect(chapter.locator(".app-capture-window .capture-still img")).toHaveAttribute("src", "/media/app/calendar-desktop.webp");
  const connections = page.locator("#step-5");
  await expect(connections.locator(".connection-phone")).toHaveCount(3);
  await expect(connections.locator(".connection-phone").nth(1)).toHaveClass(/adler-phone/);
  await expect(connections.locator(".connection-orbit-icon")).toHaveCount(6);
  const phoneRatio = await connections.locator(".adler-phone").evaluate(el => el.clientHeight / el.clientWidth);
  expect(phoneRatio).toBeGreaterThan(1.8);
  expect(phoneRatio).toBeLessThan(2);
  await connections.getByRole("button", { name: "Try the example text check-in" }).click();
  await expect(connections.locator(".phone-messages")).toContainText("check how it feels after two sessions");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".journey-hero")).toHaveAttribute("data-scene", "static");
  await expect(page.locator(".learning-reveal-mask")).toHaveCSS("width", "900px");
  await expect(page.locator(".connection-orbits ellipse").first()).toHaveCSS("animation-name", "none");
  await page.getByRole("region", { name: "Example calendar schedule" }).focus();
  await page.keyboard.press("End");
  await expect.poll(() => page.locator(".phone-calendar-day").evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
