import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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
  await page.goto("/#step-4");
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
  await expect(step.getByLabel("SMS conversation with Adler")).toBeVisible();
  await step.getByRole("button", { name: "Use the app", exact: true }).click();
  await expect(step.locator(".app-checkin-saved")).toHaveText("Saved: Done");
  await expect(step.locator(".checkin-linked-result")).toContainText("2 km");
  await expect(step.locator(".checkin-linked-result")).toContainText("5 km");
  await page
    .locator("#step-3")
    .getByRole("button", { name: "7:00 pm", exact: true })
    .click();
  await expect(page.locator("#step-3 .demo-calendar")).toContainText("7:25");
  await expect(
    page
      .locator("#step-3")
      .getByRole("button", { name: "7:30 pm · Busy", exact: true }),
  ).toBeDisabled();
});

test("landing media respects reduced motion and the new surfaces work on mobile", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".landing-atmosphere video")).not.toHaveAttribute(
    "src",
    /mp4/,
  );
  await expect(
    page.getByRole("button", { name: "Play background video" }),
  ).toBeVisible();
  for (const selector of ["#step-4", ".landing-integrations"]) {
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
