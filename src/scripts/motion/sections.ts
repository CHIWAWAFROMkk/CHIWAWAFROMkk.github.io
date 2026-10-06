import { initHeadReveals } from './heads';

/** Enhance existing section headings without replacing their nodes or children.
 *  This is a one-time scan, so controls that render changing data are untouched. */
export function initSectionReveals(root: HTMLElement): () => void {
  const headings: HTMLElement[] = [];
  for (const heading of root.querySelectorAll<HTMLElement>('h2')) {
    if (heading.closest('[data-section-reveals]') !== root) continue;
    if (heading.closest('.sr, [aria-hidden="true"], [hidden], [data-motion-exclude], .scroll-reveal')) continue;
    if (heading.querySelector('.scroll-reveal') || heading.hasAttribute('data-section-motion')) continue;
    headings.push(heading);
  }
  return initHeadReveals(headings);
}
