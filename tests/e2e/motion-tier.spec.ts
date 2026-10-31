import { test, expect } from '@playwright/test';
import { SITE } from '../../src/data/site';
import { skipIntro, motionChoice } from './helpers';

const tier = (page: import('@playwright/test').Page) => page.evaluate(() => document.documentElement.dataset.motion);

test.beforeEach(async ({ page }) => { await skipIntro(page); });

test('full by default', async ({ page }) => {
  await page.goto('/projects/');
  expect(await tier(page)).toBe('full');
});

test('system reduced motion: gentle, and rows still fade in without travelling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 700 });
  await page.goto('/projects/');
  expect(await tier(page)).toBe('gentle');
  const last = page.locator('a.prow').last();
  await expect(last).toHaveClass(/reveal/);
  expect(await last.evaluate(el => getComputedStyle(el).transform)).toBe('none');
  await last.scrollIntoViewIfNeeded();
  await expect(last).toHaveClass(/is-in/);
  await expect.poll(() => last.evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
});

test('motion off: nothing is armed and nothing transitions', async ({ page }) => {
  await motionChoice(page, 'off');
  await page.goto('/projects/');
  expect(await tier(page)).toBe('off');
  await expect(page.locator('a.prow.reveal')).toHaveCount(0);
  expect(await page.locator('a.prow').first().evaluate(el => getComputedStyle(el).transitionDuration.split(',').every(d => parseFloat(d) <= 0.001))).toBe(true);
});

test('the footer switch remembers the choice', async ({ page }) => {
  await page.goto('/brief/');
  const sw = page.locator('footer.footer [data-motion-switch]');
  await expect(sw.locator('button[aria-pressed="true"]')).toHaveCount(0);   // automatic until the visitor picks one
  await sw.getByRole('button', { name: SITE.motion.off.zh }).click();
  await page.waitForLoadState('load');
  expect(await tier(page)).toBe('off');
  await expect(page.locator('footer.footer [data-motion-switch] button[aria-pressed="true"]')).toHaveText(SITE.motion.off.zh);
  await page.reload();
  expect(await tier(page)).toBe('off');
});

test('storage blocked: tier boots and the switch still works', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/brief/');
  expect(await tier(page)).toBe('full');
  await page.locator('footer.footer [data-motion-switch]').getByRole('button', { name: SITE.motion.gentle.zh }).click();
  await page.waitForLoadState('load');
  expect(errors).toEqual([]);
});

test('system reduced motion: the gentle fades really animate (not cut by the old global reset)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/projects/');
  const row = page.locator('a.prow').first();
  await expect(row).toHaveClass(/is-in/);
  const t = await row.evaluate(el => ({ d: getComputedStyle(el).transitionDuration, p: getComputedStyle(el).transitionProperty }));
  expect(t.p).toContain('opacity');
  expect(t.d.split(',').some(d => parseFloat(d) > 0)).toBe(true);
});

test('choosing full while the system asks for reduced motion gives full motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await motionChoice(page, 'full');
  await page.goto('/projects/');
  const row = page.locator('a.prow').first();
  expect(await row.evaluate(el => getComputedStyle(el).transitionDuration.split(',').some(d => parseFloat(d) > 0))).toBe(true);
});

test('storage blocked: the switch still applies the chosen tier to this page', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
  await page.goto('/brief/');
  const sw = page.locator('footer.footer [data-motion-switch]');
  await sw.getByRole('button', { name: SITE.motion.off.zh }).click();
  await expect.poll(() => tier(page)).toBe('off');
  await expect(sw.locator('button[aria-pressed="true"]')).toHaveText(SITE.motion.off.zh);
});

test('gentle: once a block is revealed its children keep their own transforms (a centred or rotated child stays put)', async ({ page }) => {
  await motionChoice(page, 'gentle');
  await page.goto('/brief/');
  const t = await page.evaluate(() => {
    const host = document.createElement('div');
    host.className = 'm-armed m-in';
    host.innerHTML = '<span style="display:inline-block; transform: rotate(45deg)">x</span>';
    document.body.append(host);
    return getComputedStyle(host.firstElementChild!).transform;
  });
  expect(t).not.toBe('none');
});

test.describe('storage blocked: choosing off stops animation loops that are already running', () => {
  test.skip(({ isMobile }) => !!isMobile, 'run once');
  // Count the draw calls each loop makes every frame (WebGL drawArrays for the prologue, 2D clearRect for the topology),
  // so the test does not depend on how the bundler names chunks or on GSAP's own ticker.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });
      const w = window as unknown as { draws: number };
      w.draws = 0;
      const count = (proto: { [k: string]: unknown }, name: string) => {
        const orig = proto[name] as (...a: unknown[]) => unknown;
        proto[name] = function (this: unknown, ...a: unknown[]) { w.draws++; return orig.apply(this, a); };
      };
      count(WebGL2RenderingContext.prototype as unknown as { [k: string]: unknown }, 'drawArrays');
      count(CanvasRenderingContext2D.prototype as unknown as { [k: string]: unknown }, 'clearRect');
    });
  });
  const drawsIn = async (page: import('@playwright/test').Page, ms: number) => {
    const before = await page.evaluate(() => (window as unknown as { draws: number }).draws);
    await page.waitForTimeout(ms);
    return (await page.evaluate(() => (window as unknown as { draws: number }).draws)) - before;
  };
  // Clicked in place: a normal click would scroll to the footer switch and take the animation off screen, which stops
  // it for a different reason.
  const turnOff = async (page: import('@playwright/test').Page) => {
    await page.locator('[data-motion-switch]').first().getByRole('button', { name: SITE.motion.off.zh }).evaluate(b => (b as HTMLButtonElement).click());
    await page.waitForTimeout(300);
  };

  test('HRIS archive topology', async ({ page }) => {
    await page.goto('/hris/');
    await expect(page.locator('[data-topology]')).toHaveClass(/is-live/);
    expect(await drawsIn(page, 600)).toBeGreaterThan(10);
    await turnOff(page);
    expect(await drawsIn(page, 800)).toBe(0);
  });

  test('insights particle prologue', async ({ page }) => {
    await page.goto('/projects/campus-delivery/insights/');
    await expect.poll(() => drawsIn(page, 400), { timeout: 15_000 }).toBeGreaterThan(10);
    await turnOff(page);
    expect(await drawsIn(page, 800)).toBe(0);
  });
});
