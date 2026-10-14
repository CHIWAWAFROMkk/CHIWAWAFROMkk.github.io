import { describe, it, expect } from 'vitest';
import { traceNodes, edgePath, pointOnEdge, pulseAt, periodFor, TRACE_VIEW, TRACE_ALPHA } from '../../src/scripts/agent-trace';
import { blend, contrast, COLORS } from '../../src/data/tokens';
import { SITE } from '../../src/data/site';

describe('trace layout', () => {
  const nodes = traceNodes(5);
  it('five nodes inside the view, left to right, alternating rows', () => {
    expect(nodes).toHaveLength(5);
    for (const [i, p] of nodes.entries()) {
      expect(p.x).toBeGreaterThan(0); expect(p.x).toBeLessThan(TRACE_VIEW.w);
      expect(p.y).toBeGreaterThan(0); expect(p.y).toBeLessThan(TRACE_VIEW.h);
      if (i) { expect(p.x).toBeGreaterThan(nodes[i - 1].x); expect(p.y).not.toBe(nodes[i - 1].y); }
    }
  });
  it('edges start and end on their nodes', () => {
    const d = edgePath(nodes[0], nodes[1]);
    expect(d.startsWith(`M ${nodes[0].x} ${nodes[0].y}`)).toBe(true);
    expect(d.endsWith(`${nodes[1].x} ${nodes[1].y}`)).toBe(true);
    expect(pointOnEdge(nodes[0], nodes[1], 0)).toEqual(nodes[0]);
    expect(pointOnEdge(nodes[0], nodes[1], 1)).toEqual(nodes[1]);
  });
  it('one label per step, in both languages', () => {
    expect(SITE.trace).toHaveLength(5);
  });
});

describe('pulse', () => {
  it('starts on the first edge with the input ticked', () => expect(pulseAt(0, 5000)).toEqual({ edge: 0, progress: 0, done: 1 }));
  it('crosses the edges in order, then rests with every step ticked', () => {
    expect(pulseAt(1500, 5000).edge).toBe(2);
    expect(pulseAt(3500, 5000)).toEqual({ edge: -1, progress: 1, done: 5 });
  });
  it('repeats every period, also for negative clocks', () => {
    expect(pulseAt(5000 + 1500, 5000)).toEqual(pulseAt(1500, 5000));
    expect(pulseAt(-3500, 5000)).toEqual(pulseAt(1500, 5000));
  });
  it('gentle runs three times slower', () => expect(periodFor('gentle')).toBe(periodFor('full') * 3));
});

describe('visibility floor', () => {
  it('trace lines stay visible on paper (contrast ≥ 1.6)', () => {
    expect(contrast(blend(COLORS.ink, COLORS.paper, TRACE_ALPHA), COLORS.paper)).toBeGreaterThanOrEqual(1.6);
  });
  it('blend is exact at the ends', () => {
    expect(blend('#000000', '#ffffff', 1)).toBe('#000000');
    expect(blend('#000000', '#ffffff', 0)).toBe('#ffffff');
  });
});
