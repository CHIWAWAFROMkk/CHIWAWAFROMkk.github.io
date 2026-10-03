import { test, expect } from '@playwright/test';
import { skipIntro } from './helpers';

const PAGES = [['/projects/ai-career/', 'career'], ['/projects/quota-deck/', 'quota'], ['/projects/ai-campus/', 'campus']] as const;

for (const [path, key] of PAGES) for (const prefix of ['', '/en']) {
  const url = prefix + path;

  test(`${url} opens its prose with the ${key} plate, not a generated photo`, async ({ page }) => {
    await skipIntro(page);
    await page.goto(url);
    const plate = page.locator(`[data-plate="${key}"]`);
    await expect(plate).toBeVisible();
    await expect(page.locator('img[src*="/assets/editorial/"][src$=".webp"]')).toHaveCount(0);
    await plate.scrollIntoViewIfNeeded();
    await expect(plate).toHaveClass(/is-drawn/);
    if (prefix) expect((await plate.innerText()).match(/[一-鿿]+/g) ?? []).toEqual([]);
  });
}

test('reduced motion: the plate is complete at once, never armed', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await skipIntro(page);
  await page.goto('/projects/ai-career/');
  await expect(page.locator('[data-plate="career"]')).not.toHaveClass(/is-armed/);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('the plates are shown complete', async ({ page }) => {
    await page.goto('/projects/quota-deck/');
    const plate = page.locator('[data-plate="quota"]');
    await expect(plate).toBeVisible();
    await expect(plate).not.toHaveClass(/is-armed/);
    await expect(plate.locator('.pq__pool')).toHaveCount(5);
  });
});
