/* Adapted from React Bits — SplitText (ts-default).
 * Source: https://github.com/DavidHDev/react-bits/tree/ca44b3f9ee180676a06d7de8ec6bea84cddff85b/src/ts-default/TextAnimations/SplitText
 * Copyright (c) 2026 David Haz. MIT + Commons Clause; see LICENSE.md.
 * Changes: site tokens; CJK chars/English words; semantic outer heading stays in Astro;
 * SSR plain text; no split with reduced motion; bounded fonts/hydration wait; intro sequencing;
 * one-shot mount animation; optional near-viewport title after long prologues.
 */
import { useEffect, useRef } from 'react';
import { gsap } from '../../scripts/motion/gsap';
import { stableTextSplit } from '../../scripts/motion/reveal';
import { MOTION, prefersMotion } from '../../scripts/motion/tokens';
export interface SplitTextProps { text: string; className?: string; deferUntilVisible?: boolean }
export default function SplitText({ text, className = '', deferUntilVisible = false }: SplitTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let cancelled = false, finished = false;
    let split: ReturnType<typeof stableTextSplit> | undefined;
    let tween: gsap.core.Tween | undefined, context: gsap.Context | undefined;
    let observer: MutationObserver | undefined;
    let near: IntersectionObserver | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const final = () => {
      if (finished) return;
      finished = true;
      observer?.disconnect();
      near?.disconnect();
      clearTimeout(timer);
      media.removeEventListener('change', preference);
      tween?.scrollTrigger?.kill();
      context?.revert();
      split?.revert();
      split = undefined;
      el.dataset.splitReady = '';
    };
    const run = (afterIntro = false) => {
      if (finished || cancelled) return;
      if (!prefersMotion() || (!deferUntilVisible && !afterIntro && root.classList.contains('motion-timeout'))) { final(); return; }
      // Never hide a deferred title that became readable while fonts or the
      // island were loading. A title prepared offscreen is safe to animate.
      if (deferUntilVisible && el.getBoundingClientRect().top < innerHeight) { final(); return; }
      clearTimeout(timer);
      split = stableTextSplit(el, text, 'split-char', 'split-word');
      const targets = split.parts;
      context = gsap.context(() => {
        tween = gsap.fromTo(targets, { yPercent: 110, opacity: 0 }, {
          yPercent: 0, opacity: 1, duration: MOTION.title, stagger: MOTION.staggerChar, ease: 'site',
          ...(deferUntilVisible ? { scrollTrigger: { trigger: el, start: 'top 94%', once: true } } : {}),
          onComplete: final,
        });
      }, el);
      el.dataset.splitReady = '';
    };
    const ready = () => {
      if (cancelled || finished) return;
      if (root.classList.contains('intro-pending') || root.classList.contains('intro-lock')) {
        // Wait behind the overlay. A mutation observer runs before the first uncovered paint,
        // so this cannot flash a visible heading and then hide it again.
        el.dataset.splitReady = '';
        observer = new MutationObserver(() => {
          if (root.classList.contains('intro-pending') || root.classList.contains('intro-lock')) return;
          observer?.disconnect();
          run(true);
        });
        observer.observe(root, { attributes: true, attributeFilter: ['class'] });
        return;
      }
      run();
    };
    const preference = () => { if (media.matches) final(); };
    media.addEventListener('change', preference);
    if (!prefersMotion()) final();
    else if (deferUntilVisible) {
      const prepare = () => {
        near?.disconnect();
        if (finished || el.getBoundingClientRect().top < innerHeight) { final(); return; }
        // This deadline starts at approach, independent of first-screen load.
        timer = setTimeout(final, 2500);
        if (!document.fonts || document.fonts.status === 'loaded') run();
        else document.fonts.ready.then(() => run(), final);
      };
      if (!('IntersectionObserver' in window)) final();
      else if (el.getBoundingClientRect().top <= innerHeight + 200) prepare();
      else {
        near = new IntersectionObserver(entries => {
          if (entries.some(entry => entry.isIntersecting)) prepare();
        }, { rootMargin: '200px 0px' });
        near.observe(el);
      }
    } else if (!document.fonts || document.fonts.status === 'loaded') ready();
    else document.fonts.ready.then(ready, final);
    return () => { cancelled = true; final(); };
  }, [text, deferUntilVisible]);
  return <span ref={ref} className={`split-parent ${className}`} data-split-deferred={deferUntilVisible ? '' : undefined} style={{ display: 'block', overflow: 'clip', paddingBottom: '0.06em' }}>{text}</span>;
}
