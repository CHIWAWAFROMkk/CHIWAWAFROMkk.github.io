import type { Page } from '@playwright/test';

export const PHASE1_PAGES = ['/', '/brief/', '/projects/hris-workflow/', '/en/', '/en/brief/', '/en/projects/hris-workflow/'];

export const PHASE2_PENDING = new Set(
  ['/projects/', '/projects/campus-delivery/', '/projects/ai-career/', '/projects/quota-deck/', '/projects/ai-campus/', '/projects/stock-data/', '/projects/mais-je-taime/', '/privacy/']
    .flatMap(p => [p, `/en${p}`]),
);

/** Mark the intro as seen before any page script runs. */
export async function skipIntro(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try { localStorage.setItem('hyj-intro-seen', '1'); } catch { /* storage blocked */ }
  });
}

export async function noHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
}
