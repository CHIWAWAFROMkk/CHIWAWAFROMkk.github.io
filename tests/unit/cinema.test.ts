import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { seeded, galaxy, textFromPixels, terrain, terrainTop, bars, barWeights, RED } from '../../src/scripts/cinema/shapes';
import { cam, CAM, stateFromScroll } from '../../src/scripts/cinema/camera';
import { particleBudget, decideQuality, probeStep, PROBE_START } from '../../src/scripts/cinema/quality';

const R = JSON.parse(readFileSync('src/data/insights.json', 'utf8')).results;
const HEAT = R.heatmap.values;
const NETS = R.merchants.values.map((r: (number | string)[]) => Number(r[3]));
const finite = (a: Float32Array) => a.every(Number.isFinite);

describe('shapes', () => {
  it('are deterministic for a seed and sized n × 3', () => {
    const a = galaxy(5000, seeded(1)), b = galaxy(5000, seeded(1));
    expect(a.pos).toHaveLength(15000);
    expect(a.col).toHaveLength(15000);
    expect(Array.from(a.pos)).toEqual(Array.from(b.pos));
  });

  it('galaxy stays within its radius', () => {
    const { pos } = galaxy(20000, seeded(2));
    expect(finite(pos)).toBe(true);
    for (let i = 0; i < pos.length; i += 3) expect(Math.hypot(pos[i], pos[i + 2])).toBeLessThan(3.8);
  });

  it('text lands every particle on a lit pixel (within jitter) and is mostly red', () => {
    const px = [100, 50, 300, 150];
    const { pos, col } = textFromPixels(px, 400, 200, 3000, seeded(3), 1);
    const xs = [(100 / 400 - .5) * 3.3, (300 / 400 - .5) * 3.3];
    for (let i = 0; i < pos.length; i += 3) expect(Math.min(...xs.map(x => Math.abs(pos[i] - x)))).toBeLessThan(0.03);
    let red = 0;
    for (let i = 0; i < col.length; i += 3) if (Math.abs(col[i] - RED[0]) < 1e-6 && Math.abs(col[i + 1] - RED[1]) < 1e-6) red++;
    expect(red / 3000).toBeGreaterThan(0.85);
  });

  it('text with no pixels gives finite zeros', () => {
    const { pos } = textFromPixels([], 400, 200, 100, seeded(4), 1);
    expect(finite(pos)).toBe(true);
  });

  it('terrain never rises above the busiest cell, and reaches it', () => {
    const max = Math.max(...HEAT.map((r: number[]) => r[2]));
    const { pos } = terrain(40000, HEAT, seeded(5), 1);
    let top = -Infinity;
    for (let i = 1; i < pos.length; i += 3) top = Math.max(top, pos[i]);
    expect(top).toBeLessThanOrEqual(terrainTop(max, max) + 1e-6);
    expect(top).toBeGreaterThan(terrainTop(max, max) - 0.05);
    expect(terrainTop(max / 2, max) - terrainTop(0, max)).toBeCloseTo((terrainTop(max, max) - terrainTop(0, max)) / 2);
  });

  it('bars get particles in proportion to their weights', () => {
    const n = 60000, { pos } = bars(n, NETS, seeded(6), 1), w = barWeights(NETS), tot = w.reduce((a, b) => a + b, 0);
    const centres = NETS.map((_: number, j: number) => (j / 11 - .5) * 2.9);
    const counts = Array(12).fill(0);
    for (let i = 0; i < pos.length; i += 3) {
      let best = 0;
      centres.forEach((c: number, j: number) => { if (Math.abs(pos[i] - c) < Math.abs(pos[i] - centres[best])) best = j; });
      counts[best]++;
    }
    counts.forEach((c, j) => expect(Math.abs(c - n * w[j] / tot)).toBeLessThanOrEqual(12));
  });
});

describe('reduced tier', () => {
  it('the first half of the particles still covers every bar and every weekday', () => {
    const n = 20000, half = n / 2;
    const b = bars(n, NETS, seeded(7), 1).pos, centres = NETS.map((_: number, j: number) => (j / 11 - .5) * 2.9), barsSeen = new Set<number>();
    for (let i = 0; i < half * 3; i += 3) { let best = 0; centres.forEach((c: number, j: number) => { if (Math.abs(b[i] - c) < Math.abs(b[i] - centres[best])) best = j; }); barsSeen.add(best); }
    expect(barsSeen.size).toBe(12);
    const t = terrain(n, HEAT, seeded(8), 1).pos, days = new Set<number>();
    for (let i = 0; i < half * 3; i += 3) days.add(Math.floor((t[i + 2] / 1.1 + .5) * 7));
    expect(days.size).toBe(7);
  });
});

describe('camera', () => {
  it('sits exactly on each keyframe at whole states', () => {
    for (let k = 0; k < 4; k++) {
      const c = cam(k);
      expect(c.yaw).toBeCloseTo(CAM[k].yaw);
      expect(c.pitch).toBeCloseTo(CAM[k].pitch);
      expect(c.dist).toBeCloseTo(CAM[k].dist);
    }
  });
  it('is continuous and dives mid-transition', () => {
    for (let s = 0; s < 3; s += 0.01) expect(Math.abs(cam(s + 0.01).dist - cam(s).dist)).toBeLessThan(0.1);
    expect(cam(1.5).dist).toBeLessThan(Math.min(CAM[1].dist, CAM[2].dist));
  });
  it('maps the scroll through the prologue onto 0–3', () => {
    expect(stateFromScroll(0, 4600, 1000)).toBe(0);
    expect(stateFromScroll(-1800, 4600, 1000)).toBeCloseTo(1.5);
    expect(stateFromScroll(-9999, 4600, 1000)).toBe(3);
    expect(stateFromScroll(500, 4600, 1000)).toBe(0);
  });
});

describe('quality', () => {
  it('budgets particles by screen and pointer', () => {
    expect(particleBudget(1440, false)).toBe(200000);
    expect(particleBudget(390, false)).toBe(50000);
    expect(particleBudget(1440, true)).toBe(50000);
  });
  it('steps down with the measured frame rate', () => {
    expect(decideQuality(60)).toBe('full');
    expect(decideQuality(39)).toBe('reduced');
    expect(decideQuality(19)).toBe('static');
  });
});

describe('frame-rate probe', () => {
  it('ignores gaps (offscreen, background tab) and decides after 90 counted frames', () => {
    let p = PROBE_START, fps: number | null = null;
    for (let i = 0; i < 50; i++) ({ next: p, fps } = probeStep(p, 16.7));
    ({ next: p, fps } = probeStep(p, 5000));
    expect(fps).toBeNull();
    for (let i = 0; i < 40; i++) ({ next: p, fps } = probeStep(p, 16.7));
    expect(fps).toBeCloseTo(59.9, 0);
  });
  it('decides after two counted seconds on a slow device', () => {
    let p = PROBE_START, fps: number | null = null;
    for (let i = 0; i < 90 && fps === null; i++) ({ next: p, fps } = probeStep(p, 33.3));
    expect(fps).toBeCloseTo(30, 0);
    expect(p.frames).toBeLessThan(90);
  });
});
