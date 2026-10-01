import { H, D, BIG_TASK, AGENT_FLOW, agentPhase, collabEnd, type Lane, type LaneId, type ResetMark, type AgentId } from './qd-sim';

export interface TlText {
  title: string; sub: string; range: string; dashes: string; night: string; reset: string; nextReset: string; window: string; now: string;
  resetTo: (name: string) => string; exhaust: (h: string) => string; noExhaust: string; exhausted: string;
  status: Record<'queue' | 'run' | 'done', string>; bigTask: string; wbNote: string;
}
export interface TmState {
  t: number; lanes: Lane[]; marks: ResetMark[];
  /** QuotaDeck's own persisted Antigravity samples for the current window, in percent. */
  samples: { at: number; value: number }[];
  /** QuotaDeck's own output at its last refresh. */
  estimate: { at: number; value: number; burn: number | null; hoursLeft: number | null; resetAt: number } | null;
  collab: { at: number; agents: AgentId[] } | null;
}
export interface TmOptions {
  reduced: boolean; light: boolean;
  /** The tray window's right edge and the vertical centre of each provider's row, in body coordinates. */
  anchor: () => { right: number; rows: Partial<Record<AgentId, number>> } | null;
  onHit: () => void;
}

/** Effect levels, one notch below the approved prototype (user decision 2026-10-01). */
export const TM_FX = { halo: 0.35, haloRed: 0.45, heads: 0.5, packets: 2, rings: 1, sparks: 48, shockSparks: 24 } as const;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const pad = (n: number) => String(n).padStart(2, '0');
export const hhmm = (ms: number) => { const d = new Date(ms); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
/** Hours left at `now`, counting down from QuotaDeck's estimate made at `at`. */
export const countdown = (hoursLeft: number, at: number, now: number) => Math.max(0, hoursLeft - (now - at) / H);
export const midnight = (ms: number) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };

interface Bezier { xs: Float32Array; ys: Float32Array; cl: Float32Array; n: number; len: number }
function bez(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, n: number): Bezier {
  const xs = new Float32Array(n + 1), ys = new Float32Array(n + 1), cl = new Float32Array(n + 1);
  for (let k = 0; k <= n; k++) {
    const u = k / n, v = 1 - u, a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u;
    xs[k] = a * x0 + b * x1 + c * x2 + d * x3; ys[k] = a * y0 + b * y1 + c * y2 + d * y3;
    if (k) cl[k] = cl[k - 1] + Math.hypot(xs[k] - xs[k - 1], ys[k] - ys[k - 1]);
  }
  return { xs, ys, cl, n, len: cl[n] };
}
function along(b: Bezier, f: number) {
  const d = clamp(f, 0, 1) * b.len; let k = 1;
  while (k < b.n && b.cl[k] < d) k++;
  const s = (d - b.cl[k - 1]) / ((b.cl[k] - b.cl[k - 1]) || 1);
  return { x: b.xs[k - 1] + (b.xs[k] - b.xs[k - 1]) * s, y: b.ys[k - 1] + (b.ys[k] - b.ys[k - 1]) * s };
}

export function createTimeMachine(body: HTMLElement, tl: HTMLCanvasElement, fx: HTMLCanvasElement, text: TlText, o: TmOptions) {
  const g = tl.getContext('2d')!, gx = fx.getContext('2d')!;
  const css = getComputedStyle(body);
  const tok = (name: string) => {
    const h = css.getPropertyValue(name).trim().replace('#', '');
    const n = parseInt(h.length === 3 ? [...h].map(c => c + c).join('') : h, 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  };
  const FG = tok('--night-fg'), MUTE = tok('--night-mute'), RED = tok('--red'), NIGHT = tok('--night');
  const SOFT = RED.map((v, i) => Math.round(v + (FG[i] - v) * 0.35));
  const rgba = (c: number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const BODY = css.getPropertyValue('--font-body').trim() || 'sans-serif';
  const DISP = css.getPropertyValue('--font-display').trim() || 'sans-serif';
  const MONO = "Consolas, 'Cascadia Mono', monospace";
  const LANE_COL: Record<LaneId, number[]> = { codex: FG, claude: MUTE, antigravity: RED };
  const halo = (c: number[], a0: number) => {
    const s = document.createElement('canvas'); s.width = s.height = 64;
    const x = s.getContext('2d')!, gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, rgba(c, a0)); gr.addColorStop(0.3, rgba(c, a0 * 0.38)); gr.addColorStop(1, rgba(c, 0));
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return s;
  };
  const SPR = { codex: halo(FG, TM_FX.halo), claude: halo(MUTE, TM_FX.halo), antigravity: halo(RED, TM_FX.haloRed), red: halo(RED, TM_FX.haloRed) } as Record<string, HTMLCanvasElement>;

  type Layout = { dpr: number; w: number; h: number; bw: number; bh: number; ox: number; oy: number; L: number; R: number; T: number; B: number; fill: CanvasGradient;
    nodes: { cx: number; x: number; y: number; w: number; h: number }[] };
  let lay: Layout | null = null, dirty = true, fxDirty = false, nodesVis = 0;
  // The last collaboration keeps drawing (as "done") while the nodes fade out after the controller lets it go.
  let lastCollab: TmState['collab'] = null;
  // Beams start at the provider rows inside the hosted window, which render (and move) after layout: re-measured from
  // the anchor every frame of a run, rebuilt only when that geometry changes.
  let beamKey = '', beams: (Bezier | null)[] = [];
  function beamsFor(a: ReturnType<TmOptions['anchor']>) {
    const key = a ? `${Math.round(a.right)}|${AGENT_FLOW.map(ag => Math.round(a.rows[ag.id] ?? -1)).join(',')}|${lay!.nodes[0].cx}` : '';
    if (key === beamKey) return beams;
    beamKey = key;
    beams = AGENT_FLOW.map((ag, i) => {
      const y = a?.rows[ag.id]; if (!a || y === undefined) return null;
      const n = lay!.nodes[i], sx = a.right + 1, ex = n.cx, ey = n.y + n.h;
      return bez(sx, y, sx + 170, y, ex, ey + 170, ex, ey, 72);
    });
    return beams;
  }
  const sweeps: { at: number; tr: number; id: LaneId }[] = [], rings: { at: number; x: number; y: number; delay: number; dur: number; max: number; lw: number; hit: boolean }[] = [];
  const floats: { at: number; x: number; y: number }[] = [], jumps = new Map<LaneId, { at: number; tr: number; from: number }>();
  const SP = Array.from({ length: o.light ? 24 : TM_FX.sparks }, () => ({ life: 0, max: 1, x: 0, y: 0, vx: 0, vy: 0, c: FG }));
  let last = 0;

  function size(c: HTMLCanvasElement, w: number, h: number, dpr: number) {
    const W = Math.round(w * dpr), Hh = Math.round(h * dpr);
    if (c.width !== W || c.height !== Hh) { c.width = W; c.height = Hh; }
  }
  function layout() {
    dirty = false;
    const dpr = Math.min(2, devicePixelRatio || 1), br = body.getBoundingClientRect(), tr = tl.getBoundingClientRect();
    if (!tr.width || !tr.height) { dirty = true; return; }
    size(tl, tr.width, tr.height, dpr); size(fx, br.width, br.height, dpr);
    const narrow = tr.width < 560, L = narrow ? 40 : 46, R = tr.width - (narrow ? 12 : 22), T = narrow ? 92 : 108, B = tr.height - 40;
    const ox = tr.left - br.left, oy = tr.top - br.top;
    const fill = g.createLinearGradient(0, T, 0, B);
    fill.addColorStop(0, rgba(RED, 0.13)); fill.addColorStop(1, rgba(RED, 0));
    const span = (R - L) / 4, nw = Math.min(172, span - 8);
    const nodes = AGENT_FLOW.map((_, i) => { const cx = ox + L + span * (i + 0.5); return { cx, x: cx - nw / 2, y: oy + 12, w: nw, h: 50 }; });
    lay = { dpr, w: tr.width, h: tr.height, bw: br.width, bh: br.height, ox, oy, L, R, T, B, fill, nodes };
    beamKey = '';
  }
  new ResizeObserver(() => { dirty = true; }).observe(body);

  function label(c: CanvasRenderingContext2D, s: string, x: number, y: number, color: string, align: CanvasTextAlign, font: string) {
    c.font = font; c.textAlign = align; c.lineWidth = 3; c.strokeStyle = rgba(NIGHT, 0.85); c.strokeText(s, x, y); c.fillStyle = color; c.fillText(s, x, y);
  }

  /* ---------- the timeline ---------- */
  function drawTL(s: TmState, now: number) {
    const { w, h, L, R, T, B, dpr } = lay!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.shadowBlur = 0; g.setLineDash([]);
    g.clearRect(0, 0, w, h);
    const t = s.t, t0 = t - 10 * H, t1 = t + 3 * H, kx = (R - L) / (13 * H);
    const X = (x: number) => L + (x - t0) * kx, Y = (v: number) => B - v / 100 * (B - T), xn = X(t);
    const small = `11px ${BODY}`, mono = `11px ${MONO}`;
    g.textBaseline = 'alphabetic';

    if (nodesVis < 0.99) {                                                  // legend, giving way to the agent nodes
      g.globalAlpha = 1 - nodesVis;
      g.font = `600 12px ${BODY}`; g.textAlign = 'left'; g.fillStyle = rgba(FG, 1); g.fillText(text.title, L, 30);
      const tw = g.measureText(text.title).width;
      g.font = small; g.fillStyle = rgba(MUTE, 1); g.fillText(text.sub, L + tw + 12, 30);
      let lx = L;
      for (const l of s.lanes) {
        const c = LANE_COL[l.id];
        g.strokeStyle = rgba(c, 1); g.lineWidth = 2; g.beginPath(); g.moveTo(lx, 55); g.lineTo(lx + 18, 55); g.stroke();
        g.fillStyle = rgba(FG, 1); g.font = `12px ${BODY}`; g.fillText(l.name, lx + 24, 59); lx += 44 + g.measureText(l.name).width;
      }
      g.font = small; g.textAlign = 'right'; g.fillStyle = rgba(MUTE, 1);
      if (R - g.measureText(text.range).width > L + tw + 12 + g.measureText(text.sub).width + 16) g.fillText(text.range, R, 30);
      if (R - g.measureText(text.dashes).width > lx + 16) g.fillText(text.dashes, R, 59);
      g.globalAlpha = 1;
    }

    for (let day = midnight(t0) - D; day <= t1; day += D) {                 // day / night bands, scrolling with time
      const a = Math.max(t0, day + 7 * H), b = Math.min(t1, day + 23 * H);
      if (b > a) { g.fillStyle = rgba(FG, 0.04); g.fillRect(X(a), T - 20, X(b) - X(a), B - T + 20); }
      const na = Math.max(t0, day + 23 * H), nb = Math.min(t1, day + D + 7 * H);
      if (nb > na && X(nb) - X(na) > 46) { g.globalAlpha = 0.6; label(g, text.night, (X(na) + X(nb)) / 2, B - 9, rgba(MUTE, 1), 'center', small); g.globalAlpha = 1; }
    }
    g.lineWidth = 1;                                                        // grid and axes
    for (let k = Math.ceil(t0 / H); k * H <= t1; k++) {
      const x = Math.round(X(k * H)) + 0.5, even = new Date(k * H).getHours() % 2 === 0;
      g.strokeStyle = rgba(FG, even ? 0.07 : 0.03);
      g.beginPath(); g.moveTo(x, T - 20); g.lineTo(x, B); g.stroke();
      if (even && Math.abs(x - xn) > 34 && x > L + 12 && x < R - 12) { g.font = mono; g.textAlign = 'center'; g.fillStyle = rgba(MUTE, 1); g.fillText(hhmm(k * H), x, B + 16); }
    }
    for (const v of [0, 25, 50, 75, 100]) {
      const y = Math.round(Y(v)) + 0.5;
      g.strokeStyle = rgba(FG, v === 0 ? 0.22 : 0.06);
      g.beginPath(); g.moveTo(L, y); g.lineTo(R, y); g.stroke();
      if (v % 50 === 0) { g.font = mono; g.textAlign = 'right'; g.fillStyle = rgba(MUTE, 1); g.fillText(`${v}%`, L - 8, y + 4); }
    }
    const xw = X(t - H);                                                    // Antigravity's sampling window: the last hour
    g.fillStyle = rgba(RED, 0.05); g.fillRect(xw, T - 20, xn - xw, B - T + 20);
    g.strokeStyle = rgba(SOFT, 0.55); g.beginPath(); g.moveTo(xw + 0.5, B + 22); g.lineTo(xw + 0.5, B + 27); g.lineTo(xn - 0.5, B + 27); g.lineTo(xn - 0.5, B + 22); g.stroke();
    label(g, text.window, xw - 6, B + 31, rgba(MUTE, 1), 'right', `10.5px ${BODY}`);

    g.save(); g.beginPath(); g.rect(L, 0, R - L, h); g.clip();              // reset markers (past) and next resets (future)
    for (const m of s.marks) {
      if (m.t < t0) continue;
      const x = Math.round(X(m.t)) + 0.5, c = LANE_COL[m.id];
      g.setLineDash([3, 4]); g.lineWidth = 1; g.strokeStyle = rgba(c, 0.4); g.beginPath(); g.moveTo(x, T - 20); g.lineTo(x, B); g.stroke();
      g.setLineDash([]); label(g, text.reset, x + 4, T - 8, rgba(FG, 0.9), 'left', `10.5px ${BODY}`);
    }
    s.lanes.forEach((l, i) => {
      if (l.reset > t1) return;
      const x = Math.round(X(l.reset)) + 0.5;
      g.setLineDash([3, 4]); g.lineWidth = 1; g.strokeStyle = rgba(LANE_COL[l.id], 0.28); g.beginPath(); g.moveTo(x, T - 20); g.lineTo(x, B); g.stroke();
      g.setLineDash([]); label(g, text.nextReset, x - 4, T + 12 + i * 14, rgba(MUTE, 1), 'right', `10.5px ${BODY}`);
    });
    g.restore();

    g.save(); g.beginPath(); g.rect(L, T - 22, R - L, B - T + 26); g.clip(); // curves
    g.lineJoin = 'round'; g.lineCap = 'round';
    for (const l of [s.lanes[1], s.lanes[0], s.lanes[2]]) {
      const hs = l.hist, c = LANE_COL[l.id], agy = l.id === 'antigravity';
      let j = 0; while (j < hs.length - 2 && hs[j + 1].t < t0) j++;
      const trace = () => { g.beginPath(); g.moveTo(X(hs[j].t), Y(hs[j].v)); for (let k = j + 1; k < hs.length; k++) g.lineTo(X(hs[k].t), Y(hs[k].v)); g.lineTo(xn, Y(l.rem)); };
      if (agy) { trace(); g.lineTo(xn, B); g.lineTo(X(hs[j].t), B); g.closePath(); g.fillStyle = lay!.fill; g.fill(); }
      trace();
      g.strokeStyle = rgba(c, 0.95); g.lineWidth = agy ? 2.2 : 2;
      if (!o.light) { g.shadowColor = rgba(c, 0.7); g.shadowBlur = 9; }
      g.stroke(); g.shadowBlur = 0;
      const jump = jumps.get(l.id);                                         // a reset: the vertical segment glows briefly
      if (jump) {
        const a = (now - jump.at) / 1300;
        if (a >= 1 || o.reduced) jumps.delete(l.id);
        else {
          const x = X(jump.tr), k = 1 - a;
          g.globalCompositeOperation = 'lighter';
          g.strokeStyle = rgba(c, 0.75 * k); g.lineWidth = 3.2; g.beginPath(); g.moveTo(x, Y(jump.from)); g.lineTo(x, Y(100)); g.stroke();
          if (!o.light) { const sz = 26 + 40 * k; g.globalAlpha = 0.35 * k; g.drawImage(SPR[l.id], x - sz / 2, Y(100) - sz / 2, sz, sz); g.globalAlpha = 1; }
          g.globalCompositeOperation = 'source-over';
        }
      }
    }
    g.restore();

    for (let k = sweeps.length - 1; k >= 0; k--) {                          // reset sweeps: a scan line runs out both ways
      const sw = sweeps[k], a = (now - sw.at) / 1100;
      if (a >= 1) { sweeps.splice(k, 1); continue; }
      const x0 = X(sw.tr), e = easeOut(a), xl = x0 - e * (x0 - L), xr = x0 + e * (R - x0), fade = 1 - a, c = LANE_COL[sw.id];
      g.globalCompositeOperation = 'lighter';
      let gr = g.createLinearGradient(xl, 0, x0, 0); gr.addColorStop(0, rgba(c, 0.2 * fade)); gr.addColorStop(1, rgba(c, 0));
      g.fillStyle = gr; g.fillRect(xl, T - 20, x0 - xl, B - T + 20);
      gr = g.createLinearGradient(x0, 0, xr, 0); gr.addColorStop(0, rgba(c, 0)); gr.addColorStop(1, rgba(c, 0.2 * fade));
      g.fillStyle = gr; g.fillRect(x0, T - 20, xr - x0, B - T + 20);
      g.strokeStyle = rgba(c, 0.35 * fade); g.lineWidth = 2;
      g.beginPath(); g.moveTo(xl, T - 20); g.lineTo(xl, B); g.moveTo(xr, T - 20); g.lineTo(xr, B); g.stroke();
      g.globalCompositeOperation = 'source-over';
      const lane = s.lanes.find(l => l.id === sw.id)!;
      if (a < 0.7) { g.globalAlpha = 1 - a / 0.7; label(g, text.resetTo(lane.name), x0 + 8, Y(100) - 8, rgba(FG, 1), 'left', `600 12px ${BODY}`); g.globalAlpha = 1; }
    }

    const agy = s.lanes[2], e = s.estimate;                                 // Antigravity: QuotaDeck's samples and estimate
    g.save(); g.beginPath(); g.rect(L, T - 22, R - L, B - T + 26); g.clip();
    const recent = s.samples.filter(r => r.at >= t - H);
    for (const r of recent) {
      const x = X(r.at), y = Y(r.value), first = r === recent[0];
      g.strokeStyle = rgba(SOFT, 0.8); g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y - 7); g.lineTo(x, y + 7); g.stroke();
      g.fillStyle = rgba(SOFT, 1); g.beginPath(); g.arc(x, y, first ? 3 : 2, 0, 7); g.fill();
      if (first) { g.strokeStyle = rgba(SOFT, 0.7); g.beginPath(); g.arc(x, y, 6.5, 0, 7); g.stroke(); }
    }
    if (e && e.burn !== null && e.burn > 0 && recent.length >= 2 && agy.rem > 0) {
      const f = recent[0], x1 = X(f.at), y1 = Y(f.value), x2 = X(e.at), y2 = Y(e.value);
      g.strokeStyle = rgba(SOFT, 0.9); g.lineWidth = 1.4; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      g.setLineDash([7, 6]); g.lineDashOffset = o.reduced ? 0 : -now / 60;
      if (e.hoursLeft !== null) {
        const tc = e.at + e.hoursLeft * H, xc = X(tc), y0 = Y(0), left = countdown(e.hoursLeft, e.at, t), urgent = left < 1;
        g.strokeStyle = rgba(SOFT, 0.85); g.beginPath(); g.moveTo(x2, y2); g.lineTo(xc, y0); g.stroke(); g.setLineDash([]);
        g.restore(); g.save();
        const txt = text.exhaust(left.toFixed(1)), inside = xc <= R;
        if (inside) {
          g.strokeStyle = rgba(SOFT, 1); g.lineWidth = 1.5; g.beginPath(); g.arc(xc, y0, 4.5, 0, 7); g.stroke();
          if (urgent && !o.reduced) {
            const ph = (now % 1000) / 1000;
            g.globalCompositeOperation = 'lighter'; g.strokeStyle = rgba(RED, 0.35 * (1 - ph)); g.lineWidth = 2;
            g.beginPath(); g.arc(xc, y0, 5 + 22 * easeOut(ph), 0, 7); g.stroke(); g.globalCompositeOperation = 'source-over';
          }
        }
        const sc = urgent && !o.reduced ? 1 + 0.07 * Math.sin(now / 150) : 1, lx = inside ? clamp(xc, L + 50, R - 50) : R;
        g.translate(lx, y0 - 14); g.scale(sc, sc);
        g.font = `700 13px ${MONO}`;
        const shown = inside ? txt : `${txt} →`, tw = g.measureText(shown).width, bx = inside ? -tw / 2 : -tw;
        g.fillStyle = rgba(NIGHT, 0.8); g.fillRect(bx - 6, -14, tw + 12, 20);
        g.strokeStyle = rgba(urgent ? RED : SOFT, urgent ? 0.9 : 0.5); g.lineWidth = 1; g.strokeRect(bx - 5.5, -13.5, tw + 11, 19);
        g.fillStyle = rgba(FG, 1); g.textAlign = 'left'; g.fillText(shown, bx, 1);
      } else {
        const tr = Math.min(e.resetAt, t1), vr = e.value - e.burn * (tr - e.at) / H, xr = X(tr), yr = Y(vr);
        g.strokeStyle = rgba(SOFT, 0.6); g.beginPath(); g.moveTo(x2, y2); g.lineTo(xr, yr); g.stroke(); g.setLineDash([]);
        g.restore(); g.save();
        label(g, text.noExhaust, Math.min(xr, R) - 6, yr - 10, rgba(FG, 1), 'right', `600 12px ${BODY}`);
      }
    }
    g.restore();
    if (agy.rem <= 0) label(g, text.exhausted, xn - 8, Y(0) - 12, rgba(FG, 1), 'right', `600 12px ${BODY}`);

    g.strokeStyle = rgba(FG, 0.5); g.lineWidth = 1;                          // now line and heads
    g.beginPath(); g.moveTo(Math.round(xn) + 0.5, T - 22); g.lineTo(Math.round(xn) + 0.5, B + 4); g.stroke();
    label(g, text.now, xn, B + 16, rgba(FG, 1), 'center', `600 11px ${BODY}`);
    if (!o.light) {
      g.globalCompositeOperation = 'lighter';
      for (const l of s.lanes) { const y = Y(l.rem), sz = l.agent && !o.reduced ? 58 + 8 * Math.sin(now / 120) : 42; g.globalAlpha = TM_FX.heads; g.drawImage(SPR[l.id], xn - sz / 2, y - sz / 2, sz, sz); }
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
    for (const l of s.lanes) {
      const y = Y(l.rem);
      g.fillStyle = rgba(LANE_COL[l.id], 1); g.beginPath(); g.arc(xn, y, 4, 0, 7); g.fill();
      g.fillStyle = rgba(FG, 0.75); g.beginPath(); g.arc(xn, y, 1.8, 0, 7); g.fill();
    }
  }

  /* ---------- the overlay: beams, agent nodes, shockwave, sparks ---------- */
  function drawNode(i: number, st: 'queue' | 'run' | 'done', el: number, a: number) {
    const n = lay!.nodes[i], ag = AGENT_FLOW[i], ap = clamp((el - i * 0.09) / 0.35, 0, 1);
    if (ap <= 0) return;
    const now = performance.now(), sinceDone = el - ag.start - ag.run;
    gx.save(); gx.globalAlpha = a * ap;
    const pop = st === 'done' && sinceDone < 0.35 ? 1 + 0.12 * (1 - sinceDone / 0.35) : 1, sc = (0.86 + 0.14 * easeOut(ap)) * pop;
    gx.translate(n.cx, n.y + n.h / 2); gx.scale(sc, sc); gx.translate(-n.cx, -(n.y + n.h / 2));
    gx.beginPath(); gx.roundRect(n.x, n.y, n.w, n.h, 7); gx.fillStyle = rgba(NIGHT, 0.95); gx.fill();
    if (st === 'queue') { gx.setLineDash([3, 4]); gx.strokeStyle = rgba(MUTE, 0.55); gx.lineWidth = 1; gx.stroke(); gx.setLineDash([]); }
    else if (st === 'run') { gx.strokeStyle = rgba(SOFT, 0.85); gx.lineWidth = 1.4; gx.stroke(); }
    else { gx.strokeStyle = rgba(FG, 0.8); gx.lineWidth = 1.4; gx.stroke(); }
    const ix = n.x + 23, iy = n.y + 25, compact = n.w < 132;              // phones and ~1000 px: no icon, smaller text
    gx.lineCap = 'round';
    if (compact) { /* no icon */ }
    else if (st === 'queue') { gx.setLineDash([2, 3]); gx.strokeStyle = rgba(MUTE, 1); gx.lineWidth = 1.4; gx.beginPath(); gx.arc(ix, iy, 9, 0, 7); gx.stroke(); gx.setLineDash([]); }
    else if (st === 'run') {
      const ang = now / 170;
      gx.strokeStyle = rgba(RED, 0.25); gx.lineWidth = 2.4; gx.beginPath(); gx.arc(ix, iy, 9, 0, 7); gx.stroke();
      gx.strokeStyle = rgba(SOFT, 1); gx.beginPath(); gx.arc(ix, iy, 9, ang, ang + Math.PI * 1.3); gx.stroke();
      const prog = clamp((el - ag.start) / ag.run, 0, 1);
      gx.strokeStyle = rgba(RED, 0.75); gx.lineWidth = 2; gx.beginPath(); gx.moveTo(n.x + 8, n.y + n.h - 3); gx.lineTo(n.x + 8 + (n.w - 16) * prog, n.y + n.h - 3); gx.stroke();
    } else {
      gx.fillStyle = rgba(FG, 0.12); gx.beginPath(); gx.arc(ix, iy, 10, 0, 7); gx.fill();
      gx.strokeStyle = rgba(FG, 1); gx.lineWidth = 2.2; gx.beginPath(); gx.moveTo(ix - 4.5, iy); gx.lineTo(ix - 1, iy + 3.8); gx.lineTo(ix + 5, iy - 3.8); gx.stroke();
    }
    if (compact && st === 'run') {
      const prog = clamp((el - ag.start) / ag.run, 0, 1);
      gx.strokeStyle = rgba(RED, 0.75); gx.lineWidth = 2; gx.beginPath(); gx.moveTo(n.x + 8, n.y + n.h - 3); gx.lineTo(n.x + 8 + (n.w - 16) * prog, n.y + n.h - 3); gx.stroke();
    }
    const tx = compact ? n.x + 8 : n.x + 42;
    gx.save(); gx.beginPath(); gx.rect(n.x + 2, n.y, n.w - 4, n.h); gx.clip();
    gx.textAlign = 'left'; gx.fillStyle = rgba(FG, 1); gx.font = `700 ${compact ? 11 : 13}px ${BODY}`; gx.fillText(ag.name, tx, n.y + 21);
    gx.font = `${compact ? 11 : 12}px ${BODY}`; gx.fillStyle = rgba(st === 'queue' ? MUTE : FG, 1); gx.fillText(text.status[st], tx, n.y + 39);
    gx.restore();
    if (ag.id === 'workbuddy') {
      gx.font = `11px ${BODY}`; const w = gx.measureText(text.wbNote).width;
      gx.textAlign = 'right'; gx.fillStyle = rgba(MUTE, 1); gx.fillText(text.wbNote, Math.min(n.cx + w / 2, lay!.bw - 4), n.y + n.h + 15);
    }
    gx.restore();
  }
  function drawBeam(b: Bezier | null, i: number, st: 'queue' | 'run' | 'done', el: number, a: number) {
    const ag = AGENT_FLOW[i], now = performance.now(), ap = clamp((el - i * 0.09) / 0.35, 0, 1);
    if (!b || ap <= 0) return;
    const path = () => { gx.beginPath(); gx.moveTo(b.xs[0], b.ys[0]); for (let k = 1; k <= b.n; k++) gx.lineTo(b.xs[k], b.ys[k]); };
    gx.globalAlpha = a * ap;
    if (st === 'queue') { path(); gx.setLineDash([2, 7]); gx.strokeStyle = rgba(MUTE, 0.4); gx.lineWidth = 1.2; gx.stroke(); gx.setLineDash([]); }
    else if (st === 'run') {
      path(); gx.strokeStyle = rgba(RED, 0.14); gx.lineWidth = 5; gx.stroke();
      gx.globalCompositeOperation = 'lighter';
      gx.setLineDash([8, 10]); gx.lineDashOffset = -now * 0.09; gx.strokeStyle = rgba(SOFT, 0.7); gx.lineWidth = 1.8; path(); gx.stroke(); gx.setLineDash([]);
      if (!o.light) for (let k = 0; k < TM_FX.packets; k++) { const q = along(b, ((now / 1100) + k / TM_FX.packets + i * 0.17) % 1); gx.drawImage(SPR.red, q.x - 11, q.y - 11, 22, 22); }
      gx.globalCompositeOperation = 'source-over';
    } else {
      const k = clamp((el - ag.start - ag.run) / 0.9, 0, 1);
      if (k < 1) { path(); gx.strokeStyle = rgba(FG, 0.55 * (1 - k)); gx.lineWidth = 1.6; gx.stroke(); }
    }
    gx.fillStyle = rgba(st === 'run' ? SOFT : st === 'done' ? FG : MUTE, 1); gx.beginPath(); gx.arc(b.xs[0], b.ys[0], 3.2, 0, 7); gx.fill();
    gx.globalAlpha = 1;
  }
  function spark(x: number, y: number, k: number) {
    for (const p of SP) {
      if (k <= 0) break; if (p.life > 0) continue;
      const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 7;
      p.x = x; p.y = y; p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v - 1.5; p.max = p.life = 450 + Math.random() * 650; p.c = Math.random() < 0.55 ? SOFT : RED; k--;
    }
  }
  function drawFX(s: TmState, now: number, rdt: number) {
    const sparksAlive = SP.some(p => p.life > 0);
    if (s.collab) nodesVis = Math.min(1, nodesVis + rdt / 300);
    else nodesVis = Math.max(0, nodesVis - rdt / 600);
    const live = s.collab || nodesVis > 0 || rings.length || floats.length || sparksAlive || s.lanes[0].drop > 0;
    if (!live && !fxDirty) return;
    fxDirty = !!live;
    gx.setTransform(lay!.dpr, 0, 0, lay!.dpr, 0, 0);
    gx.globalCompositeOperation = 'source-over'; gx.globalAlpha = 1; gx.shadowBlur = 0; gx.setLineDash([]);
    gx.clearRect(0, 0, lay!.bw, lay!.bh);
    if (s.collab) lastCollab = s.collab;
    const a0 = o.anchor();
    if (s.collab || nodesVis > 0) {
      const el = s.collab ? (now - s.collab.at) / 1000 : collabEnd(AGENT_FLOW.map(a => a.id)) + 1;
      const shown = (s.collab ?? lastCollab)?.agents ?? [], bs = beamsFor(a0);
      AGENT_FLOW.forEach((ag, i) => { if (shown.includes(ag.id)) drawBeam(bs[i], i, agentPhase(ag.id, el), el, nodesVis); });
      AGENT_FLOW.forEach((ag, i) => { if (shown.includes(ag.id)) drawNode(i, agentPhase(ag.id, el), el, nodesVis); });
    }
    if (!s.collab && nodesVis <= 0) lastCollab = null;
    for (let k = rings.length - 1; k >= 0; k--) {                           // shockwave: when it reaches the window, the window takes the hit
      const r = rings[k], a = (now - r.at - r.delay) / r.dur;
      if (a < 0) continue;
      if (a >= 1) { if (!r.hit) { r.hit = true; o.onHit(); } rings.splice(k, 1); continue; }
      const rad = 8 + easeOut(a) * r.max, fade = Math.pow(1 - a, 1.4);
      if (!r.hit && a0 && rad >= r.x - a0.right) { r.hit = true; o.onHit(); }
      gx.globalCompositeOperation = 'lighter';
      gx.strokeStyle = rgba(RED, 0.35 * fade); gx.lineWidth = 1 + r.lw * (1 - a);
      gx.beginPath(); gx.arc(r.x, r.y, rad, 0, 7); gx.stroke();
      if (!o.light && r.delay === 0 && a < 0.3) { const sz = 60 + 260 * (a / 0.3); gx.globalAlpha = 0.35 * (1 - a / 0.3); gx.drawImage(SPR.red, r.x - sz / 2, r.y - sz / 2, sz, sz); gx.globalAlpha = 1; }
      gx.globalCompositeOperation = 'source-over';
    }
    const f = rdt / 16.7;
    gx.globalCompositeOperation = 'lighter'; gx.lineCap = 'round';
    for (const p of SP) {
      if (p.life <= 0) continue;
      p.life -= rdt; p.vx *= Math.pow(0.955, f); p.vy = p.vy * Math.pow(0.955, f) + 0.16 * f; p.x += p.vx * f; p.y += p.vy * f;
      const k = Math.max(0, p.life / p.max);
      gx.strokeStyle = rgba(p.c, 0.6 * k); gx.lineWidth = 1.2 + 1.2 * k;
      const trail = o.light ? 0.6 : 3.2;                                    // phones: short dots, no trails
      gx.beginPath(); gx.moveTo(p.x, p.y); gx.lineTo(p.x - p.vx * trail, p.y - p.vy * trail); gx.stroke();
    }
    gx.globalCompositeOperation = 'source-over';
    for (let k = floats.length - 1; k >= 0; k--) {
      const fl = floats[k], a = (now - fl.at) / 1300;
      if (a >= 1) { floats.splice(k, 1); continue; }
      gx.globalAlpha = 0.85 * (1 - a * a); gx.textAlign = 'right'; gx.fillStyle = rgba(FG, 1);
      gx.font = `700 34px ${DISP}`; gx.fillText(`−${BIG_TASK}`, fl.x - 16, fl.y - 18 - 46 * easeOut(a));
      gx.font = `12px ${BODY}`; gx.fillText(text.bigTask, fl.x - 16, fl.y - 2 - 46 * easeOut(a)); gx.globalAlpha = 1;
    }
  }

  return {
    layout() { dirty = true; },
    draw(s: TmState, now: number) {
      const rdt = last ? Math.min(100, now - last) : 16; last = now;
      if (dirty) layout();
      if (!lay) return;
      if (s.lanes[0].drop > 0 && !o.reduced) spark(headX(), headY(s.lanes[0]), 2);
      drawTL(s, now);
      if (!o.reduced) drawFX(s, now, rdt);
    },
    /** A lane has just reset: its history ends with the value before the reset and then 100. */
    sweep(lane: Lane, t: number) {
      if (o.reduced) return;
      const now = performance.now(), from = lane.hist.length >= 2 ? lane.hist[lane.hist.length - 2].v : 0;
      sweeps.push({ at: now, tr: t, id: lane.id });
      jumps.set(lane.id, { at: now, tr: t, from });
    },
    shock(lane: Lane, now: number) {
      if (!lay || o.reduced) return;
      const x = lay.ox + lay.L + (lay.R - lay.L) * 10 / 13, y = lay.oy + lay.B - lane.rem / 100 * (lay.B - lay.T);
      rings.push({ at: now, x, y, delay: 0, dur: 1300, max: 1000, lw: 6, hit: false });                 // TM_FX.rings: one
      floats.push({ at: now, x, y });
      spark(x, y, o.light ? 8 : TM_FX.shockSparks);
    },
  };

  function headX() { return lay!.ox + lay!.L + (lay!.R - lay!.L) * 10 / 13; }
  function headY(l: Lane) { return lay!.oy + lay!.B - l.rem / 100 * (lay!.B - lay!.T); }
}
