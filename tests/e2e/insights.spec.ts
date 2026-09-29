import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { deriveFacts, formatFact, type Results } from '../../src/scripts/insights-facts';
import { SITE } from '../../src/data/site';
import { storyLayouts } from '../../src/scripts/morph';
import { loadSqlJs } from '../../tools/sqljs-node.mjs';
import { QUERIES, params } from '../../src/scripts/insights-queries.mjs';
import { kpiText } from '../../src/scripts/cockpit-text';

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

test('the rain ends on its own and leaves the real number', async ({ page }) => {
  await page.goto(PATH);
  const hero = page.locator('[data-rain]');
  await expect(hero).toHaveClass(/is-done/, { timeout: 4000 });
  await expect(hero.locator('canvas')).toHaveCount(0);
  await expect(hero.locator('[data-insight-num="orders"]')).toHaveText(formatFact(FACTS.orders, 'zh'));
  const color = await hero.locator('[data-rain-target] .inum').evaluate(el => getComputedStyle(el).color);
  expect(color).not.toBe('rgba(0, 0, 0, 0)');
});

test('a click ends the rain at once', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.goto(PATH);
  await page.mouse.click(5, 5);
  await expect(page.locator('[data-rain]')).toHaveClass(/is-done/, { timeout: 500 });
});

test('reduced motion skips the rain', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(PATH);
  await expect(page.locator('[data-rain]')).toHaveClass(/is-done/, { timeout: 500 });
  await expect(page.locator('[data-rain] canvas')).toHaveCount(0);
});

type F = { from: number; to: number; merchants: number[]; areas: string[] };
let SQLDB: any;
test.beforeAll(async () => {
  const SQL = await loadSqlJs();
  SQLDB = new SQL.Database(readFileSync('public/assets/insights/campus-term.sqlite'));
});
const kpiFor = (f: F) => {
  const s = SQLDB.prepare(QUERIES.kpi);
  s.bind(params(f));
  s.step();
  const v = s.get();
  s.free();
  return v as (number | null)[];
};
const ALLF: F = { from: 1, to: 16, merchants: [], areas: [] };

async function openCockpit(page: import('@playwright/test').Page, prefix = '') {
  await page.goto(`${prefix}${PATH}`);
  await page.locator('[data-cockpit]').scrollIntoViewIfNeeded();
  await expect(page.locator('#ck-from')).toBeEnabled({ timeout: 25000 });
}

test('before the engine loads, the dashboard already shows the whole term', async ({ page }) => {
  await page.goto(PATH);
  await expect(page.locator('[data-kpi="orders"]')).toHaveText(kpiText('orders', kpiFor(ALLF)[0], 'zh'));
  await expect(page.locator('[data-chart] rect[data-m]')).toHaveCount(168 * 4);
});

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test(`filters re-run the SQL and every indicator matches it (${lang})`, async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'run once');
    await openCockpit(page, prefix);
    await page.locator('#ck-from').fill('3');
    await page.locator('#ck-to').fill('9');
    await page.locator('input[name="area"][value="北区"]').check();
    const f: F = { from: 3, to: 9, merchants: [], areas: ['北区'] };
    const v = kpiFor(f);
    const ids = ['orders', 'net', 'aov', 'refund', 'minutes'] as const;
    for (const [i, id] of ids.entries()) await expect(page.locator(`[data-kpi="${id}"]`)).toHaveText(kpiText(id, v[i], lang));
  });
}

test('clicking a merchant bar filters by that merchant', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await openCockpit(page);
  const top = Number(R.merchants.values[0][0]);
  await page.locator('[data-chart="merchants"] rect[data-m="0"]').click();
  await expect(page.locator(`input[name="merchant"][value="${top}"]`)).toBeChecked();
  await expect(page.locator('[data-kpi="orders"]')).toHaveText(kpiText('orders', kpiFor({ ...ALLF, merchants: [top] })[0], 'zh'));
});

test('rapid changes settle on the last filter', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await openCockpit(page);
  for (const v of ['2', '3', '4', '5', '6', '7', '8']) await page.locator('#ck-from').fill(v);
  await expect(page.locator('[data-kpi="orders"]')).toHaveText(kpiText('orders', kpiFor({ ...ALLF, from: 8 })[0], 'zh'));
});

test('a filter with no orders shows dashes, not NaN', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  let empty: F | undefined;
  for (let m = 1; m <= 12 && !empty; m++) for (const a of ['东区', '西区', '南区', '北区']) {
    const f: F = { from: 16, to: 16, merchants: [m], areas: [a] };
    if (kpiFor(f)[0] === 0) { empty = f; break; }
  }
  test.skip(!empty, 'no empty combination in this data');
  await openCockpit(page);
  await page.locator('#ck-from').fill('16');
  await page.locator(`input[name="merchant"][value="${empty!.merchants[0]}"]`).check();
  await page.locator(`input[name="area"][value="${empty!.areas[0]}"]`).check();
  await expect(page.locator('[data-kpi="orders"]')).toHaveText('0');
  await expect(page.locator('[data-kpi="aov"]')).toHaveText('—');
  await expect(page.locator('#ck-status')).toContainText('没有订单');
  expect(await page.locator('[data-cockpit]').innerText()).not.toContain('NaN');
});

test('"View SQL" shows the exact query that ran', async ({ page }) => {
  await page.goto(PATH);
  const box = page.locator('[data-chart="heatmap"] details');
  await box.locator('summary').click();
  const squash = (s: string) => s.replace(/\s+/g, ' ').trim();
  expect(squash((await box.locator('pre[data-sql]').textContent())!)).toBe(squash(QUERIES.heatmap));
});

test('engine fails to load: the story stays whole, the dashboard explains itself', async ({ page }) => {
  await page.route('**/*.wasm', r => r.abort());
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(PATH);
  await page.locator('[data-cockpit]').scrollIntoViewIfNeeded();
  await expect(page.locator('#ck-status')).toHaveAttribute('data-error', 'true', { timeout: 25000 });
  await expect(page.locator('#ck-status')).toContainText('未能下载');
  await expect(page.locator('#ck-from')).toBeDisabled();
  await expect(page.locator('[data-kpi="orders"]')).toHaveText(kpiText('orders', kpiFor(ALLF)[0], 'zh'));
  await expect(page.locator('[data-chapter-section]')).toHaveCount(6);
  expect(errors).toEqual([]);
});
