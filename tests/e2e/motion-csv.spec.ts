import { test, expect, type Page } from '@playwright/test';

const LAB = '/projects/stock-data/';
const metric = (page: Page, i: number) => page.locator('#metrics .metric strong').nth(i);

test('removing duplicates strikes the duplicate row out before it goes', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.goto(LAB);
  await expect(metric(page, 0)).toHaveText('13');
  await page.locator('#dedupe').check();
  await expect(page.locator('#data-body tr.leaving')).toHaveCount(1);
  await expect(metric(page, 0)).toHaveText('12');
  await expect(page.locator('#data-body tr.leaving, #data-body tr.sinking')).toHaveCount(0);
  await expect(page.locator('#data-body tr')).toHaveCount(12);
});

test('removing rows with blanks sinks both of them', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.goto(LAB);
  await expect(metric(page, 0)).toHaveText('13');
  await page.locator('#drop-missing').check();
  await expect(page.locator('#data-body tr.sinking')).toHaveCount(2);
  await expect(metric(page, 0)).toHaveText('11');
});

test('rapid toggles end in the same table as without animation', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.goto(LAB);
  await expect(metric(page, 0)).toHaveText('13');
  for (const id of ['#dedupe', '#drop-missing', '#dedupe', '#drop-missing', '#dedupe']) await page.locator(id).click();
  // dedupe on, drop-missing off
  await expect(metric(page, 0)).toHaveText('12');
  await expect(page.locator('#data-body tr')).toHaveCount(12);
  await expect(page.locator('#data-body tr.leaving, #data-body tr.sinking')).toHaveCount(0);
});

test('reduced motion updates the table at once', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(LAB);
  await expect(metric(page, 0)).toHaveText('13');
  await page.locator('#dedupe').check();
  await expect(metric(page, 0)).toHaveText('12', { timeout: 200 });
  await expect(page.locator('#data-body tr.leaving')).toHaveCount(0);
});

test('histogram bars grow from the baseline', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.goto(LAB);
  await expect(metric(page, 0)).toHaveText('13');
  expect(await page.locator('#histogram .bin i').first().evaluate(el => getComputedStyle(el).animationName)).toBe('bar-grow');
});

test('a bad paste shakes the input area and marks it red until a good load', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.goto(LAB);
  await expect(metric(page, 0)).toHaveText('13');
  await page.locator('.paste-box summary').click();
  await page.locator('#paste').fill('a,b\n1');
  await page.locator('#paste-run').click();
  await expect(page.locator('.paste-box')).toHaveClass(/shake/);
  await expect(page.locator('.lab__import')).toHaveClass(/shake/);
  await expect(metric(page, 0)).toHaveText('13');
  await page.locator('#paste').fill('x,y\n1,2\n3,4');
  await page.locator('#paste-run').click();
  await expect(metric(page, 0)).toHaveText('2');
  await expect(page.locator('.paste-box')).not.toHaveClass(/shake/);
});
