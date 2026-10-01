import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PAGES, skipIntro } from './helpers';

for (const p of PAGES) {
  test(`no serious a11y issues on ${p}`, async ({ page }) => {
    await skipIntro(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(p);
    // QuotaDeck's tray UI is vendored unmodified at e9557c6 (exhibited work); its own palette is outside this site's
    // tokens. The page chrome around it is still checked.
    const { violations } = await new AxeBuilder({ page }).exclude('#qd-frame').analyze();
    const bad = violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
    expect(bad.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
}
