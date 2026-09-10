import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { captureDate, landingProposals, landingWorkspace, portfolioSnapshot } from './landing-workspace.ts';

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
// Capture only the app views opened by the active landing page. Navigation is
// hidden for framing; the app content and saved evidence are left intact.
async function open(path: string, ready: string, date?: string) {
  const at = date ? `${date}T${date === '2026-10-12' ? '09:00' : '08:00'}:00-04:00` : captureDate;
  const snapshot = date ? portfolioSnapshot(at) : data;
  responses.auth = { user: { id: 'example', username: 'Example workspace' }, data: snapshot, revision: 1 };
  responses.workspace = { data: snapshot, revision: 1 };
  await page.clock.setFixedTime(new Date(at));
  await page.goto(new URL(path, baseURL).href);
  await page.locator(ready).first().waitFor();
  await page.addStyleTag({ content: '.app-sidebar, .app-topbar, .mobile-nav { display: none !important; } .app-body { margin-left: 0 !important; }' });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.save-error, [role="alert"]')).toHaveCount(0);
}
await page.setViewportSize({ width: 390, height: 1050 });
await open('/app/goals', '.goal-table-row', '2026-09-21');
await expect(page.locator('.goal-table-row')).toHaveCount(1);
await capture('goals-mobile', '.goal-table-scroll');
await open('/app/today?goal=demo-portfolio', '.today-do', '2026-10-08');
await capture('plan-mobile', '.today-do');
await open('/app/calendar', '.week-calendar');
await page.getByRole('button', { name: 'Week', exact: true }).click();
await capture('calendar-mobile', '.week-calendar');
await open('/app/today?goal=demo-portfolio&card=progress', '#today-progress', '2026-10-11');
await capture('hero-progress-mobile', '#today-progress');
// Give the goal's disclosure enough height to capture its whole saved record.
await page.setViewportSize({ width: 390, height: 2400 });
await open('/app/goals/demo-portfolio', '.experiment-strip', '2026-10-12');
await page.locator('.experiment-strip').getByRole('button', { name: 'Review' }).click();
await capture('portfolio-experiment-mobile', '.modal');
await page.setViewportSize({ width: 390, height: 1050 });
await open('/app/insights', '.learning-record', '2026-10-18');
{
  const record = page.locator('#record-writing-finish');
  await record.locator(':scope > summary').click();
  await expect(record.locator('.learning-stage-awaiting')).toContainText('Check in on the current test');
  await expect(record.locator('.learning-stage-review')).toHaveCount(0);
  await capture('portfolio-learning-mobile', '#record-writing-finish');
  await record.locator('.current-test-reasoning > summary').click();
  // Include the research claim and its limits in the inspectable capture.
  for (const detail of await record.locator('.current-test-reasoning details').all()) {
    await detail.evaluate(element => { (element as HTMLDetailsElement).open = true; });
  }
  await capture('portfolio-reasoning-mobile', '#record-writing-finish');
  await record.locator(':scope > summary').click();
}
await open('/integrations', '.integration-catalog');
await capture('connections-mobile', '.integration-catalog');
await browser.close();
if (errors.length) throw new Error(errors.join('\n'));
console.log('Captured All Goals, Today, progress, the goal experiment, pending learning and reasoning, calendar, and connections.');
