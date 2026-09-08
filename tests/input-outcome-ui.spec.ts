import { evidenceRevision } from "../server/learning";
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { register, save, snapshot } from "./fixtures";
import { seedCoaching, reviewedProposal } from "./fixtures";
import { landingWorkspace, landingProposals, captureDate } from "../scripts/landing-workspace";
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
  for (const record of data.learning ?? []) {
    for (const version of record.versions) version.sources = version.sources.map(source => evidenceRevision(data, source.id)!);
    for (const review of record.reviews) review.sources = review.sources.map(source => evidenceRevision(data, source.id)!);
  }
  await seedCoaching(page, data);
  return data;
}

test("goal attainment has a full-horizon fan and its measured input evidence, separate from adherence", async ({ page }) => {
  const data = await example(page);
  await page.goto("/app/goals/reading");
  const chart = page.getByRole("region", { name: "Goal timeline for Read 30 books" });
  await expect(chart).toContainText("1 / 30 books");
  await expect(chart.getByRole("heading", { name: "Read 30 books" })).toBeVisible();
  await expect(chart.locator(".projection-heading")).toContainText("Last reported");
  await expect(chart.locator(".projection-heading")).toContainText("Scenario range:");
  await expect(chart.getByRole("img", { name: /Goal attainment from 0 to 100/ })).toBeVisible();
  await expect(chart.locator(".outcome-fan")).toHaveCount(1);
  await expect(chart.locator(".outcome-error")).toHaveCount(5);
  await expect(chart).toContainText("9,000 pages for 30 books");
  const whiskers = await chart.locator(".outcome-error title").allTextContents();
  expect(whiskers.at(-1)).toMatch(/100–100% of goal/);
  await chart.getByText("Explore the input and the evidence").click();
  await expect(chart.getByRole("img", { name: /Measured pages per day/ })).toBeVisible();
  const assumptions = chart.getByRole("region", { name: "Projection assumptions" });
  await expect(assumptions.getByRole("heading")).toHaveText("What this projection assumes");
  await expect(assumptions.locator("dt")).toContainText(["How this estimate works", "Starting from your last report", "Future work", "Gaps in the record", "How work relates to the result", "Feedback delay", "What the range means"]);
  await expect(assumptions).toContainText("No additional delay between input and outcome is assumed.");
  await expect(assumptions).toContainText("not a confidence interval or a guarantee");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(chart.locator(".outcome-timeline svg")).toHaveAttribute("viewBox", "0 0 400 295");
  expect((await chart.locator(".outcome-timeline svg").boundingBox())!.height).toBeGreaterThan(200);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
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

test("live learning distinguishes predictions, feedback and uncertainty with linked research", async ({ page }) => {
  await example(page);
  await page.goto("/app/insights");
  await expect(page.locator(".learning-record")).toHaveCount(2);
  await expect(page.locator(".learning-record[open]")).toHaveCount(0);
  await expect(page.locator(".learning-record > summary").first()).toContainText("Keep your book beside your lunch spot");
  await page.locator(".learning-record > summary").first().click();
  const path = page.getByRole("list", { name: "From your experience to a useful change" });
  await expect(path.locator(":scope > li")).toHaveCount(4);
  await expect(path).toContainText("Two reported reading sessions, 20 pages each");
  await expect(path).toContainText("Both days had a quiet lunch break");
  const reasoning = path.locator(".behavioral-rationale");
  await reasoning.locator(":scope > summary").click();
  await expect(reasoning).toContainText("not a proven personal rule");
  await reasoning.locator(".claim-evidence > details > summary").first().click();
  await expect(reasoning.locator(".claim-evidence")).toContainText("Application here");
  await expect(reasoning.locator(".claim-evidence a").first()).toHaveAttribute("href", /^https:/);
  await expect(path.locator(".learning-review a").first()).toHaveAttribute("href", /progress#record-reading-/);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("combobox").selectOption("reading");
  await expect(page.locator(".learning-record")).toHaveCount(1);
  await page.goto("/app/insights#record-reading-lunch");
  await expect(page.locator("#record-reading-lunch")).toHaveAttribute("open", "");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.locator("#record-reading-lunch > summary")).toContainText("Paused");
  await page.reload();
  await expect(page.locator("#record-reading-lunch > summary")).toContainText("Paused");
});

test("a standalone learning revision shows the proposed change and accepts that exact version", async ({ page }) => {
  const data = await example(page), record = data.learning![0];
  const next = structuredClone(record.versions[0]);
  next.version = 2;
  next.proposalId = null;
  next.test.change = "Keep the book beside the chair you chose";
  next.test.start = dateInZone(data.timeZone);
  record.versions.push(next);
  record.pendingVersion = 2;
  record.activeVersion = 1;
  await seedCoaching(page, data);
  await page.goto(`/app/insights#record-${record.id}`);
  const suggestion = page.getByRole("region", { name: "Revised suggestion" });
  await expect(suggestion).toContainText(next.test.change);
  await expect(page.locator(`#record-${record.id} > summary`)).toContainText(record.versions[0].test.change);
  await suggestion.getByRole("button", { name: "Try this", exact: true }).click();
  await expect(suggestion).toHaveCount(0);
  await expect(page.locator(`#record-${record.id} > summary`)).toContainText(next.test.change);
  const saved = (await snapshot(page)).data.learning!.find(item => item.id === record.id)!;
  expect(saved.activeVersion).toBe(2);
  expect(saved.versions[0].test.prediction).toBe(record.versions[0].test.prediction);
  expect(saved.standing).toBe("untested");
});
