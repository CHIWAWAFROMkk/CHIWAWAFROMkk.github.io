import { anyMotion } from './motion/tier';

/** Dark zones open like a cinema going dark and coming up: a black layer over the zone fades away once a quarter of it
 *  is on screen. Never a white flash; nothing is added when motion is off. */
export function initNightEntry(): void {
  if (!anyMotion() || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-lit');
      io.unobserve(e.target);
    }
  }, { threshold: 0.25 });
  for (const zone of document.querySelectorAll<HTMLElement>('.night-zone')) {
    const dim = document.createElement('div');
    dim.className = 'night-dim';
    dim.setAttribute('aria-hidden', 'true');
    zone.classList.add('has-dim');
    zone.prepend(dim);
    io.observe(zone);
  }
}
