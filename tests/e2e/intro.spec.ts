import { test, expect } from '@playwright/test';

const overlay = '[data-intro]';

test.describe('intro', () => {
  test.skip(({ isMobile }) => !!isMobile, 'timing checks run once on desktop');

  test('plays on first visit, then reveals the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(overlay)).toBeVisible();
    expect(await page.evaluate(() => document.getElementById('page')!.inert)).toBe(true);
    await expect(page.locator('[data-intro-skip]')).toBeFocused();
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

  test('Tab and letters do not skip', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(overlay)).toBeVisible();
    await page.keyboard.press('Tab');
    await page.keyboard.press('a');
    await expect(page.locator(overlay)).toBeVisible();
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

  test('module blocked: the page is uncovered within 3 seconds', async ({ page }) => {
    await page.route(/\.js($|\?)/, route => route.abort());
    await page.goto('/');
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
