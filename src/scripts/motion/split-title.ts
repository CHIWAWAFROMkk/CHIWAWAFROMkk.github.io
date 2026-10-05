/* Adapted from React Bits — SplitText (ts-default), as a native enhancer.
 * Source: https://github.com/DavidHDev/react-bits/tree/ca44b3f9ee180676a06d7de8ec6bea84cddff85b/src/ts-default/TextAnimations/SplitText
 * Copyright (c) 2026 David Haz. MIT + Commons Clause; see ../../components/rb/LICENSE.md.
 * Changes: site tokens; CJK chars/English words; the server-rendered span is enhanced in place
 * (no React); no split with reduced motion; bounded fonts wait; intro sequencing;
 * one-shot animation; optional near-viewport title after long prologues.
 */
import { gsap } from './gsap';
import { stableTextSplit } from './reveal';
import { MOTION, prefersMotion } from './tokens';

export function initSplitTitle(el: HTMLElement): () => void {
  const text = el.textContent ?? '';
  const deferUntilVisible = el.hasAttribute('data-split-deferred');
  const root = document.documentElement;
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let finished = false;
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
    if (finished) return;
    if (!prefersMotion() || (!deferUntilVisible && !afterIntro && root.classList.contains('motion-timeout'))) { final(); return; }
    // Never hide a deferred title that became readable while fonts were loading.
    if (deferUntilVisible && el.getBoundingClientRect().top < innerHeight) { final(); return; }
    clearTimeout(timer);
    split = stableTextSplit(el, text, 'split-char', 'split-word');
    context = gsap.context(() => {
      tween = gsap.fromTo(split!.parts, { yPercent: 110, opacity: 0 }, {
        yPercent: 0, opacity: 1, duration: MOTION.title, stagger: MOTION.staggerChar, ease: 'site',
        ...(deferUntilVisible ? { scrollTrigger: { trigger: el, start: 'top 94%', once: true } } : {}),
        onComplete: final,
      });
    }, el);
    el.dataset.splitReady = '';
  };
  const ready = () => {
    if (finished) return;
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
  return final;
}
