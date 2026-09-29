/** Opening rain: dots fall, then converge onto the pixels of the big number. Pure; no DOM. */
export const FALL = 520;
export const DURATION = 1200;
export interface Dot { sx: number; sy: number; tx: number; ty: number; drop: number }

/** Every other pixel of an RGBA buffer whose alpha passes 128, thinned evenly to `count` points. */
export function sampleTargets(rgba: Uint8ClampedArray, w: number, h: number, count: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (rgba[(y * w + x) * 4 + 3] > 128) pts.push([x, y]);
  if (!pts.length) return [];
  return Array.from({ length: count }, (_, i) => pts[Math.floor((i * pts.length) / count)]);
}

function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeDots(targets: [number, number][], w: number, h: number, seed = 7): Dot[] {
  const r = seeded(seed);
  return targets.map(([tx, ty]) => ({ sx: r() * w, sy: -r() * h * 0.6, tx, ty, drop: h * (0.25 + r() * 0.35) }));
}

/** Position at t ms: an accelerating fall, then an ease-out onto the target. */
export function dotAt(d: Dot, t: number): [number, number] {
  if (t <= 0) return [d.sx, d.sy];
  if (t < FALL) { const k = t / FALL; return [d.sx, d.sy + d.drop * k * k]; }
  if (t >= DURATION) return [d.tx, d.ty];
  const fx = d.sx, fy = d.sy + d.drop;
  const e = 1 - (1 - (t - FALL) / (DURATION - FALL)) ** 3;
  return [fx + (d.tx - fx) * e, fy + (d.ty - fy) * e];
}
