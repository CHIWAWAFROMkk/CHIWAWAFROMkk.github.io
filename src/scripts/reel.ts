/** 0..1 progress of a pinned section: 0 when its top reaches the viewport top, 1 when its bottom reaches the viewport bottom. */
export function reelProgress(scrollY: number, sectionTop: number, sectionHeight: number, viewport: number): number {
  const run = sectionHeight - viewport;
  if (run <= 0) return 0;
  return Math.min(1, Math.max(0, (scrollY - sectionTop) / run));
}

export function activeIndex(progress: number, count: number): number {
  return Math.min(count - 1, Math.floor(progress * count));
}
