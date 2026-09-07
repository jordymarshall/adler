import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { register } from "./fixtures";

test("the integration catalog distinguishes plans from working setup paths", async ({
  page,
}) => {
  await page.goto("/integrations");
  await expect(page.locator("h1")).toContainText("Your tools, connected");
  await expect(page.locator(".integration-card")).toHaveCount(28);
  await page.getByLabel("Search integrations").fill("Strava");
  await expect(page.locator(".integration-card")).toHaveCount(1);
  await page.locator(".integration-card").click();
  await expect(page.getByRole("dialog")).toContainText(
    "It does not access or sync your account yet.",
  );
  await expect(
    page.getByRole("dialog").getByRole("link", { name: "Open setup" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByLabel("Search integrations").fill("");
  await page.getByRole("button", { name: "Calendars", exact: true }).click();
  await expect(page.locator(".integration-card")).toHaveCount(3);
  await page
    .locator(".integration-card")
    .filter({ hasText: "Apple Calendar" })
    .click();
  await expect(
    page.getByRole("dialog").getByRole("link", { name: "Open setup" }),
  ).toHaveAttribute("href", "/app/calendar");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .getByRole("button", { name: "Pause integration animation" })
    .click();
  await expect(page.locator(".integration-map")).toHaveClass(/paused/);
  expect(
    await page
      .locator(".integration-logo img")
      .evaluateAll((images) =>
        images.every(
          (image) =>
            (image as HTMLImageElement).complete &&
            (image as HTMLImageElement).naturalWidth > 0,
        ),
      ),
  ).toBe(true);
});

test("the example text check-in discusses a next step without rewriting recorded work", async ({ page }) => {
  await page.goto("/");
  const recordedCapture = page.locator("#step-3 .app-capture-window .capture-still img");
  const recorded = (await recordedCapture.getAttribute("src"))!;
  const step = page.locator("#step-5");
  await step.getByRole("button", { name: "Try the example text check-in" }).click();
  await expect(step.getByRole("log")).toContainText("One paragraph, then leave a note");
  await expect(step.getByRole("log")).toContainText("check how it feels after two sessions");
  await expect(recordedCapture).toHaveAttribute("src", recorded);
  await step.getByRole("button", { name: "Reset example text check-in" }).click();
  await expect(step.getByRole("log")).not.toContainText("One paragraph, then leave a note");
  await expect(recordedCapture).toHaveAttribute("src", recorded);
});

test("signed-in integrations start with the catalog and retain setup links", async ({
  page,
}) => {
  await register(page);
  await page.goto("/app/integrations");
  await expect(
    page.getByRole("heading", { name: "Integrations", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".integration-map")).toHaveCount(0);
  await expect(page.locator(".connection-setup-row")).toHaveCount(7);
  await expect(page.locator(".integration-card")).toHaveCount(0);
  const calendar = page
    .locator(".connection-setup-row")
    .filter({ hasText: "Google Calendar" });
  await expect(calendar).toContainText("Not connected");
  await calendar.getByRole("link", { name: "Set up" }).click();
  await expect(page).toHaveURL(/\/app\/calendar$/);
});

test("landing media respects reduced motion and the new surfaces work on mobile", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".journey-hero")).toHaveCSS("position", "relative");
  await expect(page.locator(".reveal").first()).toHaveCSS(
    "animation-name",
    "none",
  );
  for (const selector of ["#step-1", "#step-2", "#step-3", "#step-4", "#step-5"]) {
    await page.locator(selector).scrollIntoViewIfNeeded();
    const result = await new AxeBuilder({ page }).include(selector).analyze();
    expect(result.violations).toEqual([]);
  }
  await page.goto("/integrations");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  const result = await new AxeBuilder({ page }).include("main").analyze();
  expect(result.violations).toEqual([]);
});
