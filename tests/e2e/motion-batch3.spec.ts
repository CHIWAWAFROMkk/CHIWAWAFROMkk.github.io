import { test, expect, type Page } from '@playwright/test';
import { motionBudget, recordSplits } from './motion-budget';

const skipIntro = (page: Page) => page.addInitScript(() => localStorage.setItem('hyj-intro-seen', '1'));
const FILM = ['/projects/mais-je-taime/', '/en/projects/mais-je-taime/'];
const JUNG = ['/projects/jung-self-map/', '/en/projects/jung-self-map/'];
const scaleY = (page: Page, sel: string, pseudo: '::before' | '::after') => page.locator(sel).evaluate((el, p) => {
  const t = getComputedStyle(el, p).transform;
  return new DOMMatrix(t === 'none' ? '' : t).d;
}, pseudo);

test.describe('motion batch 3: the film pages', () => {
  test.beforeEach(async ({ page }) => { await skipIntro(page); });

  for (const path of [...FILM, ...JUNG]) {
    test(`${path} loads no React; own motion scripts stay under 15 KiB gzip`, async ({ page, request, isMobile }) => {
      test.skip(!!isMobile, 'same emitted graph');
      const budget = await motionBudget(page, request, path);
      test.info().annotations.push({ type: 'script-budget', description: JSON.stringify(budget) });
      expect(budget.react).toEqual([]);
      expect(budget.chunks.some(c => /FilmMotion|film-motion/.test(c))).toBe(true);
      expect(budget.motion).toBeLessThanOrEqual(15 * 1024);
    });

    test(`${path} grain stays faint, under the content, and still with reduced motion`, async ({ page }) => {
      await page.goto(path);
      const grain = await page.evaluate(() => {
        const s = getComputedStyle(document.body, '::before');
        return { o: Number(s.opacity), z: s.zIndex, pe: s.pointerEvents, pos: s.position, anim: s.animationName };
      });
      expect(grain.o).toBeGreaterThan(0);
      expect(grain.o).toBeLessThanOrEqual(0.06);
      expect([grain.z, grain.pe, grain.pos]).toEqual(['-1', 'none', 'fixed']);
      expect(grain.anim).toBe('grain');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      expect(await page.evaluate(() => getComputedStyle(document.body, '::before').animationName)).toBe('none');
    });
  }

  test('the S04 still starts in black and white and lets the one red bloom once seen', async ({ page }) => {
    await page.goto(FILM[0]);
    const frame = page.locator('[data-fm="bloom"]');
    await expect(frame).toHaveClass(/fm-armed/);
    const mono = frame.locator('.fm-mono');
    expect(await mono.evaluate(el => getComputedStyle(el).opacity)).toBe('1');
    await expect(mono).toHaveAttribute('aria-hidden', 'true');
    await expect(mono).toHaveAttribute('alt', '');
    await frame.scrollIntoViewIfNeeded();
    await expect(frame).toHaveClass(/fm-in/);
    await expect.poll(() => mono.evaluate(el => Number(getComputedStyle(el).opacity)), { timeout: 5000 }).toBe(0);
    await expect.poll(() => frame.locator('.fm-still').evaluate(el => getComputedStyle(el).transform), { timeout: 5000 }).toBe('none');
  });

  test('the Jung film opens from letterbox bars to the full frame', async ({ page }) => {
    await page.goto(JUNG[0]);
    const sel = '[data-fm="letterbox"]';
    await expect(page.locator(sel)).toHaveClass(/fm-armed/);
    expect(await scaleY(page, sel, '::before')).toBe(1);
    await page.locator(sel).scrollIntoViewIfNeeded();
    await expect.poll(() => scaleY(page, sel, '::before'), { timeout: 5000 }).toBe(0);
    await expect.poll(() => scaleY(page, sel, '::after'), { timeout: 5000 }).toBe(0);
    await page.locator('video.jf__video').click({ position: { x: 40, y: 40 } });     // the bars never block the player
  });

  test('pictures already on screen are never put back into a start state', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 4000 });
    await page.goto(FILM[0]);
    await page.waitForTimeout(400);
    await expect(page.locator('[data-fm="bloom"]')).not.toHaveClass(/fm-armed/);
    expect(await page.locator('[data-fm="bloom"] .fm-mono').evaluate(el => getComputedStyle(el).opacity)).toBe('0');
  });

  test('with reduced motion or without JS, the stills and the video show as they are', async ({ page, browser, baseURL }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const path of [FILM[0], JUNG[0]]) {
      await page.goto(path);
      await expect(page.locator('[data-fm].fm-armed')).toHaveCount(0);
    }
    expect(await page.locator('[data-fm="letterbox"]').evaluate(el => getComputedStyle(el, '::before').display)).toBe('none');
    const context = await browser.newContext({ javaScriptEnabled: false });
    const plain = await context.newPage();
    await plain.goto(baseURL + FILM[0]);
    expect(await plain.locator('[data-fm="bloom"] .fm-mono').evaluate(el => getComputedStyle(el).opacity)).toBe('0');
    await plain.goto(baseURL + JUNG[0]);
    expect(await plain.locator('[data-fm="letterbox"]').evaluate(el => new DOMMatrix(getComputedStyle(el, '::before').transform).d)).toBe(0);
    await context.close();
  });

  test('the opening buttons are magnetic within 6 px, and still on touch', async ({ page, isMobile }) => {
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      // @ts-expect-error test override: the still opening is enough here
      HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) { return type === 'webgl2' ? null : orig.call(this, type, ...rest); };
    });
    await page.goto(JUNG[0]);
    const magnet = page.locator('.jp__actions .magnet').first();
    await expect(magnet).toHaveAttribute('data-magnet-ready', '');
    const box = (await magnet.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.move(box.x + box.width - 2, box.y + box.height - 2);
    await page.waitForTimeout(500);
    const offset = await magnet.locator(':scope > span').evaluate(el => { const m = new DOMMatrix(getComputedStyle(el).transform); return Math.hypot(m.e, m.f); });
    expect(offset).toBeLessThanOrEqual(6.01);
    if (isMobile) expect(offset).toBe(0);
    else expect(offset).toBeGreaterThan(1);
    await expect(page.locator('.jp__btn').first()).toHaveAttribute('href', '#jf-h');
  });

  test('the film title splits on entry; the Jung title waits below its opening', async ({ page }) => {
    const split = await recordSplits(page);
    await page.goto(FILM[1]);
    const shot = await split();
    expect(shot.kind).toBe('word');
    expect(shot.clipped).toBe(false);
    await expect(page.locator('h1 .split-parent')).toHaveText("Mais je t'aime");
    await page.goto(JUNG[0]);
    await expect(page.locator('h1 .split-parent')).toHaveAttribute('data-split-deferred', '');
    await expect(page.locator('h1')).toHaveText('荣格 × 我');
  });

  for (const path of [FILM[0], FILM[1], JUNG[1]]) {
    test(`${path} scrolling through causes no layout shift`, async ({ page }) => {
      await page.addInitScript(() => {
        (window as unknown as { __cls: number }).__cls = 0;
        new PerformanceObserver(list => {
          for (const e of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value;
        }).observe({ type: 'layout-shift', buffered: true });
      });
      await page.goto(path);
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < height; y += 650) { await page.evaluate(y => scrollTo(0, y), y); await page.waitForTimeout(150); }
      await page.waitForTimeout(800);
      expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBeLessThan(0.1);
    });
  }
});
