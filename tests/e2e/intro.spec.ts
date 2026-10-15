import { test, expect } from '@playwright/test';
import { motionOff } from './helpers';

const overlay = '[data-intro]';

test.describe('intro', () => {
  test.skip(({ isMobile }) => !!isMobile, 'timing checks run once on desktop');

  test('plays on first visit, then reveals the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(overlay)).toBeVisible();
    expect(await page.evaluate(() => document.getElementById('page')!.inert)).toBe(true);
    await expect(page.locator(overlay)).toBeFocused();
    await expect(page.locator(overlay)).toBeHidden({ timeout: 3500 });
    expect(await page.evaluate(() => document.getElementById('page')!.inert)).toBe(false);
  });

  test('when the cover lifts, the boot safety timer is cancelled, not left to cut the first screen short', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __cleared: number[] };
      const clear = window.clearTimeout.bind(window);
      w.__cleared = [];
      window.clearTimeout = (id?: number) => { if (id !== undefined) w.__cleared.push(id); clear(id); };
    });
    await page.goto('/');
    await expect(page.locator(overlay)).toBeVisible();
    const boot = await page.evaluate(() => (window as unknown as { __hyjMotionTimer?: number }).__hyjMotionTimer);
    expect(typeof boot).toBe('number');
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => (window as unknown as { __cleared: number[] }).__cleared)).toContain(boot);
  });

  test('Escape skips immediately', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(overlay)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator(overlay)).toBeHidden({ timeout: 300 });
  });

  test('skip button skips', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-intro-skip]').click();
    await expect(page.locator(overlay)).toBeHidden({ timeout: 300 });
  });

  test('Enter, Space, letters and Tab do not skip', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(overlay)).toBeVisible();
    for (const key of ['Enter', ' ', 'a', 'Tab']) await page.keyboard.press(key);
    await expect(page.locator(overlay)).toBeVisible();
  });

  test('focus stays inside the intro while it plays', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(overlay)).toBeVisible();
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => !!document.activeElement?.closest('[data-intro]') || document.activeElement === document.body), `tab ${i + 1}`).toBe(true);
    }
  });

  test('slow network: once the cover has lifted, the intro never starts', async ({ page }) => {
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
    // Astro's bundled stylesheet comes after the inline guess, so delaying it holds back the intro module but not the 3 s failsafe.
    await page.route('**/_astro/*.css', async r => { await delay(2600); await r.continue(); });
    await page.route('**/BarlowCondensed-Bold.woff2', async r => { await delay(3200); await r.continue(); });
    await page.goto('/', { waitUntil: 'commit' });
    await page.waitForFunction(() => document.readyState !== 'loading' || document.documentElement.classList.contains('intro-pending'));
    await page.waitForFunction(() => !document.documentElement.classList.contains('intro-pending'), null, { timeout: 6000 });
    // Sample without auto-retry: the page must stay usable, never re-covered, for the next 1.5 s.
    for (let i = 0; i < 8; i++) {
      const s = await page.evaluate(() => ({ playing: !!document.querySelector('.intro.is-playing'), inert: !!document.getElementById('page')?.inert }));
      expect(s, `sample ${i}`).toEqual({ playing: false, inert: false });
      await page.waitForTimeout(200);
    }
  });

  test('second visit shows the page with no intro at all', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Escape');
    await page.reload();
    expect(await page.evaluate(() => document.documentElement.classList.contains('intro-pending'))).toBe(false);
    await expect(page.locator(overlay)).toBeHidden();
    await expect(page.locator('.home__name')).toBeVisible();
  });

  test('reduced motion: a short fade instead', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator(overlay)).toHaveClass(/is-gentle/);
    expect(await page.locator(overlay).evaluate(el => getComputedStyle(el).animationName)).toBe('intro-gentle');
    await expect(page.locator(overlay)).toBeHidden({ timeout: 1500 });
    await expect(page.locator('.home__name')).toBeVisible();
  });

  test('Escape skips the gentle intro', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator(overlay)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator(overlay)).toBeHidden({ timeout: 300 });
  });

  test('motion off: no intro', async ({ page }) => {
    await motionOff(page);
    await page.goto('/');
    await expect(page.locator(overlay)).toBeHidden();
    await expect(page.locator('.home__name')).toBeVisible();
  });

  test('letters stream in and the trace draws before the cover lifts', async ({ page }) => {
    await page.goto('/');
    const first = page.locator('.intro__line').first().locator('b > span').first();
    const last = page.locator('.intro__line').last().locator('b > span').last();
    await expect.poll(() => first.evaluate(el => getComputedStyle(el).opacity)).toBe('1');
    expect(await last.evaluate(el => getComputedStyle(el).opacity)).toBe('0');
    // Sample densely: the line finishes at about 1.85 s and the cover hides at 2.4 s, which resets the computed value.
    await expect.poll(() => page.locator('.intro__trace path').evaluate(el => parseFloat(getComputedStyle(el).strokeDashoffset)), { timeout: 2500, intervals: [50] }).toBeLessThan(0.05);
  });

  test('storage blocked: intro still plays once and the page works', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });
    });
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/');
    await expect(page.locator(overlay)).toBeHidden({ timeout: 3500 });
    await expect(page.locator('a.door').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('intro script crashes: the page is uncovered within 3 seconds', async ({ page }) => {
    // document.fonts throwing makes the intro module crash before it can lift the cover.
    await page.addInitScript(() => { Object.defineProperty(Document.prototype, 'fonts', { get() { throw new Error('boom'); } }); });
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.classList.contains('intro-pending'))).toBe(true);
    await page.waitForTimeout(3200);
    expect(await page.evaluate(() => document.documentElement.classList.contains('intro-pending'))).toBe(false);
    await expect(page.locator('a.door').first()).toBeVisible();
  });
});

test.describe('intro without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('overlay never shows', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(overlay)).toBeHidden();
    await expect(page.locator('.home__name')).toBeVisible();
  });
});

test.describe('intro letters and trace', () => {
  test.skip(({ isMobile }) => !!isMobile, 'timing checks run once on desktop');

  test('every letter of every word is shown by the end of the stream', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1700);
    const hidden = await page.locator('.intro__line b > span').evaluateAll(els => els.filter(el => getComputedStyle(el).opacity !== '1').map(el => el.textContent));
    expect(hidden).toEqual([]);
  });

  test('the trace is hidden at the start and drawn by the end', async ({ page }) => {
    await page.goto('/');
    const svg = page.locator('.intro__trace');
    // The left inset is the hidden share of the line: 100% at the start, 0 once drawn.
    const leftInset = () => svg.evaluate(el => {
      const parts = getComputedStyle(el).clipPath.match(/inset\(([^)]*)\)/)?.[1].trim().split(/\s+/) ?? ['0'];
      return parseFloat(parts[parts.length === 4 ? 3 : parts.length === 2 ? 1 : 0]);
    });
    expect(await leftInset()).toBe(100);
    await expect.poll(leftInset, { timeout: 2500, intervals: [50] }).toBeLessThan(0.5);
  });
});
