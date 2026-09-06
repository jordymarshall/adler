import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { register, save, snapshot, synced } from "./fixtures";
import { localDate } from "../shared/workspace";
import { createGoal } from "../shared/validation";

test("landing demonstrates goal progress and opens an empty signed-in workspace", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("Big goals.");
  const chart = page.locator("#step-5 .progress-viz svg");
  await expect(chart.locator(".chart-recorded-label")).toHaveText(
    "Recorded: 2 km",
  );
  await chart.focus();
  await page.keyboard.press("End");
  await expect(page.locator("#step-5 .chart-tooltip")).toContainText(
    "Last recorded: 2 km",
  );
  const recordedPath = await chart.locator(".chart-actual").getAttribute("d");
  await expect(chart.locator(".chart-proposed")).toHaveCount(1);
  await expect(page.locator("#step-5 [role=tab]")).toHaveCount(0);
  const review = page.locator("#step-6");
  await expect(review.locator(".plan-change")).toHaveCount(4);
  await expect(review.locator(".plan-change[open]")).toHaveCount(0);
  await expect(review.locator(".change-after").first()).toHaveText(
    "Two 15-minute sessions, then review",
  );
  await review
    .locator(".plan-change")
    .filter({ hasText: "Preparation" })
    .locator("summary")
    .click();
  await expect(review).toContainText("This is a hypothesis to check next week");
  await review.locator(".remembered-context summary").click();
  await expect(review.locator(".remembered-context")).toContainText(
    "You reported:",
  );
  await expect(review.locator(".remembered-context")).toContainText("To test:");
  await review.getByRole("button", { name: "Confirm revised plan" }).click();
  await expect(review.getByRole("status")).toContainText(
    "Review how it went on October 25",
  );
  await expect(chart.locator(".chart-actual")).toHaveAttribute(
    "d",
    recordedPath!,
  );
  await expect(page.locator("#step-5 .proposal-metrics")).toContainText(
    "2 km recorded",
  );
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
  await expect(navigation.getByRole("link")).toHaveCount(3);
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
  await expect(page.getByTestId("recorded-line")).toBeVisible();
  await expect(page.locator(".progress-viz .pace-badge")).toHaveText("Draft");
  await page.goto("/app/goals");
  await page.getByText("Find or filter a goal", { exact: true }).click();
  await expect(page.getByLabel("Search goals", { exact: true })).toBeVisible();
  await page.getByLabel("Search goals", { exact: true }).fill("does not match");
  await expect(
    page.getByRole("heading", { name: "No goals match these filters." }),
  ).toBeVisible();
});

test("action check-ins do not complete milestones and verified results update the interactive chart", async ({
  page,
}) => {
  await register(page, true);
  await page.goto("/app/today");
  await page.getByRole("button", { name: "Start action", exact: true }).click();
  await page.getByRole("button", { name: "I’m finished", exact: true }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await synced(page);
  expect(
    (await snapshot(page)).data.goals[0].milestones.filter((m) => m.done),
  ).toHaveLength(0);
  await page.goto("/app/goals/essays/progress");
  await page
    .getByRole("button", { name: "Update result", exact: true })
    .first()
    .click();
  await page
    .getByRole("checkbox", {
      name: "I confirm this result meets the criterion above.",
    })
    .check();
  await page.getByRole("button", { name: "Save result", exact: true }).click();
  await synced(page);
  expect((await snapshot(page)).data.goals[0].results.at(-1)?.value).toBe(1);
  const chart = page.locator(".progress-viz svg");
  await chart.focus();
  await page.keyboard.press("End");
  await expect(page.locator(".chart-tooltip")).toContainText(
    "Last recorded: 1",
  );
  await page.keyboard.press("Home");
  await expect(page.locator(".chart-tooltip")).toContainText("Last recorded:");
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
  await expect(page.locator(".progress-viz")).toHaveCount(1);
  await expect(page.locator(".viz-target")).toContainText("Target: 6");
  await expect(page.locator(".pace-badge")).toHaveText("On plan");
  await expect(page.locator(".app-main")).not.toContainText("8/10");
  await page.getByRole("button", { name: "Record an assessment" }).click();
  await page.getByLabel("Problems solved correctly", { exact: true }).fill("4");
  await page.getByLabel("Assessment / source").fill("Practice set B");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Save result", exact: true }).click();
  await synced(page);
  expect((await snapshot(page)).data.goals[0].results.at(-1)?.value).toBe(4);
  await expect(page.locator(".viz-numbers")).toContainText(
    "4 correct answers / 10 recorded",
  );
  await expect(page.locator(".pace-badge")).toHaveText("Ahead of plan");
  await page
    .getByText("View checkpoints and evidence", { exact: true })
    .click();
  await expect(page.getByRole("table")).toContainText("Practice set B");
});

test("weekly review is directly accessible and archives the decision", async ({
  page,
}) => {
  await register(page, true);
  await page.goto("/app/today");
  await page.getByText("Choose something else", { exact: true }).click();
  await page.getByRole("link", { name: "Review my week", exact: true }).click();
  await expect(page.locator("h1")).toHaveText("Review your week");
  await page
    .getByLabel("What helped or got in the way?")
    .fill("Drafting worked best before opening email.");
  await synced(page);
  await page.reload();
  await expect(page.getByLabel("What helped or got in the way?")).toHaveValue(
    "Drafting worked best before opening email.",
  );
  await page.getByText("Other options", { exact: true }).click();
  await page.getByRole("button", { name: "Keep my current plans" }).click();
  await synced(page);
  await expect(
    page.getByRole("heading", { name: "Your week is reviewed." }),
  ).toBeVisible();
  expect((await snapshot(page)).data.reviews).toHaveLength(1);
  await page.getByText("Review options", { exact: true }).click();
  await page.getByRole("button", { name: "Reopen this review" }).click();
  await expect(page.getByLabel("What helped or got in the way?")).toHaveValue(
    "",
  );
  await page.getByText("Other options", { exact: true }).click();
  await page.getByRole("button", { name: "Keep my current plans" }).click();
  await synced(page);
  const reviews = (await snapshot(page)).data.reviews;
  expect(reviews).toHaveLength(2);
  expect(reviews[0].note).toBe("Drafting worked best before opening email.");
  expect(reviews[1].note).toBe("");
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
  await expect(other.locator(".goal-list-row")).toContainText(
    "Publish two design essays",
  );
  await expect(page.locator(".goal-list-row")).toContainText(
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
    "/app/coach",
    "/app/coach/program",
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
