import { EXPAND_MS, shouldAnimateClick } from './door-transition';

const EASE = 'cubic-bezier(.7, 0, .2, 1)';

function clearPanels(): void {
  document.querySelectorAll('.door-expand').forEach(n => n.remove());
}

/** On a plain click, the chosen door's colour grows from its own rectangle to the full screen and its big type drifts to the centre; then we navigate. */
export function initDoorTransition(gate: HTMLElement): void {
  // Back/forward cache restores the page as it was left — including the full-screen panel.
  addEventListener('pageshow', e => { if (e.persisted) clearPanels(); });

  gate.addEventListener('click', e => {
    const door = (e.target as Element | null)?.closest<HTMLAnchorElement>('a.door');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!door || !shouldAnimateClick(e, reduced) || typeof door.animate !== 'function') return;
    e.preventDefault();

    const r = door.getBoundingClientRect();
    const W = innerWidth;
    const H = innerHeight;
    const style = getComputedStyle(door);

    const panel = document.createElement('div');
    panel.className = 'door-expand';
    panel.setAttribute('aria-hidden', 'true');
    Object.assign(panel.style, { position: 'fixed', inset: '0', zIndex: '90', background: style.backgroundColor, color: style.color });

    const big = door.querySelector<HTMLElement>('.door__big');
    if (big) {
      const b = big.getBoundingClientRect();
      const copy = big.cloneNode(true) as HTMLElement;
      Object.assign(copy.style, { position: 'fixed', left: `${b.left}px`, top: `${b.top}px`, margin: '0', fontSize: getComputedStyle(big).fontSize });
      panel.append(copy);
      const dx = W / 2 - (b.left + b.width / 2);
      const dy = H / 2 - (b.top + b.height / 2);
      copy.animate([{ transform: 'none' }, { transform: `translate(${dx}px, ${dy}px) scale(1.35)` }], { duration: EXPAND_MS, easing: EASE, fill: 'forwards' });
    }
    document.body.append(panel);

    let gone = false;
    const go = () => { if (!gone) { gone = true; location.assign(door.href); } };
    panel
      .animate([{ clipPath: `inset(${r.top}px ${W - r.right}px ${H - r.bottom}px ${r.left}px)` }, { clipPath: 'inset(0 0 0 0)' }], { duration: EXPAND_MS, easing: EASE, fill: 'forwards' })
      .finished.then(go, go);
    setTimeout(go, EXPAND_MS + 150);
  });
}
