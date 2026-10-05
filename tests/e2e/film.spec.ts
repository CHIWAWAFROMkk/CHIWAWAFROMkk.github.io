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
      [el.getAttribute('src'), el.getAttribute('poster'), el.getAttribute('data-src'), el.getAttribute('data-poster')].filter((u): u is string => !!u)));
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

test.describe('edit desk', () => {
  const PATH = '/projects/mais-je-taime/';
  const desk = '[data-film-desk]';
  const time = (page: import('@playwright/test').Page) => page.locator('[data-fd-video]').evaluate(v => (v as HTMLVideoElement).currentTime);

  test.beforeEach(async ({ page }) => {
    await skipIntro(page);
    await page.goto(PATH);
    await page.locator(desk).scrollIntoViewIfNeeded();
  });

  test('22 shots on the track, S02 offered on its own, colour and sound drawn', async ({ page }) => {
    await expect(page.locator('[data-fd-shots] [data-fd-shot]')).toHaveCount(22);
    await expect(page.locator('[data-fd-shots] [data-fd-shot="S02"]')).toHaveCount(0);
    await expect(page.locator('[data-fd-pick="S02"]')).toBeVisible();
    await expect(page.locator(desk)).toHaveAttribute('data-signals', 'ready');
    expect(await noHorizontalOverflow(page)).toBe(true);
  });

  test('a shot clicked before the film is ready still seeks to its start and opens its card', async ({ page }) => {
    await page.locator('[data-fd-shot="S16"]').click();
    await expect(page.locator('[data-fd-card="S16"]')).toBeVisible();
    await expect(page.locator('[data-fd-card="S01"]')).toBeHidden();
    await expect(page.locator('[data-fd-shot="S16"]')).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => time(page)).toBeCloseTo(43.88, 1);
  });

  test('playing the film moves the playhead', async ({ page }) => {
    const left = () => page.locator('[data-fd-head]').evaluate(el => parseFloat((el as HTMLElement).style.left));
    await page.locator('[data-fd-video]').evaluate(v => { const el = v as HTMLVideoElement; el.muted = true; return el.play(); });
    await expect.poll(left, { timeout: 10_000 }).toBeGreaterThan(1);
  });

  test('clicking the picture track scrubs to that moment', async ({ page }) => {
    const box = (await page.locator('.fd__track--colour').boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect.poll(() => time(page)).toBeCloseTo(30, 0);
  });

  test('arrow keys, Home and End step through the shots and keep focus', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'keyboard');
    await page.locator('[data-fd-shot="S01"]').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-fd-shot="S03"]')).toBeFocused();
    await expect(page.locator('[data-fd-card="S03"]')).toBeVisible();
    await page.keyboard.press('End');
    await expect(page.locator('[data-fd-shot="S20"]')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(page.locator('[data-fd-shot="S01"]')).toBeFocused();
    await expect(page.locator('[data-fd-shot="S01"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('previous / next walk every card, S02 included', async ({ page }) => {
    const seen: string[] = [];
    for (let i = 0; i < 23; i++) {
      seen.push(await page.locator('[data-fd-card]:not([hidden])').getAttribute('data-fd-card') ?? '');
      await page.locator('[data-fd-step="1"]').click();
    }
    expect(seen).toHaveLength(23);
    expect(new Set(seen).size).toBe(23);
    expect(seen[1]).toBe('S02');
    await expect(page.locator('[data-fd-card="S20"]')).toBeVisible();
  });

  test('the S02 button opens its card without moving the film', async ({ page }) => {
    await page.locator('[data-fd-pick="S02"]').click();
    await expect(page.locator('[data-fd-card="S02"]')).toBeVisible();
    await expect(page.locator('[data-fd-card="S02"]')).toContainText('未用于成片');
    expect(await time(page)).toBe(0);
  });
});

test('without the signals file the desk still works', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/film-signals.json', r => r.abort());
  await skipIntro(page);
  await page.goto('/projects/mais-je-taime/');
  await expect(page.locator('[data-film-desk]')).toHaveAttribute('data-signals', 'missing');
  await page.locator('[data-fd-shot="S04"]').click();
  await expect(page.locator('[data-fd-card="S04"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('reduced motion: card clips stay still, the playhead still follows the film', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await skipIntro(page);
  await page.goto('/projects/mais-je-taime/');
  await page.locator('[data-film-desk]').scrollIntoViewIfNeeded();
  await page.locator('[data-fd-shot="S04"]').click();
  expect(await page.locator('[data-fd-card="S04"] video').evaluate(v => (v as HTMLVideoElement).paused)).toBe(true);
  await page.locator('[data-fd-video]').evaluate(v => new Promise<void>(done => {
    const el = v as HTMLVideoElement;
    const set = () => { el.currentTime = 30; done(); };
    if (el.readyState >= 1) set(); else el.addEventListener('loadedmetadata', set, { once: true });
  }));
  await expect.poll(() => page.locator('[data-fd-head]').evaluate(el => parseFloat((el as HTMLElement).style.left))).toBeCloseTo(50, 0);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('the film, the first shot card and the whole storyboard are there', async ({ page }) => {
    await page.goto('/projects/mais-je-taime/');
    await expect(page.locator('[data-fd-video]')).toBeVisible();
    await expect(page.locator('[data-fd-card="S01"]')).toBeVisible();
    await expect(page.locator('[data-fd-card]:not([hidden])')).toHaveCount(1);
    await expect(page.locator('.fs__frame')).toHaveCount(25);
  });
});

test('a shot clicked while the film is still loading seeks once its metadata arrives', async ({ page }) => {
  // Media requests do not pass through page.route in Edge, so hold the film back by stopping its preload as it is parsed:
  // the click lands at readyState 0, and load() then fetches the metadata.
  await page.addInitScript(() => {
    new MutationObserver((_, mo) => {
      const v = document.querySelector<HTMLVideoElement>('[data-fd-video]');
      if (v) { v.preload = 'none'; mo.disconnect(); }
    }).observe(document, { childList: true, subtree: true });
  });
  await skipIntro(page);
  await page.goto('/projects/mais-je-taime/');
  const video = page.locator('[data-fd-video]');
  expect(await video.evaluate(v => (v as HTMLVideoElement).readyState)).toBe(0);
  await page.locator('[data-fd-shot="S16"]').click();
  await video.evaluate(v => (v as HTMLVideoElement).load());
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).readyState), { timeout: 10_000 }).toBeGreaterThanOrEqual(1);
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).currentTime)).toBeCloseTo(43.88, 1);
});

test('shot-card clips have controls, so they can be paused — and played with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await skipIntro(page);
  await page.goto('/projects/mais-je-taime/');
  await page.locator('[data-fd-shot="S04"]').click();
  const clip = page.locator('[data-fd-card="S04"] video');
  await expect(clip).toHaveAttribute('controls', '');
  await clip.evaluate(v => { const el = v as HTMLVideoElement; el.muted = true; return el.play(); });
  await expect.poll(() => clip.evaluate(v => (v as HTMLVideoElement).paused)).toBe(false);
});

test('keyboard focus on the shot track is distinguishable from the pressed shot', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'keyboard');
  await skipIntro(page);
  await page.goto('/projects/mais-je-taime/');
  const ring = (sel: string) => page.locator(sel).evaluate(el => { const s = getComputedStyle(el); return `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`; });
  const pressedOnly = await ring('[data-fd-shot="S01"]');                 // pressed, not focused
  await page.locator('[data-fd-shot="S01"]').focus();
  await page.keyboard.press('ArrowRight');                               // keyboard focus → :focus-visible
  expect(await ring('[data-fd-shot="S03"]')).not.toBe(pressedOnly);
});

test('hidden shot cards do not download their posters until they come near', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  const webp: string[] = [];
  page.on('request', r => { if (/\/video\/s\d+[a-z]?\.webp$/.test(r.url())) webp.push(r.url()); });
  await skipIntro(page);
  await page.goto('/projects/mais-je-taime/');
  await page.waitForTimeout(1500);
  const hiddenWithPoster = await page.locator('[data-fd-card][hidden] video[poster]').count();
  expect(hiddenWithPoster).toBeLessThanOrEqual(2);
  await page.locator('[data-fd-step="1"]').click();
  const shown = page.locator('[data-fd-card]:not([hidden]) video');
  await expect(shown).toHaveAttribute('poster', /\.webp$/);
});
