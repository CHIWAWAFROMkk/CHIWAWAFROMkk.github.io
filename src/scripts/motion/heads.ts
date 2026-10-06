/** Section headings: the rule under a .section-head draws itself from the left, then the heading
 *  and its meta rise onto it. A heading outside a .section-head simply rises. Headings already on
 *  screen are left alone; the heading node and its children are never replaced or rewritten. */
import { armOnScroll } from './arm';

export function initHeadReveals(headings: Iterable<HTMLElement>): () => void {
  const targets: HTMLElement[] = [];
  for (const heading of headings) {
    const box = heading.closest<HTMLElement>('.section-head');
    const target = box && box.querySelector('h2') === heading ? box : heading;
    if (target.hasAttribute('data-m-head')) continue;
    target.dataset.mHead = target === heading ? 'plain' : 'rule';
    targets.push(target);
  }
  return armOnScroll(targets, {
    onArm: target => {
      const heading = target.matches('h2') ? target : target.querySelector<HTMLElement>('h2');
      if (heading) heading.dataset.sectionMotion = '';
    },
  });
}
