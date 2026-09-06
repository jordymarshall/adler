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

test("texting and the app show the same check-in without changing measured distance", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "See the app, step by step" }).click();
  const step = page.locator("#step-4");
  await expect(
    step.getByLabel("iMessage conversation with Adler"),
  ).toBeVisible();
  await expect(step.locator(".phone-bubble.outgoing")).toContainText(
    "Work ran late",
  );
  await step.getByRole("button", { name: "Done", exact: true }).click();
  await expect(step.locator(".phone-bubble.outgoing")).toContainText(
    "still 2 km",
  );
  await expect(step.locator(".checkin-linked-result")).toContainText("Done");
  await step.getByRole("button", { name: "SMS", exact: true }).click();
  const phone = step.getByLabel("SMS conversation with Adler");
  await expect(phone).toBeVisible();
  const bounds = await phone.boundingBox();
  expect(bounds!.height / bounds!.width).toBeGreaterThan(2);
  expect(bounds!.height / bounds!.width).toBeLessThan(2.3);
  await step.getByRole("button", { name: "Use the app", exact: true }).click();
  await expect(step.locator(".app-checkin-saved")).toHaveText("Saved: Done");
  await expect(step.locator(".checkin-linked-result")).toContainText("2 km");
  await expect(step.locator(".checkin-linked-result")).toContainText("5 km");
  const scheduling = page.locator("#step-3");
  await scheduling.getByText("Choose another time", { exact: true }).click();
  await scheduling
    .getByRole("button", { name: "Tuesday, 6:30 pm", exact: true })
    .click();
  await scheduling
    .getByRole("button", { name: "Save time", exact: true })
    .click();
  await expect(scheduling).toContainText("Check in after the session");
  await expect(scheduling.locator(".suggested-time")).toContainText("6:30 pm");
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
  await expect(page.locator(".hero-sticky")).toHaveCSS("position", "relative");
  await expect(page.locator(".reveal").first()).toHaveCSS(
    "animation-name",
    "none",
  );
  await page.getByRole("button", { name: "See the app, step by step" }).click();
  for (const selector of ["#step-4", ".connected-section"]) {
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
