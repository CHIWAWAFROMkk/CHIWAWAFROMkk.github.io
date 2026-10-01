import type { PyProgress, PyReady } from './py-runtime';

/** The words a page gives its boot overlay. */
export interface BootText {
  hexTitle: string;
  bootLine: (step: PyProgress['step'], t: number, mb: number, ms: number, detail: string) => string;
  bootReady: (py: string, s: number) => string;
}
/** A file the runtime loads, with the SHA-256 its manifest (or the build) recorded. */
export interface BootFile { name: string; sha256: string }
export interface BootView { step(p: PyProgress): void; done(r: PyReady): Promise<void>; hide(): void }
export interface BootViewOptions {
  root: HTMLElement; prefix: string; text: BootText; chip: HTMLElement; reduced: boolean;
  /** False while the page shows something else (a replay, a fallback): the module chips then skip their flight. */
  shown: () => boolean;
  files: () => Promise<BootFile[]>;
}
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Drives a PyBoot overlay. Every number it shows is measured by the worker or read from a manifest. */
export function bootView(o: BootViewOptions): BootView {
  const $ = (suffix: string) => o.root.querySelector<HTMLElement>(`#${o.prefix}-boot${suffix}`)!;
  const box = $(''), log = $('-log'), hex = $('-hex'), mods = $('-mods');
  box.hidden = o.reduced; log.replaceChildren(); mods.replaceChildren(); hex.textContent = '';
  const t0 = performance.now(), shown: string[] = [];
  let lines: string[] = [], at = 0, modules: string[] = [];
  // The byte stream is the SHA-256 of each file being loaded.
  void o.files().then(fs => {
    lines = fs.map(f => `${f.sha256.slice(0, 8)} ${f.sha256.slice(8, 16)} ${f.sha256.slice(16, 24)} ${f.sha256.slice(24, 32)}  ${f.name}`);
  }).catch(() => {});
  const hx = window.setInterval(() => {
    if (!lines.length) return;
    shown.push(lines[at++ % lines.length]); if (shown.length > 40) shown.shift();
    hex.textContent = `${o.text.hexTitle}\n${shown.join('\n')}`;
  }, 60);
  return {
    step(p) {
      const d = document.createElement('div');
      d.textContent = o.text.bootLine(p.step, (performance.now() - t0) / 1000, p.bytes / 1048576, p.ms, p.detail);
      log.append(d);
      if (p.modules) modules = p.modules;
    },
    async done(r) {
      clearInterval(hx);
      if (!o.reduced && o.shown()) {
        for (const m of modules) { const c = document.createElement('span'); c.className = 'pb-mod'; c.textContent = m; mods.append(c); }
        const chips = [...mods.children] as HTMLElement[];
        for (const c of chips) { c.classList.add('in'); await wait(30); }
        await wait(250);
        const t = o.chip.getBoundingClientRect(), tx = t.left + t.width / 2, ty = t.top + t.height / 2;
        await Promise.all(chips.map((c, i) => {
          const b = c.getBoundingClientRect();
          return c.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${tx - b.left - b.width / 2}px, ${ty - b.top - b.height / 2}px) scale(.15)`, opacity: 0 }],
            { duration: 500, delay: i * 20, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' }).finished;
        }));
      }
      const d = document.createElement('div'); d.className = 'ready'; d.textContent = o.text.bootReady(r.python, r.ms / 1000); log.append(d);
      if (!o.reduced) await wait(300);
      box.hidden = true;
    },
    hide() { clearInterval(hx); box.hidden = true; },
  };
}
