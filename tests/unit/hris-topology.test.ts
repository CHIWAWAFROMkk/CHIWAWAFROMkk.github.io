import { describe, it, expect } from 'vitest';
import { mulberry32, nodeCount, governedTargets, rawTargets, springStep, repel, settleTime, SPLIT } from '../../src/scripts/hris-topology';
import { HRIS_COLORS, contrast } from '../../src/data/tokens';

describe('topology layout', () => {
  const g = governedTargets(2000, 560, 380);
  it('one target per node, all inside the frame', () => {
    expect(g).toHaveLength(2000);
    for (const t of g) { expect(t.x).toBeGreaterThan(0); expect(t.x).toBeLessThan(560); expect(t.y).toBeGreaterThan(0); expect(t.y).toBeLessThan(380); }
  });
  it('three groups in a row, left to right: verified, review, missing', () => {
    const maxX = (k: string) => Math.max(...g.filter(t => t.kind === k).map(t => t.x));
    const minX = (k: string) => Math.min(...g.filter(t => t.kind === k).map(t => t.x));
    expect(maxX('verified')).toBeLessThan(minX('review'));
    expect(maxX('review')).toBeLessThan(minX('missing'));
  });
  it('the group sizes follow the illustration split', () => {
    const n = (k: string) => g.filter(t => t.kind === k).length;
    expect(n('verified') + n('review') + n('missing')).toBe(2000);
    expect(Math.abs(n('review') / 2000 - SPLIT.review)).toBeLessThan(0.01);
  });
  it('raw targets scatter over the frame and are reproducible from the seed', () => {
    const a = rawTargets(50, 560, 380, mulberry32(3)), b = rawTargets(50, 560, 380, mulberry32(3));
    expect(a).toEqual(b);
    expect(new Set(a.map(p => Math.round(p.x / 56))).size).toBeGreaterThan(5);
  });
  it('node counts by tier: full 2000, lite and gentle 600, off draws the still grid', () => {
    expect(nodeCount('full')).toBe(2000);
    expect(nodeCount('lite')).toBe(600);
    expect(nodeCount('gentle')).toBe(600);
    expect(nodeCount('off')).toBe(600);
  });
});

describe('spring', () => {
  it('settles on its target within a second without ringing', () => {
    let p = 0, v = 0, peak = 0;
    for (let i = 0; i < 60; i++) { [p, v] = springStep(p, v, 100, 1 / 60); peak = Math.max(peak, p); }
    expect(Math.abs(p - 100)).toBeLessThan(1);
    expect(peak).toBeLessThan(108);
  });
  it('settleTime reports the same', () => expect(settleTime(120, 22, 1 / 60)).toBeLessThan(1));
});

describe('pointer', () => {
  it('pushes nodes within the radius away from the pointer, leaves others alone', () => {
    const [x] = repel(110, 100, 100, 100);
    expect(x).toBeGreaterThan(110);
    expect(repel(300, 300, 100, 100)).toEqual([300, 300]);
  });
});

describe('colours on the card', () => {
  for (const theme of ['light', 'dark'] as const) {
    it(`${theme}: node colours stand out from the card (≥ 3:1)`, () => {
      const c = HRIS_COLORS[theme];
      for (const col of [c.ink, c.accent, c.dim, c.mute]) expect(contrast(col, c.card)).toBeGreaterThanOrEqual(3);
    });
  }
});
