import { test, expect } from '@playwright/test';
import { SITE } from '../../src/data/site';

const EDITIONS = [
  { slug: 'ai-career', key: 'careerLive', stage: '#cl-stage', light: '[data-career]' },
  { slug: 'ai-campus', key: 'campusLive', stage: '#cm-stage', light: '.framework' },
  { slug: 'quota-deck', key: 'quotaLive', stage: '#qd-stage', light: '.qshots' },
] as const;
const HEAVY = /\/assets\/vendor\/pyodide\/|\/assets\/quotadeck\/|\.whl$/;

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  for (const e of EDITIONS) {
    test(`${e.slug} (${lang}): the simple page is light and leads to the full edition`, async ({ page }) => {
      const heavy: string[] = [];
      page.on('request', r => { if (HEAVY.test(r.url())) heavy.push(r.url()); });
      await page.goto(`${prefix}/projects/${e.slug}/`);
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } });
      await page.waitForTimeout(1500);
      await expect(page.locator(e.stage)).toHaveCount(0);
      expect(heavy).toEqual([]);
      const teaser = page.locator(`a.edition-teaser[href="${prefix}/projects/${e.slug}/live/"]`);
      await expect(teaser).toBeVisible();
      const [t, body] = await Promise.all([teaser.evaluate(el => el.getBoundingClientRect().top + scrollY), page.locator('article.prose').evaluate(el => el.getBoundingClientRect().top + scrollY)]);
      expect(t).toBeLessThan(body);
    });
    test(`${e.slug} (${lang}): the full edition has its title, summary, live program, fallback and a way back`, async ({ page }) => {
      await page.goto(`${prefix}/projects/${e.slug}/live/`);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(SITE.pages[e.key].title[lang]);
      await expect(page.locator('.p-summary .p-row')).toHaveCount(5);
      await expect(page.locator(e.stage)).toHaveCount(1);
      await expect(page.locator(e.light).first()).toBeAttached();
      await expect(page.locator(`article.prose a[href="${prefix}/projects/${e.slug}/"]`)).toBeVisible();
    });
  }
}

test('the projects index lists each full edition right after its project', async ({ page }) => {
  await page.goto('/projects/');
  const hrefs = await page.locator('main a[href^="/projects/"]').evaluateAll(els => els.map(e => e.getAttribute('href')));
  for (const e of EDITIONS) {
    const i = hrefs.indexOf(`/projects/${e.slug}/`);
    expect(hrefs[i + 1], e.slug).toBe(`/projects/${e.slug}/live/`);
  }
});
