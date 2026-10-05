import { test, expect } from '@playwright/test';
import { PAGES } from './helpers';

const ORIGIN = 'https://chiwawafromkk.github.io';
const meta = (html: string, prop: string) => html.match(new RegExp(`<meta property="${prop.replace(/:/g, ':')}" content="([^"]*)"`))?.[1];

// Reads each page's HTML directly (no rendering), so heavy live demos cannot slow this check down.
test('every page names a share picture that exists, 1200 × 630', async ({ request, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  const seen = new Set<string>();
  for (const p of PAGES) {
    const html = await (await request.get(p)).text();
    const img = meta(html, 'og:image');
    expect(img, p).toMatch(new RegExp(`^${ORIGIN}/og/[a-z-]+\\.jpg$`));
    expect(meta(html, 'og:image:width'), p).toBe('1200');
    expect(meta(html, 'og:image:height'), p).toBe('630');
    seen.add(img!.slice(ORIGIN.length));
  }
  for (const u of seen) {
    const r = await request.get(u);
    expect(r.status(), u).toBe(200);
    expect(r.headers()['content-type'], u).toContain('image/jpeg');
  }
  expect(seen).toContain('/og/jung-self-map.jpg');
  expect(seen).toContain('/og/mais-je-taime.jpg');
});
