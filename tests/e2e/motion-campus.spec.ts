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

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test.describe(`transaction band (${lang})`, () => {
    const status = (page: Page) => page.locator('#order-status');
    const band = (page: Page) => page.locator('[data-band="place"]');
    async function ready(page: Page) {
      await page.goto(`${prefix}${CAMPUS}`);
      await page.locator('#order-form').scrollIntoViewIfNeeded();
      await expect(page.locator('#place-order')).toBeEnabled({ timeout: 20000 });
    }

    test('a placed order lights all five steps and commits', async ({ page, isMobile }) => {
      test.skip(!!isMobile, 'run once');
      await ready(page);
      await page.locator('#place-order').click();
      await expect(band(page)).toHaveAttribute('data-result', 'committed');
      await expect(band(page).locator('[data-step][data-state="on"]')).toHaveCount(5);
    });

    test('running out of stock fails at "items · stock" and rolls back', async ({ page, isMobile }) => {
      test.skip(!!isMobile, 'run once');
      await ready(page);
      await page.locator('#quantity').fill('20');
      for (let i = 0; i < 8; i++) {
        const before = (await status(page).textContent()) ?? '';
        await page.locator('#place-order').click();
        await expect(status(page)).not.toHaveText(before);
        if ((await status(page).textContent())!.includes(lang === 'zh' ? '库存不足' : 'Not enough stock')) break;
      }
      await expect(status(page)).toContainText(lang === 'zh' ? '库存不足' : 'Not enough stock');
      await expect(band(page)).toHaveAttribute('data-result', 'rolled-back');
      await expect(band(page).locator('[data-step]').nth(1)).toHaveAttribute('data-state', 'fail');
      await expect(band(page).locator('[data-step]').nth(0)).toHaveAttribute('data-state', 'idle');
    });

    test('an out-of-range quantity never enters the transaction', async ({ page, isMobile }) => {
      test.skip(!!isMobile, 'run once');
      await ready(page);
      await page.locator('#quantity').evaluate(el => { (el as HTMLInputElement).removeAttribute('max'); (el as HTMLInputElement).value = '25'; });
      await page.locator('#place-order').click();
      await expect(band(page)).toHaveAttribute('data-result', 'rejected');
      await expect(band(page).locator('[data-state="on"], [data-state="fail"]')).toHaveCount(0);
    });

    test('a refund plays its own three-step band', async ({ page, isMobile }) => {
      test.skip(!!isMobile, 'run once');
      await ready(page);
      await expect(page.locator('[data-band="refund"]')).toBeHidden();
      await page.locator('[data-refund]').first().click();
      const refund = page.locator('[data-band="refund"]');
      await expect(refund).toBeVisible();
      await expect(refund).toHaveAttribute('data-result', 'committed');
      await expect(refund.locator('[data-step][data-state="on"]')).toHaveCount(3);
    });
  });
}

test('a new order restarts the band', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.goto(CAMPUS);
  await page.locator('#order-form').scrollIntoViewIfNeeded();
  await expect(page.locator('#place-order')).toBeEnabled({ timeout: 20000 });
  await page.locator('#place-order').click();
  await expect(page.locator('#place-order')).toBeEnabled();
  await page.locator('#place-order').click();
  await expect(page.locator('[data-band="place"]')).toHaveAttribute('data-result', 'committed');
  await expect(page.locator('[data-band="place"] [data-state="fail"]')).toHaveCount(0);
});

test('reduced motion shows the band\'s end state at once', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'run once');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(CAMPUS);
  await page.locator('#order-form').scrollIntoViewIfNeeded();
  await expect(page.locator('#place-order')).toBeEnabled({ timeout: 20000 });
  await page.locator('#place-order').click();
  await expect(page.locator('[data-band="place"]')).toHaveAttribute('data-result', 'committed', { timeout: 1000 });
});

test.describe('query results', () => {
  async function runAllOrders(page: Page) {
    await page.goto(CAMPUS);
    await page.locator('[data-campus]').scrollIntoViewIfNeeded();
    await expect(page.locator('#run-query')).toBeEnabled({ timeout: 20000 });
    await page.locator('#sql-input').fill('SELECT * FROM orders');
    await page.locator('#run-query').click();
    await expect(page.locator('#sql-results tbody tr').nth(25)).toBeAttached();
  }

  test('the first twenty rows drop in, the rest appear at once', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'run once');
    await runAllOrders(page);
    await expect(page.locator('#sql-results tbody tr').nth(0)).toHaveClass(/drop/);
    await expect(page.locator('#sql-results tbody tr').nth(19)).toHaveClass(/drop/);
    await expect(page.locator('#sql-results tbody tr').nth(20)).not.toHaveClass(/drop/);
  });

  test('the row count rolls up visually while screen readers get the final text once', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'run once');
    await runAllOrders(page);
    const sr = page.locator('#sql-status .sr');
    await expect(sr).toHaveText(/\d+ 行/);
    await expect(page.locator('#sql-status [aria-hidden="true"]')).toHaveText((await sr.textContent())!);
  });
});
