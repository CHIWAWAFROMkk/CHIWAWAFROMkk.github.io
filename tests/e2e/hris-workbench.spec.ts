import { test, expect } from '@playwright/test';
import { VERSIONS, WB_CASES, WB_TEXT, ROUTING } from '../../src/data/hris-workbench';
import { OUTCOME_LABEL, DEMO_TEXT } from '../../src/scripts/hris-demo';
import { motionChoice, motionOff, noHorizontalOverflow } from './helpers';

test.beforeEach(async ({ page }) => { await motionOff(page); });

test('labelled as fictional, with every record and the routing rules', async ({ page }) => {
  await page.goto('/hris/workbench/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(WB_TEXT.title.zh);
  await expect(page.getByText(DEMO_TEXT.badge.zh)).toBeVisible();
  await expect(page.locator('[data-wb-record]')).toHaveCount(WB_CASES.length);
  await expect(page.locator('.wb-routing li')).toHaveText(ROUTING.map(r => r.zh));
  expect(await noHorizontalOverflow(page)).toBe(true);
});

test('picking a record shows where it stops and what happens next', async ({ page }) => {
  await page.goto('/hris/workbench/');
  for (const c of [WB_CASES[1], WB_CASES[5]]) {
    await page.locator(`[data-wb-record="${c.id}"]`).click();
    await expect(page.locator(`[data-wb-record="${c.id}"]`)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.wb-outcome')).toHaveText(OUTCOME_LABEL[c.outcome].zh);
    await expect(page.locator(`.wb-steps [data-step="${c.stopsAt}"]`)).toHaveAttribute('data-state', c.outcome === 'done' ? 'passed' : 'stopped');
    await expect(page.locator('.wb-next')).toContainText(c.next.zh);
  }
});

test('switching versions changes the chain and the tool on each documented step', async ({ page }) => {
  await page.goto('/hris/workbench/');
  for (const v of VERSIONS) {
    await page.locator(`[data-wb-version="${v.id}"]`).click();
    await expect(page.locator(`[data-wb-version="${v.id}"]`)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.wb-chain li')).toHaveText(v.chain.map(c => c.zh));
    await expect(page.locator('.wb-steps [data-step="extract"] .wb-tool')).toHaveText(v.tools.extract!.zh);
    if (!v.tools.match) await expect(page.locator('.wb-steps [data-step="match"] .wb-tool')).toHaveText(WB_TEXT.notRecorded.zh);
  }
});

test('keyboard: records and versions are operable', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'keyboard');
  await page.goto('/hris/workbench/');
  await page.locator(`[data-wb-record="${WB_CASES[2].id}"]`).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator(`[data-wb-record="${WB_CASES[2].id}"]`)).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-wb-version="v2"]').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('[data-wb-version="v2"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.locator('[data-wb-version="v2"]').evaluate(el => getComputedStyle(el).outlineStyle !== 'none' || getComputedStyle(el).boxShadow !== 'none')).toBe(true);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('the first record and the final version are shown in full', async ({ page }) => {
    await page.goto('/hris/workbench/');
    await expect(page.locator('.wb-outcome')).toHaveText(OUTCOME_LABEL[WB_CASES[0].outcome].zh);
    await expect(page.locator('.wb-chain li')).toHaveText(VERSIONS[2].chain.map(c => c.zh));
  });
});

test('full motion: the rows the script writes animate too (trail, chain), not only the server-rendered ones', async ({ page }) => {
  await motionChoice(page, 'full');   // runs after the file's motionOff, so it wins
  await page.goto('/hris/workbench/');
  await page.locator(`[data-wb-record="${WB_CASES[1].id}"]`).click();
  const names = await page.evaluate(() => ['.wb-steps li', '.wb-trail li', '.wb-chain li', '.wb-outcome'].map(s => getComputedStyle(document.querySelector(s)!).animationName));
  expect(names).toEqual(['wb-light', 'wb-align', 'wb-align', 'wb-stamp']);
});

test('dark theme: the terminal follows the theme (it is the page, not an embedded light demo) and its title is inset', async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.setItem('hyj-hris-theme', 'dark'); } catch { /* blocked */ } });
  await page.goto('/hris/workbench/');
  expect(await page.locator('main').evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe('rgb(244, 243, 239)');
  expect(await page.locator('h1').evaluate(el => parseFloat(getComputedStyle(el).paddingLeft))).toBeGreaterThanOrEqual(16);
});
