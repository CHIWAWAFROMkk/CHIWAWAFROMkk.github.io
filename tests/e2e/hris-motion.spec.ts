import { test, expect, type Page } from '@playwright/test';
import { CASES } from '../../src/scripts/hris-demo';
import { noHorizontalOverflow } from './helpers';

const shownLines = (page: Page) => page.locator('[data-card] [data-line]:not([hidden])').count();

async function hoverStep(page: Page, index: number) {
  await page.locator('[data-steps]').scrollIntoViewIfNeeded();
  const box = (await page.locator('[data-steps]').boundingBox())!;
  await page.mouse.move(box.x + (box.width / 6) * (index + 0.5), box.y + box.height / 2);
}

test.describe('HRIS step scrubbing', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/projects/hris-workflow/'); });

  test('hovering a step shows the record card up to that step, and leaving restores it', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'hover');
    const full = CASES[0].trail.length;
    await expect.poll(() => shownLines(page)).toBe(full);
    await hoverStep(page, 2);
    await expect.poll(() => shownLines(page)).toBe(3);
    await expect(page.locator('[data-steps]')).toHaveAttribute('aria-valuenow', '3');
    await page.mouse.move(5, 5);
    await expect.poll(() => shownLines(page)).toBe(full);
  });

  test('past the stopping step the card says the step never ran', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'hover');
    await page.locator('[data-case="DEMO-002"]').click();
    await hoverStep(page, 4);
    await expect(page.locator('[data-card] [data-line].is-stop')).toHaveCount(1);
    await expect(page.locator('[data-card] [data-skipped]')).toBeVisible();
  });

  test('arrow keys scrub the steps too', async ({ page }) => {
    await page.locator('[data-steps]').focus();
    await page.keyboard.press('Home');
    await expect.poll(() => shownLines(page)).toBe(1);
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => shownLines(page)).toBe(2);
  });
});

test.describe('HRIS scroll scenes', () => {
  test('the diagram changes scene as each section reaches the reading line', async ({ page }) => {
    await page.goto('/projects/hris-workflow/');
    const scenes = page.locator('[data-scenes]');
    const headings = page.locator('.hris-text h2');
    await headings.nth(0).evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 100));
    await expect(scenes).toHaveAttribute('data-scene', '1');
    await headings.nth(2).evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 100));
    await expect(scenes).toHaveAttribute('data-scene', '3');
    await headings.nth(4).evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 100));
    await expect(scenes).toHaveAttribute('data-scene', '5');
    expect(await noHorizontalOverflow(page)).toBe(true);
  });
});

test.describe('HRIS background', () => {
  test('a decorative data-row layer drifts with scrolling, never catching clicks', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'run once');
    await page.goto('/projects/hris-workflow/');
    const layer = page.locator('[data-rows]');
    await expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(await layer.evaluate(el => getComputedStyle(el).pointerEvents)).toBe('none');
    const before = await layer.evaluate(el => getComputedStyle(el).getPropertyValue('--s'));
    await page.mouse.wheel(0, 1200);
    await expect.poll(() => layer.evaluate(el => getComputedStyle(el).getPropertyValue('--s'))).not.toBe(before);
  });

  test('reduced motion keeps the background still', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'run once');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/projects/hris-workflow/');
    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(300);
    expect((await page.locator('[data-rows]').evaluate(el => getComputedStyle(el).getPropertyValue('--s'))).trim()).toBe('0');
  });
});
