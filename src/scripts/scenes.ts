/** 1-based scene for the last section heading whose top has passed the reading line; capped at the last scene. */
export function pickScene(headingTops: number[], readingLine: number, scenes: number): number {
  let passed = 0;
  headingTops.forEach((top, i) => { if (top <= readingLine) passed = i + 1; });
  return Math.min(scenes, Math.max(1, passed));
}
