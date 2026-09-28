/** Adds .is-in once to each [data-rise] element as it enters the viewport. No-op without IO or with reduced motion. */
export function initRise(): void {
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const els = document.querySelectorAll<HTMLElement>('[data-rise]');
  if (!els.length) return;
  document.documentElement.classList.add('rise-ready');
  const io = new IntersectionObserver(
    entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  els.forEach(el => io.observe(el));
}
