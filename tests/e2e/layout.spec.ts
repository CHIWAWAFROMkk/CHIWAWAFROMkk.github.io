import { test, expect } from '@playwright/test';
import { PAGES, skipIntro, noHorizontalOverflow } from './helpers';

for (const p of PAGES) {
  test(`layout ${p}`, async ({ page }, info) => {
    await skipIntro(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(p);
    expect(await noHorizontalOverflow(page)).toBe(true);
    // Scroll through so lazy-loaded images are fetched before the full-page capture.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); }
      window.scrollTo(0, 0);
    });
    // Best effort, for the screenshot only (the layout assertion above has already run): wait for rendered images.
    // Not 'networkidle' — the QuotaDeck page sets its iframe's src after an async load, and under a loaded parallel run
    // Playwright intermittently never reports idle (or an image never reports complete) with nothing left in flight.
    await page.waitForFunction(() => [...document.images].every(img => img.complete || img.getClientRects().length === 0), undefined, { timeout: 10_000 })
      .catch(() => { /* capture anyway */ });
    const name = `${info.project.name}${p.replace(/\/+/g, '-').replace(/-$/, '') || '-home'}`;
    await page.screenshot({ path: `test-results/screens/${name}.png`, fullPage: true });
  });
}
