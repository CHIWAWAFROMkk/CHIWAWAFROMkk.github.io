/**
 * Auto-scroll speed (px per frame) for a pointer at x over a screen spanning [left, left + width):
 * zero in the middle, ramping up inside the outer `zone` fraction on each side, capped at `max`.
 */
export function edgeSpeed(x: number, left: number, width: number, zone = 0.18, max = 14): number {
  const t = (x - left) / width;
  if (t > 1 - zone) return Math.min(max, ((t - (1 - zone)) / zone) * max);
  if (t < zone) return Math.max(-max, -((zone - t) / zone) * max);
  return 0;
}

export function activeIndex(progress: number, count: number): number {
  return Math.min(count - 1, Math.floor(progress * count));
}
