/** Plates draw themselves like a plotter when they come into view. Without JavaScript, or with reduced motion,
 *  they are simply complete: the hidden starting state exists only once a plate is armed here. */
export function initPlate(plate: HTMLElement): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { plate.classList.add('is-drawn'); return; }
  plate.classList.add('is-armed');
  const io = new IntersectionObserver(entries => {
    if (!entries.some(e => e.isIntersecting)) return;
    io.disconnect();
    requestAnimationFrame(() => plate.classList.add('is-drawn'));
  }, { threshold: 0.25 });
  io.observe(plate);
}
