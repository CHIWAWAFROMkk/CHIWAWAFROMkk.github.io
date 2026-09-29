/** Geometry for the insights charts: one pool of 168 rectangles is re-laid out per chart, so any chart can morph into the next. Pure; no DOM. */
export interface Mark { x: number; y: number; w: number; h: number; a: number; red: 0 | 1 }
export type Key = number | string | null;
export interface Layout { marks: Mark[]; keys: Key[] }
export type Rows = (number | string)[][];

export const MARKS = 168;
export const VIEW = { w: 480, h: 320 };
export const PLOT = { x: 48, y: 8, w: 424, h: 276 };
export const AREAS = ['东区', '西区', '南区', '北区'];
const INK_STEPS = [0.85, 0.55, 0.3];
const NO_KEYS = (): Key[] => Array(MARKS).fill(null);

/** Fills the pool: surplus rectangles sit invisibly on real ones (same key), so a morph looks like marks merging. */
function pad(marks: Mark[], keys: Key[]): Layout {
  if (!marks.length) {
    const c: Mark = { x: PLOT.x + PLOT.w / 2, y: PLOT.y + PLOT.h, w: 0, h: 0, a: 0, red: 0 };
    return { marks: Array.from({ length: MARKS }, () => ({ ...c })), keys: NO_KEYS() };
  }
  const out = marks.slice(0, MARKS);
  const k = keys.slice(0, MARKS);
  for (let i = out.length; i < MARKS; i++) {
    out.push({ ...marks[i % marks.length], a: 0 });
    k.push(keys[i % marks.length]);
  }
  return { marks: out, keys: k };
}

/** Rows [dow, hour, orders] → a 7 × 24 grid; opacity follows the count. */
export function heatmap(rows: Rows): Layout {
  const count = new Map(rows.map(r => [`${r[0]}-${r[1]}`, Number(r[2])]));
  const max = Math.max(1, ...count.values());
  const cw = PLOT.w / 24, ch = PLOT.h / 7;
  const marks: Mark[] = [];
  for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) {
    const v = count.get(`${d}-${h}`) ?? 0;
    marks.push({ x: PLOT.x + h * cw + 1, y: PLOT.y + d * ch + 1, w: cw - 2, h: ch - 2, a: v ? 0.12 + 0.88 * (v / max) : 0.04, red: 1 });
  }
  return { marks, keys: NO_KEYS() };
}

/** Rows [merchant_id, merchant, orders, net_cents] sorted by net → 12 bars of 14 stacked segments; the top three red. */
export function pareto(rows: Rows): Layout {
  const max = Math.max(1, ...rows.map(r => Number(r[3])));
  const bw = PLOT.w / 12, seg = 14;
  const marks: Mark[] = [], keys: Key[] = [];
  for (let j = 0; j < 12; j++) {
    const r = rows[j];
    const s = (r ? (PLOT.h * Math.max(0, Number(r[3]))) / max : 0) / seg;
    for (let k = 0; k < seg; k++) {
      marks.push({ x: PLOT.x + j * bw + bw * 0.15, y: PLOT.y + PLOT.h - (k + 1) * s, w: bw * 0.7, h: s, a: 1, red: j < 3 ? 1 : 0 });
      keys.push(r ? Number(r[0]) : null);
    }
  }
  return { marks, keys };
}

/** Rows [cohort, weeks_after, size, students] → a cohort triangle; opacity is the retained share. */
export function retention(rows: Rows): Layout {
  const cw = PLOT.w / 16, ch = PLOT.h / 16;
  const marks: Mark[] = rows.map(([c, k, size, n]) => ({
    x: PLOT.x + Number(k) * cw + 1, y: PLOT.y + (Number(c) - 1) * ch + 1, w: cw - 2, h: ch - 2,
    a: 0.08 + 0.92 * (Number(n) / Math.max(1, Number(size))), red: 1,
  }));
  return pad(marks, marks.map(() => null));
}

/** Rows [area, bin, orders] → one row of bars per dorm area; bins from 45 minutes are red. */
export function delivery(rows: Rows): Layout {
  const rh = PLOT.h / 4, bw = PLOT.w / 13;
  const max = Math.max(1, ...rows.map(r => Number(r[2])));
  const marks: Mark[] = [], keys: Key[] = [];
  for (const [area, bin, n] of rows) {
    const row = AREAS.indexOf(String(area));
    if (row < 0) continue;
    const h = ((rh - 12) * Number(n)) / max;
    marks.push({ x: PLOT.x + (Number(bin) / 5) * bw + bw * 0.15, y: PLOT.y + row * rh + rh - 4 - h, w: bw * 0.7, h, a: 1, red: Number(bin) >= 45 ? 1 : 0 });
    keys.push(String(area));
  }
  return pad(marks, keys);
}

/** Largest-remainder rounding: integer shares of `total` in proportion to `counts`; ties go to the earlier item. */
export function largestRemainder(counts: number[], total: number): number[] {
  const sum = counts.reduce((a, b) => a + b, 0);
  if (!sum) return counts.map(() => 0);
  const raw = counts.map(c => (c / sum) * total);
  const out = raw.map(Math.floor);
  let left = total - out.reduce((a, b) => a + b, 0);
  raw.map((r, i) => [r - Math.floor(r), i] as const)
    .sort((a, b) => b[0] - a[0] || a[1] - b[1])
    .forEach(([, i]) => { if (left > 0) { out[i]++; left--; } });
  return out;
}

/** Rows [reason, refunds] → a 12 × 14 waffle; the top reason red, the rest in ink steps. */
export function waffle(rows: Rows): Layout {
  const shares = largestRemainder(rows.map(r => Number(r[1])), MARKS);
  const cell = PLOT.h / 14;
  const marks: Mark[] = [];
  let i = 0;
  shares.forEach((n, r) => {
    for (let j = 0; j < n; j++, i++) {
      marks.push({ x: PLOT.x + (i % 12) * cell + 1, y: PLOT.y + Math.floor(i / 12) * cell + 1, w: cell - 2, h: cell - 2, a: r === 0 ? 1 : INK_STEPS[Math.min(r - 1, 2)], red: r === 0 ? 1 : 0 });
    }
  });
  return pad(marks, marks.map(() => null));
}

/** Three blocks of 56 squares, one per suggestion. */
export function blocks(): Layout {
  const bw = PLOT.w / 3, cell = Math.min((bw - 24) / 7, PLOT.h / 8);
  const marks: Mark[] = [];
  for (let b = 0; b < 3; b++) for (let i = 0; i < 56; i++) {
    marks.push({ x: PLOT.x + b * bw + (i % 7) * cell + 1, y: PLOT.y + Math.floor(i / 7) * cell + 1, w: cell - 2, h: cell - 2, a: 0.9, red: 1 });
  }
  return { marks, keys: NO_KEYS() };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function interpolate(a: Mark[], b: Mark[], t: number): Mark[] {
  return a.map((m, i) => {
    const n = b[i];
    return { x: lerp(m.x, n.x, t), y: lerp(m.y, n.y, t), w: lerp(m.w, n.w, t), h: lerp(m.h, n.h, t), a: lerp(m.a, n.a, t), red: t < 0.5 ? m.red : n.red };
  });
}

/** Chapter tops (px, viewport-relative) and a reading line → story position p in [0, n-1].
 *  Each chart holds for the first 60% of its chapter, then morphs into the next over the last 40%. */
export function chapterProgress(tops: number[], line: number): number {
  if (!tops.length) return 0;
  let i = 0;
  tops.forEach((top, j) => { if (top <= line) i = j; });
  if (i === tops.length - 1) return i;
  const frac = (line - tops[i]) / Math.max(1, tops[i + 1] - tops[i]);
  const t = Math.min(1, Math.max(0, (frac - 0.6) / 0.4));
  return i + t * t * (3 - 2 * t);
}

export function frameAt(layouts: Mark[][], p: number): Mark[] {
  const i = Math.min(layouts.length - 1, Math.max(0, Math.floor(p)));
  const t = p - i;
  return t > 0 && i + 1 < layouts.length ? interpolate(layouts[i], layouts[i + 1], t) : layouts[i];
}

type StoryResults = Record<'heatmap' | 'merchants' | 'retention' | 'delivery' | 'reasons', { values: Rows }>;

/** The six story charts, in chapter order. */
export function storyLayouts(r: StoryResults): Layout[] {
  return [heatmap(r.heatmap.values), pareto(r.merchants.values), retention(r.retention.values), delivery(r.delivery.values), waffle(r.reasons.values), blocks()];
}
