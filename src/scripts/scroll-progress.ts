/** How far an element has travelled through the viewport: 0 when its top reaches `start` (fraction of the viewport height),
 *  1 when its bottom reaches `end`, clamped in between. */
export function scrollProgress(top: number, height: number, viewport: number, start = 0.85, end = 0.5): number {
  const from = viewport * start;
  const to = viewport * end - height;
  return Math.min(1, Math.max(0, (from - top) / Math.max(1, from - to)));
}
