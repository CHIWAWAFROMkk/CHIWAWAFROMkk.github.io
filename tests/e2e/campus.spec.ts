import { test, expect } from '@playwright/test';
import { noHorizontalOverflow } from './helpers';

const status = '#sql-status';

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test.describe(`campus delivery (${lang})`, () => {
    test('the SQL engine is not downloaded until the workbench comes into view', async ({ page, isMobile }) => {
      test.skip(!!isMobile, 'run once');
      const wasm: string[] = [];
      page.on('request', r => { if (r.url().endsWith('.wasm')) wasm.push(r.url()); });
      await page.goto(`${prefix}/projects/campus-delivery/`);
      await page.waitForTimeout(800);
      expect(wasm).toEqual([]);
      await page.locator('[data-campus]').scrollIntoViewIfNeeded();
      await expect(page.locator(status)).toHaveText(lang === 'zh' ? /\d+ 行/ : /\d+ rows?/, { timeout: 20000 });
      expect(wasm.length).toBe(1);
      expect(await page.locator('#sql-results tbody tr').count()).toBeGreaterThan(0);
    });

    test('placing an order and refunding it updates the order list', async ({ page }) => {
      await page.goto(`${prefix}/projects/campus-delivery/`);
      await page.locator('#order-form').scrollIntoViewIfNeeded();
      await expect(page.locator('#place-order')).toBeEnabled({ timeout: 20000 });
      await page.locator('#place-order').click();
      await expect(page.locator('#order-status')).toContainText(lang === 'zh' ? '已提交' : 'placed');
      await page.locator('[data-refund]').first().click();
      await expect(page.locator('#order-status')).toContainText(lang === 'zh' ? '已全额退款' : 'refunded');
      expect(await noHorizontalOverflow(page)).toBe(true);
    });

    test('an out-of-range quantity is refused in the page language', async ({ page, isMobile }) => {
      test.skip(!!isMobile, 'run once');
      await page.goto(`${prefix}/projects/campus-delivery/`);
      await page.locator('#order-form').scrollIntoViewIfNeeded();
      await expect(page.locator('#place-order')).toBeEnabled({ timeout: 20000 });
      await page.locator('#quantity').evaluate(el => { (el as HTMLInputElement).removeAttribute('max'); (el as HTMLInputElement).value = '25'; });
      await page.locator('#place-order').click();
      await expect(page.locator('#order-status')).toContainText(lang === 'zh' ? '份数须为 1–20 的整数' : 'Quantity must be a whole number from 1 to 20');
    });

    test('an analysis card jumps to its query in the workbench', async ({ page, isMobile }) => {
      test.skip(!!isMobile, 'run once');
      await page.goto(`${prefix}/projects/campus-delivery/`);
      await page.locator('[data-jump="7"]').click();
      await expect(page.locator('#query-preset')).toHaveValue('7');
      await expect(page.locator('#sql-input')).toHaveValue(/unit_price_cents/);
    });
  });
}

test('first interaction boots the engine even before it scrolls into view', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.goto('/projects/campus-delivery/');
  await page.locator('#sql-input').focus();
  await expect(page.locator(status)).toHaveText(/\d+ 行/, { timeout: 20000 });
});

test('engine fails to load: a readable error, the rest of the page still works', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.route('**/*.wasm', r => r.abort());
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/projects/campus-delivery/');
  await page.locator('[data-campus]').scrollIntoViewIfNeeded();
  await expect(page.locator(status)).toHaveAttribute('data-error', 'true', { timeout: 25000 });
  await expect(page.locator(status)).toContainText('SQLite 引擎未能下载');
  await expect(page.locator(status)).not.toContainText(/XMLHttpRequest|NetworkError|Aborted/);
  await expect(page.locator('#run-query')).toBeDisabled();
  await expect(page.locator('#cancel-query')).toBeDisabled();
  // After a failed load, the keyboard shortcut must not bring dead controls back to life.
  await page.locator('#sql-input').focus();
  await page.keyboard.press('Control+Enter');
  await expect(page.locator('#run-query')).toBeDisabled();
  await expect(page.locator('#place-order')).toBeDisabled();
  await expect(page.locator(status)).toContainText('SQLite 引擎未能下载');
  await expect(page.locator('.prose h2').first()).toBeVisible();
  expect(errors).toEqual([]);
});
