import { test, expect, type Page } from '@playwright/test';
import { noHorizontalOverflow } from './helpers';

const reel = '[data-reel]';
const scrollLeft = (page: Page) => page.locator('[data-reel-track]').evaluate(el => el.scrollLeft);

async function pointAt(page: Page, fraction: number) {
  const box = (await page.locator('[data-reel-track]').boundingBox())!;
  await page.mouse.move(box.x + box.width * fraction, box.y + box.height / 2);
}

test.describe('cinema on desktop', () => {
  test.skip(({ isMobile }) => !!isMobile, 'pointer edges');

  test.beforeEach(async ({ page }) => {
    await page.goto('/brief/');
    await page.locator(reel).scrollIntoViewIfNeeded();
  });

  test('the page scrolls past normally; the section is never pinned', async ({ page }) => {
    expect(await page.locator(reel).evaluate(el => el.style.height)).toBe('');
    expect(await page.locator('[data-reel-track]').evaluate(el => getComputedStyle(el).transform)).toBe('none');
  });

  test('curtains open when the cinema comes into view', async ({ page }) => {
    await expect(page.locator(reel)).toHaveClass(/is-open/);
  });

  test('pointer at the right edge reveals later shots; left edge goes back; middle stops', async ({ page }) => {
    const items = page.locator('.reel__item');
    const pitch = (await items.nth(1).evaluate(el => (el as HTMLElement).offsetLeft)) - (await items.first().evaluate(el => (el as HTMLElement).offsetLeft));
    await pointAt(page, 0.98);
    // Glide well past the first shot: when the glide stops, scroll snapping settles on the nearest shot, which must not be the start.
    await expect.poll(() => scrollLeft(page)).toBeGreaterThan(pitch * 1.3);
    await pointAt(page, 0.5);
    await page.waitForTimeout(500);
    const held = await scrollLeft(page);
    expect(held).toBeGreaterThan(pitch * 0.9);
    await page.waitForTimeout(400);
    expect(Math.abs((await scrollLeft(page)) - held)).toBeLessThan(20);
    await pointAt(page, 0.02);
    await expect.poll(() => scrollLeft(page)).toBeLessThan(held - 100);
    await expect(page.locator('[data-reel-count]')).toHaveText(/^\d\d \/ 12$/);
  });

  test('clips in view play, and the pause button stops every clip', async ({ page }) => {
    await expect.poll(() => page.locator(`${reel} video`).evaluateAll(vs => vs.filter(v => !(v as HTMLVideoElement).paused).length)).toBeGreaterThan(0);
    await page.locator('[data-reel-toggle]').click();
    expect(await page.locator(`${reel} video`).evaluateAll(vs => vs.every(v => (v as HTMLVideoElement).paused))).toBe(true);
    await expect(page.locator('[data-reel-toggle]')).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('cinema with reduced motion', () => {
  test.skip(({ isMobile }) => !!isMobile, 'run once');
  test('curtains start open, nothing autoplays, edges do not auto-scroll', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/brief/');
    await page.locator(reel).scrollIntoViewIfNeeded();
    await expect(page.locator(reel)).toHaveClass(/is-open/);
    await pointAt(page, 0.98);
    await page.waitForTimeout(500);
    expect(await scrollLeft(page)).toBe(0);
    expect(await page.locator(`${reel} video`).evaluateAll(vs => vs.every(v => (v as HTMLVideoElement).paused))).toBe(true);
  });
});

test.describe('cinema on phones', () => {
  test.skip(({ isMobile }) => !isMobile, 'phone layout');
  test('the screen swipes sideways inside the page without widening it', async ({ page }) => {
    await page.goto('/en/brief/');
    const track = page.locator('[data-reel-track]');
    expect(await track.evaluate(el => el.scrollWidth > el.clientWidth && getComputedStyle(el).overflowX === 'auto')).toBe(true);
    expect(await noHorizontalOverflow(page)).toBe(true);
  });
});

test.describe('cinema without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('shows every clip poster with a label, curtains open', async ({ page }) => {
    await page.goto('/brief/');
    const posters = await page.locator(`${reel} video`).evaluateAll(vs => vs.map(v => [v.getAttribute('poster'), v.getAttribute('aria-label')]));
    expect(posters).toHaveLength(12);
    for (const [poster, label] of posters) {
      expect(poster).toMatch(/\.webp$/);
      expect((label ?? '').length).toBeGreaterThan(2);
    }
    const curtain = await page.locator('.reel__curtain').first().evaluate(el => el.getBoundingClientRect().width);
    expect(curtain).toBeLessThan(80);
  });
});
