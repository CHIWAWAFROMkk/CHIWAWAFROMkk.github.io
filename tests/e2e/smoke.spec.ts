import { test, expect } from '@playwright/test';

test('site builds and legacy URLs survive', async ({ request }) => {
  const home = await request.get('/');
  expect(home.status()).toBe(200);
  expect(await home.text()).toContain('何彦钧');
  for (const url of [
    '/assets/fonts.css',
    '/assets/fonts/BarlowCondensed-Bold.ttf',
    '/favicon.svg',
    '/media/mais-je-taime/s04.webp',
    encodeURI('/downloads/hris/HRIS方案.md'),
    '/downloads/delivery/init.sql',
  ]) {
    expect((await request.get(url)).status(), url).toBe(200);
  }
});
