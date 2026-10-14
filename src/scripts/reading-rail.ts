import { anyMotion } from './motion/tier';

/** Index of the section being read: the last one whose top is above the reading line (px from the viewport top). */
export function activeIndex(tops: number[], line: number): number {
  let i = -1;
  tops.forEach((t, k) => { if (t <= line) i = k; });
  return i;
}

/** Builds the rail from [data-rail] sections: a vertical trace with one node per section on wide screens,
 *  a thin progress bar on narrow ones. Prose h2 headings count as sections too. */
export function initReadingRail(nav: HTMLElement, bar: HTMLElement): void {
  for (const h of document.querySelectorAll<HTMLElement>('article.prose h2')) h.dataset.rail ??= h.textContent?.trim() ?? '';
  const sections = [...document.querySelectorAll<HTMLElement>('[data-rail]')];
  if (sections.length < 2) { nav.remove(); bar.remove(); return; }
  const list = nav.querySelector('ol')!;
  const links = sections.map((s, i) => {
    if (!s.id) s.id = `rail-${i + 1}`;
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${s.id}`;
    a.textContent = s.dataset.rail || s.querySelector('h2')?.textContent?.trim() || '';
    li.append(a);
    list.append(li);
    return a;
  });
  nav.hidden = false;
  bar.hidden = false;
  let frame = 0;
  const update = () => {
    frame = 0;
    const i = activeIndex(sections.map(s => s.getBoundingClientRect().top), innerHeight * 0.4);
    links.forEach((a, k) => (k === i ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    nav.style.setProperty('--progress', String(Math.max(0, i) / (links.length - 1)));
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
  };
  addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(update); }, { passive: true });
  addEventListener('resize', update);
  nav.classList.toggle('is-still', !anyMotion());
  update();
}
