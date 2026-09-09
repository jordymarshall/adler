import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { coachReply, register, save, seedCoaching, snapshot, synced } from "./fixtures";
import { todayFixture, todayProgressFixture } from "./today-fixture";
import { dateInZone } from "../shared/journey";

async function setup(page: import("@playwright/test").Page, progress = false) {
  await register(page);
  const today = dateInZone("UTC");
  const data = progress ? todayProgressFixture(today) : todayFixture(today);
  await seedCoaching(page, data);
  await page.goto("/app/today");
  return data;
}

test("daily cards report and correct real work without completing the goal", async ({ page }) => {
  const data = await setup(page);
  await expect(page.getByRole("heading", { name: "What you need to do today" })).toBeVisible();
  await expect(page.locator('.today-slide[aria-hidden="false"]')).toHaveCount(1);
  await expect(page.getByRole("heading", { name: /Your progress$/ })).toHaveCount(0);
  await expect(page.locator(".today-agenda li")).toHaveCount(2);
  await expect(page.getByRole("button", { name: /Ask for feedback on the draft/ })).toBeEnabled();
  await expect(page.getByText("Retired action", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: /Ask for feedback on the draft/ }).click();
  await expect(page.locator(".next-step-card")).toContainText("Ask for feedback on the draft");
  await page.locator(".today-agenda").getByRole("button", { name: /Draft five outline points/ }).click();
  await page.getByRole("button", { name: "Log what happened" }).click();
  await page.getByLabel("Outline points (points)").fill("5");
  await page.getByLabel("Actual time (minutes, optional)").fill("20");
  await page.getByRole("button", { name: "Save report", exact: true }).click();
  await synced(page);
  let state = (await snapshot(page)).data;
  expect(state.actions.find(action => action.id === "today-outline")?.outcome).toBe("Done");
  expect(state.actions.find(action => action.id === "today-outline")?.amount).toBe(5);
  expect(state.goals[0].results).toEqual(data.goals[0].results);
  expect(state.goals[0].milestones[0].done).toBe(false);
  await expect(page.locator(".today-orbit")).toHaveAccessibleName("1 of 2 actions reported done today");
  await page.getByRole("button", { name: /Draft five outline points.*Done/ }).click();
  await page.getByLabel("What happened?").selectOption("Partly");
  await page.getByLabel("Outline points (points)").fill("2");
  await page.getByRole("button", { name: "Save report", exact: true }).click();
  await synced(page);
  state = (await snapshot(page)).data;
  expect(state.actions.find(action => action.id === "today-outline")?.amount).toBe(2);
  expect(state.actions.find(action => action.id === "today-outline")?.history.length).toBe(2);
  await expect(page.locator(".today-orbit")).toHaveAccessibleName("0 of 2 actions reported done today");
});

test("immersive cards navigate with keys, stay in the viewport and expose every goal against its plan", async ({ page }) => {
  await setup(page, true);
  await page.getByRole("button", { name: "Pause animations" }).click();
  await expect(page.locator(".today-orbit-flower")).toHaveCSS("animation-play-state", "paused");
  const deck = page.getByRole("region", { name: "Daily story cards" });
  await deck.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: "Show Progress card" })).toHaveAttribute("aria-current", "step");
  await expect(page.locator('.today-slide[inert]')).toHaveCount(2);
  const goals = page.getByRole("list", { name: "All goals and progress relative to plan" });
  await expect(goals.getByRole("listitem")).toHaveCount(3);
  const essay = goals.getByRole("listitem").filter({ hasText: "Publish an essay" });
  await expect(essay).toContainText("1 / 3milestones verified");
  await expect(essay).toContainText("Still open: Peer review");
  const reading = goals.getByRole("listitem").filter({ hasText: "Read twelve books" });
  await expect(reading).toContainText("At checkpoint");
  await expect(reading.getByRole("img")).toHaveAccessibleName(/5 books recorded.*5 planned/);
  const spanish = goals.getByRole("listitem").filter({ hasText: "Learn conversational Spanish" });
  await expect(spanish).toContainText("Update needed");
  await expect(spanish).not.toContainText("Below checkpoint");
  await expect(spanish.getByRole("link", { name: "Update progress" })).toHaveAttribute("href", /goal=spanish/);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "Show Progress card" })).toHaveAttribute("aria-current", "step");
  await expect.poll(() => deck.evaluate(element => Math.abs(element.scrollLeft - element.clientWidth))).toBeLessThan(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && document.documentElement.scrollHeight <= innerHeight + 1)).toBe(true);
  await spanish.scrollIntoViewIfNeeded();
  await spanish.getByRole("link", { name: "Update progress" }).click();
  await expect(page.getByLabel("Message Adler")).toContainText("Learn conversational Spanish");
});

test("all three cards remain accessible in phone themes and respect motion preferences", async ({ page }) => {
  await setup(page, true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".today-orbit-flower")).toHaveCSS("animation-name", "none");
  await expect(page.getByRole("button", { name: "Pause animations" })).not.toBeVisible();
  for (const theme of ["light", "dark"] as const) {
    if (theme === "dark") {
      const state = await snapshot(page);
      state.data.theme = theme;
      await save(page, state.data, state.revision);
      await page.reload();
    }
    for (const [index, name] of ["Do", "Progress", "Learn"].entries()) {
      await page.getByRole("button", { name: `Show ${name} card` }).click();
      await expect(page.locator(".today-story")).toHaveAttribute("data-chapter", String(index));
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      expect(await page.evaluate(() => scrollY)).toBe(0);
    }
  }
});

test("touch gestures move one immersive card at a time without losing its place", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page, true);
  const session = await page.context().newCDPSession(page);
  await session.send("Emulation.setTouchEmulationEnabled", { enabled: true });
  async function swipe(from: number, to: number) {
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: from, y: 300 }] });
    for (let step = 1; step <= 8; step++) {
      await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: from + (to - from) * step / 8, y: 300 }] });
    }
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  }
  await swipe(330, 60);
  await expect(page.locator(".today-story")).toHaveAttribute("data-chapter", "1");
  const deck = page.locator(".today-deck");
  await expect.poll(() => deck.evaluate(element => Math.abs(element.scrollLeft - element.clientWidth))).toBeLessThan(2);
  await swipe(330, 60);
  await expect(page.locator(".today-story")).toHaveAttribute("data-chapter", "2");
  await expect.poll(() => deck.evaluate(element => Math.abs(element.scrollLeft - 2 * element.clientWidth))).toBeLessThan(2);
  await swipe(60, 330);
  await expect(page.locator(".today-story")).toHaveAttribute("data-chapter", "1");
  await expect.poll(() => deck.evaluate(element => Math.abs(element.scrollLeft - element.clientWidth))).toBeLessThan(2);
  await page.getByRole("button", { name: "Previous card" }).click();
  await expect(page.getByRole("heading", { name: "What you need to do today" })).toBeInViewport();
  await expect(page.getByRole("button", { name: "Previous card" })).toBeDisabled();
});

test("experiment detail uses the saved rationale and shared controls; a due review is not a result", async ({ page }) => {
  const data = await setup(page);
  await page.getByRole("button", { name: "Show Learn card" }).click();
  const learning = page.locator(".today-learning");
  await expect(learning).toContainText("Ready to review");
  await expect(learning).toContainText("Waiting to learn");
  await expect(learning).toContainText(data.learning![0].versions[0].hypothesis);
  await page.getByRole("button", { name: "Explore the experiment" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByText("Why this test? · Behavioural science & evidence", { exact: true }).click();
  await expect(dialog).toContainText(data.learning![0].versions[0].reasoning.mechanism);
  await dialog.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(dialog).toContainText("Paused");
  const state = (await snapshot(page)).data;
  expect(state.learning![0].state).toBe("paused");
  expect(state.learning![0].reviews).toEqual([]);
  expect(state.learning![0].standing).toBe("untested");
  await page.keyboard.press("Escape");
  await expect(learning).toContainText("Paused. Resume when this fits your life again.");
  await expect(learning.getByRole("link", { name: "Share an update" })).toHaveCount(0);
  await learning.getByRole("link", { name: "Discuss with Adler" }).click();
  await expect(page.getByLabel("Message Adler")).toContainText("writing-window-test");
  await expect(page.getByLabel("Message Adler")).toContainText("test version 1");
});

test("pending revisions keep the agreed test visible and corrections stay explicit", async ({ page }) => {
  const data = await setup(page);
  const record = data.learning![0];
  record.versions.push({ ...structuredClone(record.versions[0]), version: 2, test: { ...record.versions[0].test, change: "Try a smaller outline instead." } });
  record.pendingVersion = 2;
  await seedCoaching(page, data);
  await page.reload();
  await page.getByRole("button", { name: "Show Learn card" }).click();
  const learning = page.locator(".today-learning");
  await expect(learning.getByRole("heading", { level: 3 })).toHaveText("Try your outline after breakfast.");
  await expect(learning).toContainText("A revision is awaiting your choice");
  await page.getByRole("button", { name: "Review suggestion" }).click();
  await expect(page.getByRole("dialog")).toContainText("Try a smaller outline instead.");
  await page.keyboard.press("Escape");
  record.standing = "reconsider";
  await seedCoaching(page, data);
  await page.reload();
  await page.getByRole("button", { name: "Show Learn card" }).click();
  await expect(learning).toContainText("The evidence changed. Review this explanation before using it.");
  await expect(learning).toContainText("Evidence has changed");
});

test("quiet days and saved context do not invent work, results or experiments", async ({ page }) => {
  const data = await setup(page);
  data.goals[0].status = "Paused";
  data.actions = [];
  data.learning = [];
  await seedCoaching(page, data);
  await page.reload();
  await expect(page.getByRole("heading", { name: "A little space for what’s next." })).toBeVisible();
  await page.getByRole("button", { name: "Show Progress card" }).click();
  await expect(page.locator(".today-progress")).toContainText("Paused");
  await page.getByRole("button", { name: "Show Learn card" }).click();
  await expect(page.locator(".today-learning")).toContainText("YOU TOLD ADLER");
  await expect(page.locator(".today-learning")).toContainText(data.memories[0].text);
  await expect(page.getByRole("button", { name: "Explore the experiment" })).toHaveCount(0);
  await page.getByRole("link", { name: "Share how it went" }).click();
  await expect(page.getByLabel("Message Adler")).toContainText("what helped or got in the way");
});

test("unscheduled work offers a concise start and opens the existing scheduler on request", async ({ page }) => {
  await register(page, true);
  const state = await snapshot(page);
  state.data.actions[0].date = "";
  await save(page, state.data, state.revision);
  await page.goto("/app/today");
  await expect(page.locator(".inline-scheduler")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "I’ll do it now" })).toBeVisible();
  await page.getByRole("button", { name: "Choose a time", exact: true }).click();
  await expect(page.locator(".inline-scheduler")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.getByRole("button", { name: "I’ll do it now" }).click();
  await expect(page.locator('.next-step-card[data-phase="working"]')).toBeVisible();
  await synced(page);
  const saved = (await snapshot(page)).data;
  expect(saved.actions[0].startedAt).toBeTruthy();
  expect(saved.actions[0].outcome).toBeUndefined();
});

test("saved Check-in results update Today live and returning restores the progress card", async ({ page }) => {
  const data = await setup(page, true);
  const today = dateInZone(data.timeZone);
  const observing = await page.context().newPage();
  await observing.goto("/app/today?card=progress");
  const observedGoal = observing.getByRole("listitem").filter({ hasText: "Learn conversational Spanish" });
  await expect(observedGoal).toContainText("Update needed");
  await coachReply(page, [
    { entity: "result", operation: "create", id: "spanish-today", parentId: "spanish", values: JSON.stringify({ date: today, value: 12, source: "User reported twelve lessons completed" }) },
    { entity: "milestone", operation: "update", id: "review", parentId: "essay", values: JSON.stringify({ done: true, completedAt: today }) },
  ]);
  await page.getByRole("button", { name: "Show Progress card" }).click();
  await page.getByRole("listitem").filter({ hasText: "Learn conversational Spanish" }).getByRole("link", { name: "Update progress" }).click();
  await page.getByLabel("Message Adler").fill("I have completed twelve Spanish lessons. I also received peer feedback on my essay today.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator(".coach-thread")).toContainText("Your update is saved.");
  await expect(observedGoal).toContainText("12 / 24");
  await expect(observedGoal).toContainText("Above checkpoint");
  await expect(observedGoal).toContainText("+2 vs checkpoint");
  const essay = observing.getByRole("listitem").filter({ hasText: "Publish an essay" });
  await expect(essay).toContainText("2 / 3");
  await expect(essay).toContainText("At checkpoint");
  expect((await snapshot(page)).data.actions).toEqual(data.actions);
  // The shared coach opens the saved conversation as a separate history entry.
  await page.goBack();
  await expect(page).toHaveURL(/\/app\/check-in\?/);
  await page.goBack();
  await expect(page.locator(".today-story")).toHaveAttribute("data-chapter", "1");
  await expect(page.getByRole("listitem").filter({ hasText: "Learn conversational Spanish" })).toContainText("12 / 24");
  await page.getByRole("link", { name: "Inspect progress and plan for Read twelve books" }).click();
  await expect(page).toHaveURL(/\/app\/goals\/reading/);
  await page.goBack();
  await page.reload();
  await expect(page.locator(".today-story")).toHaveAttribute("data-chapter", "1");
  await expect(page.getByRole("listitem").filter({ hasText: "Learn conversational Spanish" })).toContainText("12 / 24");
  await observing.close();
});

test("direct card links preserve the chosen action and a fresh Today visit starts with Do", async ({ page }) => {
  await setup(page);
  await page.goto("/app/today?card=learn&goal=essay&action=today-feedback");
  await expect(page.getByRole("heading", { name: "What we’re learning" })).toBeInViewport();
  await page.getByRole("button", { name: "Previous card" }).click();
  await expect(page.locator(".today-story")).toHaveAttribute("data-chapter", "1");
  await expect(page).toHaveURL(/card=progress/);
  await page.getByRole("button", { name: "Previous card" }).click();
  await expect(page.locator(".next-step-card")).toContainText("Ask for feedback on the draft");
  await expect(page.locator(".next-step-card")).toBeInViewport();
  expect(new URL(page.url()).searchParams.get("action")).toBe("today-feedback");
  await page.getByRole("button", { name: "Show Learn card" }).click();
  await expect(page.locator(".today-story")).toHaveAttribute("data-chapter", "2");
  await page.getByRole("navigation", { name: "App navigation", exact: true }).getByRole("link", { name: "Today" }).click();
  await expect(page.locator(".today-story")).toHaveAttribute("data-chapter", "0");
  await expect(page.locator(".next-step-card")).toContainText("Draft five outline points");
});

test("a failed save rolls back the action and keeps the warning and deck usable on a phone", async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/workspace", route => route.request().method() === "POST"
    ? route.fulfill({ status: 503, json: { error: "The workspace could not be saved." } }) : route.continue());
  await page.getByRole("button", { name: "Start action", exact: true }).click();
  const warning = page.getByRole("alert");
  await expect(warning).toContainText("Your unsaved changes were not applied");
  await expect(page.getByRole("button", { name: "Start action", exact: true })).toBeVisible();
  expect((await snapshot(page)).data.actions.find(action => action.id === "today-outline")?.startedAt).toBeUndefined();
  const warningBox = (await warning.boundingBox())!;
  const storyBox = (await page.locator(".today-story").boundingBox())!;
  expect(warningBox.y + warningBox.height).toBeLessThanOrEqual(storyBox.y + 1);
  expect(storyBox.width).toBe(390);
  await page.getByRole("button", { name: "Show Progress card" }).click();
  await expect(page.getByRole("heading", { name: /Your progress$/ })).toBeInViewport();
  const footer = (await page.locator(".today-deck-nav").boundingBox())!;
  const mobileNav = (await page.getByRole("navigation", { name: "Mobile app navigation" }).boundingBox())!;
  expect(footer.y + footer.height).toBeLessThanOrEqual(mobileNav.y + 1);
  await page.unroute("**/api/workspace");
  await page.getByRole("button", { name: "Show Do card" }).click();
  await page.getByRole("button", { name: "Start action", exact: true }).click();
  await expect(warning).toHaveCount(0);
  await synced(page);
  expect((await snapshot(page)).data.actions.find(action => action.id === "today-outline")?.startedAt).toBeTruthy();
});
