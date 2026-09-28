import { test, expect } from '@playwright/test';
import { FACTS, fact } from '../../src/data/facts';
import { SITE } from '../../src/data/site';
import { noHorizontalOverflow } from './helpers';

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test.describe(`brief (${lang})`, () => {
    test('who, availability, main experience and contact are all present', async ({ page }) => {
      await page.goto(`${prefix}/brief/`);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(SITE.name[lang]);
      for (const id of ['F1', 'F2', 'F3', 'F5', 'F6', 'F8'] as const) {
        await expect(page.getByText(fact(id).text[lang], { exact: false }).first(), id).toBeVisible();
      }
      expect(await page.locator('main').innerText()).not.toContain(fact('F4').text[lang]);
      await expect(page.locator('.contact--red a[href^="mailto:"]')).toBeVisible();
      await expect(page.locator(`.contact--red a[href="${SITE.resume[lang]}"]`)).toBeVisible();
    });

    test('every display number carries a ledger id and a caption', async ({ page }) => {
      await page.goto(`${prefix}/brief/`);
      const nums = await page.locator('.num[data-fact]').evaluateAll(els =>
        els.map(el => ({ id: el.getAttribute('data-fact')!, text: el.textContent!.trim(), caption: el.closest('.evidence')?.querySelector('.evidence__caption')?.textContent?.trim() ?? '' })),
      );
      expect(nums.length).toBeGreaterThan(0);
      for (const n of nums) {
        expect(Object.keys(FACTS)).toContain(n.id);
        expect(FACTS[n.id as keyof typeof FACTS].figure).toBe(n.text);
        expect(n.caption.length, n.id).toBeGreaterThan(8);
      }
      expect(await page.locator('.num:not([data-fact])').count()).toBe(0);
    });

    test('language switch stays on the overview page', async ({ page }) => {
      await page.goto(`${prefix}/brief/`);
      await expect(page.locator('header.nav a.lang')).toHaveAttribute('href', lang === 'en' ? '/brief/' : '/en/brief/');
    });

    test('project rows link to their deep pages', async ({ page }) => {
      await page.goto(`${prefix}/brief/`);
      const hrefs = await page.locator('a.prow, a.b-film__row').evaluateAll(as => as.map(a => a.getAttribute('href')));
      const expected = SITE.projects.filter(p => p.inBrief).map(p => `${prefix}${p.href}`);
      expect(hrefs.sort()).toEqual(expected.sort());
    });

    test('film clips are labelled in the page language; layout does not overflow', async ({ page }) => {
      await page.goto(`${prefix}/brief/`);
      const labels = await page.locator('[data-reel] video').evaluateAll(vs => vs.map(v => v.getAttribute('aria-label') ?? ''));
      expect(labels).toEqual(SITE.film.clips.map(c => `${c.shot} ${c.title[lang]}`));
      expect(await noHorizontalOverflow(page)).toBe(true);
    });
  });
}
