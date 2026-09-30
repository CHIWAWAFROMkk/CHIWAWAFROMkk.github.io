import type { CircuitModel, Tone } from './career-wire';
import type { Lang } from '../i18n';

export interface Box { x: number; y: number; w: number; h: number }
export interface Trace { d: string; req: number; target: string | null; tone: Tone; vias: [number, number][]; mark: [number, number] | null; stub: boolean }
export interface Placed {
  mode: 'wide' | 'stack'; width: number; height: number;
  reqBoxes: Box[]; targetBoxes: { id: string; box: Box; group: number | null }[];
  traces: Trace[]; material: Box; materialTraces: { d: string; target: string }[];
}

const LEFT = 20, RIGHT = 718, COL = 262, TOP = 50, LANE_FROM = 330, LANE_TO = 670;

function orthogonal(y1: number, y2: number, xb: number): string {
  if (Math.abs(y1 - y2) < 1) return `M ${LEFT + COL} ${y1} H ${RIGHT}`;
  const r = 10, s = y2 > y1 ? 1 : -1;
  return `M ${LEFT + COL} ${y1} H ${xb - r} Q ${xb} ${y1} ${xb} ${y1 + s * r} V ${y2 - s * r} Q ${xb} ${y2} ${xb + r} ${y2} H ${RIGHT}`;
}

export function layoutWide(m: CircuitModel): Placed {
  const row = Math.max(m.reqs.length, m.targets.length) > 8 ? 70 : 96, h = row > 80 ? 60 : 50;
  const reqBoxes = m.reqs.map((_, i) => ({ x: LEFT, y: TOP + i * row, w: COL, h }));
  const targetBoxes = m.targets.map((t, j) => ({ id: t.id, box: { x: RIGHT, y: TOP + row / 2 + j * row, w: COL, h }, group: null }));
  const gap = m.wires.length > 1 ? Math.min(46, (LANE_TO - LANE_FROM) / (m.wires.length - 1)) : 0;
  const traces: Trace[] = m.wires.map((w, k) => {
    const a = reqBoxes[w.req], y1 = a.y + h / 2, xb = LANE_FROM + k * gap;
    const b = w.target ? targetBoxes.find(t => t.id === w.target)?.box : undefined;
    if (!b) return { d: `M ${LEFT + COL} ${y1} H ${xb}`, req: w.req, target: null, tone: w.tone, vias: [], mark: [xb, y1], stub: true };
    const y2 = b.y + h / 2, straight = Math.abs(y1 - y2) < 1;
    return {
      d: orthogonal(y1, y2, xb), req: w.req, target: w.target, tone: w.tone, stub: false,
      vias: straight ? [] : [[xb, y1], [xb, y2]],
      mark: w.tone === 'ok' ? null : straight ? [(LEFT + COL + RIGHT) / 2, y1] : [xb, (y1 + y2) / 2],
    };
  });
  const last = targetBoxes.at(-1)?.box;
  const material = { x: RIGHT, y: (last ? last.y + last.h : TOP) + 24, w: COL, h: 46 };
  const materialTraces = m.materials.map((id, k) => {
    const b = targetBoxes.find(t => t.id === id)!.box, x = RIGHT + COL + 6 + (k % 3) * 5;
    return { d: `M ${RIGHT + COL} ${b.y + h / 2} H ${x} V ${material.y + material.h / 2} H ${RIGHT + COL}`, target: id };
  });
  const bottom = Math.max(reqBoxes.length ? reqBoxes[reqBoxes.length - 1].y + h : 0, material.y + material.h);
  return { mode: 'wide', width: 1000, height: bottom + 24, reqBoxes, targetBoxes, traces, material, materialTraces };
}

export function layoutStack(m: CircuitModel, width: number): Placed {
  const h = 54, indent = 28, spine = 14;
  let y = 8;
  const reqBoxes: Box[] = [], targetBoxes: Placed['targetBoxes'] = [], traces: Trace[] = [];
  m.reqs.forEach((_, i) => {
    const a = { x: 0, y, w: width, h };
    reqBoxes.push(a); y += h + 10;
    for (const w of m.wires.filter(x => x.req === i)) {
      if (!w.target) {
        traces.push({ d: `M ${spine} ${a.y + h} V ${y + 12}`, req: i, target: null, tone: w.tone, vias: [], mark: [spine, y + 12], stub: true });
        y += 28; continue;
      }
      const b = { x: indent, y, w: width - indent, h }, cy = b.y + h / 2;
      targetBoxes.push({ id: w.target, box: b, group: i });
      traces.push({ d: `M ${spine} ${a.y + h} V ${cy} H ${indent}`, req: i, target: w.target, tone: w.tone, vias: [[spine, cy]], mark: w.tone === 'ok' ? null : [spine, (a.y + h + cy) / 2], stub: false });
      y += h + 10;
    }
    y += 14;
  });
  const material = { x: 0, y, w: width, h: 46 };
  return { mode: 'stack', width, height: y + 46 + 8, reqBoxes, targetBoxes, traces, material, materialTraces: [] };
}

/* ---------------- rendering ---------------- */

export interface CircuitView {
  render(m: CircuitModel, o: { draw: boolean; hideReqs: boolean }): Promise<void>;
  reveal(req: number): void;
  reqRect(req: number): DOMRect | null;
  charge(target: string): Promise<void>;
  flowMaterials(): Promise<void>;
  burst(): void;
  destroy(): void;
}

const NS = 'http://www.w3.org/2000/svg';
const MARK: Record<Tone, string> = { ok: '', fail: '×', gap: '×', unknown: '?', none: '∅' };
const TEXT = { zh: { reqs: 'JD 要求 · structure_job_locally()', facts: '候选人 · profile', material: '材料草稿', pack: 'build_application_pack()' },
  en: { reqs: 'JD requirements · structure_job_locally()', facts: 'Candidate · profile', material: 'Draft materials', pack: 'build_application_pack()' } };

interface Sampled { pts: Float32Array; len: number; tone: Tone; u: Float32Array; v: Float32Array; surge: number; material: boolean }

export function createCircuit(host: HTMLElement, lang: Lang): CircuitView {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('aria-hidden', 'true');                 // empty until the first render gives it a name
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  host.append(svg, canvas);
  const g2 = canvas.getContext('2d')!;
  const css = getComputedStyle(host);
  const color = (name: string, a: number) => {
    const hex = css.getPropertyValue(name).trim().replace('#', '');
    const n = parseInt(hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex, 16);
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
  };
  let placed: Placed | null = null, model: CircuitModel | null = null;
  let sampled: Sampled[] = [], sparks: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
  let arcs: [number, number][][] = [], arcAt = 0, sparkAt = 0, raf = 0, last = 0, visible = false, run = 0;
  const reqEls: SVGGElement[] = [], targetEls = new Map<string, SVGGElement>();
  let materialLayer: SVGGElement | null = null, materialBox: SVGGElement | null = null;

  const mk = <K extends keyof SVGElementTagNameMap>(tag: K, a: Record<string, string | number>, parent: Element) => {
    const e = document.createElementNS(NS, tag) as SVGElementTagNameMap[K];
    for (const k in a) e.setAttribute(k, String(a[k]));
    parent.append(e); return e;
  };
  const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
  function box(parent: Element, b: Box, label: string, sub: string, cls: string) {
    const g = mk('g', { class: `cnode ${cls}`, transform: `translate(${b.x},${b.y})` }, parent);
    mk('rect', { class: 'cbox', width: b.w, height: b.h, rx: 2 }, g);
    const chars = Math.floor((b.w - 28) / 15);
    const t = mk('text', { x: 14, y: b.h > 50 ? 25 : 21, class: 'cnt' }, g); t.textContent = clip(label, chars);
    mk('title', {}, g).textContent = `${label} — ${sub}`;
    const s = mk('text', { x: 14, y: b.h > 50 ? 45 : 39, class: 'cns' }, g); s.textContent = clip(sub, Math.floor((b.w - 28) / 7.4));
    return g;
  }
  function sample(p: SVGPathElement, tone: Tone, material: boolean): Sampled {
    const len = p.getTotalLength(), pts: number[] = [];
    for (let d = 0; d <= len; d += 3) { const q = p.getPointAtLength(d); pts.push(q.x, q.y); }
    const n = tone === 'ok' ? 12 : tone === 'unknown' ? 2 : 0, u = new Float32Array(n), v = new Float32Array(n);
    for (let k = 0; k < n; k++) { u[k] = Math.random(); v[k] = tone === 'ok' ? 110 + Math.random() * 110 : 38; }
    return { pts: new Float32Array(pts), len, tone, u, v, surge: 0, material };
  }
  const at = (s: Sampled, u: number): [number, number] => {
    const n = s.pts.length / 2, i = Math.max(0, Math.min(n - 1, Math.round(u * (n - 1))));
    return [s.pts[2 * i], s.pts[2 * i + 1]];
  };
  function drawIn(p: SVGPathElement, delay: number) {
    const len = p.getTotalLength();
    p.style.strokeDasharray = String(len); p.style.strokeDashoffset = String(len);
    return p.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 460, delay, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }).finished
      .then(() => { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; p.getAnimations().forEach(a => a.cancel()); });
  }
  function burstAt(x: number, y: number, n: number) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, s = 80 + Math.random() * 180;
      sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 100, life: .35 + Math.random() * .4 });
    }
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    if (!visible || !placed) return;
    const rect = svg.getBoundingClientRect(), dpr = devicePixelRatio || 1, cw = Math.round(rect.width), ch = Math.round(rect.height);
    if (!cw) return;
    if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) { canvas.width = cw * dpr; canvas.height = ch * dpr; canvas.style.width = `${cw}px`; canvas.style.height = `${ch}px`; }
    const s = cw / placed.width;
    g2.setTransform(dpr * s, 0, 0, dpr * s, 0, 0);
    g2.clearRect(0, 0, placed.width, placed.height);
    g2.globalCompositeOperation = 'lighter';
    for (const tr of sampled) {
      if (tr.tone === 'gap') {
        if (Math.random() < .05) {
          const u0 = Math.random() * .8; g2.strokeStyle = color('--red', .35); g2.lineWidth = 3; g2.beginPath();
          for (let u = u0; u < u0 + .12; u += .02) { const [x, y] = at(tr, u); u === u0 ? g2.moveTo(x, y) : g2.lineTo(x, y); }
          g2.stroke();
        }
        continue;
      }
      const boost = tr.surge && now - tr.surge < 1300 ? 3.2 : 1, dim = tr.tone === 'unknown';
      for (let k = 0; k < tr.u.length; k++) {
        tr.u[k] = (tr.u[k] + tr.v[k] * boost * dt / tr.len) % 1;
        const [hx, hy] = at(tr, tr.u[k]);
        g2.fillStyle = color(dim ? '--night-mute' : boost > 1 ? '--red' : '--night-fg', dim ? .06 : boost > 1 ? .16 : .1);
        g2.beginPath(); g2.arc(hx, hy, 6.5, 0, 6.3); g2.fill();
        for (let j = 0; j < 7; j++) {
          const u = tr.u[k] - j * 6 / tr.len; if (u < 0) break;
          const [x, y] = at(tr, u);
          g2.fillStyle = color(dim ? '--night-mute' : '--night-fg', (dim ? .3 : boost > 1 ? .6 : .55) * (1 - j / 7));
          g2.beginPath(); g2.arc(x, y, 2.7 - j * .28, 0, 6.3); g2.fill();
        }
      }
    }
    const fails = sampled.filter(t => t.tone === 'fail');
    if (fails.length) {
      if (now - arcAt > 60) {
        arcAt = now; arcs = [];
        for (const f of fails) for (let a = 0; a < 2; a++) {
          const c = .5 + (Math.random() - .5) * .3, [x1, y1] = at(f, Math.max(0, c - .07)), [x2, y2] = at(f, Math.min(1, c + .07));
          const pts: [number, number][] = [[x1, y1]], nx = -(y2 - y1), ny = x2 - x1, nl = Math.hypot(nx, ny) || 1;
          for (let k = 1; k < 10; k++) { const t = k / 10, j = (Math.random() - .5) * 18; pts.push([x1 + (x2 - x1) * t + nx / nl * j, y1 + (y2 - y1) * t + ny / nl * j]); }
          pts.push([x2, y2]); arcs.push(pts);
        }
      }
      for (const pts of arcs) for (const [w, c] of [[2.4, color('--red', .5)], [.9, color('--night-fg', .4)]] as [number, string][]) {
        g2.strokeStyle = c; g2.lineWidth = w; g2.beginPath();
        pts.forEach(([x, y], k) => (k ? g2.lineTo(x, y) : g2.moveTo(x, y))); g2.stroke();
      }
      if (now - sparkAt > 480) { sparkAt = now; for (const f of fails) { const [x, y] = at(f, .5); burstAt(x, y, 6); } }
    }
    for (let k = sparks.length - 1; k >= 0; k--) {
      const p = sparks[k]; p.vy += 420 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0) { sparks.splice(k, 1); continue; }
      g2.strokeStyle = color('--red', Math.min(.7, p.life)); g2.lineWidth = 1.3;
      g2.beginPath(); g2.moveTo(p.x, p.y); g2.lineTo(p.x - p.vx * .025, p.y - p.vy * .025); g2.stroke();
    }
    g2.globalCompositeOperation = 'source-over';
  }
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(host);
  if (!reduced) raf = requestAnimationFrame(frame);

  return {
    async render(m, o) {
      const id = ++run;
      model = m;
      placed = host.clientWidth >= 720 ? layoutWide(m) : layoutStack(m, Math.max(280, host.clientWidth));
      svg.replaceChildren(); sampled = []; sparks = []; reqEls.length = 0; targetEls.clear();
      svg.setAttribute('viewBox', `0 0 ${placed.width} ${placed.height}`);
      svg.removeAttribute('aria-hidden');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', m.reqs.map((q, i) => `${q.label}: ${q.sub}`).join('；'));
      if (placed.mode === 'wide') {
        mk('text', { x: LEFT, y: 30, class: 'chd' }, svg).textContent = TEXT[lang].reqs;
        mk('text', { x: RIGHT, y: 30, class: 'chd' }, svg).textContent = TEXT[lang].facts;
      }
      const traceLayer = mk('g', {}, svg);
      materialLayer = mk('g', {}, svg);
      placed.reqBoxes.forEach((b, i) => reqEls.push(box(svg, b, m.reqs[i].label, m.reqs[i].sub, `tone-${m.reqs[i].tone}${o.hideReqs ? ' hide' : ''}`)));
      for (const t of placed.targetBoxes) {
        const n = m.targets.find(x => x.id === t.id)!;
        const g = box(svg, t.box, n.label, n.sub, `tone-${n.tone}`);
        if (!targetEls.has(t.id)) targetEls.set(t.id, g);
      }
      materialBox = box(svg, placed.material, TEXT[lang].material, m.packError ?? TEXT[lang].pack, m.packError ? 'tone-fail' : 'tone-none');
      const paths = placed.traces.map((t, k) => {
        const p = mk('path', { d: t.d, class: `ctr tone-${t.tone}` }, traceLayer);
        return { p, t, delay: 320 + k * 110 };
      });
      await Promise.all(paths.map(async ({ p, t, delay }) => {
        if (o.draw && !reduced) await drawIn(p, delay);
        if (id !== run) return;
        for (const [x, y] of t.vias) mk('circle', { cx: x, cy: y, r: 3.5, class: 'cvia' }, traceLayer);
        if (t.mark && MARK[t.tone]) mk('text', { x: t.mark[0] - 5, y: t.mark[1] + 5, class: 'cmark' }, traceLayer).textContent = MARK[t.tone];
        sampled.push(sample(p, t.tone, false));
        if (t.tone === 'fail' && t.mark) burstAt(t.mark[0], t.mark[1], 24);
      }));
    },
    reveal(req) { const g = reqEls[req]; if (!g) return; g.classList.remove('hide'); g.classList.add('flash'); },
    reqRect(req) { return reqEls[req]?.getBoundingClientRect() ?? null; },
    async charge(target) {
      const g = targetEls.get(target); if (!g || reduced) return;
      const rect = g.querySelector('rect')!;
      const c = mk('rect', { class: 'ccharge', width: rect.getAttribute('width')!, height: rect.getAttribute('height')! }, g);
      await c.animate([{ transform: 'scaleX(0)', opacity: 1 }, { transform: 'scaleX(1)', opacity: 1, offset: .8 }, { transform: 'scaleX(1)', opacity: 0 }],
        { duration: 680, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).finished;
      c.remove();
    },
    async flowMaterials() {
      if (!placed || !model || !materialLayer) return;
      const id = run;
      await Promise.all(placed.materialTraces.map(async (t, k) => {
        const p = mk('path', { d: t.d, class: 'ctr tone-ok' }, materialLayer!);
        if (!reduced) await drawIn(p, k * 160);
        if (id !== run) return;
        const s = sample(p, 'ok', true); s.surge = performance.now(); sampled.push(s);
      }));
      if (id === run) materialBox?.classList.add(model.packError ? 'tone-fail' : 'tone-ok', 'flash');
    },
    burst() { for (const t of placed?.traces ?? []) if (t.tone === 'fail' && t.mark) burstAt(t.mark[0], t.mark[1], 40); },
    destroy() { cancelAnimationFrame(raf); io.disconnect(); svg.remove(); canvas.remove(); },
  };
}
