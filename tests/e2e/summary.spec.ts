import { test, expect } from '@playwright/test';
import { SITE } from '../../src/data/site';

const PAGES = [['/projects/ai-career/', 'career'], ['/projects/hris-workflow/', 'hris'], ['/projects/quota-deck/', 'quota'], ['/projects/campus-delivery/', 'campus'], ['/projects/ai-campus/', 'aiCampus']] as const;

for (const [path, key] of PAGES) {
  test(`${path} opens with problem, trade-offs, work, tools, evidence and status`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path);
    const S = SITE.summaryLabels;
    const labels = await page.locator('.p-summary dt').allTextContents();
    const status = SITE.pages[key].summary.next ? S.statusNext.zh : S.status.zh;
    expect(labels).toEqual([S.task.zh, S.tradeoff.zh, S.mine.zh, S.tools.zh, S.evidence.zh, status]);
    await expect(page.locator('.p-summary dd').nth(1)).toHaveText(SITE.pages[key].summary.tradeoff!.zh);
  });
}
