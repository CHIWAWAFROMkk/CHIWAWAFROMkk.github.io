import { test, expect } from '@playwright/test';
import { SITE } from '../../src/data/site';

for (const [path, id] of [['/projects/ai-career/live/', 'career'], ['/projects/ai-campus/live/', 'campus'], ['/projects/quota-deck/live/', 'quota']] as const) {
  test(`${path} shows its preview before the live demo`, async ({ page }) => {
    await page.route('**/assets/vendor/pyodide/**', r => r.abort());      // the preview must not depend on the runtime
    await page.goto(path);
    const img = page.locator(`figure.live-preview img[src="/media/live-previews/${id}.jpg"]`);
    await expect(img).toBeVisible();
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    await expect(page.locator('figure.live-preview figcaption')).toHaveText(SITE.livePreview.caption.zh);
    const before = await page.evaluate(() => {
      const f = document.querySelector('figure.live-preview')!, d = document.querySelector('[data-demo]')!;
      return !!(f.compareDocumentPosition(d) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(before).toBe(true);
  });
}
