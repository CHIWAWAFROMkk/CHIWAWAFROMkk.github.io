import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { noHorizontalOverflow } from './helpers';

const PATH = '/projects/ai-campus/live/';
// The live demos run continuous canvas animation (and a Python runtime); run each file's tests one after another so
// that sixteen parallel workers do not starve them of CPU and slow their real-time replays past the timeouts.
test.describe.configure({ mode: 'default', timeout: 120_000 });
const desktopOnly = (isMobile: boolean) => test.skip(isMobile, 'desktop flow; phones are covered by the start-button test');

/** Opens the page and waits for the runtime and for the constructed sample to settle. */
async function live(page: Page, prefix = '') {
  await page.goto(`${prefix}${PATH}`);
  await page.locator('#cm-stage').scrollIntoViewIfNeeded();
  await expect(page.locator('#cm-chip')).toHaveClass(/live/, { timeout: 90_000 });
  await expect(page.locator('#cm-all')).toHaveText('36', { timeout: 20_000 });
  await expect(page.locator('#cm-stage')).toHaveAttribute('data-state', 'done', { timeout: 20_000 });
}
const count = (page: Page, n: number) => page.locator(`#cm-code .cl-l[data-n="${n}"] .cl-cnt`);
const submit = (page: Page) => page.locator('#cm-add').click();

test('the study\'s own program boots in the browser and cleans the constructed sample', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await expect(page.locator('#cm-chip')).toHaveText(/^PYTHON 3\.13\.\d+ · WEBASSEMBLY$/);
  await expect(page.locator('#cm-tag')).toBeVisible();
  await expect(page.locator('#cm-inc')).toHaveText('26');
  await expect(page.locator('#cm-ledger')).toContainText('duplicate_id 6');
  await expect(page.locator('#cm-ledger')).toContainText('outside_period 1');
  await expect(page.locator('#cm-timing')).toContainText('ms');
  await expect(count(page, 87)).toHaveText('×37');
  await expect(count(page, 97)).toHaveText('×26');
  await expect(page.locator('#cm-boot-log')).toContainText('MB');
});

test('the live source lines are analysis.py lines 87–97, verbatim', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await page.goto(PATH);
  const file = readFileSync('public/downloads/campus/analysis.py', 'utf8').replace(/\r\n/g, '\n').split('\n').slice(86, 97);
  await expect(page.locator('#cm-code .cl-src')).toHaveText(file);
});

test('the stress test counts 2,000 rows exactly as analyze() does', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#cm-stress').click();
  await expect(page.locator('#cm-all')).toHaveText('2,000', { timeout: 30_000 });
  await expect(page.locator('#cm-inc')).toHaveText('1,720');
  await expect(count(page, 87)).toHaveText('×2,001');
  await expect(count(page, 88)).toHaveText('×2,000');
  await expect(count(page, 89)).toHaveText('×80');
  await expect(count(page, 97)).toHaveText('×1,720');
  await expect(page.locator('#cm-ledger')).toContainText('outside_period 100');
  await expect(page.locator('#cm-timing')).toContainText('2,000');
  await expect(page.locator('#cm-stage')).toHaveAttribute('data-state', 'done');
  // settled: the exclusion lines show their shading (a few per cent of rows), not the solid red of the replay
  await expect(page.locator('#cm-code .cl-l[data-n="89"]')).not.toHaveClass(/\bred\b/);
});

test('a visitor answer is analysed with the rest', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await submit(page);
  await expect(page.locator('#cm-all')).toHaveText('37', { timeout: 15_000 });
  await expect(page.locator('#cm-inc')).toHaveText('27');
  await expect(page.locator('#cm-id')).toHaveValue('V002');
  await expect(count(page, 97)).toHaveText('×27');
});

test('submitting again during the replay uses the next ID', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await submit(page);
  await submit(page);                          // waits for the form to be enabled again, while the first replay still runs
  await expect(page.locator('#cm-all')).toHaveText('38', { timeout: 15_000 });
  await expect(page.locator('#cm-inc')).toHaveText('28');
  await expect(page.locator('#cm-ledger')).toContainText('duplicate_id 6');
  await expect(page.locator('#cm-id')).toHaveValue('V003');
});

test('keyboard: Enter on the submit button keeps focus there, so a second Enter submits again', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#cm-add').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#cm-all')).toHaveText('37', { timeout: 15_000 });
  await expect(page.locator('#cm-add')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#cm-all')).toHaveText('38', { timeout: 15_000 });
});

test('keyboard: loading the sample moves focus to the stress test instead of dropping it', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#cm-clear').click();
  await expect(page.locator('#cm-all')).toHaveText('0', { timeout: 15_000 });
  await page.locator('#cm-sample').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#cm-all')).toHaveText('36', { timeout: 15_000 });
  await expect(page.locator('#cm-stress')).toBeFocused();
});

test('the same ID twice: the program excludes both', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await submit(page);
  await expect(page.locator('#cm-inc')).toHaveText('27', { timeout: 15_000 });
  await page.locator('#cm-id').fill('V001');
  await submit(page);
  await expect(page.locator('#cm-all')).toHaveText('38', { timeout: 15_000 });
  await expect(page.locator('#cm-inc')).toHaveText('26');
  await expect(page.locator('#cm-ledger')).toContainText('duplicate_id 8');
});

test('no consent ends the survey and is excluded at its gate', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#cm-q1').uncheck();
  await expect(page.locator('#cm-q3')).toBeDisabled();
  await submit(page);
  await expect(page.locator('#cm-all')).toHaveText('37', { timeout: 15_000 });
  await expect(page.locator('#cm-inc')).toHaveText('26');
  await expect(page.locator('#cm-ledger')).toContainText('no_consent 3');
});

test('invalid input shows the program\'s own validation failure and keeps the last result', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#cm-id').fill(' X ');
  await submit(page);
  await expect(page.locator('#cm-invalid')).toBeVisible();
  await expect(page.locator('#cm-invalid-msg')).toHaveText('第 37 条记录：匿名 ID 不应有首尾空格');
  await expect(page.locator('#cm-all')).toHaveText('36');
  await page.locator('#cm-id').fill('V001');
  await page.locator('#cm-date').fill('');
  await submit(page);
  await expect(page.locator('#cm-invalid-msg')).toHaveText('第 37 条记录：采集日期格式错误');
  await page.locator('#cm-date').fill('2026-09-20');
  await submit(page);
  await expect(page.locator('#cm-invalid')).toBeHidden();
  await expect(page.locator('#cm-all')).toHaveText('37', { timeout: 15_000 });
});

test('an invalid answer during the animation leaves the previous result to finish', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await submit(page);
  await page.locator('#cm-id').fill(' X ');
  await submit(page);
  await expect(page.locator('#cm-invalid')).toBeVisible();
  await expect(page.locator('#cm-all')).toHaveText('37', { timeout: 15_000 });
  await expect(page.locator('#cm-stage')).toHaveAttribute('data-state', 'done');
});

test('rapid submits settle on the last result', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await submit(page);
  await page.locator('#cm-stress').click();
  await expect(page.locator('#cm-all')).toHaveText('2,000', { timeout: 30_000 });
  await expect(page.locator('#cm-inc')).toHaveText('1,720');
  await page.waitForTimeout(2500);
  await expect(page.locator('#cm-all')).toHaveText('2,000');
  await expect(count(page, 88)).toHaveText('×2,000');
});

test('the ten tests run in the browser and pass', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#cm-run').click();
  await expect(page.locator('#cm-grid [data-status="ok"]')).toHaveCount(10, { timeout: 15_000 });
  await expect(page.locator('#cm-slam')).toHaveText('Ran 10 tests · OK');
  await expect(page.locator('#cm-cmd')).toHaveText(/^Ran 10 tests in \d+\.\d{3}s$/);
});

test('clearing leaves no data: shares are missing, not zero', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.locator('#cm-clear').click();
  await expect(page.locator('#cm-all')).toHaveText('0', { timeout: 15_000 });
  await expect(page.locator('#cm-yes-share')).toHaveText('—');
  await expect(page.locator('#cm-med')).toHaveText('—');
  await expect(page.locator('#cm-program-status')).toHaveText('没有可分析记录');
  await expect(page.locator('#cm-tag')).toBeHidden();
  await expect(page.locator('#cm-sample')).toBeEnabled();
});

test('blocked runtime hides the pipeline, says why, and a retry boots it', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await page.route('**/pyodide.asm.wasm', r => r.abort());
  await page.goto(PATH);
  await page.locator('#cm-stage').scrollIntoViewIfNeeded();
  await expect(page.locator('#cm-fallback')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('#cm-retry')).toBeVisible();
  await expect(page.locator('#cm-stage')).toBeHidden();
  await expect(page.locator('.framework li[data-step]')).toHaveCount(5);
  await expect(page.locator('.framework')).toBeVisible();
  await page.unroute('**/pyodide.asm.wasm');
  await page.locator('#cm-retry').click();
  await expect(page.locator('#cm-fallback')).toBeHidden();
  await expect(page.locator('#cm-stage')).toBeVisible();
  await expect(page.locator('#cm-chip')).toHaveClass(/live/, { timeout: 90_000 });
  await expect(page.locator('#cm-all')).toHaveText('36', { timeout: 20_000 });
});

test('the page loads no Python packages it does not need', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  const urls: string[] = [];
  page.on('request', r => urls.push(r.url()));
  await live(page);
  expect(urls.filter(u => u.endsWith('.whl'))).toEqual([]);
  expect(urls.some(u => u.endsWith('/downloads/campus/analysis.py'))).toBe(true);
  expect(urls.some(u => u.endsWith('/downloads/campus/test_analysis.py'))).toBe(true);
});

test('reduced motion shows the final state without the boot show', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await live(page);
  await expect(page.locator('#cm-boot')).toBeHidden();
  await expect(page.locator('#cm-inc')).toHaveText('26');
  await expect(count(page, 97)).toHaveText('×26');
  await page.locator('#cm-run').click();
  await expect(page.locator('#cm-grid [data-status="ok"]')).toHaveCount(10, { timeout: 10_000 });
});

test('English page: English interface; the program\'s own messages stay in Chinese', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page, '/en');
  await expect(page.locator('#cm-title')).toHaveText('Live program: survey cleaning and statistics');
  await expect(page.locator('#cm-add')).toHaveText('Submit this answer');
  await page.locator('#cm-id').fill(' X ');
  await submit(page);
  await expect(page.locator('#cm-invalid')).toContainText('Validation failed');
  await expect(page.locator('#cm-invalid-msg')).toHaveText('第 37 条记录：匿名 ID 不应有首尾空格');
  await expect(page.locator('#cm-pstatus')).toContainText('(Chinese)');
  expect(await noHorizontalOverflow(page)).toBe(true);
});

test('phones wait for the start button before downloading the runtime', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone flow');
  const wasm: string[] = [];
  page.on('request', r => { if (r.url().endsWith('.wasm')) wasm.push(r.url()); });
  await page.goto(PATH);
  await page.locator('#cm-stage').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2000);
  expect(wasm).toEqual([]);
  await expect(page.locator('#cm-start-btn')).toContainText('MB');
  await page.locator('#cm-start-btn').click();
  await expect(page.locator('#cm-chip')).toHaveClass(/live/, { timeout: 90_000 });
  await expect(page.locator('#cm-all')).toHaveText('36', { timeout: 20_000 });
  expect(await noHorizontalOverflow(page)).toBe(true);
});

test('once the program runs, the live stage has no serious accessibility issue', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });   // contrast is a content check, not measured mid-fade
  const { violations } = await new AxeBuilder({ page }).include('#cm-stage').analyze();
  const bad = violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
  expect(bad.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([]);
});
test('the pipeline stops drawing once it is still, and wakes for the next answer', async ({ page, isMobile }) => {
  desktopOnly(!!isMobile);
  await live(page);
  await expect(page.locator('#cm-pipe')).toHaveAttribute('data-idle', 'true', { timeout: 5_000 });
  await submit(page);
  await expect(page.locator('#cm-pipe')).toHaveAttribute('data-idle', 'false');
  await expect(page.locator('#cm-all')).toHaveText('37', { timeout: 15_000 });
  await expect(page.locator('#cm-pipe')).toHaveAttribute('data-idle', 'true', { timeout: 5_000 });
});
