import { test, expect } from '@playwright/test';
import { fact } from '../../src/data/facts';
import { skipIntro, motionOff } from './helpers';

test('the overview line streams in and keeps its exact text', async ({ page }) => {
  await skipIntro(page);
  await page.goto('/brief/');
  const line = page.locator('.b-id__line [data-stream]');
  await expect(line).toHaveClass(/is-on/);
  await expect(line).toHaveText(fact('F1').text.zh);
  const chunks = line.locator('.stream__c');
  expect(await chunks.count()).toBeGreaterThan(5);
  await expect.poll(() => chunks.last().evaluate(el => getComputedStyle(el).opacity), { timeout: 4000 }).toBe('1');
});

test('on the home page the line waits for the intro', async ({ page }) => {
  await page.goto('/');
  const line = page.locator('.home__line [data-stream]');
  await expect(page.locator('[data-intro]')).toBeVisible();
  await expect(line).not.toHaveClass(/is-on/);
  await expect(line).toHaveClass(/is-on/, { timeout: 4000 });
});

test('motion off: plain text, no caret', async ({ page }) => {
  await skipIntro(page);
  await motionOff(page);
  await page.goto('/brief/');
  await expect(page.locator('.b-id__line .stream__c')).toHaveCount(0);
  await expect(page.locator('.b-id__line')).toHaveText(fact('F1').text.zh);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('without JavaScript the streamed lines are plain text', async ({ page }) => {
    await page.goto('/projects/ai-career/');
    expect(await page.locator('.p-lead').evaluate(el => getComputedStyle(el.querySelector('[data-stream]')!).opacity)).toBe('1');
  });
});
