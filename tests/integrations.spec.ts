import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { register, snapshot, synced } from "./fixtures";

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

test("a user's check-in timing persists in their connected workspace", async ({ page }) => {
  await register(page);
  await page.goto("/app/connections");
  await expect(page.getByRole("combobox", { name: "When to check in", exact: true })).toHaveValue("after-session");
  await expect(page.getByLabel("Daily check-in time", { exact: true })).toHaveCount(0);
  await page.getByRole("combobox", { name: "When to check in", exact: true }).selectOption("end-of-day");
  await page.getByLabel("Daily check-in time", { exact: true }).fill("20:30");
  await synced(page);
  await page.reload();
  await expect(page.getByRole("combobox", { name: "When to check in", exact: true })).toHaveValue("end-of-day");
  await expect(page.getByLabel("Daily check-in time", { exact: true })).toHaveValue("20:30");
  expect((await snapshot(page)).data.automation.enabled).toBe(false);
  await page.getByRole("combobox", { name: "When to check in", exact: true }).selectOption("after-session");
  await synced(page);
  expect((await snapshot(page)).data.automation.checkInMode).toBe("after-session");
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
