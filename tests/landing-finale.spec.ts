import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { landingBeats, landingFrames } from "../src/landing-sequence";

async function showFrame(page: Page, screen: string, phase: number) {
  const index = landingFrames.findIndex(frame => frame.beat.screen === screen && frame.phase === phase);
  expect(index).toBeGreaterThanOrEqual(0);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(({ index, count }) => {
    const journey = document.querySelector<HTMLElement>('.phone-journey')!;
    const stage = document.querySelector<HTMLElement>('.phone-story')!;
    window.scrollTo({ top: scrollY + journey.getBoundingClientRect().top + (index + .2) * (journey.offsetHeight - stage.offsetHeight) / count, behavior: 'instant' });
  }, { index, count: landingFrames.length });
  await expect(page.locator('.phone-story')).toHaveAttribute('data-frame', String(index));
  await expect(page.locator('.story-phone-frame')).toHaveAttribute('data-preview', screen);
  await expect(page.locator('.story-phone-frame')).toHaveAttribute('data-phase', String(phase));
  await expect(page.locator('.phone-story-brain > p')).toHaveText(landingFrames[index].beat.explanation);
}
async function frameIsComplete(page: Page) {
  const clipping = await page.locator('.story-preview-content').evaluateAll(elements => elements.flatMap(el => {
    const box = el.getBoundingClientRect();
    return [...el.children].filter(child => child.getBoundingClientRect().bottom > box.bottom + 1).map(child => child.className);
  }));
  expect(clipping, 'All app panels must fit without clipped content').toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}

test('the opening pairs original artwork with a short route to starting', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Follow through on the goal that keeps slipping.');
  const art = page.locator('.hero-art');
  await expect(art).toBeInViewport();
  await expect.poll(() => art.locator('img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(art.locator('img[data-active="true"]')).toHaveCount(1);
  await expect(page.locator('.mountain-finale, .landing-backdrop, .store-download, .hero-bloom, .story-connection-group')).toHaveCount(0);
  await expect(page.locator('main > section')).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThan(6000);
  await page.getByRole('link', { name: 'See an example' }).click();
  await expect(page.locator('.phone-story')).toBeInViewport({ ratio: .99 });
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(page.locator('.landing-closing h2')).toBeInViewport();
  await expect(page.locator('.landing-closing a').first()).toHaveAttribute('href', '/app/goals/new');
  expect((await page.locator('.landing-closing').boundingBox())!.height).toBeLessThan(550);
});

test('the artwork unfolds and rewinds with scroll, holds still, and respects motion preferences', async ({ page }) => {
  await page.clock.install();
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const art = page.locator('.hero-art');
    await expect.poll(() => art.locator('img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
    const { start, travel } = await art.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return { start: Math.max(0, rect.top + scrollY - innerHeight * .25), travel: rect.height * .7 };
    });
    const pictures = new Set<string>();
    for (const frame of [0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0]) {
      await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), start + (frame + .2) * travel / 6);
      await expect(art).toHaveAttribute('data-frame', String(frame));
      const active = art.locator('img[data-active="true"]');
      await expect(active).toHaveCSS('opacity', '1');
      pictures.add((await active.getAttribute('src'))!);
      expect(await active.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
    expect(pictures.size).toBe(3);
    await page.clock.runFor(60000);
    await expect(art).toHaveAttribute('data-frame', '0');
    expect(await art.evaluate(el => el.getAnimations({ subtree: true }).length)).toBe(0);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), start + travel);
    await expect(art).toHaveAttribute('data-frame', '0');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(art).toHaveAttribute('data-frame', '5');
  }
});

test('scrolling reverses every state without timers, interaction inside the phone, or writes', async ({ page }) => {
  await page.clock.install();
  await page.setViewportSize({ width: 1440, height: 900 });
  const writes: string[] = [];
  page.on('request', request => { if (request.url().includes('/api/') && request.method() !== 'GET') writes.push(request.url()); });
  await page.goto('/');
  for (const { beat, phase } of [...landingFrames, ...[...landingFrames].reverse()]) {
    await showFrame(page, beat.screen, phase);
    await frameIsComplete(page);
  }
  const phone = page.locator('.story-phone');
  await expect(phone.locator('button, a, input, textarea, [tabindex]')).toHaveCount(0);
  const box = (await phone.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * .8);
  await page.clock.runFor(60000);
  await expect(page.locator('.phone-story')).toHaveAttribute('data-frame', '0');
  expect(await page.locator('.phone-story').evaluate(el => el.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length)).toBe(0);
  expect(writes).toEqual([]);
});

test('goal creation stays populated and daily reports preserve scheduled rest days', async ({ page }) => {
  await page.goto('/');
  await showFrame(page, 'goals', 0);
  await expect(page.locator('.story-answer')).toContainText('Three case studies live by November 15.');
  await showFrame(page, 'goals', 1);
  const phone = page.locator('.story-phone');
  await expect(phone.locator('.story-milestone')).toHaveCount(3);
  await expect(phone).toContainText('25 min at 8:30 · Tue & Thu');
  await expect(phone.locator('.story-saved')).toHaveCount(0);
  await showFrame(page, 'goals', 2);
  await expect(phone).toContainText('Goal and plan created');
  await showFrame(page, 'plan', 0);
  await expect(page.locator('.story-today-card')).toHaveCount(2);
  const today = page.locator('.story-day[data-day="3"]');
  await expect(today).toHaveAttribute('data-status', 'empty');
  await showFrame(page, 'plan', 1);
  await expect(today).toHaveAttribute('data-status', 'partial');
  await expect(today).toHaveCSS('background-color', 'rgb(234, 203, 103)');
  await showFrame(page, 'plan', 2);
  await expect(today).toHaveAttribute('data-status', 'done');
  await expect(today).toHaveCSS('background-color', 'rgb(73, 113, 66)');
  await expect(page.locator('.story-day.is-rest')).toHaveCount(2);
  await expect(page.locator('.story-day.is-future')).toHaveCount(3);
  await expect(page.locator('.story-week')).toContainText('Rest days keep your streak.');
  await expect(page.locator('.story-today-card').last()).toContainText('Check in');
});

test('the projection is filled, conditional, dated and separate from work recorded', async ({ page }) => {
  await page.goto('/');
  await showFrame(page, 'progress', 0);
  const phone = page.locator('.story-phone');
  for (const text of ['AS OF OCT 11', 'Nov 5', 'If this pattern continues', 'Goal: 3 by Nov 15', '29 min/week', '87 min across 6 reports', 'The range includes no further progress.']) await expect(phone).toContainText(text);
  const range = phone.locator('.story-projection-range');
  expect(await range.evaluate(el => (el as SVGGraphicsElement).getBBox().height)).toBeGreaterThan(90);
  await expect(range).not.toHaveAttribute('fill', 'none');
  await expect(range).toHaveCSS('opacity', '1');
  await expect(phone.locator('.story-projection-line')).toHaveAttribute('stroke-dasharray', '5 5');
  expect(await phone.locator('.story-chart-area').evaluate(el => (el as SVGGraphicsElement).getBBox().height)).toBeGreaterThan(40);
});

test('the barrier leads to an agreed test, reported results and an accepted plan', async ({ page }) => {
  await page.goto('/');
  const phone = page.locator('.story-phone');
  await showFrame(page, 'barrier', 0);
  await expect(phone).toContainText('I had time to write on October 1, but spent it scrolling on my phone.');
  await showFrame(page, 'barrier', 1);
  await expect(phone).toContainText('Do you need your phone for the work, or to be reachable');
  await showFrame(page, 'barrier', 2);
  await expect(phone).toContainText('No. I can leave it in the kitchen while I write.');
  await showFrame(page, 'checkin', 0);
  await expect(phone).toContainText('Oct 13 & 15');
  await expect(phone).toContainText('Oct 19');
  await expect(phone.locator('.story-saved')).toHaveCount(0);
  const reason = page.locator('.phone-story-brain').getByRole('button', { name: 'Why this change?' });
  await reason.click();
  const dialog = page.getByRole('dialog', { name: 'Why this change?' });
  await expect(dialog).toContainText('Situation modification');
  await expect(dialog).toContainText('What we’re testing');
  await expect(dialog).not.toContainText('On October 13 and 15, my phone stayed');
  await page.keyboard.press('Escape');
  await expect(reason).toBeFocused();
  await showFrame(page, 'checkin', 1);
  await expect(phone).toContainText('You agreed · Waiting for your first report');
  await showFrame(page, 'review', 0);
  await expect(phone.locator('.story-trial-results > div')).toHaveCount(2);
  await expect(phone).toContainText('Staying focused felt easier.');
  await expect(phone).toContainText('No new publication reported.');
  await showFrame(page, 'insights', 0);
  await expect(phone).toContainText('PROPOSED NEXT PLAN');
  await expect(phone.locator('.story-saved')).toHaveCount(0);
  await showFrame(page, 'insights', 1);
  await expect(phone).toContainText('YOUR UPDATED PLAN');
  await expect(phone).toContainText('You agreed · Next session Oct 20');
  await expect(phone).toContainText('Review Oct 25');
  await reason.click();
  await expect(dialog).toContainText('On October 13 and 15, my phone stayed');
  await expect(dialog).toContainText('not a proven personal rule');
  await expect(dialog.getByRole('link')).toHaveAttribute('href', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4856169/');
});

test('iMessage answers today and on track, and only books after confirmation', async ({ page }) => {
  await page.goto('/');
  const phone = page.locator('.story-phone');
  await showFrame(page, 'imessage', 0);
  await expect(phone).toContainText('What do I have to do today?');
  await expect(phone).toContainText('Two actions today:');
  await expect(phone.locator('.from-you').last()).toHaveCSS('background-color', 'rgb(0, 114, 237)');
  await expect(phone.locator('.from-adler').last()).toHaveCSS('background-color', 'rgb(233, 233, 235)');
  await showFrame(page, 'imessage', 1);
  await expect(phone).toContainText('1 of 3 case studies published');
  await expect(phone).toContainText('I need a new publication report');
  await expect(phone).not.toContainText('Nov 5');
  await showFrame(page, 'imessage', 2);
  await expect(phone).toContainText('Book it in Google Calendar?');
  await expect(phone.locator('.story-booking')).toHaveCount(0);
  await showFrame(page, 'imessage', 3);
  await expect(phone).toContainText('Yes, book it.');
  await expect(phone.locator('.story-booking')).toContainText('8:30–8:55');
  expect(await phone.locator('.story-message-thread').evaluate(el => el.lastElementChild!.getBoundingClientRect().bottom <= el.getBoundingClientRect().bottom + 1)).toBe(true);
  await showFrame(page, 'imessage', 2);
  await expect(phone.locator('.story-booking')).toHaveCount(0);
});

test('every state fits, with a centered desktop phone and native-size mobile text', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/');
  for (const [width, height] of [[1440,900], [1440,800], [768,1024], [390,844], [375,667]]) {
    await page.setViewportSize({ width, height });
    for (const { beat, phase } of landingFrames) {
      await showFrame(page, beat.screen, phase);
      await frameIsComplete(page);
      const box = (await page.locator('.story-phone').boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(height + 1);
      if (width > 1000) {
        expect(box.width / box.height).toBeCloseTo(390 / 844, 3);
        expect(Math.abs(box.x + box.width / 2 - width / 2)).toBeLessThan(1);
      }
      if (width <= 650) {
        await expect(page.locator('.story-phone-device')).toHaveCSS('transform', 'none');
        expect(parseFloat(await page.locator('.story-preview-content').evaluate(el => getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
        const caption = (await page.locator('.phone-story-brain').boundingBox())!;
        expect(caption.y).toBeGreaterThan(box.y + box.height);
        expect(caption.y + caption.height).toBeLessThanOrEqual(height + 1);
      }
    }
  }
});

test('short portrait and landscape screens show the complete story in readable page flow', async ({ page }) => {
  for (const [width, height] of [[320,568], [844,390]]) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(page.locator('.phone-story-linear > article')).toHaveCount(8);
    await frameIsComplete(page);
    for (const panel of await page.locator('.phone-story-linear .story-phone-device').all()) await expect(panel).toHaveCSS('transform', 'none');
    for (const content of await page.locator('.story-preview-content').all()) expect(parseFloat(await content.evaluate(el => getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
    await expect(page.locator('.story-view-goals')).toContainText('Goal and plan created');
    await expect(page.locator('.story-view-imessage')).toContainText('Yes, book it.');
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
});

test('reduced motion and the research dialog support keyboard use and accessible reading', async ({ page }) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await showFrame(page, 'checkin', 0);
  const reason = page.locator('.phone-story-brain').getByRole('button', { name: 'Why this change?' });
  await reason.click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(reason).toBeFocused();
  for (const beat of landingBeats) {
    await showFrame(page, beat.screen, 0);
    await page.clock.runFor(16000);
    await expect(page.locator('.story-phone-frame')).toHaveAttribute('data-phase', '0');
    expect((await new AxeBuilder({ page }).include('.phone-story').analyze()).violations).toEqual([]);
  }
  await page.locator('.phone-story').focus();
  await page.keyboard.press('Home');
  await expect(page.locator('.phone-story')).toHaveAttribute('data-frame', '0');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.phone-story')).toHaveAttribute('data-frame', '1');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.phone-story')).toHaveAttribute('data-frame', '0');
  await page.keyboard.press('End');
  await expect(page.locator('.phone-story')).toHaveAttribute('data-frame', String(landingFrames.length - 1));
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(page.locator('.landing-closing h2')).toBeInViewport();
});
