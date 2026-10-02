import { test, expect } from '@playwright/test';

// Every HTML address of the old site (git ls-tree origin/main @ 90cd241), plus its sitemap.
const LEGACY = ['/', '/404.html', '/privacy/', '/projects/ai-campus/', '/projects/ai-career/', '/projects/campus-delivery/',
  '/projects/hris-workflow/', '/projects/mais-je-taime/', '/projects/quota-deck/', '/projects/stock-data/',
  '/projects/stock-data/method/', '/downloads/delivery/web-source/page.html', '/sitemap.xml'];

test('every address of the old site still opens', async ({ request, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  const bad: string[] = [];
  for (const p of LEGACY) if ((await request.get(p)).status() !== 200) bad.push(p);
  expect(bad).toEqual([]);
});

test('the sitemap lists both languages of the new pages', async ({ request, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  const xml = await (await request.get('/sitemap.xml')).text();
  for (const p of ['/projects/mais-je-taime/', '/en/projects/mais-je-taime/', '/privacy/', '/en/privacy/', '/projects/stock-data/method/'])
    expect(xml).toContain(`<loc>https://chiwawafromkk.github.io${p}</loc>`);
});
