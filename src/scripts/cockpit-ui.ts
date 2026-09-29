import { QUERIES, params } from './insights-queries.mjs';
import { heatmap, pareto, paretoCurve, delivery, waffle, interpolate, type Layout, type Mark, type Key, type Rows } from './morph';
import { paint } from './morph-dom';
import { spinOdometer, setOdometerText } from './odometer-dom';
import { merchantLegend, reasonLegend } from './insights-names';
import { COCKPIT_TEXT, KPI_IDS, kpiText, type KpiId } from './cockpit-text';
import type { Results } from './insights-facts';

type ChartId = 'heatmap' | 'merchants' | 'delivery' | 'reasons';
const CHARTS: ChartId[] = ['heatmap', 'merchants', 'delivery', 'reasons'];
const LAYOUT: Record<ChartId, (v: Rows) => Layout> = { heatmap, merchants: pareto, delivery, reasons: waffle };
const RUN = ['kpi', ...CHARTS] as const;
/** SQLite plus the term database is about 2 MB; a slow mainland connection needs well over 20 s, so only give up after a minute. */
const LOAD_TIMEOUT = 60_000;
interface Reply { id: number; ok: boolean; error?: string; results?: Results }
interface Chart { rects: SVGRectElement[]; shown: Mark[]; keys: Key[]; token: number; fig: HTMLElement }

/** The live dashboard: server-rendered for the whole term, then re-queried in a worker as filters change.
 *  The engine loads when the dashboard is a quarter into view or a control gets focus. */
export function initCockpit(root: HTMLElement, initial: Results): void {
  const lang = root.dataset.lang === 'en' ? 'en' : 'zh';
  const T = COCKPIT_TEXT[lang];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = <E extends Element>(sel: string) => root.querySelector<E>(sel)!;
  const form = $<HTMLFormElement>('#ck-form');
  const status = $<HTMLElement>('#ck-status');
  const from = $<HTMLInputElement>('#ck-from');
  const to = $<HTMLInputElement>('#ck-to');
  const controls = [...form.querySelectorAll<HTMLInputElement | HTMLButtonElement>('input, button')];
  const charts = new Map<ChartId, Chart>();
  for (const id of CHARTS) {
    const fig = $<HTMLElement>(`[data-chart="${id}"]`);
    const layout = LAYOUT[id](initial[id].values);
    charts.set(id, { rects: [...fig.querySelectorAll<SVGRectElement>('rect[data-m]')], shown: layout.marks, keys: layout.keys, token: 0, fig });
  }
  const kpiShown = new Map<KpiId, number | null>(KPI_IDS.map((k, i) => [k, initial.kpi.values[0][i] as number | null]));

  let worker: Worker | null = null;
  let seq = 0, booted = false, ready = false, failed = false, running = false, queued = false, timer = 0;

  const say = (text: string, error = false) => { status.textContent = text; status.dataset.error = String(error); };
  const enable = (on: boolean) => controls.forEach(c => (c.disabled = !on));
  const halt = (text: string) => { failed = true; ready = false; enable(false); say(text, true); worker?.terminate(); };

  const call = (msg: Record<string, unknown>, ms: number, failText: string) => new Promise<Reply>((resolve, reject) => {
    const id = ++seq;
    const t = window.setTimeout(() => reject(Error(failText)), ms);
    worker!.onmessage = ({ data }: MessageEvent<Reply>) => {
      if (data.id !== id) return;
      clearTimeout(t);
      if (data.ok) resolve(data);
      else { console.error(data.error); reject(Error(failText)); }
    };
    worker!.postMessage({ id, ...msg });
  });

  const filter = () => ({
    from: Number(from.value),
    to: Number(to.value),
    merchants: [...form.querySelectorAll<HTMLInputElement>('input[name="merchant"]:checked')].map(i => Number(i.value)),
    areas: [...form.querySelectorAll<HTMLInputElement>('input[name="area"]:checked')].map(i => i.value),
  });

  const sync = () => {
    $<HTMLOutputElement>('#ck-from-out').value = from.value;
    $<HTMLOutputElement>('#ck-to-out').value = to.value;
  };

  function draw(id: ChartId, values: Rows) {
    const c = charts.get(id)!;
    const next = LAYOUT[id](values);
    const start = c.shown;
    const token = ++c.token;
    c.keys = next.keys;
    const legend = id === 'merchants' ? merchantLegend(values, lang) : id === 'reasons' ? reasonLegend(values, lang) : null;
    if (legend) c.fig.querySelectorAll<SVGTextElement>('[data-legend]').forEach((t, i) => (t.textContent = legend[i] ?? ''));
    if (id === 'merchants') c.fig.querySelector('polyline[data-curve]')?.setAttribute('points', paretoCurve(values));
    fillTable(c.fig.querySelector('table[data-table]')!, values, id);
    if (reduced) { c.shown = next.marks; return paint(c.rects, next.marks); }
    const t0 = performance.now();
    const step = (now: number) => {
      if (token !== c.token) return; // a newer result took over
      const k = Math.min(1, (now - t0) / 400);
      c.shown = interpolate(start, next.marks, 1 - (1 - k) ** 3);
      paint(c.rects, c.shown);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function fillTable(table: HTMLTableElement, values: Rows, id: ChartId) {
    const cols = initial[id].columns;
    const head = document.createElement('thead');
    const hr = document.createElement('tr');
    cols.forEach(c => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = c; hr.append(th); });
    head.append(hr);
    const body = document.createElement('tbody');
    values.slice(0, 50).forEach(r => {
      const tr = document.createElement('tr');
      r.forEach(v => { const td = document.createElement('td'); td.textContent = String(v); tr.append(td); });
      body.append(tr);
    });
    table.replaceChildren(head, body);
  }

  function setKpi(k: KpiId, v: number | null) {
    const el = $<HTMLElement>(`[data-kpi="${k}"]`);
    const was = kpiShown.get(k) ?? null;
    kpiShown.set(k, v);
    const text = kpiText(k, v, lang);
    if (reduced || v === null || was === null || was === v) { setOdometerText(el, text); return; }
    spinOdometer(el, text, 0, kpiText(k, was, lang));
  }


  async function run() {
    if (!ready || failed) return;
    if (running) { queued = true; return; }
    running = true;
    say(T.running);
    try {
      const reply = await call({ action: 'run', queries: RUN.map(id => ({ id, sql: QUERIES[id] })), params: params(filter()) }, 5000, T.runFailed);
      const res = reply.results!;
      KPI_IDS.forEach((k, i) => setKpi(k, res.kpi.values[0][i] as number | null));
      CHARTS.forEach(id => draw(id, res[id].values));
      say(res.kpi.values[0][0] ? T.ready : T.empty);
    } catch (e) {
      halt((e as Error).message);
    } finally {
      running = false;
    }
    if (queued && !failed) { queued = false; run(); }
  }

  const schedule = () => { clearTimeout(timer); timer = window.setTimeout(run, 120); };

  const boot = () => {
    if (booted) return;
    booted = true;
    say(T.loading);
    try { worker = new Worker('/assets/insights-worker.js'); } catch (e) { console.error(e); return halt(T.loadFailed); }
    worker.onerror = e => { e.preventDefault(); halt(T.loadFailed); };
    call({ action: 'init' }, LOAD_TIMEOUT, T.loadFailed)
      .then(() => { if (failed) return; ready = true; enable(true); say(T.ready); })
      .catch(e => { if (!failed) halt((e as Error).message); });
  };

  from.addEventListener('input', () => { if (+from.value > +to.value) to.value = from.value; sync(); schedule(); });
  to.addEventListener('input', () => { if (+to.value < +from.value) from.value = to.value; sync(); schedule(); });
  form.addEventListener('change', e => { if ((e.target as HTMLInputElement).type === 'checkbox') schedule(); });
  form.addEventListener('reset', () => setTimeout(() => { sync(); schedule(); }));
  form.addEventListener('submit', e => e.preventDefault());
  for (const id of ['merchants', 'delivery'] as const) {
    const c = charts.get(id)!;
    c.rects.forEach((rect, i) => rect.addEventListener('click', () => {
      const key = c.keys[i];
      if (key === null || !ready) return;
      const box = form.querySelector<HTMLInputElement>(`input[name="${id === 'merchants' ? 'merchant' : 'area'}"][value="${key}"]`);
      if (box) { box.checked = !box.checked; schedule(); }
    }));
  }

  enable(false);
  say(T.idle);
  new IntersectionObserver((entries, io) => { if (entries.some(e => e.isIntersecting)) { io.disconnect(); boot(); } }, { rootMargin: '0px 0px -25% 0px' }).observe(root);
  root.addEventListener('focusin', boot, { once: true });
}
