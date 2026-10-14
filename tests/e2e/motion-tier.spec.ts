import { test, expect } from '@playwright/test';
import { SITE } from '../../src/data/site';
import { skipIntro, motionChoice } from './helpers';

const tier = (page: import('@playwright/test').Page) => page.evaluate(() => document.documentElement.dataset.motion);

test.beforeEach(async ({ page }) => { await skipIntro(page); });

test('full by default', async ({ page }) => {
  await page.goto('/projects/');
  expect(await tier(page)).toBe('full');
});

test('system reduced motion: gentle, and rows still fade in without travelling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 700 });
  await page.goto('/projects/');
  expect(await tier(page)).toBe('gentle');
  const last = page.locator('a.prow').last();
  await expect(last).toHaveClass(/reveal/);
  expect(await last.evaluate(el => getComputedStyle(el).transform)).toBe('none');
  await last.scrollIntoViewIfNeeded();
  await expect(last).toHaveClass(/is-in/);
  await expect.poll(() => last.evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
});

test('motion off: nothing is armed and nothing transitions', async ({ page }) => {
  await motionChoice(page, 'off');
  await page.goto('/projects/');
  expect(await tier(page)).toBe('off');
  await expect(page.locator('a.prow.reveal')).toHaveCount(0);
  expect(await page.locator('a.prow').first().evaluate(el => getComputedStyle(el).transitionDuration.split(',').every(d => parseFloat(d) <= 0.001))).toBe(true);
});

test('the footer switch remembers the choice', async ({ page }) => {
  await page.goto('/brief/');
  const sw = page.locator('footer.footer [data-motion-switch]');
  await expect(sw.locator('button[aria-pressed="true"]')).toHaveCount(0);   // automatic until the visitor picks one
  await sw.getByRole('button', { name: SITE.motion.off.zh }).click();
  await page.waitForLoadState('load');
  expect(await tier(page)).toBe('off');
  await expect(page.locator('footer.footer [data-motion-switch] button[aria-pressed="true"]')).toHaveText(SITE.motion.off.zh);
  await page.reload();
  expect(await tier(page)).toBe('off');
});

test('storage blocked: tier boots and the switch still works', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/brief/');
  expect(await tier(page)).toBe('full');
  await page.locator('footer.footer [data-motion-switch]').getByRole('button', { name: SITE.motion.gentle.zh }).click();
  await page.waitForLoadState('load');
  expect(errors).toEqual([]);
});
