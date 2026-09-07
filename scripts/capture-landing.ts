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
page.on('pageerror', error => errors.push(error.message));
await page.clock.setFixedTime(new Date(captureDate));
const screens = [
  { name: 'goals', route: '/app/goals', ready: '.goal-chart-row' },
  { name: 'calendar', route: '/app/calendar', ready: '.week-calendar' },
  { name: 'progress', route: '/app/goals/demo-portfolio', ready: '.weekly-actions' },
  { name: 'insights', route: '/app/insights', ready: '.insight-row' },
];
const points: Record<string, Record<string, { x: number; y: number }>> = {};
async function capture(name: string) {
  const screenshot = await page.screenshot();
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
  await page.setViewportSize(size);
  for (const screen of screens) {
    await page.goto(new URL(screen.route, baseURL).href);
    await page.locator(screen.ready).first().waitFor();
    // Present the real content area without the app's surrounding navigation.
    await page.addStyleTag({ content: '.app-sidebar, .app-topbar, .mobile-nav { display: none !important; } .app-body { margin-left: 0 !important; }' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    await expect(page.locator('.save-error, [role="alert"]')).toHaveCount(0);
    const focus = screen.name === 'goals' ? '.goal-groups' : screen.name === 'progress' ? '.weekly-actions' : null;
    if (focus) await page.locator(focus).first().evaluate(element => {
      window.scrollTo({ top: element.getBoundingClientRect().top + scrollY - 16, behavior: 'instant' });
    });
    await capture(`${screen.name}-${size.name}`);
    const target = screen.name === 'calendar' ? page.getByRole('button', { name: 'Next week', exact: true })
      : screen.name === 'insights' ? page.locator('.insight-sources summary').first()
      : page.locator('.execution-week').filter({ hasText: 'Oct 5' }).first();
    const box = (await target.boundingBox())!;
    if (box.y < 0 || box.y + box.height > size.height) throw new Error(`Interaction outside capture: ${screen.name}`);
    (points[screen.name] ??= {})[size.name] = { x: Number(((box.x + box.width / 2) / size.width * 100).toFixed(2)), y: Number(((box.y + box.height / 2) / size.height * 100).toFixed(2)) };
    await target.click();
    await page.waitForTimeout(150);
    await capture(`${screen.name}-${size.name}-detail`);
    console.log(`Captured ${screen.name} and its interaction at ${size.width}×${size.height}`);
  }
}
await browser.close();
if (errors.length) throw new Error(errors.join('\n'));
await writeFile('src/landing-capture-points.json', JSON.stringify(points, null, 2) + '\n');
