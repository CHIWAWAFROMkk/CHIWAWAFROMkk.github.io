import { test, expect } from '@playwright/test';
import { skipIntro } from './helpers';

const INDEX = '/projects/';

test('rows slide in as the list scrolls into view', async ({ page }) => {
  await page.goto(INDEX);
  const rows = page.locator('a.prow');
  await expect(rows.first()).toHaveClass(/reveal/);
  await expect(rows.first()).toHaveClass(/is-in/);
});

test('hovering a row shows its preview beside the pointer', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'hover only');
  await page.goto(INDEX);
  const row = page.locator('a.prow[href="/projects/campus-delivery/insights/"]');
  const preview = row.locator('.prow__preview');
  await expect(preview).toHaveAttribute('src', '/assets/previews/campus-insights.svg');
  await row.hover({ position: { x: 200, y: 20 } });
  await expect.poll(() => preview.evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
  const x = await row.evaluate(el => getComputedStyle(el).getPropertyValue('--x'));
  expect(parseFloat(x)).toBeGreaterThan(150);
});

test('keyboard focus shows the preview too', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'hover only');
  await page.goto(INDEX);
  const row = page.locator('a.prow[href="/projects/stock-data/"]');
  await row.focus();
  await expect.poll(() => row.locator('.prow__preview').evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
});

test('touch devices get no preview', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'touch only');
  await page.goto(INDEX);
  expect(await page.locator('.prow__preview').first().evaluate(el => getComputedStyle(el).display)).toBe('none');
});

test('every preview image exists', async ({ page, request }) => {
  await page.goto(INDEX);
  const srcs = await page.locator('.prow__preview').evaluateAll(els => els.map(e => e.getAttribute('src')!));
  expect(srcs.length).toBeGreaterThanOrEqual(4);
  for (const s of srcs) expect((await request.get(s)).status(), s).toBe(200);
});

test('the background word drifts with the scroll', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.goto(INDEX);
  const word = page.locator('[data-bgword]');
  const t0 = await word.evaluate(el => getComputedStyle(el).transform);
  await page.evaluate(() => window.scrollTo(0, 300));
  await expect.poll(() => word.evaluate(el => getComputedStyle(el).transform)).not.toBe(t0);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('everything is visible', async ({ page }) => {
    await skipIntro(page);
    await page.goto(INDEX);
    for (const o of await page.locator('a.prow').evaluateAll(els => els.map(e => getComputedStyle(e).opacity))) expect(o).toBe('1');
    await page.goto('/projects/campus-delivery/');
    await expect(page.locator('.prose img[src$="delivery-relations.svg"]')).toBeVisible();
    await expect(page.locator('article.prose h3').first()).toBeVisible();
  });
});

test('the overview page keeps its rows exactly as before (no index motion)', async ({ page }) => {
  await skipIntro(page);
  await page.goto('/brief/');
  await expect(page.locator('a.prow').first()).toBeVisible();
  await expect(page.locator('a.prow.reveal')).toHaveCount(0);
  await expect(page.locator('.prow__preview')).toHaveCount(0);
});

test('a row already on screen at load is shown without scrolling, even at the very bottom', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  // Put the third row inside the bottom 10% of the viewport, where the observer margin never fires.
  // The header spacing depends on the viewport height, so measure and shrink until the row sits there.
  const row = page.locator('a.prow').nth(2);
  let height = 2000;
  for (let i = 0; i < 6; i++) {
    await page.setViewportSize({ width: 1440, height });
    await page.goto(INDEX);
    const top = await row.evaluate(el => el.getBoundingClientRect().top);
    if (top > height * 0.9 && top < height - 5) break;
    height = Math.round(top + 30);
  }
  const top = await row.evaluate(el => el.getBoundingClientRect().top);
  expect(top).toBeGreaterThan(height * 0.9);
  expect(top).toBeLessThan(height);
  await expect(row).toHaveClass(/is-in/, { timeout: 2000 });
});
