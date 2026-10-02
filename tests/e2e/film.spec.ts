import { test, expect } from '@playwright/test';
import { skipIntro, noHorizontalOverflow } from './helpers';

for (const lang of ['zh', 'en'] as const) {
  const PATH = `${lang === 'en' ? '/en' : ''}/projects/mais-je-taime/`;

  test(`film page (${lang}) is dark, with four acts, 25 stills, 10 revision cases and 5 rejected takes`, async ({ page }) => {
    await skipIntro(page);
    await page.goto(PATH);
    await expect(page.locator('body')).toHaveClass(/night/);
    await expect(page.locator('.fs__act')).toHaveCount(4);
    await expect(page.locator('.fs__frame')).toHaveCount(25);
    await expect(page.locator('.fs__rev')).toHaveCount(10);
    await expect(page.locator('.fs__rejects video')).toHaveCount(5);
    expect(await noHorizontalOverflow(page)).toBe(true);
  });

  test(`film page (${lang}): every still, draft and poster is served`, async ({ page, request, isMobile }) => {
    test.skip(!!isMobile, 'run once');
    await skipIntro(page);
    await page.goto(PATH);
    const urls = await page.locator('[data-film] img, [data-film] video').evaluateAll(els => els.flatMap(el =>
      [el.getAttribute('src'), el.getAttribute('poster'), el.getAttribute('data-src')].filter((u): u is string => !!u)));
    expect(urls.length).toBeGreaterThanOrEqual(60);   // 1 opening still, 25 frames, 28 drafts and finals, 5 rejects with posters
    for (const u of new Set(urls)) expect((await request.get(u)).status(), u).toBe(200);
  });
}

test('S02 is shown in the storyboard as not in the cut', async ({ page }) => {
  await skipIntro(page);
  await page.goto('/projects/mais-je-taime/');
  await expect(page.locator('.fs__frame', { hasText: '警员停步' })).toContainText('未用于成片');
});

test('the English film page carries no Chinese', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await skipIntro(page);
  await page.goto('/en/projects/mais-je-taime/');
  const text = await page.locator('main').innerText();
  expect(text.match(/[\u4e00-\u9fff]+/g) ?? []).toEqual([]);
});
