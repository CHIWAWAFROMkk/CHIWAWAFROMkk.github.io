import { test, expect, type Page } from '@playwright/test';
import { noHorizontalOverflow } from './helpers';

const metric = (page: Page, i: number) => page.locator('#metrics .metric strong').nth(i);

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test.describe(`CSV lab (${lang})`, () => {
    test('the constructed sample reproduces the documented numbers', async ({ page }) => {
      await page.goto(`${prefix}/projects/stock-data/`);
      await expect(metric(page, 0)).toHaveText('13');
      await expect(metric(page, 2)).toHaveText('2');
      await expect(metric(page, 3)).toHaveText('1');
      await page.locator('#dedupe').check();
      await expect(metric(page, 0)).toHaveText('12');
      await page.locator('#drop-missing').check();
      await expect(metric(page, 0)).toHaveText('10');
      await expect(page.locator('#stat-list')).toContainText('15.2');
      expect(await noHorizontalOverflow(page)).toBe(true);
    });

    test('bad paste keeps the previous result and reports in the page language', async ({ page, isMobile }) => {
      test.skip(!!isMobile, 'run once');
      await page.goto(`${prefix}/projects/stock-data/`);
      await expect(metric(page, 0)).toHaveText('13');
      await page.locator('.paste-box summary').click();
      await page.locator('#paste').fill('a,b\n1');
      await page.locator('#paste-run').click();
      await expect(page.locator('#message')).toContainText(lang === 'zh' ? '列数与表头不一致' : 'different number of columns');
      await expect(metric(page, 0)).toHaveText('13');
      await page.locator('#paste').fill('x,y\n1,2\n3,4');
      await page.locator('#paste-run').click();
      await expect(metric(page, 0)).toHaveText('2');
    });
  });
}

test('a late sample response never overwrites data the visitor pasted meanwhile', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  let release!: () => void;
  const gate = new Promise<void>(r => { release = r; });
  await page.route('**/assets/sample.csv', async route => { await gate; await route.continue(); });
  await page.goto('/projects/stock-data/');
  await page.locator('.paste-box summary').click();
  await page.locator('#paste').fill('x,y\n1,2\n3,4');
  await page.locator('#paste-run').click();
  await expect(metric(page, 0)).toHaveText('2');
  release();
  await page.waitForTimeout(800);                                   // the held sample arrives after the visitor's data
  await expect(metric(page, 0)).toHaveText('2');
  await expect(page.locator('#source-label')).not.toContainText('sample.csv');
});
