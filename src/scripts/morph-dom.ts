import { chapterProgress, frameAt, type Mark } from './morph';

/** Writes marks into the pool of <rect data-m> elements. */
export function paint(rects: SVGRectElement[], marks: Mark[]): void {
  marks.forEach((m, i) => {
    const r = rects[i];
    if (!r) return;
    r.setAttribute('x', m.x.toFixed(1));
    r.setAttribute('y', m.y.toFixed(1));
    r.setAttribute('width', m.w.toFixed(1));
    r.setAttribute('height', m.h.toFixed(1));
    r.setAttribute('fill-opacity', m.a.toFixed(3));
    r.classList.toggle('red', m.red === 1);
  });
}

/** Drives the story stage from the scroll position: charts hold, then morph into the next near each chapter's end.
 *  With reduced motion the stage jumps straight to the current chapter's chart. */
export function initMorph(stage: HTMLElement, chapters: HTMLElement[], layouts: Mark[][]): void {
  const rects = [...stage.querySelectorAll<SVGRectElement>('rect[data-m]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frame = 0;
  let shown = -1;
  const update = () => {
    frame = 0;
    let p = chapterProgress(chapters.map(c => c.getBoundingClientRect().top), innerHeight * 0.55);
    if (reduced) p = Math.floor(p);
    stage.dataset.chapter = String(Math.round(p) + 1);
    if (p === shown) return;
    shown = p;
    paint(rects, frameAt(layouts, p));
  };
  addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(update); }, { passive: true });
  addEventListener('resize', update);
  update();
}
