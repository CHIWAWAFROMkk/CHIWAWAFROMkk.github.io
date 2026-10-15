import { test, expect } from '@playwright/test';
import { HRIS } from '../../src/data/hris';
import { motionOff } from './helpers';

const skip = (page: import('@playwright/test').Page) => page.addInitScript(() => { try { localStorage.setItem('hyj-hris-intro-seen', '1'); } catch { /* blocked */ } });
const inked = (page: import('@playwright/test').Page) => page.locator('[data-topology] canvas').evaluate((c: HTMLCanvasElement) => {
  const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
  let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n;
});

test('full: the canvas draws, and the switch moves between before and governed', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop');
  await skip(page);
  await page.goto('/hris/');
  await expect.poll(() => inked(page), { timeout: 3000 }).toBeGreaterThan(1500);
  const btn = page.locator('[data-topology] button');
  await expect(btn).toHaveText(HRIS.topology.toRaw.zh);
  await btn.click();
  await expect(btn).toHaveText(HRIS.topology.toGoverned.zh);
  await expect(page.locator('[data-topology] [data-topology-state]')).toHaveText(HRIS.topology.raw.zh);
});

test('labelled as an illustration, not data', async ({ page }) => {
  await skip(page);
  await page.goto('/hris/');
  await expect(page.locator('[data-topology]')).toContainText(HRIS.topology.note.zh);
});

test('motion off: a still grid drawn without the canvas loop', async ({ page }) => {
  await skip(page);
  await motionOff(page);
  await page.goto('/hris/');
  await expect(page.locator('[data-topology] svg.topo-still')).toBeVisible();
  await expect(page.locator('[data-topology] canvas')).toBeHidden();
  // The still grid cannot switch to "before", so the switch is not offered.
  await expect(page.locator('[data-topology] button')).toBeHidden();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('the still grid shows', async ({ page }) => {
    await page.goto('/hris/');
    await expect(page.locator('[data-topology] svg.topo-still')).toBeVisible();
    await expect(page.locator('[data-topology] button')).toBeHidden();
  });
});

test('the switch says what it does by its label alone, not also as a pressed toggle', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop');
  await skip(page);
  await page.goto('/hris/');
  const btn = page.locator('[data-topology] button');
  await expect(btn).toBeVisible();
  await expect(btn).not.toHaveAttribute('aria-pressed', /.*/);
  await btn.click();
  await expect(btn).not.toHaveAttribute('aria-pressed', /.*/);
});
