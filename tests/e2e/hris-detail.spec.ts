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

/** Contrast of an element's text against the first opaque background up its ancestors. */
const textContrast = (el: Element): number => {
  const rgb = (s: string) => (s.match(/[\d.]+/g) ?? []).map(Number);
  const lum = ([r, g, b]: number[]) => { const f = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  let bg: number[] | undefined, n: Element | null = el;
  while (n && !bg) { const c = rgb(getComputedStyle(n).backgroundColor); if (c.length === 3 || (c.length === 4 && c[3] === 1)) bg = c.slice(0, 3); n = n.parentElement; }
  const a = lum(rgb(getComputedStyle(el).color)), b = lum(bg ?? [255, 255, 255]);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

test('dark theme: the records-backfill demo keeps its selected record visible and its notes readable', async ({ page }) => {
  await motionOff(page);
  await page.addInitScript(() => { try { localStorage.setItem('hyj-hris-theme', 'dark'); } catch { /* blocked */ } });
  await page.goto('/hris/projects/hris-workflow/');
  const panel = await page.locator('.demo').evaluate(el => getComputedStyle(el).backgroundColor);
  expect(await page.locator('.demo__case[aria-pressed="true"]').evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe(panel);
  expect(await page.locator('.demo__case').last().evaluate(el => getComputedStyle(el).borderTopColor)).not.toBe(panel);
  for (const sel of ['.demo__intro', '.demo__next', '.demo__line-step'])
    expect(await page.locator(sel).first().evaluate(textContrast), sel).toBeGreaterThanOrEqual(4.5);
});

test('dark theme: inline code in project prose is readable', async ({ page }) => {
  await motionOff(page);
  await page.addInitScript(() => { try { localStorage.setItem('hyj-hris-theme', 'dark'); } catch { /* blocked */ } });
  await page.goto('/hris/projects/campus-delivery/');
  expect(await page.locator('.prose code').first().evaluate(textContrast)).toBeGreaterThanOrEqual(4.5);
});
