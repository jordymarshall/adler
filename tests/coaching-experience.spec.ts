import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { register } from "./fixtures";

test("authentication preserves the intended goal and Check-in draft", async ({
  page,
}) => {
  const prompt = "Help me make time to read the books I chose.";
  await page.goto(
    `/app/check-in?intent=new-goal&prompt=${encodeURIComponent(prompt)}`,
  );
  await expect(
    page.getByRole("heading", { name: "Start with a goal of your own." }),
  ).toBeVisible();
  await page
    .getByLabel("Username", { exact: true })
    .fill(`first-${Date.now()}`);
  await page
    .getByLabel("Password", { exact: true })
    .fill("a-fictional-test-password");
  await page
    .getByRole("button", { name: "Create my workspace", exact: true })
    .click();
  await expect(page).toHaveURL(/\/app\/check-in\?intent=new-goal/);
  await expect(page.getByLabel("Message Adler")).toHaveValue(prompt);
  await page.goto("/app/settings/provider");
  await page.goto("/app/check-in");
  await expect(page.getByLabel("Message Adler")).toHaveValue(prompt);
});

test("Today leads with the action, with the full goal view one step away", async ({
  page,
}) => {
  await register(page, true);
  await page.goto("/app/today");
  const next = page.locator(".next-step-card");
  await expect(next).toContainText("Draft five main points");
  expect((await next.boundingBox())!.y).toBeLessThan(350);
  await expect(page.locator(".goal-projection")).toHaveCount(0);
  await page.getByRole("link", { name: "Plan & progress" }).click();
  await expect(
    page.getByRole("navigation", { name: "Milestones" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app/today");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
