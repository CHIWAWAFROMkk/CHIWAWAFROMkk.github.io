import { test, expect } from '@playwright/test';
import { PHASE1_PAGES, PHASE2_PENDING, skipIntro } from './helpers';

test('every internal link resolves (phase-2 pages excepted)', async ({ page, request, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await skipIntro(page);
  const found = new Set<string>();
  for (const p of PHASE1_PAGES) {
    await page.goto(p);
    const hrefs = await page.locator('a[href]').evaluateAll(as => as.map(a => a.getAttribute('href') ?? ''));
    for (const h of hrefs) if (h.startsWith('/') && !h.startsWith('//')) found.add(h.split('#')[0]);
  }
  const broken: string[] = [];
  for (const h of found) {
    if (PHASE2_PENDING.has(decodeURI(h))) continue;
    if ((await request.get(h)).status() !== 200) broken.push(h);
  }
  expect(broken).toEqual([]);
});
