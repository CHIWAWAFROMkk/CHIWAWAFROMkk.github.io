import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { liveBytes, liveMB, formatSize, MAX_LIVE_BYTES, type LiveId } from '../../src/data/live-size';

const manifestBytes = (p: string) => (JSON.parse(readFileSync(p, 'utf8')) as { files: { bytes: number }[] }).files.reduce((s, f) => s + f.bytes, 0);

describe('live edition sizes are read from the shipped files', () => {
  it('career = what the page loads: the Pyodide manifest without its source map and licence texts, plus the job agent', () => {
    const py = (JSON.parse(readFileSync('public/assets/vendor/pyodide/0.29.5/manifest.json', 'utf8')) as { files: { name: string; bytes: number }[] }).files;
    const loaded = py.filter(f => !/\.map$|^LICENSE/.test(f.name)).reduce((s, f) => s + f.bytes, 0);
    expect(loaded).toBeLessThan(manifestBytes('public/assets/vendor/pyodide/0.29.5/manifest.json'));
    expect(liveBytes('career')).toBe(loaded + manifestBytes('public/assets/py/job-agent/4397ded/manifest.json'));
  });

  it('insights = sql.js + the term database + its worker', () => {
    const files = ['public/assets/vendor/sql-wasm.js', 'public/assets/vendor/sql-wasm.wasm', 'public/assets/insights/campus-term.sqlite', 'public/assets/insights-worker.js'];
    expect(liveBytes('insights')).toBe(files.reduce((s, f) => s + statSync(f).size, 0));
  });

  it("quota = the vendored HUD at 175d31c plus the portfolio's host files", () => {
    const dir = (d: string): number => readdirSync(d, { withFileTypes: true }).reduce((s, e) => s + (e.isDirectory() ? dir(`${d}/${e.name}`) : statSync(`${d}/${e.name}`).size), 0);
    const host = ['hud-host.html', 'hud-host.js', 'hud-host-off.css', 'hud-host-gentle.css'].map(f => statSync(`public/assets/quotadeck/${f}`).size).reduce((a, b) => a + b, 0);
    expect(liveBytes('quota')).toBe(dir('public/assets/quotadeck/175d31c') + host);
  });

  it('every size is positive and fits the bar scale', () => {
    for (const id of ['career', 'campus', 'quota', 'insights'] as LiveId[]) {
      expect(liveBytes(id), id).toBeGreaterThan(0);
      expect(liveBytes(id), id).toBeLessThanOrEqual(MAX_LIVE_BYTES);
    }
  });

  it('formats one decimal in megabytes, in both languages', () => {
    expect(formatSize(15_000_000, 'zh')).toBe('首次加载约 14.3 MB');
    expect(formatSize(15_000_000, 'en')).toBe('about 14.3 MB on first load');
    expect(liveMB('career')).toBe((liveBytes('career') / 1048576).toFixed(1));
  });
});
