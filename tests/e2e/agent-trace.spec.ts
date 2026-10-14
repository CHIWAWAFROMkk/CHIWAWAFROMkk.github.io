import { test, expect } from '@playwright/test';
import { skipIntro, motionOff, noHorizontalOverflow } from './helpers';

const done = (page: import('@playwright/test').Page) => page.locator('[data-trace] .trace__node.is-done').count();

test.beforeEach(async ({ page }) => { await skipIntro(page); });

test('full: the pulse travels and the steps tick in turn', async ({ page }) => {
  await page.goto('/');
  const pulse = page.locator('[data-trace] .trace__pulse');
  const x0 = await pulse.getAttribute('cx');
  await expect.poll(() => pulse.getAttribute('cx'), { timeout: 3000 }).not.toBe(x0);
  const seen = new Set<number>();
  for (let i = 0; i < 12; i++) { seen.add(await done(page)); await page.waitForTimeout(400); }
  expect(seen.size).toBeGreaterThan(2);
});

test('gentle: no travelling dot, but the steps still light up', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(await page.locator('[data-trace] .trace__pulse').evaluate(el => getComputedStyle(el).opacity)).toBe('0');
  const a = await done(page);
  await expect.poll(() => done(page), { timeout: 8000 }).not.toBe(a);
});

test('off: a still diagram', async ({ page }) => {
  await motionOff(page);
  await page.goto('/');
  await expect(page.locator('[data-trace]')).toHaveClass(/is-static/);
  const a = await done(page);
  await page.waitForTimeout(1500);
  expect(await done(page)).toBe(a);
});

test('the trace never pushes the identity out of the first screen, and never overflows', async ({ page }) => {
  await page.goto('/');
  const vh = page.viewportSize()!.height;
  for (const sel of ['.home__name', '.home__line', '.home__avail']) {
    const box = await page.locator(sel).boundingBox();
    expect(box!.y + box!.height, sel).toBeLessThanOrEqual(vh);
  }
  expect(await noHorizontalOverflow(page)).toBe(true);
});

test('the trace script stays under 12 KB gzip', async () => {
  const { readdirSync, readFileSync } = await import('node:fs');
  const { gzipSync } = await import('node:zlib');
  const files = readdirSync('dist/_astro').filter(f => f.endsWith('.js')).map(f => readFileSync(`dist/_astro/${f}`)).filter(b => b.includes('trace__pulse'));
  expect(files.length).toBeGreaterThan(0);
  for (const b of files) expect(gzipSync(b).length).toBeLessThan(12 * 1024);
});
