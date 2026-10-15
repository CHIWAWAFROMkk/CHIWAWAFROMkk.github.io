import { test, expect } from '@playwright/test';
import { motionOff } from './helpers';

const isPage = (h: string) => h.startsWith('/') && !/^\/(downloads|assets|media|og|favicon)/.test(h) && !h.startsWith('//');

test('crawl: every page link reachable from /hris/ stays under /hris/', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  test.setTimeout(180000);
  await motionOff(page);
  const seen = new Set<string>(), queue = ['/hris/', '/en/hris/'], leaks: string[] = [];
  while (queue.length) {
    const url = queue.shift()!;
    if (seen.has(url)) continue;
    seen.add(url);
    const res = await page.goto(url);
    expect(res!.status(), url).toBe(200);
    await expect(page.locator('meta[name="robots"]'), url).toHaveAttribute('content', 'noindex, nofollow');
    const hrefs = await page.locator('a[href]').evaluateAll(as => as.map(a => a.getAttribute('href')!.split('#')[0]).filter(Boolean));
    for (const h of hrefs.filter(isPage)) {
      if (!/^\/(en\/)?hris\//.test(h)) leaks.push(`${url} → ${h}`);
      else if (!seen.has(h)) queue.push(h);
    }
  }
  expect(leaks).toEqual([]);
  expect(seen.size).toBeGreaterThanOrEqual(26);
});

test('the main site never links to /hris/', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  test.setTimeout(120000);
  await motionOff(page);
  for (const url of ['/', '/brief/', '/projects/', '/projects/hris-workflow/', '/projects/ai-career/', '/projects/ai-career/live/', '/en/', '/en/projects/']) {
    await page.goto(url);
    // /downloads/hris/ holds the solution document, a file the main site offers; only pages of the track count.
    expect(await page.locator('a[href^="/hris/"], a[href^="/en/hris/"]').count(), url).toBe(0);
  }
});

test('the sitemap lists no /hris/ page', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  expect(xml).not.toContain('/hris/');
});
