import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { captureDate, landingProposals, landingWorkspace } from './landing-workspace.ts';

const baseURL = process.env.LANDING_CAPTURE_URL ?? 'http://127.0.0.1:5173';
const directory = 'public/media/app';
await mkdir(directory, { recursive: true });
await mkdir('.context/app-captures', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({ deviceScaleFactor: 2, locale: 'en-US', timezoneId: 'America/Toronto', reducedMotion: 'reduce' });
// The example is a fixed snapshot, so its event stream stays idle.
await context.addInitScript({ content: `
  window.EventSource = class extends EventTarget {
    constructor() {
      super();
      queueMicrotask(() => this.onopen?.(new Event('open')));
    }
    close() {}
  };
` });
const data = landingWorkspace();
const firstPlanData = landingWorkspace('first-plan');
const responses: Record<string, unknown> = {
  auth: { user: { id: 'example', username: 'Example workspace' }, data, revision: 1 },
  workspace: { data, revision: 1 },
  status: { coach: { configured: true, model: 'example' }, google: { configured: false, connected: false }, apple: { connected: false }, calendars: { google: [], apple: [] } },
  calendars: { google: [], apple: [] },
  proposals: landingProposals,
  'planning/status': [],
};
const errors: string[] = [];
await context.route('**/api/**', route => {
  const path = new URL(route.request().url()).pathname.slice('/api/'.length);
  if (!(path in responses) || route.request().method() !== 'GET') {
    errors.push(`Unexpected API request: ${route.request().method()} ${path}`);
    return route.abort();
  }
  return route.fulfill({ json: responses[path] });
});
const page = await context.newPage();
page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
await page.clock.setFixedTime(new Date(captureDate));
const screens = [
  { name: 'goals', route: '/app/goals', ready: '.goal-table-row' },
  { name: 'plan', route: '/app/goals/reading', ready: '#goal-plan' },
  { name: 'checkin', route: '/app/check-in', ready: '.live-message.coach' },
  { name: 'calendar', route: '/app/calendar', ready: '.week-calendar' },
  { name: 'progress', route: '/app/goals/reading', ready: '.goal-projection' },
  { name: 'insights', route: '/app/insights', ready: '.learning-record' },
];
const points: Record<string, Record<string, { x: number; y: number }>> = {};
async function capture(name: string, selector?: string) {
  const screenshot = selector ? await page.locator(selector).screenshot() : await page.screenshot();
  await writeFile(`.context/app-captures/${name}.png`, screenshot);
  const webp = await page.evaluate(async encoded => {
    const image = new Image();
    image.src = `data:image/png;base64,${encoded}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.getContext('2d')!.drawImage(image, 0, 0);
    return canvas.toDataURL('image/webp', .9).split(',')[1];
  }, screenshot.toString('base64'));
  await writeFile(`${directory}/${name}.webp`, Buffer.from(webp, 'base64'));
}
for (const size of [{ name: 'desktop', width: 1000, height: 900 }, { name: 'mobile', width: 390, height: 1050 }]) {
  for (const screen of screens) {
    const viewport = { ...size, width: size.name === 'desktop' && ['progress', 'insights', 'plan', 'checkin'].includes(screen.name) ? 840 : size.width };
    const snapshot = screen.name === 'plan' ? firstPlanData : data;
    responses.auth = { user: { id: 'example', username: 'Example workspace' }, data: snapshot, revision: 1 };
    responses.workspace = { data: snapshot, revision: 1 };
    await page.clock.setFixedTime(new Date(screen.name === 'plan' ? '2026-10-12T10:00:00-04:00' : captureDate));
    await page.setViewportSize(viewport);
    await page.goto(new URL(screen.route, baseURL).href);
    await page.locator(screen.ready).first().waitFor({ timeout: 10000 }).catch(async error => { console.error((await page.locator("body").innerText()).slice(0, 2000)); await page.screenshot({ path: ".context/capture-error.png" }); await browser.close(); throw error; });
    // Present the real content area without the app's surrounding navigation.
    await page.addStyleTag({ content: '.app-sidebar, .app-topbar, .mobile-nav { display: none !important; } .app-body { margin-left: 0 !important; }' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    await expect(page.locator('.save-error, [role="alert"]')).toHaveCount(0);
    const focus = screen.name === 'plan' ? '#goal-plan' : screen.name === 'checkin' ? '.coach-thread' : screen.name === 'progress' ? '.projection-heading' : screen.name === 'calendar' ? '.full-calendar' : screen.name === 'insights' ? '.learning-dashboard' : null;
    if (focus) await page.locator(focus).first().evaluate(element => {
      window.scrollTo({ top: element.getBoundingClientRect().top + scrollY - 16, behavior: 'instant' });
    });
    await capture(`${screen.name}-${size.name}`);
    const target = screen.name === 'plan' ? page.locator('.plan-approach > summary') : screen.name === 'checkin' ? page.locator('.live-message.coach').getByRole('link', { name: 'Insights', exact: true }) : screen.name === 'calendar' ? page.locator('.month-entry button').filter({ hasText: 'Read 20 pages' }).first()
      : screen.name === 'insights' ? page.locator('.learning-record > summary').first()
      : screen.name === 'progress' ? page.locator('.projection-evidence > summary')
      : page.getByRole('link', { name: 'Read 30 books' });
    const box = (await target.boundingBox())!;
    if (box.y < 0 || box.y + box.height > size.height) throw new Error(`Interaction outside capture: ${screen.name}`);
    (points[screen.name] ??= {})[size.name] = { x: Number(((box.x + box.width / 2) / viewport.width * 100).toFixed(2)), y: Number(((box.y + box.height / 2) / size.height * 100).toFixed(2)) };
    await target.click();
    if (screen.name === 'goals') {
      await page.locator('.goal-projection').waitFor();
      await page.addStyleTag({ content: '.app-sidebar, .app-topbar, .mobile-nav { display: none !important; } .app-body { margin-left: 0 !important; }' });
      await page.locator('.goal-projection').evaluate(element => window.scrollTo({ top: element.getBoundingClientRect().top + scrollY - 16, behavior: 'instant' }));
    }
    if (screen.name === 'progress') await page.locator('.projection-evidence').evaluate(element => window.scrollTo({ top: element.getBoundingClientRect().top + scrollY - 16, behavior: 'instant' }));
    if (screen.name === 'checkin') await page.locator('#record-reading-lunch').waitFor();
    if (screen.name === 'insights') await page.locator('.learning-record[open] .learning-journey').evaluate(element => window.scrollTo({ top: element.getBoundingClientRect().top + scrollY - 16, behavior: 'instant' }));
    await page.waitForTimeout(150);
    await capture(`${screen.name}-${size.name}-detail`);
    if (screen.name === 'insights') {
      await page.locator('.learning-record[open] .current-test-reasoning > summary').click();
      await page.locator('.learning-record[open] .reasoning-path').evaluate(element => window.scrollTo({ top: element.getBoundingClientRect().top + scrollY - 16, behavior: 'instant' }));
      await capture(`${screen.name}-${size.name}-followup`);
      await capture(`${screen.name}-${size.name}-reasoning`, '.learning-record[open]');
    }
    console.log(`Captured ${screen.name} and its interaction at ${viewport.width}×${viewport.height}`);
  }
}
// The hero uses the actual narrow app at a phone's proportions, without shrinking a desktop page.
await page.setViewportSize({ width: 390, height: 780 });
for (const screen of [
  { name: 'progress', route: '/app/goals/reading', ready: '.goal-projection' },
  { name: 'check-in', route: '/app/check-in', ready: '.live-message.coach' },
  { name: 'insights', route: '/app/insights', ready: '.learning-record' },
]) {
  await page.goto(new URL(screen.route, baseURL).href);
  await page.locator(screen.ready).first().waitFor();
  await page.addStyleTag({ content: '.app-sidebar, .app-topbar, .mobile-nav { display: none !important; } .app-body { margin-left: 0 !important; }' });
  await page.evaluate(() => document.fonts.ready);
  if (screen.name === 'progress') await page.locator('.goal-projection').evaluate(element => window.scrollTo({ top: element.getBoundingClientRect().top + scrollY - 24, behavior: 'instant' }));
  await capture(`hero-${screen.name}-mobile`);
}
await browser.close();
if (errors.length) throw new Error(errors.join('\n'));
await writeFile('src/landing-capture-points.json', JSON.stringify(points, null, 2) + '\n');
