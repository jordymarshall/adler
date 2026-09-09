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
  const recordedCapture = page.locator('.story-phone-frame[data-preview="progress"]');
  const recorded = (await recordedCapture.textContent())!;
  await page.locator("summary").filter({ hasText: "See the check-in become a calendar booking" }).click();
  const step = page.locator(".journey-connections");
  await step.getByRole("button", { name: "Try the example text check-in" }).click();
  await expect(step.getByRole("log")).toContainText("Keep home-day reading");
  await expect(step.getByRole("log")).toContainText("review whether the window helped after your next few reports");
  await expect(recordedCapture).toHaveText(recorded);
  await step.getByRole("button", { name: "Reset example text check-in" }).click();
  await expect(step.getByRole("log")).not.toContainText("Yes, book 12:30.");
  await expect(recordedCapture).toHaveText(recorded);
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
  await expect(page.locator(".phone-story")).toHaveCSS("transition-duration", "0s");
  for (const control of await page.locator(".phone-story-dots button").all()) {
    await control.click();
    await expect(control).toHaveAttribute("aria-current", "step");
    const result = await new AxeBuilder({ page }).include(".phone-story").analyze();
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
