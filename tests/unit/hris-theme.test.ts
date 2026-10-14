import { describe, it, expect } from 'vitest';
import { HRIS_COLORS, hrisThemeCss, contrast } from '../../src/data/tokens';

for (const theme of ['light', 'dark'] as const) {
  const c = HRIS_COLORS[theme];
  describe(`HRIS ${theme} palette`, () => {
    it('body text, secondary text and the accent are readable on paper and on cards', () => {
      for (const bg of [c.paper, c.card]) {
        expect(contrast(c.ink, bg)).toBeGreaterThanOrEqual(7);
        expect(contrast(c.mute, bg)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(c.accent, bg)).toBeGreaterThanOrEqual(4.5);
      }
    });
    it('the dim grey works for large light-weight type and hollow marks (≥ 3:1)', () => {
      expect(contrast(c.dim, c.paper)).toBeGreaterThanOrEqual(3);
      expect(contrast(c.dim, c.card)).toBeGreaterThanOrEqual(3);
    });
    it('the filled button carries its own text colour', () => {
      expect(contrast(c.onAccent, c.accentFill)).toBeGreaterThanOrEqual(4.5);
    });
    it('structure lines stay visible (≥ 1.3:1 on paper)', () => {
      expect(contrast(c.line, c.paper)).toBeGreaterThanOrEqual(1.3);
    });
  });
}

it('one hue only: apart from the accent, every colour is a grey', () => {
  const sat = (hex: string) => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return Math.max(r, g, b) - Math.min(r, g, b); };
  for (const theme of ['light', 'dark'] as const) {
    const { accent, accentFill, ...rest } = HRIS_COLORS[theme];
    void accent; void accentFill;
    for (const [k, v] of Object.entries(rest)) expect(sat(v), `${theme}.${k}`).toBeLessThanOrEqual(16);
  }
});

describe('hrisThemeCss', () => {
  it('writes both palettes onto the site variables the shared components read', () => {
    const css = hrisThemeCss();
    for (const v of ['--paper', '--ink', '--mute', '--dim', '--red', '--red-text', '--red-fill', '--on-accent', '--night', '--night-fg', '--night-mute', '--card', '--line', '--font-body', '--font-display', '--font-cjk-bold', '--font-mono']) expect(css, v).toContain(`${v}:`);
    expect(css.indexOf(HRIS_COLORS.dark.paper)).toBeLessThan(css.indexOf("[data-theme='light']"));   // dark is the base
    expect(css).toContain("html[data-track='hris'][data-theme='light']");
  });
});
