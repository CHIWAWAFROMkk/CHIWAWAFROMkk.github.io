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
    await page.waitForLoadState('networkidle');
    const name = `${info.project.name}${p.replace(/\/+/g, '-').replace(/-$/, '') || '-home'}`;
    await page.screenshot({ path: `test-results/screens/${name}.png`, fullPage: true });
  });
}
