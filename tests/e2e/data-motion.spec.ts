import { test, expect } from '@playwright/test';
import { skipIntro, noHorizontalOverflow } from './helpers';

test.describe('odometer', () => {
  test('the overview number spins and ends as plain text', async ({ page }) => {
    await skipIntro(page);
    await page.goto('/brief/');
    const num = page.locator('.evidence .num[data-fact="F6"]');
    await expect(num).toHaveAttribute('data-spun', '', { timeout: 5000 });
    await expect(num).toHaveText('2000');
    await expect(num.locator('.odo, .sr')).toHaveCount(0);
  });

  test('text stays final while the reels spin', async ({ page }) => {
    await skipIntro(page);
    await page.goto('/brief/');
    const num = page.locator('.evidence .num[data-fact="F6"]');
    for (let i = 0; i < 10; i++) {
      expect(await num.evaluate(el => el.textContent)).toBe('2000');
      await page.waitForTimeout(80);
    }
  });

  test('the reels never change the height of the line (no layout shift)', async ({ page }) => {
    await skipIntro(page);
    await page.goto('/brief/');
    const num = page.locator('.evidence .num[data-fact="F6"]');
    await expect(num.locator('.odo')).toHaveCount(1, { timeout: 3000 });
    const during = await num.evaluate(el => el.getBoundingClientRect().height);
    await expect(num).toHaveAttribute('data-spun', '', { timeout: 5000 });
    const after = await num.evaluate(el => el.getBoundingClientRect().height);
    expect(Math.abs(during - after)).toBeLessThanOrEqual(1);
  });

  test('reduced motion shows the number without reels', async ({ page }) => {
    await skipIntro(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/brief/');
    await page.waitForTimeout(800);
    await expect(page.locator('.evidence .num .odo')).toHaveCount(0);
    await expect(page.locator('.evidence .num[data-spun]')).toHaveCount(0);
  });

  test('rapid filters leave the final value and no reels', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'run once');
    await page.goto('/projects/campus-delivery/insights/');
    await page.locator('[data-cockpit]').scrollIntoViewIfNeeded();
    await expect(page.locator('#ck-from')).toBeEnabled({ timeout: 25000 });
    for (const v of ['2', '5', '9', '3']) await page.locator('#ck-from').fill(v);
    await expect(page.locator('[data-kpi="orders"] .odo')).toHaveCount(0, { timeout: 5000 });
    await expect(page.locator('[data-kpi="orders"]')).toHaveAttribute('data-spun', '');
  });
});

test.describe('impact on the SQL page', () => {
  const read = (page: import('@playwright/test').Page) => page.evaluate(() => ({
    kpis: [...document.querySelectorAll('.an__kpi .kpi__v')].map(e => e.textContent),
    cells: [...document.querySelectorAll('.an__cards table td')].map(e => e.textContent),
  }));

  test('indicators slam in, tables decode, and every value ends as rendered', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'run once');
    await page.goto('/projects/campus-delivery/');
    const before = await read(page);
    await expect(page.locator('.an__kpi')).toHaveClass(/is-armed/);
    await page.locator('.an__kpi').scrollIntoViewIfNeeded();
    await expect(page.locator('.kpi__k.is-hit')).toHaveCount(4, { timeout: 4000 });
    await page.locator('.an__cards').scrollIntoViewIfNeeded();
    await page.waitForTimeout(2500);
    expect(await read(page)).toEqual(before);
    await expect(page.locator('.an__cards .scanline')).toHaveCount(0);
  });

  test('reduced motion: no arming, no scan', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/projects/campus-delivery/');
    await page.locator('.an__cards').scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await expect(page.locator('.an__kpi.is-armed')).toHaveCount(0);
    await expect(page.locator('.kpi__k.is-hit')).toHaveCount(0);
    await expect(page.locator('.an__cards .scanline')).toHaveCount(0);
  });
});

test('an older spin never overwrites a newer value', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.goto('/projects/campus-delivery/insights/');
  await page.locator('[data-cockpit]').scrollIntoViewIfNeeded();
  await expect(page.locator('#ck-from')).toBeEnabled({ timeout: 25000 });
  await page.locator('#ck-from').fill('16');
  await page.locator('input[name="merchant"][value="8"]').check();
  await page.waitForTimeout(400);
  await page.locator('input[name="area"][value="东区"]').check();
  const aov = page.locator('[data-kpi="aov"]');
  await expect(aov).toHaveText('—');
  await page.waitForTimeout(2000);
  expect(await aov.textContent()).toBe('—');
});

test('the reels keep the width of the final text (no sideways jump, spaces kept)', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await skipIntro(page);
  await page.goto('/brief/');
  const num = page.locator('.evidence .num[data-fact="F6"]');
  await expect(num.locator('.odo')).toHaveCount(1, { timeout: 3000 });
  const during = await num.evaluate(el => el.getBoundingClientRect().width);
  await expect(num).toHaveAttribute('data-spun', '', { timeout: 5000 });
  const after = await num.evaluate(el => el.getBoundingClientRect().width);
  expect(Math.abs(during - after)).toBeLessThanOrEqual(1);
  await page.goto('/projects/campus-delivery/insights/');
  await page.locator('[data-cockpit]').scrollIntoViewIfNeeded();
  await expect(page.locator('#ck-from')).toBeEnabled({ timeout: 25000 });
  await page.locator('#ck-from').fill('5');
  const min = page.locator('[data-kpi="minutes"]');
  await expect(min.locator('.odo')).toHaveCount(1, { timeout: 3000 });
  const w1 = await min.evaluate(el => (el.querySelector('.odo') as HTMLElement).getBoundingClientRect().width);
  await expect(min).toHaveAttribute('data-spun', '', { timeout: 5000 });
  const w2 = await min.evaluate(el => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect().width; });
  expect(Math.abs(w1 - w2)).toBeLessThanOrEqual(1);
});

test('the slam never widens the page', async ({ page }) => {
  await page.goto('/projects/campus-delivery/');
  await page.locator('.an__kpi').scrollIntoViewIfNeeded();
  for (let i = 0; i < 20; i++) {
    expect(await noHorizontalOverflow(page), `at ${i * 100} ms`).toBe(true);
    await page.waitForTimeout(100);
  }
});
