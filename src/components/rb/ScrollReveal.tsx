/* Adapted from React Bits — ScrollReveal (ts-default).
 * Source: https://github.com/DavidHDev/react-bits/tree/ca44b3f9ee180676a06d7de8ec6bea84cddff85b/src/ts-default/TextAnimations/ScrollReveal
 * Copyright (c) 2026 David Haz. MIT + Commons Clause; see LICENSE.md.
 * Changes: SSR plain text inside a legal span; GSAP language-aware splitting only when motion is allowed;
 * one-shot reveal rather than scrub, site timings, no blur/type styles; lifecycle shared with static h2 nodes.
 */
import { useEffect, useRef } from 'react';
import { initScrollReveal } from '../../scripts/motion/reveal';
export interface ScrollRevealProps { text: string; className?: string }
export default function ScrollReveal({ text, className = '' }: ScrollRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) return initScrollReveal(el);
  }, [text]);
  return <span ref={ref} className={`scroll-reveal ${className}`} style={{ display: 'inline-block' }}>{text}</span>;
}
