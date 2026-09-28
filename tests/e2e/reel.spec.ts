import { test, expect, type Page } from '@playwright/test';
import { noHorizontalOverflow } from './helpers';

const reel = '[data-reel]';
const trackX = (page: Page) => page.locator('[data-reel-track]').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41);

test.describe('film reel on desktop', () => {
  test.skip(({ isMobile }) => !!isMobile, 'desktop pinning');

  test('scrolling down slides the reel sideways and plays the clips in view', async ({ page }) => {
    await page.goto('/brief/');
    await expect(page.locator(`${reel} video`)).toHaveCount(12);
    const top = await page.locator(reel).evaluate(el => el.getBoundingClientRect().top + window.scrollY);
    await page.evaluate(y => window.scrollTo(0, y), top);
    await page.waitForTimeout(300);
    const start = await trackX(page);
    await page.evaluate(y => window.scrollTo(0, y + 900), top);
    await page.waitForTimeout(300);
    expect(await trackX(page)).toBeLessThan(start - 200);
    await expect(page.locator('[data-reel-count]')).not.toHaveText(/^01 /);
    await expect.poll(() => page.locator(`${reel} video`).evaluateAll(vs => vs.filter(v => !(v as HTMLVideoElement).paused).length)).toBeGreaterThan(0);
  });

  test('the pause button stops every clip', async ({ page }) => {
    await page.goto('/brief/');
    const top = await page.locator(reel).evaluate(el => el.getBoundingClientRect().top + window.scrollY);
    await page.evaluate(y => window.scrollTo(0, y + 300), top);
    await expect.poll(() => page.locator(`${reel} video`).evaluateAll(vs => vs.filter(v => !(v as HTMLVideoElement).paused).length)).toBeGreaterThan(0);
    await page.locator('[data-reel-toggle]').click();
    expect(await page.locator(`${reel} video`).evaluateAll(vs => vs.every(v => (v as HTMLVideoElement).paused))).toBe(true);
    await expect(page.locator('[data-reel-toggle]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('reduced motion: no pinning and nothing autoplays', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/brief/');
    await page.locator(reel).scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    expect(await page.locator(reel).evaluate(el => el.classList.contains('is-pinned'))).toBe(false);
    expect(await page.locator(`${reel} video`).evaluateAll(vs => vs.every(v => (v as HTMLVideoElement).paused))).toBe(true);
  });
});

test.describe('film reel on phones', () => {
  test.skip(({ isMobile }) => !isMobile, 'phone layout');

  test('the track swipes sideways inside the page without widening it', async ({ page }) => {
    await page.goto('/en/brief/');
    const track = page.locator('[data-reel-track]');
    expect(await track.evaluate(el => el.scrollWidth > el.clientWidth && getComputedStyle(el).overflowX === 'auto')).toBe(true);
    expect(await noHorizontalOverflow(page)).toBe(true);
  });
});

test.describe('film reel without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('shows every clip poster with a label', async ({ page }) => {
    await page.goto('/brief/');
    const posters = await page.locator(`${reel} video`).evaluateAll(vs => vs.map(v => [v.getAttribute('poster'), v.getAttribute('aria-label')]));
    expect(posters).toHaveLength(12);
    for (const [poster, label] of posters) {
      expect(poster).toMatch(/\.webp$/);
      expect((label ?? '').length).toBeGreaterThan(2);
    }
  });
});
