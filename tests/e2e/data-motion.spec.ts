import { test, expect } from '@playwright/test';
import { skipIntro } from './helpers';

test.describe('odometer', () => {
  test('the overview number spins and ends as plain text', async ({ page }) => {
    await skipIntro(page);
    await page.goto('/brief/');
    const num = page.locator('.evidence .num[data-fact="F6"]');
    await expect(num).toHaveAttribute('data-spun', '', { timeout: 5000 });
    await expect(num).toHaveText('2000');
    await expect(num.locator('.odo, .sr')).toHaveCount(0);
  });

  test('text stays final while the reels spin', async ({ page }) => {
    await skipIntro(page);
    await page.goto('/brief/');
    const num = page.locator('.evidence .num[data-fact="F6"]');
    for (let i = 0; i < 10; i++) {
      expect(await num.evaluate(el => el.textContent)).toBe('2000');
      await page.waitForTimeout(80);
    }
  });

  test('reduced motion shows the number without reels', async ({ page }) => {
    await skipIntro(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/brief/');
    await page.waitForTimeout(800);
    await expect(page.locator('.evidence .num .odo')).toHaveCount(0);
    await expect(page.locator('.evidence .num[data-spun]')).toHaveCount(0);
  });

  test('rapid filters leave the final value and no reels', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'run once');
    await page.goto('/projects/campus-delivery/insights/');
    await page.locator('[data-cockpit]').scrollIntoViewIfNeeded();
    await expect(page.locator('#ck-from')).toBeEnabled({ timeout: 25000 });
    for (const v of ['2', '5', '9', '3']) await page.locator('#ck-from').fill(v);
    await expect(page.locator('[data-kpi="orders"] .odo')).toHaveCount(0, { timeout: 5000 });
    await expect(page.locator('[data-kpi="orders"]')).toHaveAttribute('data-spun', '');
  });
});
