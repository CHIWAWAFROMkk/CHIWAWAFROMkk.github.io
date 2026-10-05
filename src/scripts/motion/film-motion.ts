/** Film pages: one-shot picture reveals that only change opacity and transform.
 *  [data-fm="bloom"]      a grayscale copy over the still fades out, so the one red appears last.
 *  [data-fm="letterbox"]  two bars over the video retract like a widening screen.
 *  An element is armed (its start state shown) only while it is still below the fold,
 *  so nothing visible ever flips back to a start state; without JS or with reduced motion
 *  the bars and the copy are never shown at all. */
import { prefersMotion } from './tokens';

export function initFilmMotion(root: ParentNode = document): () => void {
  const els = [...root.querySelectorAll<HTMLElement>('[data-fm]')];
  if (!els.length || !prefersMotion() || !('IntersectionObserver' in window)) return () => {};
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('fm-in');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -22% 0px' });
  for (const el of els) {
    if (el.getBoundingClientRect().top < innerHeight) continue;
    el.classList.add('fm-armed');
    io.observe(el);
  }
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const settle = () => { if (!media.matches) return; io.disconnect(); for (const el of els) el.classList.add('fm-in'); };
  media.addEventListener('change', settle);
  return () => { io.disconnect(); media.removeEventListener('change', settle); };
}
