import { test, expect } from '@playwright/test';
import { trackProjects } from '../../src/data/tracks';
import { motionOff, noHorizontalOverflow } from './helpers';

const PAGES = ['/hris/projects/hris-workflow/', '/hris/projects/ai-career/', '/hris/projects/campus-delivery/', '/hris/projects/ai-campus/', '/hris/projects/quota-deck/',
  '/hris/projects/ai-career/live/', '/hris/projects/ai-campus/live/', '/hris/projects/quota-deck/live/', '/hris/projects/campus-delivery/insights/'];

for (const p of PAGES) {
  test(`${p} is an HRIS page whose own links stay in the track`, async ({ page }) => {
    await motionOff(page);
    await page.goto(p);
    expect(await page.evaluate(() => document.documentElement.dataset.track)).toBe('hris');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    const pageLinks = await page.locator('a[href^="/"]').evaluateAll(as => as.map(a => a.getAttribute('href')!).filter(h => !/^\/(downloads|assets|media|og|favicon)/.test(h)));
    for (const h of pageLinks) expect(h, p).toMatch(/^\/(en\/)?hris\//);
    expect(await noHorizontalOverflow(page)).toBe(true);
  });
}

test('the pager walks the HRIS order', async ({ page }) => {
  await motionOff(page);
  await page.goto('/hris/projects/hris-workflow/');
  const next = trackProjects('hris')[1];
  await expect(page.locator('.p-pager a').last()).toHaveAttribute('href', `/hris${next.href}`);
});

test('dark theme: demos sit on a light panel and stay readable', async ({ page }) => {
  await motionOff(page);
  await page.addInitScript(() => { try { localStorage.setItem('hyj-hris-theme', 'dark'); } catch { /* blocked */ } });
  await page.goto('/hris/projects/ai-career/');
  const demo = page.locator('[data-demo]').first();
  const bg = await demo.evaluate(el => getComputedStyle(el).backgroundColor);
  expect(bg).toBe('rgb(244, 243, 239)');
  const body = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(body).not.toBe('rgb(244, 243, 239)');
});

test('the main site pages are untouched by the HRIS skin', async ({ page }) => {
  await motionOff(page);
  await page.goto('/projects/ai-career/');
  expect(await page.evaluate(() => document.documentElement.dataset.track)).toBeUndefined();
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
});
