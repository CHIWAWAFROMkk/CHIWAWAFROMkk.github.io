import { anyMotion } from './motion/tier';

/** Dark zones open like a cinema going dark and coming up: a black layer over the zone fades away once the zone reaches
 *  the upper three quarters of the screen. Measured against the screen, not the zone, so a zone taller than four screens
 *  (live editions on a landscape phone) still comes up. Never a white flash; nothing is added when motion is off. */
export function initNightEntry(): void {
  if (!anyMotion() || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-lit');
      io.unobserve(e.target);
    }
  }, { threshold: 0, rootMargin: '0px 0px -25% 0px' });
  for (const zone of document.querySelectorAll<HTMLElement>('.night-zone')) {
    const dim = document.createElement('div');
    dim.className = 'night-dim';
    dim.setAttribute('aria-hidden', 'true');
    zone.classList.add('has-dim');
    zone.prepend(dim);
    io.observe(zone);
  }
}
