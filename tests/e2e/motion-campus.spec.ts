import { test, expect, type Page } from '@playwright/test';

const CAMPUS = '/projects/campus-delivery/';
// Chrome reports the calc() offset as e.g. 'calc(0.565px)'.
const offset = (page: Page) => page.locator('[data-relations] .rel-wire').first().evaluate(el => parseFloat(getComputedStyle(el).strokeDashoffset.replace(/^calc\(/, '')));
async function placeTop(page: Page, sel: string, fraction: number) {
  await page.locator(sel).first().evaluate((el, f) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - innerHeight * f), fraction);
}

test.describe('relations diagram', () => {
  test('the picture becomes a live diagram with the same description', async ({ page }) => {
    await page.goto(CAMPUS);
    const fig = page.locator('.prose [data-relations]');
    await expect(fig).toHaveCount(1);
    await expect(page.locator('.prose img[src$="delivery-relations.svg"]')).toHaveCount(0);
    await expect(fig.locator('svg')).toHaveAttribute('aria-label', '以订单为中心的业务关系');
    await expect(fig.locator('[data-box]')).toHaveCount(6);
    await expect(fig.locator('.rel-wire')).toHaveCount(5);
  });

  test('wires draw as the diagram scrolls through the screen', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'run once');
    await page.goto(CAMPUS);
    await placeTop(page, '[data-relations]', 0.8);
    await expect.poll(() => offset(page)).toBeGreaterThan(0.8);
    await placeTop(page, '[data-relations]', 0.2);
    await expect.poll(() => offset(page)).toBeLessThan(0.3);
    await expect(page.locator('[data-relations] [data-box]').last()).toHaveClass(/is-in/);
  });

  test('reduced motion: wires fully drawn, boxes visible', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(CAMPUS);
    expect(await offset(page)).toBe(0);
    await expect(page.locator('[data-relations] [data-box].reveal')).toHaveCount(0);
  });
});

test.describe('key decisions', () => {
  test('six numbered decisions rise in as they scroll into view', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'run once');
    await page.goto(CAMPUS);
    const h = page.locator('.prose h3.decision');
    await expect(h).toHaveCount(6);
    expect(await h.first().evaluate(el => getComputedStyle(el, '::before').content)).not.toBe('none');
    await expect(h.first()).not.toHaveClass(/is-in/);
    await h.first().scrollIntoViewIfNeeded();
    await expect(h.first()).toHaveClass(/is-in/);
  });

  test('English page: same structure, English label', async ({ page }) => {
    await page.goto(`/en${CAMPUS}`);
    await expect(page.locator('.prose [data-relations] svg')).toHaveAttribute('aria-label', 'Order-centred relationships (diagram in Chinese)');
    await expect(page.locator('.prose h3.decision')).toHaveCount(6);
  });
});
