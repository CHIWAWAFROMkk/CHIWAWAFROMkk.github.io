import { test, expect } from '@playwright/test';
import { HRIS } from '../../src/data/hris';
import { trackProjects } from '../../src/data/tracks';
import { fact } from '../../src/data/facts';
import { motionOff, noHorizontalOverflow } from './helpers';

const skipHrisIntro = (page: import('@playwright/test').Page) => page.addInitScript(() => { try { localStorage.setItem('hyj-hris-intro-seen', '1'); } catch { /* blocked */ } });

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test(`HRIS home (${lang}): headline, lead, availability, ledger and projects`, async ({ page }) => {
    await skipHrisIntro(page);
    await motionOff(page);
    await page.goto(`${prefix}/hris/`);
    expect(await page.evaluate(() => document.documentElement.dataset.track)).toBe('hris');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(HRIS.hero.title[lang] + HRIS.hero.titleSoft[lang]);
    await expect(page.locator('.h-lead')).toHaveText(HRIS.hero.lead[lang]);
    await expect(page.locator('.h-avail')).toHaveText(fact('F3').text[lang]);
    await expect(page.locator('.h-ledger__num')).toHaveText(HRIS.ledger.map(l => l.figure));
    const hrefs = await page.locator('.h-work a.h-work__title').evaluateAll(as => as.map(a => a.getAttribute('href')));
    expect(hrefs).toEqual(trackProjects('hris').map(p => `${prefix}/hris${p.href}`));
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    expect(await noHorizontalOverflow(page)).toBe(true);
  });
}

test('HRIS pages use system fonts, not the main site\'s web fonts', async ({ page }) => {
  await skipHrisIntro(page);
  const fonts: string[] = [];
  page.on('request', r => { if (r.resourceType() === 'font' || r.url().endsWith('fonts.css')) fonts.push(r.url()); });
  await page.goto('/hris/');
  await page.waitForLoadState('networkidle');
  expect(fonts).toEqual([]);
});

test('theme: dark by default even on a light system; the switch flips it and remembers', async ({ page }) => {
  await skipHrisIntro(page);
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/hris/');
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(11, 12, 14)');
  await page.locator('[data-theme-toggle]').click();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('light');
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('light');
});

test('storage blocked: theme still toggles on this page', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/hris/');
  await page.keyboard.press('Escape');
  await page.locator('[data-theme-toggle]').click();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('light');
  expect(errors).toEqual([]);
});

test('phone: the headline and lead are on the first screen', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone');
  await skipHrisIntro(page);
  await motionOff(page);
  await page.goto('/hris/');
  const vh = page.viewportSize()!.height;
  for (const sel of ['h1', '.h-lead']) {
    const box = (await page.locator(sel).boundingBox())!;
    expect(box.y, sel).toBeLessThan(vh);
  }
});

for (const prefix of ['', '/en']) {
  test(`phone${prefix}: every HRIS nav item is on screen, none hidden in a sideways strip`, async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phone');
    await page.addInitScript(() => { try { localStorage.setItem('hyj-hris-intro-seen', '1'); } catch { /* blocked */ } });
    await page.goto(`${prefix}/hris/`);
    const vw = page.viewportSize()!.width;
    for (const r of await page.locator('.h-top__nav a').evaluateAll(as => as.map(a => a.getBoundingClientRect().right)))
      expect(r).toBeLessThanOrEqual(vw);
    expect(await page.locator('.h-top__nav').evaluate(n => n.scrollWidth <= n.clientWidth)).toBe(true);
  });
}

test('phone: language, theme and résumé buttons are thumb-sized', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone');
  await page.addInitScript(() => { try { localStorage.setItem('hyj-hris-intro-seen', '1'); } catch { /* blocked */ } });
  await page.goto('/hris/');
  for (const h of await page.locator('.h-top__util > *').evaluateAll(els => els.map(e => e.getBoundingClientRect().height)))
    expect(h).toBeGreaterThanOrEqual(40);
});
