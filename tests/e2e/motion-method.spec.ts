import { test, expect } from '@playwright/test';

const METHOD = '/projects/stock-data/method/';

test('the five steps become a timeline that draws and lights as you scroll', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.goto(METHOD);
  const ol = page.locator('article.prose ol.timeline');
  await expect(ol).toHaveCount(1);
  await expect(ol.locator('li')).toHaveCount(5);
  await page.evaluate(() => window.scrollTo(0, 0));
  expect(await ol.locator('li.is-lit').count()).toBeLessThan(5);
  await ol.evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - innerHeight * 0.3));
  await expect.poll(() => ol.evaluate(el => Number(getComputedStyle(el).getPropertyValue('--p')))).toBeGreaterThan(0);
  await expect.poll(() => ol.locator('li.is-lit').count()).toBeGreaterThan(0);
  await ol.evaluate(el => window.scrollTo(0, el.getBoundingClientRect().bottom + window.scrollY));
  await expect(ol.locator('li.is-lit')).toHaveCount(5);
});

test('reduced motion: the timeline is fully drawn and lit', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(METHOD);
  await expect(page.locator('article.prose ol.timeline li.is-lit')).toHaveCount(5);
});

test('the verification numbers count up and land on the documented values', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.goto(METHOD);
  const cell = page.locator('article.prose table').first().locator('tbody tr').first().locator('td').nth(1);
  const final = '13 行 / 2 个空白 / 1 行重复';
  await cell.scrollIntoViewIfNeeded();
  await expect(cell).toHaveText(final, { timeout: 3000 });
});
