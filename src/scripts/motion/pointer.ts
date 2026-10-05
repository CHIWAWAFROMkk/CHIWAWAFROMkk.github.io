/* Adapted from React Bits — Magnet and SpotlightCard (ts-default), as native enhancers.
 * Sources: https://github.com/DavidHDev/react-bits/tree/ca44b3f9ee180676a06d7de8ec6bea84cddff85b/src/ts-default/Animations/Magnet
 *          https://github.com/DavidHDev/react-bits/tree/ca44b3f9ee180676a06d7de8ec6bea84cddff85b/src/ts-default/Components/SpotlightCard
 * Copyright (c) 2026 David Haz. MIT + Commons Clause; see ../../components/rb/LICENSE.md.
 * Changes: 6px radial cap, site timings, no touch/reduced-motion listeners; listen only around the
 * owning control, frame-batch writes, reset on preference changes; the spotlight moves a fixed
 * gradient layer with transform. No GSAP and no React: these load with the page at ~1 KB.
 */
import { MOTION, prefersMotion, isCoarse, magnetOffset } from './tokens';

export function initMagnet(el: HTMLElement): () => void {
  const content = el.firstElementChild as HTMLElement | null;
  if (!content) return () => {};
  const padding = Number(el.dataset.padding ?? 60), strength = Number(el.dataset.strength ?? 4);
  const target = el.closest<HTMLElement>('a, button') ?? el;
  const media = matchMedia('(prefers-reduced-motion: reduce)'), coarse = matchMedia('(pointer: coarse)');
  let frame = 0;
  const reset = () => { cancelAnimationFrame(frame); content.style.transform = ''; content.style.transitionDuration = `${MOTION.reveal}s`; };
  const move = (event: Event) => {
    const e = event as PointerEvent;
    if (!prefersMotion() || isCoarse() || e.pointerType === 'touch') return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect(), dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2;
      if (Math.abs(dx) > r.width / 2 + padding || Math.abs(dy) > r.height / 2 + padding) { reset(); return; }
      const p = magnetOffset(dx, dy, strength, MOTION.magnetMax);
      content.style.transitionDuration = `${MOTION.quick}s`;
      content.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
    });
  };
  const detach = () => { target.removeEventListener('pointermove', move); target.removeEventListener('pointerleave', reset); };
  const configure = () => {
    detach(); reset();
    if (prefersMotion() && !isCoarse()) { target.addEventListener('pointermove', move); target.addEventListener('pointerleave', reset); }
  };
  configure(); media.addEventListener('change', configure); coarse.addEventListener('change', configure);
  el.dataset.magnetReady = '';
  return () => { detach(); media.removeEventListener('change', configure); coarse.removeEventListener('change', configure); reset(); };
}

export function initSpotlight(el: HTMLElement): () => void {
  let frame = 0;
  const move = (e: PointerEvent) => {
    if (e.pointerType === 'touch' || isCoarse() || !prefersMotion()) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mouse-x', `${e.clientX - r.left}px`);
      el.style.setProperty('--mouse-y', `${e.clientY - r.top}px`);
    });
  };
  el.addEventListener('pointermove', move);
  return () => { cancelAnimationFrame(frame); el.removeEventListener('pointermove', move); };
}

/** One pass over the page; each enhancer is idempotent per element. */
export function enhancePointer(root: ParentNode = document): void {
  for (const el of root.querySelectorAll<HTMLElement>('.magnet:not([data-magnet-ready])')) initMagnet(el);
  for (const el of root.querySelectorAll<HTMLElement>('.card-spotlight:not([data-spot-ready])')) { el.dataset.spotReady = ''; initSpotlight(el); }
}
