import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { register, save, snapshot } from "./fixtures";
import { landingWorkspace, captureDate } from "../scripts/landing-workspace";
import { dateInZone } from "../shared/journey";
import type { Data } from "../shared/workspace";

async function example(page: Page) {
  await register(page);
  const state = await snapshot(page);
  const today = dateInZone("America/Toronto");
  // Keep the example's relative reporting history while exercising actual persistence.
  const offset = Date.parse(today) - Date.parse(captureDate.slice(0, 10));
  const data: Data = JSON.parse(JSON.stringify(landingWorkspace(), (_key, value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value)) return value;
    const shifted = new Date(Date.parse(value) + offset).toISOString();
    return value.length === 10 ? shifted.slice(0, 10) : shifted;
  }));
  data.actions.forEach(action => { action.occurrence = `${action.stepId}:${action.date}`; });
  // The shifted calendar dates retain each routine’s original weekdays relative to the fixture.
  const dayOffset = offset / 86400000;
  data.goals.forEach(goal => goal.plans.forEach(plan => plan.adaptive?.steps.forEach(step => {
    if (step.recurrence?.weekdays) step.recurrence.weekdays = step.recurrence.weekdays.map(day => ((day + dayOffset) % 7 + 7) % 7);
  })));
  await save(page, data, state.revision);
  return data;
}

test("goal attainment has a full-horizon fan and its measured input evidence, separate from adherence", async ({ page }) => {
  const data = await example(page);
  await page.goto("/app/goals/reading");
  const chart = page.getByRole("region", { name: "Goal timeline for Read 30 books" });
  await expect(chart).toContainText("1 / 30 books");
  await expect(chart.getByRole("img", { name: /Goal attainment from 0 to 100/ })).toBeVisible();
  await expect(chart.locator(".outcome-fan")).toHaveCount(1);
  await expect(chart.locator(".outcome-error")).toHaveCount(5);
  await expect(chart).toContainText("9,000 pages for 30 books");
  const whiskers = await chart.locator(".outcome-error title").allTextContents();
  expect(whiskers.at(-1)).toMatch(/100–100% of goal/);
  await chart.getByText("Explore the input and the evidence").click();
  await expect(chart.getByRole("img", { name: /Measured pages per day/ })).toBeVisible();
  await chart.getByRole("link", { name: /Input ·/ }).first().click();
  await expect(page).toHaveURL(/progress#record-reading-/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(data.goals[1].title);
});

test("a full month distinguishes goals and opens complete Adler event details on desktop and mobile", async ({ page }) => {
  await example(page);
  await page.goto("/app/calendar");
  await expect(page.getByRole("grid")).toBeVisible();
  await expect(page.getByRole("gridcell")).toHaveCount(42);
  const colors = await page.locator(".calendar-legend span i").evaluateAll(els => els.slice(0, 3).map(el => getComputedStyle(el).backgroundColor));
  expect(new Set(colors).size).toBe(3);
  const event = page.locator(".month-entry button").filter({ hasText: "25 minutes on my chosen draft" }).first();
  await event.click();
  await expect(page.getByRole("dialog")).toContainText("25 minutes on my chosen draft");
  await expect(page.getByRole("dialog")).toContainText("Adler plan");
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await event.click();
  await expect(page.getByRole("dialog").getByRole("heading")).toHaveText("25 minutes on my chosen draft");
  await page.keyboard.press("Escape");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("the reasoning path distinguishes evidence, hypotheses, experiments and feedback, with source links", async ({ page }) => {
  await example(page);
  await page.goto("/app/insights");
  const loop = page.getByRole("list", { name: "Coaching reasoning from evidence to the next test" });
  await expect(loop.getByRole("listitem")).toHaveCount(6);
  await expect(loop.locator(".learning-stage")).toHaveText([/01OBSERVATION/, /02HYPOTHESIS/, /03TEST/, /04RESULT/, /05INFERENCE/, /06NEXT QUESTION/]);
  await expect(loop.locator(".result-node")).toContainText("You reported completing two sessions");
  await expect(loop.locator(".next-hypothesis-node")).toContainText("Could a smaller fallback help on crowded days?");
  await expect(loop.locator(".behavioral-rationale summary")).toContainText("Specific goals with feedback");
  await loop.locator(".behavioral-rationale summary").click();
  await expect(loop.locator(".behavioral-rationale")).toContainText("A specific finish criterion");
  await expect(loop.locator(".behavioral-rationale")).toContainText("Two self-reports do not establish causation");
  await loop.locator(".learning-research summary").click();
  await expect(loop.locator(".learning-research a")).toHaveCount(3);
  await loop.locator(".result-node summary").first().click();
  await expect(loop.getByRole("link", { name: "Open result" })).toHaveAttribute("href", /progress#record-demo-portfolio-/);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
