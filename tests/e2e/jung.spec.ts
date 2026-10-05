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

// ---- The opening: the film's keyframes composited live in WebGL2 ----
const noWebGL2 = (page: import('@playwright/test').Page) => page.addInitScript(() => {
  const orig = HTMLCanvasElement.prototype.getContext;
  // @ts-expect-error test override
  HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) { return type === 'webgl2' ? null : orig.call(this, type, ...rest); };
});
const hasWebGL2 = (page: import('@playwright/test').Page) => page.evaluate(() => !!document.createElement('canvas').getContext('webgl2'));

test('opening without WebGL2: the still picture and the title, no errors, about one screen tall', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await skipIntro(page);
  await noWebGL2(page);
  await page.goto('/projects/jung-self-map/');
  await page.waitForTimeout(1500);
  const jp = page.locator('[data-jung-prologue]');
  await expect(jp).toHaveAttribute('data-state', 'static');
  await expect(jp.locator('.jp__still')).toBeVisible();
  await expect(jp.locator('.jp__big')).toBeVisible();
  const h = await jp.evaluate(el => el.getBoundingClientRect().height / innerHeight);
  expect(h).toBeLessThan(1.2);
  expect(errors).toEqual([]);
});

test('opening with reduced motion stays still and never draws', async ({ page }) => {
  await skipIntro(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/projects/jung-self-map/');
  await page.waitForTimeout(1500);
  await expect(page.locator('[data-jung-prologue]')).toHaveAttribute('data-state', 'static');
  await expect(page.locator('[data-jung-prologue] canvas[data-ready]')).toHaveCount(0);
});

test('opening with WebGL2 runs live, moves to the next picture, and reports a real frame rate', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop');
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await skipIntro(page);
  await page.goto('/projects/jung-self-map/');
  test.skip(!(await hasWebGL2(page)), 'no WebGL2 in this browser');
  const jp = page.locator('[data-jung-prologue]');
  await expect(jp).toHaveAttribute('data-state', 'live', { timeout: 10000 });
  await expect(jp.locator('canvas')).toHaveAttribute('data-ready', '');
  await expect(jp).toHaveAttribute('data-shot', '1', { timeout: 12000 });
  await expect(jp.locator('[data-jp-fps]')).toHaveText(/^\d+$/);
  expect(errors).toEqual([]);
});

test('the opening’s buttons reach the film and start the map', async ({ page }) => {
  await skipIntro(page);
  await noWebGL2(page);
  await page.goto('/projects/jung-self-map/');
  await expect(page.locator('.jp__btn').first()).toHaveAttribute('href', '#jf-h');
  await page.locator('[data-jp-map]').click();
  await expect(page.locator('#jung-frame')).toBeVisible();
  await expect(page.locator('#jm-h')).toBeInViewport();
});

test('the map stops drawing when scrolled out of view and resumes when it comes back', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop');
  await skipIntro(page);
  await page.goto('/projects/jung-self-map/');
  await page.locator('[data-jm-load]').click();
  const inner = page.frameLocator('#jung-frame');
  await expect(inner.locator('#story .station').first()).toBeAttached({ timeout: 15000 });
  const frame = page.frame({ url: /\/assets\/jung-map\/$/ })!;
  await expect.poll(() => frame.evaluate(() => (window as unknown as { __jung: { paused?: boolean } }).__jung.paused)).toBe(false);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => frame.evaluate(() => (window as unknown as { __jung: { paused?: boolean } }).__jung.paused)).toBe(true);
  await page.locator('#jung-frame').scrollIntoViewIfNeeded();
  await expect.poll(() => frame.evaluate(() => (window as unknown as { __jung: { paused?: boolean } }).__jung.paused)).toBe(false);
});

test('in the overview, the hidden station buttons are out of the tab order', async ({ page }) => {
  await page.goto('/assets/jung-map/');
  await expect(page.locator('#story .station').first()).toBeAttached({ timeout: 15000 });
  await expect(page.locator('#ctrl')).toHaveJSProperty('inert', true);
  await page.evaluate(() => (window as unknown as { __jung: { goTo: (i: number) => void } }).__jung.goTo(6));
  await expect(page.locator('#ctrl')).toHaveJSProperty('inert', false, { timeout: 10000 });
  await page.keyboard.press('Escape');
  await expect(page.locator('#ctrl')).toHaveJSProperty('inert', true, { timeout: 10000 });
});
