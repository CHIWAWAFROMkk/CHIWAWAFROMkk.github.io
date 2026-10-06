import { chromium, test, expect, type Page } from '@playwright/test';

/* Batch 4: the light pages' motion made visible — doors, summary rows, count-ups,
   section rules, programs powering on, the trailing preview. */
const skipIntro = (page: Page) => page.addInitScript(() => localStorage.setItem('hyj-intro-seen', '1'));
const allShown = (page: Page, sel: string) => page.locator(sel).evaluateAll(els => els.every(el => getComputedStyle(el).opacity === '1'));
const shownOnScreen = (page: Page, sel: string) => page.locator(sel).evaluateAll(els => els
  .filter(el => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; })
  .every(el => getComputedStyle(el).opacity === '1'));
const scaleX = (page: Page, sel: string) => page.locator(sel).first().evaluate(el => {
  const t = getComputedStyle(el, '::after').transform;
  return t === 'none' ? 1 : new DOMMatrix(t).a;
});

test.describe('motion batch 4: the light pages', () => {
  test.beforeEach(async ({ page }) => { await skipIntro(page); });

  test('home: the doors rise in order after the name and end fully shown', async ({ page, isMobile }) => {
    await page.goto('/');
    const parts = page.locator('.door [data-m-pre]');
    await expect(parts).toHaveCount(8);
    await expect(page.locator('.door .door__big.m-in')).toHaveCount(2);
    const delays = await page.locator('.door .door__big').evaluateAll(els => els.map(el => parseInt(getComputedStyle(el).getPropertyValue('--m-d'))));
    expect(delays[1]).toBeGreaterThan(delays[0]);
    await expect.poll(() => allShown(page, '.door [data-m-pre]'), { timeout: 4000 }).toBe(true);
    await expect.poll(() => page.locator('.door__big').evaluateAll(els => els.every(el => getComputedStyle(el).transform === 'none')), { timeout: 4000 }).toBe(true);
    const titlesClear = () => page.locator('.door').evaluateAll(doors => doors.every(door => {
      const big = door.querySelector('.door__big')!.getBoundingClientRect();
      const title = door.querySelector('.door__title')!.getBoundingClientRect();
      return big.bottom <= title.top;
    }));
    expect(await titlesClear()).toBe(true);
    if (!isMobile) {
      await page.setViewportSize({ width: 1814, height: 660 });
      expect(await titlesClear()).toBe(true);
    }
    await page.locator('a.door').first().click();
    await expect(page).toHaveURL(/\/brief\/$/);
  });

  test('a project summary writes itself in, and its count keeps the original format', async ({ page, isMobile }) => {
    await page.addInitScript(() => {
      const seen: string[] = (window as unknown as { __counts: string[] }).__counts = [];
      new MutationObserver(() => {
        const n = document.querySelector('.p-row [data-count]');
        if (n && seen.at(-1) !== n.textContent) seen.push(n.textContent ?? '');
      }).observe(document, { subtree: true, childList: true, characterData: true });
    });
    await page.goto('/projects/hris-workflow/');
    await page.locator('.p-row').last().scrollIntoViewIfNeeded();
    await expect(page.locator('.p-row.m-in')).toHaveCount(5, { timeout: 4000 });
    await expect.poll(() => allShown(page, '.p-row dt, .p-row dd'), { timeout: 4000 }).toBe(true);
    const count = page.locator('.p-row [data-count]');
    await expect(count).toHaveText('2000', { timeout: 4000 });
    const seen = await page.evaluate(() => (window as unknown as { __counts: string[] }).__counts);
    // It really counted (on a narrow screen countup-dom keeps a number static if counting would rewrap the line).
    if (!isMobile) expect(seen.length).toBeGreaterThan(2);
    expect(seen.filter(t => t.includes(','))).toEqual([]);           // and never as "1,260"
    expect(await page.locator('.p-row dd').nth(1).textContent()).toContain('约 2000 名员工');
  });

  test('a section heading draws its rule, then rises onto it', async ({ page }) => {
    await page.goto('/projects/campus-delivery/');
    const head = page.locator('[data-m-head="rule"].m-armed').first();
    await expect(head).toBeAttached();
    expect(await head.evaluate(el => getComputedStyle(el).borderBottomColor)).toBe('rgba(0, 0, 0, 0)');
    expect(await head.evaluate(el => new DOMMatrix(getComputedStyle(el, '::after').transform).a)).toBe(0);
    await head.scrollIntoViewIfNeeded();
    await expect(head).toHaveClass(/m-in/);
    await expect.poll(() => scaleX(page, '[data-m-head="rule"].m-in'), { timeout: 4000 }).toBe(1);
    await expect.poll(() => head.locator('> *').evaluateAll(els => els.every(el => getComputedStyle(el).opacity === '1')), { timeout: 4000 }).toBe(true);
    await expect(head.locator('h2')).toHaveAttribute('data-section-motion', '');
  });

  test('unfinished headings show after a real back-forward cache restore', async ({ baseURL, isMobile }) => {
    test.skip(!!isMobile, 'the desktop Edge cache path is covered here');
    const browser = await chromium.launch({ channel: 'msedge', ignoreDefaultArgs: ['--disable-back-forward-cache'] });
    try {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const cachedPage = await context.newPage();
      await cachedPage.addInitScript(() => {
        localStorage.setItem('hyj-intro-seen', '1');
        addEventListener('pageshow', event => {
          if (event.persisted) document.documentElement.dataset.bfcacheRestored = 'true';
        });
      });
      await cachedPage.goto(baseURL + '/projects/campus-delivery/', { waitUntil: 'networkidle' });
      const heading = cachedPage.locator('article.prose h2[data-m-head="plain"].m-armed:not(.m-in)').first();
      await expect(heading).toBeAttached();
      const title = await heading.textContent();
      await cachedPage.goto(baseURL + '/privacy/', { waitUntil: 'networkidle' });
      await cachedPage.goBack({ waitUntil: 'commit' });
      await expect(cachedPage.locator('html')).toHaveAttribute('data-bfcache-restored', 'true');
      const restored = cachedPage.locator('article.prose h2').filter({ hasText: title! }).first();
      await restored.scrollIntoViewIfNeeded();
      await expect(restored).not.toHaveClass(/m-armed/);
      await expect(restored).toHaveCSS('opacity', '1');
    } finally {
      await browser.close();
    }
  });

  test('a program below the fold powers on with a red sweep, then its parts rise', async ({ page }) => {
    await page.goto('/projects/campus-delivery/');
    const boot = page.locator('[data-m-boot="line"].m-armed').first();
    await expect(boot).toBeAttached();
    expect(await boot.locator('> *').first().evaluate(el => getComputedStyle(el).opacity)).toBe('0');
    await boot.scrollIntoViewIfNeeded();
    await expect(boot).toHaveClass(/m-in/);
    expect(await boot.evaluate(el => getComputedStyle(el, '::before').animationName)).toBe('m-boot-line');
    await expect.poll(() => boot.locator('> *').evaluateAll(els => els.every(el => getComputedStyle(el).opacity === '1')), { timeout: 4000 }).toBe(true);
  });

  test('the project numbers tick up to their place and the preview trails the pointer on both axes', async ({ page, isMobile }) => {
    await page.goto('/projects/');
    await expect(page.locator('a.prow .prow__n').first()).toHaveText('01');
    await expect.poll(async () => (await page.locator('a.prow .prow__n').allTextContents()).every((n, i) => n === String(i + 1).padStart(2, '0')), { timeout: 4000 }).toBe(true);
    test.skip(!!isMobile, 'no hover preview on touch');
    const row = page.locator('a.prow').nth(2);
    const box = (await row.boundingBox())!;
    const at = async (x: number, y: number) => {
      await page.mouse.move(box.x + x, box.y + y);
      await page.waitForTimeout(600);
      return row.locator('.prow__preview').evaluate(el => { const m = new DOMMatrix(getComputedStyle(el).transform); return [m.e, m.f]; });
    };
    const [x1, y1] = await at(400, 8);
    const [x2, y2] = await at(700, box.height - 8);
    expect(x2 - x1).toBeGreaterThan(200);
    expect(y2 - y1).toBeGreaterThan(20);
  });

  test('a keyboard-focused preview stays inside a narrow desktop viewport', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'touch has no preview');
    await page.setViewportSize({ width: 640, height: 900 });
    await page.goto('/projects/');
    const row = page.locator('a.prow').nth(1);
    const preview = row.locator('.prow__preview');
    const inside = async (width: number) => {
      const box = (await preview.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    };
    await row.focus();
    await expect(preview).toHaveCSS('opacity', '1');
    await inside(640);
    await page.setViewportSize({ width: 1440, height: 900 });
    const rowBox = (await row.boundingBox())!;
    await page.mouse.move(1000, rowBox.y + rowBox.height / 2);
    await expect.poll(() => row.evaluate(el => Number.parseInt(el.style.getPropertyValue('--px')))).toBeGreaterThan(640);
    await page.setViewportSize({ width: 640, height: 900 });
    await row.focus();
    await expect.poll(async () => {
      const box = (await preview.boundingBox())!;
      return box.x + box.width;
    }).toBeLessThanOrEqual(640);
    await page.setViewportSize({ width: 320, height: 900 });
    await expect.poll(async () => {
      const box = (await preview.boundingBox())!;
      return box.x + box.width;
    }).toBeLessThanOrEqual(320);
    await inside(320);
  });

  test('reduced motion: nothing is ever armed and every part shows at once', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const path of ['/', '/projects/hris-workflow/', '/projects/campus-delivery/', '/en/projects/']) {
      await page.goto(path);
      await page.waitForTimeout(300);
      await expect(page.locator('.m-armed')).toHaveCount(0);
      expect(await allShown(page, '[data-m-pre], .p-row > *, [data-m-boot] > *'), path).toBe(true);
    }
  });

  test('a motion script that arrives after the deadline never hides what is already showing', async ({ page }) => {
    await page.route(/\/_astro\/(?:ProjectMotion|Gate)\.astro_[^/]+\.js$/, async route => { await new Promise(r => setTimeout(r, 3200)); await route.continue(); });
    for (const path of ['/projects/hris-workflow/', '/']) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2700);
      const shown = () => shownOnScreen(page, '.p-row dt, .p-row dd, .door [data-m-pre]');
      expect(await shown(), `${path} at the deadline`).toBe(true);
      await page.waitForTimeout(1200);                                  // the late script has run
      expect(await shown(), `${path} after the late script`).toBe(true);
    }
  });

  test('a late program script does not hide a visible workbench', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'the desktop fold boundary is covered here');
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    await page.route(/\/_astro\/ProjectMotion\.astro_[^/]+\.js$/, async route => {
      await gate;
      await route.continue();
    });
    try {
      await page.goto('/projects/campus-delivery/', { waitUntil: 'commit' });
      await page.waitForFunction(() => document.documentElement.classList.contains('motion-timeout'));
      const workbench = page.locator('main div[data-demo] > section').first();
      await workbench.waitFor({ state: 'attached' });
      await workbench.evaluate(el => scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * 0.85));
      const top = await workbench.evaluate(el => el.getBoundingClientRect().top);
      expect(top).toBeGreaterThan(720);
      expect(top).toBeLessThan(900);
      expect(await workbench.locator('> *').first().evaluate(el => getComputedStyle(el).opacity)).toBe('1');
      release();
      await expect.poll(() => workbench.evaluate(el => el.hasAttribute('data-m-boot'))).toBe(true);
      await expect(workbench).not.toHaveClass(/m-armed/);
      expect(await workbench.locator('> *').first().evaluate(el => getComputedStyle(el).opacity)).toBe('1');
    } finally {
      release();
    }
  });

  test('without JS the summary, doors and programs are all plainly visible', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    for (const path of ['/', '/projects/hris-workflow/', '/projects/campus-delivery/']) {
      await page.goto(baseURL + path);
      expect(await allShown(page, '[data-m-pre], .p-row > *, main section[data-demo] > *'), path).toBe(true);
    }
    await context.close();
  });
});
