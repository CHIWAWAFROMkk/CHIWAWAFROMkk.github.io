import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { deriveFacts, formatFact, type Results } from '../../src/scripts/insights-facts';

const PATH = '/projects/campus-delivery/insights/';
const FACTS = deriveFacts(JSON.parse(readFileSync('src/data/insights.json', 'utf8')).results as Results);
const noWebGL2 = (page: Page) => page.addInitScript(() => {
  const orig = HTMLCanvasElement.prototype.getContext;
  // @ts-expect-error test override
  HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) { return type === 'webgl2' ? null : orig.call(this, type, ...rest); };
});

test('static when WebGL2 is unavailable: the opening reads in full and takes no extra scroll', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await noWebGL2(page);
  await page.goto(PATH);
  await page.waitForTimeout(1500);
  const pro = page.locator('[data-prologue]');
  await expect(pro).toHaveAttribute('data-state', 'static');
  await expect(pro.locator('.prologue__static [data-insight-num="orders"]')).toHaveText(formatFact(FACTS.orders, 'zh'));
  await expect(pro.locator('.prologue__static')).toBeVisible();
  const h = await pro.evaluate(el => el.getBoundingClientRect().height / innerHeight);
  expect(h).toBeLessThan(1.2);
  expect(errors).toEqual([]);
});

test('reduced motion stays static and never creates a WebGL context', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(PATH);
  await page.waitForTimeout(1200);
  await expect(page.locator('[data-prologue]')).toHaveAttribute('data-state', 'static');
  await expect(page.locator('[data-prologue] canvas[data-ready]')).toHaveCount(0);
});

test('captions carry the query results in both languages', async ({ page }) => {
  for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
    await noWebGL2(page);
    await page.goto(`${prefix}${PATH}`);
    await expect(page.locator('[data-cap="1"] [data-insight-num="orders"]')).toHaveText(formatFact(FACTS.orders, lang));
    await expect(page.locator('[data-cap="3"] [data-insight-num="top3Share"]')).toHaveText(formatFact(FACTS.top3Share, lang));
  }
});

test('the skip link reaches the summary', async ({ page }) => {
  await noWebGL2(page);
  await page.goto(PATH);
  const skip = page.locator('.prologue__skip');
  await skip.focus();
  await expect(skip).toBeVisible();
  await skip.press('Enter');
  await expect(page).toHaveURL(/#p-summary-h$/);
  await expect(page.locator('#p-summary-h')).toBeInViewport();
});
