import { describe, it, expect } from 'vitest';
import { readFileSync, statSync, readdirSync } from 'node:fs';

const css = readFileSync('public/assets/fonts.css', 'utf8');
const files = [...css.matchAll(/url\(fonts\/([^)]+)\)/g)].map(m => m[1]);

describe('site fonts', () => {
  it('fonts.css points only at files that exist, all WOFF2', () => {
    expect(files.length).toBe(4);
    for (const f of files) {
      expect(f).toMatch(/\.woff2$/);
      expect(statSync(`public/assets/fonts/${f}`).size).toBeGreaterThan(10_000);
    }
  });

  it('a Chinese page downloads at most about half a megabyte of Noto Sans SC (both weights, Latin and CJK)', () => {
    const total = files.reduce((n, f) => n + statSync(`public/assets/fonts/${f}`).size, 0);
    expect(total).toBeLessThan(600_000);
  });

  it('no leftover slices from the old 36-file split', () => {
    expect(readdirSync('public/assets/fonts').filter(f => /^noto-sans-sc-\d+-\d+\.woff2$/.test(f))).toEqual([]);
  });

  it('every Chinese character written in the page copy is inside the subset', () => {
    const covered = new Set(readFileSync('tools/font-subset-chars.txt', 'utf8'));
    const sources = ['src/data/site.ts', 'src/data/facts.ts', 'src/data/jung.ts', 'src/data/jung-handbook.ts', 'src/data/jung-prologue.ts',
      ...readdirSync('src/copy/projects').map(f => `src/copy/projects/${f}`), 'src/copy/privacy.zh.md'];
    const missing = new Set<string>();
    for (const f of sources) for (const ch of readFileSync(f, 'utf8')) if (/[\u4e00-\u9fff]/.test(ch) && !covered.has(ch)) missing.add(ch);
    expect([...missing].join('')).toBe('');
  });

  it('Barlow is served as WOFF2 and the licences ship with the fonts', () => {
    expect(readFileSync('src/styles/base.css', 'utf8')).toContain('BarlowCondensed-Bold.woff2');
    expect(statSync('public/assets/fonts/NotoSansSC-OFL.txt').size).toBeGreaterThan(1000);
    expect(statSync('public/assets/fonts/BarlowCondensed-LICENSE.txt').size).toBeGreaterThan(1000);
  });
});
