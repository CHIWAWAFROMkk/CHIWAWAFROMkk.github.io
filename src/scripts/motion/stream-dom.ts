import { chunkText, streamStep } from './stream';
import { anyMotion, currentTier } from './tier';

const coveredByIntro = () => {
  const c = document.documentElement.classList;
  return c.contains('intro-pending') || c.contains('intro-lock');
};

/** Streams the element's text in once it is on screen (after the intro, on the home page). The text node is replaced by
 *  spans holding the same characters, so wrapping and the accessible name do not change. */
export function initStream(el: HTMLElement): void {
  const text = el.textContent ?? '';
  const chunks = chunkText(text);
  if (!anyMotion() || !('IntersectionObserver' in window) || chunks.length < 2) { el.classList.add('is-on'); return; }
  const step = streamStep(currentTier());
  el.textContent = '';
  chunks.forEach((c, i) => {
    const s = document.createElement('span');
    s.className = 'stream__c';
    s.textContent = c;
    s.style.setProperty('--sd', `${i * step}ms`);
    el.append(s);
  });
  const caret = document.createElement('span');
  caret.className = 'stream__caret';
  caret.setAttribute('aria-hidden', 'true');
  el.append(caret);
  el.classList.add('is-armed');

  const play = () => {
    el.classList.add('is-on');
    setTimeout(() => caret.remove(), chunks.length * step + 900);
  };
  const whenUncovered = (go: () => void) => {
    if (!coveredByIntro()) { go(); return; }
    const mo = new MutationObserver(() => { if (!coveredByIntro()) { mo.disconnect(); go(); } });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  };
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    whenUncovered(play);
  }, { rootMargin: '0px 0px -8% 0px' });
  io.observe(el);
}
