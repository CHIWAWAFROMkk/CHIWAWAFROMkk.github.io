import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { deriveFacts, formatFact, type Results } from '../../src/scripts/insights-facts';
import { SITE } from '../../src/data/site';
import { storyLayouts } from '../../src/scripts/morph';

const R: Results = JSON.parse(readFileSync('src/data/insights.json', 'utf8')).results;
const FACTS = deriveFacts(R);
const PATH = '/projects/campus-delivery/insights/';

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test.describe(`insights page (${lang})`, () => {
    test('every insight number is the formatted query result', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`${prefix}${PATH}`);
      const nums = await page.locator('[data-insight-num]').evaluateAll(els => els.map(e => [e.getAttribute('data-insight-num')!, e.textContent!.trim()]));
      expect(nums.length).toBeGreaterThan(30);
      for (const [key, text] of nums) expect(text, key).toBe(formatFact(FACTS[key], lang));
    });

    test('six chapters, each of the first five with a data table; the summary states the division of work', async ({ page }) => {
      await page.goto(`${prefix}${PATH}`);
      await expect(page.locator('[data-chapter-section]')).toHaveCount(6);
      await expect(page.locator('[data-chapter-section] details table')).toHaveCount(5);
      await expect(page.locator('[data-stage] rect[data-m]')).toHaveCount(168);
      await expect(page.locator('.p-summary')).toContainText(SITE.pages.insights.summary.mine[lang]);
      await expect(page.locator('.p-summary')).toContainText(SITE.pages.insights.summary.status[lang]);
    });

    test('the method section lists every query and the downloads', async ({ page, request }) => {
      await page.goto(`${prefix}${PATH}`);
      await expect(page.locator('[data-method] pre')).toHaveCount(8);
      for (const href of ['/assets/insights/campus-term.sqlite', '/downloads/insights/insights-gen.mjs', '/downloads/insights/insights-queries.mjs']) {
        await expect(page.locator(`a[href="${href}"]`)).toHaveCount(1);
        expect((await request.get(href)).status()).toBe(200);
      }
    });

    test('the SQL page leads to the advanced page', async ({ page }) => {
      await page.goto(`${prefix}/projects/campus-delivery/`);
      await page.locator(`a[href="${prefix}${PATH}"]`).first().click();
      await expect(page).toHaveURL(new RegExp(`${prefix}${PATH}$`));
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(SITE.pages.insights.title[lang]);
    });
  });
}

const LAYOUTS = storyLayouts(R);
/** Scrolls so chapter i's top sits at 30% of the viewport (past the 55% reading line). */
async function toChapter(page: import('@playwright/test').Page, i: number) {
  await page.locator('[data-chapter-section]').nth(i).evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - innerHeight * 0.3));
}

test('scrolling morphs the stage chapter by chapter, and back', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop layout');
  await page.goto(PATH);
  const stage = page.locator('[data-stage]');
  const rect = page.locator('[data-stage] rect[data-m="0"]');
  const h1 = await rect.getAttribute('height');
  await toChapter(page, 2);
  await expect(stage).toHaveAttribute('data-chapter', '3');
  await expect(rect).not.toHaveAttribute('height', h1!);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(stage).toHaveAttribute('data-chapter', '1');
  await expect(rect).toHaveAttribute('height', h1!);
});

test('reduced motion snaps to each chapter\'s exact chart', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop layout');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(PATH);
  await toChapter(page, 1);
  await expect(page.locator('[data-stage]')).toHaveAttribute('data-chapter', '2');
  const m = LAYOUTS[1].marks[0];
  await expect(page.locator('[data-stage] rect[data-m="0"]')).toHaveAttribute('height', m.h.toFixed(1));
});

test('mobile: the stage stays pinned at the top while the chapters scroll', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile layout');
  await page.goto(PATH);
  await toChapter(page, 1);
  await expect(page.locator('[data-stage]')).toHaveAttribute('data-chapter', '2');
  const top = await page.locator('[data-stage]').evaluate(el => el.getBoundingClientRect().top);
  expect(Math.abs(top)).toBeLessThanOrEqual(1);
});

test('chapter numbers count up and land exactly on the query result', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.goto(PATH);
  await toChapter(page, 0);
  const n = page.locator('[data-chapter-section]').first().locator('[data-insight-num="lunchShare"]');
  await expect(n).toHaveText(formatFact(FACTS.lunchShare, 'zh'), { timeout: 3000 });
});
