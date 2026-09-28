import { test, expect } from '@playwright/test';
import { skipIntro } from './helpers';
import { digitTokens } from '../unit/digits';
import { factCorpus } from '../../src/data/facts';

const EXCLUDE = '.prow__n, .door__index, .demo__id, .p-pager, .contact, .footer, .nav, .prose';

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
    const corpus = factCorpus();
    const stray = digitTokens(text).filter(t => !corpus.includes(t));
    expect(stray).toEqual([]);
  });
}
