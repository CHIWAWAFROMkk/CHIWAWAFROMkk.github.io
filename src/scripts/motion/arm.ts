/** One-shot class-driven reveals shared by the page motions. The CSS owns the look:
 *  .m-armed is the start state, .m-in the end state; both rules live inside
 *  (prefers-reduced-motion: no-preference), so reduced motion shows everything as it is.
 *  Only elements still below the fold are armed: nothing on screen is put back into a start state. */
import { prefersMotion } from './tokens';

const introPending = () => {
  const c = document.documentElement.classList;
  return c.contains('intro-pending') || c.contains('intro-lock');
};

function observe(els: HTMLElement[], margin: string) {
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('m-in');
      io.unobserve(e.target);
    }
  }, { rootMargin: margin });
  for (const el of els) io.observe(el);
  return io;
}

function settleOnReduce(els: HTMLElement[], stop: () => void) {
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const settle = () => { if (!media.matches) return; stop(); for (const el of els) el.classList.add('m-in'); };
  media.addEventListener('change', settle);
  return () => media.removeEventListener('change', settle);
}

/** fold: the share of the viewport above which an element counts as already seen (1 = anywhere on screen).
 *  A block whose top only peeks into the bottom of the screen can still be armed with fold < 1. */
export interface ArmOptions { margin?: string; fold?: number; onArm?: (el: HTMLElement) => void }

/** Arms the elements below the fold and plays each once as it scrolls into view. */
export function armOnScroll(els: Iterable<HTMLElement>, { margin = '0px 0px -12% 0px', fold = 1, onArm }: ArmOptions = {}): () => void {
  if (!prefersMotion() || !('IntersectionObserver' in window)) return () => {};
  const below = [...els].filter(el => el.getBoundingClientRect().top >= innerHeight * fold);
  for (const el of below) { el.classList.add('m-armed'); onArm?.(el); }
  const io = observe(below, margin);
  const off = settleOnReduce(below, () => io.disconnect());
  return () => { io.disconnect(); off(); };
}

export interface StageOptions { delay?: number; step?: number; margin?: string }

/** First-screen choreography for elements marked [data-m-pre] (CSS holds them in the start state
 *  while html.motion-ok is set and the 2.5 s safety deadline has not passed). On-screen elements
 *  play in order after `delay` ms, `step` ms apart, once the first-visit intro has lifted;
 *  the rest are armed and play as they scroll in. */
export function stage(els: Iterable<HTMLElement>, { delay = 0, step = 80, margin = '0px 0px -12% 0px' }: StageOptions = {}): () => void {
  const list = [...els];
  if (!prefersMotion() || !('IntersectionObserver' in window)) { for (const el of list) el.classList.add('m-in'); return () => {}; }
  // Behind the intro overlay everything waits in the start state, independent of the deadline.
  const waiting = introPending();
  // Past the deadline the on-screen elements are already showing: they stay as they are.
  const late = !waiting && document.documentElement.classList.contains('motion-timeout');
  const now: HTMLElement[] = [], later: HTMLElement[] = [];
  for (const el of list) {
    if (waiting || el.getBoundingClientRect().top < innerHeight) { if (!late) now.push(el); }
    else later.push(el);
  }
  for (const el of [...now, ...later]) el.classList.add('m-armed');
  const play = () => {
    now.forEach((el, i) => el.style.setProperty('--m-d', `${delay + i * step}ms`));
    // Two frames: the start state is painted before the end state is set, so the transition runs.
    requestAnimationFrame(() => requestAnimationFrame(() => { for (const el of now) el.classList.add('m-in'); }));
  };
  let mo: MutationObserver | undefined;
  if (waiting) {
    mo = new MutationObserver(() => { if (!introPending()) { mo?.disconnect(); play(); } });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  } else play();
  const io = observe(later, margin);
  const off = settleOnReduce(list, () => { io.disconnect(); mo?.disconnect(); });
  return () => { io.disconnect(); mo?.disconnect(); off(); };
}
