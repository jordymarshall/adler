import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const key = "adler-preview-v1";

test("landing opens the usable app, with direct links and browser navigation", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /Know if you’re making progress/,
  );
  await page
    .getByRole("link", { name: "Explore the app", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/app\/today/);
  await expect(
    page.getByRole("button", { name: "Record what happened" }),
  ).toHaveCount(2);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Your next actions, today." }),
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
});

test("landing demonstrates the six ordered screens without changing app records", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".walk-step")).toHaveCount(6);
  await expect(page.locator("#step-1")).toContainText(
    "Publish 3 portfolio case studies by October 31",
  );
  await page
    .locator("#step-3")
    .getByRole("button", { name: "3:00 pm" })
    .click();
  await expect(page.locator("#step-3")).toContainText("Selected: 3:00 pm");
  await page
    .locator("#step-4")
    .getByRole("button", { name: "Done", exact: true })
    .click();
  await expect(page.locator("#step-4")).toContainText(
    "Published result: 1 of 3",
  );
  await expect(page.locator("#step-5")).toContainText("Behind plan");
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBeNull();
});

test("closing an unanswered update leaves it unknown; Partly saves before optional context", async ({
  page,
}) => {
  await page.goto("/app/today");
  await page
    .getByRole("button", { name: "Record what happened" })
    .first()
    .click();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await expect(
    page.getByRole("button", { name: "Record what happened" }),
  ).toHaveCount(2);
  await page
    .getByRole("button", { name: "Record what happened" })
    .first()
    .click();
  await page.getByRole("button", { name: "Partly", exact: true }).click();
  await expect(page.getByText("Partly is already saved")).toBeVisible();
  await page.getByRole("button", { name: "Skip", exact: true }).click();
  await page.reload();
  await page.locator(".completed-section summary").click();
  await expect(page.locator(".completed-section")).toContainText("Partly");
  await expect(page.locator(".snapshot-goal").first()).toContainText(
    "1 of 3 case studies published",
  );
});

test("finishing a drafting action does not publish a case study", async ({
  page,
}) => {
  await page.goto("/app/today");
  await page
    .getByRole("button", { name: "Record what happened" })
    .first()
    .click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.goto("/app/goals/portfolio/progress");
  await expect(page.locator(".outcome-panel h2")).toHaveText("1 of 3");
  await expect(page.locator(".action-history-item").first()).toContainText(
    "Done",
  );
});

test("confirmed results update the goal and shared overview once", async ({
  page,
}) => {
  await page.goto("/app/goals/portfolio/progress");
  await page.getByRole("button", { name: "Update result" }).first().click();
  await expect(
    page.getByRole("button", { name: "Save result" }),
  ).toBeDisabled();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Save result" }).click();
  await expect(page.locator(".outcome-panel h2")).toHaveText("2 of 3");
  await page.reload();
  await expect(page.locator(".outcome-panel h2")).toHaveText("2 of 3");
  await page.goto("/app/goals");
  await expect(page.locator(".organized-card").first()).toContainText(
    "2 recorded",
  );
});

test("goal drafts survive refresh and create an unscheduled action after approval", async ({
  page,
}) => {
  await page.goto("/app/goals/new");
  await page
    .getByLabel("What would you like to work toward?")
    .fill("Launch my illustration portfolio");
  await page.reload();
  await expect(
    page.getByLabel("What would you like to work toward?"),
  ).toHaveValue("Launch my illustration portfolio");
  await page
    .getByLabel("What would a good result look like?")
    .fill("Five illustrations live on my website");
  await page
    .getByLabel("Your next milestone")
    .fill("First illustration ready to share");
  await page
    .getByLabel("One useful next action")
    .fill("Sketch three thumbnail ideas");
  await page
    .getByLabel("This action is finished when")
    .fill("Three rough thumbnails are on the page");
  await page.getByRole("button", { name: "Review my plan" }).click();
  await expect(page.locator(".plan-summary")).toContainText("Unscheduled");
  await page.getByRole("button", { name: "Use this plan" }).click();
  await expect(page.locator(".secondary-actions")).toContainText(
    "Sketch three thumbnail ideas",
  );
  await expect(page.locator(".today-main > .action-card")).toHaveCount(2);
});

test("accepted proposals change future plans once while preserving past action snapshots", async ({
  page,
}) => {
  await page.goto("/app/goals/portfolio/learning");
  await page.getByRole("button", { name: "Try this change" }).click();
  await expect(page.locator(".proposal-header")).toContainText("Trying");
  await expect(
    page.getByRole("button", { name: "Try this change" }),
  ).toHaveCount(0);
  await page.reload();
  const data = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!),
    key,
  );
  const goal = data.goals.find((g: { id: string }) => g.id === "portfolio");
  expect(goal.plans).toHaveLength(2);
  expect(goal.plans[1].action).toContain("rough bullets");
  expect(
    data.actions.find((a: { id: string }) => a.id === "portfolio-today").title,
  ).toBe("Draft the problem statement for case study two");
  expect(
    data.actions.find((a: { id: string }) => a.id === "portfolio-earlier")
      .planVersion,
  ).toBe(1);
});

test("an edit in another tab cannot be overwritten by an old plan form", async ({
  page,
  context,
}) => {
  await page.goto("/app/goals/portfolio/plan");
  await page.getByRole("button", { name: "Edit future plan" }).click();
  const second = await context.newPage();
  await second.goto("/app/goals/portfolio/plan");
  await second.getByRole("button", { name: "Edit future plan" }).click();
  await second
    .getByLabel("Next action", { exact: true })
    .fill("Write the first five rough bullets");
  await second.getByRole("button", { name: "Save plan", exact: true }).click();
  await page
    .getByLabel("Next action", { exact: true })
    .fill("An outdated action");
  await page.getByRole("button", { name: "Save plan", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "changed in another view",
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  await expect(page.locator(".current-plan")).toContainText(
    "Write the first five rough bullets",
  );
});

test("pausing suppresses active actions while retaining accurate history", async ({
  page,
}) => {
  await page.goto("/app/goals/portfolio/progress");
  await page.getByLabel("Goal options").click();
  await page.getByRole("button", { name: "Pause goal", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Pause goal", exact: true })
    .click();
  await page.goto("/app/today");
  await expect(page.locator(".today-main > .action-card")).toHaveCount(1);
  await page.goto("/app/goals/portfolio/progress");
  await expect(page.locator(".goal-title-tags")).toContainText("Paused");
  await expect(page.locator(".action-history")).toContainText(
    "I kept editing the opening",
  );
});

test("assessment entry validates the scale and keeps practice separate", async ({
  page,
}) => {
  await page.goto("/app/goals/statistics/progress");
  await page.getByRole("button", { name: "Record an assessment" }).click();
  await page.getByLabel("Problems solved correctly").fill("11");
  await page
    .getByLabel("Assessment / source")
    .fill("Comparable practice set C");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Save result" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel("Problems solved correctly").fill("7");
  await page.getByRole("button", { name: "Save result" }).click();
  await expect(page.locator(".outcome-panel h2")).toHaveText("7 / 10");
  await expect(page.locator(".action-history")).toContainText("Unknown");
});

test("confirmed context can be edited and permanently removed", async ({
  page,
}) => {
  await page.goto("/app/coach/about-you");
  await page.getByRole("button", { name: /Edit context:/ }).click();
  await page
    .getByLabel("Your confirmed context")
    .fill("I prefer focused work before lunch.");
  await page.getByRole("button", { name: "Remember this" }).click();
  await expect(page.locator(".memory-card")).toContainText("before lunch");
  await page.getByRole("button", { name: /Remove context:/ }).click();
  await page
    .getByRole("button", { name: "Remove context", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "A clean page." }),
  ).toBeVisible();
});

test("workspace export contains saved data and reset restores examples", async ({
  page,
}) => {
  await page.goto("/app/settings");
  await page.getByLabel("Weekly review day").selectOption("Friday");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export data" }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toMatch(/adler-workspace-.*\.json/);
  const stream = await download.createReadStream();
  let contents = "";
  for await (const chunk of stream!) contents += chunk;
  const exported = JSON.parse(contents);
  expect(exported.reviewDay).toBe("Friday");
  expect(exported.goals).toHaveLength(3);
  await page.getByRole("button", { name: "Delete data", exact: true }).click();
  await page.getByRole("button", { name: "Delete and reset" }).click();
  await expect(page.getByLabel("Weekly review day")).toHaveValue("Sunday");
});

for (const width of [320, 768, 1440]) {
  test(`core routes fit a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/",
      "/app/today",
      "/app/goals",
      "/app/goals/new",
      "/app/goals/portfolio/progress",
      "/app/goals/portfolio/plan",
      "/app/goals/portfolio/learning",
      "/app/coach",
      "/app/coach/about-you",
      "/app/coach/program",
      "/app/calendar",
      "/app/settings",
      "/app/reviews/weekly",
      "/method",
    ]) {
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      expect(overflow, `${path} overflows at ${width}px`).toBe(false);
    }
  });
}

test("priority pages have no serious or critical automated accessibility violations", async ({
  page,
}) => {
  for (const path of [
    "/",
    "/app/today",
    "/app/goals/new",
    "/app/goals/portfolio/progress",
    "/app/coach",
    "/app/coach/program",
    "/app/calendar",
  ]) {
    await page.goto(path);
    await page.evaluate(() =>
      Promise.all(
        document.getAnimations().map((animation) => animation.finished),
      ),
    );
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      results.violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map((v) => ({
          id: v.id,
          description: v.description,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      path,
    ).toEqual([]);
  }
});
