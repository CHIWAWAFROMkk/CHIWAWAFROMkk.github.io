import { test, expect } from '@playwright/test';
import { fact } from '../../src/data/facts';
import { SITE } from '../../src/data/site';
import { noHorizontalOverflow } from './helpers';

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test.describe(`brief (${lang})`, () => {
    test('who, availability, projects and contact are all present', async ({ page }) => {
      await page.goto(`${prefix}/brief/`);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(SITE.name[lang]);
      for (const id of ['F1', 'F2', 'F3', 'F8'] as const) {
        await expect(page.getByText(fact(id).text[lang], { exact: false }).first(), id).toBeVisible();
      }
      expect(await page.locator('main').innerText()).not.toContain(fact('F4').text[lang]);
      await expect(page.locator('.contact--red a[href^="mailto:"]')).toBeVisible();
      await expect(page.locator(`.contact--red a[href="${SITE.resume[lang]}"]`)).toBeVisible();
    });

    test('the AI overview leaves the internship record to the HRIS site and singles out no project', async ({ page }) => {
      await page.goto(`${prefix}/brief/`);
      const main = await page.locator('main').innerText();
      for (const id of ['F5', 'F6', 'F16'] as const) expect(main, id).not.toContain(fact(id).text[lang]);
      await expect(page.locator('#b-exp')).toHaveCount(0);
      await expect(page.locator('main .num')).toHaveCount(0);
      const shots = await page.locator('.shots a').evaluateAll(as => as.map(a => a.getAttribute('href')));
      expect(shots).toEqual([`${prefix}/projects/ai-career/live/`, `${prefix}/projects/ai-campus/live/`]);
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
