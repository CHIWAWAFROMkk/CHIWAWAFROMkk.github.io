import { countText } from './countup';

/** Counts each number up once as it enters the viewport; always ends on the exact original text. */
export function initCountUp(els: Iterable<HTMLElement>, text: (final: string, k: number) => string = countText): void {
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      const el = e.target as HTMLElement;
      const final = el.textContent ?? '';
      const t0 = performance.now();
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / 700);
        el.textContent = text(final, 1 - (1 - k) ** 3);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }, { rootMargin: '0px 0px -15% 0px' });
  for (const el of els) io.observe(el);
}
