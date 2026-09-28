import { test, expect, type Page } from '@playwright/test';
import { skipIntro } from './helpers';

async function tabTo(page: Page, selector: string, max = 80) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    if (await page.evaluate(s => document.activeElement?.matches(s) ?? false, selector)) return;
  }
  throw new Error(`Tab never reached ${selector}`);
}

async function expectVisibleFocus(page: Page) {
  const style = await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle);
  expect(style).not.toBe('none');
}

for (const [prefix, lang] of [['', 'zh'], ['/en', 'en']] as const) {
  test(`keyboard path home → overview → HRIS → résumé (${lang})`, async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'keyboard path runs on desktop');
    await skipIntro(page);
    await page.goto(`${prefix}/`);
    await tabTo(page, `a.door[href="${prefix}/brief/"]`);
    await expectVisibleFocus(page);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`${prefix}/brief/$`));
    await tabTo(page, `a.prow[href="${prefix}/projects/hris-workflow/"]`);
    await expectVisibleFocus(page);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/hris-workflow\/$/);
    await tabTo(page, `a.nav__resume[href$="heyanjun-resume-${lang}.pdf"]`);
    await expectVisibleFocus(page);
  });
}
