import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("the mountain scroll converges into the Adler mark and keeps the first step accessible", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const finale = page.locator(".mountain-finale");
  await expect(finale).toHaveAttribute("data-scene", "summit");
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
  await page.evaluate(() => { const el = document.querySelector(".mountain-finale")!; window.scrollTo(0, el.getBoundingClientRect().top + scrollY); });
  await expect(finale.locator(".mountain-summit-copy")).toHaveCSS("opacity", "1");
  await expect(finale.locator(".mountain-start-copy")).toHaveAttribute("inert", "");
  const series = finale.locator(".mountain-series");
  const start = (await series.boundingBox())!;
  await page.evaluate(() => { const el = document.querySelector(".mountain-finale")!; window.scrollTo(0, el.getBoundingClientRect().top + scrollY + (el.clientHeight - innerHeight) * .55); });
  await expect(finale).toHaveAttribute("data-scene", "converging");
  const middle = (await series.boundingBox())!;
  expect(middle.width).toBeLessThan(start.width * .6);
  expect(middle.width).toBeGreaterThan(start.width * .3);
  await page.evaluate(() => { const el = document.querySelector(".mountain-finale")!; window.scrollTo(0, el.getBoundingClientRect().top + scrollY + el.clientHeight - innerHeight); });
  await expect(finale).toHaveAttribute("data-scene", "start");
  expect((await series.boundingBox())!.width).toBeLessThan(1);
  await expect(finale.locator(".mountain-start-copy")).not.toHaveAttribute("inert", "");
  await expect(finale.getByRole("heading", { name: "Let’s give it a start." })).toBeInViewport();
  await expect(finale.getByRole("link", { name: "Take your first step" })).toHaveAttribute("href", "/app/goals/new");
  const point = (await finale.locator(".mountain-start-point").boundingBox())!;
  expect(point.width).toBeGreaterThan(30);
  expect(point.width).toBeLessThan(50);
  expect(Math.abs(point.x + point.width / 2 - 720)).toBeLessThan(1);
  expect(point.y).toBeGreaterThan(300);
  expect(point.y + point.height).toBeLessThan(600);
  await expect(page.locator(".footer-bottom .canada-note")).toHaveText("🇨🇦 Proudly built in Canada");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(finale).toHaveAttribute("data-scene", "static");
  expect((await series.boundingBox())!.width).toBeGreaterThan(390);
  await expect(finale.locator(".mountain-start-copy")).not.toHaveAttribute("inert", "");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("scrolling goes from learning to a single iMessage view and connections, with reasoning inspectable", async ({ page }) => {
  const writes: string[] = [];
  page.on("request", request => { if (request.url().includes("/api/") && request.method() !== "GET") writes.push(request.url()); });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.getByRole("button", { name: "Show your learning", exact: true }).click();
    const phone = page.locator('.story-phone');
    const bounds = (await phone.boundingBox())!;
    await page.mouse.move(width - 10, 400);
    await page.mouse.wheel(0, 1001);
    await expect(page.locator('.phone-story')).toHaveAttribute('data-screen', 'imessage');
    await expect(page.locator('.phone-story-copy h2')).toHaveText("Text Adler or chat in-app. It already knows what you’re working on.");
    await expect(page.getByRole('group', { name: 'Chat channel' })).toHaveCount(0);
    await expect(page.locator('[data-preview="chat"]')).toHaveCount(0);
    await expect(page.locator('[data-preview="checkin"] .story-message, [data-preview="insights"] .story-message')).toHaveCount(0);
    await expect(page.locator('[data-preview="imessage"] .story-booking')).toContainText('8:30–8:55 · Case study 2');
    expect((await phone.boundingBox())!.y).toBe(bounds.y);
    expect((await phone.boundingBox())!.height).toBe(bounds.height);
    await expect(page.getByRole('button', { name: /example booking|Replay example/ })).toHaveCount(0);
    await page.mouse.wheel(0, 1001);
    await expect(page.locator('.phone-story')).toHaveAttribute('data-screen', 'connections');
    await page.mouse.wheel(0, -1001);
    await expect(page.locator('.phone-story')).toHaveAttribute('data-screen', 'imessage');
    await page.getByRole("button", { name: "Show your experiment", exact: true }).click();
    const opener = page.getByRole("button", { name: "Why this suggestion?" });
    await opener.click();
    const dialog = page.getByRole("dialog", { name: "Your experiment" });
    await expect.poll(() => dialog.locator("img").evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(opener).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  expect(writes).toEqual([]);
});

test("the connections scene shows current setup separately from planned chat apps and health data", async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Show your connections', exact: true }).click();
  const available = page.locator('.story-connection-group').first();
  const planned = page.locator('.story-connections-planned');
  for (const name of ['Google Calendar', 'Apple Calendar', 'MCP']) await expect(available).toContainText(name);
  for (const name of ['ChatGPT', 'Claude', 'Gemini', 'Apple Health']) await expect(planned).toContainText(name);
  await expect(planned).toContainText('PLANNED CONNECTIONS');
  await expect(page.getByRole('link', { name: 'Explore connections', exact: true })).toHaveAttribute('href', '/integrations');
  await expect(page.locator('.phone-journey + .mountain-finale')).toHaveCount(1);
});

test("short phone viewports keep navigation and the full preview content reachable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [width, height] of [[320, 568], [375, 667]]) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const controls = page.locator('.phone-story-dots button');
    for (let index = 0; index < await controls.count(); index++) {
      await controls.nth(index).click();
      await expect(controls.nth(index)).toHaveAttribute('aria-current', 'step');
      for (const selector of ['.phone-story-top', '.phone-story-copy', '.phone-story-controls', '.phone-story-links']) {
        const bounds = (await page.locator(selector).boundingBox())!;
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      }
      const phone = (await page.locator('.story-phone').boundingBox())!;
      const copy = (await page.locator('.phone-story-copy').boundingBox())!;
      expect(copy.y + copy.height).toBeLessThan(phone.y);
      const content = page.locator('.story-phone-frame:not([inert]) .story-preview-content');
      await content.evaluate(element => { element.scrollTop = element.scrollHeight; });
      expect(await content.evaluate(element => element.lastElementChild!.getBoundingClientRect().bottom <= element.getBoundingClientRect().bottom + 1)).toBe(true);
    }
  }
});
