import { test, expect, type Page } from '@playwright/test';
import { motionBudget, recordSplits } from './motion-budget';

const pages = ['/', '/en/', '/brief/', '/en/brief/', '/projects/', '/en/projects/'];
const skipIntro = (page: Page) => page.addInitScript(() => localStorage.setItem('hyj-intro-seen', '1'));

test.describe('motion batch 1', () => {
  test.beforeEach(async ({ page }) => { await skipIntro(page); });
  for (const path of pages) {
    test(`${path} loads no React; own motion scripts stay under 15 KiB gzip`, async ({ page, request, isMobile }) => {
      test.skip(!!isMobile, 'same emitted graph');
      const budget = await motionBudget(page, request, path);
      test.info().annotations.push({ type: 'script-budget', description: JSON.stringify(budget) });
      expect(budget.react).toEqual([]);
      expect(budget.chunks.length).toBeGreaterThan(0);
      expect(budget.motion).toBeLessThanOrEqual(15 * 1024);
      expect(budget.gsap).toBeLessThanOrEqual(55 * 1024);
    });

    test(`${path} title enters and settles; scroll reveals preserve layout`, async ({ page }) => {
      await page.addInitScript(() => {
        (window as any).__motionCLS = 0;
        new PerformanceObserver(list => {
          for (const entry of list.getEntries() as any[]) if (!entry.hadRecentInput) (window as any).__motionCLS += entry.value;
        }).observe({ type: 'layout-shift', buffered: true });
      });
      const split = await recordSplits(page);
      await page.goto(path);
      const title = page.locator('main h1 .split-parent');
      await expect(title).toHaveAttribute('data-split-ready', '', { timeout: 8000 });
      const shot = await split();
      expect(shot.kind).toBe(path.startsWith('/en/') ? 'word' : 'char');
      expect(shot.units.length).toBeGreaterThan(0);
      // Settled: the units are gone again and the whole title is fully opaque.
      await expect(title.locator('.split-word, .split-char')).toHaveCount(0, { timeout: 5000 });
      await expect(title).toHaveCSS('opacity', '1');
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < height; y += 650) { await page.evaluate(y => scrollTo(0, y), y); await page.waitForTimeout(180); }
      await page.waitForTimeout(900);
      expect(await page.evaluate(() => (window as any).__motionCLS)).toBeLessThan(0.1);
      if (path.includes('brief') || path.includes('projects')) {
        await expect(page.locator('.scroll-reveal').first()).toBeAttached();
        await expect(page.locator('.card-spotlight a.prow').first()).toBeAttached();
      }
    });

    test(`${path} reduced motion leaves whole visible text`, async ({ page }) => {
      let gsapUrl = '';
      page.on('request', r => { if (/\/_astro\/gsap\.[^/]+\.js$/.test(r.url())) gsapUrl = r.url(); });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(path);
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.locator('main h1 .split-parent')).toBeAttached();
      await page.waitForTimeout(500);
      await expect(page.locator('.split-char, .split-word, .sr-unit')).toHaveCount(0);
      expect(await page.locator('main h1').evaluate(el => getComputedStyle(el).visibility)).toBe('visible');
      expect(gsapUrl).not.toBe('');
      const triggers = await page.evaluate(async url => {
        const module = await import(/* @vite-ignore */ url);
        const gsap = Object.values(module).find((value: any) => value?.core?.globals) as any;
        if (!gsap?.core.globals().ScrollTrigger) throw new Error('Cannot inspect actual registered ScrollTrigger');
        return gsap.core.globals().ScrollTrigger.getAll().length;
      }, gsapUrl);
      expect(triggers).toBe(0);
    });

    test(`${path} blocked JS falls back to readable title`, async ({ page }) => {
      await page.route('**/_astro/**', route => route.request().resourceType() === 'script' ? route.abort() : route.continue());
      await page.goto(path);
      await expect(page.locator('main h1 .split-parent')).toBeVisible({ timeout: 4000 });
      expect((await page.locator('main h1').innerText()).trim().length).toBeGreaterThan(0);
    });

    test(`${path} no JS stays readable`, async ({ browser, baseURL }) => {
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();
      await page.goto(baseURL! + path);
      await expect(page.locator('main h1')).toBeVisible();
      expect((await page.locator('main h1').innerText()).trim().length).toBeGreaterThan(0);
      await context.close();
    });
  }

  test('magnetic arrows cap displacement and preserve touch navigation', async ({ page, isMobile }) => {
    await page.goto('/');
    const magnet = page.locator('.door .magnet').first();
    await expect(magnet).toBeVisible();
    await expect(magnet).toHaveAttribute('data-magnet-ready', '');
    const box = (await magnet.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2 + 25, box.y + box.height / 2 + 20);
    await page.waitForTimeout(700);
    const offset = await magnet.locator(':scope > span').evaluate(el => { const m = new DOMMatrix(getComputedStyle(el).transform); return Math.hypot(m.e, m.f); });
    expect(offset).toBeLessThanOrEqual(6.01);
    if (isMobile) {
      expect(offset).toBe(0);
      await page.locator('a.door').first().tap();
      await expect(page).toHaveURL(/\/brief\/$/);
    } else expect(offset).toBeGreaterThan(1);
  });

  test('spotlight respects pointer and reduced motion preferences', async ({ page, isMobile }) => {
    await page.goto('/brief/');
    const card = page.locator('.card-spotlight').first();
    const light = card.locator('.card-spotlight__light');
    await card.scrollIntoViewIfNeeded();
    await card.hover();
    if (isMobile) expect(await light.evaluate(el => getComputedStyle(el).display)).toBe('none');
    else await expect.poll(() => light.evaluate(el => getComputedStyle(el).opacity)).toBe('1');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await light.evaluate(el => getComputedStyle(el).display)).toBe('none');
  });

  test('wide and narrow bilingual pages retain alignment without overflow', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const width of [1920, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const path of pages) {
        await page.goto(path);
        expect(await page.evaluate(() => document.documentElement.scrollWidth), `${path} at ${width}`).toBeLessThanOrEqual(width);
        if (width === 1920 && path !== '/' && path !== '/en/') {
          const heading = await page.locator('main h1').boundingBox();
          const number = await page.locator('a.prow > .prow__n').first().boundingBox();
          expect(Math.abs(heading!.x - number!.x), path).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  test('slow motion scripts do not re-hide already visible text', async ({ page }) => {
    await page.route(/\/_astro\/(?:SplitText|ScrollReveal)\.astro_[^/]+\.js$/, async route => {
      await new Promise(r => setTimeout(r, 3200));
      await route.continue();
    });
    await page.goto('/brief/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1 .split-parent')).toBeVisible({ timeout: 4000 });
    await expect(page.locator('h1 .split-parent')).toHaveAttribute('data-split-ready', '', { timeout: 8000 });
    await page.waitForTimeout(300);
    await expect(page.locator('h1 .split-char')).toHaveCount(0);
    await expect(page.locator('#b-exp .sr-unit')).toHaveCount(0);
  });

  test('server HTML carries whole heading text with no animation units or hiding', async ({ request }) => {
    for (const path of ['/brief/', '/en/brief/', '/projects/']) {
      const html = await (await request.get(path)).text();
      const title = html.match(/<span class="split-parent"[^>]*>([^<]+)<\/span>/);
      expect(title?.[1].trim().length, path).toBeGreaterThan(0);
      expect(html, path).not.toMatch(/split-char|split-word|sr-unit|astro-island/);
      expect(html.match(/<span class="split-parent"[^>]*>/)![0], path).not.toMatch(/opacity:\s*0|visibility:\s*hidden/);
      if (path.includes("brief")) expect(html, path).toMatch(/<span class="magnet[^"]*"[^>]*><span[^>]*><a /);
    }
  });

  test('active English splitting fits 320 pixels and reacts to reduced motion', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    const split = await recordSplits(page);
    for (const path of ['/en/', '/en/brief/', '/en/projects/']) {
      await page.goto(path);
      await expect(page.locator('h1 .split-parent')).toHaveAttribute('data-split-ready', '');
      const shot = await split();
      expect(shot.kind, path).toBe('word');
      if (path !== '/en/projects/') await expect(page.locator('h1 .split-parent')).toHaveText('Yanjun He');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
      expect(shot.clipped, path).toBe(false);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(page.locator('.split-word, .split-char, .sr-unit')).toHaveCount(0);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
    }
  });

  test('film detail loads no React islands', async ({ page }) => {
    const scripts: string[] = [];
    page.on('request', r => { if (r.resourceType() === 'script') scripts.push(r.url()); });
    await page.goto('/projects/mais-je-taime/');
    await page.waitForTimeout(500);
    await expect(page.locator('astro-island')).toHaveCount(0);
    expect(scripts.filter(url => /\/(?:react|client)\.[^/]+\.js/.test(url))).toEqual([]);
  });
});
