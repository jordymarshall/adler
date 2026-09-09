import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { register, seedCoaching, snapshot, synced } from "./fixtures";
import { landingWorkspace, captureDate } from "../scripts/landing-workspace";
import { evidenceRevision } from "../server/learning";
import { dateInZone } from "../shared/journey";
import { adaptiveFixture, adaptiveWorkspace } from "./adaptive-fixture";
import { basis } from "./planning-fixture";
import type { Data } from "../shared/workspace";

async function example(page: Page) {
  await register(page);
  const offset = Date.parse(dateInZone("America/Toronto")) - Date.parse(captureDate.slice(0, 10));
  const data: Data = JSON.parse(JSON.stringify(landingWorkspace(), (_key, value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value)) return value;
    const shifted = new Date(Date.parse(value) + offset).toISOString();
    return value.length === 10 ? shifted.slice(0, 10) : shifted;
  }));
  for (const action of data.actions) action.occurrence = `${action.stepId}:${action.date}`;
  for (const goal of data.goals) for (const plan of goal.plans) for (const step of plan.adaptive?.steps ?? []) {
    if (step.recurrence?.weekdays) step.recurrence.weekdays = step.recurrence.weekdays.map(day => ((day + offset / 86400000) % 7 + 7) % 7);
  }
  for (const record of data.learning ?? []) {
    for (const version of record.versions) version.sources = version.sources.map(source => evidenceRevision(data, source.id)!);
    for (const review of record.reviews) review.sources = review.sources.map(source => evidenceRevision(data, source.id)!);
  }
  await seedCoaching(page, data);
  return data;
}

test("selected goal views retain the capacity bar, action strip and live reports in the actual app shell", async ({ page }) => {
  const data = await example(page);
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.goto("/app/goals");
  await expect(page.getByRole("navigation", { name: "App navigation", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Weekly time budget" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: /Controllable work/ })).toBeVisible();
  await expect(page.locator(".goal-overview-table .goal-input-chart")).toHaveCount(3);
  await page.screenshot({ path: ".context/production-all-goals-1440.png", fullPage: true });
  await page.getByRole("link", { name: "Read 30 books", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Read 30 books/);
  await expect(page.locator(".goal-section-index")).toHaveCount(0);
  await expect(page.locator(".goal-action-canvas .goal-input-chart")).toHaveCount(1);
  await expect(page.getByRole("group", { name: "Dated action reports" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Milestone and goal outlook" })).toBeVisible();
  await expect(page.locator(".experiment-strip")).toContainText("Live experiment");
  const journey = await page.locator(".goal-learning-rail").boundingBox();
  const canvas = await page.locator(".goal-action-canvas").boundingBox();
  expect(journey!.x).toBeLessThan(canvas!.x);
  const report = data.actions.find(action => action.id === "reading-2026-10-15")!;
  await page.getByRole("group", { name: "Dated action reports" }).getByRole("button", { name: new RegExp(`.*${report.title}, Done`) }).last().click();
  await page.getByRole("button", { name: "Edit report", exact: true }).click();
  await page.getByLabel("What happened?").selectOption("Partly");
  await page.getByLabel("Pages read (pages)").fill("8");
  await page.getByRole("button", { name: "Save report", exact: true }).click();
  await synced(page);
  await expect(page.getByRole("region", { name: "Selected action" })).toContainText("Partly · 8 pages");
  await page.reload();
  const changed = (await snapshot(page)).data;
  expect(changed.actions.some(action => action.goalId === "reading" && action.outcome === "Partly" && action.amount === 8)).toBe(true);
  expect(changed.goals.find(goal => goal.id === "reading")!.results).toEqual(data.goals.find(goal => goal.id === "reading")!.results);
  await page.screenshot({ path: ".context/production-goal-1440.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".goal-action-canvas .goal-input-chart svg")).toHaveAttribute("viewBox", "0 0 400 265");
  const heading = await page.getByRole("heading", { level: 1 }).boundingBox();
  const result = await page.locator(".goal-heading-result").boundingBox();
  expect(result!.y).toBeGreaterThan(heading!.y + heading!.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: ".context/production-goal-390.png", fullPage: true });
  await page.goto("/app/goals");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: ".context/production-all-goals-390.png", fullPage: true });
});

test("reasoning and projections open from the same goal, while historical selection keeps its own work", async ({ page }) => {
  await example(page);
  await page.goto("/app/goals/reading");
  await page.getByRole("button", { name: "How this is estimated" }).click();
  const projection = page.getByRole("dialog");
  await expect(projection.locator(".outcome-fan")).toHaveCount(1);
  await expect(projection.locator(".outcome-error")).toHaveCount(5);
  await projection.getByText("Explore the input and the evidence").click();
  await expect(projection).toContainText("not a confidence interval or a guarantee");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Inspect reasoning", exact: false }).click();
  await expect(page.getByRole("dialog")).toContainText("Planning window");
  await page.keyboard.press("Escape");
  await page.locator(".experiment-strip").getByRole("button", { name: "Review" }).click();
  await expect(page.getByRole("dialog")).toContainText("STARTING POINT");
  await page.getByRole("dialog").getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.getByRole("dialog").locator(".learning-record > summary")).toContainText("Paused");
  await page.keyboard.press("Escape");
  await page.locator(".goal-plan-journey > li").first().getByRole("button").click();
  await expect(page.locator(".action-canvas-heading")).toContainText("EARLIER APPROACH");
  await expect(page.getByRole("button", { name: "Edit plan", exact: true })).toHaveCount(0);
});

test("one-day goals do not invent recurring graphs, experiments or milestone forecasts", async ({ page }) => {
  await register(page);
  const today = dateInZone("UTC"), plan = adaptiveFixture(today, today);
  delete plan.experiment;
  delete plan.reasoning;
  plan.steps[0].type = "task";
  delete plan.steps[0].recurrence;
  delete plan.steps[0].measure;
  const data = adaptiveWorkspace(plan);
  await seedCoaching(page, data);
  await page.goto("/app/goals/essay");
  await expect(page.locator(".goal-action-canvas .goal-input-chart")).toHaveCount(0);
  await expect(page.locator(".outcome-projected")).toHaveCount(0);
  await expect(page.locator(".experiment-strip")).toHaveCount(0);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("button", { name: "Save report", exact: true }).click();
  await synced(page);
  const state = (await snapshot(page)).data;
  expect(state.actions[0].outcome).toBe("Done");
  expect(state.goals[0].milestones[0].done).toBe(false);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test("calendar and manual edits apply to the selected action and retain the original reasoning in history", async ({ page }) => {
  await register(page);
  const today = dateInZone("UTC"), plan = adaptiveFixture(today, today);
  plan.steps.push({ id: "peer-review", type: "task", title: "Ask for feedback on the outline", criterion: "Send my chosen question", cue: "After the draft", reason: "The next step I chose", durationMinutes: 10, scheduledDate: today, dependsOn: [] });
  const data = adaptiveWorkspace(plan), goal = data.goals[0];
  goal.plans[0].basis = structuredClone(basis);
  const first = data.actions.find(action => action.stepId === "outline")!;
  data.workBlocks.push({ id: first.id, goalId: goal.id, action: first.title, start: `${today}T10:00:00Z`, end: `${today}T10:25:00Z`, provider: "local", status: "Scheduled" });
  await seedCoaching(page, data);
  await page.goto("/app/goals/essay");
  await expect(page.getByRole("button", { name: "Add to calendar", exact: true })).toHaveCount(0);
  await page.getByLabel("Action in this plan").selectOption("peer-review");
  await expect(page.getByRole("region", { name: "Selected action" })).toContainText("Ask for feedback on the outline");
  await page.getByRole("button", { name: "Add to calendar", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Ask for feedback on the outline");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Edit plan", exact: true }).click();
  await expect(page.getByLabel("Next action", { exact: true })).toHaveValue("Ask for feedback on the outline");
  await page.getByLabel("Timing or cue").fill("At a quiet desk");
  await page.getByRole("button", { name: "Save plan", exact: true }).click();
  await synced(page);
  await page.reload();
  const saved = (await snapshot(page)).data.goals[0];
  expect(saved.plans).toHaveLength(2);
  expect(saved.plans[0].basis).toEqual(goal.plans[0].basis);
  expect(saved.plans[1].basis).toBeUndefined();
  expect(saved.plans[1].adaptive?.reasoning).toBeUndefined();
  expect(saved.plans[1].adaptive?.steps[0].cue).toBe(plan.steps[0].cue);
  expect(saved.plans[1].adaptive?.steps[1].cue).toBe("At a quiet desk");
  await page.locator(".goal-plan-journey > li").first().getByRole("button").click();
  await page.getByRole("button", { name: /Inspect reasoning/ }).click();
  await expect(page.getByRole("dialog")).toContainText(basis.strategy);
});
