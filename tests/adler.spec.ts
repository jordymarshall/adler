import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { register, save, snapshot, synced, coachReply } from "./fixtures";
import { localDate } from "../shared/workspace";
import { createGoal } from "../shared/validation";

test("landing demonstrates goal progress and opens an empty signed-in workspace", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText("Reach your goals with a system that understands you.");
  await expect(page.locator(".story-phone-frame")).toHaveCount(6);
  await expect(page.locator(".phone-story-caption")).toContainText("Reading example");
  await expect(page.locator(".journey-connections")).toContainText("Coming soon");
  await page
    .getByRole("link", { name: "Explore the app", exact: true })
    .first()
    .click();
  await page.getByLabel("Username", { exact: true }).fill(`new-${Date.now()}`);
  await page
    .getByLabel("Password", { exact: true })
    .fill("a-long-new-password");
  await page.getByRole("button", { name: "Create my workspace" }).click();
  await expect(page.locator("h1")).toContainText(
    "What would you like to achieve?",
  );
  expect((await snapshot(page)).data.goals).toHaveLength(0);
  const navigation = page.getByRole("navigation", {
    name: "App navigation",
    exact: true,
  });
  await expect(navigation.getByRole("link")).toHaveCount(5);
  await expect(
    navigation.getByRole("link", { name: "Today", exact: true }),
  ).toBeVisible();
  await page.reload();
  expect((await snapshot(page)).data.goals).toHaveLength(0);
});

test("manual goal setup saves a draft and establishes a zero baseline without sample goals", async ({
  page,
}) => {
  await register(page);
  await page.goto("/app/today");
  await expect(
    page.getByRole("link", { name: /Review & plan your week/ }),
  ).toHaveCount(0);
  await page.goto("/app/goals");
  await expect(
    page.getByRole("heading", { name: "What would you like to achieve?" }),
  ).toBeVisible();
  await expect(page.getByLabel("Search goals", { exact: true })).toHaveCount(0);
  await page.goto("/app/goals/new/manual");
  await page
    .getByLabel("What would you like to work toward?")
    .fill("Publish my first illustration");
  await synced(page);
  await page.reload();
  await expect(
    page.getByLabel("What would you like to work toward?"),
  ).toHaveValue("Publish my first illustration");
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
  await synced(page);
  const { data } = await snapshot(page);
  expect(data.goals).toHaveLength(1);
  expect(data.goals[0].results[0].value).toBe(0);
  expect(data.actions[0].date).toBe("");
  await page.goto(`/app/goals/${data.goals[0].id}/progress`);
  await expect(page.getByRole("navigation", { name: "Milestones" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Goal and current cycle" })).not.toContainText("Choose the first cycle");
  await expect(page.locator(".goal-action-canvas")).not.toContainText("Choose what to track");
  await expect(page.getByRole("region", { name: "Goal and current cycle" })).toContainText("Sketch three thumbnails");
  await page.getByRole("button", { name: /Why no estimate yet/ }).click();
  await expect(page.locator(".projection-tracking")).toContainText("Verified milestones");
  await expect(page.getByRole("navigation", { name: "Goal sections" })).toHaveCount(0);
  await page.getByRole("link", { name: "Edit tracking" }).click();
  await expect(page).toHaveURL(/\/app\/check-in/);
  await expect(page.getByLabel("Message Adler")).toContainText("Review the tracking you chose");
  await page.goto("/app/goals");
  await page.getByText("Find or filter a goal", { exact: true }).click();
  await expect(page.getByLabel("Search goals", { exact: true })).toBeVisible();
  await page.getByLabel("Search goals", { exact: true }).fill("does not match");
  await expect(
    page.getByRole("heading", { name: "No goals match these filters." }),
  ).toBeVisible();
});

test("chat reports preserve the distinction between actions and goal results", async ({ page }) => {
  await register(page, true);
  const state = await snapshot(page);
  await coachReply(page, [{ entity: "action", operation: "update", id: state.data.actions[0].id, parentId: null, values: JSON.stringify({ outcome: "Done" }) }]);
  await page.goto("/app/check-in?goal=essays");
  await page.getByLabel("Message Adler").fill("I finished drafting the five points today.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator(".coach-thread")).toContainText("Your update is saved.");
  const saved = await snapshot(page);
  expect(saved.data.actions[0].outcome).toBe("Done");
  expect(saved.data.goals[0].milestones.filter(m => m.done)).toHaveLength(0);
  expect(saved.data.goals[0].results.at(-1)?.value).toBe(0);
  await page.goto("/app/goals/essays/progress");
  await page.getByRole("link", { name: "Discuss in Check-in" }).first().click();
  await expect(page).toHaveURL(/\/app\/check-in/);
  await expect(page.getByLabel("Message Adler")).toContainText("milestone");
});

test("a learning goal records results in one chart with its own target", async ({
  page,
}) => {
  await register(page);
  const state = await snapshot(page);
  createGoal(
    state.data,
    {
      title: "Solve six algebra problems correctly",
      kind: "learning",
      why: "Prepare for my course",
      success: "Six correct answers on a comparable ten-question practice set",
      area: "Learning",
      tags: [],
      targetDate: localDate(28),
      milestones: [
        {
          title: "Complete a practice set",
          criterion: "Six of ten answers correct",
        },
      ],
      assessmentTarget: 6,
      baseline: 3,
      action: "Practice equations for 20 minutes",
      criterion: "Attempt five equations and check the answers",
      timing: "Unscheduled",
    },
    localDate(-14),
    "algebra",
  );
  await save(page, state.data, state.revision);
  await page.goto("/app/goals/algebra/progress");
  await expect(page.getByRole("region", { name: "Actions on the timeline" })).toBeVisible();
  await expect(page.locator(".goal-heading-result")).toContainText("3 / 6");
  await expect(page.getByTestId("forecast-line")).toHaveCount(0);
  await expect(page.locator(".app-main")).not.toContainText("8/10");
  await coachReply(page, [{ entity: "result", operation: "create", id: null, parentId: "algebra", values: JSON.stringify({ value: 4, date: localDate(), source: "Practice set B" }) }]);
  await page.getByRole("link", { name: "Review progress with Adler" }).click();
  await page.getByLabel("Message Adler").fill("I scored 4 out of 10 on comparable Practice set B today.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator(".coach-thread")).toContainText("Your update is saved.");
  await page.goto("/app/goals/algebra/progress");
  expect((await snapshot(page)).data.goals[0].results.at(-1)?.value).toBe(4);
  await expect(page.getByTestId("forecast-line")).toHaveCount(0);
  await page
    .getByText("View checkpoints and evidence", { exact: true })
    .click();
  await expect(page.getByRole("table")).toContainText("Practice set B");
});

test("weekly review uses shared chat and archives the reported reflection", async ({ page }) => {
  await register(page, true);
  await coachReply(page, [{ entity: "review", operation: "update", id: null, parentId: null, values: JSON.stringify({ note: "Drafting worked best before email.", decision: "Keep", complete: true }) }]);
  await page.goto("/app/reviews/current");
  await expect(page).toHaveURL(/\/app\/check-in\?intent=review/);
  await page.getByLabel("Message Adler").fill("I’ve reviewed my week. Drafting worked best before email. Keep my plans.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator(".coach-thread")).toContainText("Your update is saved.");
  expect((await snapshot(page)).data.reviews.at(-1)?.note).toBe("Drafting worked best before email.");
});

test("a second signed-in tab receives confirmed changes and stale saves are rejected", async ({
  page,
  context,
}) => {
  await register(page, true);
  await page.goto("/app/goals");
  const other = await context.newPage();
  await other.goto("/app/goals");
  const before = await snapshot(page);
  const proposal = await (
    await page.request.post("/api/proposals", {
      data: {
        summary: "Rename the goal",
        changes: [
          {
            entity: "goal",
            operation: "update",
            id: "essays",
            parentId: null,
            values: JSON.stringify({ title: "Publish two design essays" }),
          },
        ],
      },
    })
  ).json();
  await page.request.post(`/api/proposals/${proposal.id}/approve`, {
    data: {},
  });
  await expect(other.locator(".goal-table-row")).toContainText(
    "Publish two design essays",
  );
  await expect(page.locator(".goal-table-row")).toContainText(
    "Publish two design essays",
  );
  const stale = await page.request.post("/api/workspace", {
    data: { ...before, requestId: crypto.randomUUID() },
  });
  expect(stale.status()).toBe(409);
  await other.close();
});

test("progress and preferences remain usable on mobile with no serious accessibility violations", async ({
  page,
}) => {
  await register(page, true);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "/",
    "/app/today",
    "/app/goals/essays/progress",
    "/app/check-in",
    "/app/settings/coaching",
    "/app/reviews/current",
    "/app/settings/provider",
    "/app/connections",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    const result = await new AxeBuilder({ page }).analyze();
    expect(
      result.violations.filter((v) =>
        ["critical", "serious"].includes(v.impact ?? ""),
      ),
      route,
    ).toEqual([]);
  }
});

test("clearing workspace data starts blank and keeps exported records available", async ({
  page,
}) => {
  await register(page, true);
  await page.goto("/app/settings");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export data" }).click();
  expect((await downloadPromise).suggestedFilename()).toMatch(
    /adler-workspace/,
  );
  await page.getByRole("button", { name: "Delete data", exact: true }).click();
  await page.getByRole("button", { name: "Delete and reset" }).click();
  await synced(page);
  expect((await snapshot(page)).data.goals).toHaveLength(0);
  await page.reload();
  expect((await snapshot(page)).data.actions).toHaveLength(0);
});

test("records from another authenticated user remain private", async ({
  page,
  browser,
}) => {
  await register(page, true);
  const separate = await browser.newContext({
    baseURL: "http://127.0.0.1:5199",
  });
  const other = await separate.newPage();
  await register(other);
  await other.goto("/app/goals");
  expect((await snapshot(other)).data.goals).toHaveLength(0);
  expect((await snapshot(page)).data.goals).toHaveLength(1);
  await separate.close();
});
