import { test, expect } from '@playwright/test';
import { SITE } from '../../src/data/site';
import { skipIntro, noHorizontalOverflow } from './helpers';

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test(`projects index (${lang}) lists every data project, then the film zone`, async ({ page }) => {
    await page.goto(`${prefix}/projects/`);
    const data = SITE.projects.filter(p => p.line === 'data').map(p => `${prefix}${p.href}`);
    expect(await page.locator('a.prow').evaluateAll(as => as.map(a => a.getAttribute('href')))).toEqual(data);
    const film = page.locator('.night-zone a[href$="/projects/mais-je-taime/"]');
    await expect(film).toBeVisible();
    await expect(page.locator('header.nav a[aria-current="page"]')).toHaveText(SITE.nav.projects[lang]);
    expect(await noHorizontalOverflow(page)).toBe(true);
  });
}

test('the second door on the home page now lands on the index', async ({ page }) => {
  await skipIntro(page);
  await page.goto('/');
  await page.locator('a.door').nth(1).click();
  await expect(page).toHaveURL(/\/projects\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(SITE.pages.projects.title.zh);
});
