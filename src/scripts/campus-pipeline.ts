import type { Flow } from './campus-flow';
import { frameCap } from './frame-cap';

/** Canvas labels, per language. Gates follow analysis.py's order of exclusion. */
export interface PipeText {
  gates: readonly string[]; conds: readonly string[]; keys: readonly string[];
  included: string; append: string; loop: string; you: string; legend: readonly string[]; q3: string;
}
/** hit(n) is called with each source line a replayed row passes, in the order the program ran them. */
export interface PipeOptions { reduced: boolean; light: boolean; hit: (line: number) => void }
export interface PlayOptions { storm: boolean; special: number | null }
export interface Pipeline {
  /** Replays rows (indices into flow) through the gates; every other row is drawn where flow puts it from the start.
   *  Resolves true once they have settled, false when a newer play or show took over. */
  play(flow: Flow, rows: number[], o: PlayOptions): Promise<boolean>;
  /** Draws flow's final state at once. */
  show(flow: Flow): void;
}

/** The largest square pitch (at most 24 px) at which n cells fit into an aw × ah area. */
export function matrixPitch(aw: number, ah: number, n: number): { pitch: number; cols: number } {
  let p = Math.min(24, Math.sqrt((aw * ah) / Math.max(1, n)));
  for (let k = 0; k < 400; k++) {
    const cols = Math.max(1, Math.floor(aw / p));
    if (Math.ceil(n / cols) * p <= ah) return { pitch: p, cols };
    p *= 0.97;
  }
  return { pitch: p, cols: Math.max(1, Math.floor(aw / p)) };
}

/** Effect levels, one notch below the approved prototype (user decision 2026-10-01); idleAfter: ms of stillness before
 *  the frame loop stops. */
export const PIPE_FX = { sparkMin: 2, sparkRange: 2, glow: 0.25, idleAfter: 2000 } as const;

const PMAX = 4096, SMAX = 1600, TMAX = 1024, TAU = Math.PI * 2, LIGHT_STRIDE = 5;
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const fmt = (n: number) => n.toLocaleString('en-US');
const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };

export function createPipeline(host: HTMLElement, text: PipeText, o: PipeOptions): Pipeline {
  const STRIDE = o.light ? LIGHT_STRIDE : 1;
  const base = document.createElement('canvas'), top = document.createElement('canvas');
  for (const c of [base, top]) { c.setAttribute('aria-hidden', 'true'); host.append(c); }
  const gB = base.getContext('2d')!, gF = top.getContext('2d')!;

  /* ---------- colours and fonts: tokens only ---------- */
  const css = getComputedStyle(host);
  const tok = (name: string) => {
    const h = css.getPropertyValue(name).trim().replace('#', '');
    const n = parseInt(h.length === 3 ? [...h].map(c => c + c).join('') : h, 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  };
  const FG = tok('--night-fg'), MUTE = tok('--night-mute'), RED = tok('--red');
  const SOFT = RED.map((v, i) => Math.round(v + (FG[i] - v) * 0.35));          // red, lifted towards the foreground
  const rgba = (c: number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const DISP = css.getPropertyValue('--font-display').trim() || 'sans-serif';
  const BODY = css.getPropertyValue('--font-body').trim() || 'sans-serif';
  const MONO = "Consolas, 'Cascadia Mono', monospace";
  const sprite = (w: number, h: number, paint: (g: CanvasRenderingContext2D) => void) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d')!); return c;
  };
  const radial = (size: number, stops: [number, string][]) => sprite(size, size, g => {
    const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(([at, col]) => gr.addColorStop(at, col)); g.fillStyle = gr; g.fillRect(0, 0, size, size);
  });
  const linear = (w: number, h: number, across: boolean, stops: [number, string][]) => sprite(w, h, g => {
    const gr = across ? g.createLinearGradient(0, 0, w, 0) : g.createLinearGradient(0, 0, 0, h);
    stops.forEach(([at, col]) => gr.addColorStop(at, col)); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  const SPR = {
    dot: radial(16, [[0, rgba(FG, .85)], [.16, rgba(FG, .85)], [.3, rgba(FG, .45)], [.6, rgba(FG, .12)], [1, rgba(FG, 0)]]),
    red: radial(16, [[0, rgba(SOFT, .9)], [.2, rgba(RED, .75)], [.55, rgba(RED, .2)], [1, rgba(RED, 0)]]),
    big: radial(44, [[0, rgba(FG, 1)], [.1, rgba(SOFT, .9)], [.35, rgba(RED, .35)], [1, rgba(RED, 0)]]),
    gate: linear(64, 4, true, [[0, rgba(RED, 0)], [.42, rgba(RED, .28)], [.5, rgba(SOFT, .6)], [.58, rgba(RED, .28)], [1, rgba(RED, 0)]]),
    shim: linear(4, 40, false, [[0, rgba(SOFT, 0)], [.5, rgba(FG, .9)], [1, rgba(SOFT, 0)]]),
    glow: radial(24, [[0, rgba(SOFT, .7)], [.45, rgba(RED, .25)], [1, rgba(RED, 0)]]),
  };

  /* ---------- geometry ---------- */
  let W = 0, H = 0, narrow = false, laneY = 124, gTop = 0, gBot = 0, binBot = 0, binMaxH = 0, binW = 48;
  let mx0 = 0, mx1 = 0, my0 = 0, my1 = 0, pitch = 18, cols = 1, cellS = 12, mxOff = 0;
  let laneGrad: CanvasGradient | null = null, barGrad: CanvasGradient | null = null;
  const GX = new Float32Array(4);
  const cellX = (k: number) => mxOff + (k % cols) * pitch + pitch / 2;
  const cellY = (k: number) => my1 - (Math.floor(k / cols) + 0.5) * pitch;

  /* ---------- what is drawn: the flow shown, which cells are lit, how full each bin is ---------- */
  let flow: Flow | null = null, cellOf = new Int32Array(0), lit = new Uint8Array(0), litAt = new Float64Array(0);
  const landed = new Float64Array(4), binH = new Float32Array(4), binPulse = new Float32Array(4), heat = new Float32Array(4);
  let binScale = 10, matPulse = 0;

  /* ---------- particles, sparks, pass ticks, rings (structure of arrays: no per-particle objects) ---------- */
  const px = new Float32Array(PMAX), py = new Float32Array(PMAX), pvx = new Float32Array(PMAX), pvy = new Float32Array(PMAX);
  const psx = new Float32Array(PMAX), psy = new Float32Array(PMAX), poff = new Float32Array(PMAX), pwob = new Float32Array(PMAX), pbx = new Float32Array(PMAX);
  const pt0 = new Float64Array(PMAX), prow = new Int32Array(PMAX), pst = new Uint8Array(PMAX), pg = new Uint8Array(PMAX);
  let np = 0, nLane = 0;
  const kill = (i: number) => {
    np--; if (i === np) return; const s = np;
    px[i] = px[s]; py[i] = py[s]; pvx[i] = pvx[s]; pvy[i] = pvy[s]; psx[i] = psx[s]; psy[i] = psy[s]; poff[i] = poff[s]; pwob[i] = pwob[s];
    pbx[i] = pbx[s]; pt0[i] = pt0[s]; prow[i] = prow[s]; pst[i] = pst[s]; pg[i] = pg[s];
  };
  const sx = new Float32Array(SMAX), sy = new Float32Array(SMAX), svx = new Float32Array(SMAX), svy = new Float32Array(SMAX), sl = new Float32Array(SMAX), sm = new Float32Array(SMAX), sc = new Uint8Array(SMAX);
  let ns = 0;
  const tg = new Uint8Array(TMAX), ty = new Float32Array(TMAX), tt = new Float64Array(TMAX).fill(-1e9);
  let tHead = 0;
  const rings: { x: number; y: number; r0: number; r1: number; dur: number; col: number[]; t0: number }[] = [];
  const burst = (x: number, y: number, n: number) => {
    for (let k = 0; k < n && ns < SMAX; k++) {
      const a = Math.random() * TAU, v = 90 + Math.random() * 210;
      sx[ns] = x; sy[ns] = y; svx[ns] = Math.cos(a) * v - 50; svy[ns] = Math.sin(a) * v - 40;
      sl[ns] = sm[ns] = 0.26 + Math.random() * 0.3; sc[ns] = Math.random() < 0.55 ? 0 : 1; ns++;
    }
  };
  const ring = (x: number, y: number, r0: number, r1: number, dur: number, col: number[], now: number) => { if (rings.length < 8) rings.push({ x, y, r0, r1, dur, col, t0: now }); };

  /* ---------- the replay ---------- */
  let queue: number[] = [], qi = 0, emitAcc = 0, storm = false, special: number | null = null, runT0 = 0;
  let done: ((settled: boolean) => void) | null = null;
  const finish = (v: boolean) => { const d = done; done = null; d?.(v); };

  function setFlow(f: Flow) {
    flow = f;
    cellOf = new Int32Array(f.gates.length).fill(-1);
    f.cells.forEach((row, k) => { cellOf[row] = k; });
    lit = new Uint8Array(f.cells.length); litAt = new Float64Array(f.cells.length);
    relayoutMatrix();
  }
  /** The exact final state: every bin at the program's count, every included cell lit. */
  function snap() {
    if (!flow) return;
    for (let g = 0; g < 4; g++) landed[g] = flow.excluded[g];
    lit.fill(1);
  }
  const binTarget = () => { let mx = 0; for (let g = 0; g < 4; g++) mx = Math.max(mx, landed[g]); return Math.max(10, Math.ceil((mx * 1.25) / 5) * 5); };
  function settleBins() { binScale = binTarget(); for (let g = 0; g < 4; g++) binH[g] = (landed[g] / binScale) * binMaxH; }

  function relayoutMatrix() {
    const aw = mx1 - mx0, ah = my1 - my0;
    if (aw <= 0 || ah <= 0) return;
    ({ pitch, cols } = matrixPitch(aw, ah, Math.max(flow?.cells.length ?? 0, 24)));
    cellS = Math.max(2, pitch * 0.72); mxOff = mx0 + (aw - cols * pitch) / 2;
  }
  function layout() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    W = host.clientWidth; H = host.clientHeight;
    if (!W || !H) return;
    for (const c of [base, top]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    gB.setTransform(dpr, 0, 0, dpr, 0, 0); gF.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Narrow when the wide layout's neighbouring gate names or conditions would touch (measured, so it holds for both
    // languages and whatever font the visitor has; about < 622 px in Chinese and < 700 px in English).
    const crowded = (font: string, labels: readonly string[]) => {
      gB.font = font; const w = labels.map(t => gB.measureText(t).width), gap = W * 0.135;
      return w.some((v, k) => k > 0 && (v + w[k - 1]) / 2 + 6 > gap);
    };
    narrow = W < 560 || crowded(`600 12.5px ${BODY}`, text.gates) || crowded(`10.5px ${MONO}`, text.conds);
    laneY = narrow ? 96 : 124; gTop = laneY - (narrow ? 44 : 60); gBot = laneY + (narrow ? 42 : 56);
    const g0 = W * 0.13, gs = W * (narrow ? 0.13 : 0.135);
    for (let i = 0; i < 4; i++) GX[i] = g0 + gs * i;
    binBot = H - 30; binMaxH = Math.max(20, binBot - (gBot + 40)); binW = Math.min(54, gs * 0.46);
    mx0 = GX[3] + gs * 0.74; mx1 = W - 14; my0 = narrow ? 50 : 58; my1 = H - 30;
    laneGrad = gB.createLinearGradient(0, 0, GX[3] + 70, 0);
    laneGrad.addColorStop(0, rgba(FG, 0)); laneGrad.addColorStop(.08, rgba(FG, .045)); laneGrad.addColorStop(.9, rgba(FG, .03)); laneGrad.addColorStop(1, rgba(FG, 0));
    barGrad = gB.createLinearGradient(0, binBot - binMaxH, 0, binBot);
    barGrad.addColorStop(0, rgba(RED, .78)); barGrad.addColorStop(1, rgba(RED, .26));
    relayoutMatrix(); settleBins();
  }

  /* ---------- simulation ---------- */
  function spawn(row: number) {
    const i = np++, me = row === special;
    px[i] = -4 - Math.random() * 16;
    poff[i] = me ? 0 : clamp(gauss() * (storm ? 9 : 5), -24, 24);
    py[i] = laneY + poff[i]; pwob[i] = Math.random() * TAU;
    pvx[i] = me ? 210 : storm ? 470 + Math.random() * 200 : 330 + Math.random() * 40;
    pst[i] = 0; pg[i] = 0; prow[i] = row;
    o.hit(87);                                                          // for row in rows
  }
  function emit(dt: number, now: number) {
    if (qi >= queue.length) return;
    emitAcc += (storm ? 380 * clamp((now - runT0) / 600, 0.2, 1) : 30) * dt;
    if (!storm && np === 0 && emitAcc < 1) emitAcc = 1;                // no idle wait before the first row
    while (emitAcc >= 1 && qi < queue.length && np < PMAX) {
      emitAcc -= 1;
      const row = queue[qi++];
      // Phones: one point of light per STRIDE answers; the rest report their lines and land at once, so the data is unchanged.
      if (STRIDE > 1 && row !== special && qi % STRIDE) pass(row, now); else spawn(row);
    }
  }
  /** A replayed row drawn without a particle: it runs through its lines in the program's order and lands straight away. */
  function pass(row: number, now: number) {
    const g = flow!.gates[row];
    o.hit(87);
    for (let k = 0; k <= (g === -1 ? 3 : g); k++) o.hit(88 + 2 * k);
    if (g === -1) { o.hit(97); const k = cellOf[row]; if (k >= 0) { lit[k] = 1; litAt[k] = now; } }
    else { o.hit(89 + 2 * g); landed[g]++; }
  }
  function update(dt: number, now: number) {
    nLane = 0;
    for (let i = 0; i < np; i++) {
      const s = pst[i];
      if (s === 0) {                                                    // travelling the lane
        px[i] += pvx[i] * dt; py[i] = laneY + poff[i] + Math.sin(now * .005 + pwob[i]) * 1.6; nLane++;
        const g = pg[i];
        if (px[i] < GX[g]) continue;
        o.hit(88 + 2 * g);                                              // the test at this gate
        if (flow!.gates[prow[i]] === g) {                               // the program excluded this row here
          o.hit(89 + 2 * g);
          pst[i] = 1; px[i] = GX[g]; pvx[i] = (Math.random() - .5) * 60; pvy[i] = -50 - Math.random() * 90;
          pbx[i] = (Math.random() - .5) * (binW - 12);
          heat[g] = Math.min(1, heat[g] + .45);
          burst(GX[g], py[i], o.light ? 1 : PIPE_FX.sparkMin + ((Math.random() * PIPE_FX.sparkRange) | 0));
        } else {
          tg[tHead] = g; ty[tHead] = py[i]; tt[tHead] = now; tHead = (tHead + 1) % TMAX;
          if (g === 3) {                                                // included.append(row)
            o.hit(97);
            pst[i] = 2; psx[i] = px[i]; psy[i] = py[i]; pt0[i] = now;
            pvx[i] = prow[i] === special ? 900 : storm ? 520 : 680;     // flight time (ms)
          } else pg[i] = g + 1;
        }
      } else if (s === 1) {                                             // falling into the bin
        const g = pg[i];
        pvy[i] += 1500 * dt; py[i] += pvy[i] * dt; px[i] += (GX[g] + pbx[i] - px[i]) * Math.min(1, dt * 7);
        if (py[i] >= binBot - binH[g] - 2) { landed[g]++; binPulse[g] = 1; kill(i); i--; }
      } else {                                                          // flying into its cell of the included matrix
        const k = cellOf[prow[i]], t = (now - pt0[i]) / pvx[i];
        if (t >= 1 || k < 0) { if (k >= 0) { lit[k] = 1; litAt[k] = now; } kill(i); i--; continue; }
        const e = 1 - Math.pow(1 - t, 2.4);
        px[i] = psx[i] + (cellX(k) - psx[i]) * e; py[i] = psy[i] + (cellY(k) - psy[i]) * e - Math.sin(Math.PI * t) * 30;
      }
    }
    for (let j = 0; j < ns; j++) {
      sl[j] -= dt;
      if (sl[j] <= 0) { ns--; sx[j] = sx[ns]; sy[j] = sy[ns]; svx[j] = svx[ns]; svy[j] = svy[ns]; sl[j] = sl[ns]; sm[j] = sm[ns]; sc[j] = sc[ns]; j--; continue; }
      const d = 1 - 2.6 * dt; svx[j] *= d; svy[j] = svy[j] * d + 460 * dt; sx[j] += svx[j] * dt; sy[j] += svy[j] * dt;
    }
    binScale += (binTarget() - binScale) * Math.min(1, dt * 4);
    const kd = Math.exp(-dt * 5.5), kp = Math.exp(-dt * 4);
    for (let g = 0; g < 4; g++) { binH[g] += ((landed[g] / binScale) * binMaxH - binH[g]) * Math.min(1, dt * 10); heat[g] *= kd; binPulse[g] *= kp; }
    matPulse *= Math.exp(-dt * 2.2);
  }

  /* ---------- drawing: the base layer (cleared every frame) ---------- */
  function drawBase(now: number) {
    const g = gB;
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, W, H);
    g.fillStyle = laneGrad!; g.fillRect(0, laneY - 26, GX[3] + 70, 52);
    g.strokeStyle = rgba(FG, .1); g.lineWidth = 1; g.setLineDash([2, 6]);
    g.beginPath(); g.moveTo(0, laneY - 26.5); g.lineTo(GX[3] + 40, laneY - 26.5); g.moveTo(0, laneY + 26.5); g.lineTo(GX[3] + 40, laneY + 26.5); g.stroke();
    g.strokeStyle = rgba(RED, .2); g.beginPath();
    for (let k = 0; k < 4; k++) { g.moveTo(GX[k] + .5, gBot + 6); g.lineTo(GX[k] + .5, binBot - binMaxH - 30); }
    g.stroke(); g.setLineDash([]);
    g.textAlign = 'left'; g.font = `10.5px ${MONO}`; g.fillStyle = rgba(MUTE, 1); g.fillText(text.loop, 8, gTop - 8);   // above the gates, never across one
    for (let k = 0; k < 4; k++) drawGate(g, k, now);
    g.globalCompositeOperation = 'lighter'; g.fillStyle = rgba(FG, 1);               // the laser reads each passing row
    for (let j = 0; j < TMAX; j++) {
      const age = now - tt[j]; if (age > 170 || age < 0) continue;
      g.globalAlpha = .42 * (1 - age / 170); g.fillRect(GX[tg[j]] - 8, ty[j] - .5, 16, 1);
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    for (let k = 0; k < 4; k++) drawBin(g, k);
    drawMatrix(g, now);
    if (special !== null) for (let i = 0; i < np; i++) {                              // label the visitor's own answer
      if (prow[i] !== special) continue;
      g.strokeStyle = rgba(SOFT, .8); g.lineWidth = 1.2;
      g.beginPath(); g.arc(px[i], py[i], 9 + Math.sin(now * .012) * 1.5, 0, TAU); g.stroke();
      g.font = `600 12px ${BODY}`; g.fillStyle = rgba(FG, 1); g.textAlign = 'center'; g.fillText(text.you, px[i], py[i] - 16);
    }
  }
  function drawGate(g: CanvasRenderingContext2D, k: number, now: number) {
    const x = GX[k], h = heat[k], y0 = gTop, hh = gBot - gTop;
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = .5 + h * .5; g.drawImage(SPR.gate, x - 22 - h * 10, y0, 44 + h * 20, hh);
    if (h > .02) { g.globalAlpha = h * .32; g.drawImage(SPR.gate, x - 46, y0 - 6, 92, hh + 12); }      // exclusion flash ≤ .32
    g.globalAlpha = .6 + h * .4; g.fillStyle = rgba(SOFT, 1); g.fillRect(x - .75 - h * .8, y0, 1.5 + h * 1.6, hh);
    const p1 = (now * .00055 + k * .27) % 1, p2 = 1 - ((now * .00037 + k * .41) % 1);
    g.globalAlpha = .8; g.drawImage(SPR.shim, x - 2, y0 + p1 * hh - 20, 4, 40);
    g.globalAlpha = .45; g.drawImage(SPR.shim, x - 1.5, y0 + p2 * hh - 12, 3, 24);
    g.globalAlpha = .14 + h * .2; g.fillStyle = rgba(SOFT, 1);
    for (let j = 0; j < 7; j++) { const yy = y0 + ((j / 7 + now * .00022 + k * .05) % 1) * hh; g.fillRect(x - 7, yy, 14, 1); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.fillStyle = rgba(FG, .5); g.fillRect(x - 7, y0 - 4, 14, 3); g.fillRect(x - 7, gBot + 1, 14, 3);
    g.textAlign = 'center';
    g.font = `600 ${narrow ? 10.5 : 12.5}px ${BODY}`; g.fillStyle = rgba(FG, h > .3 ? 1 : .9);
    g.fillText(text.gates[k], x, narrow ? (k % 2 ? 32 : 18) : 24);
    if (!narrow) { g.font = `10.5px ${MONO}`; g.fillStyle = rgba(MUTE, 1); g.fillText(text.conds[k], x, 40); }
  }
  function drawBin(g: CanvasRenderingContext2D, k: number) {
    const x = GX[k], bw = binW, y = binBot - binH[k], p = binPulse[k];
    g.fillStyle = rgba(FG, .035); g.fillRect(x - bw / 2, binBot - binMaxH, bw, binMaxH);
    g.fillStyle = rgba(FG, .18); g.fillRect(x - bw / 2 - 4, binBot, bw + 8, 1);
    if (binH[k] > .5) { g.fillStyle = barGrad!; g.fillRect(x - bw / 2, y, bw, binH[k]); }
    g.globalAlpha = .45 + p * .5; g.fillStyle = rgba(SOFT, 1); g.fillRect(x - bw / 2, y - 1, bw, 2); g.globalAlpha = 1;
    if (p > .05) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = p * PIPE_FX.glow; g.drawImage(SPR.glow, x - bw / 2 - 6, y - 10, bw + 12, 20); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    const n = Math.round(landed[k]);
    g.textAlign = 'center'; g.font = `700 ${narrow ? 18 : 24}px ${DISP}`; g.fillStyle = rgba(FG, n ? 1 : .35);
    g.fillText(fmt(n), x, y - 8);
    if (!narrow) { g.font = `10.5px ${MONO}`; g.fillStyle = rgba(MUTE, 1); g.fillText(text.keys[k], x, binBot + 16); }
  }
  function drawMatrix(g: CanvasRenderingContext2D, now: number) {
    g.textAlign = 'left';
    g.font = `600 ${narrow ? 11 : 12.5}px ${BODY}`; g.fillStyle = rgba(FG, 1); g.fillText(text.included, mx0, narrow ? 18 : 24);
    if (!narrow) { g.font = `10.5px ${MONO}`; g.fillStyle = rgba(MUTE, 1); g.fillText(text.append, mx0, 40); }
    const a = mx0 - 7, b = my0 - 7, c = mx1 + 7, d = my1 + 5, L = 12;                   // corner brackets
    g.strokeStyle = rgba(matPulse > .02 ? SOFT : FG, 1); g.globalAlpha = .3 + matPulse * .6; g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(a, b + L); g.lineTo(a, b); g.lineTo(a + L, b); g.moveTo(c - L, b); g.lineTo(c, b); g.lineTo(c, b + L);
    g.moveTo(a, d - L); g.lineTo(a, d); g.lineTo(a + L, d); g.moveTo(c - L, d); g.lineTo(c, d); g.lineTo(c, d - L);
    g.stroke(); g.globalAlpha = 1;
    const cells = flow?.cells ?? [], n = Math.max(cells.length, 24), s = cellS, h2 = s / 2;
    g.beginPath();                                                                      // empty slots
    for (let k = 0; k < n; k++) if (!lit[k]) g.rect(cellX(k) - h2, cellY(k) - h2, s, s);
    g.fillStyle = rgba(FG, .07); g.fill();
    for (const u of [0, 1]) {                                                           // Q3 yes solid, no muted
      g.beginPath();
      for (let k = 0; k < cells.length; k++) if (lit[k] && flow!.used[cells[k]] === u) g.rect(cellX(k) - h2, cellY(k) - h2, s, s);
      g.fillStyle = u === 0 ? rgba(FG, .8) : rgba(MUTE, .5); g.fill();
    }
    g.beginPath();                                                                      // unsure: an outline
    for (let k = 0; k < cells.length; k++) if (lit[k] && flow!.used[cells[k]] === 2) g.rect(cellX(k) - h2 + .75, cellY(k) - h2 + .75, s - 1.5, s - 1.5);
    g.strokeStyle = rgba(FG, .75); g.lineWidth = 1.5; g.stroke();
    g.globalCompositeOperation = 'lighter';                                             // freshly lit cells glow and fade
    for (let k = 0; k < cells.length; k++) {
      if (!lit[k] || !litAt[k]) continue;
      const age = now - litAt[k]; if (age > 650 || age < 0) continue;
      g.globalAlpha = PIPE_FX.glow * (1 - age / 650); g.drawImage(SPR.glow, cellX(k) - s - 3, cellY(k) - s - 3, 2 * s + 6, 2 * s + 6);
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    if (special !== null && cellOf[special] >= 0 && lit[cellOf[special]]) {
      const k = cellOf[special]; g.strokeStyle = rgba(SOFT, 1); g.lineWidth = 1.5; g.strokeRect(cellX(k) - h2 - 2.5, cellY(k) - h2 - 2.5, s + 5, s + 5);
    }
    g.font = `10.5px ${MONO}`; let lw = g.measureText(text.q3).width;                   // legend: measured, kept inside the canvas
    g.font = `11px ${BODY}`; for (const t of text.legend) lw += 21 + g.measureText(t).width;
    let lx = Math.min(mx0, W - 6 - lw); const ly = my1 + 19;
    text.legend.forEach((t, u) => {
      if (u === 2) { g.strokeStyle = rgba(FG, .75); g.lineWidth = 1.2; g.strokeRect(lx + .6, ly - 7.4, 5.8, 5.8); }
      else { g.fillStyle = u === 0 ? rgba(FG, .8) : rgba(MUTE, .5); g.fillRect(lx, ly - 8, 7, 7); }
      g.fillStyle = rgba(MUTE, 1); g.fillText(t, lx + 11, ly); lx += 21 + g.measureText(t).width;
    });
    g.font = `10.5px ${MONO}`; g.fillStyle = rgba(MUTE, 1); g.fillText(text.q3, lx, ly);
  }

  /* ---------- drawing: the effects layer (translucent clear → trails; additive) ---------- */
  function drawFx(now: number) {
    const g = gF;
    g.globalCompositeOperation = 'destination-out'; g.globalAlpha = 1; g.fillStyle = o.light ? '#000' : 'rgba(0,0,0,.3)'; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = .55 * clamp(Math.sqrt(50 / Math.max(50, nLane)), .26, 1);          // a dense storm dims each particle
    for (let i = 0; i < np; i++) if (pst[i] !== 1) g.drawImage(SPR.dot, px[i] - 8, py[i] - 8);
    g.globalAlpha = .5;
    for (let i = 0; i < np; i++) if (pst[i] === 1) g.drawImage(SPR.red, px[i] - 6, py[i] - 6, 12, 12);
    if (special !== null) { g.globalAlpha = PIPE_FX.glow; for (let i = 0; i < np; i++) if (prow[i] === special) g.drawImage(SPR.big, px[i] - 22, py[i] - 22); }
    g.lineWidth = 1.3; g.lineCap = 'round';
    for (let j = 0; j < ns; j++) {
      g.globalAlpha = .6 * (sl[j] / sm[j]); g.strokeStyle = rgba(sc[j] ? SOFT : FG, 1);
      g.beginPath(); g.moveTo(sx[j], sy[j]); g.lineTo(sx[j] - svx[j] * .028, sy[j] - svy[j] * .028); g.stroke();
    }
    for (let k = rings.length - 1; k >= 0; k--) {
      const r = rings[k], t = (now - r.t0) / r.dur;
      if (t >= 1) { rings.splice(k, 1); continue; }
      g.globalAlpha = .35 * (1 - t); g.strokeStyle = rgba(r.col, 1); g.lineWidth = 1 + 5 * (1 - t);
      g.beginPath(); g.arc(r.x, r.y, r.r0 + (r.r1 - r.r0) * (1 - Math.pow(1 - t, 3)), 0, TAU); g.stroke();
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }

  /* ---------- shake (≤ 8 px, ≤ 400 ms) ---------- */
  let shT0 = 0, shDur = 0, shAmp = 0;
  const shake = (amp: number, dur: number) => { shT0 = performance.now(); shDur = Math.min(400, dur); shAmp = Math.min(8, amp); };
  function shakeStep(now: number) {
    if (!shDur) return;
    const t = (now - shT0) / shDur;
    if (t >= 1) { host.style.transform = ''; shDur = 0; return; }
    const a = shAmp * (1 - t) * (1 - t);
    host.style.transform = `translate(${((Math.random() * 2 - 1) * a).toFixed(1)}px,${((Math.random() * 2 - 1) * a * .6).toFixed(1)}px)`;
  }

  /* ---------- the frame loop: runs only while visible and motion is allowed ---------- */
  let raf = 0, last = 0, visible = false;
  function settle(now: number) {
    snap();
    const cx = (mx0 + mx1) / 2, cy = (my0 + my1) / 2, n = queue.length;
    if (n >= 200) { ring(cx, cy, 20, 250, 950, SOFT, now); ring(cx, cy, 10, 160, 700, FG, now); matPulse = 1; if (!o.light) shake(6, 340); }
    else if (n > 1) { ring(cx, cy, 10, 120, 700, SOFT, now); matPulse = .6; }
    finish(true);
  }
  let stillSince = 0;
  const cap = frameCap();
  function frame(now: number) {
    raf = 0;
    if (!visible || o.reduced) return;
    if (!cap(now)) { raf = requestAnimationFrame(frame); return; }      // at most about 60 frames a second
    if (!W) layout();
    if (W) {
      const dt = clamp((now - last) / 1000 || .016, .001, .033); last = now;
      emit(dt, now); update(dt, now); drawBase(now); drawFx(now); shakeStep(now);
      if (done && qi >= queue.length && np === 0) settle(now);
    }
    // Nothing in flight, no sparks, rings or shake: once the glows have faded, stop until the next replay.
    if (np || ns || rings.length || shDur || qi < queue.length || done) stillSince = now;
    else if (now - stillSince > PIPE_FX.idleAfter) { host.dataset.idle = 'true'; return; }
    raf = requestAnimationFrame(frame);
  }
  const run = () => { if (!raf && visible && !o.reduced) { host.dataset.idle = 'false'; last = performance.now(); stillSince = last; raf = requestAnimationFrame(frame); } };
  /** One static frame (reduced motion, off screen, or after a resize while idle). */
  function still() {
    if (!W) layout();
    if (!W) return;
    const now = performance.now();
    drawBase(now); gF.clearRect(0, 0, W, H);
  }

  new IntersectionObserver(es => {
    visible = es.some(e => e.isIntersecting);
    if (visible) run();
    else if (done) { np = 0; qi = queue.length; snap(); settleBins(); finish(true); }     // off screen: skip to the result
  }).observe(host);
  new ResizeObserver(() => { layout(); if (!raf) still(); }).observe(host);
  layout(); still();

  return {
    play(f, rows, opt) {
      finish(false);
      setFlow(f);
      np = 0; queue = rows.slice(); qi = 0; emitAcc = 0; storm = opt.storm; special = opt.special; runT0 = performance.now();
      if (o.reduced || !visible) { qi = queue.length; snap(); settleBins(); still(); return Promise.resolve(true); }
      const replayed = new Set(rows);
      for (let g = 0; g < 4; g++) landed[g] = f.excluded[g];
      for (const r of rows) if (f.gates[r] >= 0) landed[f.gates[r]]--;
      f.cells.forEach((row, k) => { lit[k] = replayed.has(row) ? 0 : 1; });
      if (storm) { ring(0, laneY, 6, 190, 800, SOFT, runT0); shake(4, 260); }
      run();
      return new Promise<boolean>(res => { done = res; });
    },
    show(f) {
      finish(false);
      setFlow(f);
      np = 0; queue = []; qi = 0; special = null;
      snap(); settleBins();
      if (!raf) still();
    },
  };
}
