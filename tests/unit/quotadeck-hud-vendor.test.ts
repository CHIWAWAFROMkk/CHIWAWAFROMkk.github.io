import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { posix } from 'node:path';

const COMMIT = '175d31c2c8f579eebbf8f1928025e877d108904f';
const DIR = 'public/assets/quotadeck/175d31c';
const R = 'src/renderer/';
const FILES = [
  ...['hud.html', 'chart.css', 'hud.css', 'hud-metrics.js', 'hud-dom.js', 'hud-bots.js', 'hud-strip.js', 'hud-notch-metrics.js', 'hud-notch.js', 'hud-chart.js', 'hud-card.js', 'hud-settings.js', 'hud.js'].map(f => R + f),
  ...['hud-view.cjs', 'session-tracker.cjs', 'hud-geometry.cjs', 'model-names.cjs'].map(f => `src/main/${f}`),
  'assets/fonts/inter-latin-wght-normal.woff2', 'assets/fonts/LICENSE-inter.txt',
  ...['codex', 'claude', 'antigravity', 'workbuddy', 'deepseek'].map(id => `assets/logos/${id}.svg`), 'assets/logos/LICENSE-lobe-icons.txt',
  'LICENSE',
];
type Entry = { path: string; bytes: number; sha256: string };
const manifest = () => JSON.parse(readFileSync(`${DIR}/manifest.json`, 'utf8')) as { repository: string; commit: string; version: string; files: Entry[] };
const fixture = () => JSON.parse(readFileSync('src/data/qd-hud-fixture.json', 'utf8'));
const text = (p: string) => readFileSync(`${DIR}/${p}`, 'utf8');

describe('vendored QuotaDeck HUD (175d31c, 0.7.0)', () => {
  it('is pinned to the public 0.7.0 commit', () => {
    expect(manifest()).toMatchObject({ repository: 'https://github.com/CHIWAWAFROMkk/quota-deck', commit: COMMIT, version: '0.7.0' });
  });
  it('carries exactly the HUD, its four pure modules, fonts, logos and licences', () => {
    expect(manifest().files.map(f => f.path)).toEqual(FILES);
  });
  it('every file matches its SHA-256 and size', () => {
    for (const f of manifest().files) {
      const bytes = readFileSync(`${DIR}/${f.path}`);
      expect(createHash('sha256').update(bytes).digest('hex'), f.path).toBe(f.sha256);
      expect(bytes.length, f.path).toBe(f.bytes);
    }
  });
  it('the renderer loads only files that are vendored', () => {
    const vendored = new Set(manifest().files.map(f => f.path));
    const html = text(`${R}hud.html`);
    const refs = [...html.matchAll(/<(?:script|link)[^>]+(?:src|href)="([^"]+)"/g)].map(m => posix.join('src/renderer', m[1]));
    const css = [...text(`${R}hud.css`).matchAll(/url\(['"]?([^'")]+)['"]?\)/g)].map(m => posix.join('src/renderer', m[1]));
    const logos = ['codex', 'claude', 'antigravity', 'workbuddy', 'deepseek'].map(id => posix.join('src/renderer', `../../assets/logos/${id}.svg`));
    expect(text(`${R}hud-dom.js`)).toContain('../../assets/logos/');
    for (const p of [...refs, ...css, ...logos]) expect(vendored.has(p), p).toBe(true);
  });
  it('the iframe host resolves the HUD from the vendored folder', () => {
    expect(readFileSync('public/assets/quotadeck/hud-host.html', 'utf8')).toContain(`<base href="${COMMIT.slice(0, 7)}/src/renderer/">`);
  });
  it('the fixture comes from the same commit and has four keyframes', () => {
    const f = fixture();
    expect(f.commit).toBe(COMMIT);
    expect(f.keyframes.map((k: { at: number }) => k.at)).toEqual([0, 20000, 45000, 70000]);
    for (const k of f.keyframes) expect(k.ui.providers.map((p: { id: string }) => p.id)).toEqual(['codex', 'claude', 'antigravity', 'workbuddy', 'deepseek']);
    expect(f.tokens.claude.buckets).toHaveLength(96);
  });
  it('no fixture string carries a personal path or markup', () => {
    const s = JSON.stringify(fixture());
    expect(s).not.toMatch(/yoshi/i);
    expect(s).not.toContain('<');
  });
});
