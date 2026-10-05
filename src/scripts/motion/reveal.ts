/* Shared adaptation of React Bits — ScrollReveal (ts-default).
 * Source: https://github.com/DavidHDev/react-bits/tree/ca44b3f9ee180676a06d7de8ec6bea84cddff85b/src/ts-default/TextAnimations/ScrollReveal
 * Copyright (c) 2026 David Haz. MIT + Commons Clause; see ../../components/rb/LICENSE.md.
 * Changes: site timings, one-shot scoped lifecycle, near-viewport preparation,
 * reduced-motion cleanup, and an unsplit mode that preserves existing DOM nodes.
 */
import { gsap, SplitText as GSAPSplitText } from './gsap';
import { MOTION, splitUnits } from './tokens';

interface RevealOptions {
  splitText?: boolean;
  preserveVisible?: boolean;
  onPrepare?: () => void;
}

/** Split only when doing so keeps the final text box stable. Long prose and
 * over-wide words retain their original layout and animate as a single unit. */
export function stableTextSplit(el: HTMLElement, text: string, charsClass: string, wordsClass: string) {
  const before = el.getBoundingClientRect();
  const type = splitUnits(text);
  // A Latin word inside Chinese copy is still one unit: splitting SQL into
  // S / Q / L changes wrapping even when the overall box height stays equal.
  const split = new GSAPSplitText(el, {
    type, charsClass, wordsClass, reduceWhiteSpace: false,
    // GSAP also checks this list against words joined without spaces. Use the
    // original tokens, not a broad pattern that could merge adjacent words.
    specialChars: type === 'chars' ? text.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.sort((a, b) => b.length - a.length) : undefined,
  });
  const parts = type === 'chars' ? split.chars : split.words;
  const after = el.getBoundingClientRect();
  const changed = el.textContent !== text || Math.abs(after.height - before.height) > 1 || Math.abs(after.width - before.width) > 1;
  const overflow = parts.some(part => part.getBoundingClientRect().width > before.width + 1);
  if (changed || overflow) {
    split.revert();
    return { parts: [el], revert: () => {} };
  }
  return { parts, revert: () => split.revert() };
}

/** React islands and static h2 nodes share this lifecycle. Only this element's
 * timeline is reverted: business-script triggers and inline styles are retained. */
export function initScrollReveal(el: HTMLElement, { splitText = true, preserveVisible = false, onPrepare }: RevealOptions = {}): () => void {
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  if (media.matches || !('IntersectionObserver' in window)) return () => {};
  const doc = el.ownerDocument;
  let finished = false;
  let preparing = false;
  let near: IntersectionObserver | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let context: gsap.Context | undefined;
  let timeline: gsap.core.Timeline | undefined;
  let split: ReturnType<typeof stableTextSplit> | undefined;
  const finish = () => {
    if (finished) return;
    finished = true;
    near?.disconnect();
    clearTimeout(timer);
    media.removeEventListener('change', preference);
    timeline?.scrollTrigger?.kill();
    context?.revert();
    split?.revert();
    if (preparing) el.dataset.revealState = 'complete';
  };
  const preference = () => { if (media.matches) finish(); };
  const run = (allowVisible: boolean) => {
    if (finished) return;
    const rect = el.getBoundingClientRect();
    if (media.matches || rect.bottom <= 0 || (!allowVisible && rect.top < innerHeight)) { finish(); return; }
    clearTimeout(timer);
    split = splitText ? stableTextSplit(el, el.textContent ?? '', 'sr-unit', 'sr-unit') : undefined;
    const parts = split?.parts ?? [el];
    onPrepare?.();
    el.dataset.revealState = 'prepared';
    context = gsap.context(() => {
      timeline = gsap.timeline({
        scrollTrigger: { trigger: el, start: 'top 94%', once: true },
        onComplete: finish,
      });
      timeline.fromTo(el, { rotate: 1.5, transformOrigin: '0% 50%' }, {
        rotate: 0, duration: MOTION.reveal, ease: 'site',
      }, 0).fromTo(parts, { opacity: .15 }, {
        opacity: 1, duration: MOTION.reveal,
        stagger: { each: MOTION.staggerChar, amount: Math.min(parts.length * MOTION.staggerChar, .5) },
        ease: 'site',
      }, 0);
    }, el);
  };
  const prepare = (allowVisible = false) => {
    if (finished || preparing) return;
    near?.disconnect();
    preparing = true;
    // Local font wait starts only near this node; a long page is not penalized
    // by the first-screen hydration deadline. Nothing is hidden during the wait.
    timer = setTimeout(finish, 2500);
    if (!doc.fonts || doc.fonts.status === 'loaded') run(allowVisible);
    else doc.fonts.ready.then(() => run(false), finish);
  };
  media.addEventListener('change', preference);
  const rect = el.getBoundingClientRect();
  if (rect.bottom <= 0 || (rect.top < innerHeight && (preserveVisible || doc.documentElement.classList.contains('motion-timeout')))) finish();
  else if (rect.top < innerHeight) prepare(true);
  else if (rect.top <= innerHeight + 200) prepare();
  else {
    near = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) prepare();
    }, { rootMargin: '200px 0px' });
    near.observe(el);
  }
  return finish;
}
