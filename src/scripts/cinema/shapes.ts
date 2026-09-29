import type { Rows } from '../morph';

/** Particle clouds for the insights prologue. Each shape fills exactly n particles: xyz positions and rgb colours. Pure. */
export type Rand = () => number;
export type RGB = [number, number, number];
export interface Cloud { pos: Float32Array; col: Float32Array }

export const RED: RGB = [1.0, 0.24, 0.055];
export const LIGHT: RGB = [0.93, 0.89, 0.84];
export const DIM: RGB = [0.3, 0.09, 0.04];

export function seeded(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const scale = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k];
const mixRGB = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const cloud = (n: number): Cloud => ({ pos: new Float32Array(n * 3), col: new Float32Array(n * 3) });

/** A three-armed spiral galaxy on the xz plane; the core is red, the arms warm white. */
export function galaxy(n: number, rand: Rand): Cloud {
  const c = cloud(n);
  const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;
  for (let i = 0; i < n; i++) {
    const r = 0.12 + Math.pow(rand(), 0.75) * 3.2, arm = (i % 3) * Math.PI * 2 / 3, th = arm + r * 1.35 + gauss() * (0.5 / (r + 0.35));
    c.pos.set([Math.cos(th) * r + gauss() * 0.1, gauss() * 0.14 * (1.4 - r / 3.4), Math.sin(th) * r + gauss() * 0.1], i * 3);
    const core = Math.max(0, 1 - r / 1.4);
    c.col.set(rand() < 0.35 + core * 0.5 ? RED : scale(LIGHT, 0.5 + core * 0.5), i * 3);
  }
  return c;
}

/** Particles on the lit pixels of a rasterised label (flat x,y list on a cw × ch canvas), slightly thick in z. */
export function textFromPixels(px: ArrayLike<number>, cw: number, ch: number, n: number, rand: Rand, sx: number): Cloud {
  const c = cloud(n), count = Math.floor(px.length / 2);
  if (!count) return c;
  for (let i = 0; i < n; i++) {
    const k = Math.floor(rand() * count) * 2;
    c.pos.set([((px[k] + rand() * 2) / cw - 0.5) * 3.3 * sx, -((px[k + 1] + rand() * 2) / ch - 0.5) * 1.16 * sx, (rand() - 0.5) * 0.26], i * 3);
    c.col.set(rand() < 0.92 ? RED : LIGHT, i * 3);
  }
  return c;
}

/** Height of a terrain column for v orders, on the same scale for every column. */
export const terrainTop = (v: number, max: number) => -0.65 + (v / Math.max(1, max)) * 1.25;

/** Rows [dow, hour, orders] → a 24 × 7 field of columns; taller, redder columns for busier hours. */
export function terrain(n: number, heat: Rows, rand: Rand, sx: number): Cloud {
  const c = cloud(n), map = new Map(heat.map(r => [Number(r[0]) * 24 + Number(r[1]), Number(r[2])]));
  const max = Math.max(1, ...map.values());
  const cells: { d: number; h: number; v: number }[] = [];
  for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) cells.push({ d, h, v: map.get(d * 24 + h) ?? 0 });
  const weights = cells.map(x => 0.6 + x.v), tot = weights.reduce((a, b) => a + b, 0);
  let i = 0;
  cells.forEach((cell, j) => {
    const count = j === cells.length - 1 ? n - i : Math.round(n * weights[j] / tot), top = terrainTop(cell.v, max), a = cell.v / max;
    for (let k = 0; k < count && i < n; k++, i++) {
      const f = Math.pow(rand(), 0.55);
      c.pos.set([((cell.h + 0.1 + rand() * 0.8) / 24 - 0.5) * 3.2 * sx, -0.65 + f * (top + 0.65), ((cell.d + 0.1 + rand() * 0.8) / 7 - 0.5) * 1.1], i * 3);
      c.col.set(mixRGB(DIM, RED, Math.min(1, a * 1.4) * (0.55 + 0.45 * f)), i * 3);
    }
  });
  return c;
}

/** Share of particles per bar: proportional to net revenue, with a floor so the smallest bar stays visible. */
export function barWeights(nets: number[]): number[] {
  const max = Math.max(1, ...nets);
  return nets.map(v => 0.05 + v / max);
}

/** Net revenue per merchant (sorted, highest first) → 12 upright bars; the top three red. */
export function bars(n: number, nets: number[], rand: Rand, sx: number): Cloud {
  const c = cloud(n), max = Math.max(1, ...nets), w = barWeights(nets), tot = w.reduce((a, b) => a + b, 0);
  let i = 0;
  nets.forEach((v, j) => {
    const count = j === nets.length - 1 ? n - i : Math.round(n * w[j] / tot), h = 1.35 * v / max, x0 = (j / Math.max(1, nets.length - 1) - 0.5) * 2.9 * sx;
    for (let k = 0; k < count && i < n; k++, i++) {
      c.pos.set([x0 + (rand() - 0.5) * 0.17 * sx, -0.68 + rand() * h, (rand() - 0.5) * 0.17], i * 3);
      c.col.set(j < 3 ? RED : scale(LIGHT, 0.7), i * 3);
    }
  });
  return c;
}
