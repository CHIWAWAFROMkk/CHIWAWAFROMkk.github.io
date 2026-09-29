import { scrambleText } from './impact';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const once = (el: Element, fn: () => void, margin = '0px 0px -20% 0px') => {
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); fn(); } }, { rootMargin: margin });
  io.observe(el);
};

/** Indicators hit the page one after another (the block jolts, labels get a black wipe); each table is swept by a red
 *  line that decodes its figures. Every cell ends with exactly its rendered text. */
export function armImpact(section: HTMLElement): void {
  if (reduced() || !('IntersectionObserver' in window)) return;
  const strip = section.querySelector<HTMLElement>('.an__kpi');
  if (strip) {
    strip.classList.add('is-armed');
    once(strip, () => {
      const values = [...strip.querySelectorAll<HTMLElement>('.kpi__v')], labels = [...strip.querySelectorAll<HTMLElement>('.kpi__k')];
      values.forEach((el, i) => {
        const delay = i * 400;
        el.animate([
          { transform: 'scale(3.2) translateY(-8%)', opacity: 0, filter: 'blur(12px)' },
          { transform: 'scale(.93)', opacity: 1, filter: 'blur(0)', offset: 0.72 },
          { transform: 'none', opacity: 1, filter: 'blur(0)' },
        ], { duration: 550, delay, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'backwards' });
        strip.animate([{ transform: 'none' }, { transform: 'translate(-6px,3px)' }, { transform: 'translate(5px,-2px)' }, { transform: 'translate(-2px,1px)' }, { transform: 'none' }], { duration: 220, delay: delay + 400 });
        setTimeout(() => labels[i]?.classList.add('is-hit'), delay + 420);
      });
      strip.classList.remove('is-armed');
    }, '0px 0px -25% 0px');
  }
  section.querySelectorAll<HTMLElement>('.an__cards .table-wrap').forEach(wrap => once(wrap, () => scan(wrap)));
}

function scan(wrap: HTMLElement): void {
  const rows = [...wrap.querySelectorAll<HTMLTableRowElement>('tbody tr')];
  const line = document.createElement('i');
  line.className = 'scanline'; line.setAttribute('aria-hidden', 'true');
  wrap.append(line);
  const per = 180, h = wrap.clientHeight;
  line.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: `translateY(${h}px)`, opacity: 1, offset: 0.92 }, { transform: `translateY(${h}px)`, opacity: 0 }], { duration: per * rows.length + 300, easing: 'linear', fill: 'forwards' })
    .finished.catch(() => undefined).then(() => line.remove());
  rows.forEach((tr, i) => {
    const cells = [...tr.cells].filter(td => td.childElementCount === 0 && /\d/.test(td.textContent ?? ''));
    setTimeout(() => {
      if (i === 0) tr.classList.add('is-top');
      cells.forEach(decode);
    }, 120 + i * per);
  });
}

function decode(td: HTMLTableCellElement): void {
  const final = td.textContent ?? '';
  const t0 = performance.now();
  const step = (now: number) => {
    const k = Math.min(1, (now - t0) / 600);
    td.textContent = scrambleText(final, k * k, Math.random);
    if (k < 1) requestAnimationFrame(step); else td.textContent = final;
  };
  requestAnimationFrame(step);
}
