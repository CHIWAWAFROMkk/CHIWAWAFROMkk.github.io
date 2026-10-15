import { test, expect } from '@playwright/test';
import { HRIS } from '../../src/data/hris';
import { motionOff } from './helpers';

const skip = (page: import('@playwright/test').Page) => page.addInitScript(() => { try { localStorage.setItem('hyj-hris-intro-seen', '1'); } catch { /* blocked */ } });

test('ledger figures spin in as counters and land on the ledger text', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop');
  await skip(page);
  await page.setViewportSize({ width: 1440, height: 700 });
  await page.goto('/hris/');
  const nums = page.locator('[data-ledger-num]');
  await nums.first().scrollIntoViewIfNeeded();
  await expect(nums.first().locator('.odo')).toHaveCount(1, { timeout: 2000 });
  await expect(nums).toHaveText(HRIS.ledger.map(l => l.figure), { timeout: 4000 });
});

test('structure lines draw in as sections scroll in', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop');
  await skip(page);
  await page.setViewportSize({ width: 1440, height: 700 });
  await page.goto('/hris/');
  const work = page.locator('.h-work').last();
  await expect(work).toHaveClass(/m-armed/);
  await work.scrollIntoViewIfNeeded();
  await expect(work).toHaveClass(/m-in/);
});

test('theme switch: colours change smoothly from the dark default to light', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop');
  await skip(page);
  await page.goto('/hris/');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).transitionDuration)).not.toBe('0s');
  await page.locator('[data-theme-toggle]').click();
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor), { timeout: 2000 }).toBe('rgb(244, 243, 239)');
});

test('motion off: figures and lines are simply there', async ({ page }) => {
  await skip(page);
  await motionOff(page);
  await page.goto('/hris/');
  await expect(page.locator('[data-ledger-num] .odo')).toHaveCount(0);
  await expect(page.locator('.h-work.m-armed')).toHaveCount(0);
});

test('project page: every summary row is shown once scrolled past, and its line draws', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop');
  await skip(page);
  await page.setViewportSize({ width: 1440, height: 700 });
  await page.goto('/hris/projects/hris-workflow/');
  const rows = page.locator('.p-hris .p-row');
  await expect(rows.last()).toHaveClass(/m-armed/);
  for (const row of await rows.all()) await row.scrollIntoViewIfNeeded();
  await expect(rows.last()).toHaveClass(/m-in/);
  await expect.poll(() => rows.evaluateAll(els => els.filter(e => getComputedStyle(e).opacity !== '1').length), { timeout: 3000 }).toBe(0);
  expect(await rows.last().evaluate(el => getComputedStyle(el, '::after').transform)).not.toBe('matrix(0, 0, 0, 1, 0, 0)');
});
