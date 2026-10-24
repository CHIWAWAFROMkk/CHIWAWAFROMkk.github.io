import { test, expect } from '@playwright/test';
import { SITE } from '../../src/data/site';
import { HRIS } from '../../src/data/hris';

test('both résumés download as PDF', async ({ request }) => {
  for (const url of [SITE.resume.zh, SITE.resume.en]) {
    const res = await request.get(url);
    expect(res.status(), url).toBe(200);
    expect(res.headers()['content-type'], url).toContain('application/pdf');
  }
});

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test(`HRIS (${lang}): the top bar offers the HR résumé, and it downloads as PDF`, async ({ page, request }) => {
    await page.goto(`${prefix}/hris/`);
    await expect(page.locator('a.h-top__cv')).toHaveAttribute('href', HRIS.resumeFile[lang]);
    const res = await request.get(HRIS.resumeFile[lang]);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/pdf');
  });
}
