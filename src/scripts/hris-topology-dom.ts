import { governedTargets, rawTargets, springStep, repel, nodeCount, mulberry32, type Kind } from './hris-topology';
import { currentTier } from './motion/tier';
import { frameCap } from './frame-cap';

/** Runs the HRIS home topology: nodes spring between scattered (before) and grouped (governed) positions; a fine pointer
 *  pushes nodes aside (full tier). Pauses off screen and in hidden tabs; motion off keeps the server-drawn still grid. */
export function initTopology(fig: HTMLElement): void {
  const tier = currentTier();
  const canvas = fig.querySelector('canvas');
  const btn = fig.querySelector<HTMLButtonElement>('button')!;
  const state = fig.querySelector<HTMLElement>('[data-topology-state]')!;
  let governed = true;
  const setLabels = () => {
    btn.textContent = governed ? btn.dataset.toRaw! : btn.dataset.toGoverned!;
    btn.setAttribute('aria-pressed', String(governed));
    state.textContent = governed ? btn.dataset.governed! : btn.dataset.raw!;
  };
  btn.addEventListener('click', () => { governed = !governed; setLabels(); });
  const ctx = canvas?.getContext('2d');
  if (tier === 'off' || !canvas || !ctx) return;

  const view = canvas.parentElement!;
  const n = nodeCount(tier);
  const rand = mulberry32(2026);
  const k = tier === 'gentle' ? 30 : 120, c = tier === 'gentle' ? 11 : 22;
  const cap = frameCap(tier === 'full' ? 60 : 30);
  let w = 0, h = 0, kinds: Kind[] = [], gx: Float32Array, gy: Float32Array, rx: Float32Array, ry: Float32Array;
  let x = new Float32Array(n), y = new Float32Array(n), vx = new Float32Array(n), vy = new Float32Array(n);
  let colours: Record<Kind | 'raw', string> = { verified: '', review: '', missing: '', raw: '' };
  const readColours = () => {
    const cs = getComputedStyle(fig);
    colours = { verified: cs.getPropertyValue('--ink').trim(), review: cs.getPropertyValue('--red').trim(), missing: cs.getPropertyValue('--dim').trim(), raw: cs.getPropertyValue('--dim').trim() };
  };
  const layout = () => {
    const r = view.getBoundingClientRect();
    w = r.width; h = r.height;
    const dpr = tier === 'full' ? Math.min(2, devicePixelRatio || 1) : 1;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = governedTargets(n, w, h), raw = rawTargets(n, w, h, rand);
    kinds = g.map(t => t.kind);
    gx = Float32Array.from(g, t => t.x); gy = Float32Array.from(g, t => t.y);
    rx = Float32Array.from(raw, p => p.x); ry = Float32Array.from(raw, p => p.y);
    if (!x[0]) { x = Float32Array.from(gx); y = Float32Array.from(gy); }
  };
  let mx = -1e4, my = -1e4;
  if (tier === 'full' && matchMedia('(pointer: fine)').matches) {
    canvas.style.pointerEvents = 'auto';
    canvas.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
    canvas.addEventListener('pointerleave', () => { mx = my = -1e4; });
  }
  let t0 = performance.now(), raf = 0, onScreen = true;
  const draw = (now: number) => {
    raf = requestAnimationFrame(draw);
    if (!cap(now)) return;
    const dt = Math.min(0.05, (now - t0) / 1000); t0 = now;
    ctx.clearRect(0, 0, w, h);
    for (const kind of ['verified', 'review', 'missing'] as Kind[]) {
      const hollow = governed && kind === 'missing';
      ctx.fillStyle = governed ? colours[kind] : colours.raw;
      ctx.strokeStyle = colours.missing;
      for (let i = 0; i < n; i++) {
        if (kinds[i] !== kind) continue;
        const drift = governed ? 0 : Math.sin(now / 1400 + i) * 6;
        [x[i], vx[i]] = springStep(x[i], vx[i], (governed ? gx[i] : rx[i]) + drift, dt, k, c);
        [y[i], vy[i]] = springStep(y[i], vy[i], (governed ? gy[i] : ry[i]) + drift * 0.6, dt, k, c);
        if (mx > -1e3) [x[i], y[i]] = repel(x[i], y[i], mx, my);
        if (hollow) ctx.strokeRect(x[i] - 1.5, y[i] - 1.5, 3, 3); else ctx.fillRect(x[i] - 1.5, y[i] - 1.5, 3, 3);
      }
    }
  };
  const run = () => { if (!raf && onScreen && document.visibilityState === 'visible') { t0 = performance.now(); raf = requestAnimationFrame(draw); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  readColours(); layout();
  canvas.hidden = false;
  btn.hidden = false;   // only the live canvas can show "before"; the still grid keeps the switch hidden
  fig.classList.add('is-live');
  addEventListener('resize', () => layout());
  document.addEventListener('hris-theme', readColours);
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; if (onScreen) run(); else stop(); }).observe(fig);
  document.addEventListener('visibilitychange', () => (document.visibilityState === 'visible' ? run() : stop()));
  run();
}
