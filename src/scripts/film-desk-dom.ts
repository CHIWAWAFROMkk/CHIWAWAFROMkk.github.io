import { frameCap } from './frame-cap';
import { pct, timeAt, stepIndex } from './film-desk';

interface Signals { fps: number; colors: string[]; peaks: number[] }
const SIGNALS = '/media/mais-je-taime/film-signals.json';

export function initFilmDesk(root: HTMLElement): void {
  const video = root.querySelector<HTMLVideoElement>('[data-fd-video]');
  const head = root.querySelector<HTMLElement>('[data-fd-head]');
  if (!video || !head) return;
  const shots = [...root.querySelectorAll<HTMLButtonElement>('[data-fd-shots] [data-fd-shot]')];
  const cards = [...root.querySelectorAll<HTMLElement>('[data-fd-card]')];
  const ids = cards.map(c => c.dataset.fdCard ?? '');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = cards.find(c => !c.hidden)?.dataset.fdCard ?? ids[0];

  const place = (t: number) => {
    head.style.left = `${pct(t)}%`;
    for (const b of shots) b.classList.toggle('is-live', Number(b.dataset.start) <= t && t < Number(b.dataset.stop));
  };
  // Before the film's metadata arrives, setting currentTime is unreliable: wait for it, but move the playhead now.
  const seek = (t: number) => {
    place(t);
    if (video.readyState >= 1) video.currentTime = t;
    else video.addEventListener('loadedmetadata', () => { video.currentTime = t; }, { once: true });
  };
  const select = (id: string, focus = false) => {
    current = id;
    // Posters of hidden cards are only fetched for the card being shown and its two neighbours (the next step is instant).
    const at = cards.findIndex(c => c.dataset.fdCard === id);
    for (const c of [cards[at - 1], cards[at], cards[at + 1]]) {
      const v = c?.querySelector('video');
      if (v && !v.getAttribute('poster') && v.dataset.poster) v.poster = v.dataset.poster;
    }
    for (const c of cards) {
      const on = c.dataset.fdCard === id;
      c.hidden = !on;
      const v = c.querySelector('video');
      if (!v) continue;
      if (on) {
        if (!v.getAttribute('src') && v.dataset.src) v.src = v.dataset.src;
        if (!reduced) void v.play().catch(() => { /* autoplay refused: the poster stays */ });
      } else if (!v.paused) v.pause();
    }
    const onTrack = shots.some(b => b.dataset.fdShot === id);
    for (const b of shots) {
      const on = b.dataset.fdShot === id;
      b.setAttribute('aria-pressed', String(on));
      b.tabIndex = on || (!onTrack && b === shots[0]) ? 0 : -1;
      if (on && focus) b.focus();
    }
  };
  const go = (id: string, focus = false) => {
    select(id, focus);
    const start = cards.find(c => c.dataset.fdCard === id)?.dataset.start;
    if (start !== undefined) seek(Number(start));
  };

  for (const b of shots) b.addEventListener('click', () => go(b.dataset.fdShot ?? ''));
  root.querySelector('[data-fd-shots]')?.addEventListener('keydown', e => {
    const key = (e as KeyboardEvent).key;
    const i = shots.findIndex(b => b === document.activeElement);
    if (i < 0) return;
    const j = key === 'ArrowRight' ? stepIndex(shots.length, i, 1) : key === 'ArrowLeft' ? stepIndex(shots.length, i, -1)
      : key === 'Home' ? 0 : key === 'End' ? shots.length - 1 : -1;
    if (j < 0) return;
    e.preventDefault();
    go(shots[j].dataset.fdShot ?? '', true);
  });
  root.querySelectorAll<HTMLButtonElement>('[data-fd-step]').forEach(b => b.addEventListener('click', () => {
    go(ids[stepIndex(ids.length, ids.indexOf(current), b.dataset.fdStep === '-1' ? -1 : 1)]);
  }));
  root.querySelectorAll<HTMLButtonElement>('[data-fd-pick]').forEach(b => b.addEventListener('click', () => go(b.dataset.fdPick ?? '')));
  root.querySelectorAll<HTMLElement>('[data-fd-scrub]').forEach(el => el.addEventListener('click', e => {
    const r = el.getBoundingClientRect();
    seek(timeAt((e as MouseEvent).clientX - r.left, r.width));
  }));

  // The playhead follows every timeupdate; while playing it is also smoothed on animation frames (not with reduced motion).
  const sync = () => place(video.currentTime);
  video.addEventListener('timeupdate', sync);
  video.addEventListener('seeked', sync);
  const cap = frameCap();
  let raf = 0;
  const loop = (now: number) => { if (cap(now)) sync(); raf = requestAnimationFrame(loop); };
  video.addEventListener('play', () => { if (!reduced && !raf) raf = requestAnimationFrame(loop); });
  const stop = () => { cancelAnimationFrame(raf); raf = 0; sync(); };
  video.addEventListener('pause', stop);
  video.addEventListener('ended', stop);

  // The first card's clip loads only once the desk is on screen.
  const io = new IntersectionObserver(entries => {
    if (!entries.some(en => en.isIntersecting)) return;
    io.disconnect();
    select(current);
  });
  io.observe(root);

  void drawSignals(root);
}

async function drawSignals(root: HTMLElement): Promise<void> {
  const colour = root.querySelector<HTMLCanvasElement>('[data-fd-colour]');
  const wave = root.querySelector<HTMLCanvasElement>('[data-fd-wave]');
  if (!colour || !wave) return;
  let data: Signals;
  try {
    const r = await fetch(SIGNALS);
    if (!r.ok) throw new Error(String(r.status));
    data = await r.json() as Signals;
  } catch {
    root.dataset.signals = 'missing';
    return;
  }
  const paint = () => { band(colour, data.colors); bars(wave, data.peaks); };
  paint();
  new ResizeObserver(paint).observe(colour);
  root.dataset.signals = 'ready';
}

function fit(c: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = Math.round(c.clientWidth * dpr), h = Math.round(c.clientHeight * dpr);
  if (!w || !h) return null;
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  return c.getContext('2d');
}

function band(c: HTMLCanvasElement, colors: string[]): void {
  const g = fit(c);
  if (!g) return;
  const step = c.width / colors.length;
  colors.forEach((col, i) => { g.fillStyle = col; g.fillRect(Math.floor(i * step), 0, Math.ceil(step) + 1, c.height); });
}

function bars(c: HTMLCanvasElement, peaks: number[]): void {
  const g = fit(c);
  if (!g) return;
  g.clearRect(0, 0, c.width, c.height);
  g.fillStyle = getComputedStyle(c).color;
  g.globalAlpha = 0.6;
  const step = c.width / peaks.length, mid = c.height / 2;
  peaks.forEach((p, i) => { const h = Math.max(1, p * mid * 0.92); g.fillRect(i * step, mid - h, Math.max(1, step - 0.5), h * 2); });
  g.globalAlpha = 1;
}
