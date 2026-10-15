import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { CAMPUS_RUNTIME, CORE_FILES } from '../scripts/campus-flow';
import { QD_DIR } from '../scripts/qd-load';
import type { Lang } from '../i18n';

/** Live editions whose first-load size is shown on the project cards. Read at build time from public/. */
export type LiveId = 'career' | 'campus' | 'quota' | 'insights';

/** Full width of a card's size bar: a little above the largest runtime. */
export const MAX_LIVE_BYTES = 16 * 1048576;

const PYODIDE = 'public/assets/vendor/pyodide/0.29.5/manifest.json';
type Entry = { name: string; bytes: number };
const manifest = (p: string): Entry[] => (JSON.parse(readFileSync(p, 'utf8')) as { files: Entry[] }).files;
const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);
const fileBytes = (p: string) => statSync(p).size;
const dirBytes = (d: string): number =>
  sum(readdirSync(d, { withFileTypes: true }).map(e => (e.isDirectory() ? dirBytes(join(d, e.name)) : fileBytes(join(d, e.name)))));

export function liveBytes(id: LiveId): number {
  switch (id) {
    case 'career':
      // The manifest also lists the source map and licence texts, which ship with the runtime but are never fetched.
      return sum(manifest(PYODIDE).filter(f => !/\.map$|^LICENSE/.test(f.name)).map(f => f.bytes)) + sum(manifest('public/assets/py/job-agent/4397ded/manifest.json').map(f => f.bytes));
    case 'campus':
      return sum(manifest(PYODIDE).filter(f => CORE_FILES.includes(f.name)).map(f => f.bytes)) + sum(CAMPUS_RUNTIME.files.map(u => fileBytes(`public${u}`)));
    case 'quota':
      return dirBytes(`public${QD_DIR}`) + fileBytes('public/assets/quotadeck/host.html') + fileBytes('public/assets/quotadeck/host.js');
    case 'insights':
      return sum(['public/assets/vendor/sql-wasm.js', 'public/assets/vendor/sql-wasm.wasm', 'public/assets/insights/campus-term.sqlite', 'public/assets/insights-worker.js'].map(fileBytes));
  }
}

export function liveMB(id: LiveId): string {
  return (liveBytes(id) / 1048576).toFixed(1);
}

export function formatSize(bytes: number, lang: Lang): string {
  const mb = (bytes / 1048576).toFixed(1);
  return lang === 'zh' ? `首次加载约 ${mb} MB` : `about ${mb} MB on first load`;
}
