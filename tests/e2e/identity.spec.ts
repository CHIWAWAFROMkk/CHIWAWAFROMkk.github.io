import { test, expect } from '@playwright/test';
import { SITE } from '../../src/data/site';
import { skipIntro } from './helpers';

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test(`AI-product identity (${lang})`, async ({ page }) => {
    await skipIntro(page);
    await page.goto(`${prefix}/brief/`);
    await expect(page.locator('header.nav a[href="https://github.com/CHIWAWAFROMkk"]')).toBeVisible();
    await expect(page.locator('footer.footer a[href="https://github.com/CHIWAWAFROMkk"]')).toBeVisible();
    await expect(page.locator('footer.footer')).toContainText(SITE.tagline[lang]);
    await page.goto(`${prefix}/`);
    await expect(page).toHaveTitle(SITE.pages.home.title[lang]);
    await page.goto(`${prefix}/projects/`);
    await expect(page.locator('#i-data')).toHaveText(SITE.pages.projects.data[lang]);
    await expect(page.locator('#i-film')).toHaveText(SITE.pages.projects.film[lang]);
  });
}
