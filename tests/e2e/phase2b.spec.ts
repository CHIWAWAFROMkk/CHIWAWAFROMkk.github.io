import { test, expect } from '@playwright/test';
import { SITE } from '../../src/data/site';
import { fact } from '../../src/data/facts';
import { noHorizontalOverflow } from './helpers';

const PAGES = [['ai-career', 'career'], ['quota-deck', 'quota'], ['ai-campus', 'aiCampus']] as const;

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  for (const [slug, key] of PAGES) {
    test(`${slug} (${lang}) has its title, five-row summary and body`, async ({ page }) => {
      await page.goto(`${prefix}/projects/${slug}/`);
      const P = SITE.pages[key];
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(P.title[lang]);
      await expect(page.locator('.p-summary .p-row')).toHaveCount(5);
      await expect(page.locator('.p-summary')).toContainText(P.summary.mine[lang]);
      await expect(page.locator('article.prose h2').first()).toBeVisible();
      expect(await noHorizontalOverflow(page)).toBe(true);
    });
  }

  test(`AI campus study (${lang}) carries the award in its tags`, async ({ page }) => {
    await page.goto(`${prefix}/projects/ai-campus/`);
    await expect(page.locator('.p-tags')).toContainText(fact('F9').text[lang]);
  });
}

test('every download and image on the three pages resolves', async ({ page, request }) => {
  const found = new Set<string>();
  for (const [slug] of PAGES) {
    await page.goto(`/projects/${slug}/`);
    for (const u of await page.locator('a[href^="/downloads/"], a[href^="/assets/"], img[src^="/"]').evaluateAll(els => els.map(e => e.getAttribute('href') ?? e.getAttribute('src')!))) found.add(u);
  }
  expect(found.size).toBeGreaterThan(6);
  for (const u of found) expect((await request.get(u)).status(), u).toBe(200);
});

test('QuotaDeck shows three interface screenshots, labelled as demo data', async ({ page }) => {
  await page.goto('/projects/quota-deck/');
  const shots = page.locator('.qshots figure[data-shot]');
  await expect(shots).toHaveCount(3);
  await expect(page.locator('.qshots')).toContainText('演示数据');
  for (const i of [0, 1, 2]) {
    const img = shots.nth(i).locator('img');
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
  expect(await noHorizontalOverflow(page)).toBe(true);
});

test('the AI campus framework lists its five stages in order', async ({ page }) => {
  await page.goto('/projects/ai-campus/');
  const steps = page.locator('.framework li[data-step]');
  await expect(steps).toHaveCount(5);
  await expect(steps.first()).toContainText('任务定义');
  await expect(steps.last()).toContainText('独立验收');
  await page.goto('/en/projects/ai-campus/');
  await expect(page.locator('.framework li[data-step]').first()).toContainText('Define the task');
});
