import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { register, snapshot, save, coachReply, reviewedProposal } from "./fixtures";
import { addDays, dateInZone } from "../shared/journey";

// Model responses are substituted here; commands, proposal approval and persistence are real.
test("a contextual milestone edit calls shared Coach, shows progress and saves the result without reporting goal attainment", async ({ page }) => {
  await register(page, true);
  const before = (await snapshot(page)).data, milestone = before.goals[0].milestones[0];
  await page.goto("/app/goals/essays");
  await page.getByRole("button", { name: /Milestone 1/ }).click();
  await page.getByRole("button", { name: "Edit milestone", exact: true }).click();
  await expect(page.getByLabel("Milestone outcome", { exact: true })).toHaveValue(milestone.title);
  await page.screenshot({ path: ".context/preview-milestone-editor-desktop.png" });
  await page.getByLabel("Milestone outcome", { exact: true }).fill("First essay ready to publish");
  await page.getByLabel("Reached when", { exact: true }).fill("I confirm my first essay is ready for publication");
  await coachReply(page, [{ entity: "milestone", operation: "update", id: milestone.id, parentId: "essays", values: JSON.stringify({ title: "First essay ready to publish", criterion: "I confirm my first essay is ready for publication" }) }]);
  let release!: () => void;
  const paused = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/coach", async route => { await paused; await route.fallback(); });
  const request = page.waitForRequest(request => request.url().endsWith("/api/coach"));
  await page.getByRole("button", { name: "Update with Adler" }).click();
  const input = (await request).postDataJSON();
  expect(input.goalId).toBe("essays"); expect(input.focusGoalId).toBe("essays"); expect(input.message).toContain(`milestone ID ${milestone.id}`);
  await expect(page.getByRole("status").filter({ hasText: "Adler is adjusting your plan" })).toBeVisible();
  await expect(page.getByLabel("Milestone outcome", { exact: true })).toBeDisabled();
  release();
  await expect(page.getByRole("link", { name: "Continue with Coach ↗" })).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Done", exact: true }).click();
  await page.reload();
  const after = (await snapshot(page)).data;
  expect(after.goals[0].milestones[0].title).toBe("First essay ready to publish");
  expect(after.goals[0].results).toEqual(before.goals[0].results);
  expect(after.actions).toEqual(before.actions);
  expect(after.messages.at(-2)?.text).toContain(`milestone ID ${milestone.id}`);
});

test("plan edits remain available from All Goals and preserve input on a failed request", async ({ page }) => {
  await register(page, true);
  await page.goto("/app/goals");
  await page.getByRole("button", { name: "Edit plan for Publish two essays" }).click();
  await page.getByLabel("What should change?").fill("These milestones are tasks. Help me make them useful intermediate results.");
  const requests: string[] = [];
  await page.route("**/api/coach", async route => { requests.push(route.request().postDataJSON().requestId); await route.fulfill({ status: 503, json: { error: "Coach is temporarily unavailable" } }); });
  await page.getByRole("button", { name: "Update with Adler" }).click();
  await expect(page.getByRole("alert")).toContainText("Coach is temporarily unavailable");
  await expect(page.getByLabel("What should change?")).toHaveValue("These milestones are tasks. Help me make them useful intermediate results.");
  await page.getByRole("button", { name: "Update with Adler" }).click();
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[0]).toBe(requests[1]);
});

test("an editor refuses an outdated plan before asking the harness to adjust it", async ({ page }) => {
  await register(page, true);
  await page.goto("/app/goals/essays");
  await page.getByRole("button", { name: "Edit plan", exact: true }).click();
  await page.getByLabel("What should change?").fill("Make the first milestone clearer.");
  const state = await snapshot(page);
  state.data.goals[0].milestones[0].title = "Updated elsewhere";
  await save(page, state.data, state.revision);
  let calls = 0;
  await page.route("**/api/coach", async route => { calls++; await route.abort(); });
  await page.getByRole("button", { name: "Update with Adler" }).click();
  await expect(page.getByRole("alert")).toContainText("This plan changed while you were editing");
  expect(calls).toBe(0);
});

test("a suggested edit stays pending until accepted inside the editor", async ({ page }) => {
  await register(page, true);
  const state = await snapshot(page), milestone = state.data.goals[0].milestones[0];
  const proposal = await reviewedProposal(page, [{ entity: "milestone", operation: "update", id: milestone.id, parentId: "essays", values: JSON.stringify({ title: "First essay ready" }) }], "Clarify the intermediate result");
  await page.goto("/app/goals/essays");
  await page.getByRole("button", { name: "Edit plan", exact: true }).click();
  await page.getByLabel("What should change?").fill("Help me rethink the first milestone.");
  await page.route("**/api/coach", route => route.fulfill({ json: { conversationId: "review-edit", proposal, data: state.data } }));
  await page.getByRole("button", { name: "Update with Adler" }).click();
  await expect(page.getByText("Suggested adjustment", { exact: true })).toBeVisible();
  expect((await snapshot(page)).data.goals[0].milestones[0].title).toBe(milestone.title);
  await page.getByRole("button", { name: "Accept adjustment", exact: true }).click();
  await expect(page.getByText("Plan updated", { exact: true })).toBeVisible();
  expect((await snapshot(page)).data.goals[0].milestones[0].title).toBe("First essay ready");
});

test("calendar placement opens on a week with a selected preview, moves visually and books once", async ({ page }) => {
  await register(page, true);
  const state = await snapshot(page), tomorrow = addDays(dateInZone(state.data.timeZone), 1);
  state.data.actions[0].date = tomorrow;
  state.data.goals[0].plans[0].durationMinutes = 25;
  await save(page, state.data, state.revision);
  await page.goto("/app/goals/essays");
  await page.getByRole("button", { name: "Add to calendar", exact: true }).click();
  const calendar = page.getByRole("region", { name: "Your calendar" });
  await expect(calendar.locator(".week-desktop")).toBeVisible();
  await expect(calendar.locator(".month-calendar")).toHaveCount(0);
  await expect(calendar.locator(".week-desktop .entry-preview")).toBeInViewport();
  await page.screenshot({ path: ".context/preview-week-placement-desktop.png" });
  await expect(page.getByRole("button", { name: "Save time", exact: true })).toBeVisible();
  const next = addDays(tomorrow, 1);
  const placement = calendar.getByRole("button", { name: `Place action on ${next}`, exact: true });
  if (await placement.count()) {
    await placement.focus(); await page.keyboard.press("Enter");
    await expect(calendar.locator(".week-day").filter({ has: page.locator(".entry-preview") })).toHaveCount(1);
  }
  await page.getByRole("button", { name: "Save time", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const after = (await snapshot(page)).data;
  expect(after.workBlocks).toHaveLength(1);
  expect(after.workBlocks[0].id).toBe(state.data.actions[0].id);
  expect(after.actions[0].outcome).toBeUndefined();
});

test("automatic tentative blocks are visible before booking and the week placement is accessible on mobile", async ({ page }) => {
  await register(page, true);
  const state = await snapshot(page);
  state.data.actions[0].date = addDays(dateInZone(state.data.timeZone), 1);
  await save(page, state.data, state.revision);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app/calendar");
  const tentative = page.locator(".week-agenda .entry-tentative").first();
  // A Sunday-to-Monday boundary needs the next week, just as a normal calendar does.
  if (!(await tentative.count())) await page.getByRole("button", { name: "Next week" }).click();
  await expect(tentative).toBeVisible();
  expect((await snapshot(page)).data.workBlocks).toHaveLength(0);
  await tentative.getByRole("button").click();
  await expect(page.locator(".week-agenda .entry-preview")).toHaveCount(1);
  await page.screenshot({ path: ".context/preview-week-placement-phone.png" });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("opening placement cannot silently suggest work beyond the weekly budget", async ({ page }) => {
  await register(page, true);
  const state = await snapshot(page), date = addDays(dateInZone(state.data.timeZone), 1);
  state.data.programs.at(-1)!.weeklyMinutes = 25;
  state.data.goals[0].plans[0].durationMinutes = 25;
  state.data.actions[0].date = date;
  state.data.workBlocks.push({ id: "other-booking", goalId: "essays", action: "Previously committed work", start: `${date}T16:00:00Z`, end: `${date}T16:25:00Z`, status: "Scheduled", provider: "local" });
  await save(page, state.data, state.revision);
  await page.goto("/app/goals/essays");
  await page.getByRole("button", { name: "Add to calendar", exact: true }).click();
  await expect(page.locator(".entry-preview")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Save time", exact: true })).toHaveCount(0);
  await expect(page.getByText("1 action needs room or a prerequisite", { exact: true })).toBeVisible();
  await page.getByText("1 action needs room or a prerequisite", { exact: true }).click();
  await expect(page.getByText(/Weekly time budget is full/)).toBeVisible();
});

test("a completed coach suggestion does not leave a global Continue button below later conversation", async ({ page }) => {
  await register(page, true);
  const state = await snapshot(page), milestone = state.data.goals[0].milestones[0];
  const proposal = await reviewedProposal(page, [{ entity: "milestone", operation: "update", id: milestone.id, parentId: "essays", values: JSON.stringify({ title: "First essay ready" }) }], "Clarify the milestone");
  expect((await page.request.post(`/api/proposals/${proposal.id}/approve`, { data: {} })).ok()).toBe(true);
  await coachReply(page, [], "Let's review your next writing session.");
  await page.goto("/app/check-in");
  await page.getByLabel("Message Adler").fill("Let's review today.");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.getByText("Let's review your next writing session.", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue →", exact: true })).toHaveCount(0);
});

test("moving placement to another week does not reuse the original week's availability", async ({ page }) => {
  await register(page, true);
  await page.route("**/api/status", async route => { const response = await route.fetch(); const status = await response.json(); await route.fulfill({ json: { ...status, google: { ...status.google, connected: true } } }); });
  await page.route("**/api/calendars", route => route.fulfill({ json: { google: [{ id: "primary", name: "Test calendar", writable: true }], apple: [] } }));
  await page.route("**/api/availability", route => route.fulfill({ json: { busy: [], checkedAt: new Date().toISOString() } }));
  await page.goto("/app/goals/essays");
  await page.getByRole("button", { name: "Add to calendar", exact: true }).click();
  await page.getByText("Calendar options", { exact: true }).click();
  await page.getByRole("combobox", { name: "Book in", exact: true }).selectOption("google");
  await page.getByRole("button", { name: "Check availability", exact: true }).click();
  await expect(page.getByText(/Connected calendars checked for this view/)).toBeVisible();
  await page.getByText("Choose another time", { exact: true }).click();
  await page.locator(".custom-calendar-time").getByLabel("Date", { exact: true }).fill(addDays(dateInZone("America/Toronto"), 8));
  await page.getByLabel("Start time", { exact: true }).fill("11:00");
  await page.getByRole("button", { name: "Use this time", exact: true }).click();
  await expect(page.getByText(/Connected calendars checked for this view/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Check availability", exact: true })).toBeVisible();
});
