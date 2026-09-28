import { test, expect } from '@playwright/test';
import { skipIntro, noHorizontalOverflow } from './helpers';
import { fact } from '../../src/data/facts';

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test.describe(`home (${lang})`, () => {
    test.beforeEach(async ({ page }) => { await skipIntro(page); });

    test('identity is readable in the first viewport without clicking', async ({ page }) => {
      await page.goto(`${prefix}/`);
      const vh = page.viewportSize()!.height;
      for (const sel of ['.home__name', '.home__line', '.home__avail']) {
        const box = await page.locator(sel).boundingBox();
        expect(box, sel).not.toBeNull();
        expect(box!.y + box!.height, sel).toBeLessThanOrEqual(vh);
      }
      await expect(page.locator('.home__line')).toHaveText(fact('F1').text[lang]);
      await expect(page.locator('.home__avail')).toHaveText(fact('F3').text[lang]);
      await expect(page.locator('.contact a[href^="mailto:"]')).toBeVisible();
    });

    test('doors link to overview and projects', async ({ page }) => {
      await page.goto(`${prefix}/`);
      await expect(page.locator('a.door').nth(0)).toHaveAttribute('href', `${prefix}/brief/`);
      await expect(page.locator('a.door').nth(1)).toHaveAttribute('href', `${prefix}/projects/`);
    });

    test('hovering a door does not move or resize it', async ({ page, isMobile }) => {
      test.skip(!!isMobile, 'hover only');
      await page.goto(`${prefix}/`);
      const door = page.locator('a.door').nth(0);
      const before = await door.boundingBox();
      await door.hover();
      await page.waitForTimeout(400);
      expect(await door.boundingBox()).toEqual(before);
    });

    test('no horizontal overflow', async ({ page }) => {
      await page.goto(`${prefix}/`);
      expect(await noHorizontalOverflow(page)).toBe(true);
    });
  });
}

test.describe('home without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('shows identity and doors', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.home__name')).toBeVisible();
    await expect(page.locator('a.door')).toHaveCount(2);
  });
});
