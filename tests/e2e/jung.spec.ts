import { test, expect } from '@playwright/test';
import { skipIntro, noHorizontalOverflow } from './helpers';

for (const lang of ['zh', 'en'] as const) {
  const PATH = `${lang === 'en' ? '/en' : ''}/projects/jung-self-map/`;

  test(`Jung page (${lang}) is dark, shows the film and the map, with five quotations`, async ({ page }) => {
    await skipIntro(page);
    await page.goto(PATH);
    await expect(page.locator('body')).toHaveClass(/night/);
    await expect(page.locator('video.jf__video')).toHaveCount(1);
    await expect(page.locator('video.jf__video')).toHaveAttribute('poster', /poster\.jpg$/);
    await expect(page.locator('.prose table tbody tr')).toHaveCount(5);
    expect(await noHorizontalOverflow(page)).toBe(true);
  });

  test(`Jung page (${lang}): the map loads only on click and its frame opens`, async ({ page, request }) => {
    await skipIntro(page);
    await page.goto(PATH);
    const frame = page.locator('#jung-frame');
    await expect(frame).toBeHidden();
    expect(await frame.getAttribute('src')).toBeNull();                       // nothing heavy before the click
    await page.locator('[data-jm-load]').click();
    await expect(frame).toBeVisible();
    await expect(frame).toHaveAttribute('src', '/assets/jung-map/');
    expect((await request.get('/assets/jung-map/')).status()).toBe(200);
    const inner = page.frameLocator('#jung-frame');
    await expect(inner.locator('#story .station').first()).toBeAttached({ timeout: 15000 });
  });

  test(`Jung page (${lang}): every picture, video and map asset is served`, async ({ page, request, isMobile }) => {
    test.skip(!!isMobile, 'run once');
    await skipIntro(page);
    await page.goto(PATH);
    const urls = await page.locator('main img, main video, main source').evaluateAll(els => els.flatMap(el =>
      [el.getAttribute('src'), el.getAttribute('poster')].filter((u): u is string => !!u)));
    expect(urls.length).toBeGreaterThanOrEqual(3);
    for (const u of new Set(urls)) expect((await request.get(u)).status(), u).toBe(200);
  });
}

test('the public map marks verified and unverified citations honestly', async ({ request }) => {
  const c = await (await request.get('/assets/jung-map/content/public.content.json')).json();
  const by = Object.fromEntries(c.stations.map((s: { id: string; source_verified: boolean; kind: string }) => [s.id, s]));
  for (const id of ['persona', 'projection', 'complex', 'shadow', 'anima', 'self']) expect(by[id].source_verified, id).toBe(true);
  expect(by.gaze.kind).toBe('narrative-theme');
  expect(by.gaze.source_verified).toBe(false);
});

test('the English Jung page carries no Chinese', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await skipIntro(page);
  await page.goto('/en/projects/jung-self-map/');
  const text = await page.locator('main').innerText();
  expect(text.match(/[一-鿿]+/g) ?? []).toEqual([]);
});

test('the page credits the licensed music', async ({ page }) => {
  await skipIntro(page);
  await page.goto('/projects/jung-self-map/');
  await expect(page.locator('.prose')).toContainText('Alone Again');
  await expect(page.locator('.prose')).not.toContainText('待取得授权');
});

for (const lang of ['zh', 'en'] as const) {
  test(`the handbook (${lang}) has seven stations, each with a source, and marks the narrative theme`, async ({ page }) => {
    await skipIntro(page);
    await page.goto(`${lang === 'en' ? '/en' : ''}/projects/jung-self-map/`);
    const items = page.locator('#handbook .hb__item');
    await expect(items).toHaveCount(7);
    await expect(page.locator('#handbook .hb__src')).toHaveCount(7);
    await expect(page.locator('#handbook .hb__tag').nth(1)).toHaveText(lang === 'zh' ? '叙事主题' : 'Narrative theme');
  });
}
