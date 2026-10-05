import { test, expect } from '@playwright/test';
import { motionBudget, recordSplits } from './motion-budget';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const slugs = ['hris-workflow', 'campus-delivery', 'stock-data', 'stock-data/method', 'campus-delivery/insights', 'ai-career', 'ai-career/live', 'quota-deck', 'quota-deck/live', 'ai-campus', 'ai-campus/live'];
export const MOTION_PROJECT_PAGES = [...slugs.map(slug => `/projects/${slug}/`), '/privacy/'].flatMap(path => [path, `/en${path}`]);

test.describe('motion batch 2', () => {
  const captures = resolve('.superpowers/sdd/2026-10-05-react-bits-gsap-batch2-codex/captures');
  test.beforeAll(async () => { await mkdir(captures, { recursive: true }); });
  for (const path of MOTION_PROJECT_PAGES) {
    test(`${path} preserves content, layout and reduced-motion cleanup`, async ({ page, isMobile }) => {
      const width = isMobile ? 390 : 1920;
      await page.setViewportSize({ width, height: isMobile ? 844 : 1000 });
      await page.addInitScript(() => {
        (window as any).__motionCLS = 0;
        new PerformanceObserver(list => {
          for (const entry of list.getEntries() as any[]) if (!entry.hadRecentInput) (window as any).__motionCLS += entry.value;
        }).observe({ type: 'layout-shift', buffered: true });
      });
      let gsapUrl = '';
      page.on('request', r => { if (/\/_astro\/gsap\.[^/]+\.js$/.test(r.url())) gsapUrl = r.url(); });
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('main[data-section-reveals]')).toHaveCount(1);
      await expect(page.locator('main h1 .split-parent')).toHaveCount(1);
      const title = (await page.locator('main h1').textContent())!.trim();
      expect(title.length).toBeGreaterThan(0);
      await page.locator('main h1').scrollIntoViewIfNeeded();
      await expect(page.locator('main h1 .split-parent')).toHaveAttribute('data-split-ready', '', { timeout: 6000 });
      await expect(page.locator('main h1 .split-char, main h1 .split-word')).toHaveCount(0, { timeout: 5000 });
      await expect(page.locator('main h1 .split-parent')).toHaveCSS('opacity', '1');
      await page.screenshot({ path: resolve(captures, `${width}-${path.replaceAll('/', '_')}-title.png`) });
      const headings = page.locator('main h2:not(.sr):not([aria-hidden="true"])');
      const expected = await headings.allTextContents();
      expect(expected.length).toBeGreaterThan(0);
      await headings.evaluateAll(els => { (window as any).__headingNodes = els.map(el => ({ el, id: el.id, children: [...el.childNodes] })); });
      const upcoming = await headings.evaluateAll(els => els.findIndex(el => el.getBoundingClientRect().top > innerHeight + 220));
      if (upcoming >= 0) {
        const y = await headings.nth(upcoming).evaluate(el => el.getBoundingClientRect().top + scrollY);
        await page.evaluate(y => scrollTo(0, y - innerHeight - 120), y);
        await page.waitForTimeout(150);
      }
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < height; y += 650) { await page.evaluate(y => scrollTo(0, y), y); await page.waitForTimeout(120); }
      await page.waitForTimeout(700);
      await expect(page.locator('[data-section-motion]').first()).toBeAttached();
      expect(await headings.allTextContents()).toEqual(expected);
      expect(await page.evaluate(() => (window as any).__headingNodes.every(({ el, id, children }: any) => el.isConnected && el.id === id && children.every((child: Node, i: number) => el.childNodes[i] === child)))).toBe(true);
      expect(await page.evaluate(() => (window as any).__motionCLS)).toBeLessThan(0.1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
      const bodyHeading = page.locator('article.prose h2').first();
      if (await bodyHeading.count()) await bodyHeading.scrollIntoViewIfNeeded();
      await page.waitForTimeout(650);
      await page.screenshot({ path: resolve(captures, `${width}-${path.replaceAll('/', '_')}-body.png`) });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(page.locator('.sr-unit, .split-char, .split-word')).toHaveCount(0);
      await expect.poll(() => headings.evaluateAll(els => els.every(el => getComputedStyle(el).opacity === '1' && getComputedStyle(el).visibility === 'visible'))).toBe(true);
      expect(gsapUrl).not.toBe('');
      const active = await page.evaluate(async url => {
        const module = await import(/* @vite-ignore */ url);
        const gsap = Object.values(module).find((value: any) => value?.core?.globals) as any;
        if (!gsap?.core.globals().ScrollTrigger) throw new Error('Cannot inspect actual ScrollTrigger');
        return gsap.core.globals().ScrollTrigger.getAll().length;
      }, gsapUrl);
      expect(active).toBe(0);
      expect(errors).toEqual([]);
    });
  }

  test('all pages remain readable with no JS, blocked JS and initial reduced motion', async ({ browser, baseURL, isMobile }) => {
    test.skip(!!isMobile, 'same static documents');
    test.setTimeout(180000);
    for (const mode of ['no-js', 'blocked', 'reduced'] as const) {
      const context = await browser.newContext({ javaScriptEnabled: mode !== 'no-js', reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference' });
      const page = await context.newPage();
      if (mode === 'blocked') await page.route('**/_astro/**', route => route.request().resourceType() === 'script' ? route.abort() : route.continue());
      for (const path of MOTION_PROJECT_PAGES) {
        await page.goto(baseURL! + path, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('main h1 .split-parent')).toBeVisible({ timeout: 4000 });
        expect((await page.locator('main h1').textContent())!.trim().length, `${mode} ${path}`).toBeGreaterThan(0);
        await expect(page.locator('.split-char,.split-word,.sr-unit')).toHaveCount(0);
      }
      await context.close();
    }
  });

  test('project pages load no React; own motion scripts under 15 KiB, GSAP reported separately', async ({ page, request, isMobile }) => {
    test.skip(!!isMobile, 'same emitted graph');
    test.setTimeout(90000);
    const budgets = [];
    for (const path of MOTION_PROJECT_PAGES) {
      const budget = await motionBudget(page, request, path);
      budgets.push(budget);
      test.info().annotations.push({ type: 'budget', description: JSON.stringify(budget) });
      expect(budget.react, path).toEqual([]);
      expect(budget.motion, path).toBeLessThanOrEqual(15 * 1024);
      expect(budget.gsap, path).toBeLessThanOrEqual(55 * 1024);
    }
    await writeFile(resolve(captures, 'budgets.json'), JSON.stringify(budgets, null, 2));
  });

  test('English long headings fit 320px while splitting', async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 320, height: 844 });
    const split = await recordSplits(page);
    for (const path of MOTION_PROJECT_PAGES.filter(path => path.startsWith('/en/') && !path.includes('/insights/'))) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('main h1 .split-parent')).toHaveAttribute('data-split-ready', '');
      const shot = await split();
      expect(shot.kind, path).toBe('word');
      expect(shot.clipped, path).toBe(false);
    }
  });

  test('mixed Chinese headings keep Latin words together during animation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const split = await recordSplits(page);
    for (const [slug, word, title] of [['campus-delivery', 'SQL', '校园外卖 SQL 工作台'], ['ai-career', 'Agent', '个人求职 Agent'], ['ai-campus/live', 'AI', 'AI 校园应用研究（完整版）']]) {
      await page.goto(`/projects/${slug}/`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('h1 .split-parent')).toHaveAttribute('data-split-ready', '');
      const shot = await split();
      expect(shot.units, slug).toContain(word);
      await expect(page.locator('h1 .split-parent')).toHaveText(title);
    }
  });

  test('the title after the long opening waits until approached', async ({ page }) => {
    await page.goto('/projects/campus-delivery/insights/', { waitUntil: 'domcontentloaded' });
    const heading = page.locator('h1 .split-parent');
    await expect(heading).toHaveAttribute('data-split-deferred', '');
    await page.waitForTimeout(2800);
    await expect(heading.locator('.split-char')).toHaveCount(0);
    const top = await heading.evaluate(el => el.getBoundingClientRect().top + scrollY);
    await page.evaluate(top => scrollTo(0, Math.max(0, top - innerHeight - 120)), top);
    await page.waitForTimeout(150);
    await page.evaluate(top => scrollTo(0, Math.max(0, top - innerHeight * .7)), top);
    await expect(heading).toHaveAttribute('data-split-ready', '');
    await expect(heading).toBeVisible();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(heading.locator('.split-char')).toHaveCount(0);
  });
});
