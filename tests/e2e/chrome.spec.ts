import { test, expect } from '@playwright/test';
import { noHorizontalOverflow } from './helpers';

test('404 page is bilingual and links home in both languages', async ({ page }) => {
  const res = await page.goto('/no-such-page/');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('页面不存在');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Page not found');
  await expect(page.locator('main a[href="/"]')).toBeVisible();
  await expect(page.locator('main a[href="/en/"]')).toBeVisible();
  expect(await noHorizontalOverflow(page)).toBe(true);
});

test('nav switches language to the same page', async ({ page }) => {
  await page.goto('/no-such-page/');
  const lang = page.locator('header.nav a.lang');
  await expect(lang).toHaveAttribute('href', '/en/404/');
  await expect(page.locator('header.nav a[href="/brief/"]')).toBeVisible();
  await expect(page.locator('header.nav a.nav__resume')).toHaveAttribute('href', '/downloads/resume/heyanjun-resume-zh.pdf');
});
