import { test, expect } from '@playwright/test';
import { SITE } from '../../src/data/site';
import { skipIntro, noHorizontalOverflow } from './helpers';

test.beforeEach(async ({ page }) => { await skipIntro(page); });

test('wide screens: one node per overview section, the current one marked', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop rail');
  await page.goto('/brief/');
  const rail = page.getByRole('navigation', { name: SITE.rail.label.zh });
  await expect(rail.locator('a')).toHaveCount(4);
  // Put the education section's top just above the 40 % reading line (the section is short, so the next one stays below it).
  await page.locator('section[aria-labelledby="b-edu"]').evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - innerHeight * 0.4 + 10));
  await expect(rail.locator('a[aria-current="location"]')).toHaveText(SITE.brief.education.zh);
  await rail.locator('a').nth(2).click();
  await expect(rail.locator('a').nth(2)).toHaveAttribute('aria-current', 'location');
});

test('narrow screens: a progress bar instead, no overflow', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone');
  await page.goto('/brief/');
  await expect(page.locator('[data-rail-nav]')).toBeHidden();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => page.locator('[data-rail-bar]').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a)).toBeGreaterThan(0.9);
  expect(await noHorizontalOverflow(page)).toBe(true);
});

test('project pages list the summary and the prose headings', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop rail');
  await page.goto('/projects/ai-career/');
  const n = await page.locator('article.prose h2').count();
  await expect(page.locator('[data-rail-nav] a')).toHaveCount(n + 1);
});

test('the rail steps aside over the film zone, where the cinema uses the screen edges', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop rail');
  await page.goto('/brief/');
  const nav = page.locator('[data-rail-nav]');
  await expect(nav).not.toHaveClass(/is-over-night/);
  await page.locator('.b-film').evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY));
  await expect(nav).toHaveClass(/is-over-night/);
  expect(await nav.evaluate(el => getComputedStyle(el).pointerEvents)).toBe('none');
});

test('over the film zone a focused rail node still shows itself', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop rail');
  await page.goto('/brief/');
  await page.locator('.b-film').evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY));
  const nav = page.locator('[data-rail-nav]');
  await expect(nav).toHaveClass(/is-over-night/);
  await nav.locator('a').first().focus();
  await expect.poll(() => nav.evaluate(el => getComputedStyle(el).opacity)).toBe('1');
});
