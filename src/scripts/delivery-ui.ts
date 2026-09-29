import { DELIVERY_QUERIES } from './delivery-queries';
import { DELIVERY_TEXT } from './delivery-text';
import { DELIVERY_ERRORS, localizeError } from './tool-i18n';
import { playBand, failedStep } from './txn-band';

interface Dish { id: number; name: string; merchant: string; price_cents: number; stock: number }
interface Order { id: number; student: string; merchant: string; status: 'paid' | 'delivered' | 'refunded'; total_cents: number }
interface State { dishes: Dish[]; orders: Order[] }
interface Result { columns?: string[]; values?: unknown[][]; truncated?: boolean }
interface Reply { id: number; ok: boolean; error?: string; result: Result[]; state: State; order?: number; backup?: Uint8Array | null }
interface Pending { id: number; action: string; resolve: (r: Reply) => void; reject: (e: Error) => void; timer: number }

const yuan = (cents: number) => (cents / 100).toFixed(2);

/** Port of the original delivery.mjs: bilingual, and the SQL engine loads only when the demo comes into view or is touched. */
export function initDelivery(root: HTMLElement): void {
  const lang = root.dataset.lang === 'en' ? 'en' : 'zh';
  const T = DELIVERY_TEXT[lang];
  const queries = DELIVERY_QUERIES[lang];
  const tr = (m: string) => localizeError(m, lang, DELIVERY_ERRORS);
  const $ = <E extends HTMLElement = HTMLElement>(id: string) => root.querySelector<E>(`#${id}`)!;
  const button = (id: string) => $<HTMLButtonElement>(id);
  const controls = ['run-query', 'place-order', 'reset-db', 'download-db'];
  const placeBand = root.querySelector<HTMLElement>('[data-band="place"]');
  const refundBand = root.querySelector<HTMLElement>('[data-band="refund"]');
  /** Errors that mean the operation was never attempted: nothing to replay. */
  const notAttempted = (msg: string) => msg === T.busy || msg === T.loadFailed;
  let worker: Worker | null = null;
  let sequence = 0;
  let pending: Pending | null = null;
  let backup: Uint8Array | null = null;
  let state: State | null = null;
  let exportRows: unknown[][] = [];
  let booted = false;
  /** Set once the engine could not load; from then on every action is refused and the controls stay disabled. */
  let failed = false;

  const message = (text: string, error = false) => { const s = $('sql-status'); s.textContent = text; s.dataset.error = String(error); };
  const busy = (value: boolean) => {
    controls.forEach(id => (button(id).disabled = value));
    root.querySelectorAll<HTMLButtonElement>('[data-refund]').forEach(b => (b.disabled = value));
    button('cancel-query').disabled = !value;
  };
  const halt = (text: string) => { failed = true; busy(true); button('cancel-query').disabled = true; message(text, true); };

  const start = () => {
    worker = new Worker('/assets/delivery-worker.js');
    worker.onmessage = ({ data }: MessageEvent<Reply>) => {
      if (!pending || data.id !== pending.id) return;
      clearTimeout(pending.timer);
      const { resolve, reject } = pending;
      pending = null;
      busy(false);
      if (data.ok) { if (data.backup) backup = data.backup; state = data.state; renderState(); resolve(data); }
      else reject(Error(tr(data.error ?? '')));
    };
    // Handled here (status message + controls disabled); stop it from surfacing as an uncaught page error.
    worker.onerror = e => { e.preventDefault(); abort(T.engineError); };
  };

  const request = (action: string, extra: Record<string, unknown> = {}): Promise<Reply> => {
    if (failed) return Promise.reject(Error(T.loadFailed));
    if (pending) return Promise.reject(Error(T.busy));
    busy(true);
    return new Promise((resolve, reject) => {
      const id = ++sequence;
      pending = { id, action, resolve, reject, timer: window.setTimeout(() => abort(action === 'init' ? T.loadTimeout : T.runTimeout), action === 'init' ? 20000 : 3000) };
      worker!.postMessage({ id, action, ...extra });
    });
  };

  function abort(text: string) {
    if (!pending) return;
    const task = pending;
    clearTimeout(task.timer);
    pending = null;
    worker?.terminate();
    task.reject(Error(text));
    // A failed first load has no committed data to fall back on: say plainly that the engine did not arrive.
    if (task.action === 'init') return halt(text === T.loadTimeout ? text : T.loadFailed);
    start();
    request('init', { backup }).then(() => message(text, true)).catch(e => halt((e as Error).message + T.reload));
  }

  const download = (data: BlobPart, name: string, type: string) => {
    const url = URL.createObjectURL(new Blob([data], { type }));
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  function renderState() {
    if (!state) return;
    const dish = $<HTMLSelectElement>('dish');
    const selected = dish.value;
    dish.replaceChildren(...state.dishes.map(d => new Option(T.dishOption(d.merchant, d.name, yuan(d.price_cents), d.stock), String(d.id))));
    if (selected) dish.value = selected;
    $('order-list').replaceChildren(...state.orders.map(o => {
      const row = document.createElement('div'); row.className = 'order-row';
      const p = document.createElement('p'); p.textContent = T.orderLine(o.id, o.merchant, yuan(o.total_cents));
      const small = document.createElement('small'); small.className = `status-${o.status}`; small.textContent = `${o.student} · ${T.status[o.status]}`;
      p.append(small); row.append(p);
      if (o.status === 'paid') {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'secondary'; b.textContent = T.refundButton;
        b.dataset.refund = String(o.id); b.onclick = () => refundOrder(o.id); row.append(b);
      }
      return row;
    }));
    total();
  }

  function total() {
    const d = state?.dishes.find(x => x.id === Number($<HTMLSelectElement>('dish').value));
    const q = Number($<HTMLInputElement>('quantity').value);
    $('order-total').textContent = d && Number.isInteger(q) && q > 0 && q <= 20 ? T.total(yuan(d.price_cents * q)) : T.totalInvalid;
  }

  function table(results: Result[]) {
    const out = $('sql-results'); out.replaceChildren(); exportRows = []; let count = 0;
    for (const r of results) {
      if (r.truncated || !r.columns || !r.values) continue;
      if (!exportRows.length) exportRows = [r.columns, ...r.values];
      const t = document.createElement('table'); const head = document.createElement('thead'); const hr = document.createElement('tr');
      r.columns.forEach(c => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = c; hr.append(th); });
      head.append(hr); t.append(head);
      const body = document.createElement('tbody');
      r.values.forEach(v => { const row = document.createElement('tr'); v.forEach(x => { const td = document.createElement('td'); td.textContent = x === null ? 'NULL' : String(x); row.append(td); }); body.append(row); });
      t.append(body); out.append(t); count += r.values.length;
    }
    button('export-csv').disabled = !exportRows.length;
    return count;
  }

  async function run() {
    const started = performance.now();
    message(T.running); button('export-csv').disabled = true;
    try {
      const data = await request('query', { sql: $<HTMLTextAreaElement>('sql-input').value });
      const n = table(data.result);
      message(T.rows(n, Math.round(performance.now() - started), data.result.some(x => x.truncated)));
    } catch (e) { $('sql-results').replaceChildren(); exportRows = []; message((e as Error).message, true); }
  }

  async function refundOrder(id: number) {
    try {
      await request('refund', { order: id });
      if (refundBand) playBand(refundBand, 'refund', undefined, lang);
      $('order-status').textContent = T.refunded(id);
      await run();
    } catch (e) {
      const msg = (e as Error).message;
      if (refundBand && !notAttempted(msg)) playBand(refundBand, 'refund', failedStep('refund', msg), lang);
      $('order-status').textContent = msg;
    }
  }


  const boot = () => {
    if (booted) return;
    booted = true;
    message(T.loading);
    start();
    request('init').then(run).catch(e => {
      if (failed) return; // already reported by abort()
      console.error(e); // technical detail for the console; visitors get a readable sentence
      halt(T.loadFailed);
    });
  };

  // Static wiring works before the engine loads.
  const preset = $<HTMLSelectElement>('query-preset');
  queries.forEach((q, i) => preset.add(new Option(q.name, String(i))));
  const showPreset = () => { const q = queries[Number(preset.value)]; $<HTMLTextAreaElement>('sql-input').value = q.sql; $('query-note').textContent = q.note; };
  preset.onchange = showPreset; showPreset();
  const student = $<HTMLSelectElement>('student');
  for (let i = 1; i <= 12; i++) student.add(new Option(T.student(String(i).padStart(2, '0')), String(i)));
  message(T.idle);
  busy(true); button('cancel-query').disabled = true;

  button('run-query').onclick = run;
  button('cancel-query').onclick = () => abort(T.stopped);
  $<HTMLTextAreaElement>('sql-input').onkeydown = e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); if (!pending) run(); } };
  $<HTMLSelectElement>('dish').onchange = total;
  $<HTMLInputElement>('quantity').oninput = total;
  $<HTMLFormElement>('order-form').onsubmit = async e => {
    e.preventDefault();
    try {
      const data = await request('place', { input: { student: Number(student.value), dish: Number($<HTMLSelectElement>('dish').value), quantity: Number($<HTMLInputElement>('quantity').value) } });
      if (placeBand) playBand(placeBand, 'place', undefined, lang);
      $('order-status').textContent = T.placed(data.order!); await run();
    } catch (err) {
      const msg = (err as Error).message;
      if (placeBand && !notAttempted(msg)) playBand(placeBand, 'place', failedStep('place', msg), lang);
      $('order-status').textContent = T.placeFailed(msg);
    }
  };

  button('reset-db').onclick = async () => { try { await request('init'); $('order-status').textContent = T.reset; await run(); } catch (e) { message((e as Error).message, true); } };
  button('download-db').onclick = () => { if (backup) download(backup as BlobPart, 'campus-delivery.sqlite', 'application/vnd.sqlite3'); };
  button('export-csv').onclick = () => download('﻿' + exportRows.map(row => row.map(v => '"' + String(v ?? '').replace(/^[=+@-]/, "'$&").replaceAll('"', '""') + '"').join(',')).join('\r\n'), 'query-result.csv', 'text/csv;charset=utf-8');
  root.querySelectorAll<HTMLButtonElement>('[data-jump]').forEach(b => b.addEventListener('click', () => {
    preset.value = b.dataset.jump ?? '0'; showPreset();
    root.querySelector('#workbench')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    boot();
  }));
  fetch('/assets/delivery-schema.sql').then(r => { if (!r.ok) throw Error(); return r.text(); })
    .then(t => { $('schema-source').textContent = t; }).catch(() => { $('schema-source').textContent = T.noSqlFile; });

  // Observe the whole demo (workbench, analysis, order form) so jumping straight to the order form still boots the engine.
  // The bottom margin means "a quarter of the way into the screen", so a sliver showing below the summary does not count.
  new IntersectionObserver((entries, io) => { if (entries.some(e => e.isIntersecting)) { io.disconnect(); boot(); } }, { rootMargin: '0px 0px -25% 0px' }).observe(root);
  root.addEventListener('focusin', boot, { once: true });
}
