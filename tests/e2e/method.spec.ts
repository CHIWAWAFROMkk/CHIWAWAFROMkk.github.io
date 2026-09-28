import { test, expect } from '@playwright/test';
import { noHorizontalOverflow } from './helpers';

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test(`method page (${lang}) documents the reproducible sample and links back to the tool`, async ({ page }) => {
    const res = await page.goto(`${prefix}/projects/stock-data/method/`);
    expect(res?.status()).toBe(200);
    await expect(page.locator('main')).toContainText('15.2');
    await expect(page.locator('main')).toContainText('node reproduce.mjs sample.csv --dedupe --drop-missing');
    await expect(page.locator(`main a[href="${prefix}/projects/stock-data/"]`).first()).toBeVisible();
    await expect(page.locator('main a[href="/downloads/csv-lab-source.zip"]').first()).toBeVisible();
    await expect(page.locator('header.nav a.lang')).toHaveAttribute('href', lang === 'zh' ? '/en/projects/stock-data/method/' : '/projects/stock-data/method/');
    expect(await noHorizontalOverflow(page)).toBe(true);
  });
}
