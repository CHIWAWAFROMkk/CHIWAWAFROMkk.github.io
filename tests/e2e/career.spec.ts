import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { noHorizontalOverflow } from './helpers';

const DEMO = JSON.parse(readFileSync('public/assets/job-agent-demo.json', 'utf8'));
const sc = (id: string) => DEMO.scenarios.find((s: { id: string }) => s.id === id);
const PATH = '/projects/ai-career/';
async function ready(page: Page, prefix = '') {
  await page.goto(`${prefix}${PATH}`);
  await expect(page.locator('#agent-results')).toBeVisible({ timeout: 10000 });
}

test('the replay sits before the body and starts on 4 days / unconfirmed, as computed by the engine', async ({ page }) => {
  await ready(page);
  const demoTop = await page.locator('[data-career]').evaluate(el => el.getBoundingClientRect().top);
  const bodyTop = await page.locator('article.prose').evaluate(el => el.getBoundingClientRect().top);
  expect(demoTop).toBeLessThan(bodyTop);
  await expect(page.locator('#agent-score')).toHaveText(String(sc('4-0').match.overall_score));
  await expect(page.locator('#agent-facts')).toHaveText(String(sc('4-0').pack.evidence.length));
  await expect(page.locator('#agent-matches tr')).toHaveCount(sc('4-0').match.evidence.length);
  expect(await noHorizontalOverflow(page)).toBe(true);
});

test('three days caps the score at 59 and says why', async ({ page }) => {
  await ready(page);
  await page.locator('#agent-days').selectOption('3');
  await expect(page.locator('#agent-score')).toHaveText(String(sc('3-0').match.overall_score));
  expect(Number(sc('3-0').match.overall_score)).toBeLessThanOrEqual(59);
  await expect(page.locator('#agent-observation')).toContainText('59');
});

test('confirming Tableau puts one more fact into the materials', async ({ page }) => {
  await ready(page);
  await page.locator('#agent-evidence').selectOption('1');
  await expect(page.locator('#agent-facts')).toHaveText(String(sc('4-1').pack.evidence.length));
  expect(sc('4-1').pack.evidence.length).toBe(sc('4-0').pack.evidence.length + 1);
});

test('the draft follows the chosen material', async ({ page }) => {
  await ready(page);
  await page.locator('#agent-material').selectOption('boss_greeting');
  await expect(page.locator('#agent-draft')).toHaveText(sc('4-0').pack.materials.boss_greeting);
});

test('export downloads the current scenario', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await ready(page);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('#agent-export').click()]);
  expect(dl.suggestedFilename()).toBe('job-agent-example-4-0.json');
});

test('rapid switching lands on the last scenario', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await ready(page);
  for (const v of ['3', 'unknown', '4', '3']) await page.locator('#agent-days').selectOption(v);
  await page.locator('#agent-evidence').selectOption('1');
  await expect(page.locator('#agent-score')).toHaveText(String(sc('3-1').match.overall_score), { timeout: 4000 });
  await page.waitForTimeout(1500);
  expect(await page.locator('#agent-score').textContent()).toBe(String(sc('3-1').match.overall_score));
});

test('a failed load explains itself and can retry', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.route('**/job-agent-demo.json', r => r.abort());
  await page.goto(PATH);
  await expect(page.locator('#agent-status')).toContainText('范例暂时未能加载');
  await expect(page.locator('#agent-retry')).toBeVisible();
  await expect(page.locator('article.prose h2').first()).toBeVisible();
  await page.unroute('**/job-agent-demo.json');
  await page.locator('#agent-retry').click();
  await expect(page.locator('#agent-results')).toBeVisible();
});

test('English page: English interface, Chinese demo data', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await ready(page, '/en');
  await expect(page.locator('#agent-status')).toContainText('Replaying');
  await expect(page.locator('[data-career]')).toContainText('Demo data is in Chinese');
  await expect(page.locator('#agent-jd')).toContainText('岗位');
  await expect(page.locator('#agent-recommendation')).not.toHaveText(/[一-鿿]/);
});
