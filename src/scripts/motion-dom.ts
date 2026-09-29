const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Hides each element (.reveal) and shows it (.is-in) once it is 10% into the viewport.
 *  Does nothing with reduced motion or without IntersectionObserver, so content is never left hidden. */
export function reveal(els: Iterable<Element>, staggerMs = 0): void {
  if (reduced() || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -10% 0px' });
  let i = 0;
  for (const el of els) {
    (el as HTMLElement).style.setProperty('--d', `${i++ * staggerMs}ms`);
    el.classList.add('reveal');
    io.observe(el);
  }
}

/** Calls `update` once now and then at most once per frame while scrolling or resizing. */
export function onScroll(update: () => void): void {
  let frame = 0;
  const run = () => { frame = 0; update(); };
  addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(run); }, { passive: true });
  addEventListener('resize', run);
  update();
}
