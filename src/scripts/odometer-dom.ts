import { slots, reelRows } from './odometer';

/** Spins el's text in as a mechanical counter. The reels draw their digits with CSS generated content, so el.textContent
 *  is the final text the whole time; when the reels stop, they are replaced by that plain text. A newer spin cancels an older one. */
export function spinOdometer(el: HTMLElement, final: string, delay = 0, from?: string): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = final; return; }
  const run = String(Number(el.dataset.odoRun ?? '0') + 1);
  el.dataset.odoRun = run;
  const fromDigits = from ? slots(from).flatMap(s => (s.digit === null ? [] : [s.digit])) : [];
  const sr = document.createElement('span'); sr.className = 'sr'; sr.textContent = final;
  const reels = document.createElement('span'); reels.className = 'odo'; reels.setAttribute('aria-hidden', 'true');
  const anims: Animation[] = [];
  let d = 0;
  for (const s of slots(final)) {
    if (s.digit === null) {
      const g = document.createElement('span'); g.className = 'odo__g'; g.dataset.ch = s.char; reels.append(g);
      anims.push(g.animate([{ opacity: 0, transform: 'translateY(0.3em)' }, { opacity: 1, transform: 'none' }], { duration: 400, delay: delay + 250, fill: 'both', easing: 'cubic-bezier(.2,.8,.2,1)' }));
      continue;
    }
    const reel = document.createElement('span'); reel.className = 'odo__reel';
    const strip = document.createElement('span'); strip.className = 'odo__strip';
    reel.append(strip); reels.append(reel);
    const rows = reelRows(fromDigits[d] ?? null, s.digit);
    anims.push(strip.animate(
      [{ transform: `translateY(-${rows.from}em)`, filter: 'blur(0)' }, { filter: 'blur(5px)', offset: 0.3 }, { filter: 'blur(1.5px)', offset: 0.8 }, { transform: `translateY(-${rows.to}em)`, filter: 'blur(0)' }],
      { duration: 850 + d * 160, delay: delay + d * 40, easing: 'cubic-bezier(.12,.85,.22,1.12)', fill: 'both' },
    ));
    d++;
  }
  el.replaceChildren(sr, reels);
  Promise.all(anims.map(a => a.finished)).then(() => {
    if (el.dataset.odoRun !== run) return;
    el.textContent = final;
    el.dataset.spun = '';
  }).catch(() => { /* cancelled by a newer spin */ });
}
