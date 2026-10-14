import { test, expect } from '@playwright/test';
import { trackProjects } from '../../src/data/tracks';
import { liveBytes, formatSize } from '../../src/data/live-size';
import { SITE } from '../../src/data/site';
import { noHorizontalOverflow } from './helpers';

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test(`cards (${lang}) pair each project with its live edition`, async ({ page }) => {
    await page.goto(`${prefix}/projects/`);
    for (const p of trackProjects('ai')) {
      const card = page.locator('.pcard').filter({ has: page.locator(`a.prow[href="${prefix}${p.href}"]`) });
      await expect(card, p.slug).toHaveCount(1);
      await expect(card.locator('a.pcard__act').first()).toHaveText(`${SITE.cards.read[lang]} →`);
      const live = card.locator('a.pcard__live');
      if (p.live) {
        await expect(live).toHaveAttribute('href', `${prefix}${p.live.href}`);
        await expect(live.locator('[data-size]')).toHaveText(formatSize(liveBytes(p.live.size), lang));
      } else {
        await expect(live).toHaveCount(0);
      }
    }
    expect(await noHorizontalOverflow(page)).toBe(true);
  });
}

test('keyboard reaches the live edition right after its card', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'keyboard');
  await page.goto('/projects/');
  const row = page.locator('a.prow[href="/projects/ai-career/"]');
  await row.focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('a.pcard__live[href="/projects/ai-career/live/"]')).toBeFocused();
});

test('hovering a card draws the trace around it', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'hover only');
  await page.goto('/projects/');
  const card = page.locator('.pcard').first();
  const rect = card.locator('.pcard__trace rect');
  await expect.poll(() => rect.evaluate(el => Number(getComputedStyle(el).strokeDashoffset.replace('px', '')))).toBeGreaterThan(0.5);
  await card.hover();
  await expect.poll(() => rect.evaluate(el => Number(getComputedStyle(el).strokeDashoffset.replace('px', ''))), { timeout: 2000 }).toBeLessThan(0.05);
});
