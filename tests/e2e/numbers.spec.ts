import { test, expect } from '@playwright/test';
import { skipIntro } from './helpers';
import { strayTokens } from '../unit/digits';
import { factCorpus } from '../../src/data/facts';

// [data-demo] holds fictional demo records ("page 2"); [data-reel] holds shot ids and a clip counter — identifiers, not claims.
// script/style are removed because a detached clone's innerText includes their source.
const EXCLUDE = 'script, style, .prow__n, .door__index, [data-demo], [data-reel], .p-pager, .contact, .footer, .nav, .prose';

for (const p of ['/', '/brief/', '/projects/hris-workflow/', '/en/', '/en/brief/', '/en/projects/hris-workflow/']) {
  test(`every number on ${p} comes from the fact ledger`, async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'run once');
    await skipIntro(page);
    await page.goto(p);
    const text = await page.locator('main').evaluate((main, sel) => {
      const clone = main.cloneNode(true) as HTMLElement;
      clone.querySelectorAll(sel).forEach(el => el.remove());
      return clone.innerText;
    }, EXCLUDE);
    expect(strayTokens(text, factCorpus())).toEqual([]);
  });
}
