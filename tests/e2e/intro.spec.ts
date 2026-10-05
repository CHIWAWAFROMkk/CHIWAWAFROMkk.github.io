import { test, expect } from '@playwright/test';

const overlay = '[data-intro]';

test.describe('intro', () => {
  test.skip(({ isMobile }) => !!isMobile, 'timing checks run once on desktop');

  test('plays on first visit, then reveals the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(overlay)).toBeVisible();
    expect(await page.evaluate(() => document.getElementById('page')!.inert)).toBe(true);
    await expect(page.locator(overlay)).toBeFocused();
    await expect(page.locator(overlay)).toBeHidden({ timeout: 3500 });
    expect(await page.evaluate(() => document.getElementById('page')!.inert)).toBe(false);
  });

  test('Escape skips immediately', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(overlay)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator(overlay)).toBeHidden({ timeout: 300 });
  });

  test('skip button skips', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-intro-skip]').click();
    await expect(page.locator(overlay)).toBeHidden({ timeout: 300 });
  });

  test('Enter, Space, letters and Tab do not skip', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(overlay)).toBeVisible();
    for (const key of ['Enter', ' ', 'a', 'Tab']) await page.keyboard.press(key);
    await expect(page.locator(overlay)).toBeVisible();
  });

  test('focus stays inside the intro while it plays', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(overlay)).toBeVisible();
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => !!document.activeElement?.closest('[data-intro]') || document.activeElement === document.body), `tab ${i + 1}`).toBe(true);
    }
  });

  test('slow network: once the cover has lifted, the intro never starts', async ({ page }) => {
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
    // Astro's bundled stylesheet comes after the inline guess, so delaying it holds back the intro module but not the 3 s failsafe.
    await page.route('**/_astro/*.css', async r => { await delay(2600); await r.continue(); });
    await page.route('**/BarlowCondensed-Bold.woff2', async r => { await delay(3200); await r.continue(); });
    await page.goto('/', { waitUntil: 'commit' });
    await page.waitForFunction(() => document.readyState !== 'loading' || document.documentElement.classList.contains('intro-pending'));
    await page.waitForFunction(() => !document.documentElement.classList.contains('intro-pending'), null, { timeout: 6000 });
    // Sample without auto-retry: the page must stay usable, never re-covered, for the next 1.5 s.
    for (let i = 0; i < 8; i++) {
      const s = await page.evaluate(() => ({ playing: !!document.querySelector('.intro.is-playing'), inert: !!document.getElementById('page')?.inert }));
      expect(s, `sample ${i}`).toEqual({ playing: false, inert: false });
      await page.waitForTimeout(200);
    }
  });

  test('second visit shows the page with no intro at all', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Escape');
    await page.reload();
    expect(await page.evaluate(() => document.documentElement.classList.contains('intro-pending'))).toBe(false);
    await expect(page.locator(overlay)).toBeHidden();
    await expect(page.locator('.home__name')).toBeVisible();
  });

  test('reduced motion: no intro', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator(overlay)).toBeHidden();
    await expect(page.locator('.home__name')).toBeVisible();
  });

  test('storage blocked: intro still plays once and the page works', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });
    });
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/');
    await expect(page.locator(overlay)).toBeHidden({ timeout: 3500 });
    await expect(page.locator('a.door').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('intro script crashes: the page is uncovered within 3 seconds', async ({ page }) => {
    // matchMedia throwing makes the inline guess fall back to "first visit" and makes the intro module crash before it can lift the cover.
    await page.addInitScript(() => { window.matchMedia = () => { throw new Error('boom'); }; });
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.classList.contains('intro-pending'))).toBe(true);
    await page.waitForTimeout(3200);
    expect(await page.evaluate(() => document.documentElement.classList.contains('intro-pending'))).toBe(false);
    await expect(page.locator('a.door').first()).toBeVisible();
  });
});

test.describe('intro without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('overlay never shows', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(overlay)).toBeHidden();
    await expect(page.locator('.home__name')).toBeVisible();
  });
});
