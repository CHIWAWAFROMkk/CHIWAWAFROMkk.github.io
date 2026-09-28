import { test, expect } from '@playwright/test';
import { skipIntro } from './helpers';

test.describe('choosing a door', () => {
  test.beforeEach(async ({ page }) => { await skipIntro(page); });

  test('the chosen door expands to fill the screen, then the overview opens', async ({ page }) => {
    await page.goto('/');
    await page.locator('a.door').first().click({ noWaitAfter: true });
    await expect(page.locator('.door-expand')).toHaveCount(1, { timeout: 300 });
    await expect(page).toHaveURL(/\/brief\/$/, { timeout: 3000 });
  });

  test('coming back leaves no expanded panel behind', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('a.door').nth(1).click();
    await page.waitForURL(/\/en\/projects\/$/, { timeout: 3000, waitUntil: 'commit' });
    await page.goBack();
    await expect(page.locator('.door-expand')).toHaveCount(0);
    await expect(page.locator('a.door').first()).toBeVisible();
  });

  test('reduced motion goes straight to the page', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.locator('a.door').first().click({ noWaitAfter: true });
    await expect(page.locator('.door-expand')).toHaveCount(0);
    await expect(page).toHaveURL(/\/brief\/$/);
  });

  test('ctrl-click keeps the native new-tab behaviour', async ({ page, context, isMobile }) => {
    test.skip(!!isMobile, 'modifier keys');
    await page.goto('/');
    const popup = context.waitForEvent('page');
    await page.locator('a.door').first().click({ modifiers: ['Control'] });
    await popup;
    await expect(page.locator('.door-expand')).toHaveCount(0);
    await expect(page).toHaveURL(/\/$/);
  });
});
