import { test, expect, type Page } from '@playwright/test';
import { gzipSync } from 'node:zlib';

const pages = ['/', '/en/', '/brief/', '/en/brief/', '/projects/', '/en/projects/'];
const skipIntro = (page: Page) => page.addInitScript(() => localStorage.setItem('hyj-intro-seen', '1'));

test.describe('motion batch 1', () => {
  test.beforeEach(async ({ page }) => { await skipIntro(page); });
  for (const path of pages) {
    test(`${path} initial React graph stays under 70 KiB gzip`, async ({ page, request, isMobile }) => {
      test.skip(!!isMobile, 'same emitted graph');
      const requested = new Set<string>();
      page.on('request', r => { if (r.resourceType() === 'script') requested.add(new URL(r.url()).pathname); });
      await page.goto(path);
      await page.waitForTimeout(1600);
      const roots = await page.locator('astro-island').evaluateAll(els => els.flatMap(el => [el.getAttribute('renderer-url'), el.getAttribute('component-url')]).filter(Boolean) as string[]);
      const visited = new Set<string>();
      let bytes = 0, gsapBytes = 0;
      const visit = async (url: string) => {
        const path = new URL(url, 'http://localhost').pathname;
        if (visited.has(path) || !requested.has(path)) return;
        visited.add(path);
        const response = await request.get(path);
        expect(response.ok()).toBe(true);
        const body = await response.body();
        // Only GSAP vendor + registration are separate; application reveal helpers count with components.
        if (/\/gsap\.[^/]+\.js$/.test(path)) gsapBytes += gzipSync(body).length;
        else bytes += gzipSync(body).length;
        for (const match of body.toString().matchAll(/["'`](\.\/[^"'`]+\.js)["'`]/g)) await visit(new URL(match[1], `http://localhost${path}`).pathname);
      };
      for (const root of roots) await visit(root);
      expect([...visited].some(path => /\/react\./.test(path))).toBe(true);
      // jsx-runtime is bundled into the React vendor chunk; renderer dependencies are traversed above.
      test.info().annotations.push({ type: 'script-budget', description: JSON.stringify({ reactAndComponents: bytes, gsap: gsapBytes, chunks: [...visited] }) });
      expect(bytes).toBeLessThanOrEqual(70 * 1024);
      expect(bytes + gsapBytes).toBeLessThanOrEqual(125 * 1024);
    });

    test(`${path} title enters and settles; scroll reveals preserve layout`, async ({ page }) => {
      await page.addInitScript(() => {
        (window as any).__motionCLS = 0;
        new PerformanceObserver(list => {
          for (const entry of list.getEntries() as any[]) if (!entry.hadRecentInput) (window as any).__motionCLS += entry.value;
        }).observe({ type: 'layout-shift', buffered: true });
      });
      await page.goto(path);
      const title = page.locator('main h1 .split-parent');
      await expect(title).toHaveAttribute('data-split-ready', '', { timeout: 8000 });
      const units = title.locator(path.startsWith('/en/') ? '.split-word' : '.split-char');
      expect(await units.count()).toBeGreaterThan(0);
      await expect.poll(() => units.evaluateAll(els => els.every(el => getComputedStyle(el).opacity === '1'))).toBe(true);
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
    await expect(magnet.locator('xpath=ancestor::astro-island')).not.toHaveAttribute('ssr', '');
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

  test('slow hydration does not re-hide already visible text', async ({ page }) => {
    await page.route('**/_astro/client.*.js', async route => {
      await new Promise(r => setTimeout(r, 3200));
      await route.continue();
    });
    await page.goto('/brief/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1 .split-parent')).toBeVisible({ timeout: 4000 });
    await expect(page.locator('h1 astro-island')).not.toHaveAttribute('ssr', '', { timeout: 8000 });
    await expect(page.locator('#b-exp astro-island')).not.toHaveAttribute('ssr', '', { timeout: 8000 });
    await expect(page.locator('h1 .split-char')).toHaveCount(0);
    await expect(page.locator('#b-exp .sr-unit')).toHaveCount(0);
  });

  test('active English splitting fits 320 pixels and reacts to reduced motion', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    for (const path of ['/en/', '/en/brief/', '/en/projects/']) {
      await page.goto(path);
      await expect(page.locator('h1 .split-parent')).toHaveAttribute('data-split-ready', '');
      expect(await page.locator('h1 .split-word').count()).toBeGreaterThan(0);
      if (path !== '/en/projects/') await expect(page.locator('h1 .split-parent')).toHaveText('Yanjun He');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
      const clipped = await page.locator('h1 .split-word').evaluateAll(words => words.some(word => {
        const box = word.getBoundingClientRect(), parent = word.closest('h1')!.getBoundingClientRect();
        return box.left < parent.left - 1 || box.right > parent.right + 1;
      }));
      expect(clipped).toBe(false);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(page.locator('.split-word, .split-char, .sr-unit')).toHaveCount(0);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
    }
  });

  test('film detail awaiting batch 3 loads no React islands', async ({ page }) => {
    const scripts: string[] = [];
    page.on('request', r => { if (r.resourceType() === 'script') scripts.push(r.url()); });
    await page.goto('/projects/mais-je-taime/');
    await page.waitForTimeout(500);
    await expect(page.locator('astro-island')).toHaveCount(0);
    expect(scripts.filter(url => /\/(?:react|client|gsap|text-motion|sections|SplitText|ScrollReveal|Magnet|SpotlightCard)\.[^/]+\.js/.test(url))).toEqual([]);
  });
});
