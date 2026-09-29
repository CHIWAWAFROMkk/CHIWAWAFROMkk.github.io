import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { storyLayouts, pareto, delivery, heatmap, largestRemainder, interpolate, chapterProgress, frameAt, PLOT, MARKS, type Mark } from '../../src/scripts/morph';

const R = JSON.parse(readFileSync('src/data/insights.json', 'utf8')).results;
const finite = (m: Mark) => [m.x, m.y, m.w, m.h, m.a].every(Number.isFinite);

describe('layouts', () => {
  it('every story layout fills the pool of 168 finite marks', () => {
    const ls = storyLayouts(R);
    expect(ls).toHaveLength(6);
    for (const l of ls) {
      expect(l.marks).toHaveLength(MARKS);
      expect(l.keys).toHaveLength(MARKS);
      expect(l.marks.every(finite)).toBe(true);
    }
  });

  it('empty results still give 168 finite marks', () => {
    const E = { heatmap: { values: [] }, merchants: { values: [] }, retention: { values: [] }, delivery: { values: [] }, reasons: { values: [] } };
    for (const l of storyLayouts(E)) { expect(l.marks).toHaveLength(MARKS); expect(l.marks.every(finite)).toBe(true); }
  });

  it('heatmap: the busiest hour is fully opaque', () => {
    const l = heatmap([[0, 11, 5], [5, 12, 10]]);
    expect(l.marks[5 * 24 + 12].a).toBeCloseTo(1);
    expect(l.marks[0].a).toBeLessThan(0.1);
  });

  it('pareto: the top merchant fills the plot height, the top three are red, bars carry merchant ids', () => {
    const l = pareto(R.merchants.values);
    expect(l.marks.slice(0, 14).reduce((s, m) => s + m.h, 0)).toBeCloseTo(PLOT.h);
    expect(l.marks[0].red).toBe(1);
    expect(l.marks[3 * 14].red).toBe(0);
    expect(l.keys[0]).toBe(R.merchants.values[0][0]);
  });

  it('delivery: bars from 45 minutes are red and carry their dorm area; surplus marks share a real key', () => {
    const l = delivery([['东区', 20, 5], ['北区', 45, 3]]);
    expect(l.marks[0].red).toBe(0);
    expect(l.marks[1].red).toBe(1);
    expect(l.keys.slice(0, 2)).toEqual(['东区', '北区']);
    expect(l.marks[2].a).toBe(0);
    expect(l.keys[2]).toBe('东区');
  });

  it('largestRemainder shares a total in proportion', () => {
    expect(largestRemainder([1, 1, 1], 168)).toEqual([56, 56, 56]);
    expect(largestRemainder([1, 1], 3)).toEqual([2, 1]);
    expect(largestRemainder([0, 0], 168)).toEqual([0, 0]);
    expect(largestRemainder([122, 44, 35, 34], 168).reduce((a, b) => a + b, 0)).toBe(168);
  });
});

describe('motion', () => {
  const a: Mark[] = [{ x: 0, y: 0, w: 10, h: 10, a: 0, red: 0 }];
  const b: Mark[] = [{ x: 100, y: 50, w: 20, h: 30, a: 1, red: 1 }];

  it('interpolate: ends match, midpoint is halfway, colour switches at half', () => {
    expect(interpolate(a, b, 0)).toEqual(a);
    expect(interpolate(a, b, 1)).toEqual(b);
    expect(interpolate(a, b, 0.5)[0]).toEqual({ x: 50, y: 25, w: 15, h: 20, a: 0.5, red: 1 });
    expect(interpolate(a, b, 0.49)[0].red).toBe(0);
  });

  it('chapterProgress holds each chart, then morphs over the last 40% of a chapter', () => {
    const tops = [0, 1000, 2000];
    expect(chapterProgress(tops, -50)).toBe(0);
    expect(chapterProgress(tops, 500)).toBe(0);
    expect(chapterProgress(tops, 800)).toBeCloseTo(0.5);
    expect(chapterProgress(tops, 1000)).toBe(1);
    expect(chapterProgress(tops, 2600)).toBe(2);
    let last = -1;
    for (let line = -100; line <= 2600; line += 10) {
      const p = chapterProgress(tops, line);
      expect(p).toBeGreaterThanOrEqual(last);
      last = p;
    }
  });

  it('frameAt: whole numbers are exact layouts, fractions interpolate', () => {
    expect(frameAt([a, b], 0)).toBe(a);
    expect(frameAt([a, b], 1)).toBe(b);
    expect(frameAt([a, b], 0.5)).toEqual(interpolate(a, b, 0.5));
  });
});
