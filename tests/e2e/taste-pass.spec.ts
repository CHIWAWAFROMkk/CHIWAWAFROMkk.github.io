import { test, expect, type Page } from '@playwright/test';
import { SITE } from '../../src/data/site';
import { skipIntro, motionOff, noHorizontalOverflow } from './helpers';

/** Visible elements with their own text, outside demos, code and drawings, set below 13px. */
const smallText = (page: Page) => page.evaluate(() => [...document.querySelectorAll('main *, footer *')].filter(el => {
  if (el.closest('[data-demo], pre, code, svg, [data-ui]')) return false;
  if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent!.trim())) return false;
  if (el.getClientRects().length === 0 || getComputedStyle(el).visibility === 'hidden') return false;
  return parseFloat(getComputedStyle(el).fontSize) < 13;
}).map(el => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}: ${el.textContent!.trim().slice(0, 20)}`));

test.beforeEach(async ({ page }) => { await skipIntro(page); await motionOff(page); });

for (const path of ['/', '/brief/', '/projects/', '/projects/ai-career/', '/projects/hris-workflow/', '/en/projects/']) {
  test(`${path}: no reading text under 13px`, async ({ page }) => {
    await page.goto(path);
    expect(await smallText(page)).toEqual([]);
  });
}

test('project card summaries are set at 16px', async ({ page }) => {
  await page.goto('/projects/');
  expect(await page.locator('.prow__did').first().evaluate(el => getComputedStyle(el).fontSize)).toBe('16px');
});

test('prose paragraphs keep a readable measure', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop measure');
  await page.goto('/projects/ai-career/');
  const widest = await page.locator('article.prose p').evaluateAll(ps => Math.max(...ps.map(p => p.getBoundingClientRect().width / parseFloat(getComputedStyle(p).fontSize))));
  expect(widest).toBeLessThanOrEqual(36.5);
});

test('home: the projects door shows three real product screenshots on wide screens', async ({ page, isMobile }) => {
  await page.goto('/');
  const shots = page.locator('a.door--ink .door__shots img');
  await expect(shots).toHaveCount(3);
  if (isMobile) { await expect(page.locator('.door__shots')).toBeHidden(); return; }
  await expect(page.locator('.door__shots')).toBeVisible();
  for (const img of await shots.all()) expect(await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  expect(await noHorizontalOverflow(page)).toBe(true);
});

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test(`overview (${lang}): real screenshots of the running projects, captioned and linked`, async ({ page }) => {
    await page.goto(`${prefix}/brief/`);
    const items = page.locator('.shots figure');
    await expect(items).toHaveCount(3);
    for (const fig of await items.all()) {
      const img = fig.locator('img');
      await img.scrollIntoViewIfNeeded();
      await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
      expect((await img.getAttribute('alt'))!.length).toBeGreaterThan(4);
      await expect(fig.locator('figcaption')).toContainText(SITE.shots.real[lang]);
      await expect(fig.locator('a')).toHaveAttribute('href', new RegExp(`^${prefix}/projects/.+/live/$`));
    }
    expect(await noHorizontalOverflow(page)).toBe(true);
  });
}

test('overview screenshots sit flush in their frames (no dark band under a picture)', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'three columns');
  await page.goto('/brief/');
  const gaps = await page.locator('.shots a').evaluateAll(as => as.map(a => Math.abs(a.getBoundingClientRect().height - a.querySelector('img')!.getBoundingClientRect().height)));
  for (const g of gaps) expect(g).toBeLessThan(1);
});

test('home: the door screenshots are shown in their own colours, large enough to read as pictures', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'wide screens only');
  await page.goto('/');
  const img = page.locator('.door__shots img').first();
  expect(await img.evaluate(el => getComputedStyle(el).filter)).toBe('none');
  expect((await img.boundingBox())!.width).toBeGreaterThanOrEqual(180);
});

test('home: on a short wide window the door screenshots never touch the big word', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'wide screens only');
  await page.setViewportSize({ width: 1440, height: 640 });
  await page.goto('/');
  const shots = (await page.locator('.door__shots').boundingBox())!;
  const big = (await page.locator('a.door--ink .door__big').boundingBox())!;
  expect(shots.y + shots.height).toBeLessThanOrEqual(big.y - 8);
});
