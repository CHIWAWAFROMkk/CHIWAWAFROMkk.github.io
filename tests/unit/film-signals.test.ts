import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const S = JSON.parse(readFileSync('public/media/mais-je-taime/film-signals.json', 'utf8')) as { fps: number; colors: string[]; peaks: number[] };
const rgb = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

describe('film signals', () => {
  it('has one colour and one peak per tenth of a second of the 60-second film', () => {
    expect(S.fps).toBe(10);
    expect(S.colors).toHaveLength(600);
    expect(S.peaks).toHaveLength(600);
  });

  it('colours are #rrggbb and peaks are normalised to 0…1', () => {
    for (const c of S.colors) expect(c).toMatch(/^#[0-9a-f]{6}$/);
    for (const p of S.peaks) { expect(p).toBeGreaterThanOrEqual(0); expect(p).toBeLessThanOrEqual(1); }
    expect(Math.max(...S.peaks)).toBe(1);
  });

  it('the desaturated flashback (S07–S13, 23.0–39.5 s) reads as grey', () => {
    const grey = S.colors.slice(230, 395).filter(c => { const [r, g, b] = rgb(c); return Math.max(r, g, b) - Math.min(r, g, b) <= 12; });
    expect(grey.length / 165).toBeGreaterThanOrEqual(0.9);
  });

  it('the dock in the present (S01, 3–6 s) is bluer than it is red', () => {
    const blue = S.colors.slice(30, 60).filter(c => { const [r, , b] = rgb(c); return b > r; });
    expect(blue.length).toBeGreaterThanOrEqual(20);
  });
});
