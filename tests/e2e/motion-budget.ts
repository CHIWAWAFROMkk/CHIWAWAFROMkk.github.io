import type { Page, APIRequestContext, Request } from '@playwright/test';
import { gzipSync } from 'node:zlib';

/** Gzip bytes of the site's own motion enhancers and of the GSAP engine, as actually requested. */
export async function motionBudget(page: Page, request: APIRequestContext, path: string) {
  const scripts = new Set<string>();
  const onRequest = (r: Request) => {
    const p = new URL(r.url()).pathname;
    if (r.resourceType() === 'script' && p.startsWith('/_astro/')) scripts.add(p);
  };
  page.on('request', onRequest);
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  page.off('request', onRequest);
  let motion = 0, gsap = 0;
  const chunks: string[] = [];
  for (const p of scripts) {
    const isGsap = /\/gsap\.[^/]+\.js$/.test(p);
    const isMotion = /\/(?:SplitText|ScrollReveal|Magnet|SpotlightCard|SectionReveals|FilmMotion)\.astro_|\/(?:pointer|text-motion|sections|film-motion)\.[^/]+\.js$/.test(p);
    if (!isGsap && !isMotion) continue;
    const bytes = gzipSync(await (await request.get(p)).body()).length;
    if (isGsap) gsap += bytes; else motion += bytes;
    chunks.push(p);
  }
  return { path, motion, gsap, chunks, react: [...scripts].filter(p => /\/(?:react|client)\.[^/]+\.js$/.test(p)) };
}

export interface SplitSnapshot { kind: 'word' | 'char'; units: string[]; clipped: boolean }
/** Record each heading split the moment it happens: the animation is short and native
 * enhancers run early, so sampling the DOM later can find it already settled. */
export async function recordSplits(page: Page) {
  await page.addInitScript(() => {
    const seen = new WeakSet<Element>();
    const shots: unknown[] = (window as unknown as { __splits: unknown[] }).__splits = [];
    new MutationObserver(() => {
      for (const parent of document.querySelectorAll('h1 .split-parent')) {
        const units = [...parent.querySelectorAll('.split-word, .split-char')];
        if (!units.length || seen.has(parent)) continue;
        seen.add(parent);
        const box = parent.closest('h1')!.getBoundingClientRect();
        shots.push({
          kind: parent.querySelector('.split-word') ? 'word' : 'char',
          units: units.map(u => u.textContent ?? ''),
          clipped: units.some(u => { const b = u.getBoundingClientRect(); return b.left < box.left - 1 || b.right > box.right + 1; }),
        });
      }
    }).observe(document, { subtree: true, childList: true });
  });
  return async () => {
    await page.waitForFunction(() => (window as unknown as { __splits: unknown[] }).__splits.length > 0, null, { timeout: 8000 });
    return (await page.evaluate(() => (window as unknown as { __splits: unknown[] }).__splits))[0] as SplitSnapshot;
  };
}
