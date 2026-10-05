import { test, expect } from '@playwright/test';

test('site builds and legacy URLs survive', async ({ request }) => {
  const home = await request.get('/');
  expect(home.status()).toBe(200);
  expect(await home.text()).toContain('何彦钧');
  for (const url of [
    '/assets/fonts.css',
    '/assets/fonts/BarlowCondensed-Bold.ttf',          // legacy URL kept; pages now load the WOFF2
    '/assets/fonts/BarlowCondensed-Bold.woff2',
    '/favicon.svg',
    '/media/mais-je-taime/video/s04.webp',
    '/media/mais-je-taime/video/s04.mp4',
    encodeURI('/downloads/hris/HRIS方案.md'),
    '/downloads/delivery/init.sql',
    '/assets/vendor/sql-wasm.wasm',
    '/assets/delivery-worker.js',
    '/assets/delivery-core.mjs',
    '/assets/delivery-schema.sql',
    '/assets/sample.csv',
    '/assets/editorial/delivery-relations.svg',
  ]) {
    expect((await request.get(url)).status(), url).toBe(200);
  }
});
