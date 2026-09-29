// Plain JS module, kept byte-for-byte identical to the one in the downloadable source package.
import { parseCSV, analyze, numeric, histogram, csvExport, VERSION, LIMIT } from './analysis-core.mjs';
import { LAB_TEXT } from './lab-text';
import { CSV_ERRORS, localizeError } from './tool-i18n';

type Row = string[];
interface Source { headers: string[]; rows: Row[]; delimiter: ',' | ';' | '\t' }
interface Column { name: string; type: '数值' | '文本'; missing: number; unique: number; invalidNumeric: number; count: number; min: number | null; max: number | null; mean: number | null; median: number | null; sd: number | null; outliers: number }
interface Result { rows: Row[]; columns: Column[]; duplicates: number; removedDuplicates: number; removedMissing: number; missingCells: number }

/** Port of the original lab.mjs; only the strings are language-aware. */
export function initLab(root: HTMLElement): void {
  const lang = root.dataset.lang === 'en' ? 'en' : 'zh';
  const T = LAB_TEXT[lang];
  const $ = <E extends HTMLElement = HTMLElement>(id: string) => root.querySelector<E>(`#${id}`)!;
  const nf = new Intl.NumberFormat(T.numberLocale, { maximumFractionDigits: 4 });
  const fmt = (n: number | null | undefined) => (n === null || n === undefined ? '—' : nf.format(n));
  const pageSize = 15;
  let source: Source | null = null;
  let result: Result | null = null;
  let filename = '';
  let hash = '';
  let page = 0;
  let sortColumn = -1;
  let ascending = true;
  let generation = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  /** Preview rows on screen with the source row each shows, so a toggle can tell which rows are about to go. */
  let onScreen: [HTMLTableRowElement, Row][] = [];
  let removal = 0;
  const shakeTargets = [root.querySelector<HTMLElement>('.lab__import'), root.querySelector<HTMLElement>('.paste-box')];

  const node = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string | number, className?: string) => {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = String(text);
    if (className) el.className = className;
    return el;
  };
  const message = (text: string, error = false) => {
    const m = $('message'); m.textContent = text; m.className = 'notice' + (error ? ' error' : '');
    for (const el of shakeTargets) {
      if (!el) continue;
      el.classList.remove('shake');
      if (error) { void el.offsetWidth; el.classList.add('shake'); }
    }
  };
  const download = (name: string, content: string, type: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = node('a'); a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  async function load(text: string, name: string) {
    const ticket = ++generation;
    try {
      const next: Source = parseCSV(text, $<HTMLSelectElement>('delimiter').value);
      let digest = T.hashUnavailable;
      if (globalThis.crypto?.subtle) digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))).map(x => x.toString(16).padStart(2, '0')).join('');
      if (ticket !== generation) return;
      if (removal) { clearTimeout(removal); removal = 0; }
      source = next; hash = digest; filename = name; page = 0; sortColumn = -1;
      $<HTMLInputElement>('dedupe').checked = false; $<HTMLInputElement>('drop-missing').checked = false; $<HTMLInputElement>('search').value = '';
      $('column').replaceChildren(...source.headers.map((h, i) => { const o = node('option', h); o.value = String(i); return o; }));
      const preferred = source.headers.findIndex(h => /^(close|收盘价|金额|销售额)$/i.test(h));
      const firstNumeric = (analyze(source) as Result).columns.findIndex(c => c.type === '数值');
      $<HTMLSelectElement>('column').value = String(preferred >= 0 ? preferred : Math.max(0, firstNumeric));
      $('results').hidden = false; $('empty').hidden = true;
      $('source-label').textContent = T.sourceLabel(name, source.headers.length, T.delimiters[source.delimiter]);
      message(name === 'sample.csv' ? T.sampleNote : T.fileNote);
      render();
    } catch (e) {
      if (ticket === generation) message(localizeError((e as Error).message, lang, CSV_ERRORS) + (source ? T.kept : ''), true);
    }
  }

  function render() {
    if (!source) return;
    result = analyze(source, { deduplicate: $<HTMLInputElement>('dedupe').checked, dropMissing: $<HTMLInputElement>('drop-missing').checked }) as Result;
    const r = result;
    const before = [...root.querySelectorAll<HTMLElement>('#metrics .metric strong')].map(e => Number(e.dataset.value ?? NaN));
    const values = [r.rows.length, source.headers.length, r.missingCells, r.duplicates];
    $('metrics').replaceChildren(...values.map((v, i) => {
      const el = node('div', undefined, 'metric');
      const strong = node('strong', fmt(v)); strong.dataset.value = String(v);
      el.append(strong, node('span', T.metrics[i]));
      const from = before[i];
      if (!reduced && Number.isFinite(from) && from !== v) {
        const t0 = performance.now();
        const step = (now: number) => {
          if (!strong.isConnected) return;
          const k = Math.min(1, (now - t0) / 400);
          strong.textContent = fmt(k < 1 ? Math.round(from + (v - from) * (1 - (1 - k) ** 3)) : v);
          if (k < 1) requestAnimationFrame(step);
        };
        strong.textContent = fmt(from);
        requestAnimationFrame(step);
      }
      return el;
    }));
    $('audit').textContent = T.audit(source.rows.length, r.removedDuplicates, r.removedMissing, r.rows.length);
    $('quality-body').replaceChildren(...r.columns.map(c => {
      const tr = node('tr');
      [c.name, T.typeLabel[c.type], c.missing, c.unique, c.count, c.invalidNumeric].forEach(v => tr.append(node('td', String(v))));
      return tr;
    }));
    renderStats(); renderTable();
  }

  function renderStats() {
    if (!result) return;
    const index = Number($<HTMLSelectElement>('column').value);
    const c = result.columns[index];
    const values = result.rows.map(r => numeric(r[index])).filter((x: number | null): x is number => x !== null);
    $('stats-title').textContent = T.statsTitle(c.name);
    const stats: [string, number | null][] = [[T.statKeys[0], c.count], [T.statKeys[1], c.mean], [T.statKeys[2], c.median], [T.statKeys[3], c.min], [T.statKeys[4], c.max], [T.statKeys[5], c.sd], [T.statKeys[6], c.outliers]];
    $('stat-list').replaceChildren(...stats.map(([k, v]) => { const div = node('div'); div.append(node('dt', k), node('dd', fmt(v))); return div; }));
    $('numeric-note').textContent = T.numericNote(c.missing, c.invalidNumeric);
    const bins: { low: number; high: number; count: number }[] = histogram(values);
    const max = Math.max(1, ...bins.map(b => b.count));
    $('histogram').replaceChildren(...bins.map((b, i) => {
      const col = node('div', undefined, 'bin'); const bar = node('i'); bar.style.setProperty('--i', String(i));
      bar.style.height = `${(b.count / max) * 130}px`;
      col.title = T.binTitle(fmt(b.low), i === bins.length - 1 ? '≤ x ≤' : '≤ x <', fmt(b.high), b.count);
      col.append(node('span', b.count), bar); return col;
    }));
    $('chart-empty').hidden = values.length > 0; $('range-min').textContent = fmt(c.min); $('range-max').textContent = fmt(c.max);
    $('bins-body').replaceChildren(...bins.map((b, i) => { const tr = node('tr'); tr.append(node('td', `${fmt(b.low)} ≤ x ${i === bins.length - 1 ? '≤' : '<'} ${fmt(b.high)}`), node('td', b.count)); return tr; }));
  }

  function renderTable() {
    if (!result || !source) return;
    const src = source;
    const query = $<HTMLInputElement>('search').value.toLocaleLowerCase();
    const rows = result.rows.filter(r => !query || r.some(x => x.toLocaleLowerCase().includes(query)));
    if (sortColumn >= 0) rows.sort((a, b) => { const x = numeric(a[sortColumn]), y = numeric(b[sortColumn]); return (x !== null && y !== null ? x - y : a[sortColumn].localeCompare(b[sortColumn], T.numberLocale)) * (ascending ? 1 : -1); });
    const maxPage = Math.max(0, Math.ceil(rows.length / pageSize) - 1);
    page = Math.min(page, maxPage);
    const tr = node('tr');
    src.headers.forEach((h, i) => {
      const th = node('th'); const b = node('button', h + (sortColumn === i ? (ascending ? ' ↑' : ' ↓') : ''));
      th.scope = 'col'; th.setAttribute('aria-sort', sortColumn === i ? (ascending ? 'ascending' : 'descending') : 'none');
      b.type = 'button'; b.title = T.sortTitle(h);
      b.onclick = () => { ascending = sortColumn === i ? !ascending : true; sortColumn = i; renderTable(); };
      th.append(b); tr.append(th);
    });
    $('data-head').replaceChildren(tr);
    const shown = rows.slice(page * pageSize, (page + 1) * pageSize);
    onScreen = shown.map(r => {
      const row = node('tr');
      r.forEach(v => { const td = node('td', v.trim() ? v : T.blankCell, v.trim() ? '' : 'missing'); td.title = v; row.append(td); });
      return [row, r] as [HTMLTableRowElement, Row];
    });
    $('data-body').replaceChildren(...onScreen.map(([row]) => row));
    $('table-empty').hidden = rows.length > 0;
    $('page-info').textContent = T.pageInfo(rows.length ? page * pageSize + 1 : 0, Math.min((page + 1) * pageSize, rows.length), rows.length);
    $<HTMLButtonElement>('prev').disabled = page === 0; $<HTMLButtonElement>('next').disabled = page === maxPage;
  }

  $<HTMLInputElement>('file').onchange = async event => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > LIMIT) { message(localizeError('文件超过 2 MB，请先拆分。原有结果未改变。', lang, CSV_ERRORS), true); return; }
    try { const text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer()); await load(text, file.name); }
    catch { message(T.utf8Error, true); }
    input.value = '';
  };
  $('paste-run').onclick = () => load($<HTMLTextAreaElement>('paste').value, T.pasteName);
  $('example').onclick = async () => {
    try { message(T.exampleLoading); const response = await fetch('/assets/sample.csv'); if (!response.ok) throw Error(); await load(await response.text(), 'sample.csv'); }
    catch { message(T.exampleError, true); }
  };
  /** Toggling a cleaning option first shows which preview rows go (struck out or sinking), then renders the new state. */
  const toggle = () => {
    if (!source) return;
    if (removal) { clearTimeout(removal); removal = 0; }
    const next = analyze(source, { deduplicate: $<HTMLInputElement>('dedupe').checked, dropMissing: $<HTMLInputElement>('drop-missing').checked }) as Result;
    const keep = new Set(next.rows);
    const doomed = onScreen.filter(([, r]) => !keep.has(r));
    if (reduced || !doomed.length) { page = 0; render(); return; }
    // A row the de-duplication alone would drop is a duplicate (struck out); anything else goes for its blanks (sinks).
    const deduped = new Set((analyze(source, { deduplicate: $<HTMLInputElement>('dedupe').checked, dropMissing: false }) as Result).rows);
    for (const [tr, r] of doomed) tr.classList.add(deduped.has(r) ? 'sinking' : 'leaving');
    removal = window.setTimeout(() => { removal = 0; page = 0; render(); }, 480);
  };
  ['dedupe', 'drop-missing'].forEach(id => ($<HTMLInputElement>(id).onchange = toggle));
  $<HTMLSelectElement>('column').onchange = renderStats;
  $<HTMLInputElement>('search').oninput = () => { page = 0; renderTable(); };
  $('prev').onclick = () => { page--; renderTable(); };
  $('next').onclick = () => { page++; renderTable(); };
  $('export-csv').onclick = () => { if (result && source) download('analyzed-data.csv', csvExport(source.headers, result.rows), 'text/csv;charset=utf-8'); };
  $('export-json').onclick = () => {
    if (!result || !source) return;
    const report = {
      version: VERSION, filename, inputSha256: hash, delimiter: source.delimiter,
      options: { deduplicate: $<HTMLInputElement>('dedupe').checked, dropMissing: $<HTMLInputElement>('drop-missing').checked },
      selectedColumn: source.headers[Number($<HTMLSelectElement>('column').value)],
      audit: { inputRows: source.rows.length, outputRows: result.rows.length, duplicates: result.duplicates, removedDuplicates: result.removedDuplicates, removedMissing: result.removedMissing },
      columns: result.columns, method: T.jsonMethod,
    };
    download('analysis-report.json', JSON.stringify(report, null, 2), 'application/json');
  };
  $('example').click();
}
