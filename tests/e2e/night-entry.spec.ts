import { test, expect } from '@playwright/test';
import { skipIntro, motionOff } from './helpers';

test('the film zone fades up from black as it scrolls in', async ({ page }) => {
  await skipIntro(page);
  await page.goto('/projects/');
  const dim = page.locator('.i-film > .night-dim');
  await expect(dim).toHaveCount(1);
  expect(await dim.evaluate(el => getComputedStyle(el).opacity)).toBe('1');
  await page.locator('.i-film').scrollIntoViewIfNeeded();
  await expect.poll(() => dim.evaluate(el => Number(getComputedStyle(el).opacity)), { timeout: 3000 }).toBe(0);
});

test('motion off: no dimmer at all', async ({ page }) => {
  await skipIntro(page);
  await motionOff(page);
  await page.goto('/projects/');
  await expect(page.locator('.night-dim')).toHaveCount(0);
});
