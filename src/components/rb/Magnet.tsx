/* Adapted from React Bits — Magnet (ts-default).
 * Source: https://github.com/DavidHDev/react-bits/tree/ca44b3f9ee180676a06d7de8ec6bea84cddff85b/src/ts-default/Animations/Magnet
 * Copyright (c) 2026 David Haz. MIT + Commons Clause; see LICENSE.md.
 * Changes: 6px radial cap, site timings, inline spans, no touch/reduced-motion listeners;
 * listen only around the owning control, frame-batch writes, reset on preference changes.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { MOTION, prefersMotion, isCoarse, magnetOffset } from '../../scripts/motion/tokens';
export interface MagnetProps { children: ReactNode; className?: string; padding?: number; strength?: number }
export default function Magnet({ children, className = '', padding = 60, strength = 4 }: MagnetProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inner = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current, content = inner.current;
    if (!el || !content) return;
    const target = el.closest('a, button') ?? el;
    const media = matchMedia('(prefers-reduced-motion: reduce)'), coarse = matchMedia('(pointer: coarse)');
    let frame = 0;
    const reset = () => { cancelAnimationFrame(frame); content.style.transform = ''; content.style.transitionDuration = `${MOTION.reveal}s`; };
    const move = (event: Event) => {
      if (!prefersMotion() || isCoarse()) return;
      const e = event as PointerEvent;
      if (e.pointerType === 'touch') return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect(), dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2;
        if (Math.abs(dx) > r.width / 2 + padding || Math.abs(dy) > r.height / 2 + padding) { reset(); return; }
        const p = magnetOffset(dx, dy, strength, MOTION.magnetMax);
        content.style.transitionDuration = `${MOTION.quick}s`;
        content.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      });
    };
    const configure = () => {
      target.removeEventListener('pointermove', move); target.removeEventListener('pointerleave', reset); reset();
      if (prefersMotion() && !isCoarse()) { target.addEventListener('pointermove', move); target.addEventListener('pointerleave', reset); }
    };
    configure(); media.addEventListener('change', configure); coarse.addEventListener('change', configure);
    return () => { target.removeEventListener('pointermove', move); target.removeEventListener('pointerleave', reset); media.removeEventListener('change', configure); coarse.removeEventListener('change', configure); reset(); };
  }, [padding, strength]);
  return <span ref={ref} className={`magnet ${className}`} style={{ display: 'inline-block' }}><span ref={inner} style={{ display: 'inline-block', transition: `transform ${MOTION.quick}s ${MOTION.ease}` }}>{children}</span></span>;
}
