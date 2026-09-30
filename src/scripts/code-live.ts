/** Highlights lines of a CodeLive block as the program they show runs. */
export type CodeTone = '' | 'red' | 'soft';
export interface CodeLive {
  flash(n: number, tone?: CodeTone): void;
  on(n: number, tone?: CodeTone): void;
  reset(): void;
  count(n: number, text: string): void;
  heat(n: number, h: number): void;
}

export function codeLive(el: HTMLElement): CodeLive {
  const line = (n: number) => el.querySelector<HTMLElement>(`.cl-l[data-n="${n}"]`);
  return {
    flash(n, tone = '') {
      const l = line(n); if (!l) return;
      l.classList.remove('flash'); void l.offsetWidth; l.classList.add('flash');
      if (tone) l.classList.add(tone);
    },
    on(n, tone = '') { const l = line(n); if (!l) return; l.classList.add('on'); if (tone) l.classList.add(tone); },
    reset() {
      el.querySelectorAll<HTMLElement>('.cl-l').forEach(l => {
        l.className = 'cl-l'; l.style.removeProperty('--heat'); l.querySelector('.cl-cnt')!.textContent = '';
      });
    },
    count(n, text) { const c = line(n)?.querySelector('.cl-cnt'); if (c) c.textContent = text; },
    heat(n, h) { line(n)?.style.setProperty('--heat', String(Math.max(0, Math.min(1, h)))); },
  };
}
