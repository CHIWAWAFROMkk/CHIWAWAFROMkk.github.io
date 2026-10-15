import { test, expect } from '@playwright/test';
import { PAGES, HRIS_PAGES, skipIntro } from './helpers';
import { strayTokens } from '../unit/digits';
import { factCorpus } from '../../src/data/facts';

// [data-demo] holds fictional demo records ("page 2"); [data-reel] holds shot ids and a clip counter; [data-film] holds the
// film's shot ids, timecodes, speeds and take counts — identifiers and edit data, not claims. [data-plate] holds the project
// plates' readings, computed at build time from the replay fixture and the demo simulator (tests/unit/plates.test.ts).
// [data-insight-num] / [data-insight-data] hold query-derived numbers; insights.spec checks them against insights.json.
// [data-size] holds first-load sizes computed at build time from public/ (tests/unit/live-size.test.ts).
// The HRIS workflow terminal's <main> is itself [data-demo], which a clone cannot remove from itself, so its fictional
// record text (.wb-situation/.wb-trail/.wb-result/.wb-next: "row 1", "page 2") is named here; its routing rules stay checked.
// script/style are removed because a detached clone's innerText includes their source.
const EXCLUDE = 'script, style, .wb-situation, .wb-trail, .wb-result, .wb-next, .prow__n, .door__index, [data-demo], [data-reel], [data-film], [data-plate], [data-size], [data-insight-num], [data-insight-data], .p-pager, .contact, .footer, .nav, .prose';

for (const p of [...PAGES, ...HRIS_PAGES]) {
  test(`every number on ${p} comes from the fact ledger`, async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'run once');
    await skipIntro(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });       // content, not motion: no number is read mid-count
    await page.goto(p);
    const text = await page.locator('main').evaluate((main, sel) => {
      const clone = main.cloneNode(true) as HTMLElement;
      clone.querySelectorAll(sel).forEach(el => el.remove());
      return clone.innerText;
    }, EXCLUDE);
    expect(strayTokens(text, factCorpus())).toEqual([]);
  });
}
