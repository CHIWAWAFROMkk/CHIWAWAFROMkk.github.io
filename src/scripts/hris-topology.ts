import type { Tier } from './motion/tier';

export type Kind = 'verified' | 'review' | 'missing';
export interface Pt { x: number; y: number }
export interface Target extends Pt { kind: Kind }

/** Share of each group in the illustration (labelled "illustration, not real data" on the page). */
export const SPLIT: Record<Kind, number> = { verified: 0.8, review: 0.15, missing: 0.05 };
const KINDS: Kind[] = ['verified', 'review', 'missing'];
const PAD = 24;

/** Small seeded generator, so the scatter is the same on every visit and in tests. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function nodeCount(tier: Tier): number {
  return tier === 'full' ? 2000 : 600;
}

/** Governed state: three tidy grids side by side (verified, review, missing), widths in proportion to their share. */
export function governedTargets(n: number, w: number, h: number): Target[] {
  const counts = KINDS.map(k => Math.round(n * SPLIT[k]));
  counts[0] = n - counts[1] - counts[2];
  const gap = 18, usableW = w - 2 * PAD - gap * 2, usableH = h - 2 * PAD;
  const out: Target[] = [];
  let left = PAD;
  KINDS.forEach((kind, i) => {
    const bw = Math.max(12, usableW * SPLIT[kind]);
    const cols = Math.max(1, Math.round(Math.sqrt((counts[i] * bw) / usableH)));
    const rows = Math.ceil(counts[i] / cols);
    for (let j = 0; j < counts[i]; j++) {
      const c = j % cols, r = Math.floor(j / cols);
      out.push({ kind, x: left + (cols === 1 ? bw / 2 : (c / (cols - 1)) * bw), y: PAD + (rows === 1 ? usableH / 2 : (r / (rows - 1)) * usableH) });
    }
    left += bw + gap;
  });
  return out;
}

/** Before governance: positions scattered over the frame. */
export function rawTargets(n: number, w: number, h: number, rand: () => number): Pt[] {
  return Array.from({ length: n }, () => ({ x: PAD + rand() * (w - 2 * PAD), y: PAD + rand() * (h - 2 * PAD) }));
}

/** One step of a damped spring (semi-implicit Euler). k stiffness, c damping; c ≈ 2√k is critical. */
export function springStep(p: number, v: number, target: number, dt: number, k = 120, c = 22): [number, number] {
  const nv = v + (k * (target - p) - c * v) * dt;
  return [p + nv * dt, nv];
}

/** Seconds a spring from 0 to 1 needs to stay within tol of its target. */
export function settleTime(k: number, c: number, dt: number, tol = 0.01): number {
  let p = 0, v = 0, t = 0, last = 0;
  while (t < 10) {
    [p, v] = springStep(p, v, 1, dt, k, c);
    t += dt;
    if (Math.abs(p - 1) > tol) last = t;
    if (t - last > 0.5) break;
  }
  return last;
}

/** Pushes (x, y) away from the pointer (mx, my) when within radius, by up to push px. */
export function repel(x: number, y: number, mx: number, my: number, radius = 64, push = 2.2): [number, number] {
  const dx = x - mx, dy = y - my, d = Math.hypot(dx, dy);
  if (d === 0 || d >= radius) return [x, y];
  const f = push * (1 - d / radius) + push * 0.5;
  return [x + (dx / d) * f, y + (dy / d) * f];
}
