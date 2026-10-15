import { test, expect } from '@playwright/test';
import { motionOff } from './helpers';

const curtain = '[data-hintro]';
test.describe('HRIS intro', () => {
  test.skip(({ isMobile }) => !!isMobile, 'timing checks run once on desktop');
  test('plays on the first HRIS visit and lifts', async ({ page }) => {
    await page.goto('/hris/');
    await expect(page.locator(curtain)).toBeVisible();
    await expect(page.locator(curtain)).toBeHidden({ timeout: 3200 });
  });
  test('letters land on the baseline', async ({ page }) => {
    await page.goto('/hris/');
    await page.waitForTimeout(1500);
    const off = await page.locator('.hintro__line span').evaluateAll(els => els.filter(el => getComputedStyle(el).transform !== 'none' && getComputedStyle(el).transform !== 'matrix(1, 0, 0, 1, 0, 0)').length);
    expect(off).toBe(0);
  });
  test('Escape skips', async ({ page }) => {
    await page.goto('/hris/');
    await expect(page.locator(curtain)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator(curtain)).toBeHidden({ timeout: 300 });
  });
  test('independent of the main intro: seeing one does not skip the other', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('hyj-intro-seen', '1'));
    await page.goto('/hris/');
    await expect(page.locator(curtain)).toBeVisible();
  });
  test('reduced motion: a short fade', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/hris/');
    await expect(page.locator(curtain)).toHaveClass(/is-gentle/);
    await expect(page.locator(curtain)).toBeHidden({ timeout: 1500 });
  });
  test('motion off: none', async ({ page }) => {
    await motionOff(page);
    await page.goto('/hris/');
    await expect(page.locator(curtain)).toBeHidden();
  });
});
