import { test, expect } from '@playwright/test';
import { skipIntro } from './helpers';

for (const [lang, path, h1] of [['zh', '/privacy/', '隐私与使用说明'], ['en', '/en/privacy/', 'Privacy & use']] as const) {
  test(`privacy page (${lang}) opens from the footer`, async ({ page }) => {
    await skipIntro(page);
    await page.goto(lang === 'zh' ? '/brief/' : '/en/brief/');   // the home page has no footer
    await page.locator('.footer a[href$="privacy/"]').click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.locator('h1')).toHaveText(h1);
    await expect(page.locator('main')).toContainText('hyj-intro-seen');
  });
}
