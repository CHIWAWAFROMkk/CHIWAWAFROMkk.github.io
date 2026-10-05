import { countText } from './countup';

/** Counts each number up once as it enters the viewport; always ends on the exact original text. */
export function initCountUp(els: Iterable<HTMLElement>, text: (final: string, k: number) => string = countText): void {
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window) || media.matches) return;
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      const el = e.target as HTMLElement;
      const final = el.textContent ?? '';
      if (text(final, 0) === final || media.matches) continue;
      let restore = () => {};
      if (getComputedStyle(el).display === 'inline') {
        // A changing digit count must not move the words around it. Measure the
        // final value before changing text and reserve that exact inline width.
        // Already-wrapped values stay static rather than becoming an atomic box.
        if (el.getClientRects().length !== 1) continue;
        const width = el.getBoundingClientRect().width;
        const range = document.createRange();
        range.selectNodeContents(el);
        const before = range.getBoundingClientRect();
        const parentHeight = el.parentElement?.getBoundingClientRect().height;
        const properties = ['display', 'min-width', 'width'] as const;
        const saved = properties.map(name => [name, el.style.getPropertyValue(name), el.style.getPropertyPriority(name)] as const);
        restore = () => { for (const [name, value, priority] of saved) {
          if (value) el.style.setProperty(name, value, priority);
          else el.style.removeProperty(name);
        } };
        el.style.display = 'inline-block';
        el.style.minWidth = `${width}px`;
        el.style.width = `${width}px`;
        const after = range.getBoundingClientRect();
        const moved = Math.abs(before.x - after.x) > .5 || Math.abs(before.y - after.y) > .5;
        const rewrapped = parentHeight !== undefined && Math.abs((el.parentElement?.getBoundingClientRect().height ?? parentHeight) - parentHeight) > .5;
        if (moved || rewrapped) { restore(); continue; }
      }
      const t0 = performance.now();
      const step = (now: number) => {
        const k = media.matches ? 1 : Math.min(1, (now - t0) / 700);
        el.textContent = k === 1 ? final : text(final, 1 - (1 - k) ** 3);
        if (k < 1) requestAnimationFrame(step);
        else restore();
      };
      requestAnimationFrame(step);
    }
  }, { rootMargin: '0px 0px -15% 0px' });
  for (const el of els) io.observe(el);
}
